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
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Undercooked Display</h1>
      <p>Backend health: {status}</p>
    </div>
  );
}
