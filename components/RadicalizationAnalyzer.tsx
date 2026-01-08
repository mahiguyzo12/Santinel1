import React, { useState } from 'react';
import { analyzeRadicalization } from '../services/geminiService';
import { RadicalizationAnalysis } from '../types';
import { AlertTriangle, CheckCircle, Search, FileText, Lock, Eye } from 'lucide-react';

const RadicalizationAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RadicalizationAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const analysis = await analyzeRadicalization(inputText);
    setResult(analysis);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gov-800 border border-gov-700 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Search className="mr-2 text-gov-warning" />
            Détection de Radicalisation (Analyse Sémantique)
          </h2>
          <span className="text-xs bg-gov-700 px-2 py-1 rounded text-gray-300 border border-gov-600">
            Modèle: SANTINEL-SEMANTIC-V3 (Gemini Enhanced)
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Cet outil analyse le discours pour identifier des marqueurs de violence idéologique. 
          <br/>
          <span className="text-gov-accent">Note:</span> L'analyse est indicative. Toute décision nécessite une validation humaine.
        </p>

        <textarea
          className="w-full h-40 bg-gov-900 border border-gov-700 rounded p-4 text-gray-200 focus:border-gov-accent focus:ring-1 focus:ring-gov-accent outline-none font-mono text-sm"
          placeholder="Collez ici le texte, la transcription ou le contenu du post suspect pour analyse..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !inputText}
            className={`px-6 py-2 rounded font-medium transition-colors flex items-center ${
              loading || !inputText 
                ? 'bg-gov-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gov-accent hover:bg-sky-600 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyse en cours...
              </>
            ) : (
              <>
                <ActivityIcon className="mr-2 w-4 h-4" />
                Lancer l'Analyse
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className={`border rounded-lg p-6 shadow-lg animate-fade-in ${
          result.riskScore > 50 ? 'bg-red-950/30 border-red-900' : 'bg-gov-800 border-gov-700'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Rapport d'Analyse</h3>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Catégorie:</span>
                <span className="font-mono text-gray-200 bg-gov-900 px-2 py-0.5 rounded">{result.category}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Score de Risque</div>
              <div className={`text-3xl font-bold ${
                result.riskScore > 75 ? 'text-gov-danger' : 
                result.riskScore > 40 ? 'text-gov-warning' : 'text-gov-success'
              }`}>
                {result.riskScore}/100
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Justification de l'IA</h4>
              <p className="text-gray-300 bg-gov-900/50 p-3 rounded border border-gov-700/50 text-sm leading-relaxed">
                {result.justification}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Marqueurs Identifiés</h4>
              <div className="flex flex-wrap gap-2">
                {result.flags.map((flag, idx) => (
                  <span key={idx} className="bg-gov-700 text-gray-200 px-3 py-1 rounded-full text-xs border border-gov-600 flex items-center">
                    <AlertTriangle size={12} className="mr-1 text-gov-warning" />
                    {flag}
                  </span>
                ))}
                {result.flags.length === 0 && (
                   <span className="text-gray-500 text-sm italic">Aucun marqueur critique détecté.</span>
                )}
              </div>
            </div>

            {result.requiresHumanReview && (
              <div className="mt-6 flex items-center bg-gov-900 border border-gov-accent/30 p-3 rounded text-gov-accent text-sm">
                <Eye className="mr-2" size={16} />
                <strong>Action requise :</strong> Ce résultat nécessite une validation humaine avant archivage.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export default RadicalizationAnalyzer;