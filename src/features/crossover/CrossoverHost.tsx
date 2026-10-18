import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrossoverEditorSheet } from '../../components/crossover/CrossoverEditorSheet';
import { CrossoverSheet } from '../../components/crossover/CrossoverSheet';
import { useCrossoverIndex } from '../../hooks/series/useCrossovers';
import { CROSSOVER_EVENT, type OpenCrossoverDetail } from './openCrossover';

/** Globales Crossover-Sheet für Chips in Home-Listen, WatchNext & Co. */
export const CrossoverHost = () => {
  const navigate = useNavigate();
  const { index } = useCrossoverIndex();
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenCrossoverDetail>).detail;
      if (detail?.id) setViewId(detail.id);
    };
    window.addEventListener(CROSSOVER_EVENT, handler);
    return () => window.removeEventListener(CROSSOVER_EVENT, handler);
  }, []);

  const find = (id: string | null) =>
    id ? (index?.entries.find((e) => e.id === id)?.entry ?? null) : null;
  const viewEntry = find(viewId);
  const editEntry = find(editId);

  return (
    <>
      <CrossoverSheet
        isOpen={viewId !== null && viewEntry !== null}
        id={viewId}
        entry={viewEntry}
        navigate={navigate}
        onClose={() => setViewId(null)}
        onEdit={(id) => {
          setViewId(null);
          setEditId(id);
        }}
      />
      <CrossoverEditorSheet
        isOpen={editId !== null && editEntry !== null}
        id={editId}
        initial={editEntry}
        onClose={() => setEditId(null)}
        onSaved={(id) => setViewId(id)}
      />
    </>
  );
};
