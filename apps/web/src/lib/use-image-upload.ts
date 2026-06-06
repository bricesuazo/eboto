import { useMutation } from 'convex/react';
import { useEffect, useState } from 'react';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { compressImage } from './compress-image';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIM = 800;

/**
 * Defers image upload until the form is submitted. Holds the picked `File`
 * in local state with a blob preview URL and only POSTs to Convex storage
 * when the caller invokes `commit()`. This lets us keep storage clean — no
 * orphaned blobs from abandoned forms — and gives the user a chance to
 * cancel out without leaving anything behind.
 *
 * Call this hook once per image input in the form, then pass `previewUrl`
 * + `pick` into the `<ImageUpload />` component. In `onSubmit`, await
 * `commit()` to actually upload (returns the new storage id) and patch the
 * record with the result.
 */
export function useImageUpload(initialUrl?: string | null) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const [file, setFile] = useState<File | null>(null);
  const [cleared, setCleared] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function pick(next: File | null) {
    setError(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    if (!next) {
      setFile(null);
      setBlobUrl(null);
      // only flag as "cleared" if there was an existing image to remove
      setCleared(Boolean(initialUrl));
      return;
    }
    if (!ACCEPTED.includes(next.type)) {
      setError('Use a PNG, JPG, or WebP image.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setError('Image must be 5MB or less.');
      return;
    }
    setProcessing(true);
    try {
      const compressed = await compressImage(next, { maxDim: MAX_DIM });
      setFile(compressed);
      setBlobUrl(URL.createObjectURL(compressed));
      setCleared(false);
    } catch (err) {
      console.error('Image compression failed', err);
      setError('Could not process that image. Try a different file.');
      setFile(null);
      setBlobUrl(null);
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Returns:
   *   - `Id<'_storage'>` when a new file was picked and uploaded
   *   - `null` when the user explicitly removed an existing image
   *   - `undefined` when nothing changed (no patch needed)
   */
  async function commit(): Promise<Id<'_storage'> | null | undefined> {
    if (file) {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { storageId } = (await res.json()) as { storageId: string };
      return storageId as Id<'_storage'>;
    }
    if (cleared) return null;
    return undefined;
  }

  const previewUrl = blobUrl ?? (cleared ? null : (initialUrl ?? null));

  return { file, cleared, previewUrl, error, processing, pick, commit };
}
