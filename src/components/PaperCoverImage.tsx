import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getPaperImageUrl,
  getRandomPaperCoverUrl,
  PAPER_COVER_PLACEHOLDER,
} from '@/lib/paper-image';

type PaperImageBaseProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  paper: Record<string, unknown>;
};

/** Fallback cover: random picsum image, then SVG placeholder on error. */
export function PaperCoverImage({
  paper,
  alt,
  className,
  onError,
  ...props
}: PaperImageBaseProps) {
  const fallbackUrl = useMemo(() => getRandomPaperCoverUrl(paper), [paper]);
  const [src, setSrc] = useState(fallbackUrl);

  useEffect(() => {
    setSrc(fallbackUrl);
  }, [fallbackUrl]);

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={cn('bg-muted object-cover', className)}
      loading={props.loading ?? 'lazy'}
      onError={(event) => {
        onError?.(event);
        if (src !== PAPER_COVER_PLACEHOLDER) {
          setSrc(PAPER_COVER_PLACEHOLDER);
        }
      }}
    />
  );
}

/** Prefer API image when available; otherwise use PaperCoverImage as backup. */
export function PaperImage({
  paper,
  alt,
  className,
  onError,
  ...props
}: PaperImageBaseProps) {
  const apiUrl = useMemo(() => getPaperImageUrl(paper), [paper]);
  const [useFallback, setUseFallback] = useState(() => !apiUrl);

  useEffect(() => {
    setUseFallback(!apiUrl);
  }, [apiUrl]);

  if (!useFallback && apiUrl) {
    return (
      <img
        {...props}
        src={apiUrl}
        alt={alt}
        className={cn('bg-muted object-cover', className)}
        loading={props.loading ?? 'lazy'}
        onError={(event) => {
          onError?.(event);
          setUseFallback(true);
        }}
      />
    );
  }

  return (
    <PaperCoverImage
      paper={paper}
      alt={alt}
      className={className}
      onError={onError}
      {...props}
    />
  );
}
