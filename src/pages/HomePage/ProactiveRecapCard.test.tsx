// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProactiveRecapCard } from './ProactiveRecapCard';
import type { ProactiveRecap } from '../../hooks/useProactiveRecaps';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ state: 'idle', speak: vi.fn() }),
}));
vi.mock('../../components/ui/SpeakButton', () => ({
  SpeakButton: () => <button aria-label="speak" />,
}));

afterEach(cleanup);

function makeRecap(overrides: Partial<ProactiveRecap> = {}): ProactiveRecap {
  return {
    seriesId: 1,
    seriesTitle: 'Test Show',
    posterUrl: '',
    triggerType: 'new-season',
    startsToday: true,
    seasonNumber: 2,
    recap: null,
    loading: false,
    cacheKey: 'k1',
    ...overrides,
  };
}

describe('ProactiveRecapCard', () => {
  it('renders the trigger label and series title (smoke)', () => {
    render(
      <ProactiveRecapCard
        recaps={[makeRecap()]}
        onDismiss={vi.fn()}
        onFetchRecap={vi.fn(() => Promise.resolve())}
      />
    );
    expect(screen.getByText('Staffel 2 startet heute!')).toBeInTheDocument();
    expect(screen.getByText('Test Show')).toBeInTheDocument();
  });

  it('renders nothing when there are no recaps', () => {
    const { container } = render(
      <ProactiveRecapCard
        recaps={[]}
        onDismiss={vi.fn()}
        onFetchRecap={vi.fn(() => Promise.resolve())}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('navigates to the series when "Zur Serie" is clicked', () => {
    render(
      <ProactiveRecapCard
        recaps={[makeRecap()]}
        onDismiss={vi.fn()}
        onFetchRecap={vi.fn(() => Promise.resolve())}
      />
    );
    fireEvent.click(screen.getByText('Zur Serie'));
    expect(navigateMock).toHaveBeenCalledWith('/series/1');
  });

  it('fetches the recap and calls onDismiss via the close button', () => {
    const onFetchRecap = vi.fn(() => Promise.resolve());
    const onDismiss = vi.fn();
    const { container } = render(
      <ProactiveRecapCard
        recaps={[makeRecap()]}
        onDismiss={onDismiss}
        onFetchRecap={onFetchRecap}
      />
    );
    fireEvent.click(screen.getByText('Recap lesen'));
    expect(onFetchRecap).toHaveBeenCalledWith('k1');

    const closeBtn = container.querySelector('.close-button');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn as Element);
    expect(onDismiss).toHaveBeenCalledWith('k1');
  });
});
