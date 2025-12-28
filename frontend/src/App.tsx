import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState('Checking...');
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setStatus(`${d.status} (${d.db})`))
      .catch(() => setStatus('error'));
  }, []);
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-800">Undercooked</h1>
        <p className="mt-2 text-slate-700">
          Backend health: <span className="font-mono">{status}</span>
        </p>
      </div>
    </div>
  );
}
