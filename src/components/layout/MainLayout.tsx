import React, { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, ChevronDown, Rss, Heart, Tag, Clock, Copy, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserTopics } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  let activeTabState: 'feed' | 'favorites' | 'history' | 'duplicates' | 'leaderboard' = 'feed';
  if (location.pathname === '/favorites') activeTabState = 'favorites';
  else if (location.pathname === '/history') activeTabState = 'history';
  else if (location.pathname === '/duplicates') activeTabState = 'duplicates';
  else if (location.pathname === '/leaderboard') activeTabState = 'leaderboard';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* TOP HEADER */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
            <span className="text-foreground">daily</span>
            <span className="text-primary">.</span>
            <span className="text-foreground">dev</span>
          </div>
        </div>
        
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="flex items-center gap-2 hover:bg-accent p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-border cursor-pointer"
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
                  onClick={() => setShowSettings(false)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium cursor-pointer"
                >
                  <User size={18} className="text-muted-foreground" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive mt-1 cursor-pointer"
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
                    onClick={() => navigate('/home')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTabState === 'feed' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Rss size={18} />
                    My Feed
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/favorites')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTabState === 'favorites' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Heart size={18} />
                    Favorites
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/history')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTabState === 'history' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Clock size={18} />
                    History
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/duplicates')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTabState === 'duplicates' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Copy size={18} />
                    Duplicates
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/leaderboard')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      activeTabState === 'leaderboard' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <BarChart2 size={18} />
                    Leaderboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/manage-topics')}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-foreground hover:bg-accent cursor-pointer"
                  >
                    <Tag size={18} />
                    Manage Topics
                  </button>
                </li>
              </ul>
            </div>

            <h2 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest px-2">Your Topics</h2>
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto bg-background custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
