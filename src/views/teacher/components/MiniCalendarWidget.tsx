import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../../services/store';
import { CalendarSession } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface MiniCalendarWidgetProps {
  onSelectDate?: (dateStr: string) => void;
  className?: string;
}

export const MiniCalendarWidget: React.FC<MiniCalendarWidgetProps> = ({
  onSelectDate,
  className = ''
}) => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  // Anchor to 2026-09-17 or system date
  const [currentDate, setCurrentDate] = useState(() => {
    // Current simulated date is in September 2026
    return new Date(2026, 8, 17);
  });
  const [todayStr] = useState('2026-09-17');
  const [sessions, setSessions] = useState<CalendarSession[]>(store.getSessions());

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(store.getSessions());
    };
    const unsub = store.subscribe(handleUpdate);
    return unsub;
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (8 = September)

  const monthLabel = `Tháng ${String(month + 1).padStart(2, '0')}/${year}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build days grid for month: Monday (T2) to Sunday (CN)
  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  // getDay: 0 is Sun, 1 is Mon, ..., 6 is Sat.
  // In Vietnam, week starts on Monday: Mon is 0, Tue is 1, ..., Sun is 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: {
    dayNumber: number;
    monthOffset: -1 | 0 | 1;
    dateStr: string;
    isToday: boolean;
  }[] = [];

  // Trailing days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: day,
      monthOffset: -1,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: d,
      monthOffset: 0,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

  // Next month leading days to fill up to 35 or 42 grid cells
  const remainingCells = 35 - calendarCells.length > 0
    ? 35 - calendarCells.length
    : (42 - calendarCells.length > 0 ? 42 - calendarCells.length : 0);

  for (let n = 1; n <= remainingCells; n++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    calendarCells.push({
      dayNumber: n,
      monthOffset: 1,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

  const handleCellClick = (cellDateStr: string) => {
    if (onSelectDate) {
      onSelectDate(cellDateStr);
    } else {
      navigate(`/teacher/calendar?date=${cellDateStr}`);
    }
  };

  const handleGoToCalendar = () => {
    navigate('/teacher/calendar');
  };

  return (
    <div id="mini-calendar-widget" className={`flex flex-col gap-2 ${className}`}>
      {/* Top Header Row: "Thời gian biểu" on left, "Xem tất cả" on right */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">Thời gian biểu</h3>
        <button
          type="button"
          onClick={handleGoToCalendar}
          className="text-sm font-semibold transition-colors cursor-pointer hover:underline hover:opacity-85"
          style={{ color: themeConfig.colors.primary }}
        >
          Xem tất cả
        </button>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-slate-800">{monthLabel}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers: T2, T3, T4, T5, T6, T7, CN */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayName) => (
            <div
              key={dayName}
              className="text-xs font-semibold text-slate-500 py-1"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
          {calendarCells.map((cell, idx) => {
            const daySessions = sessions.filter((s) => s.date === cell.dateStr);
            const count = daySessions.length;
            const isDimmed = cell.monthOffset !== 0;

            // Dot rendering: up to 4 dots + text counter if more
            const dotsToShow = Math.min(count, 4);
            const extraCount = count > 4 ? count - 4 : 0;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => handleCellClick(cell.dateStr)}
                className={`group flex flex-col items-center justify-start py-1 rounded-xl transition-all cursor-pointer select-none hover:bg-slate-50`}
                title={`${cell.dateStr}: ${count} ca học`}
              >
                {/* Number with today styling */}
                <div
                  className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-lg transition-transform ${
                    cell.isToday
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : isDimmed
                      ? 'text-slate-300 font-normal'
                      : 'text-slate-800 group-hover:text-indigo-600'
                  }`}
                >
                  {cell.dayNumber < 10 && cell.monthOffset === 0 ? `0${cell.dayNumber}` : cell.dayNumber}
                </div>

                {/* Dots container under date matching Image 1 */}
                <div className="h-3 flex items-center justify-center gap-0.5 mt-0.5 min-w-[20px]">
                  {count > 0 && (
                    <>
                      {Array.from({ length: dotsToShow }).map((_, dIdx) => {
                        const sess = daySessions[dIdx];
                        const isOrange = sess?.color === 'amber' || sess?.color === 'orange';
                        const isRose = sess?.color === 'rose';
                        const isEmerald = sess?.color === 'emerald';
                        const dotColor = isOrange
                          ? 'bg-amber-500'
                          : isRose
                          ? 'bg-rose-500'
                          : isEmerald
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'; // Xanh chàm chính

                        return (
                          <span
                            key={dIdx}
                            className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                          />
                        );
                      })}
                      {extraCount > 0 && (
                        <span className="text-[9px] font-bold text-slate-500 leading-none ml-0.5">
                          +{extraCount}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
