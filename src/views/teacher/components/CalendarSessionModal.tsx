import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Check,
  Info,
  Lock
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
  const { success, warning } = useToast();
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());

  // Form states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [subject, setSubject] = useState<string>('Toán học');
  const [date, setDate] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1);
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [room, setRoom] = useState<string>('Phòng 201');
  const [color, setColor] = useState<string>('indigo');
  const [notes, setNotes] = useState<string>('');
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

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
      setStartTime(scheduleItemToEdit.startTime);
      setEndTime(scheduleItemToEdit.endTime);
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
      setStartTime(sessionToEdit.startTime);
      setEndTime(sessionToEdit.endTime);
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
    const defaultDate = initialDate || '2026-09-17';
    const defaultStart = initialStartTime || '16:00';
    let defaultEnd = initialEndTime || '18:00';

    if (!initialEndTime) {
      const [hStr, mStr] = defaultStart.split(':');
      const startMinutes = (parseInt(hStr, 10) || 16) * 60 + (parseInt(mStr || '0', 10) || 0);
      const endMinutes = startMinutes + 120; // 2 hours
      const endH = Math.min(23, Math.floor(endMinutes / 60));
      const endM = endMinutes % 60;
      defaultEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
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

  // Calculate duration string e.g. "2 giờ" or "90 phút"
  const durationText = useMemo(() => {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '';
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}p (${diff} phút)`;
    if (hours > 0) return `${hours} giờ`;
    return `${mins} phút`;
  }, [startTime, endTime]);

  const handleClassSelectChange = (val: string) => {
    setSelectedClassId(val);
    if (val === 'custom') {
      setIsCustomClass(true);
      setClassName('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      warning('Thiếu thông tin', 'Vui lòng nhập tên lớp hoặc ca học.');
      return;
    }

    if (!date && repeatType !== 'none') {
      warning('Thiếu ngày học', 'Vui lòng chọn ngày bắt đầu cho ca học.');
      return;
    }

    if (repeatType === 'none' && !specificDate) {
      warning('Thiếu ngày học', 'Vui lòng chọn ngày diễn ra ca học.');
      return;
    }

    if (startTime >= endTime) {
      warning('Thời gian không hợp lệ', 'Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

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
          startTime,
          endTime,
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
          startDate: date,
          specificDate: repeatType === 'none' ? specificDate || date : undefined
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

    // 2. Prepare CalendarSession payload
    const sessionDate = repeatType === 'none' && specificDate ? specificDate : date;
    const sessionPayload = {
      classId,
      className: className.trim(),
      subject: subject.trim(),
      date: sessionDate,
      startTime,
      endTime,
      room: room.trim() || undefined,
      color,
      notes: notes.trim() || undefined,
      repeatType,
      scheduleItemId: savedScheduleItemId
    };

    let resultSession: CalendarSession;
    if (classId) {
      // Find the generated session corresponding to this item on this date
      const targetSession = store.getSessions().find(
        (s) => s.scheduleItemId === savedScheduleItemId && s.date === sessionDate
      ) || store.getSessions().find((s) => s.scheduleItemId === savedScheduleItemId);

      resultSession = targetSession || {
        ...sessionPayload,
        id: `sess-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      success(
        isEditing ? 'Cập nhật ca học thành công' : 'Đã thêm ca học mới',
        `Đã đồng bộ ca ${resultSession.className} vào Lịch dạy và Thời khóa biểu.`
      );
    } else {
      // Standalone session not linked to a class
      if (sessionToEdit) {
        const updated = store.updateSession(sessionToEdit.id, sessionPayload);
        resultSession = updated || { ...sessionPayload, id: sessionToEdit.id, createdAt: new Date().toISOString() };
        success('Cập nhật ca học thành công', `Đã cập nhật ca ${resultSession.className}`);
      } else {
        resultSession = store.addSession(sessionPayload);
        success('Đã thêm ca học mới', `Ca học ${resultSession.className} đã được tạo.`);
      }
    }

    if (onSaved) onSaved(resultSession);
    if (onScheduleSaved && updatedSchedule) onScheduleSaved(updatedSchedule);

    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
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
                {isEditing ? 'Chỉnh sửa ca học' : 'Thêm ca học mới'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span>Đồng bộ giữa Thời khóa biểu & Lịch dạy</span>
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
              <div className="px-3.5 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl font-semibold text-slate-800">
                <span>{classes.find((c) => c.id === selectedClassId)?.name || 'Lớp học hiện tại'}</span>
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => handleClassSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade} - {cls.subject})
                  </option>
                ))}
                <option value="custom">-- Lớp / Hoạt động khác (Tự nhập tên) --</option>
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
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Gợi ý tên tự động
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kết thúc
                </label>
                {durationText && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {durationText}
                  </span>
                )}
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                required
              />
            </div>
          </div>

          {/* Recurrence Options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tùy chọn lặp lại
            </label>

            {/* Dropdown select */}
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
              <option value="none">Không lặp lại (Chỉ diễn ra 1 lần)</option>
              <option value="weekly">
                Hàng tuần vào {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label || 'ngày này'}
              </option>
              <option value="daily">Hàng ngày</option>
              <option value="weekdays">Mỗi ngày trong tuần (Thứ Hai đến Thứ Sáu)</option>
              <option value="custom">Tùy chỉnh...</option>
            </select>

            {/* If 'none': pick specific date */}
            {repeatType === 'none' && (
              <div className="pt-2 space-y-1 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày diễn ra ca học
                </label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) {
                      setSelectedDay(d.getDay() as DayOfWeek);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Ca học này chỉ diễn ra duy nhất vào ngày được chọn, không tự động lặp lại các tuần sau.
                </p>
              </div>
            )}

            {/* If 'custom': customize interval, days, and ends */}
            {repeatType === 'custom' && (
              <div className="pt-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                {/* Repeat interval */}
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

                {/* Day toggles (T2, T3, T4...) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lặp lại vào các ngày:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = repeatDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => {
                            let newDays: DayOfWeek[];
                            if (isSelected) {
                              newDays = repeatDays.filter((val) => val !== d.value);
                              if (newDays.length === 0) newDays = [d.value];
                            } else {
                              newDays = [...repeatDays, d.value];
                            }
                            setRepeatDays(newDays);
                            if (!newDays.includes(selectedDay)) {
                              setSelectedDay(newDays[0]);
                            }
                          }}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
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

                {/* Ends condition */}
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

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="repeatEndType"
                          value="after_count"
                          checked={repeatEndType === 'after_count'}
                          onChange={() => setRepeatEndType('after_count')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-700">Sau:</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={repeatCount}
                        disabled={repeatEndType !== 'after_count'}
                        onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-16 px-2 py-1 text-xs border rounded-lg text-center ${
                          repeatEndType === 'after_count'
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      />
                      <span className="text-slate-600">buổi học</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Color Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Màu hiển thị trên lịch dạy
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    color === c.id
                      ? `${c.bg} ${c.border} text-white shadow-xs scale-102`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú buổi học (nếu có)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="VD: Kiểm tra 15 phút đầu giờ, chữa đề thi số 3..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-normal text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Synchronize indicator note */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-slate-600 text-xs">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Thông tin ca học này sẽ tự động hiển thị đồng bộ trên cả <strong>Thời khóa biểu lớp</strong> và <strong>Lịch dạy toàn trường</strong> của giáo viên.
            </span>
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
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Lưu thay đổi' : 'Tạo ca học'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
