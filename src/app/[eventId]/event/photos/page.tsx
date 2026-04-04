'use client';

import { useState, useRef } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import Button from '@/components/ui/Button';

const MAX_CAPTION = 150;

export default function PhotosPage() {
  const { photos, submitPhoto, loading } = usePhotos('approved');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    try {
      await submitPhoto(selectedFile, caption);
      setCaption('');
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col px-4 pt-4">
      {/* Upload area */}
      <div className="mb-4 rounded-xl border border-white/10 bg-bg-card p-3">
        {!preview ? (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 px-4 py-6 text-muted transition-colors hover:border-accent/40 hover:text-foreground"
            >
              <span className="text-3xl">📸</span>
              <span className="text-sm font-medium">Tap to share a photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleCancel}
                className="absolute top-2 right-2 rounded-full bg-bg/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm hover:bg-bg"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              maxLength={MAX_CAPTION}
              className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {caption.length}/{MAX_CAPTION}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Share 📸'}
                </Button>
              </div>
            </div>
            {uploading && (
              <p className="text-xs text-accent text-center">
                Your photo will appear after admin approval ✨
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-bg-card aspect-square"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <span className="text-4xl">📸</span>
            <p className="font-heading text-lg font-semibold text-foreground">
              No photos yet!
            </p>
            <p className="text-sm text-muted">
              Be the first to share a moment from the evening
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-bg-card"
                style={{ animation: 'fadeIn 0.3s ease-out' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || 'Event photo'}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                {(photo.caption || photo.displayName) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    {photo.caption && (
                      <p className="text-xs text-white leading-tight">{photo.caption}</p>
                    )}
                    <p className="text-xs text-white/60 mt-0.5">{photo.displayName}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
