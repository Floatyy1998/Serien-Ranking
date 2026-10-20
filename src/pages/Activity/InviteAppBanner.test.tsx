// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  shareLink: vi.fn(),
  showToast: vi.fn(),
  hapticSuccess: vi.fn(),
}));

vi.mock('../../services/share/shareLink', () => ({ shareLink: mocks.shareLink }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: mocks.showToast }));
vi.mock('../../lib/interaction/haptics', () => ({ hapticSuccess: mocks.hapticSuccess }));
vi.mock('../../components/ui', () => ({
  IconContainer: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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

import { APP_INVITE_URL, InviteAppBanner } from './InviteAppBanner';

beforeEach(() => {
  mocks.shareLink.mockReset();
  mocks.showToast.mockReset();
  mocks.hapticSuccess.mockReset();
});
afterEach(() => cleanup());

const tap = () => fireEvent.click(screen.getByRole('button', { name: /TV-Rank weiterempfehlen/ }));

describe('InviteAppBanner', () => {
  it('teilt den geräteunabhängigen Startseiten-Link', async () => {
    mocks.shareLink.mockResolvedValue('shared');
    render(<InviteAppBanner />);
    tap();
    await waitFor(() => expect(mocks.hapticSuccess).toHaveBeenCalled());
    expect(APP_INVITE_URL).toBe('https://tv-rank.de');
    expect(mocks.shareLink).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://tv-rank.de', title: 'TV-Rank' })
    );
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('meldet den kopierten Link, wenn kein Teilen-Menü da ist', async () => {
    mocks.shareLink.mockResolvedValue('copied');
    render(<InviteAppBanner />);
    tap();
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('Link kopiert!', 3000));
  });

  it('bleibt beim Abbrechen still', async () => {
    mocks.shareLink.mockResolvedValue('cancelled');
    render(<InviteAppBanner />);
    tap();
    await waitFor(() => expect(mocks.shareLink).toHaveBeenCalled());
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.hapticSuccess).not.toHaveBeenCalled();
  });

  it('sagt Bescheid, wenn Teilen gar nicht geht', async () => {
    mocks.shareLink.mockResolvedValue('failed');
    render(<InviteAppBanner />);
    tap();
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('Teilen nicht möglich', 3000));
  });
});
