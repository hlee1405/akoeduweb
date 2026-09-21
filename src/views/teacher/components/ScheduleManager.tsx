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
  AlertCircle
} from 'lucide-react';
import { ClassRoom, ClassScheduleItem, ClassTeachingSession, SessionMaterialItem } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';
import { CalendarSessionModal } from './CalendarSessionModal';

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
const formatSessionDateVN = (dateStr: string): string => {
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
          return parsed;
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
        materials: []
      }
    ];
  };

  const [sessions, setSessions] = useState<ClassTeachingSession[]>(getInitialSessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'not_attended'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'offline' | 'online'>('all');

  // Modal states
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [activeSessionForAttach, setActiveSessionForAttach] = useState<ClassTeachingSession | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassTeachingSession | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Edit / Create form state
  const [formData, setFormData] = useState<{
    date: string;
    shift: string;
    startTime: string;
    endTime: string;
    room: string;
    format: 'offline' | 'online' | 'hybrid';
    teacherName: string;
    title: string;
    notes: string;
  }>({
    date: '',
    shift: '1 - 2',
    startTime: '07:30',
    endTime: '09:00',
    room: '102_HQV',
    format: 'offline',
    teacherName: '',
    title: '',
    notes: ''
  });

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

  // Documents from teacher document repository
  const availableDocuments = useMemo(() => store.getDocuments(), []);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Attendance status check
      const hasAttendance = s.attendanceDone || store.getAttendanceRecords(cls.id, s.date).length > 0;
      if (attendanceFilter === 'attended' && !hasAttendance) return false;
      if (attendanceFilter === 'not_attended' && hasAttendance) return false;

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
  }, [sessions, attendanceFilter, formatFilter, searchQuery, cls.id]);

  // Statistics
  const totalCount = sessions.length;
  const attendedCount = sessions.filter(
    (s) => s.attendanceDone || store.getAttendanceRecords(cls.id, s.date).length > 0
  ).length;
  const notAttendedCount = totalCount - attendedCount;

  // Handler: Open Add session
  const handleOpenAddSession = () => {
    const teacher = store.getTeacher();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');

    setFormData({
      date: `${y}-${m}-${d}`,
      shift: '1 - 2',
      startTime: '07:30',
      endTime: '09:00',
      room: '102_HQV',
      format: 'offline',
      teacherName: teacher?.fullName || 'Vũ Văn Thương',
      title: '',
      notes: ''
    });
    setIsCreatingNew(true);
    setEditingSession(null);
    setShowEditModal(true);
  };

  // Handler: Open Edit session
  const handleOpenEditSession = (session: ClassTeachingSession) => {
    setFormData({
      date: session.date,
      shift: session.shift || '1 - 2',
      startTime: session.startTime || '07:30',
      endTime: session.endTime || '09:00',
      room: session.room || '102_HQV',
      format: session.format || 'offline',
      teacherName: session.teacherName || '',
      title: session.title || '',
      notes: session.notes || ''
    });
    setIsCreatingNew(false);
    setEditingSession(session);
    setShowEditModal(true);
  };

  // Handler: Save Session (Create or Update)
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      alert('Vui lòng chọn ngày học');
      return;
    }

    if (isCreatingNew) {
      const newSession: ClassTeachingSession = {
        id: `ts-${cls.id}-${Date.now()}`,
        classId: cls.id,
        date: formData.date,
        shift: formData.shift,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room,
        format: formData.format,
        teacherName: formData.teacherName || 'Chưa cập nhật',
        title: formData.title || 'Buổi học định kỳ',
        notes: formData.notes,
        attendanceDone: false,
        materials: []
      };
      saveSessions([...sessions, newSession]);
      success('Đã thêm buổi dạy mới vào lịch');
    } else if (editingSession) {
      const updated = sessions.map((s) => {
        if (s.id === editingSession.id) {
          return {
            ...s,
            date: formData.date,
            shift: formData.shift,
            startTime: formData.startTime,
            endTime: formData.endTime,
            room: formData.room,
            format: formData.format,
            teacherName: formData.teacherName || 'Chưa cập nhật',
            title: formData.title,
            notes: formData.notes
          };
        }
        return s;
      });
      saveSessions(updated);
      success('Đã cập nhật thông tin buổi dạy');
    }

    setShowEditModal(false);
    setEditingSession(null);
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
            Quản lý chi tiết từng buổi học, theo dõi trạng thái điểm danh, gắn tài liệu học tập và giao bài
          </p>
        </div>

        {/* Filters Bar (Searchbar removed per request) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 text-xs font-medium">Trạng thái:</span>
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  attendanceFilter === 'all'
                    ? 'bg-white text-slate-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('not_attended')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  attendanceFilter === 'not_attended'
                    ? 'bg-white text-rose-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chưa điểm danh ({notAttendedCount})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('attended')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  attendanceFilter === 'attended'
                    ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã điểm danh ({attendedCount})
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
                <th className="py-3 px-3 text-center min-w-[140px]">Điểm danh</th>
                <th className="py-3 px-4 min-w-[180px]">Ghi chú</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Học liệu</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">Không tìm thấy buổi học nào</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Danh sách lịch dạy đang trống
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, index) => {
                  const hasAttendance =
                    session.attendanceDone ||
                    store.getAttendanceRecords(cls.id, session.date).length > 0;
                  const materialsCount = session.materials?.length || 0;

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-blue-50/25 transition-colors group"
                    >
                      {/* 1. TT */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 group-hover:text-blue-600">
                        {index + 1}
                      </td>

                      {/* 2. Ngày học */}
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-bold">{formatSessionDateVN(session.date)}</span>
                        </div>
                        {session.startTime && session.endTime && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Điểm danh */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasAttendance ? (
                          <button
                            type="button"
                            onClick={() =>
                              onTakeAttendance?.(
                                session.date,
                                `${formatSessionDateVN(session.date)}${session.startTime ? ` (${session.startTime} - ${session.endTime})` : ''}`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
                            title="Bấm để xem lại hoặc cập nhật điểm danh buổi này"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã điểm danh</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onTakeAttendance?.(
                                session.date,
                                `${formatSessionDateVN(session.date)}${session.startTime ? ` (${session.startTime} - ${session.endTime})` : ''}`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer"
                            title="Chưa điểm danh - Bấm để tiến hành điểm danh ngay"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Chưa điểm danh</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Ghi chú */}
                      <td className="py-3 px-4 text-slate-700">
                        {session.notes ? (
                          <span className="text-slate-800 font-medium line-clamp-1 max-w-[260px]" title={session.notes}>
                            {session.notes}
                          </span>
                        ) : null}
                      </td>

                      {/* 5. Học liệu (Tài liệu học tập) */}
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

                      {/* 5. Thao tác: Giao bài, Sửa, Xóa */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-center bg-slate-50 border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                          {/* Giao bài */}
                          <button
                            type="button"
                            onClick={() => {
                              onAssignExam?.(session);
                              info(`Mở giao bài tập/đề thi cho buổi ${formatSessionDateVN(session.date)}`);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Giao bài tập, đề thi cho buổi học này"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditSession(session)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa buổi học"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Xóa buổi học"
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

      {/* MODAL 2: Thêm / Chỉnh sửa buổi học (Create / Edit Session Modal) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  {isCreatingNew ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    {isCreatingNew ? 'Thêm buổi dạy mới' : 'Chỉnh sửa thông tin buổi dạy'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lớp: {cls.name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSession(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày học *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 focus:bg-white text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Nhập ghi chú cho buổi dạy nếu có..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSession(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {isCreatingNew ? 'Tạo buổi học' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
