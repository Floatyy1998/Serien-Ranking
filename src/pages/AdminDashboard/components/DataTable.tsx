import { Search } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import type { useTheme } from '../../../contexts/ThemeContextDef';

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
  theme: ReturnType<typeof useTheme>['currentTheme'];
  maxRows?: number;
}

function DataTableInner<T>({
  data,
  columns,
  searchKeys,
  onRowClick,
  theme,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            background: `${theme.background.default}80`,
            border: `1px solid ${theme.border.default}`,
            marginBottom: 12,
          }}
        >
          <Search style={{ fontSize: 18, color: theme.text.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.text.primary,
              fontSize: 14,
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortValue && handleSort(col.key)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: theme.text.muted,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: `1px solid ${theme.border.default}`,
                    cursor: col.sortValue ? 'pointer' : 'default',
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                  {sortCol === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  borderBottom: `1px solid ${theme.border.default}40`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    `${theme.background.surface}80`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '10px 12px',
                      color: theme.text.primary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: theme.text.muted,
                  }}
                >
                  Keine Daten
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
