// server.mock.cjs — quick mock AI proxy for development
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5174;

app.post("/api/assistant", async (req, res) => {
  try {
    const body = req.body || {};
    const user = (body.messages && body.messages.slice().reverse().find(m=>m.role==="user")) || { content: "" };
    const prompt = String(user.content || "").toLowerCase();

    // Simple canned replies that include ACTION lines
    if (prompt.includes("switch") && prompt.includes("led")) {
      // return friendly explanation + actions
      const reply = [
        "Sure — I'll add a switch and an LED, and wire them so you can toggle the light.",
        "ACTION: add_switch_at 200 200",
        "ACTION: add_led_at 360 200",
        "ACTION: connect_last_two"
      ].join("\n");
      return res.json({ ok: true, reply, raw: {} });
    }

    if (prompt.includes("dff") && prompt.includes("chain")) {
      const reply = [
        "Okay — placing a chain of 4 D flip-flops horizontally.",
        "ACTION: place_chain dff 4 200 180 140"
      ].join("\n");
      return res.json({ ok: true, reply, raw: {} });
    }

    // default behaviour: simple polite response + no actions
    const reply = [
      "I can help with that. Tell me what components to add (example: add a switch and an LED).",
    ].join("\n");
    return res.json({ ok: true, reply, raw: {} });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Mock AI proxy listening on http://localhost:${PORT}/api/assistant`);
});
