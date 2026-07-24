import { NAME_BADGES, resolveNameBadgeIds } from './data/nameBadges';

/**
 * Rendert alle Namens-Badges einer UID (heute: Owner) als kleine Chips.
 * `badgeIds` erlaubt zusätzlich datengetriebene Badges (Events, Käufe).
 * `compact` zeigt nur das Icon — für enge Zeilen.
 */
export const NameBadges = ({
  uid,
  badgeIds,
  compact = false,
}: {
  uid?: string | null;
  badgeIds?: string[];
  compact?: boolean;
}) => {
  const ids = [...resolveNameBadgeIds(uid), ...(badgeIds || [])];
  if (ids.length === 0) return null;

  return (
    <>
      {ids.map((id) => {
        const def = NAME_BADGES[id];
        if (!def) return null;
        const Icon = def.Icon;
        return (
          <span
            key={id}
            className={`name-badge${compact ? ' name-badge--compact' : ''}`}
            style={{ background: def.gradient, color: def.textColor }}
            title={def.title}
          >
            <Icon className="name-badge__icon" />
            {!compact && def.label}
          </span>
        );
      })}
    </>
  );
};
