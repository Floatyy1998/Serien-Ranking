import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';

export interface RankItem {
  key: string;
  label: string;
  detail: string;
  /** Länge des Balkens relativ zum ersten Eintrag. */
  amount: number;
  image?: string;
  onClick?: () => void;
}

export const RankCard: React.FC<{ title: string; icon: React.ReactNode; items: RankItem[] }> = ({
  title,
  icon,
  items,
}) => {
  const { currentTheme } = useTheme();
  if (items.length === 0) return null;
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <div className="bk-card">
      <div className="rs-card-title" style={{ color: currentTheme.text.secondary }}>
        {icon}
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => {
          const body = (
            <>
              <span
                className="rs-rank-pos"
                style={{ color: i < 3 ? currentTheme.primary : currentTheme.text.muted }}
              >
                {i + 1}
              </span>
              {item.image !== undefined && (
                <img
                  className="rs-rank-img"
                  src={item.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
              <span className="rs-rank-body">
                <span className="rs-rank-line">
                  <span className="rs-rank-name" style={{ color: currentTheme.text.secondary }}>
                    {item.label}
                  </span>
                  <span className="rs-rank-detail" style={{ color: currentTheme.text.muted }}>
                    {item.detail}
                  </span>
                </span>
                <span className="bk-progress" style={{ height: 5 }}>
                  <span
                    className="bk-progress-fill"
                    style={{
                      width: `${(item.amount / max) * 100}%`,
                      background: currentTheme.accent,
                    }}
                  />
                </span>
              </span>
            </>
          );
          return item.onClick ? (
            <button
              key={item.key}
              type="button"
              className="rs-rank-row rs-rank-row--tap"
              onClick={item.onClick}
            >
              {body}
            </button>
          ) : (
            <div key={item.key} className="rs-rank-row">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
};
