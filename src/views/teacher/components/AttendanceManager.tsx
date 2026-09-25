import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Save,
  Download,
  UserCheck,
  MapPin
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, AttendanceRecord, ClassScheduleItem } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface AttendanceManagerProps {
  cls: ClassRoom;
  students: Student[];
  initialDate?: string;
  initialSessionName?: string;
  onGoToSchedule?: () => void;
  onEndSession?: (dateStr: string, sessionName: string) => void;
  onClose?: () => void;
}

const DAYS_OF_WEEK_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  cls,
  students,
  initialDate,
  initialSessionName,
  onGoToSchedule,
  onEndSession,
  onClose
}) => {
  const { success, info } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [sessionName, setSessionName] = useState<string>(initialSessionName || '');
  const [customSession, setCustomSession] = useState<boolean>(false);
  const [selectedScheduleItemId, setSelectedScheduleItemId] = useState<string | undefined>(undefined);

  // In-memory attendance map: studentId -> { status, note }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Filter tab status: 'all' | 'present' | 'late' | 'excused_absence' | 'unexcused_absence'
  const [filterStatus, setFilterStatus] = useState<'all' | AttendanceStatus>('all');

  // Calculate day of week for selectedDate (0: CN, 1: T2, ..., 6: T7)
  const selectedDayOfWeek = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return new Date().getDay();
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.getDay();
  }, [selectedDate]);

  // Find matching scheduled sessions for this day of week from cls.schedule (with recurrence support)
  const scheduledSessionsForDate = useMemo(() => {
    return (cls.schedule || []).filter((s) => {
      if (s.repeatType === 'none') {
        return s.specificDate === selectedDate;
      }
      if (s.repeatEndDate && selectedDate > s.repeatEndDate) {
        return false;
      }
      if (s.startDate && selectedDate < s.startDate) {
        return false;
      }
      if (s.repeatType === 'daily') {
        return true;
      }
      if (s.repeatType === 'weekdays') {
        return selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5;
      }
      if (s.repeatDays && s.repeatDays.length > 0) {
        return s.repeatDays.includes(selectedDayOfWeek);
      }
      return s.dayOfWeek === selectedDayOfWeek;
    });
  }, [cls.schedule, selectedDayOfWeek, selectedDate]);

  // Sync external initial props when provided
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialSessionName && initialSessionName !== sessionName) {
      setSessionName(initialSessionName);
    }
  }, [initialSessionName]);

  // Auto-fill session name from schedule if date changes and no existing record
  useEffect(() => {
    const existing = store.getAttendanceRecords(cls.id, selectedDate);
    if (existing.length > 0 && existing[0].sessionName) {
      setSessionName(existing[0].sessionName);
      setSelectedScheduleItemId(existing[0].scheduleItemId);
    } else {
      // Check if there is a schedule for this day
      if (scheduledSessionsForDate.length > 0) {
        const defaultItem = scheduledSessionsForDate[0];
        const label =
          defaultItem.label ||
          `${DAYS_OF_WEEK_NAMES[defaultItem.dayOfWeek]}: ${defaultItem.startTime} - ${defaultItem.endTime}${
            defaultItem.room ? ` (${defaultItem.room})` : ''
          }`;
        setSessionName(label);
        setSelectedScheduleItemId(defaultItem.id);
        setCustomSession(false);
      } else if (!sessionName || sessionName.startsWith('Tiết')) {
        setSessionName('Buổi học tăng cường / Học bù');
        setSelectedScheduleItemId(undefined);
      }
    }
  }, [selectedDate, cls.id, scheduledSessionsForDate]);

  // Load existing records for this class & date
  useEffect(() => {
    const existing = store.getAttendanceRecords(cls.id, selectedDate);
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};

    students.forEach((s) => {
      const rec = existing.find((r) => r.studentId === s.id);
      if (rec) {
        map[s.id] = { status: rec.status, note: rec.note || '' };
      } else {
        // Default to present if not marked yet
        map[s.id] = { status: 'present', note: '' };
      }
    });

    setAttendanceMap(map);
    setIsSaved(existing.length > 0);
  }, [cls.id, selectedDate, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
    setIsSaved(false);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
    setIsSaved(false);
  };

  const handleMarkAllPresent = () => {
    const nextMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach((s) => {
      nextMap[s.id] = {
        status: 'present',
        note: attendanceMap[s.id]?.note || ''
      };
    });
    setAttendanceMap(nextMap);
    setIsSaved(false);
    success('Đã chọn tất cả có mặt', 'Đã đánh dấu 100% học sinh có mặt cho buổi học này.');
  };

  const handleSave = () => {
    const payload = students.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id]?.status || 'present',
      note: attendanceMap[s.id]?.note || ''
    }));

    // Find schedule metadata if linked
    const matchedScheduleItem = (cls.schedule || []).find((s) => s.id === selectedScheduleItemId);

    store.batchSaveAttendance(
      cls.id,
      selectedDate,
      sessionName,
      payload,
      matchedScheduleItem
        ? {
            scheduleItemId: matchedScheduleItem.id,
            room: matchedScheduleItem.room,
            timeRange: `${matchedScheduleItem.startTime} - ${matchedScheduleItem.endTime}`
          }
        : undefined
    );

    setIsSaved(true);
    success(
      'Lưu điểm danh thành công',
      `Đã lưu điểm danh ngày ${selectedDate} (${sessionName})${
        matchedScheduleItem ? ' - Liên kết Thời khóa biểu lớp' : ''
      }.`
    );
  };

  const handleExportCSV = () => {
    const rows = [
      ['Họ và tên', 'Ngày', 'Tiết/Ca học', 'Trạng thái', 'Ghi chú'],
      ...students.map((s) => {
        const item = attendanceMap[s.id] || { status: 'present', note: '' };
        const statusText =
          item.status === 'present'
            ? 'Có mặt'
            : item.status === 'late'
            ? 'Đi muộn'
            : item.status === 'excused_absence'
            ? 'Nghỉ có phép'
            : 'Vắng không phép';
        return [s.fullName, selectedDate, sessionName, statusText, item.note];
      })
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DiemDanh_${cls.name.replace(/\s+/g, '_')}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('Đã xuất báo cáo', 'Tệp CSV điểm danh đã được tải xuống.');
  };

  // Stats calculation
  const total = students.length;
  const attendanceItems = Object.values(attendanceMap) as Array<{ status: AttendanceStatus; note: string }>;
  const presentCount = attendanceItems.filter((v) => v.status === 'present').length;
  const lateCount = attendanceItems.filter((v) => v.status === 'late').length;
  const excusedCount = attendanceItems.filter((v) => v.status === 'excused_absence').length;
  const unexcusedCount = attendanceItems.filter((v) => v.status === 'unexcused_absence').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount * 0.8) / total) * 100) : 100;

  // Filter students based on active filter tab
  const filteredStudents = useMemo(() => {
    if (filterStatus === 'all') return students;
    return students.filter((st) => {
      const status = attendanceMap[st.id]?.status || 'present';
      return status === filterStatus;
    });
  }, [students, attendanceMap, filterStatus]);

  // Active matched schedule session
  const activeMatchedSession = (cls.schedule || []).find((s) => s.id === selectedScheduleItemId);

  return (
    <div id="attendance-manager" className="space-y-4 font-sans">
      {/* 1. SUMMARY KPI COUNTERS BANNER (Interactive Filters) - ON TOP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`p-3.5 bg-[#FFFDF9] rounded-2xl border transition-all cursor-pointer text-left ${
            filterStatus === 'all'
              ? 'border-[#B68176] ring-2 ring-[#B68176]/30 shadow-sm'
              : 'border-[#EFE3DD] hover:border-[#B68176]/50 shadow-xs'
          }`}
        >
          <div className="text-[11px] text-[#9A8A85] font-semibold">Sĩ số lớp (Tất cả)</div>
          <div className="text-xl font-bold font-mono text-[#5C453C] mt-1">{total} học sinh</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('present')}
          className={`p-3.5 bg-emerald-50/70 rounded-2xl border transition-all cursor-pointer text-left ${
            filterStatus === 'present'
              ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-sm'
              : 'border-emerald-200 hover:border-emerald-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Có mặt
            </span>
            <span className="text-xs font-extrabold text-emerald-800 font-mono">
              {total > 0 ? Math.round((presentCount / total) * 100) : 0}%
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-900 mt-1">{presentCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('late')}
          className={`p-3.5 bg-amber-50/70 rounded-2xl border transition-all cursor-pointer text-left ${
            filterStatus === 'late'
              ? 'border-amber-500 ring-2 ring-amber-400/30 shadow-sm'
              : 'border-amber-200 hover:border-amber-400 shadow-xs'
          }`}
        >
          <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Đi muộn
          </div>
          <div className="text-xl font-black font-mono text-amber-900 mt-1">{lateCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('excused_absence')}
          className={`p-3.5 bg-[#F5F0EA] rounded-2xl border transition-all cursor-pointer text-left ${
            filterStatus === 'excused_absence'
              ? 'border-[#5C453C] ring-2 ring-[#5C453C]/30 shadow-sm'
              : 'border-[#EFE3DD] hover:border-[#5C453C]/40 shadow-xs'
          }`}
        >
          <div className="text-[11px] text-[#5C453C] font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#9A8A85]" /> Nghỉ có phép
          </div>
          <div className="text-xl font-black font-mono text-[#5C453C] mt-1">{excusedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('unexcused_absence')}
          className={`p-3.5 bg-[#F9EAEA] rounded-2xl border transition-all cursor-pointer text-left col-span-2 sm:col-span-1 ${
            filterStatus === 'unexcused_absence'
              ? 'border-[#B68176] ring-2 ring-[#B68176]/30 shadow-sm'
              : 'border-[#F0D5D0] hover:border-[#B68176]/50 shadow-xs'
          }`}
        >
          <div className="text-[11px] text-[#B68176] font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-[#B68176]" /> Vắng K.Phép
          </div>
          <div className="text-xl font-black font-mono text-[#B68176] mt-1">{unexcusedCount}</div>
        </button>
      </div>

      {/* 2. TIMETABLE LINK STATUS BANNER FOR SELECTED DATE - SECOND */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
          scheduledSessionsForDate.length > 0
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            : 'bg-[#F9EAEA]/50 border-[#F0D5D0] text-[#5C453C]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              scheduledSessionsForDate.length > 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-[#F5F0EA] text-[#9A8A85]'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">
                {DAYS_OF_WEEK_NAMES[selectedDayOfWeek]}, ngày {selectedDate}
              </span>
            </div>

            <div className="text-[11px] mt-0.5 text-slate-600 flex items-center gap-3 flex-wrap">
              {scheduledSessionsForDate.length > 0 ? (
                <>
                  <span>
                    Ca học theo TKB:{' '}
                    <strong className="text-slate-800">
                      {activeMatchedSession?.label || scheduledSessionsForDate[0].label || `${scheduledSessionsForDate[0].startTime} - ${scheduledSessionsForDate[0].endTime}`}
                    </strong>
                  </span>
                  {scheduledSessionsForDate[0].room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{scheduledSessionsForDate[0].room}</span>
                    </span>
                  )}
                </>
              ) : (
                <span>
                  Ngày này lớp không có ca học định kỳ trong tuần. Điểm danh sẽ được ghi nhận là buổi học tăng cường hoặc học bù.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions for timetable */}
        {scheduledSessionsForDate.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-medium text-slate-500">Chọn ca:</span>
            {scheduledSessionsForDate.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedScheduleItemId(s.id);
                  setSessionName(s.label || `${DAYS_OF_WEEK_NAMES[s.dayOfWeek]}: ${s.startTime} - ${s.endTime}`);
                  setIsSaved(false);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedScheduleItemId === s.id
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Ca {idx + 1} ({s.startTime})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. ACTION BUTTONS (Tất cả có mặt, Xuất CSV, Lưu điểm danh, Kết thúc buổi học) */}
      <div className="flex items-center justify-end gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={handleMarkAllPresent}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
          title="Đánh dấu tất cả học sinh có mặt"
        >
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Tất cả có mặt</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5F0EA] text-[#5C453C] text-xs font-semibold rounded-xl transition-colors border border-[#EFE3DD] cursor-pointer shadow-2xs"
          title="Xuất bảng điểm danh CSV"
        >
          <Download className="w-4 h-4 text-[#9A8A85]" />
          <span>Xuất CSV</span>
        </button>

        <button
          id="btn-save-attendance"
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
            !isSaved
              ? 'bg-[#B68176] hover:bg-[#A37066] text-white animate-pulse'
              : 'bg-[#5C453C] hover:bg-[#4A3730] text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'Đã lưu' : 'Lưu điểm danh'}</span>
        </button>
      </div>

      {/* 5. ATTENDANCE TABLE */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EFE3DD] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-[#5C453C] text-sm">
              Danh sách điểm danh ({filteredStudents.length}/{students.length} học sinh)
            </h3>
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F0EA] text-[#5C453C] border border-[#EFE3DD]">
                Đang lọc:{' '}
                {filterStatus === 'present'
                  ? 'Có mặt'
                  : filterStatus === 'late'
                  ? 'Đi muộn'
                  : filterStatus === 'excused_absence'
                  ? 'Nghỉ có phép'
                  : 'Vắng không phép'}
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="ml-1 text-[#9A8A85] hover:text-red-600 font-bold cursor-pointer"
                  title="Bỏ lọc"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="text-xs text-[#9A8A85] font-semibold">
            Tỷ lệ chuyên cần ngày:{' '}
            <span className="font-extrabold text-emerald-700 font-mono">{attendanceRate}%</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F0EA] border-b border-[#EFE3DD] text-[#5C453C] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 pl-4 w-12 text-center">STT</th>
                <th className="py-3 min-w-[180px]">Họ và tên</th>
                <th className="py-3 min-w-[320px] text-center">Trạng thái điểm danh</th>
                <th className="py-3 pr-4 min-w-[200px]">Ghi chú & Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE3DD]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#9A8A85]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-sm font-semibold text-[#5C453C]">
                        Không có học sinh nào{' '}
                        {filterStatus === 'present'
                          ? 'có mặt'
                          : filterStatus === 'late'
                          ? 'đi muộn'
                          : filterStatus === 'excused_absence'
                          ? 'nghỉ có phép'
                          : 'vắng không phép'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className="text-xs text-[#B68176] font-bold hover:underline cursor-pointer"
                      >
                        ← Xem lại toàn bộ học sinh
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                const currentStatus = attendanceMap[st.id]?.status || 'present';
                const currentNote = attendanceMap[st.id]?.note || '';

                return (
                  <tr key={st.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                    <td className="py-3 pl-4 text-center text-[#9A8A85] font-semibold">{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F9EAEA] text-[#B68176] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#F0D5D0]">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#5C453C]">{st.fullName}</div>
                          <div className="text-[11px] text-[#9A8A85]">{st.phone || st.email || 'Học sinh'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Segmented Attendance Buttons */}
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center p-1 bg-[#F5F0EA] rounded-xl gap-1 border border-[#EFE3DD]">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'present')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-[#5C453C] hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Có mặt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'late')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-[#5C453C] hover:text-amber-800 hover:bg-amber-50'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Muộn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'excused_absence')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'excused_absence'
                              ? 'bg-[#5C453C] text-white shadow-xs'
                              : 'text-[#5C453C] hover:text-[#4A3730] hover:bg-[#EFE3DD]'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Có phép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.id, 'unexcused_absence')}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'unexcused_absence'
                              ? 'bg-[#B68176] text-white shadow-xs'
                              : 'text-[#5C453C] hover:text-[#B68176] hover:bg-[#F9EAEA]'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Vắng</span>
                        </button>
                      </div>
                    </td>

                    {/* Note input */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ghi chú (nghỉ ốm, vào muộn 15p...)"
                          value={currentNote}
                          onChange={(e) => handleNoteChange(st.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-transparent border border-transparent hover:border-[#EFE3DD] focus:border-[#B68176] focus:bg-white rounded-lg text-xs text-[#5C453C] outline-hidden transition-all"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
