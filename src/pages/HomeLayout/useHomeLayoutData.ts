/**
 * useHomeLayoutData - Business logic for HomeLayoutPage
 * Manages section ordering, visibility toggles, drag-drop, and Firebase persistence
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../AuthContext';

// --- Constants ---

export const DEFAULT_SECTION_ORDER = [
  'main-actions',
  'quick-actions',
  'secondary-actions',
  'countdown',
  'continue-watching',
  'rewatches',
  'today-episodes',
  'seasonal',
  'trending',
  'top-rated',
  'for-you',
  'stats',
];

export const DEFAULT_FOR_YOU_ORDER = [
  'watch-streak',
  'taste-match',
  'watch-journey',
  'catch-up',
  'hidden-series',
];

export const DEFAULT_MAIN_ACTIONS_ORDER = ['watchlist', 'discover'];

export const DEFAULT_QUICK_ACTIONS_ORDER = ['ratings', 'calendar', 'history', 'friends'];

export const DEFAULT_SECONDARY_ACTIONS_ORDER = ['leaderboard', 'badges', 'pets'];

export const SECTION_LABELS: Record<string, string> = {
  'main-actions': 'Hauptaktionen',
  'quick-actions': 'Schnellzugriff',
  'secondary-actions': 'Extras',
  countdown: 'Countdown',
  'continue-watching': 'Weiterschauen',
  rewatches: 'Rewatches',
  'today-episodes': 'Heute Neu',
  seasonal: 'Saisonale Empfehlungen',
  trending: 'Trending',
  'top-rated': 'Bestbewertet',
  'for-you': 'Für dich',
  stats: 'Statistiken',
};

export const FOR_YOU_LABELS: Record<string, string> = {
  'watch-streak': 'Watch Streak',
  'taste-match': 'Taste Match',
  'watch-journey': 'Watch Journey',
  'catch-up': 'Backlog',
  'hidden-series': 'Nicht weitergeschaut',
};

export const MAIN_ACTIONS_LABELS: Record<string, string> = {
  watchlist: 'Weiterschauen',
  discover: 'Entdecken',
};

export const QUICK_ACTIONS_LABELS: Record<string, string> = {
  ratings: 'Ratings',
  calendar: 'Kalender',
  history: 'Verlauf',
  friends: 'Freunde',
};

export const SECONDARY_ACTIONS_LABELS: Record<string, string> = {
  leaderboard: 'Rangliste',
  badges: 'Badges',
  pets: 'Pets',
};

// --- Types ---

export interface HomeConfig {
  sectionOrder: string[];
  hiddenSections: string[];
  forYouOrder: string[];
  hiddenForYou: string[];
  mainActionsOrder: string[];
  hiddenMainActions: string[];
  quickActionsOrder: string[];
  hiddenQuickActions: string[];
  secondaryActionsOrder: string[];
  hiddenSecondaryActions: string[];
}

export interface ExpandableConfig {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  order: string[];
  onReorder: (newOrder: string[]) => void;
  hiddenItems: string[];
  onToggle: (id: string) => void;
  labels: Record<string, string>;
}

export interface UseHomeLayoutDataResult {
  sectionOrder: string[];
  hiddenSections: string[];
  handleSectionReorder: (newOrder: string[]) => void;
  handleSectionToggle: (id: string) => void;
  handleReset: () => void;
  getExpandableConfig: (sectionId: string) => ExpandableConfig | null;
}

// --- Helpers ---

/** Merge saved order with defaults, ensuring no items are lost */
function mergeOrder(saved: string[], defaults: string[], labels: Record<string, string>): string[] {
  const valid = saved.filter((id: string) => labels[id]);
  for (const id of defaults) {
    if (!valid.includes(id)) valid.push(id);
  }
  return valid;
}

function filterValid(arr: string[], labels: Record<string, string>): string[] {
  return arr.filter((id: string) => labels[id]);
}

// --- Hook ---

export const useHomeLayoutData = (): UseHomeLayoutDataResult => {
  const authContext = useAuth();
  const user = authContext?.user;

  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [forYouOrder, setForYouOrder] = useState<string[]>(DEFAULT_FOR_YOU_ORDER);
  const [hiddenForYou, setHiddenForYou] = useState<string[]>([]);
  const [mainActionsOrder, setMainActionsOrder] = useState<string[]>(DEFAULT_MAIN_ACTIONS_ORDER);
  const [hiddenMainActions, setHiddenMainActions] = useState<string[]>([]);
  const [quickActionsOrder, setQuickActionsOrder] = useState<string[]>(DEFAULT_QUICK_ACTIONS_ORDER);
  const [hiddenQuickActions, setHiddenQuickActions] = useState<string[]>([]);
  const [secondaryActionsOrder, setSecondaryActionsOrder] = useState<string[]>(
    DEFAULT_SECONDARY_ACTIONS_ORDER
  );
  const [hiddenSecondaryActions, setHiddenSecondaryActions] = useState<string[]>([]);

  const [forYouExpanded, setForYouExpanded] = useState(false);
  const [mainActionsExpanded, setMainActionsExpanded] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const [secondaryActionsExpanded, setSecondaryActionsExpanded] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Firebase save (debounced) ---

  const saveConfig = useCallback(
    (config: HomeConfig) => {
      if (!user) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        firebase.database().ref(`users/${user.uid}/homeConfig`).set(config);
      }, 500);
    },
    [user]
  );

  const currentConfig = useCallback(
    (): HomeConfig => ({
      sectionOrder,
      hiddenSections,
      forYouOrder,
      hiddenForYou,
      mainActionsOrder,
      hiddenMainActions,
      quickActionsOrder,
      hiddenQuickActions,
      secondaryActionsOrder,
      hiddenSecondaryActions,
    }),
    [
      sectionOrder,
      hiddenSections,
      forYouOrder,
      hiddenForYou,
      mainActionsOrder,
      hiddenMainActions,
      quickActionsOrder,
      hiddenQuickActions,
      secondaryActionsOrder,
      hiddenSecondaryActions,
    ]
  );

  // --- Firebase load ---

  useEffect(() => {
    if (!user) return;
    firebase
      .database()
      .ref(`users/${user.uid}/homeConfig`)
      .once('value')
      .then((snap) => {
        const data = snap.val();
        if (data?.sectionOrder)
          setSectionOrder(mergeOrder(data.sectionOrder, DEFAULT_SECTION_ORDER, SECTION_LABELS));
        if (data?.hiddenSections)
          setHiddenSections(filterValid(data.hiddenSections, SECTION_LABELS));
        if (data?.forYouOrder) setForYouOrder(filterValid(data.forYouOrder, FOR_YOU_LABELS));
        if (data?.hiddenForYou) setHiddenForYou(filterValid(data.hiddenForYou, FOR_YOU_LABELS));
        if (data?.mainActionsOrder)
          setMainActionsOrder(
            mergeOrder(data.mainActionsOrder, DEFAULT_MAIN_ACTIONS_ORDER, MAIN_ACTIONS_LABELS)
          );
        if (data?.hiddenMainActions)
          setHiddenMainActions(filterValid(data.hiddenMainActions, MAIN_ACTIONS_LABELS));
        if (data?.quickActionsOrder)
          setQuickActionsOrder(
            mergeOrder(data.quickActionsOrder, DEFAULT_QUICK_ACTIONS_ORDER, QUICK_ACTIONS_LABELS)
          );
        if (data?.hiddenQuickActions)
          setHiddenQuickActions(filterValid(data.hiddenQuickActions, QUICK_ACTIONS_LABELS));
        if (data?.secondaryActionsOrder)
          setSecondaryActionsOrder(
            mergeOrder(
              data.secondaryActionsOrder,
              DEFAULT_SECONDARY_ACTIONS_ORDER,
              SECONDARY_ACTIONS_LABELS
            )
          );
        if (data?.hiddenSecondaryActions)
          setHiddenSecondaryActions(
            filterValid(data.hiddenSecondaryActions, SECONDARY_ACTIONS_LABELS)
          );
      });
  }, [user]);

  // --- Generic toggle helper ---

  const makeToggle = (
    hidden: string[],
    setHidden: React.Dispatch<React.SetStateAction<string[]>>,
    configKey: keyof HomeConfig
  ) => {
    return (id: string) => {
      const newHidden = hidden.includes(id) ? hidden.filter((s) => s !== id) : [...hidden, id];
      setHidden(newHidden);
      saveConfig({ ...currentConfig(), [configKey]: newHidden });
      if (navigator.vibrate) navigator.vibrate(50);
    };
  };

  // --- Section handlers ---

  const handleSectionReorder = (newOrder: string[]) => {
    setSectionOrder(newOrder);
    saveConfig({ ...currentConfig(), sectionOrder: newOrder });
  };

  const handleSectionToggle = makeToggle(hiddenSections, setHiddenSections, 'hiddenSections');

  // --- Sub-section handlers ---

  const handleForYouReorder = (newOrder: string[]) => {
    setForYouOrder(newOrder);
    saveConfig({ ...currentConfig(), forYouOrder: newOrder });
  };
  const handleForYouToggle = makeToggle(hiddenForYou, setHiddenForYou, 'hiddenForYou');

  const handleMainActionsReorder = (newOrder: string[]) => {
    setMainActionsOrder(newOrder);
    saveConfig({ ...currentConfig(), mainActionsOrder: newOrder });
  };
  const handleMainActionsToggle = makeToggle(
    hiddenMainActions,
    setHiddenMainActions,
    'hiddenMainActions'
  );

  const handleQuickActionsReorder = (newOrder: string[]) => {
    setQuickActionsOrder(newOrder);
    saveConfig({ ...currentConfig(), quickActionsOrder: newOrder });
  };
  const handleQuickActionsToggle = makeToggle(
    hiddenQuickActions,
    setHiddenQuickActions,
    'hiddenQuickActions'
  );

  const handleSecondaryActionsReorder = (newOrder: string[]) => {
    setSecondaryActionsOrder(newOrder);
    saveConfig({ ...currentConfig(), secondaryActionsOrder: newOrder });
  };
  const handleSecondaryActionsToggle = makeToggle(
    hiddenSecondaryActions,
    setHiddenSecondaryActions,
    'hiddenSecondaryActions'
  );

  // --- Reset ---

  const handleReset = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setHiddenSections([]);
    setForYouOrder(DEFAULT_FOR_YOU_ORDER);
    setHiddenForYou([]);
    setMainActionsOrder(DEFAULT_MAIN_ACTIONS_ORDER);
    setHiddenMainActions([]);
    setQuickActionsOrder(DEFAULT_QUICK_ACTIONS_ORDER);
    setHiddenQuickActions([]);
    setSecondaryActionsOrder(DEFAULT_SECONDARY_ACTIONS_ORDER);
    setHiddenSecondaryActions([]);
    saveConfig({
      sectionOrder: DEFAULT_SECTION_ORDER,
      hiddenSections: [],
      forYouOrder: DEFAULT_FOR_YOU_ORDER,
      hiddenForYou: [],
      mainActionsOrder: DEFAULT_MAIN_ACTIONS_ORDER,
      hiddenMainActions: [],
      quickActionsOrder: DEFAULT_QUICK_ACTIONS_ORDER,
      hiddenQuickActions: [],
      secondaryActionsOrder: DEFAULT_SECONDARY_ACTIONS_ORDER,
      hiddenSecondaryActions: [],
    });
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
  };

  // --- Expandable config lookup ---

  const getExpandableConfig = (sectionId: string): ExpandableConfig | null => {
    switch (sectionId) {
      case 'for-you':
        return {
          expanded: forYouExpanded,
          setExpanded: setForYouExpanded,
          order: forYouOrder,
          onReorder: handleForYouReorder,
          hiddenItems: hiddenForYou,
          onToggle: handleForYouToggle,
          labels: FOR_YOU_LABELS,
        };
      case 'main-actions':
        return {
          expanded: mainActionsExpanded,
          setExpanded: setMainActionsExpanded,
          order: mainActionsOrder,
          onReorder: handleMainActionsReorder,
          hiddenItems: hiddenMainActions,
          onToggle: handleMainActionsToggle,
          labels: MAIN_ACTIONS_LABELS,
        };
      case 'quick-actions':
        return {
          expanded: quickActionsExpanded,
          setExpanded: setQuickActionsExpanded,
          order: quickActionsOrder,
          onReorder: handleQuickActionsReorder,
          hiddenItems: hiddenQuickActions,
          onToggle: handleQuickActionsToggle,
          labels: QUICK_ACTIONS_LABELS,
        };
      case 'secondary-actions':
        return {
          expanded: secondaryActionsExpanded,
          setExpanded: setSecondaryActionsExpanded,
          order: secondaryActionsOrder,
          onReorder: handleSecondaryActionsReorder,
          hiddenItems: hiddenSecondaryActions,
          onToggle: handleSecondaryActionsToggle,
          labels: SECONDARY_ACTIONS_LABELS,
        };
      default:
        return null;
    }
  };

  return {
    sectionOrder,
    hiddenSections,
    handleSectionReorder,
    handleSectionToggle,
    handleReset,
    getExpandableConfig,
  };
};
