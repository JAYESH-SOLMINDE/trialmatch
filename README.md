<div align="center">

<br />

```
████████╗██████╗ ██╗ █████╗ ██╗     ███╗   ███╗ █████╗ ████████╗ ██████╗██╗  ██╗
╚══██╔══╝██╔══██╗██║██╔══██╗██║     ████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
   ██║   ██████╔╝██║███████║██║     ██╔████╔██║███████║   ██║   ██║     ███████║
   ██║   ██╔══██╗██║██╔══██║██║     ██║╚██╔╝██║██╔══██║   ██║   ██║     ██╔══██║
   ██║   ██║  ██║██║██║  ██║███████╗██║ ╚═╝ ██║██║  ██║   ██║   ╚██████╗██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
```

### AI-Powered Clinical Trial Eligibility & Matching Engine

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-trialmatch--ashy.vercel.app-1a1a2e?style=for-the-badge)](https://trialmatch-ashy.vercel.app)
[![Backend](https://img.shields.io/badge/⚡_API-Render-46e3b7?style=for-the-badge)](https://rialmatch-backend.onrender.com/docs)
[![License](https://img.shields.io/badge/📄_License-MIT-white?style=for-the-badge)](LICENSE)
[![Made in India](https://img.shields.io/badge/📍_Made_in-India_🇮🇳-FF9933?style=for-the-badge)](#)

<br />

> *Connecting patients to the right clinical trials using AI, NLP, and real-time data from ClinicalTrials.gov*

<br />

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🧬 Overview

**TrialMatch** is an intelligent clinical trial matching system that analyzes patient health profiles and automatically matches them to suitable clinical trials. It combines rule-based logic and machine learning to evaluate eligibility criteria — and explains every decision in plain language so doctors can trust the results.

Built for the research community — hospitals, CROs, pharma companies, and independent researchers looking to automate and accelerate patient-trial matching.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI-Powered Matching** | Rule-based engine + ML scoring to rank trial recommendations |
| 🌐 **Live Trial Data** | Pulls real recruiting trials from ClinicalTrials.gov (400,000+ trials) |
| 🔍 **Explainable AI** | Every match shows exactly why a patient qualifies or doesn't |
| 📊 **Confidence Scores** | HIGH / MEDIUM / LOW confidence on every result |
| 🧠 **NLP Eligibility Parsing** | spaCy parses complex eligibility text into structured rules |
| 🛡️ **Smart Exclusion Detection** | Avoids false positives (e.g. Type 1 vs Type 2 Diabetes) |
| 📍 **Geographic Filtering** | Filter trials by patient location |
| 💬 **AI Chatbot Assistant** | Powered by Groq + LLaMA 3.1 |
| 🔒 **Fully Anonymized** | No patient PII is stored or transmitted |

---

## ⚙️ How It Works

```
┌─────────────────────────────────┐
│       Patient Profile Input      │
│  age · sex · conditions · meds  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   ClinicalTrials.gov API (Live) │
│       400,000+ real trials      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     NLP Eligibility Parser      │
│  spaCy · regex · rule extractor │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     Rule-Based Match Engine     │
│  age · sex · conditions · meds  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│      ML Scoring & Ranking       │
│   weighted features · sorting   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Ranked Results + Explanations │
│  ✔ passed · ✖ failed · warnings │
└─────────────────────────────────┘
```

---

## 🛠️ Tech Stack

```
Frontend          →   Next.js · TypeScript · Tailwind CSS
Backend           →   FastAPI (Python)
AI / NLP          →   spaCy · scikit-learn · NumPy
Matching Engine   →   Rule-based logic + ML weighted scoring
Trial Data        →   ClinicalTrials.gov API v2
AI Chatbot        →   Groq API (LLaMA 3.1)
Deployment        →   Vercel (frontend) · Render (backend)
```

---

## 🚀 Getting Started

### Prerequisites

- Python `3.11+`
- Node.js `20+`
- Git

### 1 · Clone the repository

```bash
git clone https://github.com/JAYESH-SOLMINDE/trialmatch.git
cd trialmatch
```

### 2 · Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
ALLOW_ALL_ORIGINS=true
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3 · Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4 · Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## 📡 API Reference

### `POST /api/v1/matching/match`

Match a patient to clinical trials.

**Request body:**

```json
{
  "age": 45,
  "sex": "MALE",
  "conditions": ["Type 2 Diabetes"],
  "medications": ["metformin"],
  "lab_values": { "hba1c": 8.2 },
  "location": "India"
}
```

**Response:**

```json
{
  "total_trials_fetched": 14,
  "eligible_count": 8,
  "results": [
    {
      "trial": { "title": "...", "nct_id": "NCT..." },
      "eligible": true,
      "confidence": "HIGH",
      "final_score": 1.0,
      "passed": [
        "✔ Age 45 is within range (18–70)",
        "✔ Condition match: type 2 diabetes mellitus"
      ],
      "failed": [],
      "warnings": []
    }
  ]
}
```

### `GET /api/v1/trials/search`

Search trials by condition and location.

```
GET /api/v1/trials/search?condition=diabetes&location=India&page_size=10
```

### `POST /api/v1/chat`

AI chatbot assistant.

```json
{
  "messages": [
    { "role": "user", "content": "What does a HIGH confidence score mean?" }
  ]
}
```

---

## 🗂️ Project Structure

```
trialmatch/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── matching.py       # Match endpoint
│   │   │       ├── trials.py         # Trial search endpoint
│   │   │       └── chat.py           # AI chatbot endpoint
│   │   ├── core/
│   │   │   └── config.py             # App settings
│   │   ├── services/
│   │   │   └── clinicaltrials_service.py   # ClinicalTrials.gov API
│   │   └── main.py                   # FastAPI app entry
│   └── requirements.txt
│
├── ai/
│   ├── nlp/
│   │   └── eligibility_parser.py     # NLP text → structured rules
│   └── matching/
│       ├── rule_engine.py            # Rule-based matcher
│       └── ml_matcher.py             # ML scoring & ranking
│
└── frontend/
    └── src/
        └── app/
            └── page.tsx              # Main UI
```

---

## 🗺️ Roadmap

- [ ] BioBERT / ClinicalBERT for deeper NLP understanding
- [ ] FHIR / HL7 integration for direct EHR connectivity
- [ ] SHAP explainability visualizations
- [ ] Multi-patient batch matching (CSV upload)
- [ ] JWT authentication + role-based access
- [ ] Redis caching for faster repeated queries
- [ ] HIPAA compliance audit
- [ ] Real-time alerts for new matching trials

---

## 👨‍💻 Author

<table>
  <tr>
    <td align="center">
      <b>Jayesh Solminde</b><br/>
      Lead Developer · TrialMatch<br/><br/>
      <a href="mailto:jayeshsolminde@gmail.com">📧 jayeshsolminde@gmail.com</a><br/>
      <a href="https://www.linkedin.com/in/jayesh-solminde/">💼 LinkedIn</a> ·
      <a href="https://github.com/JAYESH-SOLMINDE">🐙 GitHub</a>
    </td>
  </tr>
</table>

> TrialMatch is actively looking for **pilot partnerships**, **dataset collaborations**, and **academic research tie-ups**. If you're a hospital, CRO, pharma company, or independent researcher — reach out.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with ❤️ in India 🇮🇳 · Powered by ClinicalTrials.gov · AI by Groq</sub>
</div>
