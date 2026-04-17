export default function AdminBanner({ health, error }) {
  if (error) {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
        Backend'e bağlanılamadı: {error}
      </div>
    );
  }
  if (!health) {
    return <div className="rounded border border-slate-700 bg-slate-900 p-3 text-sm text-slate-400">Bağlanıyor...</div>;
  }
  if (!health.admin) {
    return (
      <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        ⚠️ Yönetici yetkisi yok. Dry-run (önizleme) çalışır, ama uygulama çoğu değişikliği yapamaz. PowerShell'i "Yönetici olarak çalıştır" ile başlat.
      </div>
    );
  }
  return (
    <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
      ✓ Yönetici modunda çalışıyor. Tüm değişiklikler uygulanabilir.
    </div>
  );
}
