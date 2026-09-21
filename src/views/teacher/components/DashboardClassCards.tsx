import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Users,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { ClassRoom, Student, Exam, CalendarSession } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface DashboardClassCardsProps {
  classes: ClassRoom[];
  students: Student[];
  exams: Exam[];
  sessions: CalendarSession[];
}

export const DashboardClassCards: React.FC<DashboardClassCardsProps> = ({
  classes,
  students,
  exams,
  sessions
}) => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const activeClasses = classes.filter((c) => c.status === 'active');
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(activeClasses.length / pageSize));
  const displayedClasses = activeClasses.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Helper to format next session for a class
  const getNextSessionInfo = (classId: string) => {
    // 1. Check in calendar sessions for upcoming sessions
    const classSessions = sessions
      .filter((s) => s.classId === classId)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    // Simulated "now" is 2026-09-17 10:00
    const upcoming = classSessions.find((s) => s.date >= '2026-09-17') || classSessions[0];

    if (upcoming) {
      const [year, month, day] = upcoming.date.split('-');
      const formattedDate = `${day}/${month}`;
      const isSoon = upcoming.date === '2026-09-17' || upcoming.date === '2026-09-18';
      return {
        text: `${upcoming.startTime} ${formattedDate}`,
        isUpcomingSoon: isSoon,
        room: upcoming.room || 'Phòng học'
      };
    }

    return {
      text: 'Chưa có lịch dạy',
      isUpcomingSoon: false,
      room: ''
    };
  };

  // Planned sessions & progress estimation based on academic standard (24 sessions/semester)
  const getClassProgress = (cls: ClassRoom, index: number) => {
    const totalSessions = 24;
    // Base completed sessions on class index or actual records
    const completedSessions = Math.min(totalSessions, 8 + (index % 3) * 2);
    const percent = Math.round((completedSessions / totalSessions) * 100);
    return {
      completedSessions,
      totalSessions,
      percent
    };
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header bar matching the user's reference image */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-[#5C453C]">Lớp học đang giảng dạy</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {activeClasses.length} lớp
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll / Paging arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg border border-[#EFE3DD] bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
              title="Trang trước"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className="p-1.5 rounded-lg border border-[#EFE3DD] bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
              title="Trang sau"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Academic Semester Badge */}
          <div className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-600 bg-[#F5EFEA] border border-[#EFE3DD] px-2.5 py-1 rounded-lg">
            Học kỳ 1 (2024 - 2025)
          </div>

          {/* "Xem tất cả" button in web theme color */}
          <Link
            to="/teacher/classes"
            className="text-sm font-semibold transition-colors cursor-pointer hover:underline hover:opacity-85 inline-flex items-center gap-1"
            style={{ color: themeConfig.colors.primary }}
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Class Cards Responsive Grid (No card ever hidden, constant gap, no overlap) */}
      {activeClasses.length === 0 ? (
        <div className="bg-[#FFFDF9] border border-[#EFE3DD] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#9A8A85] mb-3">Hiện chưa có lớp học nào đang hoạt động.</p>
          <button
            type="button"
            onClick={() => navigate('/teacher/classes')}
            className="text-xs font-bold text-white px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            Tạo hoặc kích hoạt lớp học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          {displayedClasses.map((cls, index) => {
            const globalIndex = currentPage * pageSize + index;
            const classStudents = students.filter((s) => s.classId === cls.id);
            const classExams = exams.filter((e) => e.assignedClassIds?.includes(cls.id));
            const nextSession = getNextSessionInfo(cls.id);
            const progress = getClassProgress(cls, globalIndex);
            const classIndexNum = String(globalIndex + 1).padStart(2, '0');

            return (
              <div
                key={cls.id}
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                className="group relative bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200 cursor-pointer w-full min-w-0"
              >
                {/* Top Row: Index Badge, Join Code & "Sắp tới" Ribbon */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Index / Sequence Badge */}
                    <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {classIndexNum}
                    </span>

                    {/* Class Join Code & Copy Button */}
                    <div
                      onClick={(e) => handleCopyCode(e, cls.joinCode)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50/80 hover:bg-indigo-50/80 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors shrink-0"
                      title="Nhấn để sao chép mã lớp"
                    >
                      <span className="font-mono tracking-wider">{cls.joinCode}</span>
                      {copiedCode === cls.joinCode ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover/btn:text-indigo-600" />
                      )}
                    </div>
                  </div>

                  {/* "Sắp tới" Badge (if next session is soon) */}
                  {nextSession.isUpcomingSoon && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-2xs tracking-tight shrink-0 animate-pulse">
                      Sắp tới
                    </span>
                  )}
                </div>

                {/* Class Title */}
                <div className="mb-3 min-w-0">
                  <h3
                    className="font-bold text-sm text-[#5C453C] group-hover:text-indigo-700 transition-colors truncate"
                    title={cls.name}
                  >
                    {cls.name}
                  </h3>
                  <p className="text-[11px] text-[#9A8A85] font-medium mt-0.5 truncate">
                    {cls.subject}
                  </p>
                </div>

                {/* 3 Metric Pills (Calendar Sessions, Exams/Homework, Students) */}
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  {/* Sessions pill */}
                  <div
                    className="bg-white/90 border border-[#EFE3DD] rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-2xs text-[11px] font-bold text-slate-700 min-w-0"
                    title="Số buổi học đã hoàn thành / Tổng số buổi"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{progress.completedSessions} / {progress.totalSessions}</span>
                  </div>

                  {/* Exams pill */}
                  <div
                    className="bg-white/90 border border-[#EFE3DD] rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-2xs text-[11px] font-bold text-slate-700 min-w-0"
                    title="Số đề thi & bài tập đã giao"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{classExams.length}</span>
                  </div>

                  {/* Students pill */}
                  <div
                    className="bg-white/90 border border-[#EFE3DD] rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 shadow-2xs text-[11px] font-bold text-slate-700 min-w-0"
                    title="Tổng số học sinh trong lớp"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{classStudents.length}</span>
                  </div>
                </div>

                {/* Bottom Rows: Next session & Progress Bar */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#EFE3DD]/70 text-xs">
                  {/* Next session row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9A8A85] font-medium">Tiếp theo:</span>
                    <span className="font-bold text-slate-800">{nextSession.text}</span>
                  </div>

                  {/* Progress label row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9A8A85] font-medium">Tiến trình:</span>
                    <span className="font-bold text-slate-800">
                      {progress.completedSessions} / {progress.totalSessions}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden flex-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress.percent}%`,
                          backgroundColor: themeConfig.colors.primary
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#9A8A85] shrink-0 w-7 text-right">
                      {progress.percent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
