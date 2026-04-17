export default function ResultDrawer({ result, onClose }) {
  if (!result) return null;

  const ok = result.ok;
  const dry = result.dryRun ?? result.steps?.some((s) => s.dryRun);

  return (
    <div className="fixed inset-0 z-20 bg-black/60 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-slate-800 px-5 py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">Sonuç</div>
            <div className="text-xs text-slate-400">
              {result.script || result.profile} — {dry ? 'Dry-run' : 'Uygulandı'} {ok ? '✓' : '✗'}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </header>
        <div className="overflow-auto p-4">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
