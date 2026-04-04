'use client';

import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEventId } from '@/contexts/EventContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function QRCodePage() {
  const eventId = useEventId();
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${eventId}/join`
    : `/${eventId}/join`;
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventId}-join-qr.png`;
    a.click();
  }, [eventId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        QR Code
      </h1>

      <Card className="max-w-md mx-auto text-center">
        <p className="text-muted text-sm mb-4">
          Display this QR code for attendees to join the event
        </p>

        <div
          ref={canvasContainerRef}
          className="inline-block rounded-xl bg-white p-6 print:p-4"
        >
          <QRCodeCanvas
            value={joinUrl}
            size={280}
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="mt-4 text-sm text-muted break-all">{joinUrl}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button size="sm" onClick={handleDownload}>
            Download PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </Card>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          [class*="print:"] {
            visibility: visible !important;
          }
          .print\\:p-4 {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}
