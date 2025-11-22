// server.cjs (defensive, verbose logging)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const GROQ_KEY = process.env.GROQ_API_KEY || null;
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
const PORT = process.env.PORT || 5174;

function safeLog(...args) {
  console.log(...args);
  try {
    fs.appendFileSync("server.log", `[${new Date().toISOString()}] ` + args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n");
  } catch (e) { /* ignore logging errors */ }
}

safeLog("Starting robust AI proxy");
safeLog("GROQ_API_KEY set?", !!GROQ_KEY, "OPENAI_API_KEY set?", !!OPENAI_KEY, "port", PORT);

function chooseProvider() {
  if (GROQ_KEY) return { name: "groq", key: GROQ_KEY, endpoint: "https://api.groq.com/openai/v1/chat/completions" };
  return { name: "openai", key: OPENAI_KEY, endpoint: "https://api.openai.com/v1/chat/completions" };
}

async function fetchJson(endpoint, apiKey, body, timeoutMs = 15000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(id);
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = { rawText: text }; }
    return { ok: r.ok, status: r.status, text, json: parsed };
  } catch (err) {
    return { ok: false, status: 0, error: String(err) };
  }
}

app.post("/api/assistant", async (req, res) => {
  // Defensive wrapper so nothing crashes the process
  try {
    const provider = chooseProvider();
    if (!provider.key) {
      safeLog("[proxy] no API key configured");
      return res.status(500).json({ ok: false, error: "No API key configured on server (GROQ_API_KEY or OPENAI_API_KEY)" });
    }

    // Basic validation and logging
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const model = body.model || "llama-3.1-8b-instant";
    const max_tokens = body.max_tokens || 512;

    safeLog("[proxy] incoming request provider=", provider.name, "model=", model, "messages=", messages.length);
    // log a truncated copy of the first message contents to help debugging (don't log secrets)
    try {
      const first = messages[0] && messages[0].content ? String(messages[0].content).slice(0, 800) : "";
      safeLog("[proxy] first message snippet:", first);
    } catch (e) {}

    // build request body in OpenAI-compatible shape
    const callBody = { model, messages: messages.map(m => ({ role: m.role, content: m.content })), max_tokens, temperature: 0.15 };

    // Try calling requested model first
    let result = await fetchJson(provider.endpoint, provider.key, callBody);
    safeLog("[proxy] upstream result status=", result.status, "ok=", result.ok);

    // If model-not-found on provider, attempt variants (only for provider name 'groq' or openai)
    if (!result.ok && result.status === 404) {
      safeLog("[proxy] model not found, trying variants for", model);
      const base = model;
      const variants = [
        `${base}-32768`,
        `${base}-8192`,
        `${base}-16384`,
        `${base}-instruct-v0.1`,
        base.replace(/-32768|-8192|-16384|-instruct-v0.1$/i, "")
      ];
      for (const v of variants) {
        if (!v || v === model) continue;
        safeLog("[proxy] trying variant:", v);
        callBody.model = v;
        result = await fetchJson(provider.endpoint, provider.key, callBody);
        safeLog("[proxy] variant", v, "status=", result.status, "ok=", result.ok);
        if (result.ok) {
          break;
        }
        // if other error than 404, stop trying further
        if (result.status && result.status !== 404) break;
      }
    }

    // final result handling
    if (!result.ok) {
      safeLog("[proxy] upstream final failure:", result.status, result.error || result.text);
      // return the upstream error body (safe) so frontend can fallback to local parser
      return res.status(result.status || 500).json({ ok: false, error: result.text || result.error || "Upstream error" });
    }

    // extract assistant reply from common shapes
    let reply = "";
    try {
      if (result.json) {
        if (result.json.choices && result.json.choices[0]) {
          reply = result.json.choices[0].message?.content || result.json.choices[0].text || "";
        } else if (result.json.output && Array.isArray(result.json.output) && result.json.output[0]?.content?.text) {
          reply = result.json.output[0].content.text;
        } else if (typeof result.json === "string") {
          reply = String(result.json);
        } else if (result.json.rawText) {
          reply = result.json.rawText;
        }
      }
    } catch (e) {
      safeLog("[proxy] error extracting reply:", String(e));
    }
    safeLog("[proxy] reply length:", (reply || "").length);
    return res.json({ ok: true, reply, raw: result.json });
  } catch (err) {
    // catch everything — log and return JSON error (no crash)
    safeLog("[proxy] handler exception:", String(err), err && err.stack ? err.stack.slice(0, 1000) : "");
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

process.on("unhandledRejection", (r) => safeLog("UnhandledRejection:", String(r)));
process.on("uncaughtException", (err) => safeLog("UncaughtException:", String(err)));

app.listen(PORT, () => {
  safeLog(`AI proxy listening on http://localhost:${PORT}/api/assistant`);
});
