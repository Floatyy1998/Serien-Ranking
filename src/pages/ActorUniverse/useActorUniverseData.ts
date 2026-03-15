import { useCallback, useState } from 'react';
import { Actor, ActorConnection, useActorUniverse } from '../../hooks/useActorUniverse';
import {
  trackActorUniverseTabSwitched,
  trackActorUniverseVoiceToggled,
  trackActorSelected,
} from '../../firebase/analytics';

export type TabId = 'map' | 'recommendations' | 'top';

export const useActorUniverseData = () => {
  // Voice actor toggle - persisted in localStorage
  const [hideVoiceActors, setHideVoiceActors] = useState(() => {
    const saved = localStorage.getItem('actorUniverse_hideVoiceActors');
    return saved === 'true';
  });

  const toggleVoiceActors = () => {
    setHideVoiceActors((prev) => {
      const newValue = !prev;
      localStorage.setItem('actorUniverse_hideVoiceActors', String(newValue));
      trackActorUniverseVoiceToggled(!newValue);
      return newValue;
    });
  };

  const {
    actors,
    connections,
    topActors,
    recommendations,
    stats,
    loading,
    progress,
    loadingRecommendations,
  } = useActorUniverse(hideVoiceActors);

  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [hoveredActor, setHoveredActor] = useState<Actor | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('recommendations');

  // Get actor connections
  const getActorConnections = useCallback(
    (actorId: number): ActorConnection[] => {
      return connections.filter((c) => c.actor1Id === actorId || c.actor2Id === actorId);
    },
    [connections]
  );

  return {
    // Data
    actors,
    connections,
    topActors,
    recommendations,
    stats,
    loading,
    progress,
    loadingRecommendations,

    // Voice actor toggle
    hideVoiceActors,
    toggleVoiceActors,

    // Selection & hover
    selectedActor,
    setSelectedActor: (actor: Actor | null) => {
      setSelectedActor(actor);
      if (actor) trackActorSelected(actor.name);
    },
    hoveredActor,
    setHoveredActor,

    // Tab management
    activeTab,
    setActiveTab: (tab: TabId) => {
      setActiveTab(tab);
      trackActorUniverseTabSwitched(tab);
    },

    // Helpers
    getActorConnections,
  };
};
