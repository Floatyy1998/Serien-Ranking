// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({
  Check: () => null,
  Edit: () => null,
  Person: () => null,
  PhotoCamera: () => null,
}));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { ProfileSection } from './ProfileSection';

const baseProps = () => ({
  photoURL: '',
  displayName: 'Konrad',
  uploading: false,
  saving: false,
  displayNameEditable: false,
  fileInputRef: createRef<HTMLInputElement>(),
  onImageUpload: vi.fn(),
  onDisplayNameChange: vi.fn(),
  onSaveDisplayName: vi.fn(),
  onEditDisplayName: vi.fn(),
});

afterEach(() => cleanup());

describe('ProfileSection', () => {
  it('renders the current display name value', () => {
    render(<ProfileSection {...baseProps()} />);
    expect(screen.getByText('Konrad')).toBeInTheDocument();
  });

  it('invokes the edit handler from the edit button', () => {
    const props = baseProps();
    render(<ProfileSection {...props} />);
    fireEvent.click(screen.getByLabelText('Anzeigename ändern'));
    expect(props.onEditDisplayName).toHaveBeenCalledTimes(1);
  });

  it('shows an editable input and saves when display name is editable', () => {
    const props = { ...baseProps(), displayNameEditable: true };
    const { container } = render(<ProfileSection {...props} />);
    const input = screen.getByPlaceholderText('Anzeigename eingeben');
    fireEvent.change(input, { target: { value: 'newname' } });
    expect(props.onDisplayNameChange).toHaveBeenCalledWith('newname');
    const saveBtn = container.querySelector('.settings-field-save-btn') as HTMLElement;
    fireEvent.click(saveBtn);
    expect(props.onSaveDisplayName).toHaveBeenCalledTimes(1);
  });
});
