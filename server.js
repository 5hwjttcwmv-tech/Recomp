"use strict";
// Zero-dependency server: Node 22.13+ (uses the built-in node:sqlite).
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = +process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "recomp.db");
const PUB = __dirname;
const STATIC = new Set(["index.html", "style.css", "app.js"]);
const TTL = 30 * 864e5;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}', photos TEXT NOT NULL DEFAULT '[]', t INTEGER NOT NULL DEFAULT 0, w TEXT NOT NULL DEFAULT '', p INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS friends(a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL, PRIMARY KEY(a,b));`);

const q = (sql) => db.prepare(sql);
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
const secure = (req) => req.headers["x-forwarded-proto"] === "https" || process.env.COOKIE_SECURE === "1";
const fail = (code, message) => Object.assign(new Error(message), { code });

const hits = new Map();
function limited(ip) {
  const n = Date.now(), a = (hits.get(ip) || []).filter((t) => n - t < 6e5);
  a.push(n); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > 15;
}
setInterval(() => q("DELETE FROM sessions WHERE expires<?").run(Date.now()), 36e5).unref();

function send(res, code, obj, headers) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(obj));
}
function body(req, max) {
  return new Promise((ok, no) => {
    let n = 0; const c = [];
    req.on("data", (d) => { n += d.length; if (n > max) { no(fail(413, "That's too large to save.")); req.destroy(); } else c.push(d); });
    req.on("end", () => { try { ok(c.length ? JSON.parse(Buffer.concat(c)) : {}); } catch { no(fail(400, "Bad request.")); } });
    req.on("error", no);
  });
}
function authed(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie || "");
  return m ? q("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?").get(sha(m[1]), Date.now()) || null : null;
}
function startSession(req, uid) {
  const t = crypto.randomBytes(32).toString("hex");
  q("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)").run(sha(t), uid, Date.now() + TTL);
  return { "Set-Cookie": `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL / 1000}${secure(req) ? "; Secure" : ""}` };
}
const me = (u) => ({ username: u.username, data: JSON.parse(u.data), photos: JSON.parse(u.photos) });
const userByName = (n) => (typeof n === "string" ? q("SELECT id,username FROM users WHERE username=?").get(n.toLowerCase()) : null);

async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  const origin = req.headers.origin;
  if (m !== "GET" && origin && new URL(origin).host !== req.headers.host) throw fail(403, "Bad origin.");
  if ((m === "POST" || m === "PUT") && !/application\/json/.test(req.headers["content-type"] || "")) throw fail(415, "Bad request.");
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  if (p === "/healthz") return send(res, 200, { ok: true });

  if ((p === "/api/signup" || p === "/api/login") && m === "POST") {
    if (limited(ip)) throw fail(429, "Too many attempts. Try again in a few minutes.");
    const { username: u, password: pw } = await body(req, 2000);
    if (typeof u !== "string" || !/^[a-z0-9_]{3,20}$/.test(u)) throw fail(400, "Usernames are 3-20 letters, numbers, or underscores.");
    if (typeof pw !== "string" || pw.length < 8 || pw.length > 72) throw fail(400, "Passwords need 8 to 72 characters.");
    if (p === "/api/signup") {
      const salt = crypto.randomBytes(16).toString("hex");
      let id;
      try { id = Number(q("INSERT INTO users(username,salt,hash,created) VALUES(?,?,?,?)").run(u, salt, hashPw(pw, salt), Date.now()).lastInsertRowid); }
      catch { throw fail(409, "That username is taken."); }
      return send(res, 200, me(q("SELECT * FROM users WHERE id=?").get(id)), startSession(req, id));
    }
    const row = q("SELECT * FROM users WHERE username=?").get(u);
    const ok = row && crypto.timingSafeEqual(Buffer.from(hashPw(pw, row.salt), "hex"), Buffer.from(row.hash, "hex"));
    if (!ok) throw fail(401, "Wrong username or password.");
    return send(res, 200, me(row), startSession(req, row.id));
  }

  const u = authed(req);
  if (!u) throw fail(401, "Please log in.");

  if (p === "/api/logout" && m === "POST") {
    const t = /sid=([a-f0-9]{64})/.exec(req.headers.cookie || "")[1];
    q("DELETE FROM sessions WHERE token=?").run(sha(t));
    return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; HttpOnly; Path=/; Max-Age=0" });
  }
  if (p === "/api/me" && m === "GET") return send(res, 200, me(u));
  if (p === "/api/me" && m === "DELETE") {
    q("DELETE FROM users WHERE id=?").run(u.id);
    return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; HttpOnly; Path=/; Max-Age=0" });
  }
  if (p === "/api/data" && m === "PUT") {
    const d = await body(req, 6e5);
    if (!d || typeof d !== "object" || Array.isArray(d)) throw fail(400, "Bad request.");
    q("UPDATE users SET data=? WHERE id=?").run(JSON.stringify(d), u.id);
    return send(res, 200, { ok: true });
  }
  if (p === "/api/photos" && m === "PUT") {
    const { list } = await body(req, 2.5e6);
    const ok = Array.isArray(list) && list.length <= 15 && list.every((x) => x && typeof x.d === "string" && x.d.length <= 10 && typeof x.img === "string" && x.img.startsWith("data:image/jpeg;base64,") && x.img.length < 2e5);
    if (!ok) throw fail(400, "Bad photo data.");
    q("UPDATE users SET photos=? WHERE id=?").run(JSON.stringify(list.map((x) => ({ d: x.d, img: x.img }))), u.id);
    return send(res, 200, { ok: true });
  }
  if (p === "/api/score" && m === "PUT") {
    const { t, w, p: wp } = await body(req, 500);
    const n = (v) => Number.isInteger(v) && v >= 0 && v < 1e7;
    if (!n(t) || !n(wp) || typeof w !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(w)) throw fail(400, "Bad score.");
    q("UPDATE users SET t=?,w=?,p=? WHERE id=?").run(t, w, wp, u.id);
    return send(res, 200, { ok: true });
  }
  if (p === "/api/leaderboard" && m === "GET") {
    const rows = url.searchParams.get("scope") === "all"
      ? q("SELECT username,t,w,p FROM users WHERE w!='' ORDER BY w DESC,p DESC LIMIT 200").all()
      : q("SELECT username,t,w,p FROM users WHERE id=? OR id IN (SELECT b FROM friends WHERE a=? AND status='accepted' UNION SELECT a FROM friends WHERE b=? AND status='accepted')").all(u.id, u.id, u.id);
    return send(res, 200, { rows: rows.map((r) => ({ username: r.username, t: r.t, w: r.w, p: r.p })) });
  }
  if (p === "/api/friends" && m === "GET") {
    const rows = q("SELECT f.a,f.b,f.status,ua.username AS an,ub.username AS bn FROM friends f JOIN users ua ON ua.id=f.a JOIN users ub ON ub.id=f.b WHERE f.a=? OR f.b=?").all(u.id, u.id);
    const out = { friends: [], incoming: [], outgoing: [] };
    for (const r of rows) {
      if (r.status === "accepted") out.friends.push(r.a === u.id ? r.bn : r.an);
      else if (r.b === u.id) out.incoming.push(r.an);
      else out.outgoing.push(r.bn);
    }
    return send(res, 200, out);
  }
  if (p === "/api/friends" && m === "POST") {
    const t = userByName((await body(req, 500)).username);
    if (!t) throw fail(404, "No one has that username.");
    if (t.id === u.id) throw fail(400, "That's you.");
    const ex = q("SELECT a,status FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").get(u.id, t.id, t.id, u.id);
    if (ex) {
      if (ex.status === "accepted") return send(res, 200, { message: "You're already friends." });
      if (ex.a === t.id) { q("UPDATE friends SET status='accepted' WHERE a=? AND b=?").run(t.id, u.id); return send(res, 200, { message: `You're now friends with ${t.username}.` }); }
      return send(res, 200, { message: "Request already sent." });
    }
    q("INSERT INTO friends(a,b,status) VALUES(?,?,'pending')").run(u.id, t.id);
    return send(res, 200, { message: `Request sent to ${t.username}.` });
  }
  if (p === "/api/friends/accept" && m === "POST") {
    const t = userByName((await body(req, 500)).username);
    const r = t && q("UPDATE friends SET status='accepted' WHERE a=? AND b=? AND status='pending'").run(t.id, u.id);
    if (!r || !r.changes) throw fail(404, "No request from that person.");
    return send(res, 200, { message: `You're now friends with ${t.username}.` });
  }
  if (p.startsWith("/api/friends/") && m === "DELETE") {
    const t = userByName(decodeURIComponent(p.slice(13)));
    if (t) q("DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").run(u.id, t.id, t.id, u.id);
    return send(res, 200, { ok: true });
  }
  throw fail(404, "Not found.");
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
function serve(req, res, url) {
  let f = path.normalize(decodeURIComponent(url.pathname));
  if (f === "/" || f === path.sep) f = "/index.html";
  const full = path.join(PUB, f);
  if (!STATIC.has(f.replace(/^[\\/]/, ""))) { res.writeHead(404); return res.end("Not found"); }
  fs.readFile(full, (e, d) => {
    if (e) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(d);
  });
}

http.createServer(async (req, res) => {
  try {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (secure(req)) res.setHeader("Strict-Transport-Security", "max-age=31536000");
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/") || url.pathname === "/healthz") await api(req, res, url); else serve(req, res, url);
  } catch (e) {
    const code = typeof e.code === "number" ? e.code : 500;
    if (code === 500) console.error(e);
    if (!res.headersSent) send(res, code, { error: code === 500 ? "Something went wrong." : e.message }); else res.end();
  }
}).listen(PORT, () => console.log("Listening on port " + PORT));
