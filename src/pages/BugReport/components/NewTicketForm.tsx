import { AttachFile, Close, PhotoCamera } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { TicketPriority, TicketType } from '../types';
import { PRIORITY_CONFIG, TYPE_CONFIG } from '../types';
import { tapScale } from '../../../lib/motion';

interface NewTicketFormProps {
  theme: ThemeContextType['currentTheme'];
  onSubmit: (data: {
    ticketType: TicketType;
    title: string;
    description: string;
    stepsToReproduce: string;
    screenshots: string[];
    consoleErrors?: string;
    priority: TicketPriority;
  }) => Promise<boolean>;
  onCancel: () => void;
  onUpload: (file: File) => Promise<string | null>;
  initialConsoleErrors?: string;
}

export function NewTicketForm({
  theme,
  onSubmit,
  onCancel,
  onUpload,
  initialConsoleErrors,
}: NewTicketFormProps) {
  const [ticketType, setTicketType] = useState<TicketType>('bug');
  const [priority, setPriority] = useState<TicketPriority>('low');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consoleErrors, setConsoleErrors] = useState(initialConsoleErrors || '');
  const [steps, setSteps] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      setUploading(true);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const url = await onUpload(file);
        if (url) setScreenshots((prev) => [...prev, url]);
      }
      setUploading(false);
      e.target.value = '';
    },
    [onUpload]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        setUploading(true);
        const url = await onUpload(file);
        if (url) setScreenshots((prev) => [...prev, url]);
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const success = await onSubmit({
      ticketType,
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: steps.trim(),
      screenshots,
      consoleErrors: consoleErrors.trim() || undefined,
      priority,
    });
    if (!success) setSubmitting(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: theme.background.default,
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: theme.text.secondary,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div
      onPaste={handlePaste}
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: theme.background.surface,
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px', color: theme.text.secondary, fontWeight: 600 }}>
          Neues Ticket
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: theme.text.muted,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          <Close style={{ fontSize: 20 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['bug', 'feature'] as const).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const active = ticketType === t;
            return (
              <button
                key={t}
                onClick={() => setTicketType(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: active ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: active ? `${cfg.color}15` : theme.background.default,
                  color: active ? cfg.color : theme.text.muted,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Priorität
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['low', 'medium', 'high'] as const).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const active = priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '7px',
                    borderRadius: '8px',
                    border: active ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                    background: active ? `${cfg.color}15` : theme.background.default,
                    color: active ? cfg.color : theme.text.muted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? 'Kurze Beschreibung des Problems'
                : 'Kurze Beschreibung des Features'
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Beschreibung *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? 'Was genau ist passiert? Was hast du erwartet?'
                : 'Was soll das Feature können? Warum wäre es nützlich?'
            }
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            {ticketType === 'bug' ? 'Schritte zum Reproduzieren' : 'Beschreibung des Ablaufs'}
          </label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={
              ticketType === 'bug'
                ? '1. Gehe zu ...\n2. Klicke auf ...\n3. Der Fehler tritt auf ...'
                : '1. User öffnet ...\n2. User klickt auf ...\n3. Es passiert ...'
            }
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: theme.text.muted,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            Screenshots
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {screenshots.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: `1px solid rgba(255,255,255,0.08)`,
                  }}
                  loading="lazy"
                  decoding="async"
                />
                <button
                  onClick={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: theme.status.error,
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <motion.button
              whileTap={tapScale}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                border: `2px dashed ${theme.primary}30`,
                background: `${theme.primary}08`,
                color: uploading ? theme.text.muted : theme.primary,
                cursor: uploading ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '10px',
              }}
            >
              {uploading ? (
                '...'
              ) : (
                <>
                  <PhotoCamera style={{ fontSize: 20 }} />
                  Bild
                </>
              )}
            </motion.button>
          </div>
        </div>

        {ticketType === 'bug' && (
          <div>
            <label
              style={{
                fontSize: '12px',
                color: theme.text.muted,
                marginBottom: '4px',
                display: 'block',
              }}
            >
              Fehlermeldungen aus der Konsole (optional)
            </label>
            <textarea
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${Math.max(el.scrollHeight, 66)}px`;
                }
              }}
              value={consoleErrors}
              onChange={(e) => {
                setConsoleErrors(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.max(el.scrollHeight, 66)}px`;
              }}
              placeholder="Falls vorhanden: Fehlermeldungen aus der Browser-Konsole (F12) hier einfügen"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: theme.text.muted,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || submitting}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background:
                title.trim() && description.trim() && !submitting
                  ? theme.primary
                  : `${theme.primary}30`,
              color:
                title.trim() && description.trim() && !submitting ? '#fff' : `${theme.primary}60`,
              fontSize: '13px',
              fontWeight: 600,
              cursor: title.trim() && description.trim() && !submitting ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AttachFile style={{ fontSize: 16 }} />
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
