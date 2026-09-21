import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Calendar,
  Share2,
  Trash2,
  Edit,
  Copy,
  BarChart3,
  CheckSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  Send,
  Sliders,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, ClassRoom, Submission } from '../../types';
import { ExamStatusBadge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { QRModal } from '../../components/common/QRModal';
import { useToast } from '../../context/ToastContext';
import { CreateHomeworkModal } from './components/CreateHomeworkModal';
import { AssignExamModal } from './components/AssignExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';

export const HomeworkListView: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Modals
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [shareExam, setShareExam] = useState<Exam | null>(null);
  const [assignExam, setAssignExam] = useState<Exam | null>(null);
  const [infoModalExam, setInfoModalExam] = useState<Exam | null>(null);
  const [showCreateHomeworkModal, setShowCreateHomeworkModal] = useState(false);
  const [createHomeworkInitialMode, setCreateHomeworkInitialMode] = useState<'upload' | 'manual' | 'bank'>('upload');

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setExams(store.getExams());
      setClasses(store.getClasses());
      setSubmissions(store.getSubmissions());
    });
    return unsub;
  }, []);

  const handleDeleteConfirm = () => {
    if (deleteExamId) {
      store.deleteExam(deleteExamId);
      setDeleteExamId(null);
      success('Đã xóa bài tập', 'Bài tập đã được xóa khỏi danh sách quản lý.');
    }
  };

  const handleDuplicate = (id: string) => {
    const dup = store.duplicateExam(id);
    if (dup) {
      success('Nhân bản thành công', 'Đã tạo một bản sao bài tập mới ở trạng thái bản nháp.');
    }
  };

  // Filter specifically for HOMEWORK (durationMinutes === 0 OR assignmentType === 'homework' OR isUnlimitedTime)
  const homeworkList = exams.filter((ex) => {
    const isHomework =
      ex.settings?.assignmentType === 'homework' ||
      ex.settings?.isUnlimitedTime ||
      ex.durationMinutes === 0 ||
      ex.title.toLowerCase().includes('bài tập') ||
      ex.title.toLowerCase().includes('về nhà');

    const matchSearch =
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || ex.status === statusFilter;
    const matchGrade = gradeFilter === 'all' || ex.grade === gradeFilter;

    // Quick Tab filter
    if (activeTabFilter === 'open' && ex.status !== 'published') return false;
    if (activeTabFilter === 'closed' && ex.status !== 'closed') return false;

    return isHomework && matchSearch && matchStatus && matchGrade;
  });

  // Homework Analytics
  const totalHomework = exams.filter(
    (e) =>
      e.settings?.assignmentType === 'homework' ||
      e.settings?.isUnlimitedTime ||
      e.durationMinutes === 0 ||
      e.title.toLowerCase().includes('bài tập')
  ).length;

  const openHomework = exams.filter(
    (e) =>
      e.status === 'published' &&
      (e.settings?.assignmentType === 'homework' ||
        e.settings?.isUnlimitedTime ||
        e.durationMinutes === 0 ||
        e.title.toLowerCase().includes('bài tập'))
  ).length;

  const closedHomework = exams.filter(
    (e) =>
      e.status === 'closed' &&
      (e.settings?.assignmentType === 'homework' ||
        e.settings?.isUnlimitedTime ||
        e.durationMinutes === 0 ||
        e.title.toLowerCase().includes('bài tập'))
  ).length;

  const totalHomeworkSubmissions = submissions.filter((s) => {
    const ex = exams.find((e) => e.id === s.examId);
    return (
      ex?.settings?.assignmentType === 'homework' ||
      ex?.settings?.isUnlimitedTime ||
      ex?.durationMinutes === 0 ||
      ex?.title.toLowerCase().includes('bài tập')
    );
  }).length;

  return (
    <div id="homework-list-view" className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Quản lý Bài tập về nhà
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Giao bài rèn luyện, thiết lập hạn chót và gửi link qua Zalo lớp học
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            id="btn-hw-import-wizard"
            onClick={() => navigate('/teacher/import-wizard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Tách bài tập bằng AI</span>
          </button>

          <button
            id="btn-create-homework"
            onClick={() => {
              setCreateHomeworkInitialMode('upload');
              setShowCreateHomeworkModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Giao bài tập mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">Tổng bài tập</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalHomework}</span>
            <span className="text-xs text-slate-400">bài đã tạo</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block">Đang mở nhận bài</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-600">{openHomework}</span>
            <span className="text-xs text-slate-400">bài mở nộp</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 block">Tổng lượt nộp bài</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-indigo-600">{totalHomeworkSubmissions}</span>
            <span className="text-xs text-slate-400">bài làm gửi lên</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block">Tự động chấm 100%</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-600">100%</span>
            <span className="text-xs text-slate-400">trắc nghiệm</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm bài tập theo tiêu đề, môn học, chuyên đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 outline-hidden font-medium"
          />
        </div>

        {/* Quick Tabs & Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto text-xs flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTabFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('open')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTabFilter === 'open'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đang mở ({openHomework})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('closed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTabFilter === 'closed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã đóng ({closedHomework})
            </button>
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Tất cả khối</option>
            <option value="Khối 6">Khối 6</option>
            <option value="Khối 7">Khối 7</option>
            <option value="Khối 8">Khối 8</option>
            <option value="Khối 9">Khối 9</option>
          </select>
        </div>
      </div>

      {/* Homework Grid */}
      {homeworkList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Chưa có bài tập nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Bạn có thể bấm <strong>"Giao bài tập mới"</strong> để thiết lập nhanh đề bài, chọn lớp và tạo link làm bài trực tuyến.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowCreateHomeworkModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Giao bài tập mới ngay</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {homeworkList.map((exam) => {
            const examSubs = submissions.filter((s) => s.examId === exam.id);
            const pendingGrading = examSubs.filter(
              (s) => s.status === 'pending_grading' || s.needsManualGrading
            ).length;
            const assignedNames = (exam.assignedClassIds || [])
              .map((cid) => classes.find((c) => c.id === cid)?.name)
              .filter(Boolean)
              .join(', ');

            const deadline = exam.closeTime || exam.settings?.closeTime;
            const isLateAllowed = exam.settings?.allowLateSubmission ?? true;
            const isPhotoUploadAllowed = exam.settings?.allowFileUploadEssay ?? true;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-blue-300"
              >
                <div className="p-5 space-y-3.5">
                  {/* Top badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPhotoUploadAllowed && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-200">
                          <Camera className="w-3 h-3 text-blue-600" />
                          <span>Chụp ảnh nộp</span>
                        </span>
                      )}
                    </div>
                    <ExamStatusBadge status={exam.status} />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                      <Link to={`/teacher/exam-builder/${exam.id}`}>{exam.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {exam.description || 'Xem đề và nộp bài tập theo hướng dẫn.'}
                    </p>
                  </div>

                  {/* Azota Specs Bar */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-2xl text-center border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Hình thức</span>
                      <span className="font-bold text-slate-800">
                        {exam.durationMinutes === 0 ? 'Về nhà' : `${exam.durationMinutes}p`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Số bài</span>
                      <span className="font-bold text-slate-800">{exam.questions?.length || 0} câu</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Đã nộp</span>
                      <span className="font-bold text-blue-600">{examSubs.length} bài</span>
                    </div>
                  </div>

                  {/* Deadline & Class info */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        Hạn nộp:{' '}
                        {deadline ? (
                          <strong className="text-slate-800">
                            {new Date(deadline).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </strong>
                        ) : (
                          <span className="text-emerald-700 font-bold">Không giới hạn</span>
                        )}
                        {isLateAllowed && deadline && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md ml-1 font-bold">
                            Nộp muộn OK
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Lớp: <strong>{assignedNames || 'Chưa chọn lớp'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Submission and auto-grading status */}
                  {examSubs.length > 0 ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{examSubs.length} bài đã nộp (Tự động chấm)</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">Hoàn tất</span>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Actions: Central Azota "Giao bài" (Assign) */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setAssignExam(exam)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Cài đặt & Giao bài</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShareExam(exam)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Mã QR & Link nộp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/teacher/reports?examId=${exam.id}`}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Báo cáo nộp bài"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(exam.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Nhân bản bài tập"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/teacher/exam-builder/${exam.id}`}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Chỉnh sửa bài tập"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteExamId(exam.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share QR Modal */}
      {shareExam && (
        <QRModal
          isOpen={Boolean(shareExam)}
          title={`Chia sẻ bài tập: ${shareExam.title}`}
          subtitle={`Hình thức: Bài tập về nhà • Thang điểm: ${shareExam.maxScore}đ`}
          url={`/exam/${shareExam.id}`}
          code={shareExam.id.slice(-6).toUpperCase()}
          onClose={() => setShareExam(null)}
        />
      )}

      {/* Full Azota Assign Exam / Homework Modal */}
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
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteExamId)}
        title="Xác nhận xóa bài tập"
        message="Thao tác này sẽ xóa bài tập khỏi danh sách giao cho học sinh."
        confirmText="Xóa bài tập"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteExamId(null)}
      />

      {/* Create Homework Modal (Azota Style) */}
      {showCreateHomeworkModal && (
        <CreateHomeworkModal
          isOpen={showCreateHomeworkModal}
          initialMode={createHomeworkInitialMode}
          onClose={() => setShowCreateHomeworkModal(false)}
          onSuccess={() => {
            setExams(store.getExams());
          }}
        />
      )}
    </div>
  );
};
