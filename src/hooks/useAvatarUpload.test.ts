// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const { uploadMock, toastMock, authRef } = vi.hoisted(() => ({
  uploadMock: vi.fn(() => Promise.resolve('https://cdn/avatar.jpg')),
  toastMock: vi.fn(),
  authRef: { current: { uid: 'u1' } as { uid: string } | null },
}));

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: authRef.current }) }));
vi.mock('../services/profileImage', () => ({
  uploadProfileImage: uploadMock,
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
}));
vi.mock('../lib/toast', () => ({ showToast: toastMock }));

import { useAvatarUpload } from './useAvatarUpload';

/** Datei mit gewünschter Größe, ohne echte Bytes zu erzeugen. */
const fileOf = (type: string, size = 1000): File => {
  const file = new File(['x'], 'avatar.png', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const changeEvent = (file: File | null) =>
  ({
    target: { files: file ? [file] : [], value: 'C:\\fakepath\\avatar.png' },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

beforeEach(() => {
  authRef.current = { uid: 'u1' };
  uploadMock.mockClear();
  uploadMock.mockResolvedValue('https://cdn/avatar.jpg');
  toastMock.mockClear();
});

describe('Dateiauswahl', () => {
  it('nimmt ein Bild zum Zuschneiden an, lädt aber noch nicht hoch', () => {
    const { result } = renderHook(() => useAvatarUpload());
    const file = fileOf('image/png');

    act(() => result.current.handleFileSelected(changeEvent(file)));

    expect(result.current.pendingFile).toBe(file);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('weist alles zurück, was kein Bild ist', () => {
    const { result } = renderHook(() => useAvatarUpload());

    act(() => result.current.handleFileSelected(changeEvent(fileOf('application/pdf'))));

    expect(result.current.pendingFile).toBeNull();
    expect(toastMock).toHaveBeenCalledWith('Das ist kein Bild', 2500, 'error');
  });

  it('weist zu große Dateien zurück', () => {
    const { result } = renderHook(() => useAvatarUpload());

    act(() =>
      result.current.handleFileSelected(changeEvent(fileOf('image/png', 11 * 1024 * 1024)))
    );

    expect(result.current.pendingFile).toBeNull();
    expect(toastMock).toHaveBeenCalledWith('Bild darf maximal 10 MB groß sein', 2500, 'error');
  });

  it('setzt das Eingabefeld zurück, damit dieselbe Datei erneut gewählt werden kann', () => {
    const { result } = renderHook(() => useAvatarUpload());
    const event = changeEvent(fileOf('image/png'));

    act(() => result.current.handleFileSelected(event));

    expect(event.target.value).toBe('');
  });

  it('kommt mit einem Abbruch im Dateidialog klar', () => {
    const { result } = renderHook(() => useAvatarUpload());

    act(() => result.current.handleFileSelected(changeEvent(null)));

    expect(result.current.pendingFile).toBeNull();
    expect(toastMock).not.toHaveBeenCalled();
  });
});

describe('Zuschneiden bestätigen', () => {
  it('lädt hoch, meldet die neue Adresse und schließt das Sheet', async () => {
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useAvatarUpload(onUploaded));
    act(() => result.current.handleFileSelected(changeEvent(fileOf('image/png'))));

    await act(async () => {
      await result.current.confirmCrop(new Blob(['x'], { type: 'image/jpeg' }));
    });

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(onUploaded).toHaveBeenCalledWith('https://cdn/avatar.jpg');
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.uploading).toBe(false);
  });

  it('lässt das Sheet bei einem Fehler offen und meldet ihn', async () => {
    uploadMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useAvatarUpload());
    const file = fileOf('image/png');
    act(() => result.current.handleFileSelected(changeEvent(file)));

    await act(async () => {
      await result.current.confirmCrop(new Blob(['x']));
    });

    expect(toastMock).toHaveBeenCalledWith('Fehler beim Hochladen des Bildes', 3000, 'error');
    expect(result.current.pendingFile).toBe(file);
    await waitFor(() => expect(result.current.uploading).toBe(false));
  });

  it('tut ohne angemeldeten Nutzer nichts', async () => {
    authRef.current = null;
    const { result } = renderHook(() => useAvatarUpload());

    await act(async () => {
      await result.current.confirmCrop(new Blob(['x']));
    });

    expect(uploadMock).not.toHaveBeenCalled();
  });
});

describe('cancelCrop', () => {
  it('verwirft die Auswahl', () => {
    const { result } = renderHook(() => useAvatarUpload());
    act(() => result.current.handleFileSelected(changeEvent(fileOf('image/png'))));

    act(() => result.current.cancelCrop());

    expect(result.current.pendingFile).toBeNull();
  });
});
