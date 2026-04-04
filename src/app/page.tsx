'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { EventFeatures } from '@/lib/types';

const FEATURE_OPTIONS: { key: keyof EventFeatures; label: string; icon: string; locked?: boolean }[] = [
  { key: 'agenda', label: 'Agenda', icon: '📋', locked: true },
  { key: 'shoutouts', label: 'Shoutouts', icon: '💬' },
  { key: 'reactions', label: 'Reactions', icon: '🎉' },
  { key: 'photos', label: 'Photos', icon: '📸' },
  { key: 'trivia', label: 'Trivia', icon: '🧠' },
  { key: 'pledges', label: 'Pledges', icon: '💚' },
];

const DEFAULT_FEATURES: EventFeatures = {
  agenda: true,
  shoutouts: true,
  reactions: true,
  photos: true,
  trivia: true,
  pledges: true,
};

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [tagline, setTagline] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [features, setFeatures] = useState<EventFeatures>(DEFAULT_FEATURES);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleFeature(key: keyof EventFeatures) {
    if (key === 'agenda') return; // always on
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const slug = eventId.trim().toLowerCase();
    if (!slug) { setError('Enter an event code'); return; }
    setError('');
    setLoading(true);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'events', slug));
      if (!snap.exists()) { setError('Event not found'); setLoading(false); return; }
      router.push(`/${slug}/join`);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const slug = eventId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) { setError('Enter an event ID'); return; }
    if (!eventName.trim()) { setError('Enter an event name'); return; }
    if (adminPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
    setError('');
    setLoading(true);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const snap = await getDoc(doc(db, 'events', slug));
      if (snap.exists()) { setError('This event ID is already taken'); setLoading(false); return; }
      await setDoc(doc(db, 'events', slug), {
        name: eventName.trim(),
        tagline: tagline.trim() || null,
        adminPasswordHash: adminPassword,
        features,
        createdAt: serverTimestamp(),
        currentProgramId: null,
        announcementText: '',
        announcementActive: false,
        bigScreenMode: 'idle',
        eventStartTime: '5:00 PM',
      });
      localStorage.setItem(`${slug}_admin`, 'true');
      router.push(`/${slug}/admin/dashboard`);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <h1 className="text-gradient font-heading text-5xl font-bold tracking-tight sm:text-6xl">
          Event App
        </h1>
        <p className="text-muted">
          Live audience engagement for any event
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-white/5 p-1 w-full max-w-xs">
          <button
            onClick={() => { setMode('join'); setError(''); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'join' ? 'bg-accent text-bg' : 'text-muted hover:text-foreground'}`}
          >
            Join Event
          </button>
          <button
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'create' ? 'bg-accent text-bg' : 'text-muted hover:text-foreground'}`}
          >
            Create Event
          </button>
        </div>

        {/* Join form */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4 rounded-xl border border-white/10 bg-bg-card p-6">
            <input
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Event code (e.g. my-event)"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-bg transition-all hover:bg-accent-light disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Join Event'}
            </button>
          </form>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="w-full flex flex-col gap-3 rounded-xl border border-white/10 bg-bg-card p-6">
            <input
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Event ID (e.g. my-gala-2026)"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (e.g. Annual Gala 2026)"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline (optional)"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            {/* Feature selection */}
            <div className="pt-2">
              <p className="mb-2 text-left text-sm font-medium text-muted">Features</p>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map(({ key, label, icon, locked }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFeature(key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      features[key]
                        ? 'border-accent/50 bg-accent/10 text-foreground'
                        : 'border-white/10 bg-surface-alt text-muted'
                    } ${locked ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-accent/30'}`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                    {locked && <span className="ml-auto text-[10px] text-muted">always on</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-bg transition-all hover:bg-accent-light disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
