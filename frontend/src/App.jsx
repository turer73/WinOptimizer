import { useEffect, useState } from 'react';
import { api } from './api.js';
import ProfilesPanel from './components/ProfilesPanel.jsx';
import ModulePanel from './components/ModulePanel.jsx';
import BackupPanel from './components/BackupPanel.jsx';
import LogsPanel from './components/LogsPanel.jsx';
import ResultDrawer from './components/ResultDrawer.jsx';
import FirstRunGate from './components/FirstRunGate.jsx';

const TABS = [
  { id: 'profiles', label: 'Profiller' },
  { id: 'privacy', label: 'Gizlilik' },
  { id: 'bloatware', label: 'Bloatware' },
  { id: 'services', label: 'Servisler' },
  { id: 'network', label: 'Ağ' },
  { id: 'performance', label: 'Performans' },
  { id: 'backup', label: 'Yedek' },
  { id: 'logs', label: 'Loglar' },
];

export default function App() {
  const [tab, setTab] = useState('profiles');
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setHealth({ ok: false, error: e.message }));
  }, []);

  return (
    <FirstRunGate health={health}>
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">WinOptimizer</h1>
            <p className="text-xs text-slate-400">Şeffaf • Denetlenebilir • Geri alınabilir</p>
          </div>
          <HealthBadge health={health} />
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-slate-800 text-white border-b-2 border-sky-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'profiles' && <ProfilesPanel onResult={setResult} />}
        {tab === 'privacy' && (
          <ModulePanel
            title="Gizlilik"
            description="Telemetri, reklam ID, Cortana, konum izleme ve aktivite geçmişini kapat."
            list={api.listPrivacy}
            run={api.runPrivacy}
            onResult={setResult}
          />
        )}
        {tab === 'bloatware' && <BloatwarePanel onResult={setResult} />}
        {tab === 'services' && <ServicesPanel onResult={setResult} />}
        {tab === 'network' && (
          <ModulePanel
            title="Ağ"
            description="Telemetri host'larını blokla, DNS'i Cloudflare/Quad9 yap veya sıfırla."
            list={api.listNetwork}
            run={api.runNetwork}
            onResult={setResult}
          />
        )}
        {tab === 'performance' && (
          <ModulePanel
            title="Performans"
            description="Görsel efektleri kapat, güç planını yüksek performansa al, temp temizle."
            list={api.listPerformance}
            run={api.runPerformance}
            onResult={setResult}
          />
        )}
        {tab === 'backup' && <BackupPanel onResult={setResult} />}
        {tab === 'logs' && <LogsPanel />}
      </main>

      <ResultDrawer result={result} onClose={() => setResult(null)} />
    </div>
    </FirstRunGate>
  );
}

function HealthBadge({ health }) {
  if (!health) return <span className="text-slate-500 text-sm">bağlanıyor…</span>;
  if (!health.ok) return <span className="text-red-400 text-sm">API ulaşılamıyor</span>;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
        health.admin ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {health.admin ? 'Admin' : 'Kısıtlı (Admin değil)'}
      </span>
      <span className="text-slate-500">{health.host}</span>
    </div>
  );
}

function BloatwarePanel({ onResult }) {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await api.listInstalled();
      setApps(r.result?.apps ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(name) {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  }

  async function remove(dryRun) {
    if (selected.size === 0) return;
    const r = await api.removeApps([...selected], dryRun);
    onResult(r);
    if (!dryRun) await load();
  }

  const filtered = apps.filter((a) => !filter || a.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Bloatware</h2>
        <p className="text-sm text-slate-400">Yüklü UWP uygulamaları. Kaldırmak istediklerini seç.</p>
      </header>
      <div className="flex gap-3 items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Ara (örn: Xbox, Teams)"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-sky-500"
        />
        <button onClick={load} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">
          Yenile
        </button>
      </div>
      <div className="flex gap-2">
        <button
          disabled={selected.size === 0}
          onClick={() => remove(true)}
          className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
        >
          Dry-run ({selected.size})
        </button>
        <button
          disabled={selected.size === 0}
          onClick={() => {
            if (confirm(`${selected.size} uygulamayı kaldır? Geri almak için Store'dan tek tek kurman gerekir.`)) {
              remove(false);
            }
          }}
          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-40"
        >
          Kaldır
        </button>
      </div>
      {loading ? (
        <div className="text-slate-500">Yükleniyor…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-[60vh] overflow-auto border border-slate-800 rounded-lg p-2">
          {filtered.map((a) => (
            <label
              key={a.packageFullName}
              className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-800 ${
                selected.has(a.name) ? 'bg-sky-900/30' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(a.name)}
                onChange={() => toggle(a.name)}
                className="mt-1"
              />
              <div className="min-w-0">
                <div className="text-sm truncate">{a.name}</div>
                <div className="text-xs text-slate-500 truncate">{a.publisher}</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

function ServicesPanel({ onResult }) {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.listServices();
      setServices(r.result?.services ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(name) {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  }

  async function disable(dryRun) {
    const r = await api.disableServices([...selected], dryRun);
    onResult(r);
    if (!dryRun) await load();
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Servisler</h2>
        <p className="text-sm text-slate-400">Devre dışı bırakılabilecek ve güvenli hedef servisler.</p>
      </header>
      <div className="flex gap-2">
        <button onClick={load} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Yenile</button>
        <button
          disabled={selected.size === 0}
          onClick={() => disable(true)}
          className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-40"
        >
          Dry-run ({selected.size})
        </button>
        <button
          disabled={selected.size === 0}
          onClick={() => disable(false)}
          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-40"
        >
          Devre Dışı Bırak
        </button>
      </div>
      {loading ? (
        <div className="text-slate-500">Yükleniyor…</div>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Seç</th>
                <th className="text-left px-3 py-2">Ad</th>
                <th className="text-left px-3 py-2">Görünen Ad</th>
                <th className="text-left px-3 py-2">Durum</th>
                <th className="text-left px-3 py-2">Başlangıç</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.name} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="px-3 py-2">
                    {s.present !== false && (
                      <input
                        type="checkbox"
                        checked={selected.has(s.name)}
                        onChange={() => toggle(s.name)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{s.name}</td>
                  <td className="px-3 py-2">{s.displayName ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-3 py-2">{s.status ?? <span className="text-slate-600">yok</span>}</td>
                  <td className="px-3 py-2">{s.startType ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
