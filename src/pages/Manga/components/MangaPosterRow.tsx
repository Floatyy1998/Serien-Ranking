import type React from 'react';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import './MangaCards.css';

interface MangaPosterRowProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  /** Zwischen Überschrift und Reihe, z. B. Filter-Pillen. */
  subheader?: React.ReactNode;
  /** Anzahl der Karten — Desktop setzt kurze Reihen nebeneinander. */
  count?: number;
  children: React.ReactNode;
}

export const MangaPosterRow = ({
  icon,
  iconColor,
  title,
  onSeeAll,
  seeAllLabel,
  subheader,
  count,
  children,
}: MangaPosterRowProps) => (
  <section
    className="manga-section"
    style={count ? ({ '--n': count } as React.CSSProperties) : undefined}
  >
    <SectionHeader
      icon={icon}
      iconColor={iconColor}
      title={title}
      onSeeAll={onSeeAll}
      seeAllLabel={seeAllLabel}
    />
    {subheader}
    <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
      {children}
    </HorizontalScrollContainer>
  </section>
);
