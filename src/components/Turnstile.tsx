import { useEffect, useRef, useCallback, useState } from 'react';

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

// Module-level script state
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (window.turnstile) return Promise.resolve();

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    const timeout = window.setTimeout(() => {
      scriptPromise = null;
      reject(new Error('Timed out loading Turnstile'));
    }, 10000);

    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.turnstile) {
        resolve();
        return;
      }
      scriptPromise = null;
      reject(new Error('Turnstile loaded without exposing widget API'));
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      scriptPromise = null;
      reject(new Error('Failed to load Turnstile'));
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function Turnstile({
  siteKey = DEFAULT_SITE_KEY,
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  size = 'normal',
  className = ''
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const resetWidget = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('loading');
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        if (mountedRef.current) setStatus('ready');
      } catch {
        renderWidget();
      }
    } else {
      renderWidget();
    }
  }, []);

  const renderWidget = useCallback(async () => {
    if (!mountedRef.current || !containerRef.current) return;
    setStatus('loading');

    try {
      await loadTurnstileScript();
    } catch {
      if (mountedRef.current) {
        setStatus('error');
        onError?.();
      }
      return;
    }

    if (!mountedRef.current || !window.turnstile || !containerRef.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setStatus('error');
        onError?.();
      }
    }, 10000);

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (!mountedRef.current) return;
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setStatus('verified');
          onVerify(token);
        },
        'expired-callback': () => {
          if (!mountedRef.current) return;
          setStatus('error');
          onExpire?.();
        },
        'error-callback': () => {
          if (!mountedRef.current) return;
          setStatus('error');
          onError?.();
        },
        theme,
        size
      });
      if (mountedRef.current) setStatus('ready');
    } catch (err) {
      if (mountedRef.current) {
        setStatus('error');
        onError?.();
      }
    }
  }, [siteKey, onVerify, onExpire, onError, theme, size]);

  // Render widget once on mount
  useEffect(() => {
    mountedRef.current = true;
    renderWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {status === 'loading' && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-white/40">Loading verification...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-2 text-center space-y-1">
          <div className="text-[10px] text-rose-400">Verification failed to load</div>
          <button
            type="button"
            onClick={resetWidget}
            className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
          >
            Click to Retry
          </button>
        </div>
      )}
    </div>
  );
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
        callback: (token: string) => {
          tokenRef.current = token;
        },
        'expired-callback': () => {
          tokenRef.current = null;
        }
      });
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
      }
      div.remove();
    };
  }, [key]);

  const getToken = (): string | null => tokenRef.current;

  const reset = () => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* noop */
      }
    }
  };

  return { getToken, reset };
}
