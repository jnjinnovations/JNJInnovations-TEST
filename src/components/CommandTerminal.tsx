import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Layers, ShieldCheck, Play } from "lucide-react";
import { motion } from "motion/react";
import { AuditLogEntry } from "../types";

// Helper function declared outside component to be pure and prevent redeclarations
const getNowTime = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

export default function CommandTerminal() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([
    { id: "1", timestamp: "11:52:01", type: "system", message: "INITIALIZING_SYSTEM_SCAN..." },
    { id: "2", timestamp: "11:52:03", type: "system", message: "OPTIMIZING_WORKFLOW_NODES..." },
    { id: "3", timestamp: "11:52:05", type: "success", message: "AI_CORE_DEPLOYED: ACTIVE" },
    { id: "4", timestamp: "11:52:07", type: "info", message: "STATUS: OPERATIONAL" },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [currentMetric, setCurrentMetric] = useState("AI_CORE: READY");
  const terminalRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mockLogsList = [
    "DIAGNOSING_MIDWEST_SMB_TECH_STACKS...",
    "ANALYSED: 54 Legacy Endpoints detected.",
    "WARN: Redundant CRM process bottlenecks found at NODE_04.",
    "LOAD: Automating invoicing workflow... DONE (v1.4 Client Proxy)",
    "INIT: Executing cognitive business audit on cloud server.",
    "SUCCESS: Integrated Make.com workflow pipelines.",
    "NODE_01_AI_STRATEGY: Synchronizing custom models...",
    "NODE_02_AUTOMATION: Cross-platform API bridge active.",
    "NODE_03_OPTIMIZATION: Latency reduced by 41.2% in service delivery.",
    "FIRMWARE: v2.0.4-LTS running with full compliance.",
    "AUDIT COMPLETE // Operational clarity established."
  ];

  const handleRunDiagnostics = () => {
    // Clear any existing diagnostic interval and timeout
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsScanning(true);
    setScanProgress(0);
    setLogs([{ id: "init", timestamp: getNowTime(), type: "system", message: "REBOOTING INTEGRATION CORES..." }]);

    let step = 0;
    intervalRef.current = setInterval(() => {
      if (step < mockLogsList.length) {
        const type = mockLogsList[step].startsWith("WARN:") 
          ? "warn" 
          : mockLogsList[step].startsWith("SUCCESS:") || mockLogsList[step].startsWith("AUDIT COMPLETE")
          ? "success" 
          : "info";
        
        setLogs(prev => [
          ...prev, 
          { 
            id: String(step + Date.now() + Math.random()), 
            timestamp: getNowTime(), 
            type, 
            message: `> ${mockLogsList[step]}` 
          }
        ]);
        
        setScanProgress(Math.floor(((step + 1) / mockLogsList.length) * 100));
        setCurrentMetric(mockLogsList[step].substring(0, 22) + "...");
        step++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsScanning(false);
        setScanProgress(100);
        setCurrentMetric("STATUS: OPERATIONAL");
      }
    }, 850);
  };

  // Run diagnostics automatically on first mount
  useEffect(() => {
    handleRunDiagnostics();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full bg-white border border-[#c5c6cd]/80 hover:border-[#0A1628] transition-all p-6 rounded-xl flex flex-col relative overflow-hidden group">
      {/* Decorative Blueprint Corner Grid Lines */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#101c2e]/10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#101c2e]/10 pointer-events-none"></div>

      {/* Terminal Title Bar */}
      <div className="flex justify-between items-center pb-3 border-b border-[#c5c6cd]/40 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-[#0A1628]" />
          <span className="font-mono text-xs font-semibold tracking-wide text-[#0A1628] uppercase">
            JNJ Diagnostic Core
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#5d5e5f] bg-[#f5f3f5] px-2 py-0.5 rounded border border-[#c5c6cd]/30">
          <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
          {isScanning ? "SCANNING_ACTIVE" : "OPERATIONAL"}
        </div>
      </div>

      {/* Output Console Log Panel */}
      <div 
        ref={terminalRef}
        id="terminal-output-container"
        className="flex-grow min-h-[160px] max-h-[220px] overflow-y-auto bg-[#faf9fa] border border-[#c5c6cd]/50 rounded p-4 font-mono text-xs text-[#0A1628] space-y-2 select-text"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 leading-relaxed">
            <span className="text-[#75777d]/70 select-none">[{log.timestamp}]</span>
            <span className={
              log.type === "success" 
                ? "text-emerald-700 font-semibold" 
                : log.type === "warn" 
                ? "text-amber-700 font-semibold" 
                : log.type === "system"
                ? "text-indigo-700" 
                : "text-[#1b1b1d]"
            }>
              {log.message}
            </span>
          </div>
        ))}
      </div>

      {/* Meter Bar/Status */}
      <div className="mt-4 flex flex-col gap-1 inline-block">
        <div className="flex justify-between text-[11px] font-mono text-[#5d5e5f]">
          <span>Current Target: <strong className="text-[#0A1628] font-medium">{currentMetric}</strong></span>
          <span>{scanProgress}%</span>
        </div>
        <div className="w-full bg-[#f0edef] h-1.5 rounded-full overflow-hidden">
          <motion.div 
            className="bg-[#0A1628] h-full"
            initial={{ width: "100%" }}
            animate={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>


      {/* Meta tags */}
      <div className="pt-3 mt-3 border-t border-[#c5c6cd]/30 flex justify-between items-center font-mono text-[10px] text-[#75777d]/80 uppercase">
        <span>Channel: Encrypted CJS-01</span>
        <span>Secure Secure-Scan V4</span>
      </div>
    </div>
  );
}
