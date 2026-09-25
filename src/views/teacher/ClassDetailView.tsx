import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  QrCode,
  Copy,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  BookOpen,
  Award,
  TrendingUp,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Calendar,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  ChevronDown,
  X,
  Edit3,
  Phone,
  Mail,
  User,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  BarChart3,
  CheckSquare,
  Square
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom, Student, Exam, Submission, StudentDiligenceSummary } from '../../types';
import { QRModal } from '../../components/common/QRModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { useToast } from '../../context/ToastContext';
import { ExamStatusBadge, DiligenceRankBadge } from '../../components/common/Badge';
import { AttendanceManager } from './components/AttendanceManager';
import { ScheduleManager } from './components/ScheduleManager';
import { MonthlyStudentReportModal } from './components/MonthlyReportModal';
import { AssignExamModal } from './components/AssignExamModal';
import { CreateHomeworkModal } from './components/CreateHomeworkModal';
import { ClassAssignExamModal } from './components/ClassAssignExamModal';
import { AzotaCreateExamModal } from './components/AzotaCreateExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';
import { StudentApprovalModal } from './components/StudentApprovalModal';
import { StudentExcelImportModal } from './components/StudentExcelImportModal';

export const ClassDetailView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [cls, setCls] = useState<ClassRoom | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [activeTab, setActiveTab] = useState<
    'students' | 'schedule' | 'assigned_exams' | 'gradebook'
  >('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);

  // Monthly Report Modal state
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | undefined>(undefined);

  // Linkage state between Schedule and Attendance Modal
  const [attendanceTargetDate, setAttendanceTargetDate] = useState<string | undefined>(undefined);
  const [attendanceTargetSession, setAttendanceTargetSession] = useState<string | undefined>(undefined);
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);

  // Assign & Settings Modal for Exams
  const [selectedExamForAssign, setSelectedExamForAssign] = useState<Exam | null>(null);
  const [infoModalExam, setInfoModalExam] = useState<Exam | null>(null);
  const [showCreateHomeworkModal, setShowCreateHomeworkModal] = useState(false);
  const [homeworkInitialMode, setHomeworkInitialMode] = useState<'upload' | 'manual' | 'bank'>('upload');
  const [showClassAssignExamModal, setShowClassAssignExamModal] = useState(false);
  const [showAzotaCreateExamModal, setShowAzotaCreateExamModal] = useState(false);
  const [examInitialTab, setExamInitialTab] = useState<'file' | 'compose' | 'quick_sheet' | 'bank'>('file');

  // Student Add/Edit Modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentBirthDate, setStudentBirthDate] = useState('');
  // Parent info states
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Bố');
  const [parentNote, setParentNote] = useState('');
  const [showParentSection, setShowParentSection] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  // Excel Import Modal
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Gradebook Tab Mode & Filters
  const [gradebookStartDate, setGradebookStartDate] = useState<string>('2026-08-01');
  const [gradebookEndDate, setGradebookEndDate] = useState<string>('2026-12-31');
  const [gradebookSearch, setGradebookSearch] = useState('');
  const [gradebookExamFilter, setGradebookExamFilter] = useState<string>('all');
  const [gradebookRankFilter, setGradebookRankFilter] = useState<string>('all');
  const [gradebookSort, setGradebookSort] = useState<'avg_desc' | 'avg_asc' | 'diligence_desc' | 'bonus_desc' | 'name_asc'>('avg_desc');

  useEffect(() => {
    const refresh = () => {
      if (!classId) return;
      const currentClass = store.getClassById(classId);
      setCls(currentClass);
      setStudents(store.getStudentsByClassId(classId));
      setExams(store.getExams().filter((e) => e.assignedClassIds.includes(classId)));
      setSubmissions(store.getSubmissions().filter((s) => s.studentClassId === classId));
    };

    refresh();
    const unsub = store.subscribe(refresh);
    return unsub;
  }, [classId]);

  const handleDeleteClassConfirm = () => {
    if (cls) {
      store.deleteClass(cls.id);
      success('Đã xóa lớp học', `Lớp ${cls.name} đã được xóa.`);
      navigate('/teacher/classes');
    }
  };

  if (!cls) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy lớp học</h3>
        <p className="text-xs text-slate-500 mt-1">Lớp học này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link
          to="/teacher/classes"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lớp</span>
        </Link>
      </div>
    );
  }

  const openStudentModal = (st?: Student) => {
    if (st) {
      setEditingStudent(st);
      setStudentName(st.fullName);
      setStudentCode(st.code);
      setStudentEmail(st.email || '');
      setStudentPhone(st.phone || '');
      setStudentBirthDate(st.birthDate || '');
      setParentName(st.parentName || '');
      setParentPhone(st.parentPhone || '');
      setParentEmail(st.parentEmail || '');
      setParentRelationship(st.parentRelationship || 'Bố');
      setParentNote(st.parentNote || '');
      setShowParentSection(Boolean(st.parentName || st.parentPhone || st.parentEmail || st.parentNote));
    } else {
      setEditingStudent(null);
      setStudentName('');
      // Auto-generate student code behind the scenes
      setStudentCode(`HS${Math.floor(900 + Math.random() * 99)}`);
      setStudentEmail('');
      setStudentPhone('');
      setStudentBirthDate('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setParentRelationship('Bố');
      setParentNote('');
      setShowParentSection(false);
    }
    setShowStudentModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !classId) return;

    if (editingStudent) {
      store.updateStudent(editingStudent.id, {
        fullName: studentName.trim(),
        code: studentCode || editingStudent.code,
        email: studentEmail.trim() || undefined,
        phone: studentPhone.trim() || undefined,
        birthDate: studentBirthDate || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
        parentRelationship: parentRelationship.trim() || undefined,
        parentNote: parentNote.trim() || undefined
      });
      success('Cập nhật học sinh thành công', `Đã lưu hồ sơ của ${studentName}`);
    } else {
      const generatedCode = studentCode || `HS${Math.floor(900 + Math.random() * 99)}`;
      store.addStudent({
        fullName: studentName.trim(),
        code: generatedCode,
        email: studentEmail.trim() || undefined,
        phone: studentPhone.trim() || undefined,
        classId: classId,
        status: 'active',
        birthDate: studentBirthDate || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
        parentRelationship: parentRelationship.trim() || undefined,
        parentNote: parentNote.trim() || undefined
      });
      success('Thêm học sinh thành công', `Đã thêm ${studentName} vào lớp ${cls.name}`);
    }
    setShowStudentModal(false);
  };

  const handleDeleteStudentConfirm = () => {
    if (deleteStudentId) {
      store.deleteStudent(deleteStudentId);
      success('Đã xóa học sinh', 'Học sinh đã được xóa khỏi danh sách lớp.');
      setDeleteStudentId(null);
    }
  };

  const handleExportStudentListExcel = () => {
    if (!cls || students.length === 0) {
      info('Thông báo', 'Lớp học hiện chưa có học sinh nào để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'Email',
      'Số điện thoại',
      'Lớp học',
      'Khối',
      'Năm học',
      'Trạng thái'
    ];

    const rows = students.map((st, idx) => [
      String(idx + 1),
      `"${st.fullName.replace(/"/g, '""')}"`,
      `"${(st.email || '').replace(/"/g, '""')}"`,
      `"${(st.phone || '').replace(/"/g, '""')}"`,
      `"${cls.name.replace(/"/g, '""')}"`,
      `"${cls.grade}"`,
      `"${cls.academicYear}"`,
      st.status === 'active' ? 'Đang học' : 'Nghỉ học'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanClassName = cls.name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    link.setAttribute('download', `Danh_sach_hoc_sinh_${cleanClassName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Xuất file thành công', `Đã tải xuống danh sách ${students.length} học sinh lớp ${cls.name}.`);
  };

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone && s.phone.includes(searchTerm)) ||
    (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.parentPhone && s.parentPhone.includes(searchTerm))
  );

  const pendingStudents = cls ? store.getPendingStudentsByClassId(cls.id) : [];

  return (
    <div id="class-detail-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#9A8A85]">
        <Link to="/teacher/classes" className="hover:text-[#B68176] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách lớp học</span>
        </Link>
        <span>/</span>
        <span className="text-[#5C453C] font-bold">{cls.name}</span>
      </div>

      {/* Class Banner Card */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {cls.name}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {cls.description || 'Chưa có mô tả lớp học'}
          </p>
        </div>

        {/* Join code & Share Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Join Code Box */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(cls.joinCode);
              setCopiedCode(true);
              success('Đã sao chép', `Mã lớp: ${cls.joinCode}`);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            title="Nhấp để sao chép mã tham gia"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 text-slate-700 rounded-xl border border-slate-200 text-xs font-medium transition-all cursor-pointer group shadow-2xs active:scale-95"
          >
            <span className="text-slate-400 text-[11px]">Mã tham gia:</span>
            <span className="font-mono font-bold text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
              {cls.joinCode}
            </span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-150" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>

          {/* Action Buttons with consistent Icon + Label */}
          <button
            id="btn-export-students-csv"
            onClick={handleExportStudentListExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all hover:border-slate-300 cursor-pointer active:scale-95"
            title="Xuất danh sách học sinh của lớp ra tệp CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-show-class-qr"
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all hover:border-slate-300 cursor-pointer active:scale-95"
            title="Xem mã QR của lớp"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Mã QR</span>
          </button>

          <button
            id="btn-edit-class"
            onClick={() => setShowEditClassModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all hover:border-slate-300 cursor-pointer active:scale-95"
            title="Chỉnh sửa thông tin lớp học"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Sửa lớp</span>
          </button>

          <button
            id="btn-delete-class"
            onClick={() => setShowDeleteClassModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 font-semibold text-xs rounded-xl border border-slate-200 hover:border-red-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Xóa lớp học này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa lớp</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EFE3DD] flex items-center gap-2 sm:gap-6 text-xs font-bold overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'border-[#B68176] text-[#B68176]'
              : 'border-transparent text-[#9A8A85] hover:text-[#5C453C]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Học sinh ({students.length})</span>
        </button>

        <button
          id="tab-schedule"
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'border-[#B68176] text-[#B68176]'
              : 'border-transparent text-[#9A8A85] hover:text-[#5C453C]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch dạy</span>
        </button>

        <button
          onClick={() => setActiveTab('assigned_exams')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'assigned_exams'
              ? 'border-[#B68176] text-[#B68176]'
              : 'border-transparent text-[#9A8A85] hover:text-[#5C453C]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bài tập, đề thi ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'gradebook'
              ? 'border-[#B68176] text-[#B68176]'
              : 'border-transparent text-[#9A8A85] hover:text-[#5C453C]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Bảng điểm tổng hợp</span>
        </button>
      </div>

      {/* Tab: Schedule (Lịch dạy) */}
      {activeTab === 'schedule' && (
        <ScheduleManager
          cls={cls}
          onOpenReportModal={() => {
            setSelectedStudentForReport(undefined);
            setShowMonthlyReportModal(true);
          }}
          onTakeAttendance={(dateStr, sessionLabel) => {
            setAttendanceTargetDate(dateStr);
            setAttendanceTargetSession(sessionLabel);
            setShowAttendanceModal(true);
          }}
          onAssignExam={(_session) => {
            setShowClassAssignExamModal(true);
          }}
        />
      )}

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 p-2 px-3 bg-[#FFFDF9] rounded-xl border border-[#EFE3DD] flex-1 max-w-md shadow-xs">
              <Search className="w-4 h-4 text-[#9A8A85]" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên, SĐT, email, phụ huynh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[#5C453C] placeholder-[#9A8A85] outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-open-approval-modal"
                onClick={() => setShowApprovalModal(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                  pendingStudents.length > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Duyệt học sinh{pendingStudents.length > 0 ? ` (${pendingStudents.length})` : ''}</span>
              </button>
              <button
                onClick={() => setShowExcelModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Nhập Excel</span>
              </button>
              <button
                id="btn-add-student"
                onClick={() => openStudentModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#B68176] hover:bg-[#A37066] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#B68176]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>
            </div>
          </div>

          <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F0EA]/60 border-b border-[#EFE3DD] text-[#9A8A85] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-4 text-center w-12">STT</th>
                  <th className="py-3.5 px-3">HỌ VÀ TÊN</th>
                  <th className="py-3.5 px-3">LIÊN HỆ & PHỤ HUYNH</th>
                  <th className="py-3.5 px-3 text-center w-36">Học phí & Báo cáo</th>
                  <th className="py-3.5 text-right pr-4 w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE3DD]/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#9A8A85]">
                      <Users className="w-8 h-8 mx-auto text-[#B68176]/40 mb-2" />
                      <p className="font-semibold text-xs text-[#5C453C]">Không tìm thấy học sinh nào phù hợp</p>
                      <p className="text-[11px] text-[#9A8A85] mt-0.5">
                        Thầy cô có thể thêm học sinh mới hoặc chia sẻ mã QR để học sinh tự ghi danh.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    return (
                    <tr key={st.id} className="hover:bg-[#F9EAEA]/30 transition-colors">
                      <td className="py-3.5 pl-4 text-center font-bold text-[#9A8A85]">{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {st.fullName.charAt(0)}
                          </div>
                          <span className="font-bold text-[#5C453C] text-xs">{st.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 text-xs">
                          {st.phone ? (
                            <div className="font-mono text-[#5C453C] font-semibold text-xs">
                              {st.phone}
                            </div>
                          ) : st.email ? (
                            <div className="text-[#9A8A85] text-[11px]">{st.email}</div>
                          ) : (
                            <span className="text-[#9A8A85] italic text-[11px]">Chưa có SĐT</span>
                          )}
                          {(st.parentName || st.parentPhone) && (
                            <div className="text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="text-blue-600 font-bold">PH:</span>
                              <span className="font-semibold text-blue-600">
                                {st.parentName || 'Phụ huynh'} {st.parentRelationship ? `(${st.parentRelationship})` : ''}
                              </span>
                              {st.parentPhone && (
                                <>
                                  <span className="text-[#9A8A85]">·</span>
                                  <span className="font-mono text-[#5C453C] font-medium">{st.parentPhone}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForReport(st);
                            setShowMonthlyReportModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Xem & xuất phiếu học phí và báo cáo học tập tháng cho học sinh này"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Báo cáo</span>
                        </button>
                      </td>
                      <td className="py-3.5 text-right pr-4 space-x-1">
                        <button
                          onClick={() => openStudentModal(st)}
                          className="p-1.5 text-[#9A8A85] hover:text-[#5C453C] rounded-lg hover:bg-[#F5F0EA] transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Chỉnh sửa thông tin học sinh"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteStudentId(st.id)}
                          className="p-1.5 text-[#9A8A85] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Xóa học sinh khỏi lớp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Tab: Assigned Exams */}
      {activeTab === 'assigned_exams' && (
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9A8A85]">Các bài tập, đề thi đã giao cho lớp {cls.name}</p>
            
            {/* Giao bài mới button */}
            <button
              type="button"
              id="btn-assign-new-work"
              onClick={() => setShowClassAssignExamModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Giao bài mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const classSubs = submissions.filter((s) => s.examId === exam.id && s.studentClassId === cls.id);
              const completionRate = students.length > 0
                ? Math.round((classSubs.length / students.length) * 100)
                : 0;

              return (
                <div key={exam.id} className="p-5 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-[#5C453C] text-sm leading-snug">{exam.title}</h4>
                      <p className="text-xs text-[#9A8A85] mt-0.5">{exam.durationMinutes} phút • {exam.questions?.length || 0} câu</p>
                    </div>
                    <ExamStatusBadge status={exam.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#5C453C]">
                      <span className="font-medium">Tỷ lệ hoàn thành</span>
                      <span className="font-bold font-mono">{classSubs.length}/{students.length} ({completionRate}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F0EA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B68176] rounded-full transition-all"
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFE3DD] text-xs">
                    <button
                      onClick={() => setSelectedExamForAssign(exam)}
                      className="text-[#5C453C] hover:text-[#B68176] inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#B68176]" />
                      <span>Cài đặt & Giao lại</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/exam/${exam.id}`}
                        target="_blank"
                        className="text-[#9A8A85] hover:text-[#5C453C] inline-flex items-center gap-1 font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#B68176]" />
                        <span>Xem đề</span>
                      </Link>
                      <Link
                        to={`/teacher/reports?examId=${exam.id}`}
                        className="text-[#B68176] hover:text-[#A37066] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Báo cáo</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Gradebook Matrix */}
      {activeTab === 'gradebook' && (() => {
        const diligenceSummaries = store.getClassDiligenceSummaries(cls.id);

        // Filter exams by type, selected exam ID, and time range
        const displayedExamsList = exams.filter((ex) => {
          const isHomework = ex.title.toLowerCase().includes('bài tập') || ex.title.toLowerCase().includes('btvn');

          // 1. Exam / Type Filter
          if (gradebookExamFilter === 'exam_only' && isHomework) return false;
          if (gradebookExamFilter === 'homework_only' && !isHomework) return false;
          if (gradebookExamFilter !== 'all' && gradebookExamFilter !== 'exam_only' && gradebookExamFilter !== 'homework_only') {
            if (ex.id !== gradebookExamFilter) return false;
          }

          // 2. Time Range Filter
          if (gradebookStartDate || gradebookEndDate) {
            const rawDate = ex.openTime || ex.createdAt || '2026-08-15';
            const exDate = rawDate.split('T')[0];
            if (gradebookStartDate && exDate < gradebookStartDate) {
              const hasSub = submissions.some(
                (s) => s.examId === ex.id && s.studentClassId === cls.id && s.submittedAt && s.submittedAt.split('T')[0] >= gradebookStartDate
              );
              if (!hasSub) return false;
            }
            if (gradebookEndDate && exDate > gradebookEndDate) {
              const hasSub = submissions.some(
                (s) => s.examId === ex.id && s.studentClassId === cls.id && s.submittedAt && s.submittedAt.split('T')[0] <= gradebookEndDate
              );
              if (!hasSub) return false;
            }
          }

          return true;
        });

        // Precompute stats for each student
        const studentStats = students.map((st) => {
          let totalEarned = 0;
          let testCount = 0;
          const examScores: Record<string, number | null> = {};

          displayedExamsList.forEach((ex) => {
            const sub = submissions.find((s) => s.examId === ex.id && s.studentId === st.id);
            if (sub) {
              totalEarned += sub.totalScore;
              testCount++;
              examScores[ex.id] = sub.totalScore;
            } else {
              examScores[ex.id] = null;
            }
          });

          const avg = testCount > 0 ? totalEarned / testCount : null;
          const dSummary = diligenceSummaries.find((d) => d.student.id === st.id);
          const diligenceScore = dSummary ? dSummary.diligenceScore : 10.0;
          const bonusPoints = dSummary ? dSummary.bonusPoints : 0;

          let rankCategory: 'gioi' | 'kha' | 'tb' | 'yeu' | 'chuanop' = 'chuanop';
          if (avg !== null) {
            if (avg >= 8.0) rankCategory = 'gioi';
            else if (avg >= 6.5) rankCategory = 'kha';
            else if (avg >= 5.0) rankCategory = 'tb';
            else rankCategory = 'yeu';
          }

          return {
            student: st,
            testCount,
            totalEarned,
            avg,
            avgFormatted: avg !== null ? avg.toFixed(1) : '---',
            examScores,
            diligenceScore,
            bonusPoints,
            rankCategory,
            dSummary
          };
        });

        // Filter students
        const filteredStudentStats = studentStats.filter((item) => {
          const matchSearch =
            item.student.fullName.toLowerCase().includes(gradebookSearch.toLowerCase()) ||
            item.student.code.toLowerCase().includes(gradebookSearch.toLowerCase()) ||
            (item.student.phone || '').toLowerCase().includes(gradebookSearch.toLowerCase());

          if (!matchSearch) return false;

          if (gradebookRankFilter !== 'all') {
            if (item.rankCategory !== gradebookRankFilter) return false;
          }

          return true;
        });

        // Sort students
        filteredStudentStats.sort((a, b) => {
          if (gradebookSort === 'avg_desc') {
            if (a.avg === null && b.avg === null) return 0;
            if (a.avg === null) return 1;
            if (b.avg === null) return -1;
            return b.avg - a.avg;
          }
          if (gradebookSort === 'avg_asc') {
            if (a.avg === null && b.avg === null) return 0;
            if (a.avg === null) return 1;
            if (b.avg === null) return -1;
            return a.avg - b.avg;
          }
          if (gradebookSort === 'diligence_desc') {
            return b.diligenceScore - a.diligenceScore;
          }
          if (gradebookSort === 'name_asc') {
            return a.student.fullName.localeCompare(b.student.fullName, 'vi');
          }
          return 0;
        });

        return (
          <div className="space-y-3 font-sans">
            {/* Filter & Action Toolbar */}
            <div className="bg-[#FFFDF9] p-3 sm:p-3.5 rounded-2xl border border-[#EFE3DD] shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Search, Filter & TimeRange */}
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* 1. Search */}
                  <div className="flex items-center gap-2 p-2 px-3 bg-[#FAF7F2] rounded-xl border border-[#EFE3DD] flex-1 min-w-[180px] max-w-xs shadow-2xs">
                    <Search className="w-4 h-4 text-[#9A8A85] shrink-0" />
                    <input
                      type="text"
                      placeholder="Tìm học sinh theo tên, SĐT..."
                      value={gradebookSearch}
                      onChange={(e) => setGradebookSearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-[#5C453C] placeholder-[#9A8A85] outline-hidden"
                    />
                    {gradebookSearch && (
                      <button
                        type="button"
                        onClick={() => setGradebookSearch('')}
                        className="text-[#9A8A85] hover:text-[#5C453C]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 2. Bộ lọc Bài tập / Đề thi */}
                  <div className="flex items-center gap-1.5 p-1.5 px-2.5 bg-[#FAF7F2] rounded-xl border border-[#EFE3DD] text-xs">
                    <FileText className="w-3.5 h-3.5 text-[#B68176] shrink-0" />
                    <select
                      value={gradebookExamFilter}
                      onChange={(e) => setGradebookExamFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-[#5C453C] outline-hidden cursor-pointer"
                    >
                      <option value="all">Tất cả</option>
                      <option value="exam_only">Đề thi</option>
                      <option value="homework_only">Bài tập</option>
                    </select>
                  </div>

                  {/* 3. Time Range Filter (Từ ngày - Đến ngày) */}
                  <div className="flex items-center gap-1.5 p-1.5 px-2.5 bg-[#FAF7F2] rounded-xl border border-[#EFE3DD] text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#B68176] shrink-0" />
                    <span className="text-[11px] font-bold text-[#9A8A85]">Từ:</span>
                    <input
                      type="date"
                      value={gradebookStartDate}
                      onChange={(e) => setGradebookStartDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-[#5C453C] outline-hidden cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-[#9A8A85]">Đến:</span>
                    <input
                      type="date"
                      value={gradebookEndDate}
                      onChange={(e) => setGradebookEndDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-[#5C453C] outline-hidden cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reset & Export CSV button */}
                <div className="flex items-center gap-2 shrink-0">
                  {(gradebookSearch || gradebookExamFilter !== 'all' || gradebookStartDate !== '2026-08-01' || gradebookEndDate !== '2026-12-31') && (
                    <button
                      type="button"
                      onClick={() => {
                        setGradebookSearch('');
                        setGradebookExamFilter('all');
                        setGradebookStartDate('2026-08-01');
                        setGradebookEndDate('2026-12-31');
                      }}
                      className="px-2.5 py-1.5 text-xs text-[#9A8A85] hover:text-[#5C453C] hover:bg-[#FAF7F2] rounded-xl border border-transparent hover:border-[#EFE3DD] transition-all cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const rows = [
                        [
                          'Họ và tên',
                          'Chuyên cần (10đ)',
                          ...displayedExamsList.map((ex) => ex.title)
                        ],
                        ...filteredStudentStats.map((item) => {
                          const scores = displayedExamsList.map((ex) => {
                            const val = item.examScores[ex.id];
                            return val !== null ? val : '-';
                          });
                          return [
                            item.student.fullName,
                            item.diligenceScore.toFixed(1),
                            ...scores
                          ];
                        })
                      ];
                      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `BangDiem_${cls.name.replace(/\s+/g, '_')}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      info('Xuất bảng điểm', `Đã tải xuống dữ liệu ${filteredStudentStats.length} học sinh.`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] text-xs font-bold rounded-xl border border-[#EFE3DD] cursor-pointer transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#9A8A85]" />
                    <span>Xuất CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Gradebook Matrix Table with Fixed Left Columns & Horizontal Scroll */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-hidden">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-[#F5F0EA] border-b border-[#EFE3DD] text-[#5C453C] font-bold text-[11px]">
                      {/* Sticky STT Column */}
                      <th className="py-3.5 px-3 text-center w-12 min-w-[48px] sticky left-0 z-30 bg-[#F5F0EA] border-r border-[#EFE3DD]/60">
                        STT
                      </th>

                      {/* Sticky Họ và tên Column */}
                      <th className="py-3.5 px-3 min-w-[170px] sticky left-12 z-30 bg-[#F5F0EA] border-r border-[#EFE3DD] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                        Họ và tên
                      </th>

                      {/* Summary Column: Chuyên cần (ở đầu tiên sau cột họ tên) */}
                      <th className="py-3.5 px-3 text-center min-w-[110px] border-r border-[#EFE3DD]/60 bg-[#F5F0EA]">
                        Chuyên cần
                      </th>

                      {/* Exam / Homework Columns */}
                      {displayedExamsList.length === 0 ? (
                        <th className="py-3.5 px-4 text-center text-[#9A8A85] font-normal border-r border-[#EFE3DD]">
                          Chưa có bài tập hoặc đề thi nào phù hợp với bộ lọc
                        </th>
                      ) : (
                        displayedExamsList.map((ex) => {
                          const isHomework = ex.title.toLowerCase().includes('bài tập') || ex.title.toLowerCase().includes('btvn');
                          const examSubs = submissions.filter((s) => s.examId === ex.id && s.studentClassId === cls.id);

                          return (
                            <th key={ex.id} className="py-3 px-3 text-center min-w-[160px] max-w-[220px] border-r border-[#EFE3DD]/60 bg-[#FAF7F2]/40">
                              <div className="flex items-center justify-center mb-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                  isHomework
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                }`}>
                                  {isHomework ? 'Bài tập' : 'Đề thi'}
                                </span>
                              </div>
                              <div className="truncate font-bold text-[#5C453C] max-w-[200px] mx-auto" title={ex.title}>
                                {ex.title}
                              </div>
                              <div className="flex items-center justify-center gap-1 text-[10px] text-[#9A8A85] font-normal mt-0.5">
                                <span>Thang {ex.maxScore}đ</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">{examSubs.length}/{students.length} nộp</span>
                              </div>
                            </th>
                          );
                        })
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EFE3DD]/70">
                    {filteredStudentStats.length === 0 ? (
                      <tr>
                        <td colSpan={3 + Math.max(1, displayedExamsList.length)} className="py-12 text-center text-[#9A8A85]">
                          <Award className="w-8 h-8 mx-auto text-[#B68176]/40 mb-2" />
                          <p className="font-semibold text-xs text-[#5C453C]">Không có dữ liệu điểm phù hợp</p>
                          <p className="text-[11px] text-[#9A8A85] mt-0.5">
                            Thầy cô có thể thử xóa tìm kiếm hoặc chọn bộ lọc đề thi khác.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudentStats.map((item, idx) => (
                        <tr key={item.student.id} className="hover:bg-[#F9EAEA]/30 transition-colors group">
                          {/* Sticky STT Column */}
                          <td className="py-2.5 px-3 text-center font-bold text-[#9A8A85] sticky left-0 z-20 bg-white group-hover:bg-[#FAF4F0] border-r border-[#EFE3DD]/60">
                            {idx + 1}
                          </td>

                          {/* Sticky Họ và tên Column */}
                          <td className="py-2.5 px-3 sticky left-12 z-20 bg-white group-hover:bg-[#FAF4F0] border-r border-[#EFE3DD] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#F9EAEA] text-[#B68176] border border-[#EFE3DD] flex items-center justify-center font-bold text-[11px] shrink-0">
                                {item.student.fullName.charAt(0)}
                              </div>
                              <span className="font-bold text-[#5C453C] truncate max-w-[140px]" title={item.student.fullName}>
                                {item.student.fullName}
                              </span>
                            </div>
                          </td>

                          {/* Diligence Score (Chuyên cần ngay sau họ tên) */}
                          <td className="py-2.5 px-3 text-center border-r border-[#EFE3DD]/60">
                            <span
                              className={`inline-block min-w-[36px] px-2 py-0.5 rounded-md font-extrabold text-xs text-center ${
                                item.diligenceScore >= 8.0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : item.diligenceScore >= 6.5
                                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                  : item.diligenceScore >= 5.0
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {item.diligenceScore.toFixed(1)}
                            </span>
                          </td>

                          {/* Exam / Homework Scores */}
                          {displayedExamsList.length === 0 ? (
                            <td className="py-2.5 px-4 text-center text-[#9A8A85] italic border-r border-[#EFE3DD]">
                              -
                            </td>
                          ) : (
                            displayedExamsList.map((ex) => {
                              const score = item.examScores[ex.id];
                              return (
                                <td key={ex.id} className="py-2.5 px-3 text-center border-r border-[#EFE3DD]/60">
                                  {score !== null ? (
                                    <span
                                      className={`inline-block min-w-[36px] px-2 py-0.5 rounded-md font-extrabold text-xs text-center ${
                                        score >= 8.0
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          : score >= 6.5
                                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                          : score >= 5.0
                                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                                      }`}
                                    >
                                      {score}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#9A8A85] font-mono">-</span>
                                  )}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Bảo Nam"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Email học sinh
                </label>
                <input
                  type="email"
                  placeholder="baonam@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Số điện thoại học sinh
                </label>
                <input
                  type="tel"
                  placeholder="0981 112 201"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* Mở rộng thông tin phụ huynh */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParentSection(!showParentSection)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5EFEB] text-slate-800 transition-colors cursor-pointer border border-[#EFE3DD]/80"
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-900 font-bold">Thông tin phụ huynh</span>
                    {(parentName || parentPhone) && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-md font-bold">
                        Đã điền
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    <span>Xem thêm</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        showParentSection ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {showParentSection && (
                  <div className="mt-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Họ tên phụ huynh</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Bác Trần Văn Hùng"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mối quan hệ</label>
                        <select
                          value={parentRelationship}
                          onChange={(e) => setParentRelationship(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        >
                          <option value="Bố">Bố</option>
                          <option value="Mẹ">Mẹ</option>
                          <option value="Người giám hộ">Người giám hộ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">SĐT phụ huynh (Zalo)</label>
                        <input
                          type="tel"
                          placeholder="0912 345 678"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Email phụ huynh</label>
                        <input
                          type="email"
                          placeholder="phuhuynh@gmail.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <StudentExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        classId={classId!}
        className={cls?.name}
      />

      {/* QR Modal */}
      {showQRModal && (
        <QRModal
          isOpen={showQRModal}
          title={`Mã QR Lớp ${cls.name}`}
          subtitle="Học sinh quét mã để tự động ghi danh vào lớp"
          url={`/classes/join?code=${cls.joinCode}`}
          code={cls.joinCode}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Delete Student Confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteStudentId)}
        title="Xác nhận xóa học sinh"
        message="Học sinh sẽ bị xóa khỏi lớp học này. Các bài làm trước đây vẫn được lưu trữ trong hệ thống."
        confirmText="Xóa học sinh"
        isDestructive
        onConfirm={handleDeleteStudentConfirm}
        onCancel={() => setDeleteStudentId(null)}
      />

      {/* Edit Class Modal */}
      <ClassFormModal
        isOpen={showEditClassModal}
        editingClass={cls}
        onClose={() => setShowEditClassModal(false)}
        onSuccess={(updated) => setCls(updated)}
      />

      {/* Delete Class Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteClassModal}
        title="Xác nhận xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp "${cls.name}"? Danh sách học sinh thuộc lớp sẽ bị xóa và không thể khôi phục.`}
        confirmText="Xóa lớp học"
        isDestructive
        onConfirm={handleDeleteClassConfirm}
        onCancel={() => setShowDeleteClassModal(false)}
      />

      {/* Monthly Report & Tuition Card Modal */}
      {showMonthlyReportModal && (
        <MonthlyStudentReportModal
          cls={cls}
          student={selectedStudentForReport}
          onClose={() => {
            setShowMonthlyReportModal(false);
            setSelectedStudentForReport(undefined);
          }}
        />
      )}

      {/* Azota Assign & Settings Modal */}
      {selectedExamForAssign && (
        <AssignExamModal
          isOpen={!!selectedExamForAssign}
          exam={selectedExamForAssign}
          initialClassId={cls.id}
          onClose={() => setSelectedExamForAssign(null)}
          onSuccess={(updated) => {
            setExams(store.getExams().filter((e) => e.assignedClassIds.includes(cls.id)));
            setSelectedExamForAssign(null);
            setInfoModalExam(updated);
          }}
        />
      )}

      {/* Azota Quick Homework Modal */}
      {showCreateHomeworkModal && (
        <CreateHomeworkModal
          isOpen={showCreateHomeworkModal}
          initialClassId={cls.id}
          initialMode={homeworkInitialMode}
          onClose={() => setShowCreateHomeworkModal(false)}
          onSuccess={(newHw) => {
            setExams(store.getExams().filter((e) => e.assignedClassIds.includes(cls.id)));
            setInfoModalExam(newHw);
          }}
        />
      )}

      {/* Class Assign Exam Selector Modal (Azota Workflow) */}
      {cls && showClassAssignExamModal && (
        <ClassAssignExamModal
          isOpen={showClassAssignExamModal}
          onClose={() => setShowClassAssignExamModal(false)}
          cls={cls}
          onSelectExamToAssign={(exam) => {
            setSelectedExamForAssign(exam);
          }}
          onOpenCreateNewExam={() => {
            setExamInitialTab('compose');
            setShowAzotaCreateExamModal(true);
          }}
        />
      )}

      {/* Azota Create Exam Modal */}
      {cls && showAzotaCreateExamModal && (
        <AzotaCreateExamModal
          isOpen={showAzotaCreateExamModal}
          onClose={() => setShowAzotaCreateExamModal(false)}
          initialClassId={cls.id}
          initialTab={examInitialTab}
          onSaveAndAssign={(newExam) => {
            setExams(store.getExams().filter((e) => e.assignedClassIds.includes(cls.id)));
            setSelectedExamForAssign(newExam);
          }}
          onSaveToRepository={(newExam) => {
            setExams(store.getExams().filter((e) => e.assignedClassIds.includes(cls.id)));
            setInfoModalExam(newExam);
          }}
        />
      )}

      {/* Exam Information Popup */}
      {infoModalExam && (
        <ExamInfoModal
          isOpen={Boolean(infoModalExam)}
          exam={infoModalExam}
          onClose={() => setInfoModalExam(null)}
          onAssign={(exam) => {
            setInfoModalExam(null);
            setSelectedExamForAssign(exam);
          }}
        />
      )}

      {/* Attendance Popup Modal (Popup to) */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#5C453C]/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="w-full max-w-6xl max-h-[92vh] bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#EFE3DD] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#EFE3DD] bg-[#F5F0EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#B68176]/15 text-[#B68176] flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#5C453C] truncate">
                      Điểm danh lớp: {cls.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#B68176]/10 text-[#B68176] border border-[#B68176]/20 shrink-0">
                      {students.length} học sinh
                    </span>
                  </div>
                  <p className="text-xs text-[#9A8A85] truncate">
                    Ghi nhận tình trạng có mặt, đi muộn, nghỉ phép và lưu dữ liệu chuyên cần
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="p-2 text-[#9A8A85] hover:text-[#5C453C] hover:bg-[#EFE3DD] rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                title="Đóng popup điểm danh"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <AttendanceManager
                cls={cls}
                students={students}
                initialDate={attendanceTargetDate}
                initialSessionName={attendanceTargetSession}
                onGoToSchedule={() => {
                  setShowAttendanceModal(false);
                  setActiveTab('schedule');
                }}
                onClose={() => {
                  setShowAttendanceModal(false);
                }}
                onEndSession={(_dateStr, _sessionName) => {
                  setShowAttendanceModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Student QR Approval Modal */}
      {showApprovalModal && (
        <StudentApprovalModal
          isOpen={showApprovalModal}
          classRoom={cls}
          onClose={() => setShowApprovalModal(false)}
          onApproved={(_approvedList) => {
            setStudents(store.getStudentsByClassId(cls.id));
          }}
        />
      )}
    </div>
  );
};
