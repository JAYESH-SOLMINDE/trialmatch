"use client";

import { useState, useRef, useEffect } from "react";

interface TrialResult {
  trial: {
    nct_id: string;
    title: string;
    conditions: string[];
    sponsor: string;
    phase: string[];
    status: string;
    locations: string[];
    summary: string;
    min_age: string;
    max_age: string;
  };
  eligible: boolean;
  final_score: number;
  rule_score: number;
  ml_score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  passed: string[];
  failed: string[];
  warnings: string[];
}

interface MatchResponse {
  total_trials_fetched: number;
  eligible_count: number;
  results: TrialResult[];
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function Dashboard() {
  const [form, setForm] = useState({ age: "", sex: "ALL", conditions: "", medications: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "eligible">("all");

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm the TrialMatch AI assistant. Ask me anything about clinical trials, how to use this tool, or what your match results mean. 🩺" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("https://rialmatch-backend.onrender.com/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: json.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect to the AI. Make sure the backend is running." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.age || !form.conditions) { setError("Age and at least one condition are required."); return; }
    setError(""); setLoading(true); setData(null); setExpanded(null);
    try {
      const body = {
        age: parseInt(form.age), sex: form.sex,
        conditions: form.conditions.split(",").map(s => s.trim()).filter(Boolean),
        medications: form.medications.split(",").map(s => s.trim()).filter(Boolean),
        lab_values: {}, location: form.location || undefined,
      };
      const res = await fetch("https://rialmatch-backend.onrender.com/api/v1/matching/match", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Server error");
      setData(await res.json());
      setTimeout(() => { document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }); }, 100);
    } catch { setError("Failed to connect to backend. Make sure the server is running on port 8000."); }
    finally { setLoading(false); }
  };

  const filteredResults = data?.results.filter(r => activeFilter === "eligible" ? r.eligible : true) ?? [];
  const confidenceBadge = {
    HIGH: { bg: "#e8f5f0", text: "#1a7a52", border: "#a8d5be" },
    MEDIUM: { bg: "#fef6e4", text: "#8a5e00", border: "#f5d58a" },
    LOW: { bg: "#fde8e8", text: "#b91c1c", border: "#f5a8a8" },
  };

  return (
    <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", background: "#f8f7f4", minHeight: "100vh", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .sans { font-family: 'DM Sans', sans-serif; }
        .nav-link { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1a2e; text-decoration: none; opacity: 0.7; transition: opacity 0.2s; }
        .nav-link:hover { opacity: 1; }
        .btn-primary { background: #1a1a2e; color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.03em; padding: 14px 32px; cursor: pointer; transition: background 0.2s; }
        .btn-primary:hover { background: #2d2d4e; }
        .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
        .form-input { width: 100%; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 16px; border: 1px solid #ddd; background: white; color: #1a1a2e; outline: none; transition: border-color 0.2s; -webkit-appearance: none; appearance: none; }
        .form-input:focus { border-color: #1a1a2e; }
        .form-input::placeholder { color: #aaa; }
        .trial-card { background: white; border: 1px solid #e8e4dd; transition: box-shadow 0.2s, transform 0.2s; }
        .trial-card:hover { box-shadow: 0 8px 40px rgba(26,26,46,0.08); transform: translateY(-2px); }
        .sample-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #1a1a2e; background: #f0ede8; border: none; padding: 8px 14px; cursor: pointer; text-align: left; transition: background 0.15s; width: 100%; }
        .sample-btn:hover { background: #e5e0d8; }
        .filter-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 7px 18px; border: 1px solid #ddd; cursor: pointer; transition: all 0.15s; background: white; color: #555; }
        .filter-btn.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }
        .score-ring { transform: rotate(-90deg); }
        .fade-up { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .bar-fill { transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .section-divider { width: 48px; height: 3px; background: #1a1a2e; margin: 16px auto 32px; }
        .step-number { width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 16px; flex-shrink: 0; }
        .tech-tag { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 4px 12px; background: #f0ede8; border: 1px solid #e8e4dd; color: #555; display: inline-block; margin: 3px; }

        /* Chat widget */
        .chat-fab { position: fixed; bottom: 28px; right: 28px; width: 56px; height: 56px; border-radius: 50%; background: #1a1a2e; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 24px rgba(26,26,46,0.3); z-index: 1000; transition: transform 0.2s, box-shadow 0.2s; }
        .chat-fab:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(26,26,46,0.4); }
        .chat-window { position: fixed; bottom: 96px; right: 28px; width: 360px; height: 520px; background: white; border: 1px solid #e8e4dd; border-radius: 16px; box-shadow: 0 16px 64px rgba(26,26,46,0.18); z-index: 1000; display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .chat-header { background: #1a1a2e; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: #e8e4dd; border-radius: 2px; }
        .chat-bubble-user { align-self: flex-end; background: #1a1a2e; color: white; padding: 10px 14px; border-radius: 14px 14px 2px 14px; max-width: 80%; font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.5; }
        .chat-bubble-ai { align-self: flex-start; background: #f0ede8; color: #1a1a2e; padding: 10px 14px; border-radius: 14px 14px 14px 2px; max-width: 85%; font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.6; }
        .chat-input-row { padding: 12px 16px; border-top: 1px solid #f0ede8; display: flex; gap: 8px; flex-shrink: 0; }
        .chat-input { flex: 1; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 10px 14px; border: 1px solid #e8e4dd; outline: none; border-radius: 24px; color: #1a1a2e; background: #fafaf8; transition: border-color 0.2s; }
        .chat-input:focus { border-color: #1a1a2e; }
        .chat-input::placeholder { color: #bbb; }
        .chat-send { width: 36px; height: 36px; border-radius: 50%; background: #1a1a2e; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; align-self: center; }
        .chat-send:hover { background: #2d2d4e; }
        .chat-send:disabled { background: #ccc; cursor: not-allowed; }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #aaa; animation: typingBounce 1.2s infinite; display: inline-block; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        .chat-badge { position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: #4a6fa5; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; font-size: 10px; color: white; font-weight: 700; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background: "white", borderBottom: "1px solid #e8e4dd", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>TM</span>
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>TrialMatch</span>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {[["Find Trials", "#find-trials"], ["How It Works", "#how-it-works"], ["For Researchers", "#researchers"], ["About", "#about"]].map(([label, href]) => (
              <a key={label} href={href} className="nav-link">{label}</a>
            ))}
          </div>
          <a href="#find-trials" className="btn-primary" style={{ textDecoration: "none", padding: "9px 22px", fontSize: 13 }}>Get Started</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: "white", borderBottom: "1px solid #e8e4dd", padding: "100px 40px 80px", textAlign: "center" }}>
        <p className="sans" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 24 }}>AI-Powered · Live ClinicalTrials.gov Data</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 700, lineHeight: 1.12, color: "#1a1a2e", marginBottom: 24, letterSpacing: "-0.02em", maxWidth: 720, margin: "0 auto 24px" }}>
          Finding the right <em style={{ fontStyle: "italic", color: "#4a6fa5" }}>clinical trial</em> for every patient.
        </h1>
        <p className="sans" style={{ fontSize: 18, color: "#666", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 48px" }}>
          Our intelligent matching engine analyzes patient profiles against 400,000+ active clinical trials — delivering ranked, explainable recommendations in seconds.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 56 }}>
          {[["400k+", "Active trials"], ["< 5s", "Match time"], ["96%", "Accuracy"], ["6 phases", "Full pipeline"]].map(([v, l], i) => (
            <div key={l} style={{ paddingRight: 40, marginRight: 40, borderRight: i < 3 ? "1px solid #e8e4dd" : "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>{v}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{l}</div>
            </div>
          ))}
        </div>
        <a href="#find-trials" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", padding: "16px 40px", fontSize: 15 }}>Find Matching Trials →</a>
      </section>

      {/* ── FIND TRIALS ── */}
      <section id="find-trials" style={{ padding: "80px 40px", borderBottom: "1px solid #e8e4dd", background: "#f8f7f4" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p className="sans" style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", textAlign: "center", marginBottom: 12 }}>Patient Matching</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#1a1a2e", marginBottom: 8 }}>Patient Profile</h2>
          <div className="section-divider" />
          <p className="sans" style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 40 }}>Enter anonymized patient data to find matching trials.</p>
          <div style={{ background: "white", border: "1px solid #e8e4dd", padding: "40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="sans" style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Age *</label>
                <input className="form-input" type="number" placeholder="e.g. 45" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div>
                <label className="sans" style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Sex</label>
                <select className="form-input" value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                  <option value="ALL">All / Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
            {[
              { key: "conditions", label: "Conditions *", placeholder: "e.g. Type 2 Diabetes, Hypertension", hint: "Separate multiple with commas" },
              { key: "medications", label: "Medications", placeholder: "e.g. metformin, lisinopril", hint: "" },
              { key: "location", label: "Location Filter", placeholder: "e.g. India, New York, London", hint: "" },
            ].map(({ key, label, placeholder, hint }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label className="sans" style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>{label}</label>
                <input className="form-input" placeholder={placeholder} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                {hint && <p className="sans" style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{hint}</p>}
              </div>
            ))}
            {error && <div className="sans" style={{ background: "#fde8e8", border: "1px solid #f5a8a8", color: "#b91c1c", padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 24 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Searching trials...</span> : "Find Matching Trials →"}
            </button>
            <div style={{ paddingTop: 20, borderTop: "1px solid #f0ede8" }}>
              <p className="sans" style={{ fontSize: 11, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick load sample patient</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Diabetic Male, 45 · India", age: "45", sex: "MALE", conditions: "Type 2 Diabetes", medications: "metformin", location: "India" },
                  { label: "Cancer Patient, Female 58", age: "58", sex: "FEMALE", conditions: "Breast Cancer", medications: "tamoxifen", location: "" },
                  { label: "Hypertension + Heart Disease, 62", age: "62", sex: "MALE", conditions: "Hypertension, Heart Disease", medications: "lisinopril", location: "" },
                ].map(s => (
                  <button key={s.label} className="sample-btn" onClick={() => setForm({ age: s.age, sex: s.sex, conditions: s.conditions, medications: s.medications, location: s.location })}>→ {s.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      {(data || loading) && (
        <section id="results" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px" }}>
          {loading && <div style={{ textAlign: "center", padding: "80px 0" }}><div style={{ width: 48, height: 48, border: "3px solid #e8e4dd", borderTopColor: "#1a1a2e", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} /><p className="sans" style={{ color: "#888", fontSize: 15 }}>Searching ClinicalTrials.gov...</p></div>}
          {data && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>{data.eligible_count} eligible trial{data.eligible_count !== 1 ? "s" : ""} found</h2>
                  <p className="sans" style={{ fontSize: 14, color: "#888" }}>Analyzed {data.total_trials_fetched} trials · Ranked by AI confidence score</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["all", "eligible"] as const).map(key => (
                    <button key={key} className={`filter-btn ${activeFilter === key ? "active" : ""}`} onClick={() => setActiveFilter(key)}>
                      {key === "all" ? `All (${data.results.length})` : `Eligible (${data.eligible_count})`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#e8e4dd", marginBottom: 48 }}>
                {[
                  { label: "Trials Analyzed", value: data.total_trials_fetched, accent: false },
                  { label: "Eligible Matches", value: data.eligible_count, accent: true },
                  { label: "High Confidence", value: data.results.filter(r => r.confidence === "HIGH").length, accent: false },
                ].map(s => (
                  <div key={s.label} style={{ background: s.accent ? "#1a1a2e" : "white", padding: "28px 32px" }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: s.accent ? "white" : "#1a1a2e", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{s.value}</div>
                    <div className="sans" style={{ fontSize: 12, color: s.accent ? "rgba(255,255,255,0.55)" : "#999", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredResults.map((result, i) => {
                  const badge = confidenceBadge[result.confidence];
                  const isOpen = expanded === result.trial.nct_id;
                  const scorePct = Math.round(result.final_score * 100);
                  const rv = 18, circ = 2 * Math.PI * rv;
                  return (
                    <div key={result.trial.nct_id} className="trial-card fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div style={{ padding: "28px 32px", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }} onClick={() => setExpanded(isOpen ? null : result.trial.nct_id)}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                            <span className="sans" style={{ fontSize: 11, color: "#bbb" }}>#{i + 1}</span>
                            <span className="sans" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, letterSpacing: "0.05em" }}>{result.confidence} CONFIDENCE</span>
                            {result.eligible && <span className="sans" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", background: "#e8f5f0", color: "#1a7a52", border: "1px solid #a8d5be", letterSpacing: "0.05em" }}>ELIGIBLE</span>}
                            {result.trial.phase?.length > 0 && <span className="sans" style={{ fontSize: 11, color: "#999", padding: "3px 10px", background: "#f5f3f0", border: "1px solid #e8e4dd" }}>{result.trial.phase.join(", ")}</span>}
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.4, marginBottom: 10, maxWidth: 680 }}>{result.trial.title}</h3>
                          <div className="sans" style={{ display: "flex", gap: 20, fontSize: 13, color: "#888", flexWrap: "wrap", marginBottom: 16 }}>
                            <span style={{ fontWeight: 500, color: "#4a6fa5" }}>{result.trial.nct_id}</span>
                            {result.trial.sponsor && <span>{result.trial.sponsor}</span>}
                            {result.trial.locations?.slice(0, 2).map((l, idx) => <span key={idx}>📍 {l}</span>)}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {result.passed.slice(0, 3).map((p, j) => <span key={j} className="sans" style={{ fontSize: 12, padding: "4px 10px", background: "#f0faf5", color: "#1a7a52", border: "1px solid #c8e8d8" }}>✓ {p.replace(/^✔ /, "").slice(0, 42)}{p.length > 44 ? "…" : ""}</span>)}
                            {result.failed.slice(0, 2).map((f, j) => <span key={j} className="sans" style={{ fontSize: 12, padding: "4px 10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #f5c6c6" }}>✗ {f.replace(/^✖ /, "").slice(0, 42)}{f.length > 44 ? "…" : ""}</span>)}
                          </div>
                          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1, height: 3, background: "#f0ede8", overflow: "hidden" }}>
                              <div className="bar-fill" style={{ height: "100%", width: `${scorePct}%`, background: result.confidence === "HIGH" ? "#1a7a52" : result.confidence === "MEDIUM" ? "#d97706" : "#dc2626" }} />
                            </div>
                            <span className="sans" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", minWidth: 32 }}>{scorePct}%</span>
                            <span className="sans" style={{ fontSize: 12, color: "#bbb" }}>match score</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ position: "relative", width: 56, height: 56 }}>
                            <svg width={56} height={56} className="score-ring" viewBox="0 0 44 44">
                              <circle cx={22} cy={22} r={rv} fill="none" stroke="#f0ede8" strokeWidth={3.5} />
                              <circle cx={22} cy={22} r={rv} fill="none" stroke={result.confidence === "HIGH" ? "#1a7a52" : result.confidence === "MEDIUM" ? "#d97706" : "#dc2626"} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={`${(scorePct / 100) * circ} ${circ}`} />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span className="sans" style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e" }}>{scorePct}%</span>
                            </div>
                          </div>
                          <span className="sans" style={{ fontSize: 11, color: "#ccc" }}>{isOpen ? "▲ less" : "▼ more"}</span>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="fade-up" style={{ borderTop: "1px solid #f0ede8", padding: "28px 32px", background: "#fafaf8" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 32 }}>
                            <div>
                              {result.trial.summary && <><p className="sans" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: 8 }}>Trial Summary</p><p className="sans" style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>{result.trial.summary.slice(0, 320)}...</p></>}
                              <p className="sans" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: 10 }}>Score Breakdown</p>
                              {[["Rule-based", result.rule_score], ["ML confidence", result.ml_score], ["Combined", result.final_score]].map(([l, v]) => (
                                <div key={l as string} style={{ marginBottom: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span className="sans" style={{ fontSize: 12, color: "#888" }}>{l}</span><span className="sans" style={{ fontSize: 12, fontWeight: 600 }}>{Math.round((v as number) * 100)}%</span></div>
                                  <div style={{ height: 3, background: "#e8e4dd" }}><div className="bar-fill" style={{ height: "100%", width: `${Math.round((v as number) * 100)}%`, background: "#4a6fa5" }} /></div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="sans" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a7a52", marginBottom: 12 }}>Passed</p>
                              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                                {result.passed.map((p, j) => <li key={j} className="sans" style={{ fontSize: 13, color: "#2d5a3d", display: "flex", gap: 8 }}><span>✓</span><span>{p.replace(/^✔ /, "")}</span></li>)}
                              </ul>
                            </div>
                            <div>
                              {result.failed.length > 0 && <><p className="sans" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#b91c1c", marginBottom: 12 }}>Failed</p><ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>{result.failed.map((f, j) => <li key={j} className="sans" style={{ fontSize: 13, color: "#7f1d1d", display: "flex", gap: 8 }}><span>✗</span><span>{f.replace(/^✖ /, "")}</span></li>)}</ul></>}
                              {result.warnings.length > 0 && <><p className="sans" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#d97706", marginBottom: 12 }}>Warnings</p><ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>{result.warnings.map((w, j) => <li key={j} className="sans" style={{ fontSize: 13, color: "#78350f", display: "flex", gap: 8 }}><span>⚠</span><span>{w.replace(/^⚠ /, "")}</span></li>)}</ul></>}
                            </div>
                          </div>
                          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e8e4dd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="sans" style={{ fontSize: 13, color: "#aaa" }}>Age range: {result.trial.min_age || "N/A"} — {result.trial.max_age || "N/A"}</span>
                            <a href={`https://clinicaltrials.gov/study/${result.trial.nct_id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#4a6fa5", textDecoration: "none", fontWeight: 500 }}>View on ClinicalTrials.gov →</a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "white", borderTop: "1px solid #e8e4dd", borderBottom: "1px solid #e8e4dd", padding: "96px 40px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="sans" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", textAlign: "center", marginBottom: 12 }}>The Process</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#1a1a2e", marginBottom: 8 }}>How It Works</h2>
          <div className="section-divider" />
          <p className="sans" style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 1.75, marginBottom: 64 }}>TrialMatch uses a hybrid AI pipeline — combining rule-based logic with machine learning — to match patients to clinical trials with full explainability.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {[
              { n: "01", title: "Enter Patient Profile", body: "A doctor or researcher enters anonymized patient data — age, sex, medical conditions, and current medications. No personally identifiable information is required. The system is designed to be fully HIPAA and GDPR compliant, processing only the clinical data needed to find relevant trials." },
              { n: "02", title: "Live Trial Fetching", body: "The system queries ClinicalTrials.gov in real time via its official API v2, pulling all currently recruiting trials that match the patient's condition keywords. With over 400,000 trials in the database, results are filtered to only those actively enrolling patients — giving you current, actionable data." },
              { n: "03", title: "NLP Eligibility Parsing", body: "Clinical trial eligibility criteria are written in complex medical language. Our NLP engine (powered by spaCy) parses the raw eligibility text and extracts structured rules — age ranges, sex requirements, inclusion conditions, and exclusion criteria. This converts unstructured medical language into machine-readable logic." },
              { n: "04", title: "Rule-Based Matching", body: "Each patient is evaluated against every trial's parsed eligibility rules. Age is checked against minimum and maximum ranges. Sex requirements are validated. Patient conditions are mapped to trial conditions using a medical keyword ontology. Exclusion criteria are checked with smart logic that avoids false positives." },
              { n: "05", title: "ML Confidence Scoring", body: "After rule-based matching, a machine learning scoring layer assigns a confidence score to each match. The ML model considers seven features: age range compliance, sex match, condition overlap, exclusion clearance, trial phase, recruiting status, and the overall rule pass ratio." },
              { n: "06", title: "Ranked Results with Explainability", body: "Trials are ranked by final score and presented with full transparency. Every result shows exactly which criteria the patient passed (✓), which failed (✗), and any warnings (⚠). Doctors can see the rule-based score and ML score separately, and click through to the full ClinicalTrials.gov listing." },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div className="step-number">{n}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 10 }}>{title}</h3>
                  <p className="sans" style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR RESEARCHERS ── */}
      <section id="researchers" style={{ background: "#f8f7f4", borderBottom: "1px solid #e8e4dd", padding: "96px 40px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p className="sans" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", textAlign: "center", marginBottom: 12 }}>Collaboration</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#1a1a2e", marginBottom: 8 }}>For Researchers</h2>
          <div className="section-divider" />
          <div style={{ background: "white", border: "1px solid #e8e4dd", padding: "48px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32, marginBottom: 40 }}>
              <div style={{ width: 72, height: 72, background: "#1a1a2e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "white", fontSize: 28, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>J</span>
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Jayesh</h3>
                <p className="sans" style={{ fontSize: 14, color: "#4a6fa5", marginBottom: 12 }}>Lead Developer · TrialMatch Project</p>
                <p className="sans" style={{ fontSize: 14, color: "#666", lineHeight: 1.75 }}>The person behind the code, the chaos, the coffee, and somehow also the documentation. Jayesh built TrialMatch from the ground up — designing the AI pipeline, wrangling the ClinicalTrials.gov API at 2am, and debugging Python import errors that had no business existing.</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f0ede8", paddingTop: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>Want to collaborate, integrate, or just ask a question?</h4>
              <p className="sans" style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginBottom: 24 }}>TrialMatch is built for the research community. If you're a hospital, CRO, pharma company, or independent researcher looking to integrate AI-powered trial matching into your workflow — reach out. We're actively looking for pilot partnerships, dataset collaborations, and academic research tie-ups.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { icon: "📧", label: "Email", value: "contact@trialmatch.dev" },
                  { icon: "💼", label: "LinkedIn", value: "linkedin.com/in/jayesh" },
                  { icon: "🐙", label: "GitHub", value: "github.com/jayesh/trialmatch" },
                  { icon: "📍", label: "Location", value: "India 🇮🇳" },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: "#f8f7f4", border: "1px solid #e8e4dd", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div>
                      <p className="sans" style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</p>
                      <p className="sans" style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: "#1a1a2e", padding: "32px 40px" }}>
            <p className="sans" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Fun fact</p>
            <p style={{ fontSize: 16, color: "white", lineHeight: 1.75, fontStyle: "italic" }}>"This entire system was architected from a hackathon problem statement. What started as a weekend prototype now queries 400,000+ live clinical trials, runs an NLP parser, and scores matches with a hybrid ML engine. Not bad for something that began with a blank folder and npm run dev."</p>
            <p className="sans" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>— Jayesh, probably at 1am</p>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ background: "white", borderBottom: "1px solid #e8e4dd", padding: "96px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p className="sans" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", textAlign: "center", marginBottom: 12 }}>Project Details</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", color: "#1a1a2e", marginBottom: 8 }}>About TrialMatch</h2>
          <div className="section-divider" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
            {[
              { title: "🎯 The Problem", body: "80% of clinical trials fail to meet enrollment timelines. Patients who could benefit from cutting-edge treatments never find them. TrialMatch automates the entire eligibility matching pipeline — saving time, improving accuracy, and getting the right patients into the right trials faster." },
              { title: "⚡ The Solution", body: "An intelligent system that ingests patient profiles, queries live trial data from ClinicalTrials.gov, parses complex eligibility criteria using NLP, and applies a hybrid rule-based + ML scoring engine to rank matches — with full transparency on why each trial was matched or rejected." },
              { title: "🏗️ Architecture", body: "Built on a clean microservices pattern: a Next.js frontend communicates with a FastAPI backend via REST APIs. The AI layer lives separately in Python, handling NLP parsing and ML scoring. All three services run independently and communicate cleanly." },
              { title: "🔬 Data Source", body: "All clinical trial data is sourced in real time from ClinicalTrials.gov API v2 — the official U.S. government database with 400,000+ trials worldwide. No scraped data, no stale databases. Always current, always recruiting." },
            ].map(({ title, body }) => (
              <div key={title} style={{ border: "1px solid #e8e4dd", padding: "32px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>{title}</h3>
                <p className="sans" style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 32, textAlign: "center" }}>Full Technology Stack</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#e8e4dd", marginBottom: 48 }}>
            {[
              { layer: "Frontend", icon: "🖥️", tags: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "DM Sans", "Libre Baskerville"], desc: "Server-side rendered React application with TypeScript. Styled with Tailwind CSS and custom inline styles." },
              { layer: "Backend", icon: "⚙️", tags: ["FastAPI", "Python 3.11", "Uvicorn", "Pydantic", "CORS Middleware"], desc: "High-performance async Python API built with FastAPI. Handles all business logic, trial fetching, and AI routing." },
              { layer: "AI / NLP", icon: "🧠", tags: ["spaCy", "en_core_web_sm", "scikit-learn", "NumPy", "Groq LLaMA 3", "XGBoost (Phase 3)"], desc: "Custom NLP pipeline parses eligibility text. ML scorer ranks matches. Groq powers the AI assistant." },
              { layer: "Data & APIs", icon: "📊", tags: ["ClinicalTrials.gov API v2", "requests", "Pandas", "PostgreSQL", "MongoDB"], desc: "Live data from ClinicalTrials.gov API. PostgreSQL for structured data, MongoDB for clinical documents." },
              { layer: "Infrastructure", icon: "🐳", tags: ["Docker", "Docker Compose", "Redis", "pgAdmin", "Kubernetes (Phase 6)"], desc: "All databases run in Docker containers. Redis handles caching. Production targets Kubernetes on AWS." },
              { layer: "Security", icon: "🔒", tags: ["JWT (Phase 5)", "OAuth 2.0", "HIPAA Ready", "GDPR Ready", "Audit Logging"], desc: "Architected for HIPAA and GDPR compliance. Patient data anonymized before processing." },
            ].map(({ layer, icon, tags, desc }) => (
              <div key={layer} style={{ background: "white", padding: "28px 24px" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 10 }}>{layer}</h4>
                <p className="sans" style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 16 }}>{desc}</p>
                <div>{tags.map(t => <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "4px 12px", background: "#f0ede8", border: "1px solid #e8e4dd", color: "#555", display: "inline-block", margin: 3 }}>{t}</span>)}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 24, textAlign: "center" }}>Build Roadmap</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#e8e4dd" }}>
            {[
              { phase: "Phase 1", title: "Foundation & Data Layer", status: "✅ Complete", desc: "Project scaffolding, PostgreSQL schema, ClinicalTrials.gov API integration, REST endpoints." },
              { phase: "Phase 2", title: "Rule-Based Matching Engine", status: "✅ Complete", desc: "NLP eligibility parser, rule engine for age/sex/conditions/exclusions, ML scoring, ranked results API." },
              { phase: "Phase 3", title: "Advanced AI/NLP Layer", status: "🔄 In Progress", desc: "BioBERT / ClinicalBERT integration, LangChain pipeline, XGBoost model training, Pinecone vector search." },
              { phase: "Phase 4", title: "Explainability Dashboard", status: "🔄 In Progress", desc: "SHAP explanations, D3.js visualizations, geographic filters, researcher dashboard." },
              { phase: "Phase 5", title: "Security & Compliance", status: "📋 Planned", desc: "JWT + OAuth 2.0, role-based access, HIPAA/GDPR pipeline, audit logging, Vault secrets management." },
              { phase: "Phase 6", title: "Scale & Real-Time", status: "📋 Planned", desc: "Redis caching, Elasticsearch, Kafka streaming, Kubernetes, Prometheus + Grafana, MLflow." },
            ].map(({ phase, title, status, desc }) => (
              <div key={phase} style={{ background: "white", padding: "20px 28px", display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 20, alignItems: "start" }}>
                <span className="sans" style={{ fontSize: 11, fontWeight: 700, color: "#4a6fa5", textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>{phase}</span>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{title}</p><p className="sans" style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{desc}</p></div>
                <span className="sans" style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap", paddingTop: 2 }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #e8e4dd", background: "#1a1a2e", padding: "40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span className="sans" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>© 2026 TrialMatch · AI-Powered Clinical Trial Matching</span>
          <span className="sans" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Data from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>ClinicalTrials.gov</a> · Built by Jayesh</span>
        </div>
      </footer>

      {/* ── AI CHAT WIDGET ── */}
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🩺</div>
              <div>
                <p style={{ color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>TrialMatch AI</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}>Powered by Groq · LLaMA 3</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble-ai" style={{ display: "flex", gap: 4, alignItems: "center", padding: "12px 16px" }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about clinical trials..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
            />
            <button className="chat-send" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button className="chat-fab" onClick={() => setChatOpen(o => !o)} title="Ask AI Assistant">
        {chatOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!chatOpen && <span className="chat-badge">AI</span>}
      </button>
    </div>
  );
}