'use client';

import { useEffect } from 'react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = () => {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => {
        /* offline non disponibile */
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
