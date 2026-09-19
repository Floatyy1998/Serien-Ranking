import { beforeEach, describe, expect, it, vi } from 'vitest';

const prepared = vi.hoisted(() => ({
  value: {
    blob: new Blob(['x']),
    width: 10,
    height: 10,
    isGif: false,
    contentType: 'image/webp',
  } as { blob: Blob; width: number; height: number; isGif: boolean; contentType: string },
}));

const storage = vi.hoisted(() => ({
  paths: [] as string[],
  puts: [] as unknown[],
}));

vi.mock('../../lib/image/imageCompress', () => ({
  prepareImageForUpload: vi.fn(async () => prepared.value),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    storage: () => ({
      ref: (path: string) => {
        storage.paths.push(path);
        return {
          put: async (blob: Blob, meta: unknown) => storage.puts.push({ blob, meta }),
          getDownloadURL: async () => `https://store/${encodeURIComponent(path)}?alt=media`,
        };
      },
    }),
  },
}));
vi.mock('firebase/compat/storage', () => ({}));

import { uploadDiscussionImage } from './discussionImages';

beforeEach(() => {
  storage.paths = [];
  storage.puts = [];
  prepared.value = {
    blob: new Blob(['x']),
    width: 10,
    height: 10,
    isGif: false,
    contentType: 'image/webp',
  };
});

describe('uploadDiscussionImage', () => {
  it('legt unter dem eigenen Nutzerordner ab und gibt die URL zurück', async () => {
    const url = await uploadDiscussionImage('u1', new File(['x'], 'a.png', { type: 'image/png' }));
    expect(storage.paths[0]).toMatch(/^discussions\/u1\/\d+_[a-z0-9]+\.webp$/);
    expect(url).toContain('https://store/');
  });

  it('behält GIFs samt Endung und Typ', async () => {
    prepared.value = {
      blob: new Blob(['g']),
      width: 10,
      height: 10,
      isGif: true,
      contentType: 'image/gif',
    };
    await uploadDiscussionImage('u1', new File(['g'], 'a.gif', { type: 'image/gif' }));
    expect(storage.paths[0]).toMatch(/\.gif$/);
    expect(storage.puts[0]).toMatchObject({ meta: { contentType: 'image/gif' } });
  });
});
