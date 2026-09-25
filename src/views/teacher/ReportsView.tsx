import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Share2,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  GraduationCap,
  Percent,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { store } from '../../services/store';
import { scoringService } from '../../services/scoringService';
import { Exam, ClassRoom, Student, Submission, AttendanceRecord } from '../../types';
import { Badge, CognitiveLevelBadge, DifficultyBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const ReportsView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { info, success } = useToast();
  const { themeConfig } = useTheme();

  // Data states from store
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [students, setStudents] = useState<Student[]>(store.getStudents());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(store.getAttendanceRecords());

  // Navigation / View mode: 'matrix' (Bảng điểm tổng hợp) | 'by_exam' (Bảng điểm theo bài / theo đề)
  const modeParam = searchParams.get('mode');
  const [viewMode, setViewMode] = useState<'matrix' | 'by_exam'>(
    modeParam === 'by_exam' ? 'by_exam' : 'matrix'
  );

  // Selected Exam for "by_exam" view
  const examIdParam = searchParams.get('examId');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    examIdParam && exams.some((e) => e.id === examIdParam) ? examIdParam : exams[0]?.id || ''
  );

  // ================= FILTERS STATE =================
  // 1. Class filter
  const classIdParam = searchParams.get('classId');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classIdParam && classes.some((c) => c.id === classIdParam) ? classIdParam : classes[0]?.id || 'all'
  );

  // 2. Time mode: 'month' | 'timerange'
  const [timeFilterMode, setTimeFilterMode] = useState<'month' | 'timerange'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('8');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');

  // 3. Data type toggles (Loại dữ liệu)
  const [showAttendanceScore, setShowAttendanceScore] = useState<boolean>(true); // Điểm CC
  const [showExamScore, setShowExamScore] = useState<boolean>(true); // Điểm KT / Đề thi
  const [showHomeworkScore, setShowHomeworkScore] = useState<boolean>(true); // Điểm BTVN

  // 4. Search & filter queries
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [examSearchTerm, setExamSearchTerm] = useState<string>('');
  const [rankFilter, setRankFilter] = useState<'all' | 'gioi' | 'kha' | 'tb' | 'yeu'>('all');
  const [sortField, setSortField] = useState<'name' | 'avg' | 'attendance'>('avg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Subscribe to store updates
  useEffect(() => {
    const refresh = () => {
      setExams(store.getExams());
      setClasses(store.getClasses());
      setStudents(store.getStudents());
      setSubmissions(store.getSubmissions());
      setAttendanceRecords(store.getAttendanceRecords());
    };
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  // Sync mode with URL if needed
  useEffect(() => {
    if (examIdParam && exams.some((e) => e.id === examIdParam)) {
      setSelectedExamId(examIdParam);
    }
  }, [examIdParam, exams]);

  // Compute Active Time Range in ISO string
  const activeDateRange = useMemo(() => {
    if (timeFilterMode === 'month') {
      if (selectedMonth === 'all') {
        return { start: '2026-01-01', end: '2026-12-31' };
      }
      const mm = String(selectedMonth).padStart(2, '0');
      const start = `${selectedYear}-${mm}-01`;
      // determine end of month
      const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
      const end = `${selectedYear}-${mm}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    } else {
      return { start: startDate || '2026-01-01', end: endDate || '2026-12-31' };
    }
  }, [timeFilterMode, selectedMonth, selectedYear, startDate, endDate]);

  // Filtered Students according to selected Class and search query
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Must not be pending
      if (st.status === 'pending') return false;

      // Match class
      if (selectedClassId !== 'all' && st.classId !== selectedClassId) return false;

      // Match search name or phone
      if (studentSearchTerm.trim()) {
        const query = studentSearchTerm.toLowerCase();
        const matchName = st.fullName.toLowerCase().includes(query);
        const matchCode = st.code.toLowerCase().includes(query);
        const matchPhone = (st.phone || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchPhone) return false;
      }

      return true;
    });
  }, [students, selectedClassId, studentSearchTerm]);

  // Filtered Exams / Homeworks for the matrix columns according to class, time range, and data type
  const relevantExams = useMemo(() => {
    return exams.filter((ex) => {
      // Check class assignment
      if (selectedClassId !== 'all' && !ex.assignedClassIds.includes(selectedClassId)) {
        return false;
      }

      // Check exam search
      if (examSearchTerm.trim()) {
        const query = examSearchTerm.toLowerCase();
        const matchTitle = ex.title.toLowerCase().includes(query);
        const matchSubject = ex.subject.toLowerCase().includes(query);
        if (!matchTitle && !matchSubject) return false;
      }

      // Distinguish homework vs regular exam by title or duration
      const isHomework = ex.title.toLowerCase().includes('btvn') ||
                         ex.title.toLowerCase().includes('bài tập') ||
                         ex.title.toLowerCase().includes('về nhà');

      if (isHomework && !showHomeworkScore) return false;
      if (!isHomework && !showExamScore) return false;

      // Filter by creation date or due date within timerange
      const exDate = ex.createdAt ? ex.createdAt.split('T')[0] : '2026-08-01';
      if (exDate < activeDateRange.start || exDate > activeDateRange.end) {
        // also check if any submission was in range
        const hasSubInRange = submissions.some(
          (s) => s.examId === ex.id && s.submittedAt && s.submittedAt.split('T')[0] >= activeDateRange.start && s.submittedAt.split('T')[0] <= activeDateRange.end
        );
        if (!hasSubInRange) return false;
      }

      return true;
    });
  }, [exams, selectedClassId, examSearchTerm, showHomeworkScore, showExamScore, activeDateRange, submissions]);

  // Compute student scores matrix data
  const studentMatrixData = useMemo(() => {
    return filteredStudents.map((st, index) => {
      // 1. Attendance calculation (Điểm chuyên cần)
      const stAttendance = attendanceRecords.filter(
        (r) =>
          r.studentId === st.id &&
          r.date >= activeDateRange.start &&
          r.date <= activeDateRange.end
      );
      const totalSessions = stAttendance.length;
      const presentCount = stAttendance.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      const attendancePercent = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
      const attendanceScore = totalSessions > 0 ? Number(((presentCount / totalSessions) * 10).toFixed(1)) : 10;

      // 2. Exam & Homework Submissions
      const examScores: Record<string, { score: number | null; status: 'submitted' | 'not_submitted' | 'late' }> = {};
      let totalExamSum = 0;
      let examCount = 0;

      relevantExams.forEach((ex) => {
        const sub = submissions.find((s) => s.examId === ex.id && (s.studentId === st.id || s.studentName.toLowerCase() === st.fullName.toLowerCase()));
        if (sub) {
          examScores[ex.id] = {
            score: sub.totalScore,
            status: 'submitted'
          };
          totalExamSum += sub.totalScore;
          examCount++;
        } else {
          examScores[ex.id] = {
            score: null,
            status: 'not_submitted'
          };
        }
      });

      // 3. Overall Average Score (Điểm trung bình ĐTB)
      let weightedSum = totalExamSum;
      let totalWeights = examCount;

      if (showAttendanceScore) {
        weightedSum += attendanceScore * 0.5; // trọng số CC
        totalWeights += 0.5;
      }

      const avgScore = totalWeights > 0 ? Number((weightedSum / totalWeights).toFixed(1)) : 0;

      // 4. Academic Ranking (Xếp loại)
      let rank: 'gioi' | 'kha' | 'tb' | 'yeu' = 'tb';
      let rankLabel = 'Trung bình';
      let rankColor = 'bg-amber-50 text-amber-700 border-amber-200';

      if (avgScore >= 8.0) {
        rank = 'gioi';
        rankLabel = 'Giỏi';
        rankColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (avgScore >= 6.5) {
        rank = 'kha';
        rankLabel = 'Khá';
        rankColor = 'bg-blue-50 text-blue-700 border-blue-200';
      } else if (avgScore >= 5.0) {
        rank = 'tb';
        rankLabel = 'Trung bình';
        rankColor = 'bg-amber-50 text-amber-700 border-amber-200';
      } else {
        rank = 'yeu';
        rankLabel = 'Cần cố gắng';
        rankColor = 'bg-rose-50 text-rose-700 border-rose-200';
      }

      return {
        student: st,
        index: index + 1,
        attendancePercent,
        attendanceScore,
        presentCount,
        totalSessions,
        examScores,
        avgScore,
        rank,
        rankLabel,
        rankColor
      };
    }).filter((row) => {
      if (rankFilter === 'all') return true;
      return row.rank === rankFilter;
    }).sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.student.fullName.localeCompare(b.student.fullName)
          : b.student.fullName.localeCompare(a.student.fullName);
      }
      if (sortField === 'attendance') {
        return sortOrder === 'asc'
          ? a.attendancePercent - b.attendancePercent
          : b.attendancePercent - a.attendancePercent;
      }
      // default avg
      return sortOrder === 'asc' ? a.avgScore - b.avgScore : b.avgScore - a.avgScore;
    });
  }, [
    filteredStudents,
    attendanceRecords,
    activeDateRange,
    relevantExams,
    submissions,
    showAttendanceScore,
    rankFilter,
    sortField,
    sortOrder
  ]);

  // Stats calculation for Overview KPI cards
  const summaryKpis = useMemo(() => {
    const totalCount = studentMatrixData.length;
    if (totalCount === 0) {
      return { totalStudents: 0, classAvg: '0.0', passRate: 0, avgAttendance: 0, topStudent: null };
    }

    const totalAvg = studentMatrixData.reduce((sum, r) => sum + r.avgScore, 0);
    const classAvg = (totalAvg / totalCount).toFixed(1);

    const passCount = studentMatrixData.filter((r) => r.avgScore >= 5.0).length;
    const passRate = Math.round((passCount / totalCount) * 100);

    const totalAtt = studentMatrixData.reduce((sum, r) => sum + r.attendancePercent, 0);
    const avgAttendance = Math.round(totalAtt / totalCount);

    const sortedByScore = [...studentMatrixData].sort((a, b) => b.avgScore - a.avgScore);
    const topStudent = sortedByScore[0]?.student.fullName || '---';

    return { totalStudents: totalCount, classAvg, passRate, avgAttendance, topStudent };
  }, [studentMatrixData]);

  // ================= EXPORT CSV =================
  const handleExportCSV = () => {
    const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Tat_ca_lop';
    const header = [
      'STT',
      'Họ và tên',
      'Mã học sinh',
      'Số điện thoại',
      ...(showAttendanceScore ? ['Chuyên cần (%)', 'Điểm CC'] : []),
      ...relevantExams.map((ex) => `"${ex.title.replace(/"/g, '""')}"`),
      'Điểm TB',
      'Xếp loại'
    ];

    const rows = studentMatrixData.map((row) => {
      const examScoreCols = relevantExams.map((ex) => {
        const val = row.examScores[ex.id]?.score;
        return val !== null && val !== undefined ? val.toFixed(1) : '-';
      });

      return [
        row.index,
        `"${row.student.fullName.replace(/"/g, '""')}"`,
        row.student.code,
        row.student.phone || '',
        ...(showAttendanceScore ? [`${row.attendancePercent}%`, row.attendanceScore.toFixed(1)] : []),
        ...examScoreCols,
        row.avgScore.toFixed(1),
        row.rankLabel
      ];
    });

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_diem_tong_hop_${currentClassName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Xuất file thành công', 'Đã tải xuống bảng điểm tổng hợp Excel/CSV.');
  };

  // Single Exam Detailed Statistics for 'by_exam' mode
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const currentExamSubmissions = useMemo(() => {
    if (!currentExam) return [];
    return submissions.filter((s) => {
      const matchExam = s.examId === currentExam.id;
      const matchClass = selectedClassId === 'all' || s.studentClassId === selectedClassId;
      return matchExam && matchClass;
    });
  }, [submissions, currentExam, selectedClassId]);

  const examStats = currentExam
    ? scoringService.calculateExamStatistics(currentExam, currentExamSubmissions)
    : null;

  const SCORE_COLORS = ['#f43f5e', '#fb923c', '#eab308', '#3b82f6', '#10b981'];

  return (
    <div id="reports-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ================= HEADER & VIEW MODE TABS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs"
              style={{
                backgroundColor: `${themeConfig.colors.primary}12`,
                borderColor: `${themeConfig.colors.primary}25`,
                color: themeConfig.colors.primary
              }}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Bảng Điểm & Báo Cáo Tổng Hợp
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Theo dõi toàn diện điểm chuyên cần, bài tập về nhà và bài kiểm tra định kỳ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Main Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bảng điểm tổng hợp</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_exam')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'by_exam'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Bảng điểm theo bài / đề</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* ================= COMPREHENSIVE FILTER TOOLBAR ================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Primary Selectors (Lớp học, Thời gian, Tên bài / HS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* 1. Class Selector (4 cols) */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Lớp học
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Time Filter / Timerange (5 cols) */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Khoảng thời gian (Time Range)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilterMode('timerange');
                    setStartDate('2026-08-01');
                    setEndDate('2026-08-31');
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    startDate === '2026-08-01' && endDate === '2026-08-31'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Tháng 8
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilterMode('timerange');
                    setStartDate('2026-08-01');
                    setEndDate('2026-12-31');
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    startDate === '2026-08-01' && endDate === '2026-12-31'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Kỳ 1
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilterMode('timerange');
                    setStartDate('2026-01-01');
                    setEndDate('2026-12-31');
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    startDate === '2026-01-01' && endDate === '2026-12-31'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Cả năm
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[10px] font-semibold text-slate-400 pointer-events-none">Từ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setTimeFilterMode('timerange');
                    setStartDate(e.target.value);
                  }}
                  className="w-full pl-9 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[10px] font-semibold text-slate-400 pointer-events-none">Đến:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setTimeFilterMode('timerange');
                    setEndDate(e.target.value);
                  }}
                  className="w-full pl-10 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. Search Student Name / Code (4 cols) */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tìm kiếm học sinh
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                placeholder="Nhập họ tên, SĐT hoặc mã HS..."
                className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Controls: Data Type Toggles & Exam Search & Rank Filter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Data Type Multi-filters (Loại dữ liệu hiển thị) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">
              Hiển thị cột:
            </span>

            {/* Điểm Chuyên cần */}
            <button
              type="button"
              onClick={() => setShowAttendanceScore(!showAttendanceScore)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                showAttendanceScore
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {showAttendanceScore ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
              <span>Điểm Chuyên cần (CC)</span>
            </button>

            {/* Điểm Kiểm tra */}
            <button
              type="button"
              onClick={() => setShowExamScore(!showExamScore)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                showExamScore
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {showExamScore ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
              <span>Điểm Kiểm tra (Đề thi)</span>
            </button>

            {/* Điểm Bài tập */}
            <button
              type="button"
              onClick={() => setShowHomeworkScore(!showHomeworkScore)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                showHomeworkScore
                  ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {showHomeworkScore ? <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
              <span>Điểm Bài tập về nhà (BTVN)</span>
            </button>
          </div>

          {/* Academic Rank & Exam Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Exam title in matrix */}
            <div className="relative w-44">
              <input
                type="text"
                value={examSearchTerm}
                onChange={(e) => setExamSearchTerm(e.target.value)}
                placeholder="Lọc tên bài KT..."
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Rank Filter */}
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả học lực</option>
              <option value="gioi">Giỏi (&ge; 8.0)</option>
              <option value="kha">Khá (6.5 - 7.9)</option>
              <option value="tb">Trung bình (5.0 - 6.4)</option>
              <option value="yeu">Cần rèn luyện (&lt; 5.0)</option>
            </select>

            {/* Sorter */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
              title={`Sắp xếp ${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= KPI STATS OVERVIEW ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Sĩ số theo lọc</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{summaryKpis.totalStudents}</div>
          <span className="text-[11px] text-slate-500 font-medium">Học sinh trong danh sách</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Điểm TB toàn lớp</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{summaryKpis.classAvg} <span className="text-xs font-semibold text-slate-400">/10</span></div>
          <span className="text-[11px] text-slate-500 font-medium">Đánh giá chung</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Tỷ lệ đạt (&ge;5.0)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summaryKpis.passRate}%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Đạt chuẩn yêu cầu</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Tỷ lệ Chuyên cần</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{summaryKpis.avgAttendance}%</div>
          <span className="text-[11px] text-indigo-600 font-semibold">Đi học đầy đủ</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Học sinh tiêu biểu</span>
          <div className="text-base font-bold text-slate-900 mt-1 truncate" title={summaryKpis.topStudent}>
            {summaryKpis.topStudent}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Dẫn đầu bảng điểm ⭐</span>
        </div>
      </div>

      {/* ================= MAIN CONTENT BASED ON MODE ================= */}
      {viewMode === 'matrix' ? (
        /* ================= MODE 1: BẢNG ĐIỂM TỔNG HỢP (MA TRẬN CỐ ĐỊNH CỘT HỌ TÊN + THANH CUỘN NGANG) ================= */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Table Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Bảng điểm tổng hợp chi tiết ({studentMatrixData.length} học sinh • {relevantExams.length} bài kiểm tra / bài tập)
              </h3>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              * Cột họ tên được cố định khi cuộn ngang thanh trượt
            </div>
          </div>

          {studentMatrixData.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            /* Scrollable Container with Frozen / Sticky Name Column */
            <div className="overflow-x-auto w-full max-w-full pb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {/* FROZEN COLUMN 1: STT */}
                    <th className="sticky left-0 z-30 bg-slate-100 py-3.5 px-3 text-center w-12 border-r border-slate-200">
                      STT
                    </th>

                    {/* FROZEN COLUMN 2: HỌ VÀ TÊN */}
                    <th className="sticky left-12 z-30 bg-slate-100 py-3.5 px-4 min-w-[180px] border-r border-slate-200">
                      Họ và tên
                    </th>

                    {/* FROZEN COLUMN 3: SĐT / MÃ HS */}
                    <th className="sticky left-[228px] z-30 bg-slate-100 py-3.5 px-3 min-w-[110px] border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                      Mã HS / SĐT
                    </th>

                    {/* DYNAMIC SCROLLABLE COLUMNS: 1. CHUYÊN CẦN */}
                    {showAttendanceScore && (
                      <>
                        <th className="py-3.5 px-3 text-center min-w-[100px] bg-blue-50/70 text-blue-900 border-r border-slate-200">
                          Chuyên cần (%)
                        </th>
                        <th className="py-3.5 px-3 text-center min-w-[85px] bg-blue-50/70 text-blue-900 border-r border-slate-200">
                          Điểm CC
                        </th>
                      </>
                    )}

                    {/* DYNAMIC SCROLLABLE COLUMNS: 2. BÀI TẬP & KIỂM TRA */}
                    {relevantExams.map((ex) => {
                      const isHomework = ex.title.toLowerCase().includes('btvn') || ex.title.toLowerCase().includes('bài tập');
                      return (
                        <th
                          key={ex.id}
                          className={`py-3.5 px-3 text-center min-w-[120px] max-w-[160px] border-r border-slate-200 ${
                            isHomework ? 'bg-purple-50/60 text-purple-900' : 'bg-indigo-50/60 text-indigo-900'
                          }`}
                          title={ex.title}
                        >
                          <div className="truncate font-bold">{ex.title}</div>
                          <div className="text-[10px] font-normal text-slate-500">{isHomework ? 'BTVN' : 'Kiểm tra'} • {ex.durationMinutes}p</div>
                        </th>
                      );
                    })}

                    {/* SUMMARY COLUMNS: ĐTB & XẾP LOẠI */}
                    <th className="py-3.5 px-3 text-center min-w-[90px] bg-slate-100 font-extrabold text-slate-900 border-r border-slate-200">
                      Điểm TB
                    </th>
                    <th className="py-3.5 px-3 text-center min-w-[110px] bg-slate-100 font-extrabold text-slate-900">
                      Xếp loại
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentMatrixData.map((row) => {
                    return (
                      <tr key={row.student.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* FROZEN COLUMN 1: STT */}
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50/50 py-3.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                          {row.index}
                        </td>

                        {/* FROZEN COLUMN 2: HỌ VÀ TÊN */}
                        <td className="sticky left-12 z-20 bg-white group-hover:bg-blue-50/50 py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200 truncate">
                          <Link
                            to={`/teacher/classes/${row.student.classId}`}
                            className="hover:text-blue-600 transition-colors block"
                            title={row.student.fullName}
                          >
                            {row.student.fullName}
                          </Link>
                        </td>

                        {/* FROZEN COLUMN 3: SĐT / MÃ HS */}
                        <td className="sticky left-[228px] z-20 bg-white group-hover:bg-blue-50/50 py-3.5 px-3 text-slate-500 text-[11px] border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.04)] font-mono truncate">
                          {row.student.phone || row.student.code}
                        </td>

                        {/* DYNAMIC SCROLLABLE COLUMNS: 1. CHUYÊN CẦN */}
                        {showAttendanceScore && (
                          <>
                            <td className="py-3.5 px-3 text-center border-r border-slate-100">
                              <span className={`font-bold ${row.attendancePercent >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {row.attendancePercent}%
                              </span>
                              <span className="text-[10px] text-slate-400 block">({row.presentCount}/{row.totalSessions})</span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-slate-800 border-r border-slate-100">
                              {row.attendanceScore.toFixed(1)}
                            </td>
                          </>
                        )}

                        {/* DYNAMIC SCROLLABLE COLUMNS: 2. BÀI TẬP & KIỂM TRA */}
                        {relevantExams.map((ex) => {
                          const examData = row.examScores[ex.id];
                          const hasScore = examData && examData.score !== null;

                          return (
                            <td key={ex.id} className="py-3.5 px-3 text-center border-r border-slate-100">
                              {hasScore ? (
                                <span
                                  className={`inline-block font-black px-2 py-0.5 rounded-md ${
                                    (examData?.score || 0) >= 8.0
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : (examData?.score || 0) >= 5.0
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {examData?.score?.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-semibold">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* SUMMARY COLUMNS: ĐTB & XẾP LOẠI */}
                        <td className="py-3.5 px-3 text-center border-r border-slate-100">
                          <span
                            className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg ${
                              row.avgScore >= 8.0
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : row.avgScore >= 6.5
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : row.avgScore >= 5.0
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-rose-500 text-white shadow-2xs'
                            }`}
                          >
                            {row.avgScore.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${row.rankColor}`}>
                            {row.rankLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ================= MODE 2: BẢNG ĐIỂM THEO BÀI / THEO ĐỀ THI ================= */
        <div className="space-y-6">
          {/* Exam Selector Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Chọn bài kiểm tra / đề thi:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer min-w-[260px]"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subject} • {ex.durationMinutes}p)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Số bài đã nộp: <strong className="text-slate-900">{currentExamSubmissions.length}</strong> bài
            </div>
          </div>

          {!examStats ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Chưa có dữ liệu bài thi hoặc bài tập này.
            </div>
          ) : (
            <>
              {/* Exam KPI Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Số lượt nộp</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{examStats.totalSubmissions}</div>
                  <span className="text-[11px] text-slate-500">Học sinh đã làm</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Điểm trung bình</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">{examStats.averageScore.toFixed(1)}</div>
                  <span className="text-[11px] text-slate-500">Thang điểm 10</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Điểm trung vị</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{examStats.medianScore.toFixed(1)}</div>
                  <span className="text-[11px] text-slate-500">Mức phân bố giữa</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Cao nhất / Thấp nhất</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {examStats.highestScore.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ {examStats.lowestScore.toFixed(1)}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Khoảng điểm</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Tỷ lệ đạt (&ge;5đ)</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{examStats.passRate}%</div>
                  <span className="text-[11px] text-emerald-600 font-medium">Hoàn thành tốt</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 block">Thời gian làm TB</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{examStats.averageTimeMinutes} <span className="text-sm font-normal text-slate-400">phút</span></div>
                  <span className="text-[11px] text-slate-500">/{currentExam.durationMinutes} phút tối đa</span>
                </div>
              </div>

              {/* Charts Row: Score Distribution & Cognitive Level */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Histogram */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Phổ điểm bài thi</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={examStats.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            border: 'none'
                          }}
                          formatter={(val: any) => [`${val} học sinh`, 'Số lượng']}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {examStats.scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cognitive Matrix Performance */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Tỷ lệ đúng theo Ma trận nhận thức</h3>
                  <div className="space-y-3.5 pt-2">
                    {[
                      { key: 'recognize', label: 'Nhận biết', color: 'bg-slate-600' },
                      { key: 'understand', label: 'Thông hiểu', color: 'bg-blue-600' },
                      { key: 'apply', label: 'Vận dụng', color: 'bg-amber-500' },
                      { key: 'advanced', label: 'Vận dụng cao', color: 'bg-purple-600' }
                    ].map((item) => {
                      const percent = examStats.cognitiveLevelPerformance[item.key] || 0;
                      return (
                        <div key={item.key} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-700">
                            <span>{item.label}</span>
                            <span className="font-bold text-slate-900">{percent}% chính xác</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Student Submissions Table */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">
                    Bảng kết quả học sinh ({currentExamSubmissions.length} bài)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 pl-3">Hạng</th>
                        <th className="py-3">Họ và tên</th>
                        <th className="py-3">Thời gian nộp</th>
                        <th className="py-3">Thời gian làm</th>
                        <th className="py-3">Chuyển tab</th>
                        <th className="py-3 text-right pr-4">Tổng điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentExamSubmissions
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .map((sub, rank) => {
                          const durationMin = Math.round(sub.durationSeconds / 60);

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/80">
                              <td className="py-3 pl-3">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                    rank === 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : rank === 1
                                      ? 'bg-slate-200 text-slate-800'
                                      : rank === 2
                                      ? 'bg-amber-700/10 text-amber-900'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {rank + 1}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-slate-800">{sub.studentName}</td>
                              <td className="py-3 text-slate-500">
                                {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 text-slate-600">{durationMin} phút</td>
                              <td className="py-3">
                                {sub.tabSwitchesCount && sub.tabSwitchesCount > 0 ? (
                                  <span className="text-amber-600 font-semibold">{sub.tabSwitchesCount} lần</span>
                                ) : (
                                  <span className="text-emerald-600">0</span>
                                )}
                              </td>
                              <td className="py-3 text-right pr-4 font-black text-slate-900 text-sm">
                                <span
                                  className={`px-2 py-0.5 rounded-md ${
                                    sub.totalScore >= 8
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : sub.totalScore >= 5
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {sub.totalScore.toFixed(1)}đ
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
