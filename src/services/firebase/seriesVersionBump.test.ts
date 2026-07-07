import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const TIMESTAMP = { '.sv': 'timestamp' };
  const setMock = vi.fn(() => Promise.resolve());
  const refMock = vi.fn(() => ({ set: setMock }));
  // `firebase.database` wird sowohl als Funktion (database()) als auch als
  // Namespace (database.ServerValue.TIMESTAMP) benutzt.
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP },
  });
  return { TIMESTAMP, setMock, refMock, database };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: fb.database },
}));
vi.mock('firebase/compat/database', () => ({}));

import { bumpSeriesVersion } from './seriesVersionBump';

describe('bumpSeriesVersion', () => {
  beforeEach(() => {
    fb.setMock.mockClear();
    fb.refMock.mockClear();
  });

  it('schreibt den Server-Timestamp an users/$uid/meta/serienVersion', () => {
    bumpSeriesVersion('abc123');
    expect(fb.refMock).toHaveBeenCalledWith('users/abc123/meta/serienVersion');
    expect(fb.setMock).toHaveBeenCalledTimes(1);
    expect(fb.setMock).toHaveBeenCalledWith(fb.TIMESTAMP);
  });

  it('benutzt die uebergebene uid im Pfad', () => {
    bumpSeriesVersion('other-uid');
    expect(fb.refMock).toHaveBeenCalledWith('users/other-uid/meta/serienVersion');
  });
});
