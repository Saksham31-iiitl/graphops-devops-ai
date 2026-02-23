import { useState, useEffect } from 'react'
import { CheckCircle2, BookOpen, Zap, Shield, TrendingUp, CheckCheck, Loader2, AlertCircle } from 'lucide-react'
import ReferenceCard from './ReferenceCard'

const SEVERITY_COLORS = {
  P1: 'text-red-400 bg-red-500/10 border-red-500/30',
  P2: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  P3: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  P4: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

// confidence_score from API is 0–1; >0.8 → cyan, 0.6–0.8 → indigo, <0.6 → red
function getConfidenceStyle(score) {
  if (score > 0.8) return { color: '#0EA5E9', label: 'High' }
  if (score >= 0.6) return { color: '#6366F1', label: 'Moderate' }
  return { color: '#EF4444', label: 'Low' }
}

function ConfidenceBar({ score }) {
  const [width, setWidth] = useState(0)
  const pct = Math.round(score * 100)
  const { color, label } = getConfidenceStyle(score)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>
          {pct}%
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
          style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, accent = 'cyan', count }) {
  const accentMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  }
  return (
    <div className="px-6 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg border ${accentMap[accent]}`}>
          <Icon size={13} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5">
          {count} {count === 1 ? 'result' : 'results'}
        </span>
      )}
    </div>
  )
}

export default function ResponsePanel({ suggestedFix, references = [], incident, incidentId, confidenceScore, onStatusUpdate }) {
  const [localStatus, setLocalStatus] = useState('Investigating')
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState(null)

  const isCode =
    suggestedFix.includes('\n') &&
    (suggestedFix.includes('  ') ||
      suggestedFix.includes('\t') ||
      /^(kubectl|docker|helm|terraform|aws|git|npm|yarn|pip|systemctl|service)\s/m.test(suggestedFix))

  const handleResolve = async () => {
    if (!incidentId || resolving) return
    setResolving(true)
    setResolveError(null)
    const prev = localStatus
    setLocalStatus('Resolved')
    try {
      await onStatusUpdate(incidentId, 'Resolved')
    } catch (err) {
      setLocalStatus(prev)
      setResolveError(err.message || 'Failed to update status.')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Investigation header card */}
      <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl p-6 shadow-xl shadow-slate-950/40">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={17} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">Investigation Complete</h2>
              <p className="text-xs text-slate-500 mt-0.5">AI root cause analysis generated</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {incident?.severity && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.P2}`}>
                {incident.severity}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-300 ${
                localStatus === 'Resolved'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
              }`}
            >
              {localStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-slate-800/40 border border-[var(--c-border)] rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp size={12} className="text-cyan-400" />
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">References</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{references.length}</span>
          </div>
          <div className="bg-slate-800/40 border border-[var(--c-border)] rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield size={12} className="text-indigo-400" />
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">Environment</span>
            </div>
            <span className="text-sm font-semibold text-white">{incident?.environment || '—'}</span>
          </div>
          <div className="bg-slate-800/40 border border-[var(--c-border)] rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-emerald-400" />
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">Confidence</span>
            </div>
            <ConfidenceBar score={confidenceScore ?? 0.75} />
          </div>
        </div>

        {incident?.incident && (
          <div className="bg-slate-900/50 border border-[var(--c-border)] rounded-xl px-4 py-3 mb-4">
            <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase mb-1.5">Incident</p>
            <p className="text-sm text-slate-300 leading-relaxed">{incident.incident}</p>
          </div>
        )}

        {/* Mark as Resolved */}
        {localStatus === 'Investigating' && (
          <div className="space-y-2">
            <button
              onClick={handleResolve}
              disabled={resolving || !incidentId}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-emerald-500/10 border border-emerald-500/25 text-emerald-400
                         hover:bg-emerald-500/20 hover:border-emerald-500/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              {resolving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              {resolving ? 'Marking Resolved...' : 'Mark as Resolved'}
            </button>
            {resolveError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} />
                {resolveError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Remediation card */}
      <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl overflow-hidden shadow-xl shadow-slate-950/40">
        <SectionHeader icon={Zap} title="Recommended Remediation" accent="cyan" />
        <div className="p-6">
          {isCode ? (
            <pre
              className="text-slate-200 overflow-x-auto whitespace-pre-wrap"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                fontSize: '13px',
                lineHeight: '1.65',
              }}
            >
              <code>{suggestedFix}</code>
            </pre>
          ) : (
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{suggestedFix}</p>
          )}
        </div>
      </div>

      {/* References card */}
      {references.length > 0 && (
        <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl overflow-hidden shadow-xl shadow-slate-950/40">
          <SectionHeader icon={BookOpen} title="Similar Past Incidents" accent="indigo" count={references.length} />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {references.map((ref, i) => (
              <ReferenceCard key={i} reference={ref} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
