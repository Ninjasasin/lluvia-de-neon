import { useCallback, useEffect, useState } from 'react';

/** Estado y conmutador del modo de pantalla completa del navegador. */
export function useFullscreen(): { active: boolean; supported: boolean; toggle: () => void } {
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled === true;
  const [active, setActive] = useState(() => typeof document !== 'undefined' && document.fullscreenElement !== null);

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, []);

  return { active, supported, toggle };
}
