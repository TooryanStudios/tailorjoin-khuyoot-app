import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const Button: React.FC<{
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'neutral';
}> = ({ label, onClick, tone = 'neutral' }) => {
  const base =
    'h-10 px-4 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950';
  const styles =
    tone === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400'
      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 focus:ring-white/40';
  return (
    <button type="button" className={`${base} ${styles}`} onClick={onClick}>
      {label}
    </button>
  );
};

export const NavDebugLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold">Navigation Debug</h1>
        <p className="mt-2 text-sm text-white/70">
          Current path: <span className="font-mono text-white">{location.pathname}</span>
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Button label="Go: A" tone="primary" onClick={() => navigate('/__dev/nav-debug/a')} />
          <Button label="Go: B" tone="primary" onClick={() => navigate('/__dev/nav-debug/b')} />
          <Button label="Go: C" tone="primary" onClick={() => navigate('/__dev/nav-debug/c')} />

          <Button label="Go: Home (/)" onClick={() => navigate('/')} />
          <Button label="Go: Demo Shell" onClick={() => navigate('/demo-shell/a')} />
          <Button label="Go: Collections" onClick={() => navigate('/collections')} />
        </div>

        <div className="mt-6 text-sm text-white/70">
          Hard-navigation links (bypass React Router):
          <div className="mt-2 flex flex-wrap gap-3">
            <a className="underline" href="/__dev/nav-debug/a">/a</a>
            <a className="underline" href="/__dev/nav-debug/b">/b</a>
            <a className="underline" href="/__dev/nav-debug/c">/c</a>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white/80">Outlet</div>
          <div className="mt-3">
            <Outlet />
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Tip: if buttons don’t change the URL, something is blocking clicks. If URL changes but content doesn’t, routing/layout is wrong.
        </div>

        <div className="mt-6 text-sm">
          <Link className="underline" to="/demo-shell/a">
            Open Demo Shell
          </Link>
        </div>
      </div>
    </div>
  );
};

export const NavDebugIndex: React.FC = () => {
  return <div className="text-white/80">Pick A/B/C above.</div>;
};

export const NavDebugA: React.FC = () => {
  return <div className="text-white/90">✅ You reached target A.</div>;
};

export const NavDebugB: React.FC = () => {
  return <div className="text-white/90">✅ You reached target B.</div>;
};

export const NavDebugC: React.FC = () => {
  return <div className="text-white/90">✅ You reached target C.</div>;
};
