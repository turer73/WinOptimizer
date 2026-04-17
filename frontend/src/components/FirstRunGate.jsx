import { useEffect, useState } from 'react';
import { api } from '../api.js';

/**
 * Mandatory first-run guard. Blocks the entire UI until a System Restore
 * point has been successfully created. No "skip" button — if the user is
 * not an Administrator they are instructed to relaunch.
 */
export default function FirstRunGate({ health, children }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!health) return;
    api.firstRunStatus()
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [health]);

  async function runFirstRun() {
    setRunning(true);
    setError(null);
    try {
      const r = await api.firstRunEnsure(false);
      setResult(r);
      // Re-read status so the gate closes automatically on success.
      const s = await api.firstRunStatus();
      setStatus(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  // Loading: show a slim banner so the rest of the app can paint.
  if (loading || !health) return children;

  // Already done: pass through.
  if (status?.completed) return children;

  // Not admin: hard block.
  if (!health.admin) {
    return (
      <Overlay>
        <h2 className="text-xl font-semibold mb-3">Yönetici Olarak Başlat</h2>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          WinOptimizer ilk kez çalışıyor. Güvenlik için <b>zorunlu</b> bir Sistem Geri Yükleme
          Noktası oluşturulması gerekiyor. Bu işlem yönetici yetkisi ister.
        </p>
        <div className="space-y-2 text-sm text-slate-400">
          <div className="border border-slate-800 rounded p-3 bg-black/40">
            <div className="font-medium text-slate-200 mb-1">Ne yapman gerek:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Bu pencereyi kapat.</li>
              <li>
                PowerShell'i <b>"Yönetici olarak çalıştır"</b> ile aç (Start menüsü →
                PowerShell sağ tık → Run as Administrator).
              </li>
              <li>
                Projede <code className="bg-slate-800 px-1 rounded">.\launch.ps1</code>{' '}
                komutunu çalıştır veya <code className="bg-slate-800 px-1 rounded">npm run dev</code>{' '}
                de.
              </li>
            </ol>
          </div>
          <p className="text-xs text-slate-500">
            Host: {health.host} • Kullanıcı mevcut sessionu admin değil.
          </p>
        </div>
      </Overlay>
    );
  }

  // Admin + not done: prompt to run.
  const lastResult = result?.result;
  const actions = lastResult?.actions ?? [];
  const succeeded = result && result.ok && lastResult?.ok;
  const failed = result && (!result.ok || !lastResult?.ok);

  return (
    <Overlay>
      <h2 className="text-xl font-semibold mb-2">İlk Çalıştırma — Güvenlik Noktası</h2>
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
        Herhangi bir değişiklik yapmadan önce sisteminin mevcut halini garanti altına almak için
        otomatik bir <b>Sistem Geri Yükleme Noktası</b> oluşturulacak.
      </p>

      <div className="border border-slate-800 rounded p-3 bg-black/40 text-sm space-y-2 mb-4">
        <div className="text-slate-200 font-medium">Sırasıyla şunlar yapılacak:</div>
        <ol className="list-decimal list-inside text-slate-400 space-y-1">
          <li><b>System Protection</b> {health.systemDrive || 'C:'} sürücüsünde açık değilse açılır.</li>
          <li>Windows'un "24 saatte bir" oluşturma kısıtlaması geçici olarak kaldırılır.</li>
          <li>
            <code className="bg-slate-800 px-1 rounded">"WinOptimizer - First Run"</code> adıyla bir
            restore point oluşturulur.
          </li>
          <li>Kısıtlama eski haline döndürülür.</li>
        </ol>
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
          Bu işlem genelde 10–30 saniye sürer ve ~1% disk alanı rezerve eder. Hiçbir şey silmez.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200 mb-3">
          Hata: {error}
        </div>
      )}

      {failed && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200 mb-3">
          Geri yükleme noktası oluşturulamadı. Adım adım rapor:
          <ul className="mt-2 space-y-1 text-xs">
            {actions.map((a, i) => (
              <li key={i} className={a.ok ? 'text-emerald-300' : 'text-red-300'}>
                {a.ok ? '✓' : '✗'} {a.step} {a.error ? `— ${a.error}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {succeeded && (
        <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200 mb-3">
          Geri yükleme noktası başarıyla oluşturuldu. Uygulama açılıyor…
        </div>
      )}

      <div className="flex gap-2">
        <button
          disabled={running || succeeded}
          onClick={runFirstRun}
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40"
        >
          {running ? 'Oluşturuluyor…' : succeeded ? 'Tamamlandı' : 'Devam Et'}
        </button>
        {failed && (
          <button
            onClick={runFirstRun}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </Overlay>
  );
}

function Overlay({ children }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
