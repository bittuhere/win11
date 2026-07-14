#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import urllib.error
import subprocess
import shutil
import platform
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

PORT = 8000
WORKSPACE_DIR = os.path.abspath(os.path.dirname(__file__))

class Windows11BackendHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404, "Not Found")

    def handle_api_get(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        endpoint = parsed.path

        if endpoint == '/api/sysinfo':
            self.get_sysinfo()
        elif endpoint == '/api/files':
            self.get_files(params)
        elif endpoint == '/api/proxy':
            self.get_proxy(params)
        else:
            self.send_json({"error": "Unknown endpoint"}, 404)

    def handle_api_post(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        endpoint = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        try:
            body = json.loads(body_data)
        except Exception:
            body = {}

        if endpoint == '/api/cmd':
            self.post_cmd(body)
        elif endpoint == '/api/files':
            self.post_files(params, body)
        else:
            self.send_json({"error": "Unknown endpoint"}, 404)

    def send_json(self, data, status=200):
        try:
            response_bytes = json.dumps(data, indent=2).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            print(f"Error sending JSON: {e}", file=sys.stderr)

    def get_sysinfo(self):
        info = {
            "os": platform.system(),
            "os_release": platform.release(),
            "os_version": platform.version(),
            "architecture": platform.machine(),
            "cpu": "Unknown Processor",
            "ram": "Unknown Memory",
            "hostname": platform.node()
        }

        if platform.system() == "Linux":
            try:
                with open("/proc/cpuinfo", "r") as f:
                    for line in f:
                        if "model name" in line:
                            info["cpu"] = line.split(":", 1)[1].strip()
                            break
            except Exception:
                pass
            try:
                with open("/proc/meminfo", "r") as f:
                    for line in f:
                        if "MemTotal" in line:
                            total_kb = int(line.split(":", 1)[1].split()[0])
                            info["ram"] = f"{round(total_kb / 1024 / 1024, 2)} GB"
                            break
            except Exception:
                pass
        else:
            info["cpu"] = platform.processor() or "Generic CPU"

        self.send_json(info)

    def safe_resolve_path(self, req_path):
        if not req_path:
            return WORKSPACE_DIR

        req_path = req_path.lstrip('/')
        resolved = os.path.abspath(os.path.join(WORKSPACE_DIR, req_path))

        if resolved.startswith(WORKSPACE_DIR):
            return resolved
        return WORKSPACE_DIR

    def get_files(self, params):
        action = params.get('action', ['list'])[0]
        req_path = params.get('path', [''])[0]
        resolved = self.safe_resolve_path(req_path)

        if action == 'list':
            if not os.path.exists(resolved):
                self.send_json({"error": "Path not found"}, 404)
                return

            if os.path.isdir(resolved):
                try:
                    entries = []
                    for entry in os.scandir(resolved):
                        if entry.name.startswith('.'):
                            continue
                        rel_path = os.path.relpath(entry.path, WORKSPACE_DIR)
                        entries.append({
                            "name": entry.name,
                            "path": rel_path,
                            "is_dir": entry.is_dir(),
                            "size": entry.stat().st_size if entry.is_file() else 0
                        })
                    self.send_json({"files": sorted(entries, key=lambda x: (not x['is_dir'], x['name'].lower()))})
                except Exception as e:
                    self.send_json({"error": str(e)}, 500)
            else:
                self.send_json({"error": "Not a directory"}, 400)

        elif action == 'read':
            if not os.path.exists(resolved) or os.path.isdir(resolved):
                self.send_json({"error": "File not found"}, 404)
                return

            try:
                ext = os.path.splitext(resolved)[1].lower()
                is_binary = ext in ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.mp3', '.mp4', '.pdf']

                if is_binary:
                    import base64
                    with open(resolved, 'rb') as f:
                        encoded = base64.b64encode(f.read()).decode('utf-8')
                    mime = "application/octet-stream"
                    if ext in ['.jpg', '.jpeg']: mime = "image/jpeg"
                    elif ext == '.png': mime = "image/png"
                    elif ext == '.ico': mime = "image/x-icon"
                    self.send_json({"content": f"data:{mime};base64,{encoded}", "binary": True})
                else:
                    with open(resolved, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                    self.send_json({"content": content, "binary": False})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "Invalid action"}, 400)

    def post_files(self, params, body):
        action = params.get('action', [''])[0]
        req_path = body.get('path', '')
        resolved = self.safe_resolve_path(req_path)

        if action == 'write':
            content = body.get('content', '')
            try:
                os.makedirs(os.path.dirname(resolved), exist_ok=True)
                with open(resolved, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.send_json({"success": True, "path": os.path.relpath(resolved, WORKSPACE_DIR)})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif action == 'delete':
            if resolved == WORKSPACE_DIR:
                self.send_json({"error": "Cannot delete workspace root"}, 400)
                return
            if not os.path.exists(resolved):
                self.send_json({"error": "Path not found"}, 404)
                return
            try:
                if os.path.isdir(resolved):
                    shutil.rmtree(resolved)
                else:
                    os.remove(resolved)
                self.send_json({"success": True})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif action == 'mkdir':
            try:
                os.makedirs(resolved, exist_ok=True)
                self.send_json({"success": True, "path": os.path.relpath(resolved, WORKSPACE_DIR)})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        elif action == 'rename':
            new_path = body.get('new_path', '')
            resolved_new = self.safe_resolve_path(new_path)
            if resolved == WORKSPACE_DIR or resolved_new == WORKSPACE_DIR:
                self.send_json({"error": "Invalid path rename"}, 400)
                return
            if not os.path.exists(resolved):
                self.send_json({"error": "Source path not found"}, 404)
                return
            try:
                os.makedirs(os.path.dirname(resolved_new), exist_ok=True)
                os.rename(resolved, resolved_new)
                self.send_json({"success": True})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "Invalid post action"}, 400)

    def post_cmd(self, body):
        cmd = body.get('cmd', '').strip()
        if not cmd:
            self.send_json({"error": "Empty command"}, 400)
            return

        try:
            result = subprocess.run(cmd, shell=True, text=True, capture_output=True, cwd=WORKSPACE_DIR, timeout=15)
            self.send_json({
                "stdout": result.stdout,
                "stderr": result.stderr,
                "code": result.returncode
            })
        except subprocess.TimeoutExpired:
            self.send_json({
                "stdout": "",
                "stderr": "Command execution timed out (limit: 15s)",
                "code": 124
            })
        except Exception as e:
            self.send_json({
                "stdout": "",
                "stderr": f"Error: {str(e)}",
                "code": -1
            })

    def get_proxy(self, params):
        target_url = params.get('url', [''])[0]
        if not target_url:
            self.send_json({"error": "Missing url parameter"}, 400)
            return

        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url

        try:
            req = urllib.request.Request(
                target_url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                content_type = response.headers.get('Content-Type', '')
                data = response.read()

                if 'text/html' in content_type or 'text/plain' in content_type:
                    html_content = data.decode('utf-8', errors='replace')
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(len(html_content.encode('utf-8'))))
                    self.end_headers()
                    self.wfile.write(html_content.encode('utf-8'))
                else:
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
        except urllib.error.URLError as e:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            fallback_html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #202020; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }}
                    .card {{ background: #2d2d2d; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); max-width: 500px; }}
                    h1 {{ font-size: 24px; margin-bottom: 16px; color: #ff5f56; }}
                    p {{ font-size: 14px; color: #ccc; line-height: 1.6; }}
                    .btn {{ display: inline-block; background: #0078d4; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: 500; font-size: 13px; }}
                    .btn:hover {{ background: #1a86d9; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>🌐 Hmmm, can't reach this page</h1>
                    <p>We had trouble reaching <b>{target_url}</b>.</p>
                    <p>Details: {str(e.reason if hasattr(e, 'reason') else e)}</p>
                    <p>Check your internet connection, verify the spelling, or try searching for something else in the Edge address bar!</p>
                    <a href="#" class="btn" onclick="window.location.reload();">Refresh Page</a>
                </div>
            </body>
            </html>
            """
            self.send_header('Content-Length', str(len(fallback_html.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(fallback_html.encode('utf-8'))
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

def run_server():
    ThreadingTCPServer.allow_reuse_address = True
    server_address = ('', PORT)
    with ThreadingTCPServer(server_address, Windows11BackendHandler) as httpd:
        print(f"Windows 11 Local Backend Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to terminate the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()
