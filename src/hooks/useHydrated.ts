import { useEffect, useState } from 'react';

/**
 * useHydrated — returns `false` during the very first render on the client
 * (which matches the prerendered HTML), then flips to `true` after mount.
 *
 * Why this exists:
 *   The site uses `vite-plugin-prerender` which snapshots the page in headless
 *   Chrome AFTER animations complete. As a result the static HTML served to
 *   real users shows the final state — entry animations never visibly play.
 *
 *   By using this flag together with a `key` prop on motion components, we
 *   force a remount once the client takes over, which causes `motion`'s
 *   `initial` → `animate` transition to play from scratch.
 *
 * Usage:
 *   const hydrated = useHydrated();
 *   <motion.div
 *     key={hydrated ? 'live' : 'pre'}
 *     initial={{ opacity: 0, y: 40 }}
 *     animate={{ opacity: 1, y: 0 }}
 *   />
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Defer one frame so the browser paints the prerendered HTML first;
    // this prevents a jarring "snap to initial" flash before the animation.
    const id = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return hydrated;
}
