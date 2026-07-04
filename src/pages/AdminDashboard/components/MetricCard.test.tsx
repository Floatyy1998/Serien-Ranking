// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { MetricCard } from './MetricCard';

const theme = generateDynamicTheme(defaultThemeConfig);

afterEach(cleanup);

describe('MetricCard', () => {
  it('renders title and children (smoke)', () => {
    render(
      <MetricCard title="Aktive Nutzer" theme={theme}>
        <div>card-body</div>
      </MetricCard>
    );
    expect(screen.getByRole('heading', { name: 'Aktive Nutzer' })).toBeInTheDocument();
    expect(screen.getByText('card-body')).toBeInTheDocument();
  });

  it('renders optional icon and headerRight slots', () => {
    render(
      <MetricCard
        title="Events"
        theme={theme}
        icon={<span>the-icon</span>}
        headerRight={<span>the-action</span>}
      >
        <div>body</div>
      </MetricCard>
    );
    expect(screen.getByText('the-icon')).toBeInTheDocument();
    expect(screen.getByText('the-action')).toBeInTheDocument();
  });
});
