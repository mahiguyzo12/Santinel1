import { RadicalizationAnalysis, OsintReport } from '../types';

// Dynamically get API URL from storage or default to localhost
const getApiUrl = () => {
  return localStorage.getItem('santinel_api_url') || 'http://localhost:3001';
};

// Helper to construct full path
const api = (path: string) => `${getApiUrl()}/api${path}`;

// --- REAL OPERATIONAL SERVICES ---

export const analyzeRadicalization = async (text: string): Promise<RadicalizationAnalysis> => {
  const response = await fetch(api('/ai/radicalization'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erreur critique du serveur d'analyse.");
  }
  return await response.json();
};

export const generateOsintSummary = async (query: string): Promise<OsintReport> => {
  const response = await fetch(api('/ai/osint-summary'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error("Impossible de joindre le nœud d'intelligence OSINT.");
  }
  return await response.json();
};

export const runOsintTool = async (toolName: string, query: string): Promise<string> => {
  const response = await fetch(api('/ai/osint-tool'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: toolName, query })
  });

  if (!response.ok) {
    throw new Error(`Echec de l'exécution du processus distant : ${toolName}`);
  }
  const data = await response.json();
  return data.result;
};

// --- ACTION METHODS (REAL IN-MEMORY PERSISTENCE) ---

export const archiveOsintReport = async (report: OsintReport, target: string) => {
  const response = await fetch(api('/actions/archive'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, target })
  });
  if (!response.ok) throw new Error("Echec de l'archivage sécurisé.");
  return await response.json();
};

export const shareOsintReport = async (target: string) => {
  const response = await fetch(api('/actions/share'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: target })
  });
  if (!response.ok) throw new Error("Génération de lien sécurisé échouée.");
  return await response.json();
};

export const createOsintAlert = async (target: string) => {
  const response = await fetch(api('/actions/alert'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target })
  });
  if (!response.ok) throw new Error("Impossible d'inscrire la cible au monitoring.");
  return await response.json();
};