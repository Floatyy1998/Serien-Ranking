// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { DataTable } from './DataTable';

const theme = generateDynamicTheme(defaultThemeConfig);

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

const columns = [
  {
    key: 'name',
    label: 'Name',
    render: (item: Row) => item.name,
    sortValue: (item: Row) => item.name,
  },
];

afterEach(cleanup);

describe('DataTable', () => {
  it('renders header and all rows (smoke)', () => {
    render(<DataTable data={rows} columns={columns} theme={theme} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('filters rows via the search input', () => {
    render(<DataTable data={rows} columns={columns} searchKeys={(r) => r.name} theme={theme} />);
    fireEvent.change(screen.getByPlaceholderText('Suchen...'), { target: { value: 'Alpha' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('invokes onRowClick with the clicked item', () => {
    const onRowClick = vi.fn<(item: Row) => void>();
    render(<DataTable data={rows} columns={columns} onRowClick={onRowClick} theme={theme} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('shows the empty placeholder when there is no data', () => {
    render(<DataTable data={[]} columns={columns} theme={theme} />);
    expect(screen.getByText('Keine Daten')).toBeInTheDocument();
  });
});
