import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperById, addHistoryPaper, getCategories, getSimilarPapers, getYouMightLikePapers } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  extractArxivId,
  extractPaperTopicCodes,
  getPaperRouteId,
  isValidPaperId,
  parsePaperListResponse,
} from '@/lib/paper';
import {
  CATEGORY_TAG_TEXT_COLOR,
  buildTopicTagStyleMap,
  pickUniqueTagStyle,
  type CategoryTag,
  type CategoryTagStyle,
} from '@/lib/category-tags';

function resolveTopicLabel(code: string, categoriesList: Array<{ code?: string; title?: string; topics?: Array<{ code: string; title: string }> }>) {
  for (const cat of categoriesList) {
    if (cat.topics) {
      const found = cat.topics.find((t) => t.code === code);
      if (found) return found.title;
    }
  }
  const parts = code.split('.');
  return parts.length > 1 ? parts[1] : code;
}

function resolveRecDateInfo(
  rec: Record<string, unknown>,
  recPaper: Record<string, unknown>
): { label: "Published" | "Created"; value: string } | null {
  const publishedAt = rec.published_at ?? recPaper.published_at ?? rec.date ?? recPaper.date;
  if (publishedAt) {
    return { label: "Published", value: String(publishedAt) };
  }

  const createdAt = rec.created_at ?? recPaper.created_at;
  if (createdAt) {
    return { label: "Created", value: String(createdAt) };
  }

  return null;
}

function formatRecDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function buildRecTopicTags(
  recPaper: Record<string, unknown>,
  categoriesList: Array<{ code?: string; title?: string; topics?: Array<{ code: string; title: string }> }>,
  styleByTopicCode: Map<string, CategoryTagStyle>
): CategoryTag[] {
  const codes = extractPaperTopicCodes(recPaper).slice(0, 3);
  const usedBackgrounds = new Set<string>();
  const tags: CategoryTag[] = [];

  for (const code of codes) {
    const label = resolveTopicLabel(code, categoriesList);
    const style = pickUniqueTagStyle(
      styleByTopicCode.get(code),
      usedBackgrounds,
      styleByTopicCode.size + tags.length
    );
    usedBackgrounds.add(style.background);
    tags.push({ label, background: style.background, borderColor: style.borderColor });
  }

  return tags;
}

function buildTagStyleMapFromPapers(papers: unknown[]) {
  const codes: string[] = [];
  for (const rec of papers) {
    const recPaper = ((rec as { paper?: unknown }).paper || rec) as Record<string, unknown>;
    codes.push(...extractPaperTopicCodes(recPaper));
  }
  return buildTopicTagStyleMap([...new Set(codes)]);
}

type CategoriesList = Array<{
  code?: string;
  title?: string;
  topics?: Array<{ code: string; title: string }>;
}>;

function PaperRecommendationCard({
  rec,
  idx,
  categoriesList,
  tagStyleMap,
  onNavigate,
  className,
}: {
  rec: unknown;
  idx: number;
  categoriesList: CategoriesList;
  tagStyleMap: Map<string, CategoryTagStyle>;
  onNavigate: (routeId: string) => void;
  className?: string;
}) {
  const recPaper = ((rec as { paper?: unknown }).paper || rec) as Record<string, unknown>;
  const routeId = getPaperRouteId(recPaper);
  const recTitle = (recPaper.title as string) || (rec as { title?: string }).title || 'Untitled';
  const recAuthorsRaw = recPaper.authors || (rec as { authors?: unknown }).authors;
  const recAuthorsText = Array.isArray(recAuthorsRaw)
    ? recAuthorsRaw.join(', ')
    : recAuthorsRaw
      ? String(recAuthorsRaw)
      : '';
  const recDateInfo = resolveRecDateInfo(rec as Record<string, unknown>, recPaper);
  const recTopicTags = buildRecTopicTags(recPaper, categoriesList, tagStyleMap);

  return (
    <div
      onClick={() => routeId && onNavigate(routeId)}
      className={cn(
        'group flex flex-col bg-card border border-border hover:border-primary/50 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden',
        className
      )}
    >
      <div className="h-28 w-full bg-muted/50 overflow-hidden relative border-b border-border/50">
        <img
          src={`https://picsum.photos/seed/${routeId || idx}/400/200`}
          alt="Cover Placeholder"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="font-bold text-foreground text-xs line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {recTitle}
        </h3>
        {recTopicTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recTopicTags.map((tag) => (
              <span
                key={tag.label}
                title={tag.label}
                className="inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[10px] font-medium leading-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                style={{
                  background: tag.background,
                  borderColor: tag.borderColor,
                  color: CATEGORY_TAG_TEXT_COLOR,
                }}
              >
                <span className="truncate">#{tag.label}</span>
              </span>
            ))}
          </div>
        )}
        {recAuthorsText && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{recAuthorsText}</p>
        )}
        {recDateInfo && (
          <p className="text-[10px] text-muted-foreground mt-auto font-medium opacity-80">
            <span className="font-bold uppercase tracking-widest">{recDateInfo.label} day</span>
            <span className="mx-1.5 opacity-50">·</span>
            <span>{formatRecDate(recDateInfo.value)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function RecommendationCards({
  title,
  papers,
  isLoading,
  emptyText,
  categoriesList,
  tagStyleMap,
  onNavigate,
}: {
  title: string;
  papers: unknown[];
  isLoading: boolean;
  emptyText: string;
  categoriesList: CategoriesList;
  tagStyleMap: Map<string, CategoryTagStyle>;
  onNavigate: (routeId: string) => void;
}) {
  return (
    <div className="bg-muted/20 border border-border/50 rounded-3xl p-6 shadow-sm">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">{title}</h2>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={32} className="text-primary" />
        </div>
      ) : papers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {papers.map((rec, idx) => {
            const recPaper = ((rec as { paper?: unknown }).paper || rec) as Record<string, unknown>;
            const routeId = getPaperRouteId(recPaper);
            return (
              <PaperRecommendationCard
                key={routeId || idx}
                rec={rec}
                idx={idx}
                categoriesList={categoriesList}
                tagStyleMap={tagStyleMap}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RelatedPapersCarousel({
  papers,
  isLoading,
  emptyText,
  categoriesList,
  tagStyleMap,
  onNavigate,
}: {
  papers: unknown[];
  isLoading: boolean;
  emptyText: string;
  categoriesList: CategoriesList;
  tagStyleMap: Map<string, CategoryTagStyle>;
  onNavigate: (routeId: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -272 : 272,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mt-10 border-t border-border/50 pt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Related Papers
        </h2>
        {papers.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollBy('left')}
              className="cursor-pointer rounded-full border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Scroll related papers left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy('right')}
              className="cursor-pointer rounded-full border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Scroll related papers right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={32} className="text-primary" />
        </div>
      ) : papers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory"
        >
          {papers.map((rec, idx) => {
            const recPaper = ((rec as { paper?: unknown }).paper || rec) as Record<string, unknown>;
            const routeId = getPaperRouteId(recPaper);
            return (
              <PaperRecommendationCard
                key={routeId || idx}
                rec={rec}
                idx={idx}
                categoriesList={categoriesList}
                tagStyleMap={tagStyleMap}
                onNavigate={onNavigate}
                className="w-64 shrink-0 snap-start"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

const PaperDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const validId = isValidPaperId(id);

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['paper', id],
    queryFn: () => getPaperById(id!),
    enabled: validId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const paperTopicCodes = React.useMemo(
    () => (paper ? extractPaperTopicCodes(paper as Record<string, unknown>) : []),
    [paper]
  );
  const excludeArxivId = paper
    ? extractArxivId(paper as Record<string, unknown>) || id || ""
    : "";

  const similarArxivId = id || excludeArxivId;

  const {
    data: similarData,
    isLoading: isSimilarLoading,
    isError: isSimilarError,
  } = useQuery({
    queryKey: ['similarPapers', similarArxivId],
    queryFn: () => getSimilarPapers(similarArxivId!),
    enabled: isValidPaperId(similarArxivId),
  });

  const { data: recommendedData, isLoading: isRecommendedLoading } = useQuery({
    queryKey: ['youMightLike', excludeArxivId, paperTopicCodes],
    queryFn: () =>
      getYouMightLikePapers({
        paperTopics: paperTopicCodes,
        excludeArxivId,
      }),
    enabled: !!paper && paperTopicCodes.length > 0 && isValidPaperId(excludeArxivId),
  });

  const similarPapers = React.useMemo(() => parsePaperListResponse(similarData), [similarData]);
  const recommendedPapers = React.useMemo(() => parsePaperListResponse(recommendedData), [recommendedData]);
  const similarCount = Number((paper as Record<string, unknown> | undefined)?.similarCount ?? NaN);

  const similarTagStyleMap = React.useMemo(
    () => buildTagStyleMapFromPapers(similarPapers),
    [similarPapers]
  );

  const recTagStyleMap = React.useMemo(
    () => buildTagStyleMapFromPapers(recommendedPapers),
    [recommendedPapers]
  );

  const hasRecordedHistory = React.useRef(false);

  useEffect(() => {
    if (paper?.title) {
      document.title = `${paper.title} | arXvi`;
    } else {
      document.title = "Paper Detail | arXvi";
    }
    return () => {
      document.title = "arXvi"; // Reset title when leaving
    };
  }, [paper?.title]);

  // Track history when viewing paper
  useEffect(() => {
    if (id && !hasRecordedHistory.current) {
      addHistoryPaper(id);
      hasRecordedHistory.current = true;
    }
  }, [id, validId]);

  if (!validId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-destructive font-medium mb-4">Invalid paper link.</p>
        <Button onClick={() => navigate('/home')} className="font-semibold px-8 py-2 rounded-xl">
          Back to Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-destructive font-medium mb-4">Failed to load paper details. It might not exist.</p>
        <Button onClick={() => navigate(-1)} className="font-semibold px-8 py-2 rounded-xl">Go Back</Button>
      </div>
    );
  }

  const title = paper.title || paper.name || 'Untitled Paper';
  const abstract = paper.abstract || paper.summary || '';
  const description =
    typeof paper.description === 'string' ? paper.description.trim() : '';
  const status = paper.status || 'Published';
  
  // Metadata fields
  const formattedDate = paper.published_at || paper.created_at || paper.date 
    ? new Date(paper.published_at || paper.created_at || paper.date).toISOString().split('T')[0]
    : 'Unknown Date';

  const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  const paperCategories = Array.isArray(paper.categories) ? paper.categories : (paper.topics || paper.tags || []);
  
  const categoryNames = paperCategories.map((catCode: any) => {
    if (typeof catCode === 'object') return { category: catCode.title || catCode.code, topic: null, code: catCode.code };
    
    for (const cat of categoriesList) {
      if (cat.code === catCode) {
         return { category: cat.title, topic: null, code: catCode };
      }
      if (cat.topics) {
         const foundTopic = cat.topics.find((t: any) => t.code === catCode);
         if (foundTopic) {
            return { category: cat.title, topic: foundTopic.title, code: catCode };
         }
      }
    }
    
    const parts = catCode.split('.');
    if (parts.length > 1) {
       return { category: parts[0], topic: parts[1], code: catCode };
    }
    return { category: catCode, topic: null, code: catCode };
  });

  // Custom logic to colorize badges based on typical status strings
  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes('publish') || lower.includes('accept')) return 'bg-green-500/10 text-green-500 border-green-500/40';
    if (lower.includes('review') || lower.includes('pending') || lower.includes('submit')) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/40';
    if (lower.includes('withdraw') || lower.includes('reject') || lower.includes('fail')) return 'bg-red-500/10 text-red-500 border-red-500/40';
    if (lower.includes('draft') || lower.includes('new')) return 'bg-blue-500/10 text-blue-500 border-blue-500/40';
    return 'bg-primary/10 text-primary border-primary/40';
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => navigate('/home')}
          className="group flex w-fit items-center gap-2 rounded-full border-2 border-primary/50 bg-primary/5 px-5 py-2 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md hover:shadow-primary/30 mb-8 cursor-pointer"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Feed</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight flex-1">
              {title}
            </h1>
            <span className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider shrink-0 ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          {/* Authors */}
          {paper.authors && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Authors</h3>
              <p className="text-foreground font-medium text-lg">
                {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
              </p>
            </div>
          )}

          {description && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Description</h3>
              <p className="text-foreground/90 text-base leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Abstract */}
          {abstract && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Abstract</h3>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-serif">
                <p className="whitespace-pre-wrap">{abstract}</p>
              </div>
            </div>
          )}

          {/* Categories & Topics */}
          {categoryNames.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Categories & Topics</h3>
              <div className="flex flex-wrap gap-3">
                {categoryNames.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-primary mb-0.5">{item.category}</span>
                    {item.topic && <span className="text-sm font-medium text-foreground">{item.topic}</span>}
                    {!item.topic && <span className="text-sm font-medium text-foreground">{item.code}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Published At</h3>
              <p className="text-foreground font-medium">{formattedDate}</p>
            </div>
            {paper.current_version && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Version</h3>
                <p className="text-foreground font-medium">{paper.current_version}</p>
              </div>
            )}
            {paper.license && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">License</h3>
                <p className="text-foreground font-medium text-sm break-all">{paper.license}</p>
              </div>
            )}
            {(paper.score !== undefined || paper._score !== undefined) && (
              <div className="flex flex-col items-start">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Relevance Score</h3>
                {(() => {
                  const val = Number(paper.score || paper._score);
                  // Determine max scale (10 or 100)
                  const isBase10 = val <= 10;
                  const max = isBase10 ? 10 : 100;
                  const ratio = val / max;
                  
                  let colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
                  if (ratio >= 0.85) colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
                  else if (ratio >= 0.6) colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  else if (ratio >= 0.4) colorClass = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";

                  return (
                    <div className={`flex items-center justify-center px-4 py-2 rounded-xl border-2 font-black text-xl shadow-sm ${colorClass}`}>
                      {val.toFixed(2)}
                      <span className="text-xs font-bold opacity-60 ml-1">/ {max}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {paper.comments && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Comments</h3>
                <p className="text-foreground font-medium text-sm">{paper.comments}</p>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 pt-8 border-t border-border/50">
            {paper.pdf_url && (
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <FileText size={20} />
                View PDF
              </a>
            )}
            
            {paper.doi && (
              <a
                href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-bold hover:bg-accent hover:text-accent-foreground transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <ExternalLink size={20} />
                DOI Link
              </a>
            )}
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-1 sticky top-6 h-fit max-h-[calc(100vh-3rem)] overflow-y-auto pr-2 custom-scrollbar">
          <RecommendationCards
            title="You Might Also Like"
            papers={recommendedPapers}
            isLoading={isRecommendedLoading}
            emptyText="No recommendations available."
            categoriesList={categoriesList}
            tagStyleMap={recTagStyleMap}
            onNavigate={(routeId) => navigate(`/paper/${routeId}`)}
          />
        </div>
        </div>

        <RelatedPapersCarousel
          papers={similarPapers}
          isLoading={isSimilarLoading}
          emptyText={
            isSimilarError
              ? 'Failed to load related papers.'
              : Number.isFinite(similarCount) && similarCount === 0
                ? 'No similar papers indexed for this paper yet.'
                : 'No related papers found.'
          }
          categoriesList={categoriesList}
          tagStyleMap={similarTagStyleMap}
          onNavigate={(routeId) => navigate(`/paper/${routeId}`)}
        />
      </div>
    </div>
  );
};

export default PaperDetailPage;
