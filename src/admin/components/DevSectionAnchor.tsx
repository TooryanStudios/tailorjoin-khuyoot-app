import React, { useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Copy, Link as LinkIcon } from 'lucide-react';

function isDevEnv() {
  return Boolean((import.meta as any)?.env?.DEV);
}

async function copyTextToClipboard(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}

  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export function DevSectionAnchor({ sectionId }: { sectionId: string }) {
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // Admin anchors are useful in production too (support/debug). Keep extra debug text dev-only.
  const show = true;
  const showDebugPath = isDevEnv();

  const href = useMemo(() => {
    // Copy a fully qualified URL for easy sharing
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = `/admin/${sectionId}`;
    return `${origin}${path}`;
  }, [sectionId]);

  const handleCopy = useCallback(async () => {
    await copyTextToClipboard(href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 900);
  }, [href]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        #{sectionId}
      </span>

      <Link
        to={`/admin/${sectionId}`}
        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        title={`Open /admin/${sectionId}`}
        aria-label={`Open /admin/${sectionId}`}
      >
        <LinkIcon size={14} />
      </Link>

      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        title={copied ? 'Copied' : 'Copy section URL'}
        aria-label="Copy section URL"
      >
        <Copy size={14} />
      </button>

      {/* Helps when debugging route-based rendering */}
      {showDebugPath && (
        <span className="hidden lg:inline text-[10px] text-slate-400" title={location.pathname}>
          {location.pathname}
        </span>
      )}
    </div>
  );
}
