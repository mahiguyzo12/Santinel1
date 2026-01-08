import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
// L'import CSS est géré via le CDN dans index.html pour éviter les erreurs de type MIME en preview
// import 'xterm/css/xterm.css';

interface TerminalModuleProps {
  initialCmd?: string;
}

const TerminalModule: React.FC<TerminalModuleProps> = ({ initialCmd }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  
  const getApiUrl = () => {
    try {
      return localStorage.getItem('santinel_api_url') || 'http://localhost:3001';
    } catch (e) {
      return 'http://localhost:3001';
    }
  };

  // --- INITIALIZATION ---

  useEffect(() => {
    // Prevent double init
    if (!terminalRef.current || xtermRef.current) return;

    // 1. Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#000000',
        foreground: '#e2e8f0',
        cursor: '#0ea5e9',
        selectionBackground: '#1e293b',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fcd34d',
        brightBlue: '#60a5fa',
        brightMagenta: '#e879f9',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    try {
      fitAddon.fit();
    } catch (e) { console.warn("Fit addon issue", e); }
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;36mSANTINEL SECURE SHELL v4.2.0 (PTY MODE)\x1b[0m');
    term.writeln('Initializing encrypted uplink...');

    // 2. Initialize Socket.IO connection
    const socket = io(getApiUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('CONNECTED');
      term.writeln('\r\n\x1b[1;32m[LINK ESTABLISHED] Access granted to host kernel.\x1b[0m\r\n');
      // Request a resize to match current viewport
      if (term.cols && term.rows) {
          socket.emit('resize', { cols: term.cols, rows: term.rows });
      }
      
      // If there was an initial command, send it once connected
      if (initialCmd) {
        socket.emit('input', initialCmd + '\r');
      }
    });

    socket.on('connect_error', (err) => {
        if (status !== 'DISCONNECTED') {
             term.writeln(`\r\n\x1b[1;33m[CONNECTION RETRY] Target host unreachable (${err.message})...\x1b[0m`);
        }
    });

    socket.on('disconnect', () => {
      setStatus('DISCONNECTED');
      term.writeln('\r\n\x1b[1;31m[LINK LOST] Connection to host terminated.\x1b[0m');
    });

    socket.on('pty-output', (data: string) => {
      term.write(data);
    });

    // 3. Bind xterm input to socket
    term.onData((data) => {
      socket.emit('input', data);
    });

    term.onResize((size) => {
       socket.emit('resize', { cols: size.cols, rows: size.rows });
    });

    // Handle Window Resize
    const handleResize = () => {
        try {
            fitAddon.fit();
            if (xtermRef.current) {
                socket.emit('resize', { cols: xtermRef.current.cols, rows: xtermRef.current.rows });
            }
        } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    // Initial fit after small delay to ensure DOM is ready
    setTimeout(handleResize, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, [initialCmd]);

  const handleFocus = () => {
      xtermRef.current?.focus();
  };

  return (
    <div className="h-full w-full bg-black flex flex-col">
       <div className={`h-1 w-full transition-colors duration-500 ${
           status === 'CONNECTED' ? 'bg-gov-success shadow-[0_0_10px_#10b981]' : 
           status === 'CONNECTING' ? 'bg-gov-warning animate-pulse' : 'bg-gov-danger'
       }`} />
       <div 
          className="flex-1 w-full p-1 overflow-hidden" 
          onClick={handleFocus}
      >
        <div 
          ref={terminalRef} 
          className="h-full w-full"
        />
      </div>
    </div>
  );
};

export default TerminalModule;