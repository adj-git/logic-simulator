🧠 Virtual Logic Gate Simulator

run it on:- https://vlogic-simulator.netlify.app/

A fully interactive, browser-based digital circuit simulator built using React, Vite, and a custom logic evaluation engine.
Users can create, simulate, and experiment with logic circuits — just like a real digital electronics lab.

🚀 Features
🎛 Core Logic Gates

AND

OR

NOT

NAND

NOR

XOR

XNOR

BUFFER

🟢 Input / Output Components

Switch (toggle-able input)

Clock generator

LED (visual output indicator)

Standard INPUT/OUTPUT blocks

🔀 Advanced Components

2:1 Multiplexer (MUX2)

D Flip-Flop (basic sequential logic)

(More advanced components like JK FF, counters, and shift registers incoming!)

🧩 Circuit Builder

Drag-and-drop components onto the canvas

Connect components using wires

Automatically evaluates circuit logic in real time

Clean dark UI for clarity and focus

Zoom in/out with rescaling grid

Wires highlight active signals

Connect & disconnect wires manually

Supports large circuits smoothly

🤖 AI Assistant (Work in Progress)

An integrated AI assistant (Groq/OpenAI powered) will eventually help users:

Auto-build circuits from text instructions

Place components intelligently

Auto-wire connections

Explain circuit behavior

Convert logical expressions into circuits

Assistant panel is currently collapsible and modularized for future upgrades.

🎨 Custom Gate Rendering (Planned)

Future updates will include:

Beautiful SVG gate symbols

Custom visual styles for each component

Figma-designed circuit symbols

Optional retro or neon themes

🛠 Tech Stack
Frontend

React

Vite

Custom SVG renderer for gates & wires

Canvas-like drag interaction

State-based circuit simulation

Backend (AI Proxy)

Node.js + Express

Groq/OpenAI API relay

.env environment variable support

Deployed separately (Render/Vercel recommended)

📂 Project Structure (Simplified)
/src
  /components
    /gates        → future modular gate definitions
    Assistant.jsx → AI panel
  App.jsx         → main circuit editor
  index.css       → global styles
server.cjs        → backend AI proxy
package.json
vite.config.js

🚀 Running Locally
1. Install dependencies
npm install

2. Start backend (AI proxy)
node server.cjs

3. Start frontend
npm run dev


App runs at:

http://localhost:5173


Backend runs at:

http://localhost:5174

🌐 Deployment

Recommended setup:

Frontend → Vercel

Backend → Render

Add environment variable:

VITE_BACKEND_URL=https://your-backend-url/api/assistant

🤝 Contributing

This project is open for improvements:

New gates

Better UI

AI Assistant integration

Sequential logic blocks

Gate rendering icons

PRs welcome!

📜 License

MIT License — free to use, modify, and build upon.
