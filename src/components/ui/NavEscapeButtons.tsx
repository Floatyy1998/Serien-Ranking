import * as React from 'react';
import { useIsNavRoot } from '../../hooks/useIsNavRoot';
import { BackButton } from './BackButton';

/**
 * Zurück + Home für Seiten mit eigenem Header (ohne PageHeader): erscheint
 * nur, wenn die Seite gerade KEIN Ziel der konfigurierbaren unteren Leiste
 * ist — dort übernimmt das Dock die Navigation.
 */
export const NavEscapeButtons = ({ style }: { style?: React.CSSProperties }) => {
  const isNavRoot = useIsNavRoot();
  if (isNavRoot) return null;
  return <BackButton style={style} />;
};
