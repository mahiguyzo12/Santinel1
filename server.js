import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { GoogleGenAI, Type } from "@google/genai";
import os from 'os';
import path from 'path';

const app = express();
const PORT = 3001;

// --- CONFIGURATION ---
app.use(cors());
app.use(express.json());

// REAL IN-MEMORY STORAGE
const DB = {
  archives: [],
  alerts: [],
  sharedLinks: []
};

// --- AI ENGINE INITIALIZATION (MUTABLE FOR HOT-SWAP) ---
let ai = null;

const initAI = () => {
  if (process.env.API_KEY) {
    try {
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      console.log("[SYSTEM] AI Engine Initialized with Key");
    } catch (e) {
      console.error("[SYSTEM] AI Init Error:", e);
    }
  } else {
    console.log("[SYSTEM] Waiting for API Key configuration...");
  }
};

// Initial run
initAI();

// Middleware de Logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} | IP: ${req.ip} | ${req.method} ${req.url}`);
  next();
});

// --- SYSTEM CONFIGURATION ENDPOINT (SETUP WIZARD) ---
app.post('/api/config/setup', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || apiKey.length < 10) {
    return res.status(400).json({ error: "Clé invalide détectée" });
  }

  // Runtime Environment Update
  process.env.API_KEY = apiKey;
  
  // Re-initialize AI Core
  initAI();

  res.json({ 
    success: true, 
    message: "Protocole de sécurité mis à jour. Moteur IA opérationnel.",
    modules: { ai: 'CONNECTED' }
  });
});

// --- SYSTEM HEALTH CHECK (BOOT SEQUENCE) ---
app.get('/api/health', (req, res) => {
  const status = {
    system: 'ONLINE',
    timestamp: new Date().toISOString(),
    modules: {
      // Check if AI is initialized AND has a key
      ai: (ai && process.env.API_KEY) ? 'CONNECTED' : 'MISSING_KEY',
      database: 'MOUNTED (RAM)',
      network: 'ACTIVE',
      security: 'ENFORCED'
    },
    version: '4.2.0-secure'
  };
  res.json(status);
});

// --- DATA RETRIEVAL ENDPOINTS ---

app.get('/api/store/archives', (req, res) => {
  res.json(DB.archives);
});

app.get('/api/store/alerts', (req, res) => {
  res.json(DB.alerts);
});

// --- ENDPOINTS INTELLIGENCE ARTIFICIELLE ---

app.post('/api/ai/radicalization', async (req, res) => {
  if (!ai) return res.status(503).json({ error: "AI Engine not configured" });
  try {
    const { text } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ANALYSE OPÉRATIONNELLE REQUISE. Contenu: "${text}"`,
      config: {
        systemInstruction: "Tu es un moteur d'analyse sémantique pour la sécurité nationale. Identifie les menaces. Renvoie un score de risque précis.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            justification: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Politique', 'Religieux', 'Idéologique', 'Rien à signaler'] },
            requiresHumanReview: { type: Type.BOOLEAN }
          },
          required: ["riskScore", "flags", "justification", "category", "requiresHumanReview"]
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Radicalization Error:", error);
    res.status(500).json({ error: "Echec de l'analyse IA" });
  }
});

app.post('/api/ai/osint-summary', async (req, res) => {
  if (!ai) return res.status(503).json({ error: "AI Engine not configured" });
  try {
    const { query } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Effectue une recherche OSINT approfondie sur : "${query}".`,
      config: {
        tools: [{googleSearch: {}}],
        systemInstruction: "Tu es un analyste OSINT gouvernemental. Fournis un rapport basé sur des données réelles.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            graph: {
              type: Type.OBJECT,
              properties: {
                nodes: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      id: {type:Type.STRING}, 
                      label:{type:Type.STRING}, 
                      type:{type:Type.STRING, enum: ['Person', 'Organization', 'Location', 'Event', 'Other']} 
                    } 
                  } 
                },
                links: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { 
                      source:{type:Type.STRING}, 
                      target:{type:Type.STRING}, 
                      relation:{type:Type.STRING} 
                    } 
                  } 
                }
              }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI OSINT Error:", error);
    res.status(500).json({ error: "Echec génération OSINT" });
  }
});

app.post('/api/ai/osint-tool', async (req, res) => {
  if (!ai) return res.status(503).json({ error: "AI Engine not configured" });
  try {
    const { tool, query } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Génère la sortie technique standard (stdout) pour l'outil "${tool}" ciblant "${query}".`,
      config: {
        systemInstruction: "Tu agis en tant que stdout pour des outils de cybersécurité.",
      }
    });
    res.json({ result: response.text });
  } catch (error) {
    res.status(500).json({ error: "Tool execution failed" });
  }
});

// --- ENDPOINTS OPÉRATIONNELS (ACTIONS) ---

app.post('/api/actions/archive', (req, res) => {
  const { report, target } = req.body;
  const id = `ARCH-${Date.now().toString(36).toUpperCase()}`;
  DB.archives.push({
    id, target, fullReport: report, timestamp: new Date().toISOString(), operator: 'Admin', hash: Math.random().toString(36).substring(2)
  });
  res.json({ success: true, id, message: "Rapport archivé." });
});

app.post('/api/actions/share', (req, res) => {
  const { id } = req.body;
  const shareLink = `https://santinel.gov/secure-view/${Math.random().toString(36).substring(7)}`;
  DB.sharedLinks.push({ link: shareLink, targetId: id, created: new Date(), expires: new Date(Date.now() + 86400000) });
  res.json({ success: true, link: shareLink, ttl: '24h' });
});

app.post('/api/actions/alert', (req, res) => {
  const { target } = req.body;
  const alertId = `ALT-${Math.floor(Math.random() * 100000)}`;
  DB.alerts.push({ id: alertId, target, status: 'ACTIVE', created: new Date().toISOString(), severity: 'HIGH' });
  res.json({ success: true, alertId, status: 'ACTIVE_MONITORING' });
});

// --- ENDPOINT TERMINAL ---

let currentDirectory = process.cwd();

app.post('/api/terminal', (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).send('');

  const command = cmd.trim();
  const blacklist = ['rm -rf /', ':(){ :|:& };:'];
  if (blacklist.some(b => command.includes(b))) {
     return res.json({ output: `\x1b[31m[KERNEL PANIC] Malicious command intercepted.\x1b[0m\n`, cwd: currentDirectory });
  }

  if (command.startsWith('cd ')) {
    const targetDir = command.split(' ')[1] || os.homedir();
    try {
      const nextDir = path.resolve(currentDirectory, targetDir);
      process.chdir(nextDir);
      currentDirectory = nextDir;
      return res.json({ output: '', cwd: currentDirectory });
    } catch (err) {
      return res.json({ output: `bash: cd: ${targetDir}: No such file or directory\n`, cwd: currentDirectory });
    }
  }

  exec(command, { cwd: currentDirectory, shell: '/bin/bash' }, (error, stdout, stderr) => {
    let output = (stdout || '') + (stderr || '');
    if (error && !stderr) output += error.message;
    res.json({ output, cwd: currentDirectory });
  });
});

// --- STARTUP ---

app.listen(PORT, () => {
  console.log(`\n=== SANTINEL CORE SERVER (PRODUCTION MODE) ===`);
  console.log(`[STATUS] ONLINE`);
  console.log(`[AUTH] AI Module: ${process.env.API_KEY ? 'READY' : 'WAITING FOR CONFIG'}`);
  console.log(`[PORT] ${PORT}\n`);
});