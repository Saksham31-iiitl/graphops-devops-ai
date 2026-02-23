import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Loader2, ArrowRight, Globe, MapPin } from 'lucide-react'

const SEVERITY_CONFIG = {
  P1: {
    idle: 'text-slate-500 border-slate-700 bg-transparent hover:text-red-400 hover:border-red-500/50',
    active: 'text-red-300 border-red-400 bg-red-500/20 shadow-sm shadow-red-500/20',
  },
  P2: {
    idle: 'text-slate-500 border-slate-700 bg-transparent hover:text-orange-400 hover:border-orange-500/50',
    active: 'text-orange-300 border-orange-400 bg-orange-500/20 shadow-sm shadow-orange-500/20',
  },
  P3: {
    idle: 'text-slate-500 border-slate-700 bg-transparent hover:text-yellow-400 hover:border-yellow-500/50',
    active: 'text-yellow-300 border-yellow-400 bg-yellow-500/20 shadow-sm shadow-yellow-500/20',
  },
  P4: {
    idle: 'text-slate-500 border-slate-700 bg-transparent hover:text-blue-400 hover:border-blue-500/50',
    active: 'text-blue-300 border-blue-400 bg-blue-500/20 shadow-sm shadow-blue-500/20',
  },
}

const ENVIRONMENTS = ['Production', 'Staging', 'Development']
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1']

const SELECT_CLASS = `w-full border text-slate-300
  rounded-xl px-4 py-2.5 text-sm outline-none appearance-none
  focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-200`

const SELECT_STYLE = { backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }

function LogStats({ logs }) {
  if (!logs.trim()) return null
  const lines = logs.split('\n').filter((l) => l.trim())
  const errors = lines.filter((l) => /\bERROR\b/i.test(l)).length
  const warns = lines.filter((l) => /\bWARN(ING)?\b/i.test(l)).length
  return (
    <div className="flex items-center gap-2.5 mt-2">
      <span className="text-[11px] text-slate-600">{lines.length} lines</span>
      {errors > 0 && (
        <span className="text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md">
          {errors} ERROR{errors > 1 ? 'S' : ''}
        </span>
      )}
      {warns > 0 && (
        <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
          {warns} WARN{warns > 1 ? 'S' : ''}
        </span>
      )}
    </div>
  )
}

export default function IncidentForm({ onSubmit, loading }) {
  const [incident, setIncident] = useState('')
  const [logs, setLogs] = useState('')
  const [severity, setSeverity] = useState('P2')
  const [environment, setEnvironment] = useState('Production')
  const [region, setRegion] = useState('us-east-1')

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading && incident.trim()) {
          onSubmit({ incident: incident.trim(), logs: logs.trim(), severity, environment, region })
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [incident, logs, severity, environment, region, loading, onSubmit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!incident.trim() || loading) return
    onSubmit({ incident: incident.trim(), logs: logs.trim(), severity, environment, region })
  }

  const isEmpty = !incident.trim()
  const isDisabled = loading || isEmpty

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Incident description */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium tracking-wider text-slate-400 uppercase mb-2">
          <AlertTriangle size={12} className="text-amber-400" />
          Incident Description
        </label>
        <input
          type="text"
          value={incident}
          onChange={(e) => setIncident(e.target.value)}
          disabled={loading}
          placeholder="e.g. API gateway returning 503 errors after deployment"
          className="w-full border text-slate-100 placeholder-slate-600
                     rounded-xl px-4 py-3 text-sm outline-none
                     focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        />
      </div>

      {/* Severity pills */}
      <div>
        <label className="text-xs font-medium tracking-wider text-slate-400 uppercase mb-2.5 block">
          Severity
        </label>
        <div className="flex items-center gap-2">
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              disabled={loading}
              onClick={() => setSeverity(key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${severity === key ? cfg.active : cfg.idle}`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Environment + Region */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium tracking-wider text-slate-400 uppercase mb-2">
            <Globe size={11} className="text-slate-500" />
            Environment
          </label>
          <div className="relative">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              disabled={loading}
              className={SELECT_CLASS}
              style={SELECT_STYLE}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env} style={{ backgroundColor: 'var(--c-card)' }}>
                  {env}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-medium tracking-wider text-slate-400 uppercase mb-2">
            <MapPin size={11} className="text-slate-500" />
            Region
          </label>
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
              className={SELECT_CLASS}
              style={SELECT_STYLE}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r} style={{ backgroundColor: 'var(--c-card)' }}>
                  {r}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Logs textarea */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium tracking-wider text-slate-400 uppercase mb-2">
          <FileText size={12} className="text-cyan-400" />
          System Logs
        </label>
        <textarea
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
          disabled={loading}
          rows={7}
          placeholder={`Paste relevant logs here...\n\n[2024-01-15 14:23:01] ERROR: Connection timeout to upstream\n[2024-01-15 14:23:02] WARN: Retry attempt 1/3 failed\n[2024-01-15 14:23:03] ERROR: Circuit breaker OPEN`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontSize: '13px',
            lineHeight: '1.6',
            borderLeft: '2px solid rgba(6, 182, 212, 0.35)',
            backgroundColor: 'var(--c-surface)',
            borderColor: 'var(--c-border)',
          }}
          className="w-full border text-slate-300 placeholder-slate-700
                     rounded-xl px-4 py-3 outline-none resize-y min-h-[120px] max-h-[280px]
                     focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        />
        <LogStats logs={logs} />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isDisabled}
        className={`relative w-full flex items-center justify-between px-5 py-3.5 rounded-xl
                   text-sm font-semibold overflow-hidden transition-all duration-200
                   ${
                     loading
                       ? 'bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] text-white cursor-not-allowed opacity-70'
                       : isEmpty
                       ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60'
                       : 'bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] text-white hover:shadow-lg hover:shadow-cyan-900/40 hover:scale-[1.01] active:scale-[0.99]'
                   }`}
      >
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
        <div className="flex items-center gap-2.5 relative z-10">
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Analyzing Incident...</span>
            </>
          ) : (
            <>
              <ArrowRight size={15} />
              <span>Run Incident Analysis</span>
            </>
          )}
        </div>
        {isEmpty && !loading && (
          <span className="text-[11px] text-slate-600 relative z-10">Enter incident first</span>
        )}
        {!isEmpty && !loading && (
          <div className="flex items-center gap-1 relative z-10 opacity-60">
            <kbd className="text-[10px] bg-white/15 border border-white/20 px-1.5 py-0.5 rounded font-mono leading-none">⌘</kbd>
            <kbd className="text-[10px] bg-white/15 border border-white/20 px-1.5 py-0.5 rounded font-mono leading-none">↵</kbd>
          </div>
        )}
      </button>
    </form>
  )
}
