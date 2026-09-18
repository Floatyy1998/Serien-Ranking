import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateWithSeriesVersion: vi.fn(async () => {}),
  showToast: vi.fn(),
}));

vi.mock('../db/ref', () => ({
  updateWithSeriesVersion: mocks.updateWithSeriesVersion,
  bumpSeriesVersion: vi.fn(),
  dbRef: vi.fn(),
  paths: { seriesItem: (uid: string, id: number | string) => `users/${uid}/series/${id}` },
}));
vi.mock('../../lib/interaction/toast', () => ({ showToast: mocks.showToast }));
vi.mock('../i18n', () => ({ t: (key: string) => key }));

import { unhideSeriesOnWatch } from './hiddenSeries';

let nextId = 1000;
const freshId = () => nextId++;

beforeEach(() => {
  mocks.updateWithSeriesVersion.mockReset().mockResolvedValue(undefined);
  mocks.showToast.mockReset();
});

describe('unhideSeriesOnWatch', () => {
  it('löscht das hidden-Flag und meldet es dem Nutzer', async () => {
    const id = freshId();
    await unhideSeriesOnWatch('u1', id, 'Dark');

    expect(mocks.updateWithSeriesVersion).toHaveBeenCalledWith('u1', {
      [`users/u1/series/${id}/hidden`]: null,
    });
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
  });

  it('schreibt beim Abhaken mehrerer Folgen nur einmal', async () => {
    const id = freshId();
    await unhideSeriesOnWatch('u1', id, 'Dark');
    await unhideSeriesOnWatch('u1', id, 'Dark');
    await unhideSeriesOnWatch('u1', id, 'Dark');

    expect(mocks.updateWithSeriesVersion).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
  });

  it('schluckt Schreibfehler und lässt einen zweiten Versuch zu', async () => {
    const id = freshId();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateWithSeriesVersion.mockRejectedValueOnce(new Error('offline'));

    await expect(unhideSeriesOnWatch('u1', id, 'Dark')).resolves.toBeUndefined();
    expect(mocks.showToast).not.toHaveBeenCalled();

    await unhideSeriesOnWatch('u1', id, 'Dark');
    expect(mocks.updateWithSeriesVersion).toHaveBeenCalledTimes(2);
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
