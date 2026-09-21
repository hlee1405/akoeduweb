import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronRight } from 'lucide-react';
import { store } from '../../../services/store';
import { CalendarSession } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

export const UpcomingScheduleWidget: React.FC = () => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [sessions, setSessions] = useState<CalendarSession[]>(store.getSessions());

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(store.getSessions());
    };
    const unsub = store.subscribe(handleUpdate);
    return unsub;
  }, []);

  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = `${a.date}T${a.startTime || '00:00'}`;
    const timeB = `${b.date}T${b.startTime || '00:00'}`;
    return timeA.localeCompare(timeB);
  });

  // Simulated anchor date (September 2026 or real today)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const anchorDate = todayStr >= '2026-09-01' ? todayStr : '2026-09-17';

  // Filter for upcoming sessions from anchor date
  const upcomingSessions = sortedSessions.filter((s) => s.date >= anchorDate);
  const displaySessions = (upcomingSessions.length >= 3 ? upcomingSessions : sortedSessions).slice(0, 3);

  const formatSessionDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { shortDay: 'T2', dayNum: '01', monthNum: '09', isToday: false };
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const shortDay = dayNames[d.getDay()] || 'T2';
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const isToday = dateStr === anchorDate;
    return { shortDay, dayNum, monthNum, isToday };
  };

  return (
    <div
      id="upcoming-schedule-widget"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors"
            style={{
              backgroundColor: `${themeConfig.colors.primary}12`,
              borderColor: `${themeConfig.colors.primary}25`,
              color: themeConfig.colors.primary,
            }}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">
            Lịch dạy sắp tới
          </h3>
        </div>
        <Link
          to="/teacher/calendar"
          className="text-xs font-bold hover:underline inline-flex items-center gap-0.5 group"
          style={{ color: themeConfig.colors.primary }}
        >
          <span>Xem tất cả</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Body: List of 3 nearest schedules with clean white cards */}
      <div className="p-4 space-y-2.5">
        {displaySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <CalendarIcon className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold">Chưa có lịch dạy nào sắp tới</p>
            <Link
              to="/teacher/calendar"
              className="mt-3 text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs"
              style={{ backgroundColor: themeConfig.colors.primary }}
            >
              + Thêm buổi dạy
            </Link>
          </div>
        ) : (
          displaySessions.map((session, index) => {
            const { shortDay, dayNum, monthNum } = formatSessionDate(session.date);

            return (
              <div
                key={session.id || index}
                onClick={() => navigate(`/teacher/calendar?date=${session.date}`)}
                className="p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-blue-300/80 hover:shadow-xs transition-all flex items-center gap-3 group cursor-pointer"
              >
                {/* Date Badge */}
                <div className="shrink-0 w-11 h-13 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-center shadow-2xs group-hover:border-blue-300/80 transition-colors relative">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide leading-tight"
                    style={{ color: themeConfig.colors.primary }}
                  >
                    {shortDay}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none my-0.5">
                    {dayNum}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium leading-tight">
                    Th{monthNum}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4
                      className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                      title={session.className}
                    >
                      {session.className}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>{session.startTime} - {session.endTime}</span>
                    </span>
                    {session.room && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{session.room}</span>
                      </span>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {session.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
