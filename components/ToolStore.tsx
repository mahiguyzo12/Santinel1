import React from 'react';
import { Download, Terminal, Shield, Box, Cpu, AlertCircle, CheckCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  installCmd: string;
  icon: any;
  status: 'installed' | 'available' | 'update';
}

const tools: Tool[] = [
  {
    id: 'metasploit',
    name: 'Metasploit Framework',
    description: 'Plateforme de test d\'intrusion et de développement d\'exploits. Indispensable pour la validation de vulnérabilités.',
    version: '6.3.55',
    category: 'Exploitation',
    installCmd: 'curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall && ./msfinstall',
    icon: Shield,
    status: 'available'
  },
  {
    id: 'nmap',
    name: 'Nmap Network Scanner',
    description: 'Utilitaire libre pour l\'exploration réseau et l\'audit de sécurité.',
    version: '7.94',
    category: 'Reconnaissance',
    installCmd: 'sudo apt-get install nmap -y',
    icon: Box,
    status: 'available'
  },
  {
    id: 'wireshark',
    name: 'Wireshark',
    description: 'Analyseur de paquets réseau pour le dépannage, l\'analyse, le développement.',
    version: '4.2.0',
    category: 'Forensique',
    installCmd: 'sudo apt-get install wireshark -y',
    icon: Cpu,
    status: 'available'
  },
  {
    id: 'john',
    name: 'John the Ripper',
    description: 'Outil de cassage de mots de passe rapide.',
    version: '1.9.0',
    category: 'Cracking',
    installCmd: 'sudo apt-get install john -y',
    icon: AlertCircle,
    status: 'available'
  }
];

interface ToolStoreProps {
  onInstall: (cmd: string) => void;
}

const ToolStore: React.FC<ToolStoreProps> = ({ onInstall }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gov-800 border border-gov-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Box className="text-gov-accent mr-3" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-white">Arsenal Numérique</h2>
              <p className="text-gray-400 text-sm">Gestionnaire de paquets et outils de défense.</p>
            </div>
          </div>
          <div className="flex space-x-2 text-xs">
            <span className="bg-gov-900 border border-gov-700 px-3 py-1 rounded text-gray-400">Arch: x86_64</span>
            <span className="bg-gov-900 border border-gov-700 px-3 py-1 rounded text-gray-400">Distro: Linux Base</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-gov-900 border border-gov-700 rounded-lg p-4 flex flex-col hover:border-gov-600 transition-all group relative overflow-hidden">
               {/* Decorative background icon */}
               <div className="absolute -right-4 -bottom-4 opacity-5 text-gray-500 transform rotate-12 group-hover:scale-110 transition-transform">
                  <tool.icon size={100} />
               </div>

               <div className="flex justify-between items-start mb-2 relative z-10">
                 <div className="flex items-center">
                    <div className="p-2 bg-gov-800 rounded-lg border border-gov-700 mr-3 text-gov-accent">
                        <tool.icon size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{tool.name}</h3>
                        <span className="text-xs text-gray-500 font-mono bg-gov-800 px-1.5 py-0.5 rounded">{tool.category}</span>
                    </div>
                 </div>
                 <div className={`text-xs px-2 py-1 rounded-full border flex items-center ${
                     tool.status === 'installed' ? 'bg-green-900/30 border-green-800 text-green-400' : 
                     'bg-blue-900/30 border-blue-800 text-blue-400'
                 }`}>
                    {tool.status === 'installed' ? <CheckCircle size={10} className="mr-1"/> : <Download size={10} className="mr-1"/>}
                    {tool.status === 'installed' ? 'INSTALLÉ' : 'DISPONIBLE'}
                 </div>
               </div>

               <p className="text-gray-400 text-sm mb-4 flex-1 relative z-10">{tool.description}</p>

               <div className="flex justify-between items-center mt-auto relative z-10 pt-4 border-t border-gov-800">
                  <span className="text-xs text-gray-600 font-mono">v{tool.version}</span>
                  <button 
                    onClick={() => onInstall(tool.installCmd)}
                    className="flex items-center px-4 py-2 bg-gov-accent hover:bg-sky-600 text-white rounded text-sm font-medium transition-colors shadow-lg"
                  >
                    <Terminal size={14} className="mr-2" />
                    Installer
                  </button>
               </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded flex items-start text-sm text-yellow-200/80">
            <AlertCircle className="shrink-0 mr-3 mt-0.5" size={16} />
            <p>
                <strong>Note technique :</strong> L'installation déclenchera l'ouverture du terminal système. 
                Des privilèges <code>sudo</code> peuvent être requis. Assurez-vous d'avoir les droits d'administration sur le serveur hôte.
            </p>
        </div>

      </div>
    </div>
  );
};

export default ToolStore;