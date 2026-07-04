// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GalaxyMapTab } from './GalaxyMapTab';
import type { Actor, ActorConnection } from '../../hooks/useActorUniverse';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(['ZoomIn', 'ZoomOut'].map((n) => [n, stub]));
});

const panZoom = vi.hoisted(() => ({
  canvasRef: { current: null },
  transform: { x: 0, y: 0, scale: 1 },
  isDragging: false,
  handleMouseDown: vi.fn(),
  handleMouseMove: vi.fn(),
  handleMouseUp: vi.fn(),
  handleTouchStart: vi.fn(),
  handleTouchMove: vi.fn(),
  handleTouchEnd: vi.fn(),
  handleWheel: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  resetView: vi.fn(),
}));
vi.mock('./useActorPanZoom', () => ({ useActorPanZoom: () => panZoom }));

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    secondary: '#8b5cf6',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111', surfaceHover: '#222', card: '#0a0a0a' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

const makeActor = (id: number, name: string): Actor => ({
  id,
  name,
  profilePath: null,
  seriesCount: 3,
  knownFor: '',
  popularity: 1,
  series: [],
  recommendations: [],
  x: 0.5,
  y: 0.5,
  size: 12,
  color: '#ff0000',
});

const actors = [makeActor(1, 'Bryan Cranston'), makeActor(2, 'Aaron Paul')];
const connections: ActorConnection[] = [
  { actor1Id: 1, actor2Id: 2, sharedSeries: [{ id: 100, title: 'Breaking Bad' }], strength: 3 },
];

afterEach(() => {
  cleanup();
  panZoom.zoomIn.mockReset();
  panZoom.zoomOut.mockReset();
  panZoom.resetView.mockReset();
});

describe('GalaxyMapTab', () => {
  it('renders the legend labels', () => {
    render(
      <GalaxyMapTab
        actors={actors}
        connections={connections}
        hoveredActor={null}
        onHoverActor={vi.fn()}
        onSelectActor={vi.fn()}
        getActorConnections={() => connections}
      />
    );
    expect(screen.getByText('Top 10 Schauspieler')).toBeInTheDocument();
    expect(screen.getByText('Gemeinsame Serie')).toBeInTheDocument();
  });

  it('wires the zoom control buttons', () => {
    render(
      <GalaxyMapTab
        actors={actors}
        connections={connections}
        hoveredActor={null}
        onHoverActor={vi.fn()}
        onSelectActor={vi.fn()}
        getActorConnections={() => connections}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    fireEvent.click(buttons[0]);
    expect(panZoom.zoomIn).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Reset'));
    expect(panZoom.resetView).toHaveBeenCalledTimes(1);
  });
});
