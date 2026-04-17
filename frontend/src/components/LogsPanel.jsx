import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function LogsPanel() {
  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.listLogs().then((r) => {
      setFiles(r.files ?? []);
      if (r.files?.length) setActive(r.files[0]);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    api.getLog(active).then((r) => setEntries(r.entries ?? []));
  }, [active]);

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Audit Loglar</h2>
        <p className="text-sm text-slate-400">Her çağrının tam kaydı. JSON satır satır.</p>
      </header>
      <div className="flex gap-2 overflow-x-auto">
        {files.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              active === f ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-1 max-h-[65vh] overflow-auto border border-slate-800 rounded-lg p-3 bg-black/30">
        {entries.length === 0 ? (
          <div className="text-slate-600 text-sm">Bu tarihte kayıt yok.</div>
        ) : entries.map((e, i) => (
          <pre key={i} className="text-xs font-mono text-slate-400 whitespace-pre-wrap break-all">
            {JSON.stringify(e, null, 2)}
          </pre>
        ))}
      </div>
    </section>
  );
}
