import time
import os
import subprocess
from playwright.sync_api import sync_playwright

def main():
    print("Starting server...")
    server_process = subprocess.Popen(["python3", "server.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(3) # wait for boot

    try:
        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            print("Navigating to http://localhost:8000/")
            page.goto("http://localhost:8000/")

            print("Waiting for boot-screen to clear...")
            time.sleep(4)

            print("Clicking lock-screen...")
            page.click("#lock-screen")
            time.sleep(1) # wait for transition

            print("Clicking login-btn...")
            page.click("#login-btn")

            print("Waiting for desktop to load...")
            time.sleep(6)

            print("Opening Start Menu...")
            page.click("#tb-start")
            time.sleep(1) # wait for transition

            screenshot_path = "images/verification.png"
            print(f"Taking screenshot to {screenshot_path}")
            page.screenshot(path=screenshot_path)

            print("Verification successful!")
    finally:
        print("Stopping server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
