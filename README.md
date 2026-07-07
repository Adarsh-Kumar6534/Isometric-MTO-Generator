# Isometric Drawing to Automated MTO Generator 🚀

An end-to-end AI-powered Full-Stack web application that automatically extracts a **Material Take-Off (MTO)** table from piping isometric drawings (PDF, JPG, PNG). Built using **Next.js**, **FastAPI**, and **Google Gemini 2.5 Flash Vision AI**.

![Demo Preview](https://via.placeholder.com/1000x500.png?text=Isometric+MTO+Generator+Preview)

## ✨ Features
- **Zero-Touch AI Extraction:** Upload a piping isometric and the Gemini Vision model traces the route, parses the title block, and extracts all fittings, flanges, and valves automatically.
- **Graceful Fallback Pipeline:** No API key? No problem. The app gracefully falls back to a detailed mock data pipeline allowing full UI/UX testing without credentials.
- **Interactive UI & Animations:** Built with a modern glassmorphism design, staggered row fade-ins, and 3D hover tilt effects.
- **Full-Screen Image Inspection:** Click any uploaded drawing to launch a full-screen zoom and pan modal to inspect dense CAD symbols.
- **Excel & CSV Export:** Instantly download the validated MTO into a strictly formatted `.xlsx` or `.csv` file.
- **Live Background Processing:** Utilizes FastAPI `BackgroundTasks` and frontend polling to stream real-time pipeline status (uploading ➔ preprocessing ➔ vision AI ➔ validation).
- **Dockerized:** Fully containerized for 1-click deployment.

## 🛠️ Tech Stack
- **Frontend:** Next.js (React), Vanilla CSS (Custom Design System)
- **Backend:** FastAPI, Pydantic (Strict Schema Validation)
- **AI/Vision:** Google Generative AI (`gemini-2.5-flash`)
- **PDF Processing:** PyMuPDF (`fitz`)
- **Data Export:** `openpyxl`, `csv`

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Google Gemini API Key (Get one free at Google AI Studio)

### Option 1: Run with Docker (Recommended)
1. Clone the repository:
   ```bash
   git clone https://github.com/Adarsh-Kumar6534/Isometric-MTO-Generator.git
   cd Isometric-MTO-Generator
   ```
2. Setup your Environment Variables:
   ```bash
   cp backend/.env.example backend/.env
   # Add your GEMINI_API_KEY inside backend/.env
   ```
3. Spin up the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the web app at `http://localhost:3000`

### Option 2: Local Development Setup
**1. Backend (FastAPI)**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
**2. Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
```

## 🧠 Architecture & Design Decisions
- **Strict Domain Modeling:** The pipeline doesn't just ask the LLM for a string. It defines a rigid Pydantic schema for MTO items (Pipe, Flange, Valve, Gasket, Bolts) and forces the Vision model to map detections into JSON.
- **PDF Interceptor:** Since Vision models only accept images, a `PyMuPDF` interceptor automatically detects PDFs and renders the first page as a 300dpi image buffer before it hits the LLM.

## 📄 License
This project is open-source and available under the MIT License.
