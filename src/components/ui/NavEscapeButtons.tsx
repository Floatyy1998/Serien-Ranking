import * as React from 'react';
import { useIsNavRoot } from '../../hooks/useIsNavRoot';
import { BackButton } from './BackButton';

/** Zurück + Home für Seiten ohne PageHeader; nur sichtbar, wenn die Seite kein Dock-Ziel ist. */
export const NavEscapeButtons = ({ style }: { style?: React.CSSProperties }) => {
  const isNavRoot = useIsNavRoot();
  if (isNavRoot) return null;
  return <BackButton style={style} />;
};
