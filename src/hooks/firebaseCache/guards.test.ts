import { describe, expect, it } from 'vitest';
import { isEmptySnapshot, isNetworkErrorMessage, shouldKeepPreviousData } from './guards';

describe('isNetworkErrorMessage', () => {
  it('erkennt lowercase "network"', () => {
    expect(isNetworkErrorMessage('a network error occurred')).toBe(true);
  });

  it('erkennt uppercase "NETWORK"', () => {
    expect(isNetworkErrorMessage('NETWORK_FAILURE')).toBe(true);
  });

  it('erkennt ERR_INTERNET_DISCONNECTED', () => {
    expect(isNetworkErrorMessage('net::ERR_INTERNET_DISCONNECTED')).toBe(true);
  });

  it('klassifiziert andere Fehler nicht als Netzwerkfehler', () => {
    expect(isNetworkErrorMessage('permission_denied at /users')).toBe(false);
  });

  it('leerer String ist kein Netzwerkfehler', () => {
    expect(isNetworkErrorMessage('')).toBe(false);
  });

  it('Mixed-Case "Network" wird NICHT erkannt (bewusst nur network/NETWORK)', () => {
    expect(isNetworkErrorMessage('Network request failed')).toBe(false);
  });
});

describe('isEmptySnapshot', () => {
  it('nicht-existenter Snapshot ist leer', () => {
    expect(isEmptySnapshot(false, {})).toBe(true);
  });

  it('existenter Snapshot ohne Kinder ist leer', () => {
    expect(isEmptySnapshot(true, {})).toBe(true);
  });

  it('existenter Snapshot mit Kindern ist nicht leer', () => {
    expect(isEmptySnapshot(true, { a: 1 })).toBe(false);
  });

  it('nicht-existent gewinnt auch bei (theoretisch) vorhandenen Keys', () => {
    expect(isEmptySnapshot(false, { a: 1 })).toBe(true);
  });
});

describe('shouldKeepPreviousData', () => {
  it('leerer Snapshot + vorhandene Daten → State behalten (Reconnect-Glitch-Guard)', () => {
    expect(shouldKeepPreviousData(true, { s1: {} })).toBe(true);
  });

  it('leerer Snapshot + leerer prev-State → nicht behalten', () => {
    expect(shouldKeepPreviousData(true, {})).toBe(false);
  });

  it('leerer Snapshot + null prev → nicht behalten', () => {
    expect(shouldKeepPreviousData(true, null)).toBe(false);
  });

  it('nicht-leerer Snapshot → nie behalten (neue Daten gewinnen)', () => {
    expect(shouldKeepPreviousData(false, { s1: {} })).toBe(false);
  });
});
