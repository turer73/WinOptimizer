import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function BackupPanel({ onResult }) {
  const [backups, setBackups] = useState({ backups: [], restorePoints: [] });
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await api.listBackups();
    setBackups(r.result ?? { backups: [], restorePoints: [] });
  }

  useEffect(() => { load(); }, []);

  async function runExport() {
    setLoading(true);
    try {
      const r = await api.exportState();
      onResult(r);
      await load();
    } finally { setLoading(false); }
  }

  async function runCheckpoint() {
    const desc = prompt('Restore point açıklaması:', 'WinOptimizer') ?? 'WinOptimizer';
    setLoading(true);
    try {
      const r = await api.checkpoint(desc);
      onResult(r);
      await load();
    } finally { setLoading(false); }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Yedek</h2>
        <p className="text-sm text-slate-400">Herhangi bir değişiklik uygulamadan önce mutlaka yedek al.</p>
      </header>

      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={runExport}
          className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
        >
          Sistem Durumunu Dışa Aktar (registry + AppX + servisler)
        </button>
        <button
          disabled={loading}
          onClick={runCheckpoint}
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-40"
        >
          System Restore Point Oluştur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-sm">Dosya Yedekleri</h3>
          {backups.backups?.length ? (
            <ul className="text-xs space-y-1">
              {backups.backups.map((b) => (
                <li key={b.path} className="flex justify-between gap-3">
                  <span className="truncate">{b.name}</span>
                  <span className="text-slate-500 whitespace-nowrap">
                    {(b.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-slate-600 text-xs">Henüz yedek yok.</div>
          )}
        </div>
        <div className="border border-slate-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-sm">System Restore Points</h3>
          {backups.restorePoints?.length ? (
            <ul className="text-xs space-y-1">
              {backups.restorePoints.map((r) => (
                <li key={r.sequence}>
                  <span className="text-slate-500">#{r.sequence}</span> {r.description}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-slate-600 text-xs">Yok veya Admin yetkisi gerekli.</div>
          )}
        </div>
      </div>
    </section>
  );
}
