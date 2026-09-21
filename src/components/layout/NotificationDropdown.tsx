import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileCheck2,
  FileText,
  DollarSign,
  MessageSquare,
  UserCheck,
  Info,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
import { store } from '../../services/store';
import { TeacherNotification } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<TeacherNotification[]>(() => store.getNotifications());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setNotifications(store.getNotifications());
    };
    const unsubscribe = store.subscribe(update);
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = (n: TeacherNotification) => {
    store.markNotificationAsRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.markAllNotificationsAsRead();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    store.deleteNotification(id);
  };

  const getIcon = (type: TeacherNotification['type']) => {
    switch (type) {
      case 'submission':
        return <FileCheck2 className="w-4 h-4 text-violet-600" />;
      case 'grading':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'schedule':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'fee':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'attendance':
        return <UserCheck className="w-4 h-4 text-rose-600" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getIconBg = (type: TeacherNotification['type']) => {
    switch (type) {
      case 'submission':
        return 'bg-violet-50 border-violet-100';
      case 'grading':
        return 'bg-amber-50 border-amber-100';
      case 'schedule':
        return 'bg-indigo-50 border-indigo-100';
      case 'fee':
        return 'bg-emerald-50 border-emerald-100';
      case 'message':
        return 'bg-blue-50 border-blue-100';
      case 'attendance':
        return 'bg-rose-50 border-rose-100';
      case 'system':
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="teacher-notification-bell-btn"
        title="Thông báo hệ thống"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl relative transition-all border hover:opacity-90 active:scale-95 cursor-pointer"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: isOpen ? themeConfig.colors.surface : themeConfig.colors.surfaceDim,
          color: themeConfig.colors.text
        }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          id="teacher-notification-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-100 bg-white overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Đánh dấu tất cả đã đọc"
                  className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đã đọc hết</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-white text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-600">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filter === 'unread' ? 'Bạn đã đọc hết mọi thông báo' : 'Hệ thống chưa có thông báo mới'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-colors relative group ${
                    !item.read ? 'bg-indigo-50/35 hover:bg-indigo-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Icon or Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.senderName || 'Avatar'}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${getIconBg(
                          item.type
                        )}`}
                      >
                        {getIcon(item.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !item.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span>{item.time}</span>
                      {item.senderName && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-500">{item.senderName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    type="button"
                    title="Xóa thông báo"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-3 right-3 p-1 text-slate-300 hover:text-rose-600 rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Ako Edu • Thông báo tự động</span>
            <button
              type="button"
              onClick={() => {
                navigate('/teacher/calendar');
                setIsOpen(false);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Xem lịch dạy</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
