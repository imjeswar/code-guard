import * as THREE from 'three';
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Code2, Zap, AlertTriangle, CheckCircle, XCircle,
  Upload, Download, History, LogOut, User, Lock, Mail,
  Eye, EyeOff, Search, Filter, ChevronRight, ChevronDown,
  FileCode, Star, TrendingUp, AlertCircle, Bug, Cpu,
  BookOpen, RefreshCw, Copy, Check, ArrowRight, Moon, Sun,
  BarChart2, PieChart, Activity, Clock, FileText, Github,
  Terminal, Layers, Award, Info, X, Plus, Minus, Menu
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// ─── OPENROUTER API ──────────────────────────────────────────────────────────
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function reviewCodeWithAI(code, language) {
  const prompt = `You are a Staff Software Engineer performing a professional code review.

Analyze the provided ${language} code and generate a detailed review.

Evaluate:
1. Bugs
2. Security Vulnerabilities
3. Performance Problems
4. Code Smells
5. Maintainability
6. Readability
7. Best Practices

Assign a score from 0-100.

For every issue provide: title, description, severity (critical/high/medium/low), suggestedFix.

Provide refactored code suggestions where applicable.

Return ONLY valid JSON in this exact format:
{
  "score": 85,
  "language": "${language}",
  "summary": "Brief overall summary",
  "criticalIssues": [{"title":"","description":"","severity":"critical","suggestedFix":"","line":0}],
  "securityIssues": [{"title":"","vulnerability":"","riskLevel":"high","fixRecommendation":"","line":0}],
  "performanceIssues": [{"title":"","bottleneck":"","optimization":"","estimatedImpact":"","line":0}],
  "codeSmells": [{"title":"","description":"","severity":"medium","suggestedFix":""}],
  "bestPracticeViolations": [{"title":"","description":"","recommendation":""}],
  "improvements": [{"before":"","after":"","explanation":""}],
  "metrics": {"complexity":0,"maintainability":0,"readability":0,"security":0}
}`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "CodeGuard AI"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\``
        }
      ],
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    })
  });

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || "{}";
  
  // Extract JSON block robustly to avoid extra text like "User Safety: safe"
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    text = jsonMatch[0];
    // Remove trailing commas which are common in LLM outputs
    text = text.replace(/,\s*([\]}])/g, '$1');
  } else {
    text = "{}";
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse response:", err);
    return {
      score: 0,
      summary: "Failed to parse AI response",
      criticalIssues: [],
      securityIssues: [],
      performanceIssues: [],
      codeSmells: [],
      bestPracticeViolations: [],
      improvements: [],
      metrics: {}
    };
  }
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USERS = [{ email: "demo@codeguard.ai", password: "demo123", name: "Alex Chen" }];

const SAMPLE_REVIEWS = [
  { id: 1, fileName: "auth.service.ts", date: "2025-06-05", score: 72, language: "TypeScript", issues: 8 },
  { id: 2, fileName: "api_handler.py", date: "2025-06-04", score: 88, language: "Python", issues: 3 },
  { id: 3, fileName: "UserComponent.jsx", date: "2025-06-03", score: 91, language: "JavaScript", issues: 2 },
  { id: 4, fileName: "DataService.java", date: "2025-06-02", score: 65, language: "Java", issues: 12 },
  { id: 5, fileName: "utils.cpp", date: "2025-06-01", score: 79, language: "C++", issues: 6 },
];

const CHART_DATA = [
  { name: "Mon", reviews: 4, score: 82 }, { name: "Tue", reviews: 7, score: 76 },
  { name: "Wed", reviews: 3, score: 91 }, { name: "Thu", reviews: 9, score: 68 },
  { name: "Fri", reviews: 6, score: 85 }, { name: "Sat", reviews: 2, score: 93 },
  { name: "Sun", reviews: 5, score: 87 },
];

const SAMPLE_CODE = {
  javascript: `// User authentication module
const crypto = require('crypto');
const db = require('./database');

async function loginUser(username, password) {
  const user = await db.query('SELECT * FROM users WHERE username = ' + username);
  
  if (user.password === password) {
    const token = Math.random().toString();
    console.log('Login successful for:', username, 'password:', password);
    return { success: true, token };
  }
  return { success: false };
}

function hashPassword(pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex');
}

// Process payment
async function processPayment(amount, cardNumber) {
  var result = null;
  for (var i = 0; i < 1000000; i++) {
    result = i * amount;
  }
  console.log('Card:', cardNumber);
  return result;
}`,
  python: `import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/execute')
def execute_command():
    cmd = request.args.get('cmd')
    result = subprocess.call(cmd, shell=True)
    return str(result)

@app.route('/user/<id>')  
def get_user(id):
    query = f"SELECT * FROM users WHERE id = {id}"
    # Execute raw SQL
    return query

SECRET_KEY = "hardcoded_secret_123"
DB_PASSWORD = "admin123"

def process_data(items):
    results = []
    for i in range(len(items)):
        for j in range(len(items)):
            results.append(items[i] * items[j])
    return results`,
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl text-sm font-medium shadow-2xl
              ${t.type === "success" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" :
                t.type === "error" ? "bg-red-500/20 border-red-500/40 text-red-300" :
                "bg-[#E2E8F0]/20 border-blue-500/40 text-blue-300"}`}>
            {t.type === "success" ? <CheckCircle size={16} /> : t.type === "error" ? <XCircle size={16} /> : <Info size={16} />}
            {t.message}
            <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 160 }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const data = [{ value: score, fill: color }];
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <RadialBarChart width={size} height={size} cx={size / 2} cy={size / 2} innerRadius={size * 0.35} outerRadius={size * 0.48}
        barSize={size * 0.08} data={data} startAngle={90} endAngle={-270}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: "#E2E8F020" }} dataKey="value" angleAxisId={0} data={data} />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs text-[#E2E8F0]/70 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded-lg ${className}`} />;
}

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
function AuthPage({ onLogin, addToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (mode === "login") {
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (user) { onLogin(user); addToast("Welcome back!", "success"); }
      else addToast("Invalid credentials. Please try again.", "error");
    } else if (mode === "register") {
      const newUser = { email, password, name };
      MOCK_USERS.push(newUser);
      onLogin(newUser);
      addToast("Account created!", "success");
    } else {
      addToast("Password reset link sent to your email.", "info");
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-[#1A2B34] border border-slate-700/50 shadow-lg shadow-cyan-500/10">
              <img src="/logo.png" alt="CodeGuard AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black text-[#E2E8F0] tracking-tight">CodeGuard<span className="text-[#E2E8F0]"> AI</span></span>
          </div>
          <p className="text-[#E2E8F0]/70 text-sm">AI-powered code review for modern teams</p>
        </div>

        <div className="bg-[#1A2B34]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-[0_0_40px_rgba(226,232,240,0.05)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(226,232,240,0.15)] hover:border-[#E2E8F0]/30">
          <h2 className="text-xl font-bold text-[#E2E8F0] mb-6">
            {mode === "login" ? "Sign in to your account" : mode === "register" ? "Create an account" : "Reset password"}
          </h2>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm text-[#E2E8F0]/70 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E2E8F0]/50" />
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" autoComplete="off"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-[#E2E8F0] text-sm focus:outline-none focus:border-cyan-500/60 transition-colors" />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-[#E2E8F0]/70 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E2E8F0]/50" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="off" placeholder="Enter your email address"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-[#E2E8F0] text-sm focus:outline-none focus:border-cyan-500/60 transition-colors" />
              </div>
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="text-sm text-[#E2E8F0]/70 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E2E8F0]/50" />
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-[#E2E8F0] text-sm focus:outline-none focus:border-cyan-500/60 transition-colors" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E2E8F0]/50 hover:text-[#E2E8F0]/90">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button onClick={() => setMode("forgot")} className="text-xs text-[#E2E8F0] hover:text-cyan-300">Forgot password?</button>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-[#E2E8F0] to-violet-600 text-[#E2E8F0] font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
              {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <span className="text-[#E2E8F0]/70">No account? <button onClick={() => setMode("register")} className="text-[#E2E8F0] hover:text-cyan-300 font-medium">Sign up free</button></span>
            ) : (
              <span className="text-[#E2E8F0]/70">Already have an account? <button onClick={() => setMode("login")} className="text-[#E2E8F0] hover:text-cyan-300 font-medium">Sign in</button></span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout, collapsed, setCollapsed }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nav = [
    { id: "dashboard", icon: BarChart2, label: "Dashboard" },
    { id: "review", icon: Code2, label: "Code Review" },
    { id: "history", icon: History, label: "Review History" },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A2B34] border-t border-slate-700/50 flex justify-around p-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {nav.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`flex flex-col items-center p-2 rounded-xl text-xs transition-colors ${page === id ? "text-cyan-400" : "text-[#E2E8F0]/50 hover:text-[#E2E8F0]/80"}`}>
            <Icon size={20} className="mb-1" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.aside animate={{ width: collapsed ? 64 : 224 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 bg-[#1A2B34]/90 border-r border-slate-700/50 flex flex-col h-screen sticky top-0 backdrop-blur-xl overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/30 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#1A2B34] border border-slate-700/50 shadow-md">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        {!collapsed && <span className="text-lg font-black text-[#E2E8F0] tracking-tight">CodeGuard<span className="text-[#E2E8F0]"> AI</span></span>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${page === id ? "bg-cyan-500/15 text-[#E2E8F0] border border-cyan-500/20" : "text-[#E2E8F0]/70 hover:text-[#E2E8F0] hover:bg-slate-800/60"}
              ${collapsed ? "justify-center" : ""}`}>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700/30">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-800/40">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E2E8F0] to-violet-600 flex items-center justify-center text-xs font-bold text-[#E2E8F0] flex-shrink-0">
              {user?.name?.[0] || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#E2E8F0] text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[#E2E8F0]/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#E2E8F0]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={16} />
          {!collapsed && "Sign out"}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className={`w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-sm text-[#E2E8F0]/50 hover:text-[#E2E8F0]/90 hover:bg-slate-800/40 transition-colors ${collapsed ? "justify-center" : ""}`}>
          <Menu size={16} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ reviews, setPage }) {
  const totalScore = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length) : 0;
  const critical = reviews.reduce((s, r) => s + (r.issues || 0), 0);
  const security = Math.floor(critical * 0.3);

  const stats = [
    { label: "Total Reviews", value: reviews.length, icon: FileCode, color: "cyan", sub: "+3 this week" },
    { label: "Avg Code Score", value: `${totalScore}/100`, icon: Award, color: "violet", sub: "↑ 4pts from last week" },
    { label: "Critical Issues", value: critical, icon: Bug, color: "red", sub: "Across all reviews" },
    { label: "Security Warnings", value: security, icon: Shield, color: "amber", sub: "Needs attention" },
  ];

  const colorMap = {
    cyan: "from-[#E2E8F0]/15 to-[#E2E8F0]/5 border-[#E2E8F0]/20 text-[#E2E8F0]",
    violet: "from-[#E2E8F0]/15 to-[#E2E8F0]/5 border-[#E2E8F0]/20 text-[#E2E8F0]",
    red: "from-[#E2E8F0]/15 to-[#E2E8F0]/5 border-[#E2E8F0]/20 text-[#E2E8F0]",
    amber: "from-[#E2E8F0]/15 to-[#E2E8F0]/5 border-[#E2E8F0]/20 text-[#E2E8F0]",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#E2E8F0]">Dashboard</h1>
        <p className="text-[#E2E8F0]/70 text-sm mt-1">Overview of your code quality metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.03, y: -4 }}
            className={`bg-gradient-to-br ${colorMap[s.color]} border rounded-2xl p-5 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(226,232,240,0.15)] hover:border-[#E2E8F0]/40 hover:bg-[#1A2B34]/80`}>
            <div className="flex items-start justify-between mb-3">
              <s.icon size={20} className={colorMap[s.color].split(" ").find(c => c.startsWith("text-"))} />
            </div>
            <div className="text-2xl font-black text-[#E2E8F0] mb-1">{s.value}</div>
            <div className="text-xs font-semibold text-[#E2E8F0]/90">{s.label}</div>
            <div className="text-xs text-[#E2E8F0]/50 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_30px_rgba(226,232,240,0.08)] hover:border-[#E2E8F0]/20">
          <h3 className="text-sm font-semibold text-[#E2E8F0]/90 mb-4">Reviews This Week</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="reviews" stroke="#06b6d4" fill="url(#cg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_30px_rgba(226,232,240,0.08)] hover:border-[#E2E8F0]/20">
          <h3 className="text-sm font-semibold text-[#E2E8F0]/90 mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_30px_rgba(226,232,240,0.08)] hover:border-[#E2E8F0]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#E2E8F0]/90">Recent Reviews</h3>
          <button onClick={() => setPage("history")} className="text-xs text-[#E2E8F0] hover:text-cyan-300 flex items-center gap-1">View all <ChevronRight size={12} /></button>
        </div>
        <div className="space-y-2">
          {reviews.slice(0, 5).map((r, i) => (
            <div key={r.id || i} className="flex items-center gap-4 py-3 border-b border-slate-700/30 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                <FileCode size={14} className="text-[#E2E8F0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E2E8F0] truncate">{r.fileName}</p>
                <p className="text-xs text-[#E2E8F0]/50">{r.language} · {r.date}</p>
              </div>
              <div className={`text-sm font-bold ${r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                {r.score}/100
              </div>
              <div className="text-xs text-[#E2E8F0]/50">{r.issues} issues</div>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-[#E2E8F0]/50 text-sm text-center py-4">No reviews yet. Start your first review!</p>}
        </div>
      </div>
    </div>
  );
}

// ─── SIMPLE CODE EDITOR ───────────────────────────────────────────────────────
function SimpleEditor({ value, onChange, language }) {
  return (
    <div className="relative h-full font-mono text-sm">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800/60 border-r border-slate-700/30 flex flex-col items-end pr-2 pt-3 select-none overflow-hidden">
        {(value || "").split("\n").map((_, i) => (
          <div key={i} className="text-slate-600 text-xs leading-6 h-6">{i + 1}</div>
        ))}
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} spellCheck={false}
        className="absolute inset-0 pl-14 pr-4 pt-3 pb-3 bg-transparent text-slate-100 text-sm leading-6 resize-none focus:outline-none font-mono w-full h-full"
        style={{ tabSize: 2 }} />
    </div>
  );
}

// ─── ISSUE CARD ───────────────────────────────────────────────────────────────
function IssueCard({ title, description, severity, fix, extra }) {
  const [open, setOpen] = useState(false);
  const sevColor = {
    critical: "border-red-500/40 bg-red-500/8",
    high: "border-orange-500/40 bg-orange-500/8",
    medium: "border-amber-500/40 bg-amber-500/8",
    low: "border-blue-500/40 bg-blue-500/8",
  }[severity] || "border-slate-500/40 bg-slate-500/8";
  const sevText = {
    critical: "text-red-400 bg-red-500/20",
    high: "text-orange-400 bg-orange-500/20",
    medium: "text-amber-400 bg-amber-500/20",
    low: "text-[#E2E8F0]/90 bg-[#E2E8F0]/20",
  }[severity] || "text-[#E2E8F0]/70 bg-slate-500/20";

  return (
    <div className={`border rounded-xl p-4 ${sevColor} transition-all`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <AlertCircle size={16} className={sevText.split(" ")[0]} />
          <span className="text-sm font-semibold text-[#E2E8F0] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevText}`}>{severity?.toUpperCase()}</span>
          {open ? <ChevronDown size={14} className="text-[#E2E8F0]/70" /> : <ChevronRight size={14} className="text-[#E2E8F0]/70" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 space-y-2">
            <p className="text-sm text-[#E2E8F0]/90">{description}</p>
            {extra && <p className="text-sm text-[#E2E8F0]/70">{extra}</p>}
            {fix && (
              <div className="bg-[#1A2B34]/60 rounded-lg p-3 border border-slate-700/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(226,232,240,0.1)] hover:border-[#E2E8F0]/20">
                <p className="text-xs font-semibold text-emerald-400 mb-1">Suggested Fix</p>
                <p className="text-xs text-[#E2E8F0]/90 font-mono leading-relaxed">{fix}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── REVIEW RESULTS ──────────────────────────────────────────────────────────
function ReviewResults({ result, fileName, onExport }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "issues", label: `Issues (${(result.criticalIssues?.length || 0) + (result.codeSmells?.length || 0)})`, icon: Bug },
    { id: "security", label: `Security (${result.securityIssues?.length || 0})`, icon: Shield },
    { id: "performance", label: `Perf (${result.performanceIssues?.length || 0})`, icon: Zap },
    { id: "refactor", label: "Refactor", icon: RefreshCw },
  ];

  const metricData = result.metrics ? [
    { name: "Complexity", value: result.metrics.complexity || 0 },
    { name: "Maintainability", value: result.metrics.maintainability || 0 },
    { name: "Readability", value: result.metrics.readability || 0 },
    { name: "Security", value: result.metrics.security || 0 },
  ] : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-center gap-6">
        <ScoreRing score={result.score || 0} size={120} />
        <div className="flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-black text-[#E2E8F0]">{fileName || "Code Review"}</h2>
            <span className="text-xs bg-slate-800 text-[#E2E8F0]/70 px-2 py-0.5 rounded-full border border-slate-700">{result.language}</span>
          </div>
          <p className="text-[#E2E8F0]/90 text-sm leading-relaxed mb-3">{result.summary}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {[
              { label: "Critical", count: result.criticalIssues?.length || 0, color: "text-red-400" },
              { label: "Security", count: result.securityIssues?.length || 0, color: "text-amber-400" },
              { label: "Performance", count: result.performanceIssues?.length || 0, color: "text-[#E2E8F0]/90" },
              { label: "Best Practices", count: result.bestPracticeViolations?.length || 0, color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className={`font-bold ${s.color}`}>{s.count}</span>
                <span className="text-[#E2E8F0]/50">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-[#E2E8F0]/90 transition-colors">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} JSON
          </button>
          <button onClick={() => onExport("markdown")} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-[#E2E8F0]/90 transition-colors">
            <Download size={14} /> MD
          </button>
          <button onClick={() => onExport("pdf")} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-xs text-[#E2E8F0] transition-colors">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Metrics */}
      {metricData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricData.map(m => (
            <div key={m.name} className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-xl p-3 text-center">
              <div className={`text-xl font-black ${m.value >= 70 ? "text-emerald-400" : m.value >= 50 ? "text-amber-400" : "text-red-400"}`}>{m.value}</div>
              <div className="text-xs text-[#E2E8F0]/50 mt-0.5">{m.name}</div>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${m.value >= 70 ? "bg-emerald-400" : m.value >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex overflow-x-auto border-b border-slate-700/40">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2
                ${activeTab === t.id ? "text-[#E2E8F0] border-cyan-400 bg-cyan-500/5" : "text-[#E2E8F0]/70 border-transparent hover:text-[#E2E8F0]"}`}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-3">
              {result.bestPracticeViolations?.map((v, i) => (
                <IssueCard key={i} title={v.title} description={v.description} severity="medium" fix={v.recommendation} />
              ))}
              {(!result.bestPracticeViolations?.length) && <p className="text-[#E2E8F0]/50 text-sm">No best practice violations detected. 🎉</p>}
            </div>
          )}
          {activeTab === "issues" && (
            <div className="space-y-3">
              {result.criticalIssues?.map((iss, i) => (
                <IssueCard key={i} title={iss.title} description={iss.description} severity={iss.severity || "critical"} fix={iss.suggestedFix} extra={iss.line ? `Line ${iss.line}` : null} />
              ))}
              {result.codeSmells?.map((s, i) => (
                <IssueCard key={`smell-${i}`} title={s.title} description={s.description} severity={s.severity || "medium"} fix={s.suggestedFix} />
              ))}
              {(!result.criticalIssues?.length && !result.codeSmells?.length) && <p className="text-[#E2E8F0]/50 text-sm">No issues found! Clean code. ✨</p>}
            </div>
          )}
          {activeTab === "security" && (
            <div className="space-y-3">
              {result.securityIssues?.map((s, i) => (
                <IssueCard key={i} title={s.title} description={s.vulnerability} severity={s.riskLevel || "high"} fix={s.fixRecommendation} extra={s.line ? `Line ${s.line}` : null} />
              ))}
              {!result.securityIssues?.length && <p className="text-[#E2E8F0]/50 text-sm">No security vulnerabilities detected. 🔒</p>}
            </div>
          )}
          {activeTab === "performance" && (
            <div className="space-y-3">
              {result.performanceIssues?.map((p, i) => (
                <IssueCard key={i} title={p.title} description={p.bottleneck} severity="medium" fix={p.optimization} extra={p.estimatedImpact ? `Impact: ${p.estimatedImpact}` : null} />
              ))}
              {!result.performanceIssues?.length && <p className="text-[#E2E8F0]/50 text-sm">No performance issues found. ⚡</p>}
            </div>
          )}
          {activeTab === "refactor" && (
            <div className="space-y-6">
              {result.improvements?.map((imp, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-sm text-[#E2E8F0]/90 font-medium">{imp.explanation}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1"><Minus size={12} /> Before</p>
                      <pre className="bg-slate-800/80 border border-red-500/20 rounded-xl p-4 text-xs text-[#E2E8F0]/90 font-mono overflow-x-auto leading-5 whitespace-pre-wrap">{imp.before}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><Plus size={12} /> After</p>
                      <pre className="bg-slate-800/80 border border-emerald-500/20 rounded-xl p-4 text-xs text-[#E2E8F0]/90 font-mono overflow-x-auto leading-5 whitespace-pre-wrap">{imp.after}</pre>
                    </div>
                  </div>
                </div>
              ))}
              {!result.improvements?.length && <p className="text-[#E2E8F0]/50 text-sm">No refactoring suggestions.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CODE REVIEW PAGE ─────────────────────────────────────────────────────────
function CodeReviewPage({ onReviewComplete, addToast }) {
  const [code, setCode] = useState(SAMPLE_CODE.javascript);
  const [language, setLanguage] = useState("javascript");
  const [fileName, setFileName] = useState("paste.js");
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("paste");
  const fileRef = useRef();

  const LANGS = ["javascript", "typescript", "python", "java", "cpp"];

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const langMap = { js: "javascript", ts: "typescript", py: "python", java: "java", cpp: "cpp", jsx: "javascript", tsx: "typescript" };
    const detectedLang = langMap[ext] || "javascript";
    setLanguage(detectedLang);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setCode(e.target.result); setTab("paste"); };
    reader.readAsText(file);
  };

  const handleReview = async () => {
    if (!code.trim()) { addToast("Please enter some code to review", "error"); return; }
    setReviewing(true);
    setResult(null);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 90)), 400);
    try {
      const res = await reviewCodeWithAI(code, language);
      clearInterval(interval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setResult(res);
      onReviewComplete({ fileName, language, score: res.score, issues: (res.criticalIssues?.length || 0) + (res.securityIssues?.length || 0) });
      addToast(`Review complete! Score: ${res.score}/100`, "success");
    } catch (err) {
      clearInterval(interval);
      addToast("Review failed. Check API key or try again.", "error");
      console.error(err);
    }
    setReviewing(false);
    setProgress(0);
  };

  const handleExport = (format) => {
    if (!result) return;
    if (format === "json") {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `review-${fileName}.json`; a.click();
    } else if (format === "markdown") {
      const md = `# Code Review: ${fileName}\n\n**Score:** ${result.score}/100\n\n**Summary:** ${result.summary}\n\n## Critical Issues\n${result.criticalIssues?.map(i => `- **${i.title}**: ${i.description}`).join("\n")}\n\n## Security Issues\n${result.securityIssues?.map(i => `- **${i.title}**: ${i.vulnerability}`).join("\n")}\n\n## Performance Issues\n${result.performanceIssues?.map(i => `- **${i.title}**: ${i.bottleneck}`).join("\n")}`;
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `review-${fileName}.md`; a.click();
      addToast("Markdown exported!", "success");
    } else if (format === "pdf") {
      const content = `CodeGuard AI Review\nFile: ${fileName}\nScore: ${result.score}/100\n\nSummary:\n${result.summary}\n\nCritical Issues:\n${result.criticalIssues?.map(i => `- ${i.title}: ${i.description}`).join("\n")}\n\nSecurity Issues:\n${result.securityIssues?.map(i => `- ${i.title}: ${i.vulnerability}`).join("\n")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `review-${fileName}.txt`; a.click();
      addToast("Report exported!", "success");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#E2E8F0]">Code Review</h1>
        <p className="text-[#E2E8F0]/70 text-sm mt-1">Paste your code or upload a file for AI-powered analysis</p>
      </div>

      <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 border-b border-slate-700/40">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            {["paste", "upload"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize flex items-center justify-center ${tab === t ? "bg-slate-700 text-[#E2E8F0]" : "text-[#E2E8F0]/70 hover:text-[#E2E8F0]"}`}>
                {t === "paste" ? <><Code2 size={12} className="mr-1" />Paste Code</> : <><Upload size={12} className="mr-1" />Upload File</>}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="flex-1 md:flex-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-[#E2E8F0]/90 focus:outline-none focus:border-cyan-500/50 cursor-pointer">
              {LANGS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>

            <input value={fileName} onChange={e => setFileName(e.target.value)}
              className="flex-1 md:flex-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-[#E2E8F0]/90 focus:outline-none focus:border-cyan-500/50 min-w-0" placeholder="filename.js" />
          </div>

          <div className="flex gap-2 md:ml-auto">
            <button onClick={() => { setCode(SAMPLE_CODE[language] || SAMPLE_CODE.javascript); }} className="flex-1 md:flex-none text-xs text-[#E2E8F0]/70 hover:text-[#E2E8F0] px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 transition-colors">
              Load Sample
            </button>

            <button onClick={handleReview} disabled={reviewing}
              className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-[#E2E8F0] to-violet-600 text-[#E2E8F0] text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20">
              {reviewing ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              {reviewing ? "Analyzing..." : "Review"}
            </button>
          </div>
        </div>

        {/* Upload zone */}
        {tab === "upload" && (
          <div onClick={() => fileRef.current?.click()}
            className="m-4 h-40 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all">
            <Upload size={28} className="text-[#E2E8F0]/50" />
            <p className="text-sm text-[#E2E8F0]/70">Drop file here or click to browse</p>
            <p className="text-xs text-slate-600">JS, TS, PY, JAVA, CPP supported</p>
            <input ref={fileRef} type="file" accept=".js,.ts,.py,.java,.cpp,.jsx,.tsx" onChange={handleFile} className="hidden" />
          </div>
        )}

        {/* Editor */}
        <div className="h-80 bg-slate-950/60 relative overflow-hidden">
          <SimpleEditor value={code} onChange={setCode} language={language} />
        </div>

        {/* Progress */}
        {reviewing && (
          <div className="p-4 border-t border-slate-700/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#E2E8F0]/70">
              <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin text-[#E2E8F0]" />
                {progress < 30 ? "Parsing code structure..." : progress < 60 ? "Analyzing security patterns..." : progress < 85 ? "Checking best practices..." : "Finalizing review..."}
              </span>
              <span className="text-[#E2E8F0] font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} className="h-full bg-gradient-to-r from-[#E2E8F0] to-violet-600 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {reviewing && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {/* Results */}
      {result && !reviewing && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ReviewResults result={result} fileName={fileName} onExport={handleExport} />
        </motion.div>
      )}
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ reviews }) {
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("all");

  const filtered = reviews.filter(r => {
    const matchSearch = r.fileName?.toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === "all" || r.language?.toLowerCase() === filterLang;
    return matchSearch && matchLang;
  });

  const langs = ["all", ...new Set(reviews.map(r => r.language?.toLowerCase()).filter(Boolean))];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#E2E8F0]">Review History</h1>
        <p className="text-[#E2E8F0]/70 text-sm mt-1">Browse and filter all your past code reviews</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E2E8F0]/50" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by filename..."
            className="w-full bg-[#1A2B34]/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-[#E2E8F0] focus:outline-none focus:border-cyan-500/50 backdrop-blur-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#E2E8F0]/50" />
          {langs.map(l => (
            <button key={l} onClick={() => setFilterLang(l)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all border
                ${filterLang === l ? "bg-cyan-500/20 border-cyan-500/40 text-[#E2E8F0]" : "bg-slate-800 border-slate-700 text-[#E2E8F0]/70 hover:text-[#E2E8F0]"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1A2B34]/60 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-slate-700/40 text-xs font-semibold text-[#E2E8F0]/50 uppercase tracking-wider">
          <span className="col-span-2">File</span><span>Language</span><span>Date</span><span>Score</span>
        </div>
        <div className="divide-y divide-slate-700/20">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#E2E8F0]/50">
              <History size={32} className="mx-auto mb-3 opacity-40" />
              <p>No reviews found</p>
            </div>
          )}
          {filtered.map((r, i) => (
            <motion.div key={r.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors items-center">
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <FileCode size={14} className="text-[#E2E8F0]" />
                </div>
                <span className="text-sm font-medium text-[#E2E8F0] truncate">{r.fileName}</span>
              </div>
              <span className="text-xs text-[#E2E8F0]/70 bg-slate-800 px-2 py-0.5 rounded-full inline-block w-fit capitalize">{r.language}</span>
              <span className="text-xs text-[#E2E8F0]/50 flex items-center gap-1"><Clock size={11} /> {r.date}</span>
              <div className={`flex items-center gap-2 text-sm font-bold ${r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                <div className={`w-2 h-2 rounded-full ${r.score >= 80 ? "bg-emerald-400" : r.score >= 60 ? "bg-amber-400" : "bg-red-400"}`} />
                {r.score}/100
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

import './MagicRings.css';

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`;

function MagicRings({
  color = '#fc42ff',
  colorTwo = '#42fcff',
  speed = 1,
  ringCount = 6,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
}) {
  const mountRef = useRef(null);
  const propsRef = useRef(null);
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef = useRef(false);
  const burstRef = useRef(0);

  propsRef.current = {
    color, colorTwo, speed, ringCount, attenuation, lineThickness,
    baseRadius, radiusStep, scaleRate, opacity, noiseAmount,
    rotation, ringGap, fadeIn, fadeOut, followMouse, mouseInfluence,
    hoverScale, parallax, clickBurst,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true });
    } catch {
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseEnter = () => { isHoveredRef.current = true; };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    const onClick = () => { burstRef.current = 1; };

    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('mouseenter', onMouseEnter);
    mount.addEventListener('mouseleave', onMouseLeave);
    mount.addEventListener('click', onClick);

    let frameId;
    const animate = (t) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;
      hoverAmountRef.current += ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08;
      burstRef.current *= 0.95;
      if (burstRef.current < 0.001) burstRef.current = 0;

      uniforms.uTime.value = t * 0.001 * p.speed;
      uniforms.uAttenuation.value = p.attenuation;
      uniforms.uColor.value.set(p.color);
      uniforms.uColorTwo.value.set(p.colorTwo);
      uniforms.uLineThickness.value = p.lineThickness;
      uniforms.uBaseRadius.value = p.baseRadius;
      uniforms.uRadiusStep.value = p.radiusStep;
      uniforms.uScaleRate.value = p.scaleRate;
      uniforms.uRingCount.value = p.ringCount;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uNoiseAmount.value = p.noiseAmount;
      uniforms.uRotation.value = (p.rotation * Math.PI) / 180;
      uniforms.uRingGap.value = p.ringGap;
      uniforms.uFadeIn.value = p.fadeIn;
      uniforms.uFadeOut.value = p.fadeOut;
      uniforms.uMouse.value.set(smoothMouseRef.current[0], smoothMouseRef.current[1]);
      uniforms.uMouseInfluence.value = p.followMouse ? p.mouseInfluence : 0;
      uniforms.uHoverAmount.value = hoverAmountRef.current;
      uniforms.uHoverScale.value = p.hoverScale;
      uniforms.uParallax.value = p.parallax;
      uniforms.uBurst.value = p.clickBurst ? burstRef.current : 0;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('mouseenter', onMouseEnter);
      mount.removeEventListener('mouseleave', onMouseLeave);
      mount.removeEventListener('click', onClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={mountRef} className="magic-rings-container" style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined} />;
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#1A2B34] hidden md:block">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(226,232,240,0.03) 1px, transparent 0)", backgroundSize: "32px 32px", zIndex: 1 }} />
      <div className="absolute inset-0 z-0">
        <MagicRings
          color="#a855f7"
          colorTwo="#6366f1"
          ringCount={8}
          speed={0.6}
          attenuation={8}
          lineThickness={3}
          baseRadius={0.15}
          radiusStep={0.08}
          scaleRate={0.1}
          opacity={1}
          blur={0}
          noiseAmount={0.02}
          followMouse={true}
          mouseInfluence={0.15}
          parallax={0.1}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cg_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleSetUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem("cg_user", JSON.stringify(u));
    else localStorage.removeItem("cg_user");
  }, []);
  const [page, setPage] = useState("dashboard");
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
  const [toasts, setToasts] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const handleReviewComplete = useCallback((reviewData) => {
    const newReview = {
      id: Date.now(),
      fileName: reviewData.fileName,
      date: new Date().toISOString().split("T")[0],
      score: reviewData.score,
      language: reviewData.language.charAt(0).toUpperCase() + reviewData.language.slice(1),
      issues: reviewData.issues,
    };
    setReviews(prev => [newReview, ...prev]);
  }, []);

  if (!user) return <><AuthPage onLogin={handleSetUser} addToast={addToast} /><Toast toasts={toasts} remove={removeToast} /></>;

  return (
    <div className="min-h-screen bg-[#0f172a] md:bg-transparent flex flex-col md:flex-row">
      <AnimatedBackground />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#1A2B34] border-b border-slate-700/50 p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#1A2B34] border border-slate-700/50 shadow-md">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-black text-[#E2E8F0] tracking-tight">CodeGuard<span className="text-[#E2E8F0]"> AI</span></span>
        </div>
        <button onClick={() => { handleSetUser(null); addToast("Signed out", "info"); }} className="text-[#E2E8F0]/70 hover:text-red-400 p-2">
          <LogOut size={18} />
        </button>
      </div>

      <Sidebar page={page} setPage={setPage} user={user} onLogout={() => { handleSetUser(null); addToast("Signed out", "info"); }} collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className="flex-1 overflow-y-auto relative z-10 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            {page === "dashboard" && <Dashboard reviews={reviews} setPage={setPage} />}
            {page === "review" && <CodeReviewPage onReviewComplete={handleReviewComplete} addToast={addToast} />}
            {page === "history" && <HistoryPage reviews={reviews} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
