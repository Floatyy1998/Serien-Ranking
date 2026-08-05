import { Search } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => number | string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (item: T) => string;
  onRowClick?: (item: T) => void;
  /** @deprecated Farben kommen aus adminKit.css — Prop nur noch für Altaufrufe. */
  theme?: ReturnType<typeof useTheme>['currentTheme'];
  maxRows?: number;
}

function DataTableInner<T>({
  data,
  columns,
  searchKeys,
  onRowClick,
  maxRows = 50,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let items = data;
    if (search && searchKeys) {
      const q = search.toLowerCase();
      items = items.filter((item) => searchKeys(item).toLowerCase().includes(q));
    }
    if (sortCol) {
      const col = columns.find((c) => c.key === sortCol);
      if (col?.sortValue) {
        items = [...items].sort((a, b) => {
          const va = col.sortValue?.(a) ?? '';
          const vb = col.sortValue?.(b) ?? '';
          const cmp =
            typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return items.slice(0, maxRows);
  }, [data, search, searchKeys, sortCol, sortDir, columns, maxRows]);

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDir('desc');
    }
  };

  return (
    <div>
      {searchKeys && (
        <div className="adm-search">
          <Search style={{ fontSize: 18 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
          />
        </div>
      )}

      <div className="adm-table__wrap">
        <table className={`adm-table ${onRowClick ? 'adm-table--clickable' : ''}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  data-sortable={col.sortValue ? '1' : undefined}
                  onClick={() => col.sortValue && handleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                  {sortCol === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} onClick={() => onRowClick?.(item)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(item)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="adm-table__empty">
                <td colSpan={columns.length}>Keine Daten</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
