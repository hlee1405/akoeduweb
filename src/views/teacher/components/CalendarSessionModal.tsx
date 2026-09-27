import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Check,
  Info,
  Sparkles,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { store } from '../../../services/store';
import { ClassRoom, CalendarSession, ClassScheduleItem, DayOfWeek, ScheduleRepeatType } from '../../../types';
import { useToast } from '../../../context/ToastContext';

export interface CalendarSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId?: string;
  lockClass?: boolean;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  sessionToEdit?: CalendarSession | null;
  scheduleItemToEdit?: ClassScheduleItem | null;
  onSaved?: (session: CalendarSession) => void;
  onScheduleSaved?: (updatedSchedule: ClassScheduleItem[]) => void;
  onDeleted?: (id: string) => void;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 1, label: 'Thứ Hai', short: 'T2' },
  { value: 2, label: 'Thứ Ba', short: 'T3' },
  { value: 3, label: 'Thứ Tư', short: 'T4' },
  { value: 4, label: 'Thứ Năm', short: 'T5' },
  { value: 5, label: 'Thứ Sáu', short: 'T6' },
  { value: 6, label: 'Thứ Bảy', short: 'T7' },
  { value: 0, label: 'Chủ Nhật', short: 'CN' }
];

const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Xanh chàm', bg: 'bg-[#4338ca]', border: 'border-[#3730a3]', text: 'text-white' },
  { id: 'cyan', label: 'Xanh ngọc', bg: 'bg-[#52bec4]', border: 'border-[#3ba9b0]', text: 'text-white' },
  { id: 'blue', label: 'Xanh dương', bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' },
  { id: 'emerald', label: 'Xanh lá', bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white' },
  { id: 'amber', label: 'Màu cam/vàng', bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  { id: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white' }
];

const DURATION_PRESETS = [
  { label: '45 phút', minutes: 45 },
  { label: '60 phút', minutes: 60 },
  { label: '90 phút (1.5h)', minutes: 90 },
  { label: '120 phút (2h)', minutes: 120 },
  { label: '150 phút (2.5h)', minutes: 150 }
];

/**
 * Smart normalizer for time strings (supports 24h, 12h, SA/CH, AM/PM, e.g. "11:35 CH", "1h30", "14:00")
 */
export function normalizeTimeString(timeStr: string): string {
  if (!timeStr) return '07:30';
  let s = timeStr.trim().toLowerCase();

  const isPM = s.includes('ch') || s.includes('pm') || s.includes('chiều') || s.includes('tối');
  const isAM = s.includes('sa') || s.includes('am') || s.includes('sáng');

  // Replace 'h' with ':' if present like '14h30' -> '14:30'
  s = s.replace('h', ':');
  // Strip non-digit and non-colon
  s = s.replace(/[^0-9:]/g, '');

  let parts = s.split(':');
  let h = parseInt(parts[0] || '0', 10);
  let m = parseInt(parts[1] || '0', 10);

  if (isNaN(h)) h = 7;
  if (isNaN(m)) m = 0;

  if (isPM && h < 12) {
    h += 12;
  } else if (isAM && h === 12) {
    h = 0;
  }

  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const norm = normalizeTimeString(timeStr);
  const [h, m] = norm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMins: number): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const CalendarSessionModal: React.FC<CalendarSessionModalProps> = ({
  isOpen,
  onClose,
  initialClassId,
  lockClass = false,
  initialDate,
  initialStartTime,
  initialEndTime,
  sessionToEdit,
  scheduleItemToEdit,
  onSaved,
  onScheduleSaved,
  onDeleted
}) => {
  const { success, warning, info } = useToast();
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());

  // Form states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [subject, setSubject] = useState<string>('Toán học');
  const [date, setDate] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1);
  const [startTime, setStartTime] = useState<string>('07:30');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [room, setRoom] = useState<string>('Phòng 201');
  const [color, setColor] = useState<string>('indigo');
  const [notes, setNotes] = useState<string>('');
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [showConflictPopup, setShowConflictPopup] = useState<boolean>(false);

  // Recurrence states (Google Calendar style)
  const [repeatType, setRepeatType] = useState<ScheduleRepeatType>('weekly');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>([1]);
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [repeatEndType, setRepeatEndType] = useState<'never' | 'until_date' | 'after_count'>('never');
  const [repeatEndDate, setRepeatEndDate] = useState<string>('2026-12-31');
  const [repeatCount, setRepeatCount] = useState<number>(12);
  const [specificDate, setSpecificDate] = useState<string>('2026-09-17');

  useEffect(() => {
    setClasses(store.getClasses());
    setIsConfirmingDelete(false);
    setShowConflictPopup(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIsConfirmingDelete(false);

    // Case 1: Editing a ClassScheduleItem (from ScheduleManager)
    if (scheduleItemToEdit) {
      const clsId = initialClassId || classes[0]?.id || '';
      setSelectedClassId(clsId);
      setIsCustomClass(false);

      const cls = classes.find((c) => c.id === clsId);
      setClassName(scheduleItemToEdit.label || cls?.name || 'Ca học');
      setSubject(cls?.subject || 'Toán học');
      setSelectedDay(scheduleItemToEdit.dayOfWeek);
      setStartTime(normalizeTimeString(scheduleItemToEdit.startTime || '07:30'));
      setEndTime(normalizeTimeString(scheduleItemToEdit.endTime || '09:00'));
      setRoom(scheduleItemToEdit.room || 'Phòng 201');
      setColor(scheduleItemToEdit.color || 'indigo');
      setNotes(scheduleItemToEdit.notes || '');

      // Recurrence
      setRepeatType(scheduleItemToEdit.repeatType || 'weekly');
      setRepeatDays(scheduleItemToEdit.repeatDays || [scheduleItemToEdit.dayOfWeek]);
      setRepeatInterval(scheduleItemToEdit.repeatInterval || 1);
      setRepeatEndType(scheduleItemToEdit.repeatEndType || 'never');
      setRepeatEndDate(scheduleItemToEdit.repeatEndDate || '2026-12-31');
      setRepeatCount(scheduleItemToEdit.repeatCount || 12);
      setSpecificDate(scheduleItemToEdit.specificDate || scheduleItemToEdit.startDate || '2026-09-17');
      setDate(scheduleItemToEdit.startDate || scheduleItemToEdit.specificDate || '2026-09-17');
      return;
    }

    // Case 2: Editing a CalendarSession (from Calendar)
    if (sessionToEdit) {
      const clsId = sessionToEdit.classId || 'custom';
      setSelectedClassId(clsId);
      setIsCustomClass(!sessionToEdit.classId);
      setClassName(sessionToEdit.className);
      setSubject(sessionToEdit.subject || 'Toán học');
      setDate(sessionToEdit.date);
      setStartTime(normalizeTimeString(sessionToEdit.startTime || '07:30'));
      setEndTime(normalizeTimeString(sessionToEdit.endTime || '09:00'));
      setRoom(sessionToEdit.room || '');
      setColor(sessionToEdit.color || 'indigo');
      setNotes(sessionToEdit.notes || '');

      // Day of week from date
      const d = new Date(sessionToEdit.date);
      if (!isNaN(d.getTime())) {
        setSelectedDay(d.getDay() as DayOfWeek);
      }

      // Check if session has recurrence or linked schedule item
      if (sessionToEdit.repeatType) {
        setRepeatType(sessionToEdit.repeatType);
      } else if (sessionToEdit.scheduleItemId && sessionToEdit.classId) {
        const cls = store.getClassById(sessionToEdit.classId);
        const item = cls?.schedule?.find((s) => s.id === sessionToEdit.scheduleItemId);
        if (item) {
          setRepeatType(item.repeatType || 'weekly');
          setRepeatDays(item.repeatDays || [item.dayOfWeek]);
          setRepeatInterval(item.repeatInterval || 1);
          setRepeatEndType(item.repeatEndType || 'never');
          setRepeatEndDate(item.repeatEndDate || '2026-12-31');
          setRepeatCount(item.repeatCount || 12);
        } else {
          setRepeatType('weekly');
        }
      } else {
        setRepeatType('weekly');
      }
      setSpecificDate(sessionToEdit.date);
      return;
    }

    // Case 3: Create Mode (from Calendar or ScheduleManager)
    const defaultDate = initialDate || getTodayDateStr();
    const defaultStart = normalizeTimeString(initialStartTime || '07:30');
    let defaultEnd = initialEndTime ? normalizeTimeString(initialEndTime) : '';

    if (!defaultEnd) {
      const startMins = timeToMinutes(defaultStart);
      defaultEnd = minutesToTime(startMins + 90); // 90 mins default
    }

    setDate(defaultDate);
    setSpecificDate(defaultDate);
    setStartTime(defaultStart);
    setEndTime(defaultEnd);
    setColor('indigo');
    setNotes('');

    const d = new Date(defaultDate);
    const dayVal = !isNaN(d.getTime()) ? (d.getDay() as DayOfWeek) : 1;
    setSelectedDay(dayVal);
    setRepeatType('weekly');
    setRepeatDays([dayVal]);
    setRepeatInterval(1);
    setRepeatEndType('never');
    setRepeatEndDate('2026-12-31');
    setRepeatCount(12);

    // Initial class selection
    const targetClassId = initialClassId || classes[0]?.id;
    if (targetClassId) {
      setSelectedClassId(targetClassId);
      setIsCustomClass(false);
      const cls = classes.find((c) => c.id === targetClassId);
      if (cls) {
        setClassName(cls.name);
        setSubject(cls.subject || 'Toán học');
        setRoom(cls.schedule?.[0]?.room || 'Phòng 201');
      }
    } else {
      setSelectedClassId('custom');
      setIsCustomClass(true);
      setClassName('Ca học mới');
      setSubject('Toán học');
      setRoom('Phòng 201');
    }
  }, [isOpen, sessionToEdit, scheduleItemToEdit, initialClassId, initialDate, initialStartTime, initialEndTime, classes]);

  // Calculate duration string e.g. "90 phút (1.5 giờ)"
  const durationText = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    let endMins = timeToMinutes(endTime);
    if (endMins <= startMins && endMins < 12 * 60 && startMins >= 11 * 60) {
      // Auto treat e.g. 11:35 to 01:00 as 11:35 to 13:00 (PM)
      endMins += 12 * 60;
    }
    const diff = endMins - startMins;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}p (${diff} phút)`;
    if (hours > 0) return `${hours} giờ`;
    return `${mins} phút`;
  }, [startTime, endTime]);

  // Real-time conflict detection with other sessions on the same date
  const conflictingSessions = useMemo(() => {
    if (!isOpen) return [];
    const effectiveDate = repeatType === 'none' && specificDate ? specificDate : (date || specificDate || initialDate || '2026-09-17');
    const startMins = timeToMinutes(startTime);
    let endMins = timeToMinutes(endTime);
    if (endMins <= startMins && endMins < 12 * 60 && startMins >= 11 * 60) {
      endMins += 12 * 60;
    }
    if (endMins <= startMins) {
      endMins = startMins + 90;
    }

    const allSessions = store.getSessions();
    const editingSessionId = sessionToEdit?.id;

    return allSessions.filter((s) => {
      // Don't compare against itself
      if (editingSessionId && s.id === editingSessionId) return false;
      // Match date
      if (s.date !== effectiveDate) return false;

      const sStart = timeToMinutes(s.startTime || '07:00');
      let sEnd = timeToMinutes(s.endTime || '08:30');
      if (sEnd <= sStart) sEnd = sStart + 90;

      // Overlap condition: StartA < EndB and EndA > StartB
      const isOverlap = startMins < sEnd && endMins > sStart;
      return isOverlap;
    });
  }, [isOpen, date, specificDate, initialDate, startTime, endTime, repeatType, sessionToEdit]);

  const handleClassSelectChange = (val: string) => {
    setSelectedClassId(val);
    if (val === 'custom') {
      setIsCustomClass(true);
      setClassName('Ca học bổ trợ');
    } else {
      setIsCustomClass(false);
      const cls = classes.find((c) => c.id === val);
      if (cls) {
        setClassName(cls.name);
        setSubject(cls.subject || 'Toán học');
        if (cls.schedule && cls.schedule.length > 0 && cls.schedule[0].room) {
          setRoom(cls.schedule[0].room);
        }
      }
    }
  };

  const handleDaySelect = (dVal: DayOfWeek) => {
    setSelectedDay(dVal);
    if (repeatType === 'weekly') {
      setRepeatDays([dVal]);
    }
  };

  const handleStartTimeChange = (val: string) => {
    const normalizedStart = normalizeTimeString(val);
    setStartTime(normalizedStart);

    // If current endTime is equal or earlier than new startTime, automatically push endTime forward by 90 minutes
    const startMins = timeToMinutes(normalizedStart);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      const newEnd = minutesToTime(startMins + 90);
      setEndTime(newEnd);
    }
  };

  const applyDurationPreset = (presetMinutes: number) => {
    const startMins = timeToMinutes(startTime);
    const newEnd = minutesToTime(startMins + presetMinutes);
    setEndTime(newEnd);
  };

  const executeSaveSession = () => {
    let finalStart = normalizeTimeString(startTime);
    let finalEnd = normalizeTimeString(endTime);

    let startMins = timeToMinutes(finalStart);
    let endMins = timeToMinutes(finalEnd);

    if (endMins <= startMins) {
      if (endMins < 12 * 60 && (endMins + 12 * 60) > startMins) {
        endMins += 12 * 60;
        finalEnd = minutesToTime(endMins);
      } else {
        endMins = startMins + 90;
        finalEnd = minutesToTime(endMins);
      }
    }

    const effectiveDate = date || specificDate || initialDate || '2026-09-17';
    const classId = isCustomClass ? undefined : selectedClassId;
    let savedScheduleItemId = scheduleItemToEdit?.id || sessionToEdit?.scheduleItemId;
    let updatedSchedule: ClassScheduleItem[] | undefined;

    // 1. Synchronize to Class's schedule if linked to a class
    if (classId) {
      const cls = store.getClassById(classId);
      if (cls) {
        const scheduleItemId = savedScheduleItemId || `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        savedScheduleItemId = scheduleItemId;

        const newScheduleItem: ClassScheduleItem = {
          id: scheduleItemId,
          dayOfWeek: selectedDay,
          startTime: finalStart,
          endTime: finalEnd,
          room: room.trim() || undefined,
          label: className.trim(),
          color,
          notes: notes.trim() || undefined,
          repeatType,
          repeatDays: repeatType === 'custom' ? repeatDays : repeatType === 'weekly' ? [selectedDay] : undefined,
          repeatInterval: repeatType === 'custom' ? repeatInterval : 1,
          repeatEndType: repeatType === 'custom' ? repeatEndType : repeatType === 'none' ? 'until_date' : 'never',
          repeatEndDate: repeatType === 'custom' && repeatEndType === 'until_date' ? repeatEndDate : undefined,
          repeatCount: repeatType === 'custom' && repeatEndType === 'after_count' ? repeatCount : undefined,
          startDate: effectiveDate,
          specificDate: repeatType === 'none' ? specificDate || effectiveDate : undefined
        };

        const existingSchedule = [...(cls.schedule || [])];
        const existingIdx = existingSchedule.findIndex((s) => s.id === scheduleItemId);
        if (existingIdx >= 0) {
          existingSchedule[existingIdx] = newScheduleItem;
        } else {
          existingSchedule.push(newScheduleItem);
        }

        store.updateClassSchedule(classId, existingSchedule);
        updatedSchedule = existingSchedule;
      }
    }

    // 2. Prepare CalendarSession payload & persist in Store
    const sessionDate = repeatType === 'none' && specificDate ? specificDate : effectiveDate;
    const sessionPayload = {
      classId,
      className: className.trim(),
      subject: subject.trim(),
      date: sessionDate,
      startTime: finalStart,
      endTime: finalEnd,
      room: room.trim() || undefined,
      color,
      notes: notes.trim() || undefined,
      repeatType,
      scheduleItemId: savedScheduleItemId
    };

    let resultSession: CalendarSession;
    if (sessionToEdit) {
      const updated = store.updateSession(sessionToEdit.id, sessionPayload);
      resultSession = updated || { ...sessionPayload, id: sessionToEdit.id, createdAt: new Date().toISOString() };
      success('Cập nhật ca học thành công', `Đã cập nhật ca ${resultSession.className} (${finalStart} - ${finalEnd})`);
    } else {
      // Add new persistent session into store
      resultSession = store.addSession(sessionPayload);

      // If weekly or recurring, also generate upcoming recurring dates for calendar display (next 6 weeks)
      if (repeatType === 'weekly' || repeatType === 'custom') {
        const baseDate = new Date(sessionDate);
        if (!isNaN(baseDate.getTime())) {
          const daysToRepeat = repeatType === 'weekly' ? [selectedDay] : repeatDays;
          for (let week = 1; week <= 6; week++) {
            for (const targetDay of daysToRepeat) {
              const recurringDate = new Date(baseDate);
              recurringDate.setDate(baseDate.getDate() + (week * 7) + (targetDay - selectedDay));
              const y = recurringDate.getFullYear();
              const m = String(recurringDate.getMonth() + 1).padStart(2, '0');
              const d = String(recurringDate.getDate()).padStart(2, '0');
              const recDateStr = `${y}-${m}-${d}`;

              store.addSession({
                ...sessionPayload,
                date: recDateStr
              });
            }
          }
        }
      }

      success(
        'Đã tạo ca học thành công!',
        `Ca học ${resultSession.className} (${finalStart} - ${finalEnd}) đã được đồng bộ vào Lịch dạy & TKB.`
      );
    }

    if (onSaved) onSaved(resultSession);
    if (onScheduleSaved && updatedSchedule) onScheduleSaved(updatedSchedule);

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalStart = normalizeTimeString(startTime);
    let finalEnd = normalizeTimeString(endTime);

    let startMins = timeToMinutes(finalStart);
    let endMins = timeToMinutes(finalEnd);

    // Smart fix: If end time is before start time, check if user meant PM (e.g. 11:35 AM to 01:00 PM -> 13:00)
    if (endMins <= startMins) {
      if (endMins < 12 * 60 && (endMins + 12 * 60) > startMins) {
        endMins += 12 * 60;
        finalEnd = minutesToTime(endMins);
      } else {
        // Auto-correct to +90 mins so user is never blocked
        endMins = startMins + 90;
        finalEnd = minutesToTime(endMins);
        info('Đã tự động căn chỉnh giờ kết thúc', `Giờ kết thúc đã được đặt thành ${finalEnd} (+90 phút).`);
      }
    }

    if (!className.trim()) {
      warning('Thiếu thông tin', 'Vui lòng nhập tên lớp hoặc ca học.');
      return;
    }

    // If there is a schedule conflict, show popup warning modal for confirmation
    if (conflictingSessions.length > 0) {
      setShowConflictPopup(true);
      return;
    }

    executeSaveSession();
  };

  const handleConfirmDelete = () => {
    let deleted = false;
    // If scheduleItemToEdit was passed
    if (scheduleItemToEdit && selectedClassId && selectedClassId !== 'custom') {
      const cls = store.getClassById(selectedClassId);
      if (cls && cls.schedule) {
        const newSched = cls.schedule.filter((s) => s.id !== scheduleItemToEdit.id);
        store.updateClassSchedule(cls.id, newSched);
        if (onScheduleSaved) onScheduleSaved(newSched);
        deleted = true;
      }
    }

    // If sessionToEdit was passed
    if (sessionToEdit) {
      store.deleteSession(sessionToEdit.id);
      if (sessionToEdit.scheduleItemId && sessionToEdit.classId) {
        const cls = store.getClassById(sessionToEdit.classId);
        if (cls && cls.schedule) {
          const newSched = cls.schedule.filter((s) => s.id !== sessionToEdit.scheduleItemId);
          store.updateClassSchedule(cls.id, newSched);
          if (onScheduleSaved) onScheduleSaved(newSched);
        }
      }
      deleted = true;
    }

    if (deleted) {
      success('Đã hủy ca học', 'Ca học đã được xóa khỏi Thời khóa biểu và Lịch dạy.');
      if (onDeleted) onDeleted(sessionToEdit?.id || scheduleItemToEdit?.id || '');
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  const isEditing = Boolean(sessionToEdit || scheduleItemToEdit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isEditing ? 'Chỉnh sửa ca học' : 'Tạo ca học mới'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span>Đồng bộ tức thì giữa Thời khóa biểu & Lịch dạy</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Class Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lớp học liên kết
              </label>
            </div>

            {lockClass ? (
              <div className="px-3.5 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl font-semibold text-slate-800 flex items-center justify-between">
                <span>{classes.find((c) => c.id === selectedClassId)?.name || 'Lớp học hiện tại'}</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">Lớp đang chọn</span>
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => handleClassSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade} - {cls.subject || 'Toán học'})
                  </option>
                ))}
                <option value="custom">-- Lớp / Ca học tự do (Tự nhập tiêu đề) --</option>
              </select>
            )}
          </div>

          {/* Session Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tên ca học / Tiêu đề <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const dayObj = DAYS_OF_WEEK.find((d) => d.value === selectedDay);
                  const cls = classes.find((c) => c.id === selectedClassId);
                  const prefix = cls ? cls.name : 'Ca học';
                  setClassName(`${prefix} - ${dayObj?.label || 'Buổi học'} (${startTime} - ${endTime})`);
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Gợi ý tên nhanh</span>
              </button>
            </div>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="VD: Toán 9A1 - Chiều thứ 4: 16h - 18h"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Start Time & End Time */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bắt đầu</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kết thúc</span>
                  </label>
                  {durationText && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      {durationText}
                    </span>
                  )}
                </div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(normalizeTimeString(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Quick Duration Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Thời lượng nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => applyDurationPreset(p.minutes)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Recurrence Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {repeatType === 'none' ? 'Ngày diễn ra' : 'Ngày bắt đầu áp dụng'}
                </label>
                <input
                  type="date"
                  value={date || specificDate || '2026-09-17'}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSpecificDate(e.target.value);
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) {
                      setSelectedDay(d.getDay() as DayOfWeek);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  required
                />
              </div>

              {/* Recurrence Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tùy chọn lặp lại
                </label>
                <select
                  value={repeatType}
                  onChange={(e) => {
                    const newType = e.target.value as ScheduleRepeatType;
                    setRepeatType(newType);
                    if (newType === 'weekly' && repeatDays.length === 0) {
                      setRepeatDays([selectedDay]);
                    }
                    if (newType === 'custom' && repeatDays.length === 0) {
                      setRepeatDays([selectedDay]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs cursor-pointer"
                >
                  <option value="weekly">
                    Hàng tuần ({DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label || 'ngày này'})
                  </option>
                  <option value="none">Chỉ 1 buổi duy nhất (Không lặp)</option>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekdays">Từ Thứ 2 đến Thứ 6</option>
                  <option value="custom">Tùy chỉnh...</option>
                </select>
              </div>
            </div>

            {/* Quick Day of Week Selector for Weekly */}
            {(repeatType === 'weekly' || repeatType === 'custom') && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {repeatType === 'weekly' ? 'Chọn thứ trong tuần:' : 'Lặp lại vào các ngày:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = repeatType === 'weekly' ? selectedDay === d.value : repeatDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          if (repeatType === 'weekly') {
                            handleDaySelect(d.value);
                          } else {
                            let newDays: DayOfWeek[];
                            if (repeatDays.includes(d.value)) {
                              newDays = repeatDays.filter((val) => val !== d.value);
                              if (newDays.length === 0) newDays = [d.value];
                            } else {
                              newDays = [...repeatDays, d.value];
                            }
                            setRepeatDays(newDays);
                            if (!newDays.includes(selectedDay)) {
                              setSelectedDay(newDays[0]);
                            }
                          }
                        }}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={d.label}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If 'custom': customize interval and ends */}
            {repeatType === 'custom' && (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span>Lặp lại mỗi:</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-sm bg-white border border-slate-300 rounded-lg text-center"
                  />
                  <span className="font-normal text-slate-500">tuần</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">Kết thúc:</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="never"
                        checked={repeatEndType === 'never'}
                        onChange={() => setRepeatEndType('never')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">Không bao giờ kết thúc</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="repeatEndType"
                          value="until_date"
                          checked={repeatEndType === 'until_date'}
                          onChange={() => setRepeatEndType('until_date')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-700">Vào ngày:</span>
                      </label>
                      <input
                        type="date"
                        value={repeatEndDate}
                        disabled={repeatEndType !== 'until_date'}
                        onChange={(e) => setRepeatEndDate(e.target.value)}
                        className={`px-2.5 py-1 text-xs border rounded-lg ${
                          repeatEndType === 'until_date'
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Màu hiển thị
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    color === c.id ? `${c.bg} border-slate-800 scale-110 shadow-xs ring-2 ring-indigo-400` : `${c.bg} border-transparent opacity-60 hover:opacity-100`
                  }`}
                  title={c.label}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú ca học (nếu có)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="VD: Kiểm tra 15 phút đầu giờ, chữa đề thi số 3..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-normal text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {isEditing ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 px-2.5 rounded-xl border border-rose-200 animate-in fade-in duration-100">
                  <span className="text-xs font-semibold text-rose-800">Xác nhận hủy ca?</span>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hủy ca này</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Lưu thay đổi' : 'Tạo ca học'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Schedule Conflict Warning Popup Modal */}
      {showConflictPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 bg-rose-50/90 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  Cảnh báo trùng lịch ca học
                </h3>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  Phát hiện {conflictingSessions.length} ca học khác bị trùng thời gian
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ca học bạn đang {isEditing ? 'cập nhật' : 'tạo'}:
                </span>
                <p className="font-extrabold text-slate-800 text-sm">
                  {className || 'Ca học mới'}
                </p>
                <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs pt-0.5">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 text-indigo-700 font-bold">
                    {startTime} - {endTime}
                  </span>
                  <span>• Ngày {date || specificDate}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Bị trùng khung giờ với các ca sau:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {conflictingSessions.map((cs) => (
                    <div
                      key={cs.id}
                      className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-rose-950 truncate">
                          {cs.className}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cs.room ? `Phòng: ${cs.room}` : 'Chưa xếp phòng'}
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-lg shrink-0 border border-rose-200">
                        {cs.startTime} - {cs.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-amber-900">
                💡 Thầy/cô có thể <strong>quay lại để đổi sang giờ khác</strong> hoặc <strong>vẫn tiếp tục tạo</strong> (trên thời gian biểu hệ thống sẽ xếp song song để tránh che khuất).
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConflictPopup(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConflictPopup(false);
                  executeSaveSession();
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Vẫn tiếp tục {isEditing ? 'lưu' : 'tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
