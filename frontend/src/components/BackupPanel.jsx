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

  async function runRestore(folderName, dryRun) {
    if (!dryRun) {
      const ok = confirm(
        `"${folderName}" klasöründeki registry yedeklerini geri yükle?\n\n` +
          `Bu işlem:\n` +
          `• Orijinalinde VAR olan key'leri eski değerine döndürür\n` +
          `• Orijinalinde YOKTU ama sonradan eklenen key'leri siler\n\n` +
          `Geri alınamaz — devam etmeden önce dry-run yap.`,
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const r = await api.restore(folderName, dryRun);
      onResult(r);
    } finally { setLoading(false); }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Yedek & Geri Yükle</h2>
        <p className="text-sm text-slate-400">
          Değişiklik uygulamadan önce yedek al. Sorun çıkarsa buradaki "Geri Yükle" ile eski registry değerlerine dön.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading}
          onClick={runExport}
          className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
        >
          Sistem Durumunu Dışa Aktar
        </button>
        <button
          disabled={loading}
          onClick={runCheckpoint}
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-40"
        >
          System Restore Point
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-sm">Registry Yedekleri</h3>
          {backups.backups?.length ? (
            <ul className="text-xs space-y-2">
              {backups.backups.map((b) => (
                <li key={b.path} className="border border-slate-800 rounded p-2 space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="font-mono">{b.name}</span>
                    <span className="text-slate-500 whitespace-nowrap">
                      {(b.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <div className="text-slate-500">{new Date(b.createdAt).toLocaleString()}</div>
                  <div className="flex gap-1 pt-1">
                    <button
                      disabled={loading}
                      onClick={() => runRestore(b.name, true)}
                      className="px-2 py-1 rounded bg-sky-800 hover:bg-sky-700 text-xs disabled:opacity-40"
                    >
                      Dry-run Restore
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => runRestore(b.name, false)}
                      className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs disabled:opacity-40"
                    >
                      Geri Yükle
                    </button>
                  </div>
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
          <p className="mt-3 text-xs text-slate-500">
            System Restore Point ile geri almak için Windows'un "Sistem Geri Yükleme" aracını kullan
            (WinKey → "sistem geri yükleme").
          </p>
        </div>
      </div>
    </section>
  );
}
