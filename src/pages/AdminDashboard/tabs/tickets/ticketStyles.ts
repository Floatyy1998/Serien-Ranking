import type React from 'react';

interface TicketTheme {
  primary: string;
  text: { primary: string; secondary: string; muted: string };
  background: { surface: string; default: string };
  status: { success: string; error: string; warning: string };
  border: { default: string };
}

export const autoResize = (el: HTMLTextAreaElement): void => {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

export const selectStyle = (theme: TicketTheme): React.CSSProperties => ({
  padding: '5px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: theme.background.surface,
  color: theme.text.secondary,
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
});

export const actionBtnStyle = (color: string): React.CSSProperties => ({
  padding: '5px 10px',
  borderRadius: '6px',
  border: 'none',
  background: `${color}15`,
  color,
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

export const contentBox = (theme: TicketTheme): React.CSSProperties => ({
  fontSize: '15px',
  color: theme.text.secondary,
  whiteSpace: 'pre-wrap',
  padding: '10px 12px',
  borderRadius: '8px',
  background: theme.background.default,
  margin: 0,
  lineHeight: 1.5,
});

export const inputStyle = (theme: TicketTheme): React.CSSProperties => ({
  flex: 1,
  padding: '7px 10px',
  background: theme.background.default,
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: theme.text.secondary,
  fontSize: '15px',
  outline: 'none',
});

export const sendBtnStyle = (
  theme: TicketTheme,
  active: boolean,
  color?: string
): React.CSSProperties => ({
  padding: '7px 12px',
  borderRadius: '6px',
  border: 'none',
  background: active ? color || theme.primary : `${color || theme.primary}30`,
  color: active ? '#fff' : `${color || theme.primary}60`,
  fontSize: '15px',
  fontWeight: 600,
  cursor: active ? 'pointer' : 'default',
  display: 'flex',
  alignItems: 'center',
});

export type { TicketTheme };
