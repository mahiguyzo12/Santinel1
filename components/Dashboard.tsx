import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AlertTriangle, ShieldCheck, Activity, Users } from 'lucide-react';
import { ThreatLevel } from '../types';

const dataTrend = [
  { name: '00:00', menace: 20, defense: 40 },
  { name: '04:00', menace: 15, defense: 45 },
  { name: '08:00', menace: 35, defense: 40 },
  { name: '12:00', menace: 50, defense: 55 },
  { name: '16:00', menace: 45, defense: 60 },
  { name: '20:00', menace: 30, defense: 50 },
  { name: '24:00', menace: 25, defense: 55 },
];

const threatDistribution = [
  { name: 'Cyber', count: 450 },
  { name: 'Radicalisation', count: 120 },
  { name: 'Désinformation', count: 340 },
  { name: 'Fraude', count: 80 },
];

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-gov-800 border border-gov-700 p-4 rounded-lg shadow-lg relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}`}>
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="text-3xl font-bold text-white mt-1">{value}</div>
      <div className={`text-xs mt-2 font-mono ${sub.includes('+') ? 'text-gov-success' : 'text-gov-warning'}`}>
        {sub}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vue d'Ensemble - SANTINEL</h1>
          <p className="text-gray-400 text-sm">Niveau de vigilance nationale: <span className="text-gov-warning font-bold">MODÉRÉ</span></p>
        </div>
        <div className="flex space-x-2">
           <span className="px-3 py-1 bg-gov-700 rounded text-xs font-mono text-gov-accent">VERSION 1.0.4-SECURE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Alertes Actives" value="24" sub="+12% vs 24h" icon={AlertTriangle} color="gov-warning" />
        <StatCard title="Systèmes Sécurisés" value="98.4%" sub="Stable" icon={ShieldCheck} color="gov-success" />
        <StatCard title="Flux de Données" value="12.4 TB" sub="+0.8 TB Processed" icon={Activity} color="gov-accent" />
        <StatCard title="Analystes Connectés" value="8" sub="Shift B" icon={Users} color="white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-gov-800 border border-gov-700 rounded-lg p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="mr-2 text-gov-accent" size={18} />
            Dynamique des Menaces (24h)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataTrend}>
                <defs>
                  <linearGradient id="colorMenace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDefense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="menace" stroke="#ef4444" fillOpacity={1} fill="url(#colorMenace)" name="Signaux de Menace" />
                <Area type="monotone" dataKey="defense" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorDefense)" name="Actions Défensives" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-gov-800 border border-gov-700 rounded-lg p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition par Vecteur</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} 
                  cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;