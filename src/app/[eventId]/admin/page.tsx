'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEventId } from '@/contexts/EventContext';
import { useEvent } from '@/hooks/useEvent';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const eventId = useEventId();
  const { event } = useEvent();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, eventId }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(`${eventId}_admin`, 'true');
        router.push(`/${eventId}/admin/dashboard`);
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-bg-card p-8">
        <h1 className="font-heading text-2xl font-bold text-gradient text-center mb-2">
          {event?.name || 'Event'} Admin
        </h1>
        <p className="text-muted text-center text-sm mb-8">
          Enter the backstage password
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoFocus
          />
          <Button type="submit" disabled={loading || !password}>
            {loading ? 'Verifying…' : 'Enter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
