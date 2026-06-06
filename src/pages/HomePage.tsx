import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Loader2, Star, ChevronDown, Rss, Heart, Tag, Search, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserTopics, getPapers, getFavoritePapers, getHistoryPapers, addFavoritePaper, removeFavoritePaper } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTabState, setActiveTab] = useState<'feed' | 'favorites' | 'history'>('feed');
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});
  
  // Search state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTags, setActiveTags] = useState({ title: false, author: false });

  const settingsRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const { clearSelection } = useCategoryStore();

  const activeTab = activeTabState;

  // 1. Fetch user topics for Feed and Sidebar
  const { data: userTopicsResponse, isLoading: isLoadingTopics } = useQuery({
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
        });
      });
    }
    return ids;
  }, [favData]);

  // Handle click outside for user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    clearSelection();
    navigate('/login');
  };

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

  const activeData = activeTabState === 'feed' ? feedData : (activeTabState === 'favorites' ? favData : historyData);
  const activeStatus = activeTabState === 'feed' ? feedStatus : (activeTabState === 'favorites' ? favStatus : historyStatus);
  const isFetchingNext = activeTabState === 'feed' ? isFetchingNextFeed : (activeTabState === 'favorites' ? isFetchingNextFav : isFetchingNextHistory);
  const hasNext = activeTabState === 'feed' ? hasNextFeed : (activeTabState === 'favorites' ? hasNextFav : hasNextHistory);
  const allPapers = activeData?.pages.flatMap((page) => Array.isArray(page) ? page : (page?.data || [])) || [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* TOP HEADER */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
            <span className="text-foreground">daily</span>
            <span className="text-primary">.</span>
            <span className="text-foreground">dev</span>
          </div>
        </div>
        
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="flex items-center gap-2 hover:bg-accent p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-border"
          >
            <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold uppercase text-sm">
              U
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-popover text-popover-foreground rounded-xl border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-4 border-b border-border bg-muted/30">
                <p className="font-bold text-sm truncate text-foreground">My Profile</p>
                <p className="text-xs text-muted-foreground truncate mt-1">Logged in user</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { setShowSettings(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
                >
                  <User size={18} className="text-muted-foreground" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive mt-1"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* BODY CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border py-6 px-4 shadow-sm flex flex-col z-10 relative shrink-0">
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Menu Section */}
            <div className="mb-8">
              <h2 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest px-2">Menu</h2>
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => setActiveTab('feed')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'feed' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Rss size={18} />
                    My Feed
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('favorites')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'favorites' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Heart size={18} />
                    Favorites
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      activeTabState === 'history' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Clock size={18} />
                    History
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/manage-topics')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-foreground hover:bg-accent"
                  >
                    <Tag size={18} />
                    Manage Topics
                  </button>
                </li>
              </ul>
            </div>

            <h2 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest px-2">Your Topics</h2>
            <nav className="flex-1 overflow-y-auto pr-2">
              {isLoadingTopics ? (
                <div className="flex justify-center py-4">
                  <Spinner size={24} className="text-primary" />
                </div>
              ) : userTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">No topics followed yet.</p>
              ) : (
                <ul className="space-y-1">
                  {userTopics.map((topic: any, idx: number) => {
                    const label = typeof topic === 'string' ? topic : (topic.title || topic.name || topic.code);
                    const key = typeof topic === 'string' ? topic : (topic.id || topic.code || idx);
                    return (
                      <li key={key}>
                        <div className="text-foreground hover:text-primary-foreground hover:bg-primary transition-colors block px-3 py-2 rounded-lg font-medium text-sm cursor-pointer truncate">
                          {label}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Search Bar for Feed */}
            {activeTabState === 'feed' && (
              <div className="mb-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
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

            <h1 className="text-3xl font-extrabold mb-8 text-foreground tracking-tight">
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
              <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
                <p className="text-lg mb-2">No papers found.</p>
                {activeTabState === 'favorites' && <p className="text-sm">You haven't added any favorites yet.</p>}
                {activeTabState === 'history' && <p className="text-sm">Your reading history is empty.</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allPapers.map((paper: any, index: number) => {
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
                    const isFavoritedAPI = paper.is_favorited === true || activeTabState === 'favorites' || knownFavoriteIds.has(paperId);
                    const isFavorited = localFavorites[paperId] !== undefined ? localFavorites[paperId] : isFavoritedAPI;
                    
                    return (
                      <div 
                        key={`${activeTabState}-${paperId || arxivId}-${index}`} 
                        onClick={() => navigate(`/paper/${paperId}`)}
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
                              if (paperId) {
                                toggleFavoriteMutation.mutate({ id: paperId, isFavorited });
                              }
                            }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-background transition-colors z-10"
                            disabled={toggleFavoriteMutation.isPending && toggleFavoriteMutation.variables?.id === paperId}
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
                              <span key={idx} className="rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-semibold text-secondary">
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
                              href={`/paper/${paperId}`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/paper/${paperId}`);
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
        </main>
      </div>
    </div>
  );
};

export default HomePage;
