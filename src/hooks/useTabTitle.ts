'use client';

import { useEffect } from 'react';

export function useTabTitle(count: number, base = 'Foodie') {
  useEffect(() => {
    const original = document.title;
    if (count > 0) {
      document.title = `(${count}) ${base}`;
    } else {
      document.title = base;
    }
    return () => {
      document.title = original;
    };
  }, [count, base]);
}
