import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, ClassRoom, Student, Submission, TeacherProfile, CalendarSession } from '../../types';
import { ExamStatusBadge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { useTheme } from '../../context/ThemeContext';
import { UpcomingScheduleWidget } from './components/UpcomingScheduleWidget';

export const DashboardView: React.FC = () => {
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

  const recentExams = exams.slice(0, 5);

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
            <span className="text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Đang mở</span>
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

      {/* Main Grid: Left Recent Exams, Right Mini Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Recent Exams (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Đề thi gần đây</h3>
              <Link
                to="/teacher/exams"
                className="text-xs font-bold hover:underline"
                style={{ color: themeConfig.colors.primary }}
              >
                Xem tất cả
              </Link>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-left">
                <thead className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Tên đề thi</th>
                    <th className="pb-3 px-3">Môn / Lớp</th>
                    <th className="pb-3 px-3">Số bài nộp</th>
                    <th className="pb-3 px-3">Trạng thái</th>
                    <th className="pb-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentExams.map((exam) => {
                    const subCount = submissions.filter((s) => s.examId === exam.id).length;
                    return (
                      <tr key={exam.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-slate-800">
                          <Link to={`/teacher/exam-builder/${exam.id}`} className="hover:text-blue-600 transition-colors">
                            {exam.title}
                          </Link>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs font-medium">
                          {exam.subject} • {exam.grade}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 font-semibold">
                          {subCount} lượt
                        </td>
                        <td className="py-3.5 px-3">
                          <ExamStatusBadge status={exam.status} />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setShareExam(exam)}
                              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Chia sẻ đề thi"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/teacher/reports?examId=${exam.id}`}
                              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Báo cáo"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>

        {/* Right: Upcoming Schedule List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <UpcomingScheduleWidget />
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

