'use client';

import { useState } from 'react';
import { getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {
  getEventRef,
  getReactionsRef,
  getShoutoutsRef,
  getViewersRef,
  getPhotosRef,
  getPledgesRef,
} from '@/lib/firestore';
import { useEventId } from '@/contexts/EventContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const CONFIRM_PHRASE = 'RESET EVENT';

export default function ResetPage() {
  const eventId = useEventId();
  const [step, setStep] = useState<'idle' | 'confirm' | 'typing' | 'running' | 'done'>('idle');
  const [typed, setTyped] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  async function deleteCollection(collectionRef: ReturnType<typeof getReactionsRef>, name: string) {
    const snapshot = await getDocs(collectionRef);
    setProgress(`Deleting ${snapshot.size} ${name}...`);
    const promises = snapshot.docs.map((d) => deleteDoc(doc(d.ref.firestore, d.ref.path)));
    await Promise.all(promises);
  }

  async function handleReset() {
    setStep('running');
    setError('');
    try {
      await deleteCollection(getReactionsRef(eventId), 'reactions');
      await deleteCollection(getShoutoutsRef(eventId), 'shoutouts');
      await deleteCollection(getViewersRef(eventId), 'viewers');
      await deleteCollection(getPhotosRef(eventId), 'photos');
      await deleteCollection(getPledgesRef(eventId), 'pledges');

      setProgress('Resetting event state...');
      await updateDoc(getEventRef(eventId), {
        currentProgramId: null,
        announcementText: '',
        announcementActive: false,
        bigScreenMode: 'idle',
      });

      setStep('done');
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setStep('idle');
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Reset Event Data</h1>

      <Card>
        <div className="p-2">
          <p className="text-foreground mb-2">This will permanently delete:</p>
          <ul className="text-muted text-sm space-y-1 ml-4 list-disc">
            <li>All reactions</li>
            <li>All shoutouts</li>
            <li>All photos</li>
            <li>All pledges</li>
            <li>All viewer registrations</li>
          </ul>
          <p className="text-foreground mt-3 mb-1">This will <strong>NOT</strong> delete:</p>
          <ul className="text-muted text-sm space-y-1 ml-4 list-disc">
            <li>Programs (your schedule stays intact)</li>
            <li>The event document (name, date, tagline)</li>
          </ul>
          <p className="text-muted text-sm mt-3">
            It will also reset Now Playing, announcements, and big screen mode to defaults.
          </p>
        </div>
      </Card>

      {step === 'idle' && (
        <Button variant="danger" onClick={() => setStep('confirm')}>
          Reset Event Data
        </Button>
      )}

      {step === 'confirm' && (
        <Card>
          <div className="p-2 space-y-4">
            <p className="text-danger font-semibold">⚠️ Are you sure?</p>
            <p className="text-muted text-sm">
              This cannot be undone. All reactions, shoutouts, and viewer data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => setStep('typing')}>
                Yes, I want to reset
              </Button>
              <Button variant="secondary" onClick={() => setStep('idle')}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'typing' && (
        <Card>
          <div className="p-2 space-y-4">
            <p className="text-danger font-semibold">⚠️ Final confirmation</p>
            <p className="text-muted text-sm">
              Type <code className="text-accent font-mono bg-white/5 px-1.5 py-0.5 rounded">{CONFIRM_PHRASE}</code> to confirm:
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-lg border border-white/10 bg-bg px-4 py-2.5 text-foreground placeholder:text-muted/50 focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger font-mono"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleReset}
                disabled={typed !== CONFIRM_PHRASE}
              >
                Permanently Delete All Data
              </Button>
              <Button variant="secondary" onClick={() => { setStep('idle'); setTyped(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'running' && (
        <Card>
          <div className="p-2 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-muted">{progress}</p>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <div className="p-2 space-y-3">
            <p className="text-success font-semibold">✅ Event data reset successfully</p>
            <p className="text-muted text-sm">
              All reactions, shoutouts, and viewers have been cleared. Programs are untouched.
            </p>
            <Button variant="secondary" onClick={() => { setStep('idle'); setTyped(''); }}>
              Done
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <p className="text-danger text-sm">❌ {error}</p>
      )}
    </div>
  );
}
