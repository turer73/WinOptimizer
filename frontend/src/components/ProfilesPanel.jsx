import { useEffect, useState } from 'react';
import { api } from '../api.js';

const RISK_COLOR = {
  low: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  medium: 'bg-amber-900/40 text-amber-300 border-amber-700',
  high: 'bg-red-900/40 text-red-300 border-red-700',
};

export default function ProfilesPanel({ onResult }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(null);

  useEffect(() => {
    api.listProfiles().then((r) => setProfiles(r.profiles ?? [])).catch(console.error);
  }, []);

  async function apply(profile, dryRun) {
    if (!dryRun) {
      const ok = confirm(
        `"${profile.name}" profilini GERÇEKTEN uygulayacaksın.\n\n` +
          `Risk seviyesi: ${profile.risk}\n` +
          `${profile.steps.length} adım çalışacak.\n\n` +
          `Yedek alındı mı? Devam etmek için Tamam.`,
      );
      if (!ok) return;
    }
    setRunning(profile.id + (dryRun ? ':dry' : ':apply'));
    setLoading(true);
    try {
      const r = await api.applyProfile(profile.id, { dryRun });
      onResult(r);
    } finally {
      setLoading(false);
      setRunning(null);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Profiller</h2>
        <p className="text-sm text-slate-400">
          Hazır preset'lerden birini çalıştır. Önce her zaman dry-run yap.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="border border-slate-800 rounded-xl p-5 bg-slate-900/50 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">{p.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${RISK_COLOR[p.risk] ?? ''}`}>
                {p.risk}
              </span>
            </div>
            <p className="text-sm text-slate-400 flex-1">{p.description}</p>
            <div className="text-xs text-slate-500 mt-3">
              {p.steps?.length ?? 0} adım
            </div>
            <div className="flex gap-2 mt-4">
              <button
                disabled={loading}
                onClick={() => apply(p, true)}
                className="flex-1 px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
              >
                {running === p.id + ':dry' ? 'Çalışıyor…' : 'Dry-run'}
              </button>
              <button
                disabled={loading}
                onClick={() => apply(p, false)}
                className="flex-1 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-40"
              >
                {running === p.id + ':apply' ? 'Çalışıyor…' : 'Uygula'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
