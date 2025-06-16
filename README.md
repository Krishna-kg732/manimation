# 🎬 Manimation

**Manimation** is a full-stack web application that generates Manim animations from natural language prompts using an LLM and renders them to MP4 using Python's Manim engine.

---

## 🚀 Features

- ✨ Generate mathematical animations via AI
- 🎨 LLM-generated Manim code is sanitized and validated
- 📽️ Render and serve MP4 videos on demand
- ⚛️ React + Vite frontend
- 🧠 Google Gemini / other LLM backend support
- 🐍 Manim integration through Python runtime

---

## 📁 Project Structure

```
manimation/
├── client/                  # Frontend (React + Vite)
│   └── src/
│       ├── assets/          # Static assets & styles
│       ├── App.tsx          # Main UI logic
│       ├── main.tsx         # React DOM mounting
│       ├── theme.ts         # Theme config
│       └── ...              # Other components and utilities
│
├── server/                  # Backend (Node.js + TypeScript)
│   ├── services/            # Core logic
│   │   ├── gemini.ts        # LLM integration
│   │   ├── list_models.ts   # Model listing
│   │   └── manim_generator.py # Python script to render Manim video
│   ├── media/               # Rendered Manim video output
│   │   └── videos/          # .mp4 files
│   ├── index.ts             # API entry point
│   └── ...                  # TypeScript configs & env
│
├── .env                     # Environment configuration
├── README.md                # Project documentation
└── node_modules/, .gitignore, etc.
```

---

## 🧠 How It Works

1. User inputs a math prompt in the UI.
2. The backend sends this to an LLM (e.g. Gemini) to generate Manim Python code.
3. Python script validates and sanitizes the code.
4. The code is compiled and rendered using Manim.
5. A video is saved and served back to the frontend.

---

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Manim CE
- Google Gemini API key (or any LLM)

### Backend Setup

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Install Manim
pip install manim
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

## 🧪 Usage

1. Start the backend server:

```bash
cd server
node index.ts
```

2. Start the frontend dev server:

```bash
cd client
npm run dev
```

3. Enter a prompt like:

> "Show a circle morphing into a square."

Wait for the animation to render and watch your video!

---

## 📦 Dependencies

### Backend:
- `manim`
- `python-dotenv`
- `openai` or `google-generative-ai` (for LLMs)

### Frontend:
- `react`, `vite`
- `tailwindcss` (optional)
- `axios`

---

## 🔒 Security

- Python code is sandboxed and sanitized before execution
- Forbidden patterns (e.g., `os`, `subprocess`) are filtered
- Manim is invoked in a safe execution environment

---

## 📃 License

MIT License © Krishna Gupta
