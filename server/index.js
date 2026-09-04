"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { sendRegistrationEmails, sendIdeaEmail } = require("./mail");

const ROOT = path.join(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env");

if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const DATA_DIR = path.join(ROOT, "data", "registrations");
const PORT = Number(process.env.PORT || 3002);
const ADMIN_TOKEN = process.env.REG_ADMIN_TOKEN || "";

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function text(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "content-type": "text/plain; charset=utf-8" }, headers || {}));
  res.end(body);
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || req.socket.remoteAddress || "";
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    req.on("data", function (chunk) {
      chunks.push(chunk);
    });
    req.on("end", function () {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function parseBody(req) {
  const raw = await readBody(req);
  const ct = req.headers["content-type"] || "";
  if (ct.includes("application/json")) {
    return raw ? JSON.parse(raw) : {};
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

function makeKey() {
  const submitted_at = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  return submitted_at.replace(/[:.]/g, "-") + "-" + rand;
}

function saveRecord(key, record) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, key + ".json"), JSON.stringify(record, null, 2));
}

function listRecords() {
  ensureDir();
  const out = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    const key = file.slice(0, -5);
    const rec = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
    out.push(Object.assign({ key: key }, rec));
  }
  out.sort(function (a, b) {
    return a.submitted_at < b.submitted_at ? 1 : -1;
  });
  return out;
}

async function handleRegister(req, res) {
  if (req.method !== "POST") {
    text(res, 405, "Method not allowed");
    return;
  }

  let data;
  try {
    data = await parseBody(req);
  } catch (err) {
    json(res, 400, { ok: false, error: "bad request" });
    return;
  }

  if (data["bot-field"]) {
    json(res, 200, { ok: true });
    return;
  }
  delete data["bot-field"];
  delete data["form-name"];

  if (!data.name || !data.phone) {
    json(res, 422, { ok: false, error: "name and phone required" });
    return;
  }
  if (!data.email) {
    json(res, 422, { ok: false, error: "email required" });
    return;
  }
  if (!data.disclosure || data.disclosure === "false") {
    json(res, 422, { ok: false, error: "disclosure required" });
    return;
  }

  if (data.country_of_birth && !data.country_of_origin) {
    data.country_of_origin = data.country_of_birth;
  }

  const key = makeKey();
  const record = Object.assign({}, data, {
    submitted_at: new Date().toISOString(),
    ip: clientIp(req),
  });

  try {
    saveRecord(key, record);
  } catch (err) {
    json(res, 500, { ok: false, error: "storage failed: " + err.message });
    return;
  }

  let emailResult = { confirmation: false, notify: false, error: "" };
  try {
    emailResult = await sendRegistrationEmails(record);
  } catch (err) {
    emailResult.error = err.message || String(err);
  }

  json(res, 200, {
    ok: true,
    email_sent: !!emailResult.confirmation,
    email_error: emailResult.error || undefined,
  });
}

async function handleIdea(req, res) {
  if (req.method !== "POST") {
    text(res, 405, "Method not allowed");
    return;
  }

  let data;
  try {
    data = await parseBody(req);
  } catch (err) {
    json(res, 400, { ok: false, error: "bad request" });
    return;
  }

  const idea = String(data.idea || "").trim();
  if (!idea) {
    json(res, 422, { ok: false, error: "idea required" });
    return;
  }

  const record = {
    name: String(data.name || "").trim(),
    topic: String(data.topic || "Other").trim() || "Other",
    idea: idea,
    submitted_at: new Date().toISOString(),
    ip: clientIp(req),
  };

  let sent;
  try {
    sent = await sendIdeaEmail(record);
  } catch (err) {
    json(res, 500, { ok: false, error: err.message || String(err) });
    return;
  }

  if (!sent || !sent.sent) {
    json(res, 500, { ok: false, error: (sent && sent.reason) || "email not sent" });
    return;
  }

  json(res, 200, { ok: true, email_sent: true });
}

function adminTokenFrom(req, url) {
  const q = url.searchParams.get("token");
  if (q) return q;
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return req.headers["x-admin-token"] || "";
}

async function handleRegistrations(req, res, url) {
  const token = adminTokenFrom(req, url);
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    text(res, 401, "Unauthorized");
    return;
  }

  const delKey = url.searchParams.get("delete") ||
    (req.method === "DELETE" ? url.searchParams.get("key") : null);
  if (delKey) {
    const file = path.join(DATA_DIR, delKey + ".json");
    if (fs.existsSync(file)) fs.unlinkSync(file);
    json(res, 200, { ok: true, deleted: delKey });
    return;
  }

  const out = listRecords();

  if (url.searchParams.get("format") === "csv") {
    const cols = [
      "submitted_at", "name", "phone", "email", "city",
      "country_of_birth", "country_of_origin",
      "needs_visa", "group_size", "group_size_exact", "ancestral_village",
      "ancestral_village_other", "party_members", "disclosure", "notes",
    ];
    const esc = function (s) {
      return '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';
    };
    const rows = [cols.join(",")].concat(
      out.map(function (r) {
        return cols.map(function (c) {
          return esc(r[c]);
        }).join(",");
      })
    );
    text(res, 200, rows.join("\n"), {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=impact-registrations.csv",
    });
    return;
  }

  json(res, 200, { count: out.length, registrations: out });
}

const server = http.createServer(async function (req, res) {
  const url = new URL(req.url || "/", "http://localhost");

  if (url.pathname === "/api/register") {
    await handleRegister(req, res);
    return;
  }

  if (url.pathname === "/api/idea") {
    await handleIdea(req, res);
    return;
  }

  if (url.pathname === "/api/registrations") {
    await handleRegistrations(req, res, url);
    return;
  }

  if (url.pathname === "/api/health") {
    json(res, 200, { ok: true });
    return;
  }

  text(res, 404, "Not found");
});

ensureDir();
server.listen(PORT, "127.0.0.1", function () {
  console.log("impact-festival api listening on 127.0.0.1:" + PORT);
});
