# 🎬 Manimation – Prompt-to-Manim Video Generator

**Manimation** is a full-stack web app that transforms natural language prompts into beautiful Manim animations. It leverages an LLM to generate Python code dynamically and renders the result into `.mp4` videos using Manim.

---

## 🧠 Features

- 💡 **Prompt-based Input** — Write plain English prompts.
- ⚙️ **LLM Code Generation** — Translates prompt to valid Manim code.
- 🧼 **Code Sanitization** — Cleans and validates before execution.
- 🎞️ **Manim Video Rendering** — Renders animations in `.mp4` format.
- 🌐 **Frontend UI** — Built with React + TypeScript + Vite.
- 🧪 **Backend API** — Node.js (TypeScript) + Python execution layer.

---

## 📁 Project Structure

manimation/
├── client/ # Frontend (React + Vite)
│ └── src/
│ ├── assets/ # Static assets & styles
│ ├── App.tsx # Main UI logic
│ └── theme.ts # Theme config
│
├── server/ # Backend (Node.js + TypeScript)
│ ├── services/ # Core logic
│ │ ├── gemini.ts # LLM integration
│ │ ├── list_models.ts # Model listing
│ │ └── manim_generator.py # Manim execution + sanitization
│ ├── media/ # Generated video output
│ │ └── videos/ # .mp4 videos (output folder)
│ └── index.ts # Entry point for backend API
│
├── .env # Environment variables
├── README.md # Project documentation
└── node_modules/, .gitignore, etc.

yaml
Copy
Edit

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/manimation.git
cd manimation
2. Install Dependencies
Backend (Node.js)
bash
Copy
Edit
cd server
npm install
Frontend (React + Vite)
bash
Copy
Edit
cd ../client
npm install
3. Install Manim & Python Dependencies
Ensure Python 3.9+ is installed. Then:

bash
Copy
Edit
# Activate virtual environment (optional)
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install Manim
pip install manim
🛠️ Development
Start the Frontend
bash
Copy
Edit
cd client
npm run dev
Start the Backend
bash
Copy
Edit
cd ../server
npm run dev
📦 Build for Production
bash
Copy
Edit
# Build frontend
cd client
npm run build
bash
Copy
Edit
# Build backend if needed (tsc)
cd ../server
npm run build
📂 Output
Rendered videos are saved under:

bash
Copy
Edit
server/media/videos/
🧪 Technologies Used
Frontend: React, TypeScript, Vite

Backend: Node.js, Express, TypeScript

LLM API: Gemini (Google) or OpenAI (customizable)

Renderer: Manim (Python)

Tools: Git, VSCode, dotenv

🧠 Future Ideas
Download/share videos

Custom camera config & frame rate

📜 License
MIT License. See LICENSE for details.

vbnet
Copy
Edit

Let me know if you'd like a badge section (e.g., Build Status, License, etc.) or deployment instruc
