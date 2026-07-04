// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { KpiScorecard } from './KpiScorecard';

const theme = generateDynamicTheme(defaultThemeConfig);

afterEach(cleanup);

describe('KpiScorecard', () => {
  it('renders the title and a positive delta label (smoke)', () => {
    render(
      <KpiScorecard
        title="DAU"
        value={120}
        delta={12}
        icon={<span>icon</span>}
        color="#00d123"
        theme={theme}
      />
    );
    expect(screen.getByText('DAU')).toBeInTheDocument();
    expect(screen.getByText(/\+12% vs gestern/)).toBeInTheDocument();
  });

  it('omits the delta row when delta is undefined', () => {
    render(
      <KpiScorecard title="Events" value={50} icon={<span>i</span>} color="#f00" theme={theme} />
    );
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.queryByText(/vs gestern/)).not.toBeInTheDocument();
  });

  it('renders a sparkline chart container when sparkline data is provided', () => {
    const { container } = render(
      <KpiScorecard
        title="Trend"
        value={80}
        delta={-5}
        icon={<span>i</span>}
        color="#0f0"
        theme={theme}
        sparklineData={[{ value: 1 }, { value: 4 }, { value: 2 }]}
      />
    );
    expect(screen.getByText('Trend')).toBeInTheDocument();
    expect(screen.getByText(/-5% vs gestern/)).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });
});
