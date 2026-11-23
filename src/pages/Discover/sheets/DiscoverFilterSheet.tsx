import Block from '@mui/icons-material/Block';
import Check from '@mui/icons-material/Check';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../../../components/ui/overlay/BottomSheet';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  DEFAULT_VIEW_FILTERS,
  ERA_OPTIONS,
  MIN_MATCH_OPTIONS,
  MIN_RATING_OPTIONS,
  activeViewFilterCount,
  genreOptionsFor,
  normalizeEras,
  type DiscoverEra,
  type DiscoverViewFilters,
} from '../../../lib/taste/discoverFilters';
import type { TasteMedia } from '../../../lib/taste/tasteEngine';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface DiscoverFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoverViewFilters;
  onChange: (filters: DiscoverViewFilters) => void;
  media: TasteMedia;
  showMatch: boolean;
}

type GenreState = 'off' | 'only' | 'hide';

const ERA_SUMMARY: Record<string, string> = {
  '': 'Alle',
  old: 'Vor 2000',
  mid: '2000–2015',
  new: 'Ab 2016',
  'old,mid': 'Bis 2015',
  'mid,new': 'Ab 2000',
  'old,new': 'Vor 2000 und ab 2016',
};

const sameFilters = (a: DiscoverViewFilters, b: DiscoverViewFilters): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const DiscoverFilterSheet = ({
  isOpen,
  onClose,
  filters,
  onChange,
  media,
  showMatch,
}: DiscoverFilterSheetProps) => {
  const { currentTheme } = useTheme();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  const options = genreOptionsFor(media);
  const activeCount = activeViewFilterCount(draft);

  const close = () => {
    if (!sameFilters(draft, filters)) onChange(draft);
    onClose();
  };

  const stateOf = (id: string): GenreState =>
    draft.only.includes(id) ? 'only' : draft.hide.includes(id) ? 'hide' : 'off';

  const cycleGenre = (id: string) => {
    const state = stateOf(id);
    const only = draft.only.filter((entry) => entry !== id);
    const hide = draft.hide.filter((entry) => entry !== id);
    setDraft({
      ...draft,
      only: state === 'off' ? [...only, id] : only,
      hide: state === 'only' ? [...hide, id] : hide,
    });
  };

  const toggleEra = (id: DiscoverEra) =>
    setDraft({
      ...draft,
      eras: normalizeEras(
        draft.eras.includes(id) ? draft.eras.filter((entry) => entry !== id) : [...draft.eras, id]
      ),
    });

  const segment = (label: string, active: boolean, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      className={active ? 'is-active' : ''}
      aria-pressed={active}
      onClick={onClick}
      style={{ color: active ? onPrimary : currentTheme.text.secondary }}
    >
      {label}
    </button>
  );

  const group = (id: string, title: string, value: string, children: React.ReactNode) => (
    <section className="df-group" data-section={id}>
      <div className="df-label">
        <span style={{ color: currentTheme.text.secondary }}>{title}</span>
        <span className="df-value" style={{ color: currentTheme.primary }}>
          {value}
        </span>
      </div>
      {children}
    </section>
  );

  const genreSummary =
    draft.only.length + draft.hide.length === 0
      ? t('Alle')
      : [
          draft.only.length > 0 ? t('{n} gezeigt', { n: draft.only.length }) : '',
          draft.hide.length > 0 ? t('{n} ausgeblendet', { n: draft.hide.length }) : '',
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <BottomSheet isOpen={isOpen} onClose={close} ariaLabel={t('Filter')}>
      <div className="df">
        <header className="df-head">
          <h3 style={{ color: currentTheme.text.primary }}>{t('Filter')}</h3>
          <button
            type="button"
            className="df-reset"
            disabled={activeCount === 0}
            onClick={() => setDraft(DEFAULT_VIEW_FILTERS)}
            style={{ color: currentTheme.primary, opacity: activeCount === 0 ? 0.35 : 1 }}
          >
            {t('Zurücksetzen')}
          </button>
        </header>

        {group(
          'genres',
          t('Genres'),
          genreSummary,
          <>
            <div className="df-genres">
              {options.map((option) => {
                const state = stateOf(option.id);
                const label = t(option.label);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`df-genre df-genre--${state}`}
                    data-state={state}
                    aria-pressed={state !== 'off'}
                    aria-label={
                      state === 'only'
                        ? t('{genre}: wird gezeigt', { genre: label })
                        : state === 'hide'
                          ? t('{genre}: ausgeblendet', { genre: label })
                          : label
                    }
                    onClick={() => cycleGenre(option.id)}
                    style={{
                      color:
                        state === 'only'
                          ? onPrimary
                          : state === 'hide'
                            ? currentTheme.status.error
                            : currentTheme.text.secondary,
                      borderColor: state === 'hide' ? currentTheme.status.error : undefined,
                    }}
                  >
                    {state === 'only' && <Check style={{ fontSize: '15px' }} />}
                    {state === 'hide' && <Block style={{ fontSize: '14px' }} />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="df-hint" style={{ color: currentTheme.text.muted }}>
              {t(
                'Einmal antippen zeigt nur das Genre, zweimal blendet es aus. Bei mehreren gezeigten reicht eines.'
              )}
            </p>
          </>
        )}

        <div className="df-grid">
          {group(
            'era',
            t('Zeitraum'),
            t(ERA_SUMMARY[draft.eras.join(',')] ?? 'Alle'),
            <div className="df-seg">
              {ERA_OPTIONS.map((option) =>
                segment(
                  t(option.label),
                  draft.eras.includes(option.id),
                  () => toggleEra(option.id),
                  option.id
                )
              )}
            </div>
          )}

          {group(
            'rating',
            t('Mindestwertung'),
            draft.minRating === 0 ? t('Alle') : t('ab {n}', { n: draft.minRating }),
            <div className="df-seg">
              {MIN_RATING_OPTIONS.map((value) =>
                segment(
                  value === 0 ? t('Alle') : t('ab {n}', { n: value }),
                  draft.minRating === value,
                  () => setDraft({ ...draft, minRating: value }),
                  String(value)
                )
              )}
            </div>
          )}

          {showMatch &&
            group(
              'match',
              t('Übereinstimmung'),
              draft.minMatch === 0 ? t('Alle') : t('ab {n} %', { n: draft.minMatch }),
              <div className="df-seg">
                {MIN_MATCH_OPTIONS.map((value) =>
                  segment(
                    value === 0 ? t('Alle') : t('ab {n} %', { n: value }),
                    draft.minMatch === value,
                    () => setDraft({ ...draft, minMatch: value }),
                    String(value)
                  )
                )}
              </div>
            )}
        </div>

        <button type="button" className="df-done" onClick={close} style={{ color: onPrimary }}>
          {activeCount > 0 ? t('{n} Filter anwenden', { n: activeCount }) : t('Fertig')}
        </button>
      </div>
    </BottomSheet>
  );
};
