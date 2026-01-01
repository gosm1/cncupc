'use client';

import { useEffect } from 'react';
import { initializeStorage } from '@/lib/storage';

export default function StorageInitializer() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return null;
}

