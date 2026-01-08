import React, { useState } from 'react';
import { Fingerprint, FolderLock, FileCheck, Clock, UserCheck } from 'lucide-react';
import { ForensicsLog } from '../types';

const mockLogs: ForensicsLog[] = [
  { id: 'LOG-8821', evidenceId: 'EVD-2023-A44', action: 'Extraction Copie Bit-à-Bit', operator: 'Agent H. Dupont', timestamp: '2023-10-27 14:30:00', hash: 'sha256:8a7b...' },
  { id: 'LOG-8820', evidenceId: 'EVD-2023-A44', action: 'Mise sous scellé numérique', operator: 'Agent H. Dupont', timestamp: '2023-10-27 14:15:00', hash: 'sha256:e3b0...' },
  { id: 'LOG-8819', evidenceId: 'EVD-2023-B12', action: 'Analyse signatures virales', operator: 'Auto-Scanner', timestamp: '2023-10-27 10:00:00', hash: 'N/A' },
];

const Forensics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chain' | 'audit'>('chain');

  return (
    <div className="space-y-6">
      <div className="bg-gov-800 border border-gov-700 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Fingerprint className="text-gov-accent mr-3" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-white">Forensique Numérique & Légalité</h2>
            <p className="text-gray-400 text-sm">Gestion de la preuve et traçabilité judiciaire post-incident.</p>
          </div>
        </div>

        <div className="flex space-x-4 border-b border-gov-700 mb-6">
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === 'chain' ? 'text-gov-accent border-b-2 border-gov-accent' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('chain')}
          >
            Chaîne de Garantie (Chain of Custody)
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === 'audit' ? 'text-gov-accent border-b-2 border-gov-accent' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit des Accès
          </button>
        </div>

        {activeTab === 'chain' && (
          <div className="space-y-4">
             <div className="bg-gov-900 border border-dashed border-gov-600 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gov-800 transition-colors cursor-pointer group">
                <FolderLock size={48} className="mb-2 group-hover:text-gov-accent transition-colors" />
                <p>Déposer une image disque ou un log pour hachage et horodatage</p>
                <span className="text-xs bg-gov-700 px-2 py-1 rounded mt-2 text-gray-300">Format: .E01, .RAW, .LOG</span>
             </div>

             <h3 className="text-lg font-semibold text-white mt-8 mb-4">Dernières Actions Enregistrées</h3>
             <div className="overflow-x-auto">
               <table className="min-w-full text-left text-sm whitespace-nowrap">
                 <thead className="uppercase tracking-wider border-b-2 border-gov-700 bg-gov-800 text-gray-400">
                   <tr>
                     <th scope="col" className="px-6 py-3">ID Preuve</th>
                     <th scope="col" className="px-6 py-3">Action</th>
                     <th scope="col" className="px-6 py-3">Opérateur</th>
                     <th scope="col" className="px-6 py-3">Horodatage</th>
                     <th scope="col" className="px-6 py-3">Signature (Hash)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gov-700">
                    {mockLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gov-700/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gov-accent">{log.evidenceId}</td>
                        <td className="px-6 py-4 text-white flex items-center">
                          <FileCheck size={14} className="mr-2 text-green-500" />
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-gray-300 flex items-center">
                          <UserCheck size={14} className="mr-2" />
                          {log.operator}
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-mono flex items-center">
                          <Clock size={14} className="mr-2" />
                          {log.timestamp}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.hash}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
        
        {activeTab === 'audit' && (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block p-4 rounded-full bg-gov-900 mb-4">
              <UserCheck size={48} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Audit Log Sécurisé</h3>
            <p className="max-w-md mx-auto">
              L'accès aux journaux d'audit nécessite une authentification biométrique de niveau 3.
              <br/>
              Toutes les vues sont enregistrées dans la blockchain privée de SANTINEL.
            </p>
            <button className="mt-6 px-6 py-2 bg-gov-700 hover:bg-gov-600 text-white rounded font-medium border border-gov-500">
              Demander l'accès à l'auditeur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forensics;