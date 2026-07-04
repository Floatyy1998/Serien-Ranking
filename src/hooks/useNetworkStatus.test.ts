// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNetworkStatus } from './useNetworkStatus';
import { showToast } from '../lib/toast';

vi.mock('../lib/toast', () => ({
  showToast: vi.fn(),
}));

const mockedShowToast = vi.mocked(showToast);

describe('useNetworkStatus', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows an error toast when the browser goes offline', () => {
    renderHook(() => useNetworkStatus());
    window.dispatchEvent(new Event('offline'));
    expect(mockedShowToast).toHaveBeenCalledWith('Keine Internetverbindung', 3000, 'error');
  });

  it('shows a success toast when the browser comes back online', () => {
    renderHook(() => useNetworkStatus());
    window.dispatchEvent(new Event('online'));
    expect(mockedShowToast).toHaveBeenCalledWith('Wieder online', 1500, 'success');
  });

  it('does not toast before any network event fires', () => {
    renderHook(() => useNetworkStatus());
    expect(mockedShowToast).not.toHaveBeenCalled();
  });

  it('registers online/offline listeners on mount and removes them on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNetworkStatus());
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
  });

  it('stops reacting to events after unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();
    window.dispatchEvent(new Event('offline'));
    expect(mockedShowToast).not.toHaveBeenCalled();
  });
});
