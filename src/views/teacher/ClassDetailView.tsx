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
  Archive,
  Send,
  Calendar,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  ChevronDown,
  X,
  Edit3
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom, Student, Exam, Submission, StudentDiligenceSummary } from '../../types';
import { QRModal } from '../../components/common/QRModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { useToast } from '../../context/ToastContext';
import { ExamStatusBadge, DiligenceRankBadge } from '../../components/common/Badge';
import { AttendanceManager } from './components/AttendanceManager';
import { AwardBonusModal } from './components/AwardBonusModal';
import { ScheduleManager } from './components/ScheduleManager';
import { MonthlyStudentReportModal } from './components/MonthlyReportModal';
import { AssignExamModal } from './components/AssignExamModal';
import { CreateHomeworkModal } from './components/CreateHomeworkModal';
import { ClassAssignExamModal } from './components/ClassAssignExamModal';
import { AzotaCreateExamModal } from './components/AzotaCreateExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';

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
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);

  // Monthly Report Modal state
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | undefined>(undefined);

  // Linkage state between Schedule and Attendance Modal
  const [attendanceTargetDate, setAttendanceTargetDate] = useState<string | undefined>(undefined);
  const [attendanceTargetSession, setAttendanceTargetSession] = useState<string | undefined>(undefined);
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);

  // Bonus points award modal
  const [showAwardBonusModal, setShowAwardBonusModal] = useState(false);
  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState<Student | null>(null);

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
  // Parent info states
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Bố');
  const [parentNote, setParentNote] = useState('');
  const [showParentSection, setShowParentSection] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  // Excel Import Simulation Modal
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [rawExcelText, setRawExcelText] = useState(
    `HS930\tĐào Minh Châu\tminhchau.dao@gmail.com\t0981112230
HS931\tBùi Hoàng Yến\thoangyen.bui@gmail.com\t0981112231
HS932\tTrần Tuấn Anh\ttuananh.tran@gmail.com\t0981112232
HS933\tNguyễn Phương Uyên\tphuonguyen.ng@gmail.com\t0981112233`
  );

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

  const handleToggleArchive = () => {
    if (!cls) return;
    const nextStatus = cls.status === 'active' ? 'archived' : 'active';
    store.updateClass(cls.id, { status: nextStatus });
    success(
      nextStatus === 'active' ? 'Khôi phục lớp học' : 'Lưu trữ lớp học',
      `Lớp ${cls.name} hiện ở trạng thái ${nextStatus === 'active' ? 'Đang học' : 'Lưu trữ'}.`
    );
  };

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
        gender: 'other',
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

  const handleImportExcel = () => {
    if (!classId) return;
    const lines = rawExcelText.trim().split('\n');
    const parsed = lines
      .map((l) => {
        const parts = l.split(/\t|,/);
        if (parts.length >= 2) {
          return {
            code: parts[0]?.trim() || `HS${Math.floor(900 + Math.random() * 99)}`,
            fullName: parts[1]?.trim() || 'Học sinh mới',
            email: parts[2]?.trim() || '',
            phone: parts[3]?.trim() || '',
            classId,
            status: 'active' as const
          };
        }
        return null;
      })
      .filter(Boolean) as Array<Omit<Student, 'id' | 'joinedAt'>>;

    if (parsed.length > 0) {
      store.addStudentsBatch(parsed);
      success('Nhập thành công', `Đã thêm ${parsed.length} học sinh từ dữ liệu bảng tính.`);
      setShowExcelModal(false);
    } else {
      error('Lỗi định dạng', 'Vui lòng kiểm tra lại cấu trúc dữ liệu theo mẫu.');
    }
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
      'Mã học sinh',
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
      st.code,
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
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="p-6 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#5C453C] tracking-tight">{cls.name}</h2>
          <p className="text-xs text-[#9A8A85] max-w-2xl leading-relaxed">{cls.description}</p>
        </div>

        {/* Join code & Share Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F5F0EA] rounded-xl border border-[#EFE3DD] text-xs">
            <span className="text-[#9A8A85] font-medium">Mã tham gia:</span>
            <span className="font-mono font-bold text-[#5C453C] text-sm">{cls.joinCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cls.joinCode);
                success('Đã sao chép', `Mã lớp: ${cls.joinCode}`);
              }}
              className="p-1 text-[#B68176] hover:text-[#A37066] cursor-pointer"
              title="Sao chép mã"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-export-students-csv"
            onClick={handleExportStudentListExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFDF9] text-[#5C453C] hover:bg-[#F5F0EA] font-semibold text-xs rounded-xl border border-[#EFE3DD] shadow-xs transition-colors cursor-pointer"
            title="Xuất danh sách học sinh của lớp ra tệp CSV"
          >
            <Download className="w-4 h-4 text-[#9A8A85]" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-show-class-qr"
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5F0EA] text-[#5C453C] text-xs font-bold rounded-xl transition-colors border border-[#EFE3DD] cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4 text-[#B68176]" />
            <span>Mã QR</span>
          </button>

          <button
            id="btn-edit-class"
            onClick={() => setShowEditClassModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF9] hover:bg-[#F5F0EA] text-[#5C453C] text-xs font-bold rounded-xl transition-colors border border-[#EFE3DD] shadow-xs cursor-pointer"
            title="Chỉnh sửa thông tin lớp học"
          >
            <Edit className="w-4 h-4 text-[#B68176]" />
            <span>Sửa lớp</span>
          </button>

          <button
            id="btn-archive-class"
            onClick={handleToggleArchive}
            className="p-2 bg-[#FFFDF9] hover:bg-[#F5F0EA] text-[#9A8A85] hover:text-[#5C453C] rounded-xl transition-colors border border-[#EFE3DD] cursor-pointer shadow-xs"
            title={cls.status === 'active' ? 'Lưu trữ lớp học' : 'Khôi phục lớp học'}
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            id="btn-delete-class"
            onClick={() => setShowDeleteClassModal(true)}
            className="p-2 bg-[#FFFDF9] hover:bg-red-50 text-[#9A8A85] hover:text-red-600 rounded-xl transition-colors border border-[#EFE3DD] cursor-pointer shadow-xs"
            title="Xóa lớp học này"
          >
            <Trash2 className="w-4 h-4" />
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
                placeholder="Tìm học sinh theo tên, mã HS, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[#5C453C] placeholder-[#9A8A85] outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
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
                  <th className="py-3.5">Họ và tên</th>
                  <th className="py-3.5">Liên hệ & Phụ huynh</th>
                  <th className="py-3.5 text-center">Chuyên cần (10đ)</th>
                  <th className="py-3.5 text-center">Sao thưởng</th>
                  <th className="py-3.5 text-center">Đề đã nộp</th>
                  <th className="py-3.5 text-center">Điểm TB Đề</th>
                  <th className="py-3.5 text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE3DD]/60">
                {filteredStudents.map((st, idx) => {
                  const studentSubs = submissions.filter((s) => s.studentId === st.id);
                  const avg = studentSubs.length > 0
                    ? (studentSubs.reduce((sum, s) => sum + s.totalScore, 0) / studentSubs.length).toFixed(1)
                    : '---';

                  const diligenceSummaries = store.getClassDiligenceSummaries(cls.id);
                  const dSummary = diligenceSummaries.find((d) => d.student.id === st.id);

                  return (
                    <tr key={st.id} className="hover:bg-[#F9EAEA]/30 transition-colors">
                      <td className="py-3 pl-4 text-center font-bold text-[#9A8A85]">{idx + 1}</td>
                      <td className="py-3 font-bold text-[#5C453C] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F9EAEA] text-[#B68176] border border-[#EFE3DD] flex items-center justify-center font-bold text-xs">
                          {st.fullName.charAt(0)}
                        </div>
                        <span>{st.fullName}</span>
                      </td>
                      <td className="py-3 text-[#9A8A85]">
                        <div className="text-xs text-[#5C453C]">{st.phone || st.email || 'Chưa cập nhật'}</div>
                        {(st.parentName || st.parentPhone) && (
                          <div className="text-[11px] text-[#B68176] font-medium mt-0.5 flex items-center gap-1">
                            <span className="font-bold">PH:</span>
                            <span>{st.parentName || 'Phụ huynh'} {st.parentRelationship ? `(${st.parentRelationship})` : ''}</span>
                            {st.parentPhone && <span className="font-mono text-[10px] text-[#5C453C]">· {st.parentPhone}</span>}
                          </div>
                        )}
                      </td>
                      {/* Diligence Score */}
                      <td className="py-3 text-center">
                        {dSummary ? (
                          <span
                            className={`px-2 py-0.5 rounded-lg font-black text-xs ${
                              dSummary.diligenceScore >= 9.0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : dSummary.diligenceScore >= 7.5
                                ? 'bg-[#F9EAEA] text-[#B68176] border border-[#EFE3DD]'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {dSummary.diligenceScore.toFixed(1)}đ
                          </span>
                        ) : (
                          <span className="text-[#9A8A85]">10.0đ</span>
                        )}
                      </td>
                      {/* Bonus Stars */}
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>+{dSummary ? dSummary.bonusPoints : 0}</span>
                        </span>
                      </td>
                      <td className="py-3 text-center text-[#5C453C] font-medium">{studentSubs.length} bài</td>
                      <td className="py-3 text-center font-extrabold text-[#B68176]">{avg}</td>
                      <td className="py-3 text-right pr-4 space-x-1">
                        <button
                          onClick={() => {
                            setSelectedStudentForReport(st);
                            setShowMonthlyReportModal(true);
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Xem & xuất phiếu báo cáo học tập tháng cho học sinh này"
                        >
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>Phiếu</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForBonus(st);
                            setShowAwardBonusModal(true);
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Thưởng sao thi đua"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>+Sao</span>
                        </button>
                        <button
                          onClick={() => openStudentModal(st)}
                          className="p-1.5 text-[#9A8A85] hover:text-[#5C453C] rounded-lg hover:bg-[#F5F0EA] transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteStudentId(st.id)}
                          className="p-1.5 text-[#9A8A85] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
      {activeTab === 'gradebook' && (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-x-auto p-4 space-y-4 font-sans">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#5C453C] text-sm">Bảng điểm tổng hợp lớp {cls.name}</h3>
              <p className="text-xs text-[#9A8A85]">Bao gồm ma trận điểm kiểm tra, điểm chuyên cần và sao thi đua</p>
            </div>
            <button
              onClick={() => {
                const diligenceSummaries = store.getClassDiligenceSummaries(cls.id);
                const rows = [
                  [
                    'Mã HS',
                    'Họ và tên',
                    ...exams.map((ex) => ex.title),
                    'Điểm TB Đề',
                    'Chuyên cần (10đ)',
                    'Sao thưởng',
                    'Xếp loại'
                  ],
                  ...students.map((st) => {
                    const d = diligenceSummaries.find((ds) => ds.student.id === st.id);
                    let sum = 0;
                    let cnt = 0;
                    const scores = exams.map((ex) => {
                      const sub = submissions.find((s) => s.examId === ex.id && s.studentId === st.id);
                      if (sub) {
                        sum += sub.totalScore;
                        cnt++;
                        return sub.totalScore;
                      }
                      return '-';
                    });
                    const avg = cnt > 0 ? (sum / cnt).toFixed(1) : '-';
                    return [
                      st.code,
                      st.fullName,
                      ...scores,
                      avg,
                      d ? d.diligenceScore.toFixed(1) : '10.0',
                      d ? d.bonusPoints : 0,
                      d ? d.rankTier : 'Tốt'
                    ];
                  })
                ];
                const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `BangDiemTongHop_${cls.name.replace(/\s+/g, '_')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                info('Xuất bảng điểm', 'Đã tải xuống tệp dữ liệu điểm tổng hợp.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] text-xs font-bold rounded-xl border border-[#EFE3DD] cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#9A8A85]" />
              <span>Xuất CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F0EA] border-b border-[#EFE3DD] text-[#5C453C] font-bold">
                <th className="py-3 px-3">Mã HS</th>
                <th className="py-3 px-3 min-w-[140px]">Họ và tên</th>
                {exams.map((ex) => (
                  <th key={ex.id} className="py-3 px-3 text-center min-w-[120px]">
                    <div className="truncate max-w-[120px]" title={ex.title}>{ex.title}</div>
                    <span className="text-[10px] text-[#9A8A85] font-normal">Thang {ex.maxScore}đ</span>
                  </th>
                ))}
                <th className="py-3 px-3 text-center bg-[#F9EAEA] text-[#B68176] font-extrabold">Điểm TB Đề</th>
                <th className="py-3 px-3 text-center bg-[#FAF4F0] text-[#5C453C] font-extrabold min-w-[110px]">Chuyên cần</th>
                <th className="py-3 px-3 text-center bg-amber-50/70 text-amber-900 font-extrabold min-w-[90px]">Sao thưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE3DD]">
              {students.map((st) => {
                let totalEarned = 0;
                let testCount = 0;
                const dSummary = store.getClassDiligenceSummaries(cls.id).find((d) => d.student.id === st.id);

                return (
                  <tr key={st.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#B68176]">{st.code}</td>
                    <td className="py-2.5 px-3 font-bold text-[#5C453C]">{st.fullName}</td>
                    {exams.map((ex) => {
                      const sub = submissions.find((s) => s.examId === ex.id && s.studentId === st.id);
                      if (sub) {
                        totalEarned += sub.totalScore;
                        testCount++;
                      }
                      return (
                        <td key={ex.id} className="py-2.5 px-3 text-center">
                          {sub ? (
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                sub.totalScore >= 8
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : sub.totalScore >= 5
                                  ? 'bg-[#F5F0EA] text-[#5C453C] border border-[#EFE3DD]'
                                  : 'bg-[#F9EAEA] text-[#B68176] border border-[#F0D5D0]'
                              }`}
                            >
                              {sub.totalScore}
                            </span>
                          ) : (
                            <span className="text-[#9A8A85] text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-center font-black font-mono text-[#B68176] bg-[#F9EAEA]/40">
                      {testCount > 0 ? (totalEarned / testCount).toFixed(1) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black font-mono bg-[#FAF4F0]">
                      <span className="text-[#5C453C]">
                        {dSummary ? dSummary.diligenceScore.toFixed(1) : '10.0'}đ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold bg-amber-50/40">
                      <span className="inline-flex items-center gap-1 text-amber-900">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>+{dSummary ? dSummary.bonusPoints : 0}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C453C]/50 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#EFE3DD] overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#EFE3DD] bg-[#F5F0EA] flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#5C453C]">
                {editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#9A8A85] hover:bg-[#EFE3DD] hover:text-[#5C453C] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="font-bold text-[#5C453C] block mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Bảo Nam"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                />
              </div>
              <div>
                <label className="font-bold text-[#5C453C] block mb-1">Email học sinh / liên hệ</label>
                <input
                  type="email"
                  placeholder="baonam@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                />
              </div>
              <div>
                <label className="font-bold text-[#5C453C] block mb-1">Số điện thoại học sinh</label>
                <input
                  type="tel"
                  placeholder="0981 112 201"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                />
              </div>

              {/* Mở rộng thông tin phụ huynh */}
              <div className="pt-2 border-t border-[#EFE3DD]">
                <button
                  type="button"
                  onClick={() => setShowParentSection(!showParentSection)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F5F0EA]/80 hover:bg-[#F5F0EA] text-[#5C453C] transition-colors cursor-pointer border border-[#EFE3DD]"
                >
                  <span className="flex items-center gap-1.5 font-bold text-xs">
                    <Users className="w-4 h-4 text-[#B68176]" />
                    <span>Thông tin phụ huynh</span>
                    {(parentName || parentPhone) && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-md font-bold">
                        Đã điền
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-[#B68176] font-semibold flex items-center gap-1">
                    <span>Xem thêm</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        showParentSection ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>

                {showParentSection && (
                  <div className="mt-2.5 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#EFE3DD] space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-[#5C453C] block mb-1">Họ tên phụ huynh</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Bác Trần Văn Hùng"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#5C453C] block mb-1">Mối quan hệ</label>
                        <select
                          value={parentRelationship}
                          onChange={(e) => setParentRelationship(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
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
                        <label className="font-bold text-[#5C453C] block mb-1">SĐT phụ huynh (Zalo)</label>
                        <input
                          type="tel"
                          placeholder="0912 345 678"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#5C453C] block mb-1">Email phụ huynh</label>
                        <input
                          type="email"
                          placeholder="phuhuynh@gmail.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs bg-[#FFFDF9] text-[#5C453C] focus:ring-2 focus:ring-[#B68176] outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE3DD]">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] font-semibold rounded-xl transition-colors cursor-pointer border border-[#EFE3DD]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B68176] hover:bg-[#A37066] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Simulation Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Nhập danh sách học sinh từ Excel</h3>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Dán dữ liệu từ bảng tính Excel theo các cột: <strong>Mã HS | Họ và tên | Email | SĐT</strong> (ngăn cách bằng phím Tab hoặc dấu phẩy).
              </p>
              <textarea
                rows={6}
                value={rawExcelText}
                onChange={(e) => setRawExcelText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleImportExcel}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Nhập vào danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Award Bonus Modal */}
      {showAwardBonusModal && (
        <AwardBonusModal
          cls={cls}
          students={students}
          initialStudent={selectedStudentForBonus}
          isOpen={showAwardBonusModal}
          onClose={() => {
            setShowAwardBonusModal(false);
            setSelectedStudentForBonus(null);
          }}
          onSuccess={() => {
            // Refreshes store triggers automatically via subscription
          }}
        />
      )}

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
                onBonusClick={(st) => {
                  setSelectedStudentForBonus(st);
                  setShowAwardBonusModal(true);
                }}
                onGoToSchedule={() => {
                  setShowAttendanceModal(false);
                  setActiveTab('schedule');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
