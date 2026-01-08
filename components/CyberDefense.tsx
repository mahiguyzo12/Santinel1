import React from 'react';
import { Shield, Radio, Terminal, Wifi } from 'lucide-react';
import { CyberAlert, ThreatLevel } from '../types';

const mockAlerts: CyberAlert[] = [
  { id: 'CYB-001', type: 'DDoS Attempt', severity: ThreatLevel.HIGH, timestamp: '10:42:05', status: 'Active' },
  { id: 'CYB-002', type: 'Anomalous Data Exfiltration', severity: ThreatLevel.CRITICAL, timestamp: '10:40:12', status: 'Investigating' },
  { id: 'CYB-003', type: 'Port Scan (Subnet 10.2)', severity: ThreatLevel.LOW, timestamp: '10:35:00', status: 'Resolved' },
  { id: 'CYB-004', type: 'Unauthorized API Access', severity: ThreatLevel.MODERATE, timestamp: '10:15:22', status: 'Resolved' },
];

const CyberDefense: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* SOC Monitor */}
      <div className="lg:col-span-2 bg-black border border-gov-700 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gov-800 p-3 border-b border-gov-700 flex justify-between items-center">
          <div className="flex items-center text-gov-accent">
            <Terminal size={18} className="mr-2" />
            <span className="font-mono font-bold">LIVE THREAT FEED // SOC-MAIN</span>
          </div>
          <div className="flex items-center space-x-4">
             <span className="flex items-center text-xs text-green-500 font-mono"><Wifi size={12} className="mr-1"/> ONLINE</span>
          </div>
        </div>
        <div className="flex-1 bg-black p-4 font-mono text-sm overflow-y-auto space-y-2 relative">
           {/* Simulated Matrix-like background effect via CSS can be added, sticking to clean logs for now */}
           <div className="text-gray-500 text-xs border-b border-gray-800 pb-2 mb-2">System initialized at 00:00:01 UTC. Monitoring active interfaces...</div>
           
           {mockAlerts.map((alert) => (
             <div key={alert.id} className="flex items-start space-x-3 hover:bg-gov-900 p-1 rounded cursor-pointer transition-colors">
               <span className="text-gray-500 w-20 shrink-0">{alert.timestamp}</span>
               <span className={`w-24 shrink-0 font-bold ${
                 alert.severity === ThreatLevel.CRITICAL ? 'text-gov-danger blink' :
                 alert.severity === ThreatLevel.HIGH ? 'text-gov-danger' :
                 alert.severity === ThreatLevel.MODERATE ? 'text-gov-warning' : 'text-gov-success'
               }`}>[{alert.severity}]</span>
               <span className="text-gray-300 flex-1">{alert.type}</span>
               <span className={`text-xs px-2 py-0.5 rounded ${
                 alert.status === 'Active' ? 'bg-red-900 text-red-200 animate-pulse' :
                 alert.status === 'Investigating' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'
               }`}>{alert.status}</span>
             </div>
           ))}
           <div className="mt-4 text-gov-accent animate-pulse">_ Awaiting new packets...</div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gov-800 border border-gov-700 rounded-lg p-6 flex flex-col space-y-6">
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center">
            <Shield className="mr-2 text-gov-success" /> État des Systèmes
          </h3>
          <div className="space-y-4">
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Firewall Perimeter A</span>
                <span className="text-gov-success">Operational</span>
              </div>
              <div className="h-1 w-full bg-gov-900 rounded-full overflow-hidden">
                <div className="h-full bg-gov-success w-full"></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">IDS/IPS Heuristics</span>
                <span className="text-gov-warning">Learning (98%)</span>
              </div>
              <div className="h-1 w-full bg-gov-900 rounded-full overflow-hidden">
                <div className="h-full bg-gov-warning w-[98%] animate-pulse"></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Database Encryption</span>
                <span className="text-gov-success">Active (AES-256)</span>
              </div>
              <div className="h-1 w-full bg-gov-900 rounded-full overflow-hidden">
                <div className="h-full bg-gov-success w-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gov-900 rounded border border-gov-700 p-4 flex items-center justify-center relative overflow-hidden">
           {/* Decorative Radar Element */}
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-48 h-48 border border-gov-accent rounded-full animate-ping absolute"></div>
              <div className="w-32 h-32 border border-gov-accent rounded-full absolute"></div>
              <div className="w-64 h-64 border border-gov-700 rounded-full absolute"></div>
           </div>
           <div className="relative z-10 text-center">
             <Radio size={48} className="mx-auto text-gov-accent mb-2" />
             <div className="text-2xl font-bold text-white">SCAN ACTIF</div>
             <div className="text-xs text-gray-400 font-mono">NO DATA LEAKS DETECTED</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CyberDefense;