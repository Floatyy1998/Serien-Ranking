import {
  DEFAULT_FOR_YOU_ORDER,
  DEFAULT_QUICK_ACTIONS_ORDER,
  DEFAULT_SECONDARY_ACTIONS_ORDER,
  DEFAULT_SECTION_ORDER,
  HOME_DEFAULT_HIDDEN_BY_VERSION,
  HOME_HIDDEN_DEFAULTS,
  HOME_LAYOUT_VERSION,
  type HomeHiddenKey,
} from '../../config/homeSections';
import { mergeSectionOrder, sanitizeHiddenIds } from './sectionOrder';

export interface HomeConfig {
  layoutVersion: number;
  sectionOrder: string[];
  hiddenSections: string[];
  forYouOrder: string[];
  hiddenForYou: string[];
  quickActionsOrder: string[];
  hiddenQuickActions: string[];
  secondaryActionsOrder: string[];
  hiddenSecondaryActions: string[];
  hiddenHeader: string[];
}

const HIDDEN_KEYS = Object.keys(HOME_HIDDEN_DEFAULTS) as HomeHiddenKey[];

const LEGACY_VERSION = 1;

const hiddenSince = (key: HomeHiddenKey, savedVersion: number): string[] =>
  Object.entries(HOME_DEFAULT_HIDDEN_BY_VERSION)
    .filter(([version]) => Number(version) > savedVersion)
    .flatMap(([, lists]) => [...(lists[key] ?? [])]);

const withHiddenDefaults = (saved: unknown, key: HomeHiddenKey, savedVersion: number): string[] => {
  const known = HOME_HIDDEN_DEFAULTS[key];
  const out = sanitizeHiddenIds(saved, known);
  for (const id of hiddenSince(key, savedVersion)) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
};

export function sanitizeHomeConfig(raw: unknown): HomeConfig {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const savedVersion =
    typeof source.layoutVersion === 'number' ? source.layoutVersion : LEGACY_VERSION;
  const hidden = Object.fromEntries(
    HIDDEN_KEYS.map((key) => [key, withHiddenDefaults(source[key], key, savedVersion)])
  ) as Record<HomeHiddenKey, string[]>;

  return {
    layoutVersion: HOME_LAYOUT_VERSION,
    sectionOrder: mergeSectionOrder(source.sectionOrder, DEFAULT_SECTION_ORDER),
    forYouOrder: mergeSectionOrder(source.forYouOrder, DEFAULT_FOR_YOU_ORDER),
    quickActionsOrder: mergeSectionOrder(source.quickActionsOrder, DEFAULT_QUICK_ACTIONS_ORDER),
    secondaryActionsOrder: mergeSectionOrder(
      source.secondaryActionsOrder,
      DEFAULT_SECONDARY_ACTIONS_ORDER
    ),
    ...hidden,
  };
}

export const defaultHomeConfig = (): HomeConfig => sanitizeHomeConfig(null);
