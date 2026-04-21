import { useEffect, useRef, useCallback } from 'react';

// ── Cloudflare Turnstile Widget ─────────────────────────────────────────────
// Renders an invisible or managed CAPTCHA widget.
// Calls onVerify(token) when the user passes the challenge.
//
// Usage:
//   <Turnstile siteKey="0x..." onVerify={setToken} />
//
// Docs: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, any>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

// Use env var or fallback to Cloudflare's always-pass test key for development
const DEFAULT_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded && window.turnstile) return Promise.resolve();

  return new Promise((resolve) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    scriptLoading = true;
    loadCallbacks.push(resolve);

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

export function Turnstile({
  siteKey = DEFAULT_SITE_KEY,
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(async () => {
    if (!containerRef.current) return;

    await loadTurnstileScript();

    if (!window.turnstile || !containerRef.current) return;

    // Clean up existing widget
    if (widgetIdRef.current) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onError,
      theme,
      size,
    });
  }, [siteKey, onVerify, onExpire, onError, theme, size]);

  useEffect(() => {
    renderWidget();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return <div ref={containerRef} className={className} />;
}

/**
 * Hook for invisible Turnstile — returns { getToken, reset }.
 * Renders nothing visible. Call getToken() before submitting a form.
 */
export function useTurnstile(siteKey?: string) {
  const key = siteKey || DEFAULT_SITE_KEY;
  const tokenRef = useRef<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create hidden container
    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    containerRef.current = div;

    loadTurnstileScript().then(() => {
      if (!window.turnstile || !containerRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: key,
        size: 'invisible',
        callback: (token: string) => { tokenRef.current = token; },
        'expired-callback': () => { tokenRef.current = null; },
      });
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
      div.remove();
    };
  }, [key]);

  const getToken = (): string | null => tokenRef.current;

  const reset = () => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch {}
    }
  };

  return { getToken, reset };
}
