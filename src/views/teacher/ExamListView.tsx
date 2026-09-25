import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Share2,
  Sparkles,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  CheckSquare,
  Clock,
  Users,
  Eye,
  ExternalLink,
  ShieldAlert,
  Shuffle,
  Send,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Radio,
  Calendar,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  QrCode,
  SlidersHorizontal,
  Check,
  Edit3
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, ClassRoom, Submission, Student } from '../../types';
import { ExamStatusBadge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { AssignExamModal } from './components/AssignExamModal';
import { LiveExamMonitorModal } from './components/LiveExamMonitorModal';
import { AzotaCreateExamModal } from './components/AzotaCreateExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';

export const ExamListView: React.FC = () => {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [students, setStudents] = useState<Student[]>(store.getStudents());

  // Main View Switcher: 'sessions' (Quản lý các ca thi đã giao) vs 'repository' (Kho đề thi)
  const [viewMode, setViewMode] = useState<'sessions' | 'repository'>('sessions');

  const [searchTerm, setSearchTerm] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'closed'>('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  const [shareExam, setShareExam] = useState<Exam | null>(null);
  const [infoModalExam, setInfoModalExam] = useState<Exam | null>(null);
  const [assignExam, setAssignExam] = useState<Exam | null>(null);
  const [liveMonitorExam, setLiveMonitorExam] = useState<Exam | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);
  const [showAzotaCreateModal, setShowAzotaCreateModal] = useState(false);
  const [createModalInitialTab, setCreateModalInitialTab] = useState<'file' | 'compose' | 'quick_sheet' | 'bank'>('file');

  useEffect(() => {
    const refresh = () => {
      setExams(store.getExams());
      setClasses(store.getClasses());
      setSubmissions(store.getSubmissions());
      setStudents(store.getStudents());
    };
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  const handleDuplicate = (id: string) => {
    const dup = store.duplicateExam(id);
    if (dup) {
      success('Đã nhân bản đề thi', `Bản sao: ${dup.title}`);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteExamId) {
      store.deleteExam(deleteExamId);
      setDeleteExamId(null);
      success('Đã xóa đề thi', 'Đề thi đã được xóa thành công khỏi hệ thống.');
    }
  };

  const handleCloseSessionNow = (examId: string) => {
    store.updateExam(examId, { status: 'closed' });
    success('Đã đóng ca thi', 'Ca thi đã được đóng thành công. Thí sinh không thể vào làm bài thêm.');
  };

  const handleReopenSession = (examId: string) => {
    store.updateExam(examId, { status: 'published' });
    success('Đã mở lại ca thi', 'Ca thi đã được kích hoạt trực tuyến.');
  };

  const handleCopyZalo = (exam: Exam) => {
    const examUrl = `${window.location.origin}/exam/${exam.id}`;
    const deadlineStr = exam.closeTime
      ? new Date(exam.closeTime).toLocaleString('vi-VN')
      : 'Không giới hạn';
    const pwdStr =
      exam.settings.requirePassword && exam.settings.password
        ? `\n🔑 Mật khẩu vào ca thi: ${exam.settings.password}`
        : '';
    const proctorStr = exam.settings.trackTabSwitches
      ? '\n⚠️ Lưu ý: Hệ thống giám sát chuyển tab và ghi nhận số lần rời màn hình thi.'
      : '';
    const msg = `📢 THÔNG BÁO CA THI TRỰC TUYẾN\n📝 Đề: ${exam.title}\n📚 Môn: ${exam.subject} (${exam.grade})\n⏱️ Thời gian: ${exam.durationMinutes} phút (đếm ngược)\n⏰ Hạn đóng ca: ${deadlineStr}${pwdStr}${proctorStr}\n\n👉 Link vào thi trực tuyến: ${examUrl}`;

    navigator.clipboard.writeText(msg);
    setCopiedExamId(exam.id);
    success('Đã chép mẫu tin Zalo', 'Mẫu tin thông báo ca thi đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  // Base Exams (exam assignmentType or standard timed exams)
  const examPool = exams.filter((exam) => {
    return (
      exam.settings?.assignmentType === 'exam' ||
      (exam.durationMinutes > 0 && !exam.settings?.isUnlimitedTime) ||
      exam.title.toLowerCase().includes('kiểm tra') ||
      exam.title.toLowerCase().includes('thi')
    );
  });

  // Determine session timing status for each exam
  const getSessionStatus = (exam: Exam): 'live' | 'scheduled' | 'closed' => {
    if (exam.status === 'closed') return 'closed';
    const now = new Date().getTime();
    if (exam.openTime && new Date(exam.openTime).getTime() > now) {
      return 'scheduled';
    }
    if (exam.closeTime && new Date(exam.closeTime).getTime() < now) {
      return 'closed';
    }
    if (exam.status === 'published') {
      return 'live';
    }
    return 'closed';
  };

  // Filtered for "Sessions" mode
  const sessionExams = examPool.filter((exam) => {
    // Show exams that have been configured / published / assigned
    const matchSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getSessionStatus(exam);
    const matchStatus =
      sessionStatusFilter === 'all' ||
      (sessionStatusFilter === 'live' && status === 'live') ||
      (sessionStatusFilter === 'scheduled' && status === 'scheduled') ||
      (sessionStatusFilter === 'closed' && status === 'closed');

    const matchGrade = gradeFilter === 'all' || exam.grade === gradeFilter;

    return matchSearch && matchStatus && matchGrade;
  });

  // Filtered for "Repository" mode
  const repositoryExams = examPool.filter((exam) => {
    const matchSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = gradeFilter === 'all' || exam.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  // Analytics
  const totalExams = examPool.length;
  const liveSessionsCount = examPool.filter((e) => getSessionStatus(e) === 'live').length;
  const scheduledSessionsCount = examPool.filter((e) => getSessionStatus(e) === 'scheduled').length;
  const closedSessionsCount = examPool.filter((e) => getSessionStatus(e) === 'closed').length;

  const totalExamSubmissions = submissions.filter((s) => {
    const ex = exams.find((e) => e.id === s.examId);
    return (
      ex?.settings?.assignmentType === 'exam' ||
      (ex && ex.durationMinutes > 0 && !ex.settings?.isUnlimitedTime)
    );
  }).length;

  const pendingGradingCount = submissions.filter((s) => {
    const ex = exams.find((e) => e.id === s.examId);
    return (
      (s.status === 'pending_grading' || s.needsManualGrading) &&
      (ex?.settings?.assignmentType === 'exam' ||
        (ex && ex.durationMinutes > 0 && !ex.settings?.isUnlimitedTime))
    );
  }).length;

  return (
    <div id="exam-management-view" className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Quản lý đề thi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổ chức phòng thi đếm ngược, giám sát chuyển tab trực tiếp, đảo đề và xuất bản đề thi đa kênh
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            id="btn-exam-import-wizard"
            onClick={() => navigate('/teacher/import-wizard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Nhập đề AI (Word/PDF)</span>
          </button>

          <button
            id="btn-create-exam-blank"
            onClick={() => {
              setCreateModalInitialTab('file');
              setShowAzotaCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tạo đề mới</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Ca thi đã giao (Sessions) vs Kho Đề thi (Repository) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-1.5 bg-slate-200/70 rounded-2xl">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('sessions')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'sessions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Đề thi đã tạo</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-extrabold">
              {sessionExams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('repository')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'repository'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Kho Đề thi của tôi</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
              {totalExams}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-white rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={viewMode === 'sessions' ? 'Tìm ca thi theo tên đề, môn...' : 'Tìm trong kho đề thi...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 outline-hidden font-medium"
          />
        </div>
      </div>

      {/* TAB 1: SESSIONS MANAGEMENT (QUẢN LÝ CÁC CA THI ĐÃ GIAO) */}
      {viewMode === 'sessions' && (
        <div className="space-y-4">
          {/* Status Sub-filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setSessionStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sessionStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({examPool.length})
              </button>
              <button
                type="button"
                onClick={() => setSessionStatusFilter('live')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sessionStatusFilter === 'live'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đang mở ({liveSessionsCount})
              </button>
              <button
                type="button"
                onClick={() => setSessionStatusFilter('closed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sessionStatusFilter === 'closed'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đã đóng ({closedSessionsCount})
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {sessionExams.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <Radio className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Chưa có ca thi nào phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Chọn một đề thi từ kho đề thi bên dưới để cấu hình và phát hành ca thi trực tuyến cho học sinh.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('repository')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Chọn đề từ kho để giao ngay
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionExams.map((exam) => {
                const status = getSessionStatus(exam);
                const isLive = status === 'live';
                const isScheduled = status === 'scheduled';
                const isClosed = status === 'closed';

                const assignedClasses = classes.filter((c) =>
                  exam.assignedClassIds?.includes(c.id)
                );
                const totalTargetStudents = assignedClasses.reduce(
                  (acc, c) => acc + (students.filter((s) => s.classId === c.id).length || 0),
                  0
                );

                const examSubs = submissions.filter((s) => s.examId === exam.id);
                const submittedCount = examSubs.length;
                const percentDone =
                  totalTargetStudents > 0
                    ? Math.min(100, Math.round((submittedCount / totalTargetStudents) * 100))
                    : submittedCount > 0
                    ? 100
                    : 0;

                const isAntiCheat =
                  exam.settings?.trackTabSwitches || exam.settings?.strictFullScreen;
                const isShuffled =
                  exam.settings?.shuffleQuestions || exam.settings?.shuffleOptions;
                const hasPassword = exam.settings?.requirePassword;

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-blue-300"
                  >
                    {/* Left: Exam Info & Status */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Đang mở</span>
                          </span>
                        )}
                        {isScheduled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>Sắp diễn ra</span>
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Đã đóng</span>
                          </span>
                        )}

                        {isAntiCheat && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Chống gian lận tab</span>
                          </span>
                        )}

                        {isShuffled && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Shuffle className="w-3 h-3 text-blue-600" />
                            <span>Đảo đề</span>
                          </span>
                        )}

                        {hasPassword && (
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>Mật khẩu: {exam.settings.password}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                          <Link to={`/teacher/exam-builder/${exam.id}`}>{exam.title}</Link>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <strong>{exam.durationMinutes} phút</strong> đếm ngược
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Lớp:{' '}
                            <strong>
                              {assignedClasses.length > 0
                                ? assignedClasses.map((c) => c.name).join(', ')
                                : 'Tất cả (Công khai)'}
                            </strong>
                          </span>
                          {exam.closeTime && (
                            <span className="text-slate-500">
                              Hạn đóng ca: {new Date(exam.closeTime).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar of participation */}
                      <div className="max-w-md space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            Tiến độ nộp bài:{' '}
                            <strong className="text-blue-600">
                              {submittedCount}/{totalTargetStudents || submittedCount} thí sinh
                            </strong>
                          </span>
                          <span className="font-bold text-slate-500">{percentDone}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentDone === 100
                                ? 'bg-emerald-500'
                                : percentDone > 50
                                ? 'bg-blue-600'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentDone}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions Cluster */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Live Proctoring Button */}
                      <button
                        type="button"
                        onClick={() => setLiveMonitorExam(exam)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        title="Vào phòng giám sát trực tiếp"
                      >
                        <span>Giám sát</span>
                      </button>

                      {/* Edit Assignment Settings */}
                      <button
                        type="button"
                        onClick={() => setAssignExam(exam)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Cấu hình lại thời gian, mật khẩu, đối tượng"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                        <span>Cài đặt bài làm</span>
                      </button>

                      {/* Share QR & Info */}
                      <button
                        type="button"
                        onClick={() => setInfoModalExam(exam)}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                        title="Xem thông tin bài thi & Mã QR"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Analytics / Scores */}
                      <Link
                        to={`/teacher/reports?examId=${exam.id}`}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors flex items-center justify-center"
                        title="Báo cáo phân tích phổ điểm"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      {/* Close or Reopen Exam */}
                      {isLive ? (
                        <button
                          type="button"
                          onClick={() => handleCloseSessionNow(exam.id)}
                          className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          title="Đóng phòng thi ngay lập tức"
                        >
                          Đóng ca
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReopenSession(exam.id)}
                          className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          title="Mở lại phòng thi"
                        >
                          Mở lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXAM REPOSITORY (KHO ĐỀ THI ĐỂ GIAO) */}
      {viewMode === 'repository' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">
              Danh sách các đề thi sẵn sàng để xuất bản hoặc chỉnh sửa nội dung:
            </span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repositoryExams.map((exam) => {
              const examSubs = submissions.filter((s) => s.examId === exam.id);
              const pendingGrading = examSubs.filter(
                (s) => s.status === 'pending_grading' || s.needsManualGrading
              ).length;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-blue-300"
                >
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <ExamStatusBadge status={exam.status} />
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                        <Link to={`/teacher/exam-builder/${exam.id}`}>{exam.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {exam.description || 'Đề thi trắc nghiệm khách quan 100% được lưu trong ngân hàng.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-2xl text-center border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Thời gian</span>
                        <span className="font-bold text-slate-800">{exam.durationMinutes} phút</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Số câu</span>
                        <span className="font-bold text-slate-800">{exam.questions?.length || 0} câu</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Đã thi</span>
                        <span className="font-bold text-blue-600">{examSubs.length} bài</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Prominent "Cấu hình & Giao đề thi" */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setAssignExam(exam)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Cấu hình & Giao đề</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInfoModalExam(exam)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Xem thông tin bài thi & Mã QR"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(exam.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Nhân bản đề"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/teacher/exam-builder/${exam.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Sửa câu hỏi"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteExamId(exam.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa đề"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share QR Modal */}
      {shareExam && (
        <QRModal
          isOpen={Boolean(shareExam)}
          title={`Chia sẻ phòng thi: ${shareExam.title}`}
          subtitle={`Thời gian làm bài: ${shareExam.durationMinutes} phút • Thang điểm: ${shareExam.maxScore}đ`}
          url={`/exam/${shareExam.id}`}
          code={shareExam.id.slice(-6).toUpperCase()}
          onClose={() => setShareExam(null)}
        />
      )}

      {/* Assign Exam Modal (Azota 5-tab) */}
      {assignExam && (
        <AssignExamModal
          isOpen={Boolean(assignExam)}
          exam={assignExam}
          onClose={() => setAssignExam(null)}
          onSuccess={(updated) => {
            setExams(store.getExams());
            setAssignExam(null);
            setInfoModalExam(updated);
          }}
          onOpenLiveMonitor={(ex) => {
            setAssignExam(null);
            setLiveMonitorExam(ex);
          }}
        />
      )}

      {/* Live Proctoring Monitor Modal */}
      {liveMonitorExam && (
        <LiveExamMonitorModal
          isOpen={Boolean(liveMonitorExam)}
          exam={liveMonitorExam}
          onClose={() => setLiveMonitorExam(null)}
          onOpenAssignSettings={() => {
            const cur = liveMonitorExam;
            setLiveMonitorExam(null);
            setAssignExam(cur);
          }}
        />
      )}

      {/* Azota Exam Creation Modal */}
      {showAzotaCreateModal && (
        <AzotaCreateExamModal
          isOpen={showAzotaCreateModal}
          onClose={() => {
            setShowAzotaCreateModal(false);
            setExams(store.getExams());
          }}
          initialTab={createModalInitialTab}
          onSaveAndAssign={(newExam) => {
            setExams(store.getExams());
            setAssignExam(newExam);
          }}
          onSaveToRepository={(newExam) => {
            setExams(store.getExams());
            setViewMode('repository');
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
            setAssignExam(exam);
          }}
          onOpenLiveMonitor={(exam) => {
            setInfoModalExam(null);
            setLiveMonitorExam(exam);
          }}
        />
      )}

      {/* Delete Exam Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteExamId)}
        title="Xác nhận xóa đề thi"
        message="Thao tác này sẽ xóa đề thi khỏi hệ thống. Các bài nộp và thống kê phổ điểm trước đây vẫn được lưu trong lịch sử."
        confirmText="Xóa đề thi"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteExamId(null)}
      />
    </div>
  );
};
