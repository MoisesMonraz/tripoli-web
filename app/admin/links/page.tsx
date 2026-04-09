'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type LinkItem = {
  id: string;
  label: string;
  url: string;
  icon: string;
  order: number;
  active: boolean;
};

type FormState = {
  label: string;
  url: string;
  icon: string;
  active: boolean;
};

const EMPTY_FORM: FormState = { label: '', url: '', icon: 'Globe', active: true };

const ICON_OPTIONS = [
  'Globe', 'MessageCircle', 'Mail', 'Share2', 'Camera',
  'X', 'Briefcase', 'Link', 'Video', 'Phone',
  'MapPin', 'ExternalLink', 'BookOpen', 'Rss', 'AtSign', 'Send',
];

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number }>;

function getIcon(name: string) {
  const map = Icons as unknown as Record<string, LucideIcon>;
  return map[name] ?? map['Link'];
}

// ─── Sortable Row ───────────────────────────────────────────────────────────

function SortableRow({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComp = getIcon(link.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-slate-300 hover:text-slate-500 touch-none flex-shrink-0"
        aria-label="Arrastrar"
      >
        <Icons.GripVertical size={18} />
      </button>

      {/* Icon */}
      <span className="text-[#1E3A5F] flex-shrink-0">
        <IconComp size={18} strokeWidth={1.8} />
      </span>

      {/* Label + URL */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{link.label}</p>
        <p className="text-xs text-slate-400 truncate">{link.url}</p>
      </div>

      {/* Active toggle */}
      <button
        type="button"
        onClick={() => onToggle(link.id, !link.active)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          link.active ? 'bg-[#1E3A5F]' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={link.active}
        title={link.active ? 'Activo' : 'Inactivo'}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            link.active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(link)}
        className="text-slate-400 hover:text-[#1E3A5F] transition-colors"
        title="Editar"
      >
        <Icons.Pencil size={16} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(link.id)}
        className="text-slate-400 hover:text-red-500 transition-colors"
        title="Eliminar"
      >
        <Icons.Trash2 size={16} />
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminLinksPage() {
  const [session, setSession]     = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [links, setLinks]         = useState<LinkItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/status');
        if (!res.ok) { setSession(null); } else { setSession(await res.json()); }
      } catch { setSession(null); }
      finally { setIsChecking(false); }
    })();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/links');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch (e) {
      setError('Error al cargar los enlaces.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  // ── Drag & Drop ────────────────────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex  = links.findIndex((l) => l.id === active.id);
    const newIndex  = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex).map((l, i) => ({ ...l, order: i + 1 }));

    setLinks(reordered);

    try {
      const res = await fetch('/api/admin/links/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reordered.map(({ id, order }) => ({ id, order })) }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error('Error saving order:', e);
      setError('Error al guardar el orden.');
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────

  async function handleToggle(id: string, active: boolean) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, active } : l)));
    try {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error(e);
      setError('Error al actualizar.');
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este enlace?')) return;
    try {
      const res = await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
      setError('Error al eliminar.');
    }
  }

  // ── Open edit form ─────────────────────────────────────────────────────

  function handleEdit(link: LinkItem) {
    setEditingId(link.id);
    setForm({ label: link.label, url: link.url, icon: link.icon, active: link.active });
    setShowForm(true);
    setError('');
  }

  function handleNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  }

  // ── Save form ──────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/links/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        setLinks((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...form } : l)));
      } else {
        const nextOrder = links.length > 0 ? Math.max(...links.map((l) => l.order)) + 1 : 1;
        const res = await fetch('/api/admin/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, order: nextOrder }),
        });
        if (!res.ok) throw new Error(await res.text());
        const { id } = await res.json();
        setLinks((prev) => [...prev, { id, ...form, order: nextOrder }]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      console.error(e);
      setError('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (isChecking) return <main className="min-h-screen bg-white px-6 py-16"><p className="text-sm text-slate-500">Verificando sesión...</p></main>;
  if (!session?.ok) return <main className="min-h-screen bg-white px-6 py-16"><p className="text-sm text-slate-500">Acceso no autorizado. <a href="/admin" className="text-[#1E3A5F] underline">Volver</a></p></main>;
  if (session.email !== 'monrazescoto@gmail.com') return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-slate-700 mb-6">Lo sentimos, actualmente no tienes autorización para acceder a esta sección.</p>
        <a href="/admin" className="rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] transition">Regresar</a>
      </div>
    </main>
  );

  const PreviewIcon = getIcon(form.icon);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Tripoli Links</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Gestión de enlaces para tripoli.media/links
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white text-sm font-semibold rounded-lg hover:bg-[#2d4a6f] transition"
          >
            <Icons.Plus size={16} />
            Nuevo enlace
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSave}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-slate-800">
                {editingId ? 'Editar enlace' : 'Nuevo enlace'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Etiqueta
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="ej. Sitio web"
                required
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
              />
            </div>

            {/* URL */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                URL
              </label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                required
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
              />
            </div>

            {/* Icon */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Ícono
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
                >
                  {ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <span className="text-[#1E3A5F]">
                  <PreviewIcon size={20} strokeWidth={1.8} />
                </span>
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  form.active ? 'bg-[#1E3A5F]' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={form.active}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    form.active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-600">
                {form.active ? 'Activo (visible en /links)' : 'Inactivo (oculto en /links)'}
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 bg-[#1E3A5F] text-white text-sm font-semibold rounded-lg hover:bg-[#2d4a6f] transition disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-200 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Links list */}
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-12">Cargando enlaces…</p>
        ) : links.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-12 text-center text-slate-400 text-sm">
            No hay enlaces aún. Crea el primero.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <SortableRow
                    key={link.id}
                    link={link}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Preview link */}
        <p className="text-xs text-center text-slate-400">
          Ver página pública →{' '}
          <a
            href="/links"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#1E3A5F] transition"
          >
            tripoli.media/links
          </a>
        </p>
      </div>
    </div>
  );
}
