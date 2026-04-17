import { useEffect, useState } from 'react';

export default function ModulePanel({ title, description, list, run, onResult }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    list().then((r) => setActions(r.actions ?? [])).catch(console.error);
  }, [list]);

  async function trigger(action, dryRun) {
    setLoading(action + (dryRun ? ':dry' : ':apply'));
    try {
      const r = await run(action, dryRun);
      onResult(r);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action) => (
          <div key={action} className="border border-slate-800 rounded-lg p-4 bg-slate-900/40">
            <div className="font-mono text-sm mb-3">{action}</div>
            <div className="flex gap-2">
              <button
                disabled={!!loading}
                onClick={() => trigger(action, true)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
              >
                {loading === action + ':dry' ? '…' : 'Dry-run'}
              </button>
              <button
                disabled={!!loading}
                onClick={() => trigger(action, false)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-40"
              >
                {loading === action + ':apply' ? '…' : 'Uygula'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
