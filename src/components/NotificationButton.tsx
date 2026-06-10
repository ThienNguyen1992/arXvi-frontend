import React, { useEffect, useState, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';

const NotificationButton: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    let uid = 'user-uuid-here';
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        uid = payload.sub || payload.id || uid;
      } catch (e) {
        console.error("Could not parse token", e);
      }
    }
    setUserId(uid);

    if (uid) {
      getNotifications(uid, 1, 5).then((data) => {
        if (data && data.data) {
          setNotifications(data.data);
        } else if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && data.notifications) {
          setNotifications(data.notifications);
        }
      });
    }

    const socket = io('http://localhost:3000/notifications', {
      query: { userId: uid }
    });

    socket.on('notification', (data: any) => {
      console.log('📬 New notification:', data);
      const payload = data?.pushed || data;
      // Mark as unread by default if field doesn't exist
      if (payload.unread === undefined) payload.unread = true;
      setNotifications(prev => [payload, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const hasUnread = notifications.some(n => n.unread);

  const handleNotificationClick = async (notif: any) => {
    const targetId = notif.paper_id || notif.reference_id || notif.id;
    if (targetId) {
      navigate(`/paper/${targetId}`);
    }
    
    if (notif.unread && notif.id) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
      await markNotificationAsRead(notif.id);
    }
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    await markAllNotificationsAsRead(userId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground mr-2"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-card"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-xl border border-border shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <p className="font-bold text-sm text-foreground">Notifications</p>
            {notifications.length > 0 && hasUnread && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <CheckCircle2 size={14} />
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={notif.id || idx} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer last:border-0 flex flex-col gap-1 ${notif.unread ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${notif.unread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                      {notif.title || 'New Notification'}
                    </p>
                    {notif.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"></span>}
                  </div>
                  <p className={`text-xs line-clamp-2 ${notif.unread ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                    {notif.message || notif.body || JSON.stringify(notif)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
