export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/60 p-4 ${className}`}>{children}</div>
  );
}

export function CardTitle({ children }) {
  return <h3 className="text-lg font-semibold mb-2">{children}</h3>;
}

export function Button({ children, onClick, variant = 'primary', disabled, className = '' }) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'border border-slate-700 hover:bg-slate-800 text-slate-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant] || styles.primary} ${className}`}
    >
      {children}
    </button>
  );
}

export function Output({ data }) {
  if (!data) return null;
  return (
    <pre className="mt-3 text-xs bg-slate-950 border border-slate-800 rounded p-2 overflow-auto max-h-96 whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
