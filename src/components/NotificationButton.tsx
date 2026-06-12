import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, FileText } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  API_URL,
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  flattenNotificationRows,
  formatRelativeNotificationTime,
  getPaperCategory,
  getPaperRouteId,
  parseNotificationsResponse,
  parseUnreadCount,
  type NotificationItem,
  type NotificationPaper,
} from '@/lib/notifications';

const PAGE_SIZE = 5;
type NotificationTab = 'all' | 'unread';

function getSocketUserId(): string | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.id || null;
  } catch {
    return null;
  }
}

function formatBadgeCount(count: number) {
  if (count > 9) return '9+';
  return String(count);
}

function mergeNotifications(prev: NotificationItem[], incoming: NotificationItem[]) {
  const existingIds = new Set(prev.map((item) => item.id));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
  return [...prev, ...uniqueIncoming];
}

const NotificationButton: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const navigate = useNavigate();

  const refreshUnreadCount = useCallback(async () => {
    const data = await getUnreadNotificationCount();
    setUnreadCount(parseUnreadCount(data));
  }, []);

  const fetchPage = useCallback(async (tab: NotificationTab, pageNum: number) => {
    return tab === 'unread'
      ? getUnreadNotifications(pageNum, PAGE_SIZE)
      : getNotifications(pageNum, PAGE_SIZE);
  }, []);

  const loadPage = useCallback(
    async (tab: NotificationTab, pageNum: number, append: boolean) => {
      const data = await fetchPage(tab, pageNum);
      const { items, hasMore: more } = parseNotificationsResponse(data, PAGE_SIZE);

      setNotifications((prev) => (append ? mergeNotifications(prev, items) : items));
      setPage(pageNum);
      setHasMore(more);

      return items;
    },
    [fetchPage]
  );

  const resetAndLoad = useCallback(
    async (tab: NotificationTab) => {
      setIsLoading(true);
      setHasMore(true);
      try {
        await loadPage(tab, 1, false);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPage]
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || isLoading) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      await loadPage(activeTab, page + 1, true);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [activeTab, hasMore, isLoading, loadPage, page]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    void refreshUnreadCount();

    const userId = getSocketUserId();
    if (!userId) return;

    const socket = io(`${API_URL}/notifications`, {
      query: { userId },
    });

    socket.on('notification', (data: { pushed?: NotificationItem } & NotificationItem) => {
      const payload = { ...(data?.pushed || data), unread: true } as NotificationItem;
      setNotifications((prev) => {
        const withoutDup = prev.filter((item) => item.id !== payload.id);
        return [payload, ...withoutDup];
      });
      void refreshUnreadCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!showDropdown) return;
    void Promise.all([resetAndLoad(activeTab), refreshUnreadCount()]);
  }, [activeTab, showDropdown, resetAndLoad, refreshUnreadCount]);

  const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (nearBottom) void loadMore();
  };

  const handleTabChange = (tab: NotificationTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, unread: false, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      if (activeTab === 'unread') {
        setNotifications([]);
        setHasMore(false);
      }
      await refreshUnreadCount();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = async (notificationId: string, paper: NotificationPaper) => {
    const routeId = getPaperRouteId(paper);
    if (!routeId) return;

    setShowDropdown(false);
    navigate(`/paper/${routeId}`);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, unread: false, read: true, readAt: new Date().toISOString() }
          : item
      )
    );
    await markNotificationAsRead(notificationId);
    await refreshUnreadCount();
  };

  const rows = flattenNotificationRows(notifications);
  const showNewSection = activeTab === 'all' && rows.some((row) => row.unread);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown((open) => !open)}
        className="relative cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-panel absolute top-full right-0 z-50 mt-2 w-[17.5rem] overflow-hidden rounded-xl border text-popover-foreground shadow-lg">
          <div className="px-3 pt-3 pb-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          </div>

          <div className="px-2 pb-2">
            <div className="notification-panel-tab flex rounded-lg p-0.5">
              {(['all', 'unread'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={cn(
                    'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                    activeTab === tab
                      ? 'notification-panel-tab-active text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-xs font-bold text-foreground">
              {activeTab === 'unread' || showNewSection ? 'New' : 'Earlier'}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                disabled={isMarkingAll}
                className="cursor-pointer text-[11px] font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
              >
                {isMarkingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          <div
            onScroll={handleListScroll}
            className="notification-scrollbar max-h-60 space-y-0.5 overflow-y-auto px-1 pb-1.5"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Spinner size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            ) : (
              <>
                {rows.map((row) => {
                  const title = row.paper.title || 'Untitled paper';
                  const category = getPaperCategory(row.paper);
                  const timeLabel = formatRelativeNotificationTime(row.createdAt);

                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => void handleItemClick(row.notificationId, row.paper)}
                      className={cn(
                        'notification-item flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                        row.unread && 'notification-item-unread'
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <FileText size={14} className="text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs leading-snug text-foreground">
                          <span className="font-semibold">{title}</span>
                        </p>
                        {category && (
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{category}</p>
                        )}
                        {timeLabel && (
                          <p className="mt-0.5 text-[10px] font-medium text-primary">{timeLabel}</p>
                        )}
                      </div>

                      {row.unread && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}

                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 px-2 py-2.5">
                    <Spinner size={14} className="text-primary" />
                    <span className="text-[10px] font-medium text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
