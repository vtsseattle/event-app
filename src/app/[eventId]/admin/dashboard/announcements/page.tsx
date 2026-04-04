'use client';

import { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useEventId } from '@/contexts/EventContext';
import { getEventRef, updateDocument } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function AnnouncementsPage() {
  const { event } = useEvent();
  const eventId = useEventId();
  const [message, setMessage] = useState('');
  const [pushing, setPushing] = useState(false);

  async function pushAnnouncement() {
    if (!message.trim()) return;
    setPushing(true);
    try {
      await updateDocument(getEventRef(eventId), {
        announcementText: message.trim(),
        announcementActive: true,
      });
      setMessage('');
    } finally {
      setPushing(false);
    }
  }

  async function clearAnnouncement() {
    await updateDocument(getEventRef(eventId), {
      announcementActive: false,
    });
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Announcements
      </h1>

      {/* Input */}
      <Card className="mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Announcement Message
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Lunch in Hall B, Silent auction closing in 10 min"
            />
          </div>
          <Button
            size="sm"
            onClick={pushAnnouncement}
            disabled={pushing || !message.trim()}
          >
            {pushing ? 'Pushing…' : '📢 Push'}
          </Button>
        </div>
      </Card>

      {/* Current announcement */}
      <Card className="mb-6">
        <p className="text-sm font-medium text-muted mb-2">
          Current Announcement
        </p>
        {event?.announcementActive ? (
          <div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 mb-3">
              <p className="text-lg text-accent-light font-medium">
                📢 {event.announcementText}
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={clearAnnouncement}>
              Clear Announcement
            </Button>
          </div>
        ) : (
          <p className="text-muted text-sm">No active announcement</p>
        )}
      </Card>

      {/* Preview */}
      <div>
        <p className="text-sm font-medium text-muted mb-2">
          Viewer Preview
        </p>
        <div className="rounded-xl border border-white/10 bg-bg overflow-hidden">
          <div className="p-6 text-center">
            {event?.announcementActive ? (
              <div className="animate-[fadeIn_0.3s_ease-out] rounded-lg border border-accent/20 bg-accent/10 px-4 py-3">
                <p className="text-accent-light font-medium">
                  📢 {event.announcementText}
                </p>
              </div>
            ) : message.trim() ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 opacity-60">
                <p className="text-foreground">
                  📢 {message} <span className="text-muted text-xs">(preview)</span>
                </p>
              </div>
            ) : (
              <p className="text-muted text-sm">
                Type a message above to preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
