import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Paperclip,
  Send,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  MapPin,
  ExternalLink,
  BookOpen,
  X,
  Sparkles,
  Download,
  AlertCircle,
  Ban,
  RotateCcw,
  UserCheck,
  CalendarDays,
  Check
} from 'lucide-react';
import { ClassRoom, ClassScheduleItem, ClassTeachingSession, SessionMaterialItem } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';
import { CalendarSessionModal } from './CalendarSessionModal';

export type TeachingSessionStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface ScheduleManagerProps {
  cls: ClassRoom;
  onOpenReportModal?: () => void;
  onTakeAttendance?: (dateStr: string, sessionLabel: string) => void;
  onAssignExam?: (session?: ClassTeachingSession) => void;
}

const DAYS_OF_WEEK_NAMES: Record<number, string> = {
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
  0: 'Chủ nhật'
};

// Formats a date YYYY-MM-DD to "Thứ tư, 12/08/2026"
export const formatSessionDateVN = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    const dayName = DAYS_OF_WEEK_NAMES[dayOfWeek] || 'Thứ ?';
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${dayName}, ${dd}/${mm}/${year}`;
  } catch {
    return dateStr;
  }
};

export const getTeachingSessionStatus = (
  session: ClassTeachingSession,
  _hasAttendance?: boolean
): { type: TeachingSessionStatus; label: string; badgeColor: string } => {
  if (session.status === 'cancelled') {
    return {
      type: 'cancelled',
      label: 'Đã huỷ',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  // Dynamic real-time calculation based on session date and time
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = String(now.getMonth() + 1).padStart(2, '0');
  const curDate = String(now.getDate()).padStart(2, '0');
  const todayStr = `${curYear}-${curMonth}-${curDate}`;
  const curMinutes = now.getHours() * 60 + now.getMinutes();

  if (session.date < todayStr) {
    return {
      type: 'completed',
      label: 'Đã dạy',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  if (session.date > todayStr) {
    return {
      type: 'upcoming',
      label: 'Sắp tới',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }

  // Same day (session.date === todayStr)
  if (session.startTime && session.endTime) {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (curMinutes >= startMinutes && curMinutes <= endMinutes) {
      return {
        type: 'ongoing',
        label: 'Đang diễn ra',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (curMinutes > endMinutes) {
      return {
        type: 'completed',
        label: 'Đã dạy',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    }
    return {
      type: 'upcoming',
      label: 'Sắp tới',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  }

  return {
    type: 'upcoming',
    label: 'Sắp tới',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  };
};

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  cls,
  onTakeAttendance,
  onAssignExam
}) => {
  const { success, info } = useToast();
  const { themeConfig } = useTheme();

  // Storage key for class teaching sessions
  const storageKey = `ako_teaching_sessions_${cls.id}`;

  // Initial seed sessions generator based on class metadata
  const getInitialSessions = (): ClassTeachingSession[] => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s) => ({
            ...s,
            status: s.status || (s.attendanceDone ? 'completed' : 'upcoming')
          }));
        }
      }
    } catch {
      // ignore
    }

    const teacher = store.getTeacher();
    const teacherName = teacher?.fullName || 'Vũ Văn Thương';

    // Default realistic seed sessions matching schedule structure
    return [
      {
        id: `ts-${cls.id}-1`,
        classId: cls.id,
        date: '2026-08-12',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Khái niệm & Định nghĩa căn bậc hai số học',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-2`,
        classId: cls.id,
        date: '2026-08-12',
        dayOfWeek: 3,
        shift: '3 - 3',
        startTime: '09:15',
        endTime: '10:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Luyện tập điều kiện xác định của căn thức bậc hai',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-3`,
        classId: cls.id,
        date: '2026-08-19',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Liên hệ giữa phép nhân và phép khai phương',
        attendanceDone: true,
        status: 'completed',
        materials: [
          { id: 'm-1', title: 'Phiếu học tập bài 2.pdf', type: 'pdf', fileSize: '1.4 MB' }
        ]
      },
      {
        id: `ts-${cls.id}-4`,
        classId: cls.id,
        date: '2026-08-19',
        dayOfWeek: 3,
        shift: '3 - 3',
        startTime: '09:15',
        endTime: '10:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Chữa bài tập khai phương một tích & bài toán thực tế',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-5`,
        classId: cls.id,
        date: '2026-08-26',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Liên hệ giữa phép chia và phép khai phương',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-6`,
        classId: cls.id,
        date: '2026-08-26',
        dayOfWeek: 3,
        shift: '3 - 3',
        startTime: '09:15',
        endTime: '10:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Biến đổi đơn giản biểu thức chứa căn thức bậc hai',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-7`,
        classId: cls.id,
        date: '2026-09-02',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName: 'Chưa cập nhật',
        title: 'Rút gọn biểu thức chứa căn bậc hai nâng cao',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-8`,
        classId: cls.id,
        date: '2026-09-02',
        dayOfWeek: 3,
        shift: '3 - 3',
        startTime: '09:15',
        endTime: '10:00',
        room: '102_HQV',
        format: 'offline',
        teacherName: 'Chưa cập nhật',
        title: 'Luyện đề trắc nghiệm tổng hợp chương I',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-9`,
        classId: cls.id,
        date: '2026-09-09',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Chương II: Nhắc lại và bổ sung về hàm số y = ax + b',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-10`,
        classId: cls.id,
        date: '2026-09-16',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Hàm số bậc nhất và tính chất đồng biến, nghịch biến',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-11`,
        classId: cls.id,
        date: '2026-09-23',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Đồ thị của hàm số y = ax + b (a ≠ 0)',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-12`,
        classId: cls.id,
        date: '2026-09-23',
        dayOfWeek: 3,
        shift: '13 - 14',
        startTime: '19:30',
        endTime: '21:00',
        room: 'ONL_HQV',
        format: 'online',
        teacherName: 'Chưa cập nhật',
        title: 'Phụ đạo trực tuyến: Phương pháp giải nhanh bài toán đồ thị',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      },
      {
        id: `ts-${cls.id}-13`,
        classId: cls.id,
        date: '2026-09-30',
        dayOfWeek: 3,
        shift: '1 - 2',
        startTime: '07:30',
        endTime: '09:00',
        room: '102_HQV',
        format: 'offline',
        teacherName,
        title: 'Đường thẳng song song và đường thẳng cắt nhau',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      }
    ];
  };

  const ALL_STATUSES: TeachingSessionStatus[] = ['ongoing', 'upcoming', 'completed', 'cancelled'];

  const [sessions, setSessions] = useState<ClassTeachingSession[]>(getInitialSessions);
  const [searchQuery, setSearchQuery] = useState('');
  // Status checkbox multi-select filter (auto-ticked: ongoing and upcoming)
  const [selectedStatuses, setSelectedStatuses] = useState<TeachingSessionStatus[]>(['ongoing', 'upcoming']);
  const [formatFilter, setFormatFilter] = useState<'all' | 'offline' | 'online'>('all');

  const toggleStatusFilter = (st: TeachingSessionStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(st)) {
        return prev.filter((item) => item !== st);
      } else {
        return [...prev, st];
      }
    });
  };

  const toggleAllStatuses = () => {
    if (selectedStatuses.length === ALL_STATUSES.length) {
      setSelectedStatuses(['ongoing', 'upcoming']);
    } else {
      setSelectedStatuses([...ALL_STATUSES]);
    }
  };

  // Time Range Filter: 'all' | 'month' | 'custom_range'
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [timeRangeMode, setTimeRangeMode] = useState<'all' | 'month' | 'custom_range'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Unique list of available months in data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    sessions.forEach((s) => {
      if (s.date && s.date.length >= 7) {
        months.add(s.date.substring(0, 7));
      }
    });
    return Array.from(months).sort();
  }, [sessions, currentMonthStr]);

  const formatMonthLabel = (monthKey: string) => {
    const parts = monthKey.split('-');
    if (parts.length === 2) {
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
    return monthKey;
  };

  // Modal states
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeSessionForAttach, setActiveSessionForAttach] = useState<ClassTeachingSession | null>(null);

  // Calendar Modal states
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarSessionToEdit, setCalendarSessionToEdit] = useState<CalendarSession | null>(null);

  // Attach materials form state
  const [customMaterialTitle, setCustomMaterialTitle] = useState('');
  const [customMaterialUrl, setCustomMaterialUrl] = useState('');
  const [customMaterialType, setCustomMaterialType] = useState('pdf');

  // Weekly recurring schedule toggle & modal
  const [showWeeklySettings, setShowWeeklySettings] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(cls.schedule || []);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ClassScheduleItem | null>(null);

  // Save sessions to localStorage whenever changed
  const saveSessions = (updated: ClassTeachingSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Sync with store when class schedule changes
  useEffect(() => {
    const handleUpdate = () => {
      const updatedCls = store.getClassById(cls.id);
      if (updatedCls && updatedCls.schedule) {
        setSchedule(updatedCls.schedule);
      }
    };
    const unsub = store.subscribe(handleUpdate);
    return unsub;
  }, [cls.id]);

  // Sync sessions when updated from attendance or other components
  useEffect(() => {
    const handleReload = () => {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setSessions(
              parsed.map((s) => ({
                ...s,
                status: s.status || (s.attendanceDone ? 'completed' : 'upcoming')
              }))
            );
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleReload);
    window.addEventListener('ako_session_updated', handleReload);
    return () => {
      window.removeEventListener('storage', handleReload);
      window.removeEventListener('ako_session_updated', handleReload);
    };
  }, [storageKey]);

  const handleOpenAttendanceForSession = (session: ClassTeachingSession) => {
    const sessionLabel = `${formatSessionDateVN(session.date)}${
      session.startTime ? ` (${session.startTime} - ${session.endTime})` : ''
    }`;
    if (onTakeAttendance) {
      onTakeAttendance(session.date, sessionLabel);
    }
  };

  // Documents from teacher document repository
  const availableDocuments = useMemo(() => store.getDocuments(), []);

  // Filtered and Sorted Sessions
  const filteredSessions = useMemo(() => {
    const list = sessions.filter((s) => {
      const hasAttendance = s.attendanceDone || store.getAttendanceRecords(cls.id, s.date).length > 0;
      const statusInfo = getTeachingSessionStatus(s, hasAttendance);

      // 1. Time Range Filter
      if (timeRangeMode === 'month') {
        if (selectedMonth && selectedMonth !== 'all') {
          const m = s.date.split('-')[1];
          if (m !== selectedMonth && parseInt(m, 10) !== parseInt(selectedMonth, 10)) {
            return false;
          }
        }
      } else if (timeRangeMode === 'custom_range') {
        if (startDate && s.date < startDate) {
          return false;
        }
        if (endDate && s.date > endDate) {
          return false;
        }
      }

      // 2. Status Checkbox Filter (Multi-select)
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(statusInfo.type)) {
          return false;
        }
      } else {
        // If no status is selected, list is empty
        return false;
      }

      // Format filter
      if (formatFilter !== 'all' && s.format !== formatFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const dateVN = formatSessionDateVN(s.date).toLowerCase();
      const room = (s.room || '').toLowerCase();
      const title = (s.title || '').toLowerCase();
      const teacher = (s.teacherName || '').toLowerCase();
      const shift = (s.shift || '').toLowerCase();

      return (
        dateVN.includes(q) ||
        s.date.includes(q) ||
        room.includes(q) ||
        title.includes(q) ||
        teacher.includes(q) ||
        shift.includes(q)
      );
    });

    // Sort priority:
    // 1. ongoing (Đang diễn ra) first (xếp 1)
    // 2. upcoming (Sắp tới) chronologically from closest to furthest (timeline ascending)
    // 3. completed (Đã dạy)
    // 4. cancelled (Đã huỷ)
    return list.sort((a, b) => {
      const hasAttA = a.attendanceDone || store.getAttendanceRecords(cls.id, a.date).length > 0;
      const hasAttB = b.attendanceDone || store.getAttendanceRecords(cls.id, b.date).length > 0;
      const stA = getTeachingSessionStatus(a, hasAttA);
      const stB = getTeachingSessionStatus(b, hasAttB);

      const rank = (type: TeachingSessionStatus) => {
        switch (type) {
          case 'ongoing': return 0;
          case 'upcoming': return 1;
          case 'completed': return 2;
          case 'cancelled': return 3;
          default: return 4;
        }
      };

      const rankA = rank(stA.type);
      const rankB = rank(stB.type);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Within ongoing & upcoming: sort chronologically from closest to furthest
      if (rankA === 0 || rankA === 1) {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return (a.startTime || '').localeCompare(b.startTime || '');
      }

      // Within completed & cancelled: sort chronologically
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [sessions, timeRangeMode, currentMonthStr, selectedMonth, startDate, endDate, selectedStatuses, formatFilter, searchQuery, cls.id]);

  // Status Counts calculated for the current Time Range filter
  const statusCounts = useMemo(() => {
    const listInTimeRange = sessions.filter((s) => {
      if (timeRangeMode === 'month') {
        if (selectedMonth && selectedMonth !== 'all') {
          const m = s.date.split('-')[1];
          return m === selectedMonth || parseInt(m, 10) === parseInt(selectedMonth, 10);
        }
        return true;
      }
      if (timeRangeMode === 'custom_range') {
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        return true;
      }
      return true;
    });

    const counts = { all: listInTimeRange.length, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 };
    listInTimeRange.forEach((s) => {
      const hasAtt = s.attendanceDone || store.getAttendanceRecords(cls.id, s.date).length > 0;
      const st = getTeachingSessionStatus(s, hasAtt);
      counts[st.type]++;
    });
    return counts;
  }, [sessions, timeRangeMode, currentMonthStr, selectedMonth, startDate, endDate, cls.id]);

  // Quick toggle session status between cancelled & upcoming
  const handleToggleCancelSession = (session: ClassTeachingSession) => {
    const isCancelled = session.status === 'cancelled';
    const nextStatus: TeachingSessionStatus = isCancelled ? 'upcoming' : 'cancelled';
    const updated = sessions.map((s) => (s.id === session.id ? { ...s, status: nextStatus } : s));
    saveSessions(updated);
    if (isCancelled) {
      success('Đã khôi phục ca học');
    } else {
      info('Đã chuyển trạng thái ca học sang Đã huỷ');
    }
  };

  // Handler: Open Add session (synchronized with CalendarSessionModal)
  const handleOpenAddSession = () => {
    setCalendarSessionToEdit(null);
    setCalendarModalOpen(true);
  };

  // Handler: Open Edit session (synchronized with CalendarSessionModal)
  const handleOpenEditSession = (session: ClassTeachingSession) => {
    const existingCalSession = store.getSessions().find(
      (cs) => cs.id === session.id || (cs.classId === cls.id && cs.date === session.date && cs.startTime === session.startTime)
    );

    const calSession: CalendarSession = existingCalSession || {
      id: session.id,
      classId: cls.id,
      className: session.title || cls.name,
      subject: cls.subject || 'Toán học',
      date: session.date,
      startTime: session.startTime || '07:30',
      endTime: session.endTime || '09:00',
      room: session.room || '102_HQV',
      color: 'indigo',
      notes: session.notes || '',
      repeatType: 'none'
    };

    setCalendarSessionToEdit(calSession);
    setCalendarModalOpen(true);
  };

  // Handler: When saved in CalendarSessionModal
  const handleCalendarSaved = (savedSession: CalendarSession) => {
    const existingIdx = sessions.findIndex(
      (s) => s.id === savedSession.id || (s.date === savedSession.date && s.startTime === savedSession.startTime)
    );

    if (existingIdx >= 0) {
      const updated = [...sessions];
      updated[existingIdx] = {
        ...updated[existingIdx],
        date: savedSession.date,
        startTime: savedSession.startTime,
        endTime: savedSession.endTime,
        room: savedSession.room || updated[existingIdx].room,
        title: savedSession.className || updated[existingIdx].title,
        notes: savedSession.notes || updated[existingIdx].notes
      };
      saveSessions(updated);
    } else {
      const newTeachingSession: ClassTeachingSession = {
        id: savedSession.id,
        classId: cls.id,
        date: savedSession.date,
        dayOfWeek: new Date(savedSession.date).getDay(),
        shift: '1 - 2',
        startTime: savedSession.startTime,
        endTime: savedSession.endTime,
        room: savedSession.room || '102_HQV',
        format: 'offline',
        teacherName: store.getTeacher()?.fullName || 'Vũ Văn Thương',
        title: savedSession.className || 'Ca học mới',
        notes: savedSession.notes || '',
        attendanceDone: false,
        status: 'upcoming',
        materials: []
      };
      saveSessions([...sessions, newTeachingSession]);
    }
  };

  const handleCalendarDeleted = (deletedId: string) => {
    const updated = sessions.filter((s) => s.id !== deletedId);
    saveSessions(updated);
  };

  // Handler: Delete Session
  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa buổi dạy này khỏi danh sách lịch dạy?')) {
      const updated = sessions.filter((s) => s.id !== sessionId);
      saveSessions(updated);
      success('Đã xóa buổi dạy thành công');
    }
  };

  // Handler: Open Attach Material Modal
  const handleOpenAttachModal = (session: ClassTeachingSession) => {
    setActiveSessionForAttach(session);
    setCustomMaterialTitle('');
    setCustomMaterialUrl('');
    setCustomMaterialType('pdf');
    setShowAttachModal(true);
  };

  // Handler: Toggle document from library
  const handleToggleLibraryDoc = (docTitle: string, docType?: string, docSize?: string) => {
    if (!activeSessionForAttach) return;

    const currentMaterials = activeSessionForAttach.materials || [];
    const exists = currentMaterials.some((m) => m.title === docTitle);

    let updatedMaterials: SessionMaterialItem[];
    if (exists) {
      updatedMaterials = currentMaterials.filter((m) => m.title !== docTitle);
    } else {
      updatedMaterials = [
        ...currentMaterials,
        {
          id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: docTitle,
          type: docType || 'pdf',
          fileSize: docSize || '2.0 MB'
        }
      ];
    }

    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionForAttach.id) {
        return { ...s, materials: updatedMaterials };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setActiveSessionForAttach({ ...activeSessionForAttach, materials: updatedMaterials });
    success(exists ? 'Đã gỡ tài liệu khỏi buổi học' : 'Đã gắn tài liệu học tập vào buổi dạy');
  };

  // Handler: Add custom material
  const handleAddCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionForAttach || !customMaterialTitle.trim()) return;

    const newMat: SessionMaterialItem = {
      id: `mat-${Date.now()}`,
      title: customMaterialTitle.trim(),
      url: customMaterialUrl.trim() || undefined,
      type: customMaterialType,
      fileSize: '1.5 MB'
    };

    const updatedMaterials = [...(activeSessionForAttach.materials || []), newMat];
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionForAttach.id) {
        return { ...s, materials: updatedMaterials };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setActiveSessionForAttach({ ...activeSessionForAttach, materials: updatedMaterials });
    setCustomMaterialTitle('');
    setCustomMaterialUrl('');
    success('Đã thêm tài liệu học tập mới vào buổi dạy');
  };

  // Handler: Remove material from session
  const handleRemoveMaterial = (matId: string) => {
    if (!activeSessionForAttach) return;

    const updatedMaterials = (activeSessionForAttach.materials || []).filter((m) => m.id !== matId);
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionForAttach.id) {
        return { ...s, materials: updatedMaterials };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setActiveSessionForAttach({ ...activeSessionForAttach, materials: updatedMaterials });
    info('Đã xóa tài liệu');
  };

  // Auto-generate from weekly recurring schedule
  const handleAutoGenerateFromSchedule = () => {
    if (schedule.length === 0) {
      alert('Chưa có ca học cố định nào trong TKB để sinh lịch. Vui lòng thêm ca học cố định trước.');
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0..11
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const newSessions: ClassTeachingSession[] = [];
    const teacher = store.getTeacher();
    const teacherName = teacher?.fullName || 'Vũ Văn Thương';

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dayOfWeek = d.getDay();
      const dd = String(day).padStart(2, '0');
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;

      const matched = schedule.filter((s) => s.dayOfWeek === dayOfWeek);
      matched.forEach((s, idx) => {
        newSessions.push({
          id: `gen-${cls.id}-${dateStr}-${idx}`,
          classId: cls.id,
          date: dateStr,
          dayOfWeek,
          shift: s.label || `Ca ${idx + 1} (${s.startTime} - ${s.endTime})`,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room || '102_HQV',
          format: 'offline',
          teacherName,
          title: `Buổi học ngày ${dd}/${mm}`,
          attendanceDone: false,
          materials: []
        });
      });
    }

    if (newSessions.length === 0) {
      info('Không tìm thấy ngày học phù hợp trong tháng này');
      return;
    }

    // Merge without duplicates
    const existingDates = new Set(sessions.map((s) => `${s.date}_${s.shift}`));
    const filteredNew = newSessions.filter((s) => !existingDates.has(`${s.date}_${s.shift}`));

    const merged = [...sessions, ...filteredNew].sort((a, b) => a.date.localeCompare(b.date));
    saveSessions(merged);
    success(`Đã tự động bổ sung ${filteredNew.length} buổi học mới theo thời khóa biểu cố định`);
  };

  return (
    <div id="teaching-schedule-container" className="space-y-5">
      {/* Top Header & Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                Lịch dạy lớp {cls.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý chi tiết từng buổi học, theo dõi 4 trạng thái giảng dạy, điểm danh và học liệu
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ca học</span>
          </button>
        </div>

        {/* 2 Filter Bars: 1. Time Range (Chia rõ 2 kiểu: Theo tháng & Từ ngày đến ngày) & 2. Trạng thái */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          {/* Bộ lọc 1: Khoảng thời gian (Time Range) chia thành 2 kiểu rõ ràng */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Thời gian:</span>
            </span>

            {/* Kiểu 1: Chọn Tất cả hoặc theo Tháng (Tháng 1 - Tháng 12) */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={timeRangeMode === 'month' ? selectedMonth : 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setTimeRangeMode('all');
                    setSelectedMonth('all');
                  } else {
                    setTimeRangeMode('month');
                    setSelectedMonth(val);
                  }
                }}
                className={`text-xs font-bold py-1.5 px-3 rounded-xl border outline-hidden cursor-pointer shadow-2xs transition-all ${
                  timeRangeMode === 'all' || timeRangeMode === 'month'
                    ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="all">Tất cả</option>
                <option value="01">Tháng 1</option>
                <option value="02">Tháng 2</option>
                <option value="03">Tháng 3</option>
                <option value="04">Tháng 4</option>
                <option value="05">Tháng 5</option>
                <option value="06">Tháng 6</option>
                <option value="07">Tháng 7</option>
                <option value="08">Tháng 8</option>
                <option value="09">Tháng 9</option>
                <option value="10">Tháng 10</option>
                <option value="11">Tháng 11</option>
                <option value="12">Tháng 12</option>
              </select>
            </div>

            {/* Kiểu 2: Lọc theo khoảng ngày (Từ ngày - Đến ngày) */}
            <div className={`flex flex-wrap items-center gap-2 p-1 px-2.5 rounded-xl border text-xs transition-all ${
              timeRangeMode === 'custom_range'
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-slate-100/80 border-slate-200/80'
            }`}>
              <button
                type="button"
                onClick={() => setTimeRangeMode('custom_range')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRangeMode === 'custom_range'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200/60'
                }`}
              >
                Từ ngày đến ngày
              </button>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 font-medium">Từ:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setTimeRangeMode('custom_range');
                      setStartDate(e.target.value);
                    }}
                    onFocus={() => setTimeRangeMode('custom_range')}
                    className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-hidden cursor-pointer focus:border-blue-400"
                  />
                </div>
                <span className="text-slate-400 font-bold">-</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 font-medium">Đến:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setTimeRangeMode('custom_range');
                      setEndDate(e.target.value);
                    }}
                    onFocus={() => setTimeRangeMode('custom_range')}
                    className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-hidden cursor-pointer focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bộ lọc 2: Trạng thái (Status Filter dạng Checkbox, auto-tick Đang diễn ra & Sắp tới, có hiệu ứng phát sáng) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold pt-2 border-t border-slate-100">
            <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Trạng thái:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 1. Đang diễn ra (Xếp 1) */}
              <button
                type="button"
                onClick={() => toggleStatusFilter('ongoing')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  selectedStatuses.includes('ongoing')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/25 scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    selectedStatuses.includes('ongoing')
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {selectedStatuses.includes('ongoing') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Đang diễn ra</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedStatuses.includes('ongoing')
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statusCounts.ongoing}
                </span>
              </button>

              {/* 2. Sắp tới */}
              <button
                type="button"
                onClick={() => toggleStatusFilter('upcoming')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  selectedStatuses.includes('upcoming')
                    ? 'bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-400/50 shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    selectedStatuses.includes('upcoming')
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {selectedStatuses.includes('upcoming') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Sắp tới</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedStatuses.includes('upcoming')
                      ? 'bg-blue-200/80 text-blue-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statusCounts.upcoming}
                </span>
              </button>

              {/* 3. Đã dạy */}
              <button
                type="button"
                onClick={() => toggleStatusFilter('completed')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  selectedStatuses.includes('completed')
                    ? 'bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-400/50 shadow-md shadow-slate-400/25 scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    selectedStatuses.includes('completed')
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {selectedStatuses.includes('completed') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Đã dạy</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedStatuses.includes('completed')
                      ? 'bg-slate-300/80 text-slate-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statusCounts.completed}
                </span>
              </button>

              {/* 4. Đã huỷ */}
              <button
                type="button"
                onClick={() => toggleStatusFilter('cancelled')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  selectedStatuses.includes('cancelled')
                    ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-400/50 shadow-md shadow-rose-500/25 scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    selectedStatuses.includes('cancelled')
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {selectedStatuses.includes('cancelled') && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Đã huỷ</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedStatuses.includes('cancelled')
                      ? 'bg-rose-200/80 text-rose-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statusCounts.cancelled}
                </span>
              </button>

              {/* 5. Tất cả (Dưới cùng / Cuối cùng) */}
              <button
                type="button"
                onClick={toggleAllStatuses}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  selectedStatuses.length === ALL_STATUSES.length
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 opacity-75 hover:opacity-100'
                }`}
                title="Chọn/Bỏ chọn tất cả các trạng thái"
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    selectedStatuses.length === ALL_STATUSES.length
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {selectedStatuses.length === ALL_STATUSES.length && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Tất cả</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedStatuses.length === ALL_STATUSES.length
                      ? 'bg-indigo-200/80 text-indigo-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {statusCounts.all}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Weekly Recurring slots configuration collapsible */}
      {showWeeklySettings && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Cấu hình khung ca học định kỳ hàng tuần</h4>
              <p className="text-xs text-slate-500">
                Các ca học mẫu này dùng để tự động tạo buổi học hoặc hiển thị khung giờ học chung
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingScheduleItem(null);
                setShowSessionModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ca mẫu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {schedule.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 col-span-3">
                Chưa có ca học mẫu hàng tuần nào. Bấm "Thêm ca mẫu" để thiết lập.
              </p>
            ) : (
              schedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">
                      {DAYS_OF_WEEK_NAMES[item.dayOfWeek] || 'Thứ ?'}:
                    </span>{' '}
                    <span className="text-slate-600">{item.startTime} - {item.endTime}</span>
                    {item.room && <div className="text-[11px] text-slate-400">{item.room}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingScheduleItem(item);
                        setShowSessionModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-md cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = schedule.filter((s) => s.id !== item.id);
                        setSchedule(updated);
                        store.updateClassSchedule(cls.id, updated);
                        success('Đã xóa ca học mẫu');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Teaching Schedule Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-12 shrink-0">TT</th>
                <th className="py-3 px-4 min-w-[180px]">Ngày học</th>
                <th className="py-3 px-3 text-center min-w-[130px]">Trạng thái</th>
                <th className="py-3 px-3 text-center min-w-[140px]">Điểm danh</th>
                <th className="py-3 px-4 min-w-[180px]">Ghi chú</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Học liệu</th>
                <th className="py-3 px-4 text-center min-w-[150px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">Không tìm thấy buổi học nào</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Danh sách lịch dạy đang trống hoặc không khớp bộ lọc trạng thái
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, index) => {
                  const hasAttendance =
                    session.attendanceDone ||
                    store.getAttendanceRecords(cls.id, session.date).length > 0;
                  const materialsCount = session.materials?.length || 0;
                  const statusInfo = getTeachingSessionStatus(session, hasAttendance);

                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-blue-50/25 transition-colors group ${
                        statusInfo.type === 'cancelled' ? 'opacity-75 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* 1. TT */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 group-hover:text-blue-600">
                        {index + 1}
                      </td>

                      {/* 2. Ngày học */}
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              statusInfo.type === 'cancelled'
                                ? 'line-through text-slate-500'
                                : 'text-slate-800'
                            }`}
                          >
                            {formatSessionDateVN(session.date)}
                          </span>
                        </div>
                        {session.startTime && session.endTime && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Trạng thái (4 trạng thái: Sắp tới, Đang diễn ra, Đã dạy, Đã huỷ) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {statusInfo.type === 'ongoing' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span>Đang diễn ra</span>
                          </span>
                        ) : statusInfo.type === 'upcoming' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs">
                            Sắp tới
                          </span>
                        ) : statusInfo.type === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                            Đã dạy
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            Đã huỷ
                          </span>
                        )}
                      </td>

                      {/* 4. Điểm danh */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {statusInfo.type === 'cancelled' ? (
                          <span className="text-[11px] text-slate-400 italic">Không áp dụng</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAttendanceForSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group/btn"
                            title="Bấm để mở giao diện điểm danh buổi này"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-blue-600" />
                            <span>Điểm danh</span>
                          </button>
                        )}
                      </td>

                      {/* 5. Ghi chú */}
                      <td className="py-3 px-4 text-slate-700">
                        {session.notes ? (
                          <span className="text-slate-800 font-medium line-clamp-1 max-w-[260px]" title={session.notes}>
                            {session.notes}
                          </span>
                        ) : null}
                      </td>

                      {/* 6. Học liệu (Tài liệu học tập) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {materialsCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAttachModal(session)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Xem và chỉnh sửa tài liệu đính kèm"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>{materialsCount} tài liệu</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAttachModal(session)}
                            className="text-[11px] text-slate-400 hover:text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer px-2 py-1"
                            title="Gắn tài liệu học tập vào buổi này"
                          >
                            <span>+ Gắn</span>
                          </button>
                        )}
                      </td>

                      {/* 7. Thao tác: Giao bài, Sửa, Huỷ/Khôi phục, Xóa */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-center bg-slate-50 border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                          {/* Giao bài */}
                          <button
                            type="button"
                            disabled={statusInfo.type === 'cancelled'}
                            onClick={() => {
                              onAssignExam?.(session);
                              info(`Mở giao bài tập/đề thi cho buổi ${formatSessionDateVN(session.date)}`);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              statusInfo.type === 'cancelled'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-emerald-600 hover:bg-white'
                            }`}
                            title="Giao bài tập, đề thi cho buổi học này"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditSession(session)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa buổi học & trạng thái"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Chuyển nhanh Đã huỷ / Khôi phục */}
                          <button
                            type="button"
                            onClick={() => handleToggleCancelSession(session)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              statusInfo.type === 'cancelled'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-rose-500 hover:bg-rose-50'
                            }`}
                            title={
                              statusInfo.type === 'cancelled'
                                ? 'Khôi phục buổi học'
                                : 'Đánh dấu Huỷ buổi học này'
                            }
                          >
                            {statusInfo.type === 'cancelled' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Xóa vĩnh viễn buổi học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL 1: Gắn tài liệu học tập (Attach Learning Materials) */}
      {showAttachModal && activeSessionForAttach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    Gắn tài liệu học tập
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buổi học: <strong className="text-slate-700">{formatSessionDateVN(activeSessionForAttach.date)}</strong> • Tiết {activeSessionForAttach.shift}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAttachModal(false);
                  setActiveSessionForAttach(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Attached materials list */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">
                  Tài liệu hiện đã gắn ({activeSessionForAttach.materials?.length || 0})
                </label>
                {(activeSessionForAttach.materials || []).length === 0 ? (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    Chưa có tài liệu học tập nào được gắn cho buổi học này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessionForAttach.materials?.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate font-bold text-slate-800">{m.title}</div>
                          {m.fileSize && (
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">({m.fileSize})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(m.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Gỡ tài liệu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Choose from available documents */}
              <div className="pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-800 block mb-2">
                  Chọn nhanh từ kho học liệu của giáo viên
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {availableDocuments.map((doc) => {
                    const isAttached = (activeSessionForAttach.materials || []).some(
                      (m) => m.title === doc.title
                    );
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleToggleLibraryDoc(doc.title, 'pdf', doc.fileSize)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isAttached
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isAttached}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {doc.fileSize || 'PDF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Add new custom material */}
              <form onSubmit={handleAddCustomMaterial} className="pt-3 border-t border-slate-100 space-y-3">
                <label className="font-bold text-slate-800 block">
                  Hoặc nhập tên tài liệu / link ngoài đính kèm
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tên tài liệu (vd: Phiếu bài tập tuần 12.pdf)"
                    value={customMaterialTitle}
                    onChange={(e) => setCustomMaterialTitle(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 focus:bg-white text-xs font-medium"
                  />
                  <select
                    value={customMaterialType}
                    onChange={(e) => setCustomMaterialType(e.target.value)}
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-xs font-medium"
                  >
                    <option value="pdf">File PDF</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="slide">Bài giảng PowerPoint</option>
                    <option value="link">Đường dẫn Web/Drive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Đường dẫn liên kết (tùy chọn: https://drive.google.com/...)"
                    value={customMaterialUrl}
                    onChange={(e) => setCustomMaterialUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 focus:bg-white text-xs font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shrink-0 cursor-pointer transition-colors"
                  >
                    + Thêm ngay
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAttachModal(false);
                  setActiveSessionForAttach(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thêm / Chỉnh sửa ca học (Đồng bộ hoàn toàn với Thời gian biểu) */}
      <CalendarSessionModal
        isOpen={calendarModalOpen}
        onClose={() => {
          setCalendarModalOpen(false);
          setCalendarSessionToEdit(null);
        }}
        initialClassId={cls.id}
        lockClass={true}
        initialDate={new Date().toISOString().split('T')[0]}
        initialStartTime="07:30"
        initialEndTime="09:00"
        sessionToEdit={calendarSessionToEdit}
        onSaved={handleCalendarSaved}
        onDeleted={handleCalendarDeleted}
      />

      {/* Synchronized Add / Edit Weekly Recurring Session Modal */}
      <CalendarSessionModal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setEditingScheduleItem(null);
        }}
        initialClassId={cls.id}
        lockClass={true}
        scheduleItemToEdit={editingScheduleItem}
        onScheduleSaved={(newSchedule) => {
          setSchedule(newSchedule);
        }}
        onDeleted={(deletedId) => {
          setSchedule((prev) => prev.filter((s) => s.id !== deletedId));
        }}
      />
    </div>
  );
};
