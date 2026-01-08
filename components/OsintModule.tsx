import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateOsintSummary, runOsintTool, archiveOsintReport, shareOsintReport, createOsintAlert } from '../services/geminiService';
import { Globe, Search, FileText, Database, Share2, Network, User, Building, MapPin, Calendar, HelpCircle, Move, Filter, CheckSquare, Square, Terminal, Clock, Trash2, RotateCcw, Archive, Bell, CheckCircle, BookOpen, Play } from 'lucide-react';
import { OsintReport } from '../types';

// --- OSINT GLOSSARY DEFINITIONS ---
const OSINT_GLOSSARY: Record<string, string> = {
  "IP": "Internet Protocol Address. Identifiant numérique unique attribué à chaque appareil connecté à un réseau informatique utilisant l'Internet Protocol.",
  "WHOIS": "Protocole de requête permettant d'obtenir les informations d'enregistrement d'un nom de domaine ou d'une adresse IP (propriétaire, contact, date d'expiration).",
  "DNS": "Domain Name System. Le 'carnet d'adresses' d'Internet qui traduit les noms de domaine lisibles par l'homme en adresses IP.",
  "METADATA": "Données décrivant d'autres données. Dans les fichiers (images, docs), elles peuvent révéler l'auteur, la localisation GPS, le logiciel utilisé et la date de création.",
  "SOCIAL ENGINEERING": "Manipulation psychologique des personnes pour qu'elles effectuent des actions ou divulguent des informations confidentielles.",
  "DARK WEB": "Partie du World Wide Web existant sur des darknets, réseaux superposés nécessitant des logiciels spécifiques (comme Tor) et offrant l'anonymat.",
  "CVE": "Common Vulnerabilities and Exposures. Une liste de failles de sécurité informatique connues publiquement.",
  "BOTNET": "Réseau d'ordinateurs infectés par des logiciels malveillants et contrôlés à distance par un pirate.",
  "HASH": "Empreinte numérique unique d'un fichier ou d'une donnée, générée par un algorithme (MD5, SHA-256).",
  "PHISHING": "Technique frauduleuse destinée à leurrer l'internaute pour l'inciter à communiquer des données personnelles (comptes, mots de passe...) en se faisant passer pour un tiers de confiance.",
  "EXFILTRATION": "Transfert non autorisé de données depuis un ordinateur ou un autre appareil.",
  "SSL/TLS": "Protocoles de sécurité assurant la confidentialité et l'intégrité des données échangées sur Internet.",
  "REGISTRAR": "Bureau d'enregistrement. Organisme accrédité qui gère la réservation de noms de domaine Internet.",
  "REVERSE DNS": "Processus consistant à déterminer le nom de domaine associé à une adresse IP donnée.",
  "TOR": "The Onion Router. Réseau permettant de rendre anonymes les échanges sur Internet.",
  "OPSEC": "Operations Security. Processus identifiant et protégeant les informations critiques qui pourraient être utilisées par un adversaire.",
  "SOCMINT": "Social Media Intelligence. Collecte et analyse de données issues des réseaux sociaux."
};

// --- TECHNICAL TOOLS CONFIGURATION ---
const TECHNICAL_TOOLS = [
  { id: 'maltego_transform', name: 'Graph Analysis (Topo)', icon: Network, color: 'text-purple-400' },
  { id: 'geoiplookup', name: 'Geo-Location', icon: MapPin, color: 'text-green-400' },
  { id: 'exiftool', name: 'Metadata Ext.', icon: FileText, color: 'text-blue-400' },
  { id: 'whois', name: 'Whois Lookup', icon: Search, color: 'text-yellow-400' }
];

// --- HELPER COMPONENTS ---

// Simple visual components for Graph nodes based on type
const NodeIcon = ({ type, size = 16 }: { type: string, size?: number }) => {
  switch (type) {
    case 'Person': return <User size={size} className="text-blue-400" />;
    case 'Organization': return <Building size={size} className="text-orange-400" />;
    case 'Location': return <MapPin size={size} className="text-green-400" />;
    case 'Event': return <Calendar size={size} className="text-purple-400" />;
    default: return <HelpCircle size={size} className="text-gray-400" />;
  }
};

const TermTooltip: React.FC<{ term: string, definition: string, children: React.ReactNode }> = ({ term, definition, children }) => {
  return (
    <span className="group relative inline-block cursor-help border-b border-dotted border-gov-accent/60 hover:bg-gov-accent/10 transition-colors">
      {children}
      {/* Tooltip Popup */}
      <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black/95 text-gray-200 text-xs rounded border border-gov-accent/30 shadow-2xl z-50 pointer-events-none text-left leading-relaxed">
         <span className="block font-bold text-gov-accent mb-1 border-b border-gray-700 pb-1 uppercase tracking-wider text-[10px]">
           Définition : {term.toUpperCase()}
         </span>
         {definition}
         {/* Little Arrow */}
         <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95"></span>
      </span>
    </span>
  );
};

const highlightOsintTerms = (text: string) => {
  if (!text) return null;

  // Sort keys by length (descending) to match longer phrases first (e.g. "Reverse DNS" before "DNS")
  const sortedKeys = Object.keys(OSINT_GLOSSARY).sort((a, b) => b.length - a.length);
  
  // Create regex with word boundaries to avoid partial matches inside words
  const regex = new RegExp(`\\b(${sortedKeys.join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    const upperPart = part.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(OSINT_GLOSSARY, upperPart)) {
      return (
        <TermTooltip key={index} term={upperPart} definition={OSINT_GLOSSARY[upperPart]}>
          <span className="text-gov-accent font-medium">{part}</span>
        </TermTooltip>
      );
    }
    return part;
  });
};

const NetworkGraph = ({ data }: { data: OsintReport['graph'] }) => {
  const width = 800;
  const height = 600;
  const [nodes, setNodes] = useState<any[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedRelations, setSelectedRelations] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Extract unique relation types for the filter list
  const allRelationTypes = useMemo(() => {
    return Array.from(new Set(data.links.map(l => l.relation))).sort();
  }, [data.links]);

  // Initialize filters (all selected by default) when data changes
  useEffect(() => {
    setSelectedRelations(Array.from(new Set(data.links.map(l => l.relation))));
  }, [data.links]);

  const toggleRelation = (rel: string) => {
    setSelectedRelations(prev => 
      prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
    );
  };

  const toggleAll = () => {
    if (selectedRelations.length === allRelationTypes.length) {
      setSelectedRelations([]);
    } else {
      setSelectedRelations(allRelationTypes);
    }
  };

  // Filter links based on selection
  const filteredLinks = useMemo(() => {
    return data.links.filter(link => selectedRelations.includes(link.relation));
  }, [data.links, selectedRelations]);

  // Initialize nodes with circular layout when data changes
  useEffect(() => {
    if (!data.nodes.length) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    // Dynamic radius based on node count to prevent cramping
    const radius = Math.min(width, height) / 2 - (data.nodes.length > 10 ? 40 : 100);

    const initialNodes = data.nodes.map((node, i) => {
       // Distribute evenly
       const angle = (i / data.nodes.length) * 2 * Math.PI - Math.PI / 2;
       return {
         ...node,
         x: centerX + radius * Math.cos(angle),
         y: centerY + radius * Math.sin(angle),
       };
    });
    setNodes(initialNodes);
  }, [data]);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    
    // Convert screen coordinates to SVG coordinates
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    // Constrain to bounds
    const constrainedX = Math.max(20, Math.min(width - 20, x));
    const constrainedY = Math.max(20, Math.min(height - 20, y));

    setNodes(prev => prev.map(n => 
      n.id === draggingNode ? { ...n, x: constrainedX, y: constrainedY } : n
    ));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // Helper to find node coordinates by ID from state
  const getNodePos = (id: string) => nodes.find(n => n.id === id);

  if (!data.nodes.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Network size={48} className="mb-4 opacity-50" />
        <p>Aucune donnée relationnelle disponible.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gov-900 rounded-lg overflow-hidden border border-gov-700 relative flex items-center justify-center select-none">
       {/* Legend & Filters Panel */}
       <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="bg-gov-800/90 p-3 rounded-lg backdrop-blur-sm border border-gov-700 text-xs shadow-xl pointer-events-auto min-w-[160px]">
           <h4 className="font-bold text-white mb-2 uppercase tracking-wider flex items-center border-b border-gov-700 pb-2">
              <Network size={12} className="mr-2"/> Légende
           </h4>
           <div className="space-y-1.5">
             <div className="flex items-center"><User size={12} className="mr-2 text-blue-400"/> Personne</div>
             <div className="flex items-center"><Building size={12} className="mr-2 text-orange-400"/> Organisation</div>
             <div className="flex items-center"><MapPin size={12} className="mr-2 text-green-400"/> Lieu</div>
             <div className="flex items-center"><Calendar size={12} className="mr-2 text-purple-400"/> Événement</div>
           </div>
           <div className="mt-3 pt-2 border-t border-gov-700 text-gray-500 flex items-center">
              <Move size={10} className="mr-1"/> Glisser pour réorganiser
           </div>
         </div>

         {/* Relation Filters */}
         {allRelationTypes.length > 0 && (
           <div className="bg-gov-800/90 p-3 rounded-lg backdrop-blur-sm border border-gov-700 text-xs shadow-xl pointer-events-auto max-h-[250px] overflow-y-auto custom-scrollbar min-w-[160px]">
              <div className="flex justify-between items-center mb-2 border-b border-gov-700 pb-2">
                <h4 className="font-bold text-white uppercase tracking-wider flex items-center">
                  <Filter size={12} className="mr-2"/> Relations
                </h4>
                <button 
                  onClick={toggleAll} 
                  className="text-[10px] text-gov-accent hover:text-white transition-colors"
                >
                  {selectedRelations.length === allRelationTypes.length ? 'Tout masquer' : 'Tout voir'}
                </button>
              </div>
              <div className="space-y-1.5">
                {allRelationTypes.map(rel => (
                  <div 
                    key={rel} 
                    className="flex items-center cursor-pointer hover:bg-gov-700/50 p-1 rounded transition-colors"
                    onClick={() => toggleRelation(rel)}
                  >
                    {selectedRelations.includes(rel) ? (
                      <CheckSquare size={12} className="mr-2 text-gov-accent" />
                    ) : (
                      <Square size={12} className="mr-2 text-gray-600" />
                    )}
                    <span className={selectedRelations.includes(rel) ? 'text-gray-200' : 'text-gray-500'}>
                      {rel}
                    </span>
                  </div>
                ))}
              </div>
           </div>
         )}
       </div>

      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className={`w-full h-full ${draggingNode ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>
        
        {/* Links */}
        {filteredLinks.map((link, i) => {
          const source = getNodePos(link.source);
          const target = getNodePos(link.target);
          if (!source || !target) return null;
          
          return (
            <g key={`link-${i}`}>
              <line 
                x1={source.x} y1={source.y} 
                x2={target.x} y2={target.y} 
                stroke="#475569" 
                strokeWidth="1.5"
                strokeOpacity="0.5"
                markerEnd="url(#arrowhead)"
              />
              {/* Label on Link */}
              <foreignObject 
                x={(source.x + target.x) / 2 - 40} 
                y={(source.y + target.y) / 2 - 10} 
                width="80" 
                height="20"
                className="pointer-events-none"
              >
                <div className="flex justify-center items-center h-full">
                  <span className="bg-gov-900/80 text-[10px] text-gray-400 px-1 rounded truncate border border-gov-700/50 shadow-sm">
                    {link.relation}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g 
            key={node.id} 
            className="group transition-opacity hover:opacity-100"
            onMouseDown={(e) => handleMouseDown(node.id, e)}
          >
             {/* Node Glow on Hover */}
             <circle 
              cx={node.x} cy={node.y} 
              r="30" 
              fill="transparent"
              className="group-hover:fill-white/5 transition-all duration-300"
            />
            
            {/* Main Circle */}
             <circle 
              cx={node.x} cy={node.y} 
              r="22" 
              fill="#1e293b" 
              stroke={
                node.type === 'Person' ? '#60a5fa' : 
                node.type === 'Organization' ? '#fb923c' : 
                node.type === 'Location' ? '#4ade80' : 
                node.type === 'Event' ? '#c084fc' : '#94a3b8'
              } 
              strokeWidth={draggingNode === node.id ? 3 : 2}
              className="transition-all duration-200"
            />
            
            {/* Icon */}
            <foreignObject x={node.x - 10} y={node.y - 10} width="20" height="20" className="pointer-events-none">
              <div className="flex items-center justify-center w-full h-full">
                <NodeIcon type={node.type} size={16} />
              </div>
            </foreignObject>
            
            {/* Label */}
            <text 
              x={node.x} y={node.y + 38} 
              fill="#e2e8f0" 
              fontSize="12" 
              textAnchor="middle" 
              fontWeight="500"
              className="pointer-events-none shadow-black drop-shadow-md bg-gov-900 px-1 rounded"
              style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const OsintModule: React.FC = () => {
  const [query, setQuery] = useState('');
  const [reportData, setReportData] = useState<OsintReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'graph'>('text');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Action Feedback States
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  
  // States for tool modal
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<string>('');
  const [toolResult, setToolResult] = useState<string>('');
  const [toolLoading, setToolLoading] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('osint_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (newQuery: string) => {
    setSearchHistory(prev => {
        const filtered = prev.filter(q => q !== newQuery);
        const updated = [newQuery, ...filtered].slice(0, 10); // Limit to 10 items
        localStorage.setItem('osint_history', JSON.stringify(updated));
        return updated;
    });
  };

  const clearHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('osint_history');
  };

  const performScan = async (target: string) => {
    if (!target) return;
    setIsGenerating(true);
    setReportData(null);
    setViewMode('text');
    setActionStatus(null);
    
    // Save to history immediately
    saveToHistory(target);

    const result = await generateOsintSummary(target);
    setReportData(result);
    setIsGenerating(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performScan(query);
  };

  const handleHistoryClick = (histItem: string) => {
      setQuery(histItem);
      performScan(histItem);
  };

  // --- ACTIONS HANDLERS ---
  const handleArchive = async () => {
    if (!reportData) return;
    try {
      const res = await archiveOsintReport(reportData, query);
      setActionStatus(`ARCHIVE_OK: ${res.id}`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (e) {
      alert("Erreur de connexion au serveur d'archivage.");
    }
  };

  const handleShare = async () => {
    try {
      const res = await shareOsintReport(query);
      prompt("Lien sécurisé généré (TTL 24h) :", res.link);
    } catch (e) {
      alert("Erreur lors de la génération du lien.");
    }
  };

  const handleAlert = async () => {
    try {
      const res = await createOsintAlert(query);
      setActionStatus(`ALERT_ACTIVE: ${res.alertId}`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (e) {
      alert("Erreur d'activation de l'alerte.");
    }
  };

  const handleToolClick = async (toolId: string) => {
    if (!query) {
       alert("Veuillez d'abord entrer une cible (nom, IP, organisation) dans la barre de recherche.");
       return;
    }

    setCurrentTool(toolId);
    setToolModalOpen(true);
    setToolLoading(true);
    setToolResult('');

    const result = await runOsintTool(toolId, query);
    setToolResult(result);
    setToolLoading(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      {/* Tool Modal (Terminal Style) */}
      {toolModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gov-900 border border-gov-600 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden ring-1 ring-white/10">
            <div className="flex justify-between items-center p-3 border-b border-gov-700 bg-gov-800">
               <h3 className="text-white font-mono text-sm font-bold flex items-center tracking-wider">
                 <Terminal className="mr-2 text-gov-accent" size={16} />
                 root@santinel:~/{currentTool.toLowerCase().replace(/\s/g, '_')}
               </h3>
               <button onClick={() => setToolModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs md:text-sm text-green-400 bg-black flex-1 shadow-inner custom-scrollbar">
               {toolLoading ? (
                 <div className="space-y-2">
                   <div className="flex items-center">
                     <span className="text-gov-accent mr-2">➜</span>
                     <span className="animate-pulse">Initialisation du module {currentTool}...</span>
                   </div>
                   <div className="text-gray-500">Connexion aux bases de données distribuées...</div>
                   <div className="text-gray-500">Handshake chiffré TLS 1.3...</div>
                   <div className="w-4 h-4 mt-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
               ) : (
                 <div className="whitespace-pre-wrap leading-relaxed selection:bg-green-900 selection:text-white">
                   <span className="text-gov-accent">➜</span> <span className="text-white">./execute_{currentTool.toLowerCase().replace('.', '').replace(/\s/g, '_')} --target "{query}"</span>
                   <br/><br/>
                   {toolResult}
                   <br/>
                   <span className="text-gov-accent mt-4 block">➜ _</span>
                 </div>
               )}
            </div>
            <div className="p-2 border-t border-gov-700 bg-gov-800 flex justify-between items-center px-4">
               <div className="text-[10px] text-gray-500 font-mono">SESSION ID: {Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}</div>
               <button 
                 onClick={() => setToolModalOpen(false)}
                 className="px-3 py-1 bg-gov-700 hover:bg-gov-600 text-gray-200 rounded text-xs font-mono border border-gov-600 transition-colors"
               >
                 EXIT PROCESS
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Left Panel: Sources & Controls */}
        <div className="md:col-span-1 space-y-4 flex flex-col h-full">
          <div className="bg-gov-800 p-4 rounded-lg border border-gov-700">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Globe size={18} className="mr-2 text-gov-accent" /> Sources Actives
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Public Web</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> News Feeds (RSS)</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span> Public Forums</li>
              <li className="flex items-center"><span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span> Dark Web (Indexer Only)</li>
            </ul>
          </div>
          
          <div className="bg-gov-800 p-4 rounded-lg border border-gov-700">
             <h3 className="text-white font-semibold mb-2 flex items-center"><Database size={14} className="mr-2"/> Outils Techniques</h3>
             <div className="grid grid-cols-1 gap-2">
                {TECHNICAL_TOOLS.map((tool) => (
                  <button 
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className="bg-gov-700 hover:bg-gov-600 text-xs py-2 px-3 rounded text-left text-gray-200 transition-colors flex items-center justify-between group border border-transparent hover:border-gov-500"
                  >
                     <div className="flex items-center">
                       <tool.icon size={12} className={`mr-2 ${tool.color} group-hover:brightness-125`} />
                       <span>{tool.name}</span>
                     </div>
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play size={10} className="text-gov-accent fill-gov-accent" />
                     </div>
                  </button>
                ))}
             </div>
          </div>

          {/* History Panel */}
          <div className="bg-gov-800 p-4 rounded-lg border border-gov-700 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold flex items-center text-xs uppercase tracking-wider">
                  <Clock size={14} className="mr-2 text-gray-400"/> Historique
                </h3>
                {searchHistory.length > 0 && (
                    <button onClick={clearHistory} className="text-gray-500 hover:text-red-400 transition-colors" title="Effacer l'historique">
                        <Trash2 size={12} />
                    </button>
                )}
             </div>
             <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
                {searchHistory.length === 0 ? (
                    <div className="text-gray-600 text-xs italic py-4 text-center">Aucune recherche récente.</div>
                ) : (
                    <ul className="space-y-1.5">
                        {searchHistory.map((histItem, idx) => (
                            <li key={idx}>
                                <button 
                                    onClick={() => handleHistoryClick(histItem)}
                                    className="w-full flex items-center text-left bg-gov-900/50 hover:bg-gov-700 p-2 rounded border border-gov-800 hover:border-gov-600 transition-all group"
                                >
                                    <div className="bg-gov-800 p-1 rounded text-gov-accent mr-2 group-hover:text-white transition-colors">
                                        <RotateCcw size={10} />
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono truncate group-hover:text-gray-200">{histItem}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
             </div>
          </div>
        </div>

        {/* Center Panel: Search & Results */}
        <div className="md:col-span-3 flex flex-col h-full min-h-[500px]">
          <form onSubmit={handleSearch} className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gov-700 rounded-lg leading-5 bg-gov-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gov-accent focus:border-gov-accent sm:text-sm shadow-lg font-mono"
              placeholder="Cible d'analyse (ex: organisation, nom de domaine, alias)..."
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-4 bg-gov-accent hover:bg-sky-600 text-white rounded text-sm font-medium transition-colors shadow-lg"
              disabled={isGenerating}
            >
              {isGenerating ? 'Scan en cours...' : 'SCAN COMPLET'}
            </button>
          </form>

          <div className="flex-1 bg-gov-800 border border-gov-700 rounded-lg p-6 overflow-hidden flex flex-col shadow-inner relative">
            
            {/* Action Feedback Banner */}
            {actionStatus && (
                <div className="absolute top-0 left-0 right-0 bg-gov-success/20 border-b border-gov-success/40 text-gov-success text-xs font-mono py-1 px-4 text-center z-20 flex items-center justify-center animate-fade-in">
                    <CheckCircle size={12} className="mr-2" />
                    {actionStatus}
                </div>
            )}
            
            {/* View Toggles - Only show if data exists */}
            {reportData && !isGenerating && (
              <div className="flex space-x-2 mb-4 border-b border-gov-700 pb-2">
                <button 
                  onClick={() => setViewMode('text')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'text' ? 'bg-gov-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <FileText size={14} className="mr-2" /> Rapport Stratégique
                </button>
                <button 
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm transition-colors ${viewMode === 'graph' ? 'bg-gov-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <Network size={14} className="mr-2" /> Carte Relationnelle
                </button>
                <div className="flex-1"></div>
                 <button className="text-gray-400 hover:text-white flex items-center text-xs border border-gov-600 px-3 py-1 rounded hover:bg-gov-700 transition-colors">
                    <Share2 size={12} className="mr-1" /> EXPORTER PDF
                  </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {!reportData && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                  <Globe size={64} className="mb-4 text-gov-700" />
                  <p className="font-mono text-sm">En attente d'une cible OSINT...</p>
                  <p className="text-xs mt-2">Le système scannera les sources ouvertes et générera un graphe d'entités.</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gov-700 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gov-accent rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-center space-y-1">
                     <p className="text-gov-accent animate-pulse font-mono font-bold">ANALYSE EN COURS</p>
                     <p className="text-xs text-gray-500 font-mono">Corrélation des entités & Traçage des vecteurs...</p>
                  </div>
                </div>
              )}

              {reportData && !isGenerating && (
                <>
                  {viewMode === 'text' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="flex items-center text-gov-accent mb-6 pb-2 border-b border-gov-700 justify-between">
                          <div className="flex items-center">
                            <FileText className="mr-2" size={20} />
                            <span className="font-bold text-lg tracking-wide">RAPPORT DE SYNTHÈSE</span>
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                             <BookOpen size={14} className="mr-1" />
                             <span>Survolez les termes techniques pour définition</span>
                          </div>
                      </div>
                      <div className="font-sans leading-relaxed text-gray-300 whitespace-pre-wrap">
                        {highlightOsintTerms(reportData.summary)}
                      </div>

                      {/* Actions Bar */}
                      <div className="mt-8 flex flex-wrap gap-3 no-prose border-t border-gov-700/50 pt-6">
                         <button 
                           onClick={handleArchive}
                           className="flex items-center px-4 py-2 bg-gov-800 hover:bg-gov-700 text-gray-300 rounded border border-gov-600 hover:border-gray-500 transition-all text-xs font-medium shadow-sm"
                         >
                           <Archive size={14} className="mr-2" /> Archiver le rapport
                         </button>
                         <button 
                           onClick={handleShare}
                           className="flex items-center px-4 py-2 bg-gov-800 hover:bg-gov-700 text-gray-300 rounded border border-gov-600 hover:border-gray-500 transition-all text-xs font-medium shadow-sm"
                         >
                           <Share2 size={14} className="mr-2" /> Partager
                         </button>
                         <button 
                           onClick={handleAlert}
                           className="flex items-center px-4 py-2 bg-gov-warning/10 hover:bg-gov-warning/20 text-gov-warning border border-gov-warning/30 hover:border-gov-warning/50 rounded transition-all text-xs font-medium shadow-sm ml-auto"
                         >
                           <Bell size={14} className="mr-2" /> Créer une alerte
                         </button>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gov-700 text-[10px] text-gray-500 font-mono flex justify-between">
                        <span>CONFIDENTIALITÉ: TLP:AMBER</span>
                        <span>GENERATED BY SANTINEL CORE AI</span>
                      </div>
                    </div>
                  ) : (
                    <NetworkGraph data={reportData.graph} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsintModule;