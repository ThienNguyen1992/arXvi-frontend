import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, ChevronDown, Rss, Heart, Tag, Clock, BarChart2, Menu } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserTopics, logout, clearAuthSession } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { useCategoryStore } from '@/store/useCategoryStore';
import { cn } from '@/lib/utils';
import NotificationButton from '@/components/NotificationButton';
import { AppBrand } from '@/components/AppBrand';
import { ThemeToggle } from '@/components/ThemeToggle';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const clearSelection = useCategoryStore((state) => state.clearSelection);
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  let activeTabState: 'feed' | 'favorites' | 'history' | 'leaderboard' = 'feed';
  if (location.pathname === '/favorites') activeTabState = 'favorites';
  else if (location.pathname === '/history') activeTabState = 'history';
  else if (location.pathname === '/leaderboard') activeTabState = 'leaderboard';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setShowSettings(false);

    try {
      await logout();
    } catch {
      clearAuthSession();
    } finally {
      clearSelection();
      queryClient.clear();
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  // Fetch user topics for Sidebar
  const { data: userTopicsResponse, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['userTopics'],
    queryFn: getUserTopics,
    staleTime: 5 * 60 * 1000,
  });

  const userTopics = Array.isArray(userTopicsResponse) 
    ? userTopicsResponse 
    : (Array.isArray(userTopicsResponse?.topics) ? userTopicsResponse.topics : []);

  const handleNav = (path: string) => {
    navigate(path);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  const navItemClass = (active: boolean) =>
    cn('nav-item', active && 'nav-item-active');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-app text-foreground">
      {/* TOP HEADER */}
      <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-gradient-header px-4 shadow-sm backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="cursor-pointer rounded-lg p-2 text-foreground transition-colors hover:bg-accent"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
          >
            <Menu size={22} />
          </button>
          <div className="cursor-pointer" onClick={() => handleNav('/home')}>
            <AppBrand size="sm" />
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NotificationButton />

          <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="flex items-center gap-2 hover:bg-accent p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-border cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center font-bold uppercase text-sm shadow-glow">
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
                  onClick={() => setShowSettings(false)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium cursor-pointer"
                >
                  <User size={18} className="text-muted-foreground" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive mt-1 cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={18} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <div className="relative flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-30 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'flex w-64 shrink-0 flex-col border-r border-border/40 bg-gradient-sidebar px-4 py-6 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out',
            'fixed bottom-0 left-0 top-16 z-40 lg:static lg:top-auto lg:z-10',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            !isSidebarOpen && 'lg:w-0 lg:overflow-hidden lg:border-0 lg:px-0 lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Menu Section */}
            <div className="mb-8">
              <h2 className="section-label mb-3 px-2">Menu</h2>
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => handleNav('/home')}
                    className={navItemClass(activeTabState === 'feed')}
                  >
                    <Rss size={18} />
                    My Feed
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNav('/favorites')}
                    className={navItemClass(activeTabState === 'favorites')}
                  >
                    <Heart size={18} />
                    Favorites
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNav('/history')}
                    className={navItemClass(activeTabState === 'history')}
                  >
                    <Clock size={18} />
                    History
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNav('/leaderboard')}
                    className={navItemClass(activeTabState === 'leaderboard')}
                  >
                    <BarChart2 size={18} />
                    Leaderboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNav('/manage-topics')}
                    className={navItemClass(location.pathname === '/manage-topics')}
                  >
                    <Tag size={18} />
                    Manage Topics
                  </button>
                </li>
              </ul>
            </div>

            <h2 className="section-label mb-3 px-2">Your Topics</h2>
            <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                        <div className="nav-item truncate hover:bg-gradient-brand hover:text-primary-foreground hover:shadow-glow">
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-gradient-main custom-scrollbar p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
