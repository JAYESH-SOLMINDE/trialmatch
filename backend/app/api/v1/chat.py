from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import os

load_dotenv()

router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL   = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

SYSTEM_PROMPT = """You are a helpful AI assistant for TrialMatch — an AI-powered clinical trial matching engine built by Jayesh.

Your role is to:
- Help doctors and researchers understand how to use TrialMatch
- Explain clinical trial eligibility criteria in plain language
- Answer questions about clinical trials, medical conditions, and the matching process
- Guide users on what patient data to enter for best results
- Explain confidence scores, match results, and AI explanations

About TrialMatch:
- It matches patients to clinical trials using AI and NLP
- Data comes live from ClinicalTrials.gov (400,000+ trials)
- It uses rule-based logic + ML scoring for matching
- Results show confidence (HIGH/MEDIUM/LOW) and full explanations
- Built with: Next.js frontend, FastAPI backend, spaCy NLP, scikit-learn

Keep answers concise, friendly, and helpful. If asked about specific medical advice, remind users to consult a licensed physician."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
def chat(request: ChatRequest):
    # Validate API key is set
    if not GROQ_API_KEY or GROQ_API_KEY == "your_actual_key_here":
        return {"reply": "⚠️ AI assistant is not configured. Please set the GROQ_API_KEY."}

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 512,
                "temperature": 0.7,
            },
            timeout=30,
        )

        # Handle non-200 responses
        if response.status_code == 401:
            return {"reply": "⚠️ Invalid API key. Please check your Groq API key."}
        if response.status_code == 429:
            return {"reply": "⚠️ Too many requests. Please wait a moment and try again."}
        if response.status_code >= 500:
            return {"reply": "⚠️ Groq service is temporarily unavailable. Please try again shortly."}

        data = response.json()

        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", "Unknown error from Groq")
            return {"reply": f"⚠️ AI error: {error_msg}"}

        reply = data["choices"][0]["message"]["content"]
        return {"reply": reply}

    except requests.exceptions.Timeout:
        return {"reply": "⚠️ Request timed out. Please try again."}
    except requests.exceptions.ConnectionError:
        return {"reply": "⚠️ Could not connect to AI service. Check your internet connection."}
    except Exception as e:
        return {"reply": f"⚠️ Unexpected error: {str(e)}"}