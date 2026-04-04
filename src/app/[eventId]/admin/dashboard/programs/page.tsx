'use client';

import { useState, useRef } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePrograms } from '@/hooks/usePrograms';
import { useEvent } from '@/hooks/useEvent';
import { useEventId } from '@/contexts/EventContext';
import {
  getProgramsRef,
  getEventRef,
  addDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/firestore';
import { uploadProgramImage, deleteProgramImage } from '@/lib/storage';
import { computeProgramTimes, Program } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ProgramForm {
  title: string;
  performers: string;
  emoji: string;
  durationMinutes: string;
  order: string;
  description: string;
  surprise: boolean;
}

const EMPTY_FORM: ProgramForm = {
  title: '',
  performers: '',
  emoji: '🎶',
  durationMinutes: '15',
  order: '',
  description: '',
  surprise: false,
};

export default function ProgramsPage() {
  const { programs, loading } = usePrograms();
  const { event } = useEvent();
  const eventId = useEventId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [eventStartTime, setEventStartTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const times = computeProgramTimes(programs, event?.eventStartTime || '5:00 PM');

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: String(programs.length + 1) });
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setRemoveImage(false);
    setShowForm(true);
  }

  function openEdit(id: string) {
    const p = programs.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setForm({
      title: p.title,
      performers: p.performers,
      emoji: p.emoji,
      durationMinutes: String(p.durationMinutes || 15),
      order: String(p.order),
      description: p.description || '',
      surprise: p.surprise || false,
    });
    setImageFile(null);
    setImagePreview(p.heroImageUrl || null);
    setExistingImageUrl(p.heroImageUrl || null);
    setRemoveImage(false);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setRemoveImage(false);
  }

  function updateField(field: keyof ProgramForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);

    const data: Record<string, unknown> = {
      title: form.title.trim(),
      performers: form.performers.trim(),
      emoji: form.emoji || '🎶',
      durationMinutes: Number(form.durationMinutes) || 15,
      order: Number(form.order) || 0,
      description: form.description.trim() || '',
      surprise: form.surprise,
    };

    try {
      if (editingId) {
        // Handle image removal
        if (removeImage && existingImageUrl) {
          await deleteProgramImage(editingId, existingImageUrl);
          data.heroImageUrl = '';
        }
        // Handle new image upload
        if (imageFile) {
          data.heroImageUrl = await uploadProgramImage(eventId, editingId, imageFile);
        }
        const ref = doc(getProgramsRef(eventId), editingId);
        await updateDocument(ref, data);
      } else {
        const docRef = await addDocument(getProgramsRef(eventId), {
          ...data,
          status: 'upcoming',
          createdAt: serverTimestamp(),
        });
        // Upload image after creating the doc so we have an ID
        if (imageFile) {
          const imageUrl = await uploadProgramImage(eventId, docRef.id, imageFile);
          await updateDocument(docRef, { heroImageUrl: imageUrl });
        }
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEventStart() {
    if (!eventStartTime.trim()) return;
    await updateDocument(getEventRef(eventId), { eventStartTime: eventStartTime.trim() });
    setEventStartTime('');
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= programs.length) return;
    const a = programs[index];
    const b = programs[swapIndex];
    const refA = doc(getProgramsRef(eventId), a.id);
    const refB = doc(getProgramsRef(eventId), b.id);
    await Promise.all([
      updateDocument(refA, { order: b.order }),
      updateDocument(refB, { order: a.order }),
    ]);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = programs.findIndex((p) => p.id === active.id);
    const newIndex = programs.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build the reordered list and assign new sequential order values
    const reordered = [...programs];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered
      .map((p, i) => ({ id: p.id, newOrder: i + 1, oldOrder: p.order }))
      .filter(({ newOrder, oldOrder }) => newOrder !== oldOrder);

    await Promise.all(
      updates.map(({ id, newOrder }) =>
        updateDocument(doc(getProgramsRef(eventId), id), { order: newOrder }),
      ),
    );
  }

  async function handleReset(id: string) {
    const ref = doc(getProgramsRef(eventId), id);
    await updateDocument(ref, { status: 'upcoming' });
    if (event?.currentProgramId === id) {
      await updateDocument(getEventRef(eventId), { currentProgramId: null });
    }
  }

  async function handleDelete(id: string) {
    const ref = doc(getProgramsRef(eventId), id);
    await deleteDocument(ref);
    setConfirmDelete(null);
  }

  if (loading) {
    return <div className="text-muted py-20 text-center">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Programs
        </h1>
        <Button size="sm" onClick={openAdd}>
          + Add Program
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted">Event starts at:</span>
        <span className="font-semibold text-foreground">{event?.eventStartTime || '5:00 PM'}</span>
        <Input
          value={eventStartTime}
          onChange={(e) => setEventStartTime(e.target.value)}
          placeholder="e.g. 5:00 PM"
          className="w-32"
        />
        <Button size="sm" variant="secondary" onClick={handleSaveEventStart}
          disabled={!eventStartTime.trim()}>Update</Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">
              {editingId ? 'Edit Program' : 'Add Program'}
            </h2>
            <div className="flex flex-col gap-3">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Classical Dance"
              />
              <Input
                label="Performers"
                value={form.performers}
                onChange={(e) => updateField('performers', e.target.value)}
                placeholder="e.g. Priya & Group"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {['�', '🪔', '🙏', '🎵', '💃', '🎶', '🎹', '🎻', '📽️', '🏠', '🌳', '🎓', '🧒', '📖', '🗣️', '🍽️', '🏆', '👏', '🌟', '🎭', '🎬', '🪁', '📋', '🎪', '🙌', '❤️', '🏢', '👋', '🎼', '🧘'].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => updateField('emoji', e)}
                      className={`text-2xl p-1.5 rounded-lg transition-all ${
                        form.emoji === e
                          ? 'bg-accent/30 ring-2 ring-accent scale-110'
                          : 'bg-surface-alt hover:bg-accent/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => updateField('durationMinutes', e.target.value)}
                  placeholder="15"
                />
                <Input
                  label="Order"
                  type="number"
                  value={form.order}
                  onChange={(e) => updateField('order', e.target.value)}
                  placeholder="1"
                />
              </div>
              {/* Hero Image Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Hero Image (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent/30 file:cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-danger transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="e.g. Nethra Vidyalaya is a school for visually impaired children…"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                />
              </div>
              {/* Surprise toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.surprise}
                  onChange={(e) => setForm((prev) => ({ ...prev, surprise: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-surface-alt text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-foreground">🎁 Surprise — hide from agenda until live</span>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={closeForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Program list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={programs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {programs.map((p, i) => (
              <SortableProgramCard
                key={p.id}
                program={p}
                index={i}
                time={times[i]}
                confirmDelete={confirmDelete}
                onMove={handleMove}
                onReset={handleReset}
                onEdit={openEdit}
                onDelete={handleDelete}
                onConfirmDelete={setConfirmDelete}
                programCount={programs.length}
              />
            ))}
            {programs.length === 0 && (
              <p className="text-muted text-sm text-center py-10">
                No programs yet. Add one above.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableProgramCard({
  program: p,
  index: i,
  time,
  confirmDelete,
  onMove,
  onReset,
  onEdit,
  onDelete,
  onConfirmDelete,
  programCount,
}: {
  program: Program;
  index: number;
  time: { startTime: string; endTime: string } | undefined;
  confirmDelete: string | null;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onReset: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string | null) => void;
  programCount: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1 items-center">
            <button
              {...attributes}
              {...listeners}
              className="text-base px-1 py-1 rounded cursor-grab active:cursor-grabbing text-muted hover:text-foreground hover:bg-accent/20 transition-colors touch-none"
              aria-label="Drag to reorder"
            >
              ⠿
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onMove(i, 'up')}
                disabled={i === 0}
                className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-foreground disabled:opacity-30 hover:bg-accent/20 transition-colors"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => onMove(i, 'down')}
                disabled={i === programCount - 1}
                className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-foreground disabled:opacity-30 hover:bg-accent/20 transition-colors"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          </div>
          <span className="text-2xl">{p.emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{p.title}</p>
            <p className="text-sm text-muted truncate">{p.performers}</p>
            <p className="text-xs text-muted">{time?.startTime} – {time?.endTime} · {p.durationMinutes} min</p>
            {(p.heroImageUrl || p.description || p.surprise) && (
              <p className="text-xs text-accent mt-0.5">
                {p.surprise ? '🎁 Surprise' : ''}{p.surprise && (p.heroImageUrl || p.description) ? ' · ' : ''}{p.heroImageUrl ? '🖼️ Image' : ''}{p.heroImageUrl && p.description ? ' · ' : ''}{p.description ? '📝 Description' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={p.status}>{p.status}</Badge>
          {p.status !== 'upcoming' && (
            <Button variant="secondary" size="sm" onClick={() => onReset(p.id)}>
              Reset
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => onEdit(p.id)}>
            Edit
          </Button>
          {confirmDelete === p.id ? (
            <div className="flex items-center gap-1">
              <Button variant="danger" size="sm" onClick={() => onDelete(p.id)}>
                Confirm
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onConfirmDelete(null)}>
                No
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => onConfirmDelete(p.id)}>
              Delete
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
