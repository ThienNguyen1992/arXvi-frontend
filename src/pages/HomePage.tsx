import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Star, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getUserTopics, getPapers, getFavoritePapers, getFavoriteArxivIds, getHistoryPapers, addFavoritePaper, removeFavoritePaper } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { PaperImage } from '@/components/PaperCoverImage';
import type { Category } from '@/store/useCategoryStore';
import {
  CATEGORY_TAG_TEXT_COLOR,
  buildTopicTagStyleMap,
  pickUniqueTagStyle,
  type CategoryTag,
} from '@/lib/category-tags';
import { formatDocumentTitle } from '@/lib/document-title';
import { extractArxivId, extractPaperIds, getPaperRouteId } from '@/lib/paper';
import { toast } from '@/store/useToastStore';

function buildTopicMaps(categories: Category[]) {
  const topicByCode = new Map<string, string>();
  const topicCodes: string[] = [];

  for (const category of categories) {
    for (const topic of category.topics ?? []) {
      topicByCode.set(topic.code, topic.title);
      topicCodes.push(topic.code);
    }
  }

  const styleByTopicCode = buildTopicTagStyleMap(topicCodes);

  return { topicByCode, styleByTopicCode };
}

function resolveTopicLabel(code: string, maps: ReturnType<typeof buildTopicMaps>) {
  return maps.topicByCode.get(code) ?? code;
}

function resolvePaperTopicTags(
  paper: Record<string, unknown>,
  maps: ReturnType<typeof buildTopicMaps>
): CategoryTag[] {
  // API search returns topic codes under `categories`
  const raw =
    paper.categories ??
    paper.topics ??
    paper.topic_codes ??
    paper.tags ??
    (paper.paper as Record<string, unknown> | undefined)?.categories ??
    (paper.paper as Record<string, unknown> | undefined)?.topics;

  if (!raw) return [];

  const items = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<string>();
  const usedBackgrounds = new Set<string>();
  const tags: CategoryTag[] = [];

  const addTag = (code: string, label: string) => {
    if (!label || seen.has(label)) return;
    seen.add(label);

    const style = pickUniqueTagStyle(
      maps.styleByTopicCode.get(code),
      usedBackgrounds,
      maps.styleByTopicCode.size + tags.length
    );
    usedBackgrounds.add(style.background);

    tags.push({
      label,
      background: style.background,
      borderColor: style.borderColor,
    });
  };

  for (const item of items) {
    if (typeof item === 'string') {
      addTag(item, resolveTopicLabel(item, maps));
      continue;
    }

    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const code = typeof obj.code === 'string' ? obj.code : '';
      const label =
        typeof obj.title === 'string'
          ? obj.title
          : code
            ? resolveTopicLabel(code, maps)
            : '';

      if (label) {
        addTag(code || label, label);
      }
    }
  }

  return tags.slice(0, 3);
}

function resolveIsFavorited(
  paper: Record<string, unknown>,
  knownFavoriteArxivIds: Set<string>,
  localFavorites: Record<string, boolean>,
  onFavoritesTab: boolean
) {
  const ids = extractPaperIds(paper);
  const arxivId = extractArxivId(paper);

  for (const id of ids) {
    if (localFavorites[id] !== undefined) {
      return localFavorites[id];
    }
  }

  if (onFavoritesTab) return true;
  if (arxivId && knownFavoriteArxivIds.has(arxivId)) return true;

  return false;
}

const HOME_LIST_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: false,
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  let activeTabState: 'feed' | 'favorites' | 'history' = 'feed';
  if (location.pathname === '/favorites') activeTabState = 'favorites';
  else if (location.pathname === '/history') activeTabState = 'history';

  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeTabState === 'favorites') document.title = formatDocumentTitle("Favorites");
    else if (activeTabState === 'history') document.title = formatDocumentTitle("History");
    else document.title = formatDocumentTitle("Home");
  }, [activeTabState]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['papers'] });
      queryClient.removeQueries({ queryKey: ['categories'] });
    };
  }, [queryClient]);

  // Search state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTags, setActiveTags] = useState({ title: false, author: false });

  const observerTarget = useRef<HTMLDivElement>(null);

  const activeTab = activeTabState;

  // 1. Fetch user topics for Feed
  const { data: userTopicsResponse } = useQuery({
    queryKey: ['userTopics'],
    queryFn: getUserTopics,
    ...HOME_LIST_QUERY_OPTIONS,
  });

  const userTopics = Array.isArray(userTopicsResponse) 
    ? userTopicsResponse 
    : (Array.isArray(userTopicsResponse?.topics) ? userTopicsResponse.topics : []);
  
  const userTopicCodes = userTopics
    .map((t: any) => typeof t === 'string' ? t : (t.code || ''))
    .filter(Boolean);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    ...HOME_LIST_QUERY_OPTIONS,
  });

  const topicMaps = React.useMemo(() => {
    const categories = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : (categoriesResponse?.data ?? []);
    return buildTopicMaps(categories as Category[]);
  }, [categoriesResponse]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 2. Fetch papers (infinite query for Feed)
  const {
    data: feedData,
    fetchNextPage: fetchNextFeed,
    hasNextPage: hasNextFeed,
    isFetchingNextPage: isFetchingNextFeed,
    status: feedStatus,
  } = useInfiniteQuery({
    queryKey: ['papers', 'feed', userTopicCodes, debouncedSearch, activeTags],
    queryFn: ({ pageParam = 1 }) => {
      // Determine search params
      const { title, author } = activeTags;
      const searchBoth = (title && author) || (!title && !author);
      
      return getPapers({ 
        topicCodes: userTopicCodes, 
        page: pageParam as number, 
        limit: 20,
        q: searchBoth ? debouncedSearch : undefined,
        title: (!searchBoth && title) ? debouncedSearch : undefined,
        author: (!searchBoth && author) ? debouncedSearch : undefined,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage) ? lastPage : (lastPage?.data || []);
      return items.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === 'feed',
    ...HOME_LIST_QUERY_OPTIONS,
  });

  // 3. Fetch favorite papers (infinite query for Favorites)
  const {
    data: favData,
    fetchNextPage: fetchNextFav,
    hasNextPage: hasNextFav,
    isFetchingNextPage: isFetchingNextFav,
    status: favStatus,
  } = useInfiniteQuery({
    queryKey: ['papers', 'favorites'],
    queryFn: ({ pageParam = 1 }) => getFavoritePapers({ page: pageParam as number, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage) ? lastPage : (lastPage?.data || []);
      return items.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTabState === 'favorites',
    ...HOME_LIST_QUERY_OPTIONS,
  });

  // 4. Fetch history papers (infinite query for History)
  const {
    data: historyData,
    fetchNextPage: fetchNextHistory,
    hasNextPage: hasNextHistory,
    isFetchingNextPage: isFetchingNextHistory,
    status: historyStatus,
  } = useInfiniteQuery({
    queryKey: ['papers', 'history'],
    queryFn: ({ pageParam = 1 }) => getHistoryPapers({ page: pageParam as number, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage) ? lastPage : (lastPage?.data || []);
      return items.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTabState === 'history',
    ...HOME_LIST_QUERY_OPTIONS,
  });

  // 5. Load /users/me/favorites on Feed to map arxiv_id → yellow star
  const { data: favoriteArxivIds = [] } = useQuery({
    queryKey: ['papers', 'favoriteArxivIds'],
    queryFn: getFavoriteArxivIds,
    enabled: activeTabState === 'feed',
    ...HOME_LIST_QUERY_OPTIONS,
  });

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTabState === 'feed' && hasNextFeed && !isFetchingNextFeed) {
            fetchNextFeed();
          } else if (activeTabState === 'favorites' && hasNextFav && !isFetchingNextFav) {
            fetchNextFav();
          } else if (activeTabState === 'history' && hasNextHistory && !isFetchingNextHistory) {
            fetchNextHistory();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [activeTabState, hasNextFeed, isFetchingNextFeed, fetchNextFeed, hasNextFav, isFetchingNextFav, fetchNextFav, hasNextHistory, isFetchingNextHistory, fetchNextHistory]);

  const knownFavoriteArxivIds = React.useMemo(
    () => new Set(favoriteArxivIds),
    [favoriteArxivIds]
  );

  const pendingFavoriteKeysRef = useRef(new Set<string>());

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      favoriteKey,
      isFavorited,
    }: {
      favoriteKey: string;
      isFavorited: boolean;
      relatedIds: string[];
    }) => {
      if (isFavorited) {
        return removeFavoritePaper(favoriteKey);
      }
      return addFavoritePaper(favoriteKey);
    },
    onMutate: async ({ isFavorited, relatedIds, favoriteKey }) => {
      const targetIds = relatedIds.length > 0 ? relatedIds : [favoriteKey];

      await queryClient.cancelQueries({ queryKey: ['papers', 'favoriteArxivIds'] });
      await queryClient.cancelQueries({ queryKey: ['papers', 'favorites'] });

      const previousArxivIds = queryClient.getQueryData<string[]>(['papers', 'favoriteArxivIds']);

      if (activeTabState === 'feed') {
        queryClient.setQueryData<string[]>(['papers', 'favoriteArxivIds'], (old) => {
          const ids = old ?? [];
          if (isFavorited) {
            return ids.filter((id) => !targetIds.includes(id));
          }
          return [...new Set([...targetIds, ...ids])];
        });
      }

      setLocalFavorites((prev) => {
        const next = { ...prev };
        const nextValue = !isFavorited;
        targetIds.forEach((id) => {
          next[id] = nextValue;
        });
        return next;
      });

      return { previousArxivIds };
    },
    onError: (_error, { isFavorited, relatedIds, favoriteKey }, context) => {
      if (context?.previousArxivIds !== undefined) {
        queryClient.setQueryData(['papers', 'favoriteArxivIds'], context.previousArxivIds);
      }
      const targetIds = relatedIds.length > 0 ? relatedIds : [favoriteKey];
      setLocalFavorites((prev) => {
        const next = { ...prev };
        targetIds.forEach((id) => {
          next[id] = isFavorited;
        });
        return next;
      });
      toast.error('Failed to update favorites');
    },
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    },
    onSettled: (_data, _error, { favoriteKey }) => {
      pendingFavoriteKeysRef.current.delete(favoriteKey);
      queryClient.invalidateQueries({ queryKey: ['papers', 'favoriteArxivIds'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['papers', 'favorites'], refetchType: 'none' });
    },
  });

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = (text || "").trim().split(/\s+/).length;
    const readTime = Math.ceil(words / wordsPerMinute);
    return readTime > 0 ? readTime : 1;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  let activeData = feedData;
  let activeStatus = feedStatus;
  let isFetchingNext = isFetchingNextFeed;
  let hasNext = hasNextFeed;

  if (activeTabState === 'favorites') {
    activeData = favData; activeStatus = favStatus; isFetchingNext = isFetchingNextFav; hasNext = hasNextFav;
  } else if (activeTabState === 'history') {
    activeData = historyData; activeStatus = historyStatus; isFetchingNext = isFetchingNextHistory; hasNext = hasNextHistory;
  }
  
  const allPapers = activeData?.pages.flatMap((page) => Array.isArray(page) ? page : (page?.data || [])) || [];

  return (
    <div className="-mx-8 px-4 animate-in fade-in duration-500">
      {/* Search Bar for Feed */}
            {activeTabState === 'feed' && (
              <div className="mb-8 glass-card rounded-2xl overflow-hidden shadow-card focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <div className="flex items-center px-5 py-4 border-b border-border/50">
                  <Search size={22} className="text-muted-foreground shrink-0 mr-4" />
                  <input 
                    type="text" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search posts by title or author..."
                    className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                  />
                </div>
                <div className="px-5 py-3 bg-muted/30 flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Tags:</span>
                  <button 
                    onClick={() => setActiveTags(prev => ({ ...prev, title: !prev.title }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      activeTags.title
                        ? 'bg-primary/20 border-primary text-primary shadow-sm' 
                        : 'bg-background border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    # Title
                  </button>
                  <button 
                    onClick={() => setActiveTags(prev => ({ ...prev, author: !prev.author }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      activeTags.author
                        ? 'bg-primary/20 border-primary text-primary shadow-sm' 
                        : 'bg-background border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    # Author
                  </button>
                </div>
              </div>
            )}

            <h1 className="text-3xl font-bold mb-8 tracking-tight">
              {activeTabState === 'feed' ? 'Your Daily Feed' : (activeTabState === 'favorites' ? 'Your Favorites' : 'Your History')}
            </h1>
            
            {activeStatus === 'pending' ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size={48} className="text-primary" />
              </div>
            ) : activeStatus === 'error' ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center">
                Failed to load content. Please try again.
              </div>
            ) : allPapers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground surface-card rounded-xl">
                <p className="text-lg mb-2">No papers found.</p>
                {activeTabState === 'favorites' && <p className="text-sm">You haven't added any favorites yet.</p>}
                {activeTabState === 'history' && <p className="text-sm">Your reading history is empty.</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allPapers.map((item: any, index: number) => {
                    const paper = item.paper || item;
                    const routeId = getPaperRouteId(paper);
                    const arxivId = extractArxivId(paper) || routeId;
                    
                    const title = paper.title || paper.name || 'Untitled Paper';
                    const description = paper.abstract || paper.summary || paper.description || '';
                    const topicTags = resolvePaperTopicTags(paper, topicMaps);
                    const date = formatDate(paper.published_at || paper.created_at || paper.date);
                    const readTime = calculateReadTime(description);
                    const paperIds = extractPaperIds(paper);
                    const favoriteKey = arxivId || paperIds[0] || "";
                    const isFavorited = resolveIsFavorited(
                      paper,
                      knownFavoriteArxivIds,
                      localFavorites,
                      activeTabState === "favorites"
                    );
                    
                    return (
                      <div 
                        key={`${activeTabState}-${routeId || arxivId}-${index}`} 
                        onClick={() => {
                          if (!routeId) return;
                          navigate(`/paper/${routeId}`);
                        }}
                        className="surface-card rounded-xl transition-all hover:shadow-glow hover:border-primary/40 flex flex-col overflow-hidden group cursor-pointer"
                      >
                        {/* Image container */}
                        <div className="relative w-full h-28 overflow-hidden bg-muted">
                          <PaperImage
                            paper={paper}
                            alt={title}
                            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!favoriteKey || pendingFavoriteKeysRef.current.has(favoriteKey)) return;
                              pendingFavoriteKeysRef.current.add(favoriteKey);
                              toggleFavoriteMutation.mutate({
                                favoriteKey,
                                isFavorited,
                                relatedIds: paperIds.length > 0 ? paperIds : [favoriteKey],
                              });
                            }}
                            className="absolute top-2 right-2 z-10 cursor-pointer rounded-full border border-border bg-background/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                          >
                            <Star
                              size={16}
                              className={
                                isFavorited
                                  ? "fill-favorite text-favorite"
                                  : "text-muted-foreground"
                              }
                            />
                          </button>
                        </div>

                        <div className="p-3 flex flex-col flex-1">
                          {/* Title */}
                          <h3 className="text-sm font-semibold mb-1.5 line-clamp-2 leading-snug">
                            {title}
                          </h3>
                          
                          {topicTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {topicTags.map((tag) => (
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

                          {/* Date & Read Time */}
                          <div className="flex items-center text-[11px] font-medium text-muted-foreground mb-2">
                            <span>{date}</span>
                            <span className="mx-2">•</span>
                            <span>{readTime} min read</span>
                          </div>
                          
                          {/* Author & Read More */}
                          <div className="mt-auto pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                            <div className="flex items-center min-w-0">
                              <span className="text-xs font-medium text-foreground line-clamp-1">
                                {paper.authors ? (Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors) : "Unknown Author"}
                              </span>
                            </div>
                            <a 
                              href={routeId ? `/paper/${routeId}` : "#"}
                              onClick={(e) => {
                                e.preventDefault();
                                if (routeId) navigate(`/paper/${routeId}`);
                              }}
                              className="shrink-0 text-xs font-bold text-chart-3 underline-offset-2 transition-colors hover:text-primary hover:underline"
                            >
                              Read more
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lazy load trigger element */}
                <div ref={observerTarget} className="w-full py-4 flex justify-center items-center">
                  {isFetchingNext && (
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading more...
                    </div>
                  )}
                  {!hasNext && allPapers.length > 0 && (
                    <p className="text-muted-foreground text-sm">You have reached the end of this list.</p>
                  )}
                </div>
              </div>
            )}
    </div>
  );
};

export default HomePage;
