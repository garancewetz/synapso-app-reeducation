import { describe, it, expect, vi } from 'vitest';

const destroy = vi.fn().mockResolvedValue({ result: 'ok' });
vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), uploader: { destroy } },
}));

const { isOwnedMedia, deleteCloudinaryMedia, getUserMediaPrefix } = await import(
  '@/app/utils/cloudinary.utils'
);

describe('isOwnedMedia', () => {
  it('accepts media under the user prefix', () => {
    expect(isOwnedMedia(`${getUserMediaPrefix(7)}abc`, 7)).toBe(true);
  });

  it('rejects media of another user, including prefix look-alikes', () => {
    expect(isOwnedMedia('users/8/abc', 7)).toBe(false);
    expect(isOwnedMedia('users/70/abc', 7)).toBe(false);
    expect(isOwnedMedia('users/7/../8/abc', 7)).toBe(false);
  });

  it('rejects legacy media without owner', () => {
    expect(isOwnedMedia('exercices/abc', 7)).toBe(false);
  });
});

describe('deleteCloudinaryMedia', () => {
  it('only calls Cloudinary for owned media', async () => {
    await deleteCloudinaryMedia('users/8/abc', 7);
    expect(destroy).not.toHaveBeenCalled();

    await deleteCloudinaryMedia('users/7/abc', 7);
    expect(destroy).toHaveBeenCalledWith('users/7/abc', { resource_type: 'image' });
  });
});
