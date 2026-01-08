export enum ThreatLevel {
  LOW = 'BAS',
  MODERATE = 'MODÉRÉ',
  HIGH = 'ÉLEVÉ',
  CRITICAL = 'CRITIQUE'
}

export interface OsintResult {
  id: string;
  source: string;
  timestamp: string;
  content: string;
  sentiment: 'Positif' | 'Neutre' | 'Négatif';
  entities: string[];
  riskScore: number;
}

export interface RadicalizationAnalysis {
  riskScore: number; // 0-100
  flags: string[];
  justification: string;
  category: 'Politique' | 'Religieux' | 'Idéologique' | 'Rien à signaler';
  requiresHumanReview: boolean;
}

export interface ForensicsLog {
  id: string;
  evidenceId: string;
  action: string;
  operator: string;
  timestamp: string;
  hash: string;
}

export interface CyberAlert {
  id: string;
  type: string;
  severity: ThreatLevel;
  timestamp: string;
  status: 'Active' | 'Investigating' | 'Resolved';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  OSINT = 'OSINT',
  RADICALIZATION = 'RADICALIZATION',
  CYBER = 'CYBER',
  FORENSICS = 'FORENSICS',
  TERMINAL = 'TERMINAL',
  SETTINGS = 'SETTINGS',
  TOOL_STORE = 'TOOL_STORE'
}

export interface OsintGraphNode {
  id: string;
  label: string;
  type: 'Person' | 'Organization' | 'Location' | 'Event' | 'Other';
}

export interface OsintGraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface OsintReport {
  summary: string;
  graph: {
    nodes: OsintGraphNode[];
    links: OsintGraphLink[];
  };
}