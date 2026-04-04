'use client';

import { useState } from 'react';
import { updateDoc } from 'firebase/firestore';
import { getEventRef } from '@/lib/firestore';
import { useEvent } from '@/hooks/useEvent';
import { useEventId } from '@/contexts/EventContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const SCREEN_MODES = [
  { value: 'idle', label: 'Idle / Branding', icon: '🎭', description: 'Event logo and branding' },
  { value: 'reactions', label: 'Live Reactions', icon: '🎉', description: 'Floating emojis and reaction counts' },
  { value: 'shoutouts', label: 'Shoutouts', icon: '💬', description: 'Flagged shoutouts rotating on screen' },
  { value: 'trivia', label: 'Trivia', icon: '🧠', description: 'Live trivia question with answer distribution' },
  { value: 'photos', label: 'Photo Wall', icon: '📸', description: 'Approved photos rotating in slideshow' },
  { value: 'pledges', label: 'Pledges', icon: '💛', description: 'Live pledge counter — children sponsored tonight' },
];

export default function BigScreenPage() {
  const { event, loading } = useEvent();
  const eventId = useEventId();
  const [updating, setUpdating] = useState(false);

  const currentMode = event?.bigScreenMode || 'idle';

  async function setMode(mode: string) {
    setUpdating(true);
    try {
      await updateDoc(getEventRef(eventId), { bigScreenMode: mode });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Big Screen Control</h1>
        <a
          href={`/${eventId}/screen`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline"
        >
          Open Screen ↗
        </a>
      </div>

      <p className="text-muted text-sm">
        Select what to display on the venue projector. Changes appear instantly on <code>/screen</code>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCREEN_MODES.map((mode) => (
          <Card key={mode.value}>
            <button
              onClick={() => setMode(mode.value)}
              disabled={updating}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                currentMode === mode.value
                  ? 'ring-2 ring-accent bg-accent/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="text-3xl mb-2">{mode.icon}</div>
              <h3 className="font-heading font-semibold text-lg">{mode.label}</h3>
              <p className="text-muted text-sm mt-1">{mode.description}</p>
              {currentMode === mode.value && (
                <span className="inline-block mt-3 text-xs font-medium text-accent bg-accent/20 px-2 py-1 rounded-full">
                  ● Active
                </span>
              )}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
