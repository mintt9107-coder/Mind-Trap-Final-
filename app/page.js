'use client';

import { useEffect } from 'react';

function getRuntimeConfig() {
  return {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
    openRouter: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      modelId: process.env.NEXT_PUBLIC_OPENROUTER_MODEL_ID || '',
    },
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    },
  };
}

export default function Home() {
  useEffect(() => {
    let cancelled = false;

    window.MINDTRAP_CONFIG = getRuntimeConfig();

    import('../src/main.js').then(({ initMindTrap }) => {
      if (!cancelled) {
        initMindTrap();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <div id="app" />;
}
