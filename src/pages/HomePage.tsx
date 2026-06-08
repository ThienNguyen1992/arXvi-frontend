import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Star, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserTopics, getPapers, getFavoritePapers, getHistoryPapers, addFavoritePaper, removeFavoritePaper, getDuplicatePapers } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  let activeTabState: 'feed' | 'favorites' | 'history' | 'duplicates' = 'feed';
  if (location.pathname === '/favorites') activeTabState = 'favorites';
  else if (location.pathname === '/history') activeTabState = 'history';
  else if (location.pathname === '/duplicates') activeTabState = 'duplicates';

  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (activeTabState === 'favorites') document.title = "Favorites | arXvi";
    else if (activeTabState === 'history') document.title = "History | arXvi";
    else if (activeTabState === 'duplicates') document.title = "Duplicate Papers | arXvi";
    else document.title = "Home | arXvi";
  }, [activeTabState]);

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
    staleTime: 5 * 60 * 1000, // Prevent over-fetching
  });

  const userTopics = Array.isArray(userTopicsResponse) 
    ? userTopicsResponse 
    : (Array.isArray(userTopicsResponse?.topics) ? userTopicsResponse.topics : []);
  
  const userTopicCodes = userTopics
    .map((t: any) => typeof t === 'string' ? t : (t.code || ''))
    .filter(Boolean);

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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });

  // 4b. Fetch duplicate papers (infinite query for Duplicates)
  const {
    data: duplicatesData,
    fetchNextPage: fetchNextDuplicates,
    hasNextPage: hasNextDuplicates,
    isFetchingNextPage: isFetchingNextDuplicates,
    status: duplicatesStatus,
  } = useInfiniteQuery({
    queryKey: ['papers', 'duplicates', debouncedSearch],
    queryFn: ({ pageParam = 1 }) => getDuplicatePapers({ 
      parentId: debouncedSearch || undefined, 
      page: pageParam as number, 
      limit: 20 
    }),
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage) ? lastPage : (lastPage?.data || []);
      return items.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTabState === 'duplicates',
    staleTime: 5 * 60 * 1000,
  });

  // 5. Fetch all favorites for global mapping
  const { data: allFavoritesData } = useQuery({
    queryKey: ['papers', 'allFavorites'],
    queryFn: () => getFavoritePapers({ page: 1, limit: 1000 }),
    staleTime: 5 * 60 * 1000,
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
          } else if (activeTabState === 'duplicates' && hasNextDuplicates && !isFetchingNextDuplicates) {
            fetchNextDuplicates();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [activeTabState, hasNextFeed, isFetchingNextFeed, fetchNextFeed, hasNextFav, isFetchingNextFav, fetchNextFav, hasNextHistory, isFetchingNextHistory, fetchNextHistory, hasNextDuplicates, isFetchingNextDuplicates, fetchNextDuplicates]);

  // Extract known favorites from favData to sync with Feed
  const knownFavoriteIds = React.useMemo(() => {
    const ids = new Set<string>();
    
    if (favData) {
      favData.pages.forEach(page => {
        const items = Array.isArray(page) ? page : (page?.data || []);
        items.forEach((p: any) => {
          if (p.id) ids.add(p.id);
          if (p.paper_id) ids.add(p.paper_id);
          if (p.paper?.id) ids.add(p.paper.id);
          if (p.arxiv_id) ids.add(p.arxiv_id);
          if (p.paper?.arxiv_id) ids.add(p.paper.arxiv_id);
        });
      });
    }

    if (allFavoritesData) {
      const items = Array.isArray(allFavoritesData) ? allFavoritesData : (allFavoritesData.data || []);
      items.forEach((p: any) => {
        if (p.id) ids.add(p.id);
        if (p.paper_id) ids.add(p.paper_id);
        if (p.paper?.id) ids.add(p.paper.id);
        if (p.arxiv_id) ids.add(p.arxiv_id);
        if (p.paper?.arxiv_id) ids.add(p.paper.arxiv_id);
      });
    }

    return ids;
  }, [favData, allFavoritesData]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorited }: { id: string, isFavorited: boolean }) => {
      if (isFavorited) {
        return removeFavoritePaper(id);
      } else {
        return addFavoritePaper(id);
      }
    },
    onMutate: async ({ id, isFavorited }) => {
      // Optimistic update
      setLocalFavorites(prev => ({ ...prev, [id]: !isFavorited }));
    },
    onSettled: () => {
      // Background refetch favorites list to stay in sync
      queryClient.invalidateQueries({ queryKey: ['papers', 'favorites'] });
    }
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
  } else if (activeTabState === 'duplicates') {
    activeData = duplicatesData; activeStatus = duplicatesStatus; isFetchingNext = isFetchingNextDuplicates; hasNext = hasNextDuplicates;
  }
  
  const allPapers = activeData?.pages.flatMap((page) => Array.isArray(page) ? page : (page?.data || [])) || [];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Search Bar for Feed & Duplicates */}
            {(activeTabState === 'feed' || activeTabState === 'duplicates') && (
              <div className="mb-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <div className="flex items-center px-5 py-4 border-b border-border/50">
                  <Search size={22} className="text-muted-foreground shrink-0 mr-4" />
                  <input 
                    type="text" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={activeTabState === 'duplicates' ? "Search duplicates by arXiv ID..." : "Search posts by title or author..."}
                    className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                  />
                </div>
                {activeTabState !== 'duplicates' && (
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
                )}
              </div>
            )}

            <h1 className="text-3xl font-extrabold mb-8 text-foreground tracking-tight">
              {activeTabState === 'feed' ? 'Your Daily Feed' : (activeTabState === 'favorites' ? 'Your Favorites' : (activeTabState === 'history' ? 'Your History' : 'Duplicate Papers'))}
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
              <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
                <p className="text-lg mb-2">No papers found.</p>
                {activeTabState === 'favorites' && <p className="text-sm">You haven't added any favorites yet.</p>}
                {activeTabState === 'history' && <p className="text-sm">Your reading history is empty.</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allPapers.map((item: any, index: number) => {
                    const paper = item.paper || item;
                    // Distinguish between backend UUID and arxiv_id
                    const paperId = paper.id;
                    const arxivId = paper.arxiv_id || paper.id || `paper-${index}`;
                    
                    const title = paper.title || paper.name || 'Untitled Paper';
                    const description = paper.abstract || paper.summary || paper.description || '';
                    const tags = paper.topics || paper.tags || ['Tech'];
                    const date = formatDate(paper.published_at || paper.created_at || paper.date);
                    const readTime = calculateReadTime(description);
                    const imageUrl = paper.image_url || `https://picsum.photos/seed/${arxivId}/600/400`;
                    
                    // Determine favorite state: Local state takes priority. If not in local state, use API field (if provided), or default for favorites tab.
                    const isFavoritedAPI = paper.is_favorited === true || activeTabState === 'favorites' || knownFavoriteIds.has(arxivId) || knownFavoriteIds.has(paperId);
                    const isFavorited = localFavorites[arxivId] !== undefined ? localFavorites[arxivId] : isFavoritedAPI;
                    
                    return (
                      <div 
                        key={`${activeTabState}-${paperId || arxivId}-${index}`} 
                        onClick={() => navigate(`/paper/${arxivId}`)}
                        className="bg-card border border-border rounded-xl shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col overflow-hidden group cursor-pointer"
                      >
                        {/* Image container */}
                        <div className="relative w-full h-40 overflow-hidden bg-muted">
                          <img 
                            src={imageUrl} 
                            alt={title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (arxivId) {
                                toggleFavoriteMutation.mutate({ id: arxivId, isFavorited });
                              }
                            }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-background transition-colors z-10 cursor-pointer disabled:cursor-not-allowed"
                            disabled={toggleFavoriteMutation.isPending && toggleFavoriteMutation.variables?.id === arxivId}
                          >
                            <Star size={18} className={isFavorited ? "fill-primary text-primary" : "text-muted-foreground"} />
                          </button>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                          {/* Title */}
                          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 leading-tight">
                            {title}
                          </h3>
                          
                          {/* Tags / Code */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(Array.isArray(tags) ? tags.slice(0, 3) : [tags]).map((tag: any, idx: number) => (
                              <span key={idx} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                                #{typeof tag === 'object' ? tag.code || tag.title : tag}
                              </span>
                            ))}
                          </div>

                          {/* Date & Read Time */}
                          <div className="flex items-center text-xs font-medium text-muted-foreground mb-4">
                            <span>{date}</span>
                            <span className="mx-2">•</span>
                            <span>{readTime} min read</span>
                          </div>
                          
                          {/* Author & Read More */}
                          <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                              <span className="text-sm font-medium text-foreground line-clamp-1">
                                {paper.authors ? (Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors) : "Unknown Author"}
                              </span>
                            </div>
                            <a 
                              href={`/paper/${arxivId}`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/paper/${arxivId}`);
                              }}
                              className="shrink-0 text-primary hover:text-primary/80 font-bold text-sm transition-colors ml-4"
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
                <div ref={observerTarget} className="w-full py-8 flex justify-center items-center">
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
