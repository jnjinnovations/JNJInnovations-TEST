import { useState, useEffect, type FormEvent } from 'react';
import { EbookItem } from '../types';
import {
  GitHubSyncConfig,
  getGitHubConfig,
  saveGitHubConfig,
  testGitHubAccess,
  commitCatalogToGitHub,
  generateDefaultEbooksCode,
  CommitResult
} from '../utils/githubSync';
import {
  GitCommit,
  GitBranch,
  Github,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Copy,
  Check,
  X,
  RefreshCw,
  Sliders,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface GitHubCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  ebooks: EbookItem[];
  onCommitSuccess?: () => void;
}

export default function GitHubCommitModal({
  isOpen,
  onClose,
  ebooks,
  onCommitSuccess
}: GitHubCommitModalProps) {
  const [config, setConfig] = useState<GitHubSyncConfig>(getGitHubConfig());
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [commitMessage, setCommitMessage] = useState(
    `Update publication catalog (${ebooks.length} playbooks) via Admin Studio`
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showConfigSettings, setShowConfigSettings] = useState(!config.token || !config.repo);

  useEffect(() => {
    if (isOpen) {
      const current = getGitHubConfig();
      setConfig(current);
      setCommitMessage(`Update publication catalog (${ebooks.length} playbooks) via Admin Studio`);
      setCommitResult(null);
      setTestResult(null);
      if (!current.token || !current.repo) {
        setShowConfigSettings(true);
      }
    }
  }, [isOpen, ebooks.length]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveGitHubConfig(config);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    handleSaveConfig();
    const result = await testGitHubAccess(config);
    setTestResult(result);
    setIsTesting(false);
    if (result.success && result.repoDetails?.defaultBranch) {
      if (!config.branch) {
        setConfig(prev => ({ ...prev, branch: result.repoDetails!.defaultBranch }));
      }
    }
  };

  const handleCommit = async (e: FormEvent) => {
    e.preventDefault();
    handleSaveConfig();
    setIsCommitting(true);
    setCommitResult(null);

    const res = await commitCatalogToGitHub(config, ebooks, commitMessage);
    setCommitResult(res);
    setIsCommitting(false);

    if (res.success && onCommitSuccess) {
      onCommitSuccess();
    }
  };

  const handleCopyTypeScript = () => {
    const code = generateDefaultEbooksCode(ebooks);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadFile = () => {
    const code = generateDefaultEbooksCode(ebooks);
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defaultEbooks.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isConfigured = Boolean(config.owner && config.repo && config.token);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#101c2e] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Github className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Commit Catalog to GitHub Repository
              </h3>
              <p className="text-[11px] text-slate-300">
                Pushes your updated books, pricing, and designs directly into your GitHub repository.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* SUCCESS RESULT SCREEN */}
          {commitResult && commitResult.success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-emerald-950 text-sm">
                    Successfully Committed to GitHub!
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {commitResult.message}
                  </p>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60 text-xs">
                {commitResult.commitUrl && (
                  <a
                    href={commitResult.commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    View Commit on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {commitResult.actionsUrl && (
                  <a
                    href={commitResult.actionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-sky-900 bg-sky-100/80 hover:bg-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    View GitHub Pages Deployment Status
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <p className="text-[11px] text-emerald-700 italic">
                GitHub Actions has automatically triggered the build workflow (`deploy.yml`). Your live site will update in approximately 1-2 minutes.
              </p>
            </div>
          ) : commitResult && !commitResult.success ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Commit Failed</span>
                <p className="mt-0.5">{commitResult.message}</p>
              </div>
            </div>
          ) : null}

          {/* MAIN COMMIT FORM */}
          <form onSubmit={handleCommit} className="space-y-4">
            
            {/* Target File Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target File in Repository
                </span>
                <div className="font-mono text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="text-[#0A1628]">src/data/defaultEbooks.ts</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{ebooks.length} Playbooks</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigSettings(!showConfigSettings)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#0A1628] bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  {showConfigSettings ? 'Hide Repo Settings' : 'Configure Repo'}
                </button>
              </div>
            </div>

            {/* REPOSITORY SETTINGS DRAWER */}
            {showConfigSettings && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                    GitHub Connection Settings
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Stored securely in your browser</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      GitHub Owner / Organization *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.owner}
                      onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                      placeholder="e.g. jnj-innovations"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.repo}
                      onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                      placeholder="e.g. jnj-innovations.github.io"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Target Branch
                    </label>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={config.branch}
                        onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                        placeholder="main"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      GitHub Personal Access Token (PAT) *
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        required
                        value={config.token}
                        onChange={(e) => setConfig({ ...config, token: e.target.value })}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full text-xs font-mono px-3 py-2 pr-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showToken ? 'Hide token' : 'Show token'}
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Token instructions tip */}
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-700" />
                    How to create your GitHub Token (30 seconds):
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-sky-800 space-y-0.5">
                    <li>Open <strong>github.com/settings/tokens</strong> (Developer Settings → Personal Access Tokens).</li>
                    <li>Click <strong>Generate new token (classic)</strong>.</li>
                    <li>Select the <strong>repo</strong> checkbox (Full control of private repositories).</li>
                    <li>Copy and paste the token above. It is stored strictly in your browser.</li>
                  </ol>
                </div>

                {/* Connection Test feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.autoCommit}
                      onChange={(e) => {
                        const updated = { ...config, autoCommit: e.target.checked };
                        setConfig(updated);
                        saveGitHubConfig(updated);
                      }}
                      className="rounded border-slate-300 text-[#0A1628] focus:ring-[#0A1628]"
                    />
                    <span>Auto-commit whenever I update a playbook</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !config.owner || !config.repo || !config.token}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    Test GitHub Connection
                  </button>
                </div>

              </div>
            )}

            {/* Commit Message input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Commit Message
              </label>
              <input
                type="text"
                required
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. Update catalog: 6 playbooks (price & inventory update)"
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
              />
            </div>

            {/* Primary Commit Button */}
            <button
              type="submit"
              disabled={isCommitting || !config.owner || !config.repo || !config.token}
              className="w-full flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-black text-white py-3.5 rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Writing Commit & Triggering GitHub Actions...
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4" />
                  Commit & Deploy to GitHub Pages
                </>
              )}
            </button>
          </form>

          {/* MANUAL / OFFLINE CODE ACTIONS */}
          <div className="pt-4 border-t border-slate-200">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Manual Export & Offline Tools
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download defaultEbooks.ts
              </button>

              <button
                type="button"
                onClick={handleCopyTypeScript}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied TypeScript to Clipboard' : 'Copy TypeScript Code'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
