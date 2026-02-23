import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, BookOpen, AlertCircle, ExternalLink } from 'lucide-react'

const TYPE_CONFIG = {
  runbook: {
    label: 'Runbook',
    icon: BookOpen,
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  incident: {
    label: 'Incident',
    icon: AlertCircle,
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
}

function ScoreBar({ score }) {
  const [width, setWidth] = useState(0)
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#0EA5E9' : '#F59E0B'

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-semibold tabular-nums w-9 text-right shrink-0"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  )
}

export default function ReferenceCard({ reference, index }) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[reference.type] || TYPE_CONFIG.incident
  const Icon = config.icon

  return (
    <div
      className="bg-slate-800/40 border rounded-xl overflow-hidden
                 hover:border-slate-500/60 hover:bg-slate-800/60
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/40
                 transition-all duration-200 animate-fade-in"
      style={{ borderColor: 'var(--c-border)' }}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${config.className}`}
          >
            <Icon size={10} />
            {config.label}
          </span>
          <span className="flex items-center gap-1 text-slate-400 text-xs font-medium min-w-0 overflow-hidden">
            <ExternalLink size={10} className="text-slate-600 shrink-0" />
            <span className="truncate text-slate-400">{reference.source}</span>
          </span>
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase mb-1.5">
            Similarity
          </p>
          <ScoreBar score={reference.score} />
        </div>

        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-150"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              View Reference
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 bg-slate-900/60 animate-fade-in" style={{ borderColor: 'var(--c-border)' }}>
          <p
            className="text-slate-300 leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            {reference.text}
          </p>
        </div>
      )}
    </div>
  )
}
