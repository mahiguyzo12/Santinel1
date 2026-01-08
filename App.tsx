import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from './types';
import Dashboard from './components/Dashboard';
import OsintModule from './components/OsintModule';
import RadicalizationAnalyzer from './components/RadicalizationAnalyzer';
import CyberDefense from './components/CyberDefense';
import Forensics from './components/Forensics';
import TerminalModule from './components/TerminalModule';
import ToolStore from './components/ToolStore';
import { 
  LayoutDashboard, 
  Globe, 
  Search, 
  ShieldAlert, 
  Fingerprint, 
  Shield,
  Grid,
  Terminal,
  Box,
  Cpu,
  Wifi,
  Battery,
  LogOut,
  ChevronLeft,
  Key,
  Check,
  Smartphone,
  Copy,
  Play,
  Download,
  HardDrive,
  Zap,
  Globe2
} from 'lucide-react';

// --- SERVER CODE PAYLOAD GENERATION (WITH NODE-PTY) ---
const getServerPayload = () => {
  const serverCode = `
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as pty from 'node-pty';
import { GoogleGenAI, Type } from '@google/genai';
import os from 'os';
import path from 'path';

const app = express();
const httpServer = createServer(app);
// Setup Socket.IO with CORS
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- AI CONFIG ---
const DB = { archives: [], alerts: [], sharedLinks: [] };
let ai = null;

const initAI = () => {
  if (process.env.API_KEY) {
    try {
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      console.log("[SYSTEM] AI Engine Initialized");
    } catch (e) { console.error(e); }
  }
};
initAI();

// --- SOCKET.IO PTY TERMINAL ---
io.on('connection', (socket) => {
  console.log('[TERMINAL] Client connected:', socket.id);
  
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  // Spawn a real pseudo-terminal
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  // Pipe PTY output to Socket.IO
  ptyProcess.onData((data) => {
    socket.emit('pty-output', data);
  });

  // Pipe Socket.IO input to PTY
  socket.on('input', (data) => {
    ptyProcess.write(data);
  });

  socket.on('resize', (size) => {
    if (size && size.cols && size.rows) {
       try { ptyProcess.resize(size.cols, size.rows); } catch(e){}
    }
  });

  socket.on('disconnect', () => {
    console.log('[TERMINAL] Client disconnected');
    ptyProcess.kill();
  });
});

// --- API ROUTES ---

app.post('/api/config/setup', (req, res) => {
  process.env.API_KEY = req.body.apiKey;
  initAI();
  res.json({ success: true, modules: { ai: 'CONNECTED' } });
});

app.get('/api/health', (req, res) => {
  res.json({
    system: 'ONLINE',
    modules: {
      ai: (ai && process.env.API_KEY) ? 'CONNECTED' : 'MISSING_KEY',
      database: 'MOUNTED (RAM)',
      network: 'ACTIVE'
    }
  });
});

app.post('/api/ai/radicalization', async (req, res) => {
  if (!ai) return res.status(503).json({ error: "No AI Config" });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Analyze threat in: " + req.body.text,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start Server
httpServer.listen(PORT, '0.0.0.0', () => console.log('SANTINEL MOBILE CORE ONLINE ON PORT ' + PORT));
`;

  const escapedCode = serverCode.replace(/'/g, "'\\''");

  // COMMAND UPDATE: Includes python, make, clang for compiling node-pty
  return `
pkg update -y && pkg install nodejs python make clang build-essential -y && mkdir -p santinel && cd santinel && npm init -y && npm pkg set type="module" && npm install express cors @google/genai socket.io node-pty && echo '${escapedCode}' > server.js && clear && echo "=== SANTINEL DEPLOYED ===" && echo "Starting Server..." && node server.js
`.trim();
};

// --- SYSTEM INSTALLER COMPONENT ---
const SystemInstaller = ({ onRetry }: { onRetry: () => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const getInitialIp = () => {
    try {
      return localStorage.getItem('santinel_api_url') || 'http://localhost:3001';
    } catch {
      return 'http://localhost:3001';
    }
  };
  const [ip, setIp] = useState(getInitialIp());

  const payload = getServerPayload();

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setActiveStep(2), 1000);
  };

  const saveIp = () => {
     let formattedIp = ip.trim();
    if (!formattedIp.startsWith('http')) formattedIp = `http://${formattedIp}`;
    if (!formattedIp.includes(':3001')) formattedIp = `${formattedIp}:3001`; 
    
    try {
      localStorage.setItem('santinel_api_url', formattedIp);
    } catch (e) {
      console.warn("Storage access denied");
    }
    onRetry();
  };

  return (
    <div className="w-full max-w-3xl bg-black border border-gov-700 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] font-mono text-sm relative">
       <div className="bg-gov-900 border-b border-gov-700 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-400 text-xs">SANTINEL_INSTALLER.exe</div>
          <div className="w-8"></div>
       </div>

       <div className="p-6 bg-black/95 min-h-[400px] flex flex-col">
          <div className="mb-6 space-y-1 text-gray-400 border-b border-gray-800 pb-4">
             <div><span className="text-gov-accent">checking</span> dependencies... <span className="text-red-500">[MISSING CORE]</span></div>
             <div><span className="text-gov-accent">target</span> environment... <span className="text-blue-400">[TERMUX/NODE-PTY]</span></div>
             <div><span className="text-gov-accent">protocol</span>... REAL-TIME WEBSOCKET</div>
          </div>

          <div className="flex-1 space-y-8">
             {/* Step 0 */}
             <div className={`transition-all duration-500 ${activeStep === 0 ? 'opacity-100 translate-x-0' : 'opacity-30 blur-[1px]'}`} onClick={() => setActiveStep(0)}>
                <h3 className="text-white font-bold mb-2 flex items-center">
                   <span className="bg-gov-700 text-white px-2 rounded mr-2">1</span> 
                   PRÉPARATION (COMPILATEURS)
                </h3>
                <p className="text-gray-500 mb-2 ml-9">Installation de Python/Make/Clang requise pour compiler node-pty.</p>
                {activeStep === 0 && (
                  <div className="ml-9 flex space-x-4 mt-3">
                     <a href="https://github.com/termux/termux-app/releases/latest" target="_blank" className="text-gov-accent underline hover:text-white">
                        [Télécharger Termux]
                     </a>
                     <button onClick={() => setActiveStep(1)} className="bg-gov-800 px-3 py-1 rounded text-white border border-gov-600 hover:bg-gov-700">
                        Suivant &gt;&gt;
                     </button>
                  </div>
                )}
             </div>

             {/* Step 1 */}
             <div className={`transition-all duration-500 ${activeStep === 1 ? 'opacity-100 translate-x-0' : 'opacity-30 blur-[1px]'}`} onClick={() => setActiveStep(1)}>
                <h3 className="text-white font-bold mb-2 flex items-center">
                   <span className="bg-gov-700 text-white px-2 rounded mr-2">2</span> 
                   INJECTION & COMPILATION
                </h3>
                {activeStep === 1 && (
                  <div className="ml-9">
                     <div className="bg-gray-900 border border-gray-700 p-3 rounded relative group">
                        <code className="text-green-500 text-xs break-all opacity-80 block max-h-24 overflow-hidden">
                           pkg install python make clang... npm install node-pty...
                        </code>
                        <div className="absolute top-2 right-2">
                           <button onClick={handleCopy} className={`flex items-center px-3 py-1 rounded text-xs font-bold ${copied ? 'bg-green-600 text-white' : 'bg-gov-accent text-black'}`}>
                              {copied ? 'COPIÉ' : 'COPIER LA COMMANDE'}
                           </button>
                        </div>
                     </div>
                     <p className="text-xs text-yellow-600 mt-2">⚠ La compilation de node-pty peut prendre 1 à 2 minutes sur mobile.</p>
                  </div>
                )}
             </div>

             {/* Step 2 */}
             <div className={`transition-all duration-500 ${activeStep === 2 ? 'opacity-100 translate-x-0' : 'opacity-30 blur-[1px]'}`} onClick={() => setActiveStep(2)}>
                <h3 className="text-white font-bold mb-2 flex items-center">
                   <span className="bg-gov-700 text-white px-2 rounded mr-2">3</span> 
                   LIAISON WEBSOCKET
                </h3>
                {activeStep === 2 && (
                   <div className="ml-9">
                      <p className="text-gray-500 mb-2">Entrez l'IP (laissez localhost si même appareil).</p>
                      <div className="flex space-x-2">
                         <input 
                           type="text" 
                           value={ip} 
                           onChange={(e) => setIp(e.target.value)}
                           className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded flex-1 font-mono focus:border-gov-accent outline-none"
                         />
                         <button onClick={saveIp} className="bg-gov-success text-black font-bold px-4 py-2 rounded hover:bg-green-400">
                            CONNECTER
                         </button>
                      </div>
                   </div>
                )}
             </div>

          </div>
       </div>
    </div>
  );
};

// --- SETUP WIZARD (API KEY) ---
const SetupWizard = ({ onConfigured }: { onConfigured: () => void }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'ERROR' | 'SUCCESS'>('IDLE');
  
  const getApiUrl = () => {
    try {
      return localStorage.getItem('santinel_api_url') || 'http://localhost:3001';
    } catch {
      return 'http://localhost:3001';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SENDING');
    try {
      const res = await fetch(`${getApiUrl()}/api/config/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        setStatus('SUCCESS');
        setTimeout(onConfigured, 1500);
      } else {
        setStatus('ERROR');
      }
    } catch (err) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="w-full max-w-lg bg-gov-900 border border-gov-accent/50 rounded-lg p-6 shadow-[0_0_50px_rgba(14,165,233,0.1)] animate-fade-in relative overflow-hidden">
      <div className="flex items-center mb-6 text-gov-accent border-b border-gov-700 pb-4">
        <Key className="mr-3 animate-pulse" size={24} />
        <div>
          <h2 className="text-xl font-bold font-mono tracking-wider">ACTIVATION DU MODULE IA</h2>
          <p className="text-[10px] text-gray-400 uppercase">Liaison serveur établie. Token requis.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-xs text-gov-400 font-mono uppercase">Clé API Google Gemini</label>
          <div className="relative">
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setStatus('IDLE'); }}
              className="w-full bg-black border border-gov-700 rounded p-3 text-white font-mono focus:border-gov-accent outline-none tracking-widest"
              placeholder="AIzaSy..."
              autoFocus
            />
            {status === 'SUCCESS' && <Check className="absolute right-3 top-3 text-green-500" size={18} />}
          </div>
        </div>
        <button 
          type="submit" 
          disabled={status === 'SENDING' || status === 'SUCCESS' || apiKey.length < 5}
          className={`w-full py-3 rounded font-bold font-mono text-sm tracking-widest transition-all ${
            status === 'SUCCESS' ? 'bg-green-600 text-white' :
            status === 'ERROR' ? 'bg-red-600 text-white' :
            'bg-gov-accent hover:bg-sky-400 text-black'
          }`}
        >
          {status === 'SENDING' ? 'PROVISIONNEMENT...' : 
           status === 'SUCCESS' ? 'SYSTÈME OPÉRATIONNEL' : 
           status === 'ERROR' ? 'ÉCHEC' : 'ACTIVER'}
        </button>
      </form>
    </div>
  );
};

// --- BOOT SEQUENCE COMPONENT ---
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>(["INITIALIZING KERNEL..."]);
  const [bootState, setBootState] = useState<'INIT' | 'CHECKING_HOST' | 'INSTALLER_MODE' | 'SETUP_REQUIRED' | 'READY'>('INIT');
  const [retryCount, setRetryCount] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const getApiUrl = () => {
    try {
      return localStorage.getItem('santinel_api_url') || 'http://localhost:3001';
    } catch {
      return 'http://localhost:3001';
    }
  };

  useEffect(() => {
    let mounted = true;
    const addLog = (msg: string, type: 'INFO'|'OK'|'ERR' = 'INFO') => {
       const prefix = type === 'OK' ? '[OK] ' : type === 'ERR' ? '[ERR] ' : '';
       setLogs(prev => [...prev, `${prefix}${msg}`]);
    };

    const checkServer = async () => {
      const apiUrl = getApiUrl();
      setBootState('CHECKING_HOST');
      if(retryCount === 0) addLog(`MOUNTING FILESYSTEM AT ${apiUrl}...`);

      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${apiUrl}/api/health`, { signal: controller.signal });
        clearTimeout(id);

        if (res.ok) {
           const data = await res.json();
           if (data.modules.ai === 'MISSING_KEY') {
              addLog("CORE CONNECTED.", 'OK');
              addLog("AI MODULE NOT CONFIGURED.", 'ERR');
              setProgress(90);
              setTimeout(() => { if(mounted) setBootState('SETUP_REQUIRED'); }, 800);
           } else {
              setProgress(100);
              addLog("ALL SYSTEMS GO.", 'OK');
              setTimeout(() => { if(mounted) onComplete(); }, 800);
           }
        } else {
           throw new Error("Server error");
        }
      } catch (e) {
         if (retryCount > 2) {
            addLog("CRITICAL FAILURE: CORE NOT FOUND.", 'ERR');
            setTimeout(() => { if(mounted) setBootState('INSTALLER_MODE'); }, 1000);
         } else {
            addLog("CONNECTION REFUSED. RETRYING...", 'ERR');
            setProgress(p => p + 10);
            setTimeout(() => { if(mounted) setRetryCount(c => c + 1); }, 1500);
         }
      }
    };

    if (bootState === 'INIT') {
       setTimeout(() => { setProgress(20); checkServer(); }, 1000);
    } else if (bootState === 'CHECKING_HOST' && retryCount > 0) {
       checkServer();
    }

    return () => { mounted = false; };
  }, [retryCount]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center font-mono text-gov-accent select-none">
      
      {bootState === 'INSTALLER_MODE' ? (
         <SystemInstaller onRetry={() => { setBootState('INIT'); setRetryCount(0); setLogs([]); setProgress(0); }} />
      ) : bootState === 'SETUP_REQUIRED' ? (
         <SetupWizard onConfigured={() => { setBootState('INIT'); setRetryCount(0); }} />
      ) : (
        <div className="w-full max-w-lg p-8 space-y-8">
           <div className="flex flex-col items-center animate-pulse">
              <Shield size={64} className="text-white mb-4" />
              <h1 className="text-4xl font-black tracking-widest text-white">SANTINEL</h1>
              <p className="text-[10px] tracking-[0.6em] text-gov-accent mt-2">SECURE OPERATING SYSTEM</p>
           </div>
           
           <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                 <span>BOOTLOADER V4.2</span>
                 <span>{progress}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded overflow-hidden">
                 <div className="h-full bg-gov-accent transition-all duration-300" style={{width: `${progress}%`}}></div>
              </div>
           </div>

           <div className="h-32 bg-black/50 border border-gray-900 rounded p-2 overflow-y-auto custom-scrollbar font-mono text-[10px] text-gray-500">
              {logs.map((l, i) => (
                 <div key={i} className={l.includes('[ERR]') ? 'text-red-500' : l.includes('[OK]') ? 'text-green-500' : ''}>{l}</div>
              ))}
              <div ref={logsEndRef}></div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
const WorkstationShell = ({ title, icon: Icon, onBack, children, color="text-white", statusText="OPERATIONAL" }: any) => (
  <div className="flex flex-col h-screen w-screen bg-[#05080f] text-gray-200 font-sans overflow-hidden">
    <div className="h-12 bg-gov-900 border-b border-gov-700 flex items-center justify-between px-4 shrink-0 shadow-md z-50">
        <div className="flex items-center space-x-4">
            {onBack ? (
               <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gov-800 transition-colors">
                  <ChevronLeft size={16} className="mr-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">RETOUR</span>
               </button>
            ) : (
               <div className="flex items-center px-2 py-1">
                  <Shield size={18} className="text-white mr-2" />
                  <span className="text-sm font-black tracking-widest text-white">SANTINEL</span>
               </div>
            )}
            <div className="h-6 w-px bg-gov-700 mx-2"></div>
            <div className={`flex items-center space-x-2 ${color}`}>
               <Icon size={16} />
               <span className="font-mono text-sm font-bold uppercase tracking-wider">{title}</span>
            </div>
        </div>
        <div className="flex items-center space-x-6 text-xs font-mono text-gray-500">
            <div className="flex items-center text-gov-success"><Wifi size={14} className="mr-2" /> SECURE</div>
            <div className="flex items-center"><Cpu size={14} className="mr-2" /> 12%</div>
            <div className="flex items-center"><Battery size={14} className="mr-2" /> 100%</div>
        </div>
    </div>
    <div className="flex-1 overflow-hidden relative bg-[#0b0f19]">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-0 z-10">{children}</div>
    </div>
    <div className="h-6 bg-gov-950 border-t border-gov-800 flex items-center justify-between px-4 text-[10px] text-gov-600 font-mono z-50">
       <span className="uppercase">Santinel Kernel v4.2.0</span>
       <span className="flex items-center">
         <span className={`w-2 h-2 rounded-full mr-2 ${statusText === 'OPERATIONAL' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
         STATUS: {statusText}
       </span>
    </div>
  </div>
);

// Compact Grid Tile Component
const LaunchTile = ({ icon: Icon, label, desc, onClick, colorClass = "text-gov-accent" }: any) => (
  <button onClick={onClick} className="group relative flex flex-col items-center justify-center p-6 bg-gov-900 border border-gov-700/50 hover:border-gov-500 hover:bg-gov-800 transition-all duration-200 w-full h-full aspect-square md:aspect-auto md:h-48">
    <div className={`mb-4 p-4 rounded-full bg-gov-950 border border-gov-800 group-hover:scale-110 transition-transform duration-200 ${colorClass}`}>
      <Icon size={32} />
    </div>
    <h3 className="text-lg font-bold text-gray-200 mb-1 tracking-wide group-hover:text-white uppercase font-mono">{label}</h3>
    <p className="text-xs text-gray-500 text-center leading-tight opacity-60 group-hover:opacity-100 px-4">{desc}</p>
    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-gov-600 opacity-0 group-hover:opacity-100"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-gov-600 opacity-0 group-hover:opacity-100"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-gov-600 opacity-0 group-hover:opacity-100"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-gov-600 opacity-0 group-hover:opacity-100"></div>
  </button>
);

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [activeWindow, setActiveWindow] = useState<ViewState | null>(null);
  const [terminalCmd, setTerminalCmd] = useState<string | undefined>(undefined);

  const launchTerminalWithCmd = (cmd: string) => {
    setTerminalCmd(cmd);
    setActiveWindow(ViewState.TERMINAL);
  };

  const handleClose = () => {
    setActiveWindow(null);
    setTerminalCmd(undefined);
  };

  if (isBooting) return <BootSequence onComplete={() => setIsBooting(false)} />;

  if (activeWindow) {
    switch (activeWindow) {
      case ViewState.DASHBOARD: return <WorkstationShell title="Command Center" icon={LayoutDashboard} onBack={handleClose}><div className="p-6 h-full"><Dashboard /></div></WorkstationShell>;
      case ViewState.OSINT: return <WorkstationShell title="OSINT Monitor" icon={Globe} onBack={handleClose} color="text-blue-400"><div className="p-6 h-full"><OsintModule /></div></WorkstationShell>;
      case ViewState.RADICALIZATION: return <WorkstationShell title="Analyse Sémantique" icon={Search} onBack={handleClose} color="text-yellow-400"><div className="p-6 h-full"><RadicalizationAnalyzer /></div></WorkstationShell>;
      case ViewState.CYBER: return <WorkstationShell title="Cyber Défense" icon={ShieldAlert} onBack={handleClose} color="text-red-400" statusText="THREAT DETECTED"><div className="p-6 h-full"><CyberDefense /></div></WorkstationShell>;
      case ViewState.FORENSICS: return <WorkstationShell title="Forensique" icon={Fingerprint} onBack={handleClose} color="text-purple-400"><div className="p-6 h-full"><Forensics /></div></WorkstationShell>;
      case ViewState.TOOL_STORE: return <WorkstationShell title="Arsenal" icon={Box} onBack={handleClose} color="text-orange-400"><div className="p-6 h-full"><ToolStore onInstall={launchTerminalWithCmd} /></div></WorkstationShell>;
      case ViewState.TERMINAL: return <WorkstationShell title="Root Terminal" icon={Terminal} onBack={handleClose} color="text-green-500" statusText="SHELL ACTIVE"><div className="h-full bg-black"><TerminalModule initialCmd={terminalCmd} /></div></WorkstationShell>;
      default: return null;
    }
  }

  return (
    <WorkstationShell title="LAUNCHER" icon={Grid} statusText="IDLE">
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="w-full max-w-6xl">
           <div className="mb-8 border-b border-gov-800 pb-2"><h2 className="text-gov-400 text-xs font-mono uppercase tracking-widest">Modules</h2></div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <LaunchTile icon={LayoutDashboard} label="Command Center" desc="Vue globale" onClick={() => setActiveWindow(ViewState.DASHBOARD)} />
                <LaunchTile icon={Globe} label="OSINT" desc="Renseignement" onClick={() => setActiveWindow(ViewState.OSINT)} colorClass="text-blue-400" />
                <LaunchTile icon={Search} label="Analyse" desc="Sémantique" onClick={() => setActiveWindow(ViewState.RADICALIZATION)} colorClass="text-yellow-400" />
                <LaunchTile icon={ShieldAlert} label="Cyber" desc="Défense" onClick={() => setActiveWindow(ViewState.CYBER)} colorClass="text-red-400" />
                <LaunchTile icon={Fingerprint} label="Forensique" desc="Preuves" onClick={() => setActiveWindow(ViewState.FORENSICS)} colorClass="text-purple-400" />
                 <LaunchTile icon={Box} label="Arsenal" desc="Outils" onClick={() => setActiveWindow(ViewState.TOOL_STORE)} colorClass="text-orange-400" />
                 <LaunchTile icon={Terminal} label="Terminal" desc="Root Shell" onClick={() => setActiveWindow(ViewState.TERMINAL)} colorClass="text-green-500" />
                 <div className="hidden md:flex items-center justify-center border border-dashed border-gov-800 rounded-lg opacity-30"><div className="text-center"><div className="text-xs text-gray-600 font-mono mb-1">SLOT VIDE</div></div></div>
            </div>
        </div>
      </div>
    </WorkstationShell>
  );
};

export default App;