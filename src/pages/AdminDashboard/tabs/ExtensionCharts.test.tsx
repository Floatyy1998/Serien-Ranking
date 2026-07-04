// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { ExtensionCharts } from './ExtensionCharts';

const theme = generateDynamicTheme(defaultThemeConfig);

const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, count: h }));

afterEach(cleanup);

describe('ExtensionCharts', () => {
  it('renders chart section headings and charts when data is present (smoke)', () => {
    const { container } = render(
      <ExtensionCharts
        platformPieData={[{ name: 'Netflix', value: 5, color: '#e50914', fill: '#e50914' }]}
        seriesBarData={[{ name: 'Lost', count: 3 }]}
        hourlyData={hourlyData}
        cardBg="#111"
        borderColor="#333"
        theme={theme}
      />
    );
    expect(screen.getByText('Plattform-Verteilung')).toBeInTheDocument();
    expect(screen.getByText('Geschaute Serien (Extension)')).toBeInTheDocument();
    expect(screen.getByText('Extension-Aktivität nach Uhrzeit')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-responsive-container').length).toBeGreaterThan(0);
  });

  it('shows empty placeholders when platform and series data are empty', () => {
    render(
      <ExtensionCharts
        platformPieData={[]}
        seriesBarData={[]}
        hourlyData={hourlyData}
        cardBg="#111"
        borderColor="#333"
        theme={theme}
      />
    );
    expect(screen.getAllByText('Keine Daten').length).toBe(2);
  });
});
