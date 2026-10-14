import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFilmography } from '../../../lib/person/filmography';
import { fetchPersonProfile, type PersonProfile } from '../../../services/api/tmdbPeople';

interface State {
  id: number | null;
  profile: PersonProfile | null;
  error: boolean;
}

export function usePersonProfile(personId: number | null) {
  const [state, setState] = useState<State>({ id: null, profile: null, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!personId) return;
    let alive = true;
    setState((prev) =>
      prev.id === personId && !prev.error ? prev : { id: personId, profile: null, error: false }
    );
    fetchPersonProfile(personId)
      .then((profile) => {
        if (alive) setState({ id: personId, profile, error: false });
      })
      .catch((err) => {
        console.error('Person profile failed:', err);
        if (alive) setState({ id: personId, profile: null, error: true });
      });
    return () => {
      alive = false;
    };
  }, [personId, attempt]);

  const profile = state.id === personId ? state.profile : null;
  const filmography = useMemo(
    () => (profile ? buildFilmography(profile.cast, profile.crew) : []),
    [profile]
  );
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    profile,
    filmography,
    loading: !!personId && !profile && !(state.id === personId && state.error),
    error: state.id === personId && state.error,
    retry,
  };
}
