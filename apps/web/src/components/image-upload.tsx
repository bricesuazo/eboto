import { ImagePlus, ReplaceIcon, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { Spinner } from './ui/spinner';

const ACCEPT = 'image/png,image/jpeg,image/webp';

interface ImageUploadProps {
  /** URL to render in the preview area (existing image or local blob). */
  previewUrl: string | null;
  /** Called when the user picks a new file or clears the selection. */
  onPick: (file: File | null) => void;
  /** Validation error from the hook, surfaced as a toast. */
  error?: string | null;
  /** True while the picked file is being resized/encoded. */
  processing?: boolean;
  shape?: 'circle' | 'square';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  previewUrl,
  onPick,
  error,
  processing,
  shape = 'circle',
  label,
  className,
  disabled,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex size-24 shrink-0 items-center justify-center overflow-hidden border bg-muted',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onPick(file);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
          <div className='flex items-center gap-2'>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled ?? processing}
              onClick={() => fileRef.current?.click()}
            >
              {processing
                ? <><Spinner className="mr-1 size-4" /> Processing...</>
                : <> <ReplaceIcon className="mr-1 size-4" /> {previewUrl ? 'Replace' : 'Upload'} image</>
              }
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled ?? processing}
                onClick={() => onPick(null)}
                className="text-muted-foreground"
              >
                <Trash2 className="mr-1 size-4" />
                Remove
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            PNG, JPG, or WebP. Up to 5MB. Resized to 800px and saved as WebP on
            submit.
          </span>
        </div>
      </div>
    </div>
  );
}
