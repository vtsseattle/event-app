'use client';

import { useEffect } from 'react';
import { useEvent } from '@/hooks/useEvent';

export default function DynamicFavicon() {
  const { event } = useEvent();

  useEffect(() => {
    if (!event?.iconUrl) return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = event.iconUrl;

    return () => {
      if (link) link.href = '/icon.svg';
    };
  }, [event?.iconUrl]);

  return null;
}
