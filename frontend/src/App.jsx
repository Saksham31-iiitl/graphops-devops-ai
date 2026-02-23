import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Hexagon, LayoutDashboard, Plus, Clock, Bell,
  Search, AlertCircle, Terminal, X, Zap, Loader2,
  Sun, Moon, LogOut, RefreshCw,
} from 'lucide-react'
import IncidentForm from './components/IncidentForm'
import ResponsePanel from './components/ResponsePanel'
import { createIncident, getIncidents, searchIncidents, updateIncidentStatus } from './api'

const SEVERITY_COLORS = {
  P1: 'text-red-400 bg-red-500/10 border-red-500/30',
  P2: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  P3: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  P4: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

const STATUS_COLORS = {
  Resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  Investigating: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
}

function formatTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <div className="relative group w-full flex justify-center">
      <button
        onClick={onClick}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
          active
            ? 'bg-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/20'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/70'
        }`}
      >
        <Icon size={17} />
      </button>
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        <div
          className="relative text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl"
          style={{ backgroundColor: 'var(--c-card)', borderColor: 'var(--c-border)', border: '1px solid', color: 'var(--tooltip-text, #e2e8f0)' }}
        >
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent" style={{ borderRightColor: 'var(--c-border)' }} />
          {label}
        </div>
      </div>
    </div>
  )
}

function ProfileDropdown({ isDark, onThemeToggle, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', handler) }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-52 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
      style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}
    >
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white text-sm font-bold shrink-0">
            S
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">Saksham</p>
            <p className="text-xs text-slate-500 truncate">DevOps Engineer</p>
          </div>
        </div>
      </div>
      <div className="p-1.5">
        <button
          onClick={() => { onThemeToggle(); onClose() }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors text-left"
        >
          {isDark ? <Sun size={13} className="text-slate-400" /> : <Moon size={13} className="text-slate-400" />}
          Switch to {isDark ? 'Light' : 'Dark'} Mode
        </button>
        <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors text-left">
          <LogOut size={13} className="text-slate-400" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchIncidents(query.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const staticItems = ['New Incident Analysis', 'View Recent Incidents', 'System Status Overview', 'Browse Runbooks']

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
          {searching
            ? <Loader2 size={14} className="text-slate-500 shrink-0 animate-spin" />
            : <Search size={14} className="text-slate-500 shrink-0" />
          }
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incidents, runbooks, services..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="p-2 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <p className="px-3 py-1.5 text-[10px] font-medium tracking-wider text-slate-600 uppercase">Incidents</p>
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={onClose}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.P2}`}>
                      {item.severity}
                    </span>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">{item.title}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ml-2 ${STATUS_COLORS[item.status] || STATUS_COLORS.Investigating}`}>
                    {item.status}
                  </span>
                </button>
              ))}
            </>
          ) : query.trim() && !searching ? (
            <p className="px-3 py-6 text-sm text-slate-500 text-center">No incidents found for "{query}"</p>
          ) : (
            staticItems.map((item, i) => (
              <button
                key={i}
                onClick={onClose}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left"
              >
                <Terminal size={13} className="text-slate-500 shrink-0" />
                {item}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2.5 flex items-center gap-4 bg-slate-900/40" style={{ borderTop: '1px solid var(--c-border)' }}>
          <span className="text-[11px] text-slate-600">↑↓ navigate</span>
          <span className="text-[11px] text-slate-600">↵ select</span>
          <span className="text-[11px] text-slate-600">ESC dismiss</span>
        </div>
      </div>
    </div>
  )
}

function RecentAnalyses({ incidents, loading }) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 mb-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">Recent Analyses</p>
        </div>
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-800/30" style={{ border: '1px solid var(--c-border)' }}>
              <div className="flex gap-2 mb-2">
                <div className="h-4 w-8 bg-slate-700/60 rounded" />
                <div className="h-4 w-16 bg-slate-700/60 rounded ml-auto" />
              </div>
              <div className="h-3 bg-slate-700/40 rounded w-full mb-1.5" />
              <div className="h-3 bg-slate-700/40 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="shrink-0 mb-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">Recent Analyses</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-slate-500">No incidents yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Submit an analysis to get started.</p>
          </div>
        ) : (
          incidents.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-800/30 transition-all duration-200"
              style={{ border: '1px solid var(--c-border)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.P2}`}>
                  {item.severity}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${STATUS_COLORS[item.status] || STATUS_COLORS.Investigating}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-snug mb-1.5">{item.title}</p>
              <p className="text-[10px] text-slate-500">{formatTime(item.created_at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function HistoryView({ incidents, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-slate-800/40 rounded-xl w-48 mb-6" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <div className="flex gap-3 mb-3">
              <div className="h-5 w-10 bg-slate-700/60 rounded-md" />
              <div className="h-5 w-48 bg-slate-700/40 rounded-md" />
              <div className="h-5 w-20 bg-slate-700/40 rounded-md ml-auto" />
            </div>
            <div className="h-3 bg-slate-700/30 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Incident History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{incidents.length} total incident{incidents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-all duration-150"
          style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ border: '1px solid var(--c-border)' }}>
            <Clock size={20} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">No incidents yet</p>
          <p className="text-xs text-slate-500">Submit your first incident analysis to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.P2}`}>
                    {item.severity}
                  </span>
                  <p className="text-sm font-medium text-white truncate">{item.title || item.incident}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${STATUS_COLORS[item.status] || STATUS_COLORS.Investigating}`}>
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatTime(item.created_at)}</span>
                </div>
              </div>
              {(item.environment || item.region) && (
                <div className="flex items-center gap-2 mt-3">
                  {item.environment && (
                    <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-800/50" style={{ border: '1px solid var(--c-border)' }}>
                      {item.environment}
                    </span>
                  )}
                  {item.region && (
                    <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-800/50" style={{ border: '1px solid var(--c-border)' }}>
                      {item.region}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [showPalette, setShowPalette] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [latency, setLatency] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [currentIncident, setCurrentIncident] = useState(null)
  const [statusLabel, setStatusLabel] = useState('ready')
  const [formKey, setFormKey] = useState(0)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('graphops-theme') !== 'light')

  useEffect(() => {
    localStorage.setItem('graphops-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await getIncidents()
      setIncidents(data)
    } catch {
      // silent — history failure doesn't block main workflow
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNewIncident = useCallback(() => {
    setResponse(null)
    setError(null)
    setFormKey((k) => k + 1)
    setActiveNav('dashboard')
  }, [])

  const handleSubmit = useCallback(async ({ incident, logs, severity, environment, region }) => {
    setLoading(true)
    setError(null)
    setResponse(null)
    setStatusLabel('ready')
    setCurrentIncident({ incident, severity, environment, region })
    const start = Date.now()
    try {
      const data = await createIncident({ incident, logs, severity, environment, region })
      setResponse(data)
      setStatusLabel('connected')
      setLatency(Date.now() - start)
      await fetchIncidents()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchIncidents])

  const handleStatusUpdate = useCallback(async (id, status) => {
    await updateIncidentStatus(id, status)
    if (status === 'Resolved') setStatusLabel('resolved')
    await fetchIncidents()
  }, [fetchIncidents])

  const statusBarConfig = loading
    ? { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', label: 'Analyzing...' }
    : statusLabel === 'resolved'
    ? { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Resolved' }
    : statusLabel === 'connected'
    ? { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Connected' }
    : { dot: 'bg-slate-600', text: 'text-slate-500', label: 'Ready' }

  const breadcrumb = activeNav === 'history' ? 'History' : 'Incident Analysis'

  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      className="flex h-screen text-slate-100 overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--c-canvas)' }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col items-center gap-1 w-16 shrink-0 border-r py-4 transition-colors duration-300"
        style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border-sm)' }}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 mb-5 shrink-0">
          <Hexagon size={17} className="text-cyan-400" />
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-3">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')} />
          <NavItem icon={Plus} label="New Incident" active={false} onClick={handleNewIncident} />
          <NavItem icon={Clock} label="History" active={activeNav === 'history'} onClick={() => setActiveNav('history')} />
        </div>
        <div className="shrink-0 mt-auto">
          <button
            onClick={() => setShowProfile((p) => !p)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white text-[11px] font-bold hover:ring-2 hover:ring-cyan-500/40 transition-all duration-150"
          >
            S
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="shrink-0 h-[52px] flex items-center justify-between px-5 backdrop-blur-sm border-b transition-colors duration-300"
          style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border-sm)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">GraphOps</span>
            <span className="text-slate-600 mx-0.5 select-none">/</span>
            <span className="text-sm text-slate-500">{breadcrumb}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search / ⌘K */}
            <button
              onClick={() => setShowPalette(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-500 text-xs hover:border-slate-600 hover:text-slate-400 transition-all duration-150"
            >
              <Search size={11} />
              <span>Quick search</span>
              <span className="flex items-center gap-0.5 ml-0.5">
                <kbd className="text-[9px] bg-slate-700/80 px-1 py-0.5 rounded leading-none">⌘</kbd>
                <kbd className="text-[9px] bg-slate-700/80 px-1 py-0.5 rounded leading-none">K</kbd>
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all duration-150"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Bell */}
            <button className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </button>

            {/* Avatar with profile dropdown */}
            <div className="relative ml-0.5">
              <button
                onClick={() => setShowProfile((p) => !p)}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white text-[11px] font-bold hover:ring-2 hover:ring-cyan-500/40 transition-all duration-150"
              >
                S
              </button>
              {showProfile && (
                <ProfileDropdown
                  isDark={isDark}
                  onThemeToggle={() => setIsDark((d) => !d)}
                  onClose={() => setShowProfile(false)}
                />
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">

            {activeNav === 'history' ? (
              <HistoryView incidents={incidents} loading={historyLoading} onRefresh={fetchIncidents} />
            ) : (
              <>
                {/* Two-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5 mb-6">
                  {/* Form card */}
                  <div
                    className="rounded-2xl p-6 shadow-xl shadow-slate-950/40 border transition-colors duration-300"
                    style={{ backgroundColor: 'var(--c-card)', borderColor: 'var(--c-border)' }}
                  >
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Zap size={13} className="text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-white leading-tight">Incident Analysis</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">AI-powered root cause investigation</p>
                      </div>
                    </div>
                    <IncidentForm key={formKey} onSubmit={handleSubmit} loading={loading} />
                  </div>

                  {/* Recent analyses card */}
                  <div
                    className="rounded-2xl p-5 shadow-xl shadow-slate-950/40 border flex flex-col transition-colors duration-300"
                    style={{ backgroundColor: 'var(--c-card)', borderColor: 'var(--c-border)' }}
                  >
                    <RecentAnalyses incidents={incidents} loading={historyLoading} />
                  </div>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3.5 mb-5 animate-fade-in">
                    <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-400 mb-0.5">Analysis Failed</p>
                      <p className="text-xs text-red-300/75 leading-relaxed">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                  <div className="animate-pulse space-y-4">
                    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-slate-700/60" />
                        <div className="h-3.5 bg-slate-700/50 rounded-md w-40" />
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 bg-slate-700/40 rounded w-full" />
                        <div className="h-3 bg-slate-700/40 rounded w-5/6" />
                        <div className="h-3 bg-slate-700/40 rounded w-4/6" />
                        <div className="h-3 bg-slate-700/40 rounded w-2/6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1].map((i) => (
                        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                          <div className="h-3 bg-slate-700/40 rounded w-20 mb-3" />
                          <div className="h-2 bg-slate-700/40 rounded w-full mb-2" />
                          <div className="h-2 bg-slate-700/40 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response panel */}
                {response && !loading && (
                  <ResponsePanel
                    suggestedFix={response.suggested_fix}
                    references={response.references || []}
                    confidenceScore={response.confidence_score}
                    incidentId={response.id}
                    incident={currentIncident}
                    onStatusUpdate={handleStatusUpdate}
                  />
                )}

                {/* Empty state */}
                {!response && !loading && !error && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 rounded-2xl border border-cyan-500/20 animate-pulse" style={{ animationDuration: '2.5s' }} />
                      <div className="absolute inset-[6px] rounded-xl border border-cyan-500/10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Terminal size={22} className="text-slate-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-2">Paste logs to begin AI analysis</p>
                    <p className="text-xs text-slate-500 mb-5">Fill out the incident form above to start investigation</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <kbd className="bg-slate-800/50 border border-slate-700/50 px-1.5 py-0.5 rounded text-slate-500 text-[10px]">⌘</kbd>
                      <kbd className="bg-slate-800/50 border border-slate-700/50 px-1.5 py-0.5 rounded text-slate-500 text-[10px]">↵</kbd>
                      <span>to run analysis</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Status bar */}
        <div
          className="shrink-0 h-[26px] border-t flex items-center justify-between px-4 transition-colors duration-300"
          style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border-sm)' }}
        >
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${statusBarConfig.dot}`} />
              <span className={`text-[11px] font-medium transition-colors duration-300 ${statusBarConfig.text}`}>
                {statusBarConfig.label}
              </span>
            </span>
            {latency != null && !loading && (
              <span className="text-[11px] text-slate-500">
                {latency >= 1000 ? `${(latency / 1000).toFixed(1)}s` : `${latency}ms`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500">GraphOps</span>
            <span className="text-[11px] text-slate-600">v1.0.0</span>
          </div>
        </div>
      </div>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  )
}
