import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  BookOpen,
  List,
  Layers
} from 'lucide-react';
import { store } from '../../services/store';
import { CalendarSession, ClassRoom } from '../../types';
import { CalendarSessionModal } from './components/CalendarSessionModal';

type CalendarViewMode = 'month' | 'week' | 'day';

// Hourly timeline from 06:00 to 21:00
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 to 21

export const TeacherCalendarView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected date anchor (defaults to query param date or 2026-09-17)
  const initialDateStr = searchParams.get('date') || '2026-09-17';

  const [activeDate, setActiveDate] = useState<Date>(() => {
    const parts = initialDateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(2026, 8, 17);
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>('week'); // Default week matching Image 2
  const [sessions, setSessions] = useState<CalendarSession[]>(store.getSessions());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('');
  const [modalStartTime, setModalStartTime] = useState<string>('07:00');
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(null);

  const todayStr = '2026-09-17';

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(store.getSessions());
      setClasses(store.getClasses());
    };
    const unsub = store.subscribe(handleUpdate);
    return unsub;
  }, []);

  // Format date helper YYYY-MM-DD
  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Compute week range (Monday to Sunday) containing activeDate
  const currentWeekDays = useMemo(() => {
    const curr = new Date(activeDate);
    // getDay: 0 is Sun, 1 is Mon, ... 6 is Sat
    const day = curr.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    const days: { date: Date; dateStr: string; dayLabel: string; isToday: boolean }[] = [];
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateStr(d);
      days.push({
        date: d,
        dateStr,
        dayLabel: dayLabels[i],
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [activeDate]);

  // Title range display
  const headerDateRangeText = useMemo(() => {
    if (viewMode === 'week') {
      const start = currentWeekDays[0];
      const end = currentWeekDays[6];
      const sDay = String(start.date.getDate()).padStart(2, '0');
      const sMonth = String(start.date.getMonth() + 1).padStart(2, '0');
      const eDay = String(end.date.getDate()).padStart(2, '0');
      const eMonth = String(end.date.getMonth() + 1).padStart(2, '0');
      return `${sDay}/${sMonth} - ${eDay}/${eMonth}`;
    }
    if (viewMode === 'day') {
      const d = activeDate.getDate();
      const m = activeDate.getMonth() + 1;
      const y = activeDate.getFullYear();
      const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      return `${dayNames[activeDate.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    // Month view
    const m = activeDate.getMonth() + 1;
    const y = activeDate.getFullYear();
    return `Tháng ${String(m).padStart(2, '0')}/${y}`;
  }, [viewMode, activeDate, currentWeekDays]);

  // Navigation handlers
  const handleToday = () => {
    setActiveDate(new Date(2026, 8, 17));
  };

  const handlePrev = () => {
    const next = new Date(activeDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setActiveDate(next);
  };

  const handleNext = () => {
    const next = new Date(activeDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setActiveDate(next);
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (filterClassId === 'all') return sessions;
    return sessions.filter((s) => s.classId === filterClassId);
  }, [sessions, filterClassId]);

  // Click on empty cell in Week or Day grid
  const handleCellClick = (dateStr: string, hour: number) => {
    setEditingSession(null);
    setModalDate(dateStr);
    const hourFormatted = String(hour).padStart(2, '0');
    setModalStartTime(`${hourFormatted}:00`);
    setModalOpen(true);
  };

  // Click on existing session card
  const handleSessionClick = (sess: CalendarSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(sess);
    setModalDate(sess.date);
    setModalStartTime(sess.startTime);
    setModalOpen(true);
  };

  // Helper for color styles
  const getSessionColorClasses = (color?: string) => {
    switch (color) {
      case 'amber':
      case 'orange':
        return 'bg-amber-500 border-amber-600 text-white';
      case 'blue':
        return 'bg-blue-600 border-blue-700 text-white';
      case 'emerald':
        return 'bg-emerald-600 border-emerald-700 text-white';
      case 'rose':
        return 'bg-rose-500 border-rose-600 text-white';
      case 'teal':
        return 'bg-[#52bec4] border-[#42abb0] text-white';
      case 'indigo':
      case 'cham':
      case 'cyan':
      default:
        // Màu chính là màu xanh chàm (Indigo)
        return 'bg-[#4338ca] border-[#3730a3] text-white shadow-xs';
    }
  };

  return (
    <div id="teacher-calendar-view" className="flex flex-col gap-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header matching Image 2 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Thời gian biểu</h1>
            <div className="flex items-center text-slate-400 gap-1 ml-1">
              <CalendarIcon className="w-4 h-4 text-slate-600" />
              <List className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Class Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* "+ Thêm ca học" button */}
          <button
            type="button"
            onClick={() => {
              setEditingSession(null);
              setModalDate(formatDateStr(activeDate));
              setModalStartTime('07:00');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ca học</span>
          </button>
        </div>
      </div>

      {/* Control Bar: [Hôm nay] [Quay lại] [Tiếp] | Date Range | [Tháng] [Tuần] [Ngày] */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Tiếp theo"
          >
            <span className="hidden sm:inline">Tiếp</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Range Display */}
        <div className="text-sm sm:text-base font-bold text-slate-800 tracking-wide text-center">
          {headerDateRangeText}
        </div>

        {/* Right: View Mode Toggle [Tháng] [Tuần] [Ngày] */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tháng
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ngày
          </button>
        </div>
      </div>

      {/* Main Timetable View Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* VIEW 1: WEEK TIMETABLE (MATCHING IMAGE 2) */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto min-w-full">
            <div className="min-w-[840px]">
              {/* Header Row: "Cả ngày", "14 T2", "15 T3", "16 T4", "17 T5", "18 T6", "19 T7", "20 CN" */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
                <div className="p-3 border-r border-slate-200 flex items-center justify-center text-slate-500 font-medium text-center">
                  Cả ngày
                </div>
                {currentWeekDays.map((d) => {
                  const dayNum = String(d.date.getDate()).padStart(2, '0');
                  return (
                    <div
                      key={d.dateStr}
                      className={`p-3 border-r last:border-r-0 border-slate-200 text-center transition-colors ${
                        d.isToday ? 'bg-sky-100/50 text-sky-900 font-bold' : ''
                      }`}
                    >
                      <span>{dayNum} {d.dayLabel}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body: Hours & Day Slots */}
              <div className="divide-y divide-slate-100">
                {HOURS.map((hour) => {
                  const timeLabel = `${String(hour).padStart(2, '0')}:00`;

                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[58px] group"
                    >
                      {/* Left time label */}
                      <div className="px-2 py-2 border-r border-slate-200 text-[11px] font-semibold text-slate-500 text-center select-none bg-slate-50/30">
                        {timeLabel}
                      </div>

                      {/* 7 Day slots for this hour */}
                      {currentWeekDays.map((colDay) => {
                        // Find sessions that start in this hour slot
                        const matchingSessions = filteredSessions.filter((s) => {
                          if (s.date !== colDay.dateStr) return false;
                          const [sHour] = s.startTime.split(':').map((v) => parseInt(v, 10));
                          return sHour === hour;
                        });

                        return (
                          <div
                            key={colDay.dateStr}
                            onClick={() => handleCellClick(colDay.dateStr, hour)}
                            className={`p-1 border-r last:border-r-0 border-slate-100 relative transition-all cursor-pointer hover:bg-teal-50/30 ${
                              colDay.isToday ? 'bg-sky-50/40' : ''
                            }`}
                            title={`Nhấn để thêm ca học lúc ${timeLabel} ngày ${colDay.dateStr}`}
                          >
                            {/* Render sessions starting in this hour */}
                            {matchingSessions.map((sess) => {
                              // Compute duration in hours for block sizing
                              const [startH, startM] = sess.startTime.split(':').map((v) => parseInt(v, 10));
                              const [endH, endM] = sess.endTime.split(':').map((v) => parseInt(v, 10));
                              const durationMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
                              const durationHours = Math.max(1, durationMinutes / 60);

                              // Sizing: base cell is 58px. If duration is 2h, height is ~114px with z-index to overlay
                              const heightPx = Math.max(50, Math.round(durationHours * 58) - 4);

                              const colorClass = getSessionColorClasses(sess.color);

                              return (
                                <div
                                  key={sess.id}
                                  onClick={(e) => handleSessionClick(sess, e)}
                                  style={{
                                    height: `${heightPx}px`,
                                    zIndex: 10
                                  }}
                                  className={`absolute inset-x-1 top-1 p-2 rounded-xl shadow-xs border text-left overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.01] hover:shadow-md cursor-pointer select-none ${colorClass}`}
                                >
                                  <div>
                                    <h4 className="font-bold text-xs leading-snug line-clamp-2">
                                      {sess.className}
                                    </h4>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] opacity-90 font-medium pt-1">
                                    <span>{sess.startTime} - {sess.endTime}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="p-4 sm:p-6">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => (
                <div key={w} className="py-2">{w}</div>
              ))}
            </div>

            {/* Month grid */}
            {(() => {
              const y = activeDate.getFullYear();
              const m = activeDate.getMonth();
              const firstDay = new Date(y, m, 1);
              let startDay = firstDay.getDay() - 1;
              if (startDay < 0) startDay = 6;
              const daysInM = new Date(y, m + 1, 0).getDate();
              const daysInPrev = new Date(y, m, 0).getDate();

              const cells: { dateStr: string; dayNum: number; isCurr: boolean; isToday: boolean }[] = [];

              for (let i = startDay - 1; i >= 0; i--) {
                const dayNum = daysInPrev - i;
                const prevM = m === 0 ? 11 : m - 1;
                const prevY = m === 0 ? y - 1 : y;
                const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                cells.push({ dateStr, dayNum, isCurr: false, isToday: dateStr === todayStr });
              }

              for (let d = 1; d <= daysInM; d++) {
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                cells.push({ dateStr, dayNum: d, isCurr: true, isToday: dateStr === todayStr });
              }

              const rest = (Math.ceil(cells.length / 7) * 7) - cells.length;
              for (let n = 1; n <= rest; n++) {
                const nextM = m === 11 ? 0 : m + 1;
                const nextY = m === 11 ? y + 1 : y;
                const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
                cells.push({ dateStr, dayNum: n, isCurr: false, isToday: dateStr === todayStr });
              }

              return (
                <div className="grid grid-cols-7 gap-2">
                  {cells.map((c) => {
                    const daySessions = filteredSessions.filter((s) => s.date === c.dateStr);

                    return (
                      <div
                        key={c.dateStr}
                        onClick={() => handleCellClick(c.dateStr, 7)}
                        className={`min-h-[110px] p-2 rounded-xl border border-slate-200/70 flex flex-col justify-between transition-all cursor-pointer hover:border-teal-400 hover:bg-slate-50/50 ${
                          c.isToday
                            ? 'bg-sky-50/60 border-sky-300'
                            : c.isCurr
                            ? 'bg-white'
                            : 'bg-slate-50/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold ${
                              c.isToday
                                ? 'bg-red-600 text-white'
                                : c.isCurr
                                ? 'text-slate-800'
                                : 'text-slate-300'
                            }`}
                          >
                            {c.dayNum}
                          </span>
                          {daySessions.length > 0 && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {daySessions.length} ca
                            </span>
                          )}
                        </div>

                        {/* Session list items */}
                        <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5">
                          {daySessions.slice(0, 2).map((s) => (
                            <div
                              key={s.id}
                              onClick={(e) => handleSessionClick(s, e)}
                              className={`px-1.5 py-1 rounded text-white text-[10px] font-semibold truncate hover:opacity-90 ${getSessionColorClasses(s.color)}`}
                              title={`${s.className} (${s.startTime} - ${s.endTime})`}
                            >
                              {s.startTime} {s.className}
                            </div>
                          ))}
                          {daySessions.length > 2 && (
                            <div className="text-[10px] font-bold text-indigo-700 pl-1">
                              +{daySessions.length - 2} ca học khác
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 3: DAY TIMELINE */}
        {viewMode === 'day' && (
          <div className="p-4 sm:p-6 divide-y divide-slate-100">
            {HOURS.map((hour) => {
              const dateStr = formatDateStr(activeDate);
              const timeLabel = `${String(hour).padStart(2, '0')}:00`;
              const hourSessions = filteredSessions.filter((s) => {
                if (s.date !== dateStr) return false;
                const [sH] = s.startTime.split(':').map((v) => parseInt(v, 10));
                return sH === hour;
              });

              return (
                <div
                  key={hour}
                  onClick={() => handleCellClick(dateStr, hour)}
                  className="grid grid-cols-[80px_1fr] min-h-[64px] py-2 hover:bg-slate-50/50 rounded-xl px-2 transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500 pt-1">
                    {timeLabel}
                  </div>
                  <div className="flex flex-wrap gap-2 items-start">
                    {hourSessions.length === 0 && (
                      <span className="text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        + Nhấp để thêm ca học
                      </span>
                    )}
                    {hourSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={(e) => handleSessionClick(sess, e)}
                        className={`p-3 rounded-xl border text-xs max-w-md cursor-pointer transition-transform hover:scale-101 shadow-xs ${getSessionColorClasses(sess.color)}`}
                      >
                        <div className="font-bold text-sm">{sess.className}</div>
                        <div className="flex items-center gap-3 text-[11px] opacity-90 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sess.startTime} - {sess.endTime}
                          </span>
                        </div>
                        {sess.notes && (
                          <p className="text-[11px] opacity-85 mt-1 line-clamp-1 italic">
                            {sess.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit / Delete Session */}
      <CalendarSessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDate={modalDate}
        initialStartTime={modalStartTime}
        sessionToEdit={editingSession}
        onSaved={() => {
          setSessions(store.getSessions());
        }}
        onDeleted={() => {
          setSessions(store.getSessions());
        }}
      />
    </div>
  );
};
