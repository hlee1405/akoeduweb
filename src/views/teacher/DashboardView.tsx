import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Share2,
  TrendingUp,
  LayoutDashboard,
  Clock,
  UserCheck,
  Send,
  ArrowRight,
  BookOpen,
  MapPin,
  Users,
  ChevronRight,
  FileText,
  CheckSquare,
  Sparkles,
  Eye
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, ClassRoom, Student, Submission, TeacherProfile, CalendarSession } from '../../types';
import { ExamStatusBadge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { useTheme } from '../../context/ThemeContext';
import { UpcomingScheduleWidget } from './components/UpcomingScheduleWidget';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [teacher, setTeacher] = useState<TeacherProfile>(store.getTeacher());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [students, setStudents] = useState<Student[]>(store.getStudents());
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [sessions, setSessions] = useState<CalendarSession[]>(store.getSessions());
  const [shareExam, setShareExam] = useState<Exam | null>(null);

  useEffect(() => {
    const handleStoreChange = () => {
      setTeacher(store.getTeacher());
      setClasses(store.getClasses());
      setStudents(store.getStudents());
      setExams(store.getExams());
      setSubmissions(store.getSubmissions());
      setSessions(store.getSessions());
    };

    const unsub = store.subscribe(handleStoreChange);
    return unsub;
  }, []);

  const activeClassesCount = classes.filter((c) => c.status === 'active').length;
  // Đề / bài tập đang trong thời gian giao (được phát hành và còn hạn nhận bài)
  const activeAssignedExams = exams.filter((e) => {
    if (e.status !== 'published') return false;
    const now = new Date();
    if (e.closeTime) {
      const close = new Date(e.closeTime);
      if (!isNaN(close.getTime()) && close < now && close >= new Date('2026-01-01')) {
        return false;
      }
    }
    return true;
  });
  const activeAssignedCount = activeAssignedExams.length;

  // Find ongoing session
  const ongoingSession = sessions.find((s) => {
    if (s.status === 'ongoing' || (s as any).status === 'ongoing') return true;
    const nowTime = new Date();
    const curYear = nowTime.getFullYear();
    const curMonth = String(nowTime.getMonth() + 1).padStart(2, '0');
    const curDate = String(nowTime.getDate()).padStart(2, '0');
    const actualToday = `${curYear}-${curMonth}-${curDate}`;
    if (s.date === actualToday && s.startTime && s.endTime) {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const startMinutes = (startH || 0) * 60 + (startM || 0);
      const endMinutes = (endH || 0) * 60 + (endM || 0);
      const curMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
      return curMinutes >= startMinutes && curMinutes <= endMinutes;
    }
    return false;
  });

  const ongoingClass = ongoingSession?.classId ? classes.find((c) => c.id === ongoingSession.classId) : classes[0];
  const ongoingStudentsCount = ongoingClass ? students.filter((st) => st.classId === ongoingClass.id).length : 24;

  // Thống kê lịch dạy trong tháng hiện tại
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const thisMonthSessions = sessions.filter((s) => s.date.startsWith(currentMonthPrefix));
  const monthlySessionsCount = thisMonthSessions.length;

  const validScores = submissions.map((s) => s.totalScore);
  const averageScore = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : '0.0';

  const recentExams = activeAssignedExams.slice(0, 4);

  return (
    <div id="teacher-dashboard-view" className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs"
              style={{
                backgroundColor: `${themeConfig.colors.primary}12`,
                borderColor: `${themeConfig.colors.primary}25`,
                color: themeConfig.colors.primary,
              }}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span>Tổng quan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chào buổi sáng, {teacher.fullName}! • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Row (4-card grid with clean white surface) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider h-8 flex items-center">Lớp hoạt động</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{String(activeClassesCount).padStart(2, '0')}</span>
            <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+1 tháng này</span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider h-8 flex items-center">Tổng học sinh</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{students.length}</span>
            <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+12 mới</span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider h-8 flex items-center" title="Đề thi và bài tập đang trong hạn làm bài">
            Bài đang giao
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{String(activeAssignedCount).padStart(2, '0')}</span>
            <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Đang giao</span>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider h-8 flex items-center">Lịch dạy trong tháng</p>
          <div className="flex items-end justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {String(monthlySessionsCount).padStart(2, '0')}
              </span>
              <span className="text-xs font-semibold text-slate-500">buổi</span>
            </div>
            <span className="text-slate-400 text-xs font-medium">Tháng {currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Upcoming Schedule (4 cols), Right Assigned Exams (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Upcoming Schedule List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <UpcomingScheduleWidget />
        </div>

        {/* Right: Assigned Exams (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden h-full">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${themeConfig.colors.primary}12`,
                  borderColor: `${themeConfig.colors.primary}25`,
                  color: themeConfig.colors.primary,
                }}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                Đề thi đang giao
              </h3>
            </div>
            <Link
              to="/teacher/exams"
              className="text-xs font-bold hover:underline inline-flex items-center gap-0.5 group"
              style={{ color: themeConfig.colors.primary }}
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
            {recentExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 flex-1">
                <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Chưa có đề thi nào đang giao</p>
                <Link
                  to="/teacher/exams"
                  className="mt-3 text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                >
                  + Tạo đề thi mới
                </Link>
              </div>
            ) : (
              recentExams.map((exam, index) => {
                const examSubmissions = submissions.filter((s) => s.examId === exam.id);
                const subCount = examSubmissions.length;
                const avgScore = subCount > 0 
                  ? (examSubmissions.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / subCount).toFixed(1)
                  : null;
                const qCount = exam.questions ? exam.questions.length : 0;
                const assignedClasses = classes.filter((c) => exam.assignedClassIds?.includes(c.id));
                const assignedCount = assignedClasses.length > 0
                  ? assignedClasses.length
                  : (exam.status === 'published' ? Math.max(1, classes.length) : 0);
                const classLabel = `${assignedCount} đã giao`;

                return (
                  <div
                    key={exam.id || index}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-blue-300/80 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Left: Duration Badge & Exam Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Duration Badge */}
                      <div
                        className="shrink-0 w-11 h-12 rounded-lg border flex flex-col items-center justify-center text-center shadow-2xs group-hover:border-blue-300 transition-colors"
                        style={{
                          backgroundColor: `${themeConfig.colors.primary}0D`,
                          borderColor: `${themeConfig.colors.primary}30`,
                        }}
                      >
                        <span
                          className="text-sm font-extrabold leading-none"
                          style={{ color: themeConfig.colors.primary }}
                        >
                          {exam.durationMinutes}'
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1">
                          Phút
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to={`/teacher/exam-builder/${exam.id}`}
                            className="text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors truncate block"
                            title={exam.title}
                          >
                            {exam.title}
                          </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{qCount} câu</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">{classLabel}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Submissions Count, Status Badge & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Submissions Pill */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/70">
                        <span className="font-extrabold text-slate-900">{subCount}</span>
                        <span className="text-slate-500 text-[11px]">lượt nộp</span>
                      </div>

                      {/* Status */}
                      <ExamStatusBadge status={exam.status} />

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShareExam(exam)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          title="Chia sẻ đề thi"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/teacher/reports?examId=${exam.id}`}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                          title="Xem chi tiết bảng điểm"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareExam && (
        <QRModal
          isOpen={Boolean(shareExam)}
          title={`Chia sẻ đề thi: ${shareExam.title}`}
          subtitle={`Thời gian: ${shareExam.durationMinutes} phút • Thang điểm: ${shareExam.maxScore}`}
          url={`/exam/${shareExam.id}`}
          code={shareExam.id.slice(-6).toUpperCase()}
          onClose={() => setShareExam(null)}
        />
      )}
    </div>
  );
};

