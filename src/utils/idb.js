/**
 * WebOS IndexedDB — the internal storage of this Windows.
 * All user data, files, apps, notes, settings snapshots live here.
 */

const DB_NAME = "WebOS";
const DB_VERSION = 2;

const STORE_DEFS = {
  kv: { keyPath: "key" },
  files: { keyPath: "path" },
  notes: { keyPath: "id" },
  todos: { keyPath: "id" },
  events: { keyPath: "id" },
  mail: { keyPath: "id" },
  contacts: { keyPath: "id" },
  photos: { keyPath: "id" },
  installed: { keyPath: "icon" },
  history: { keyPath: "id" },
  alarms: { keyPath: "id" },
  recordings: { keyPath: "id" },
  notepad: { keyPath: "id" },
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.keys(STORE_DEFS).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, STORE_DEFS[name]);
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

async function store(name, mode = "readonly") {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export const idb = {
  async get(key) {
    const s = await store("kv");
    return new Promise((resolve, reject) => {
      const r = s.get(key);
      r.onsuccess = () => resolve(r.result ? r.result.value : undefined);
      r.onerror = () => reject(r.error);
    });
  },

  async set(key, value) {
    const db = await openDB();
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put({ key, value });
    await txDone(tx);
    return value;
  },

  async del(key) {
    const db = await openDB();
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").delete(key);
    await txDone(tx);
  },

  async put(storeName, record) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(record);
    await txDone(tx);
    return record;
  },

  async getFrom(storeName, key) {
    const s = await store(storeName);
    return new Promise((resolve, reject) => {
      const r = s.get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },

  async getAll(storeName) {
    const s = await store(storeName);
    return new Promise((resolve, reject) => {
      const r = s.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  },

  async deleteFrom(storeName, key) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
  },

  async clear(storeName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    await txDone(tx);
  },
};

export function uid(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export async function sha256(text) {
  const enc = new TextEncoder().encode(String(text));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getUser() {
  return (await idb.get("user")) || null;
}

export async function saveUser(user) {
  await idb.set("user", user);
  return user;
}

export async function verifyPassword(plain) {
  const user = await getUser();
  if (!user) return false;
  const hash = await sha256(plain);
  return hash === user.passwordHash;
}

/* ---------------- Virtual filesystem ---------------- */

export function joinPath(...parts) {
  const raw = parts.join("\\").replace(/\//g, "\\");
  const segs = [];
  raw.split("\\").forEach((s) => {
    if (!s || s === ".") return;
    if (s === "..") segs.pop();
    else segs.push(s);
  });
  if (!segs.length) return "C:";
  if (segs[0].toUpperCase() === "C:") {
    return segs[0].toUpperCase() + (segs.length > 1 ? "\\" + segs.slice(1).join("\\") : "\\");
  }
  return segs.join("\\");
}

export function parentPath(p) {
  const i = p.lastIndexOf("\\");
  if (i <= 2) return "C:\\";
  return p.slice(0, i);
}

export function baseName(p) {
  const i = p.lastIndexOf("\\");
  return i >= 0 ? p.slice(i + 1) : p;
}

export async function fsEnsureDir(path) {
  const norm = joinPath(path);
  const existing = await idb.getFrom("files", norm);
  if (existing) return existing;
  const rec = {
    path: norm,
    type: "dir",
    name: baseName(norm) || "C:",
    content: "",
    updated: Date.now(),
  };
  await idb.put("files", rec);
  return rec;
}

export async function fsWrite(path, content) {
  const norm = joinPath(path);
  const rec = {
    path: norm,
    type: "file",
    name: baseName(norm),
    content: String(content ?? ""),
    updated: Date.now(),
  };
  await idb.put("files", rec);
  return rec;
}

export async function fsRead(path) {
  return idb.getFrom("files", joinPath(path));
}

export async function fsList(dir) {
  const norm = joinPath(dir);
  const prefix = norm.endsWith("\\") ? norm : norm + "\\";
  const all = await idb.getAll("files");
  return all.filter((f) => {
    if (f.path === norm) return false;
    if (!f.path.startsWith(prefix)) return false;
    const rest = f.path.slice(prefix.length);
    return rest.length > 0 && !rest.includes("\\");
  });
}

export async function fsRm(path) {
  const norm = joinPath(path);
  const all = await idb.getAll("files");
  const prefix = norm + "\\";
  for (const f of all) {
    if (f.path === norm || f.path.startsWith(prefix)) {
      await idb.deleteFrom("files", f.path);
    }
  }
}

export async function initDefaultFS(username) {
  const user = username || "User";
  const dirs = [
    "C:\\",
    "C:\\Users",
    `C:\\Users\\${user}`,
    `C:\\Users\\${user}\\Desktop`,
    `C:\\Users\\${user}\\Documents`,
    `C:\\Users\\${user}\\Downloads`,
    `C:\\Users\\${user}\\Pictures`,
    `C:\\Users\\${user}\\Music`,
    `C:\\Users\\${user}\\Videos`,
    "C:\\Windows",
    "C:\\Windows\\System32",
    "C:\\Program Files",
    "C:\\Program Files\\WindowsApps",
  ];
  for (const d of dirs) await fsEnsureDir(d);
  await fsWrite(
    `C:\\Users\\${user}\\Documents\\Welcome.txt`,
    `Welcome to WebOS, ${user}.\n\nThis PC stores your files in IndexedDB — they stay on this browser.\nOpen Notepad, the Store, or Terminal to look around.\n`,
  );
  await fsWrite(
    "C:\\Windows\\System32\\license.txt",
    "WebOS — a Windows 11 experience in your browser.\nNot affiliated with Microsoft Corporation.\n",
  );
}

export async function seedIfEmpty() {
  const seeded = await idb.get("seeded");
  if (seeded) return;
  const user = await getUser();
  await initDefaultFS(user?.username || "User");
  await idb.set("seeded", true);
}

export default idb;
