import { extractArxivId, getPaperRouteId } from '@/lib/paper';

export const PAPER_COVER_PLACEHOLDER = '/paper-cover-placeholder.svg';

function isValidImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
}

export function getPaperImageUrl(paper: Record<string, unknown>): string | null {
  const nested = paper.paper as Record<string, unknown> | undefined;
  const candidates = [
    paper.image_url,
    paper.imageUrl,
    paper.thumbnail_url,
    paper.thumbnail,
    paper.cover_image,
    paper.coverImage,
    nested?.image_url,
    nested?.imageUrl,
    nested?.thumbnail_url,
    nested?.thumbnail,
    nested?.cover_image,
    nested?.coverImage,
  ];

  for (const candidate of candidates) {
    if (isValidImageUrl(candidate)) return candidate.trim();
  }

  return null;
}

export function getPaperCoverSeed(paper: Record<string, unknown>): string {
  const seed =
    extractArxivId(paper) ||
    getPaperRouteId(paper) ||
    (paper.id != null ? String(paper.id) : '') ||
    (paper.paper_id != null ? String(paper.paper_id) : '');

  return seed || 'paper';
}

export function getRandomPaperCoverUrl(
  paper: Record<string, unknown>,
  width = 600,
  height = 400
): string {
  const seed = encodeURIComponent(getPaperCoverSeed(paper));
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export function resolvePaperCoverSrc(
  paper: Record<string, unknown>,
  width = 600,
  height = 400
): string {
  return getPaperImageUrl(paper) ?? getRandomPaperCoverUrl(paper, width, height);
}
