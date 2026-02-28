/**
 * HomeLayoutPage - Homepage Section Customization
 * Drag-to-reorder sections and toggle visibility
 */

import { DragIndicator, ExpandMore, RestartAlt, ViewQuilt } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_SECTION_ORDER = [
  'countdown',
  'continue-watching',
  'rewatches',
  'today-episodes',
  'trending',
  'top-rated',
  'for-you',
  'stats',
];

const DEFAULT_FOR_YOU_ORDER = [
  'watch-streak',
  'taste-match',
  'watch-journey',
  'catch-up',
  'hidden-series',
];

const SECTION_LABELS: Record<string, string> = {
  countdown: 'Countdown',
  'continue-watching': 'Weiterschauen',
  rewatches: 'Rewatches',
  'today-episodes': 'Heute Neu',
  trending: 'Trending',
  'top-rated': 'Bestbewertet',
  'for-you': 'Für dich',
  stats: 'Statistiken',
};

const FOR_YOU_LABELS: Record<string, string> = {
  'watch-streak': 'Watch Streak',
  'taste-match': 'Taste Match',
  'watch-journey': 'Watch Journey',
  'catch-up': 'Backlog',
  'hidden-series': 'Nicht weitergeschaut',
};

export const HomeLayoutPage = () => {
  const { currentTheme } = useTheme();
  const authContext = useAuth();
  const user = authContext?.user;

  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [forYouOrder, setForYouOrder] = useState<string[]>(DEFAULT_FOR_YOU_ORDER);
  const [hiddenForYou, setHiddenForYou] = useState<string[]>([]);
  const [forYouExpanded, setForYouExpanded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback(
    (order: string[], hidden: string[], fyOrder: string[], fyHidden: string[]) => {
      if (!user) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        firebase.database().ref(`users/${user.uid}/homeConfig`).set({
          sectionOrder: order,
          hiddenSections: hidden,
          forYouOrder: fyOrder,
          hiddenForYou: fyHidden,
        });
      }, 500);
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    firebase
      .database()
      .ref(`users/${user.uid}/homeConfig`)
      .once('value')
      .then((snap) => {
        const data = snap.val();
        if (data?.sectionOrder) {
          // Filter out unknown section IDs (e.g. removed features)
          const valid = data.sectionOrder.filter((id: string) => SECTION_LABELS[id]);
          // Add any new defaults that aren't in the saved order
          for (const id of DEFAULT_SECTION_ORDER) {
            if (!valid.includes(id)) valid.push(id);
          }
          setSectionOrder(valid);
        }
        if (data?.hiddenSections)
          setHiddenSections(data.hiddenSections.filter((id: string) => SECTION_LABELS[id]));
        if (data?.forYouOrder)
          setForYouOrder(data.forYouOrder.filter((id: string) => FOR_YOU_LABELS[id]));
        if (data?.hiddenForYou)
          setHiddenForYou(data.hiddenForYou.filter((id: string) => FOR_YOU_LABELS[id]));
      });
  }, [user]);

  const handleSectionReorder = (newOrder: string[]) => {
    setSectionOrder(newOrder);
    saveConfig(newOrder, hiddenSections, forYouOrder, hiddenForYou);
  };

  const handleSectionToggle = (id: string) => {
    const newHidden = hiddenSections.includes(id)
      ? hiddenSections.filter((s) => s !== id)
      : [...hiddenSections, id];
    setHiddenSections(newHidden);
    saveConfig(sectionOrder, newHidden, forYouOrder, hiddenForYou);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleForYouReorder = (newOrder: string[]) => {
    setForYouOrder(newOrder);
    saveConfig(sectionOrder, hiddenSections, newOrder, hiddenForYou);
  };

  const handleForYouToggle = (id: string) => {
    const newHidden = hiddenForYou.includes(id)
      ? hiddenForYou.filter((s) => s !== id)
      : [...hiddenForYou, id];
    setHiddenForYou(newHidden);
    saveConfig(sectionOrder, hiddenSections, forYouOrder, newHidden);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleReset = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setHiddenSections([]);
    setForYouOrder(DEFAULT_FOR_YOU_ORDER);
    setHiddenForYou([]);
    saveConfig(DEFAULT_SECTION_ORDER, [], DEFAULT_FOR_YOU_ORDER, []);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
  };

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <label
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '44px',
        height: '24px',
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? currentTheme.primary : `${currentTheme.text.muted}30`,
          transition: '0.3s',
          borderRadius: '24px',
        }}
      >
        <span
          style={{
            position: 'absolute',
            height: '18px',
            width: '18px',
            left: checked ? '23px' : '3px',
            bottom: '3px',
            backgroundColor: 'white',
            transition: '0.3s',
            borderRadius: '50%',
          }}
        />
      </span>
    </label>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Homepage Layout"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
      />

      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* Header with reset */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ViewQuilt style={{ fontSize: '22px', color: currentTheme.primary }} />
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: 0,
                color: currentTheme.text.primary,
              }}
            >
              Sektionen
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: `${currentTheme.text.muted}15`,
              border: 'none',
              color: currentTheme.text.muted,
              fontSize: '12px',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            <RestartAlt style={{ fontSize: '16px' }} />
            Zurücksetzen
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          style={{
            fontSize: '13px',
            color: currentTheme.text.muted,
            margin: '0 0 16px 0',
            lineHeight: 1.5,
          }}
        >
          Ziehe Sektionen um die Reihenfolge zu ändern. Schalte den Toggle um, um Sektionen
          auszublenden.
        </motion.p>

        {/* Section List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '20px',
            padding: '12px',
            marginBottom: '100px',
          }}
        >
          <Reorder.Group
            axis="y"
            values={sectionOrder}
            onReorder={handleSectionReorder}
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {sectionOrder.map((sectionId) => {
              const isForYou = sectionId === 'for-you';
              const isHidden = hiddenSections.includes(sectionId);

              return (
                <Reorder.Item
                  key={sectionId}
                  value={sectionId}
                  style={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    opacity: isHidden ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: `0 8px 24px ${currentTheme.primary}25`,
                    zIndex: 10,
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                    }}
                  >
                    <DragIndicator
                      style={{ fontSize: '20px', color: currentTheme.text.muted, flexShrink: 0 }}
                    />

                    {/* Label + optional expand button */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: isForYou ? 'pointer' : 'default',
                      }}
                      onClick={
                        isForYou
                          ? (e) => {
                              e.stopPropagation();
                              setForYouExpanded(!forYouExpanded);
                            }
                          : undefined
                      }
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isHidden ? currentTheme.text.muted : currentTheme.text.primary,
                        }}
                      >
                        {SECTION_LABELS[sectionId] || sectionId}
                      </span>
                      {isForYou && (
                        <motion.div
                          animate={{ rotate: forYouExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <ExpandMore
                            style={{ fontSize: '20px', color: currentTheme.text.muted }}
                          />
                        </motion.div>
                      )}
                    </div>

                    <Toggle
                      checked={!isHidden}
                      onChange={() => handleSectionToggle(sectionId)}
                      label={`${SECTION_LABELS[sectionId]} ${isHidden ? 'einblenden' : 'ausblenden'}`}
                    />
                  </div>

                  {/* Für dich sub-items */}
                  {isForYou && (
                    <AnimatePresence>
                      {forYouExpanded && !isHidden && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            style={{
                              padding: '0 8px 10px 8px',
                              borderTop: `1px solid ${currentTheme.border.default}`,
                              margin: '0 10px',
                              paddingTop: '10px',
                            }}
                          >
                            <Reorder.Group
                              axis="y"
                              values={forYouOrder}
                              onReorder={handleForYouReorder}
                              style={{
                                listStyle: 'none',
                                margin: 0,
                                padding: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              {forYouOrder.map((subId) => {
                                const isSubHidden = hiddenForYou.includes(subId);
                                return (
                                  <Reorder.Item
                                    key={subId}
                                    value={subId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '9px 10px',
                                      borderRadius: '10px',
                                      cursor: 'grab',
                                      opacity: isSubHidden ? 0.45 : 1,
                                      transition: 'opacity 0.2s',
                                      background: `${currentTheme.primary}08`,
                                    }}
                                    whileDrag={{
                                      scale: 1.02,
                                      boxShadow: `0 4px 12px ${currentTheme.primary}20`,
                                      zIndex: 10,
                                    }}
                                  >
                                    <DragIndicator
                                      style={{
                                        fontSize: '16px',
                                        color: currentTheme.text.muted,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      style={{
                                        flex: 1,
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: isSubHidden
                                          ? currentTheme.text.muted
                                          : currentTheme.text.primary,
                                      }}
                                    >
                                      {FOR_YOU_LABELS[subId] || subId}
                                    </span>
                                    <Toggle
                                      checked={!isSubHidden}
                                      onChange={() => handleForYouToggle(subId)}
                                      label={`${FOR_YOU_LABELS[subId]} ${isSubHidden ? 'einblenden' : 'ausblenden'}`}
                                    />
                                  </Reorder.Item>
                                );
                              })}
                            </Reorder.Group>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </motion.div>
      </div>
    </PageLayout>
  );
};
