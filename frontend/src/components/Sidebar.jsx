export default function Sidebar({ sections, active, onSelect }) {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 p-4">
      <div className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        WinOptimizer
      </div>
      <nav className="space-y-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition ${
              active === s.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
