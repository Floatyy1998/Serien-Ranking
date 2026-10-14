// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditableDetailRow } from './EditableDetailRow';

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#ef6f8a', text: { secondary: '#eee', muted: '#999' } },
  }),
}));

afterEach(cleanup);

describe('EditableDetailRow', () => {
  it('trägt einen fehlenden Wert ein und speichert mit Enter', () => {
    const onSave = vi.fn();
    render(<EditableDetailRow label="Auflage" placeholder="z. B. 3. Auflage" onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Auflage bearbeiten' }));
    const input = screen.getByLabelText('Auflage');
    fireEvent.change(input, { target: { value: ' 2. Auflage 2019 ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith('2. Auflage 2019');
  });

  it('nimmt bei Zahlenfeldern nur Ziffern und startet mit dem Entwurf', () => {
    const onSave = vi.fn();
    render(
      <EditableDetailRow
        label="Reihe"
        value="Die Zwerge · Band 3"
        draft="3"
        placeholder="Band-Nr."
        numeric
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByText('Die Zwerge · Band 3'));
    const input = screen.getByLabelText('Reihe') as HTMLInputElement;
    expect(input.value).toBe('3');
    fireEvent.change(input, { target: { value: '4a' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith('4');
  });

  it('speichert nichts bei Esc oder unverändertem Wert', () => {
    const onSave = vi.fn();
    render(<EditableDetailRow label="Auflage" value="1. Auflage" placeholder="" onSave={onSave} />);
    fireEvent.click(screen.getByText('1. Auflage'));
    const input = screen.getByLabelText('Auflage');
    fireEvent.change(input, { target: { value: 'Sonderausgabe' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.click(screen.getByText('1. Auflage'));
    fireEvent.blur(screen.getByLabelText('Auflage'));
    expect(onSave).not.toHaveBeenCalled();
  });
});
