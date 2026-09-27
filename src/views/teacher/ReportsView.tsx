import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Download,
  Search,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  Layers,
  GraduationCap,
  HelpCircle,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { store } from '../../services/store';
import { scoringService } from '../../services/scoringService';
import { Exam, ClassRoom, Submission } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const ReportsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success } = useToast();
  const { themeConfig } = useTheme();

  // Data states from store
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());

  // Search & Filter state
  const classIdParam = searchParams.get('classId');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Subscribe to store updates
  useEffect(() => {
    const refresh = () => {
      setExams(store.getExams());
      setClasses(store.getClasses());
      setSubmissions(store.getSubmissions());
    };
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  // Selected Exam for detailed view (targeted exam)
  const examIdParam = searchParams.get('examId');
  const targetExam = useMemo(() => {
    if (examIdParam) {
      const found = exams.find((e) => e.id === examIdParam);
      if (found) return found;
    }
    return exams[0] || null;
  }, [exams, examIdParam]);

  // List of assigned classes for this exam
  const assignedClasses = useMemo(() => {
    if (!targetExam) return classes;
    if (targetExam.assignedClassIds && targetExam.assignedClassIds.length > 0) {
      const matched = classes.filter((c) => targetExam.assignedClassIds?.includes(c.id));
      if (matched.length > 0) return matched;
    }
    return classes;
  }, [targetExam, classes]);

  // Auto-seed submissions if this exam has 0 submissions or missing assigned classes (runs once per examId)
  const seededExamsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!targetExam) return;
    if (seededExamsRef.current.has(targetExam.id)) return;

    const allCurrentSubs = store.getSubmissions();
    const existing = allCurrentSubs.filter((s) => s.examId === targetExam.id);
    const coveredClasses = new Set(existing.map((s) => s.studentClassId));
    const needsMultiClassSeed =
      assignedClasses.length > 1 &&
      assignedClasses.some((c) => !coveredClasses.has(c.id));

    if (existing.length === 0 || needsMultiClassSeed) {
      seededExamsRef.current.add(targetExam.id);
      store.seedMockSubmissionsForExam(targetExam.id, 8, true);
    } else {
      seededExamsRef.current.add(targetExam.id);
    }
  }, [targetExam?.id, assignedClasses.length]);

  // Auto prefill class filter: If exam is assigned to only 1 class, prefill that class!
  useEffect(() => {
    if (!targetExam) return;
    if (classIdParam && classes.some((c) => c.id === classIdParam)) {
      setSelectedClassId(classIdParam);
      return;
    }

    if (targetExam.assignedClassIds && targetExam.assignedClassIds.length === 1) {
      setSelectedClassId(targetExam.assignedClassIds[0]);
    } else {
      setSelectedClassId('all');
    }
  }, [targetExam?.id, classIdParam, classes]);

  // Submissions for this specific exam filtered by class and search
  const currentExamSubmissions = useMemo(() => {
    if (!targetExam) return [];
    return submissions.filter((s) => {
      const matchExam = s.examId === targetExam.id;
      const matchClass =
        selectedClassId === 'all' ||
        s.studentClassId === selectedClassId ||
        (s.className && assignedClasses.find((c) => c.id === selectedClassId)?.name === s.className);
      const matchStudent =
        !studentSearchTerm.trim() ||
        s.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase());
      return matchExam && matchClass && matchStudent;
    });
  }, [submissions, targetExam, selectedClassId, assignedClasses, studentSearchTerm]);

  // Exam Statistics calculation
  const examStats = useMemo(() => {
    if (!targetExam) return null;
    return scoringService.calculateExamStatistics(targetExam, currentExamSubmissions);
  }, [targetExam, currentExamSubmissions]);

  const SCORE_COLORS = ['#f43f5e', '#fb923c', '#eab308', '#3b82f6', '#10b981'];

  // Display text for assigned classes badge
  const assignedClassBadgeText = useMemo(() => {
    if (!targetExam) return 'Toán 9A1';
    if (selectedClassId !== 'all') {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (cls) return cls.name;
    }
    if (assignedClasses.length === 1) return assignedClasses[0].name;
    return 'Tất cả các lớp';
  }, [targetExam, selectedClassId, assignedClasses, classes]);

  // Export CSV for this single exam
  const handleExportCSV = () => {
    if (!targetExam) return;
    const header = [
      'Hạng',
      'Họ và tên',
      'Lớp',
      'Thời gian nộp',
      'Thời gian làm (phút)',
      'Số lần chuyển tab',
      'Điểm'
    ];

    const sorted = [...currentExamSubmissions].sort((a, b) => b.totalScore - a.totalScore);
    const rows = sorted.map((sub, idx) => [
      idx + 1,
      `"${sub.studentName.replace(/"/g, '""')}"`,
      sub.className || assignedClassBadgeText,
      new Date(sub.submittedAt).toLocaleString('vi-VN'),
      Math.round(sub.durationSeconds / 60),
      sub.tabSwitchesCount || 0,
      sub.totalScore.toFixed(1)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Bang_diem_${targetExam.title.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Xuất file thành công', `Đã tải xuống bảng điểm ${targetExam.title}.`);
  };

  if (!targetExam) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
        Chưa có bài kiểm tra hoặc bài tập nào trong hệ thống.
      </div>
    );
  }

  return (
    <div id="reports-view" className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* ================= HEADER & EXAM DETAILS ================= */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Title Text */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Bảng điểm
              </h2>
              <h3 className="text-base sm:text-lg font-bold text-slate-700 mt-0.5">
                {targetExam.title}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-slate-500" />
                <span>{assignedClassBadgeText}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{targetExam.durationMinutes} phút</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>{targetExam.questions?.length || 0} câu</span>
              </span>
            </div>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* ================= SEARCH & CLASS FILTER ROW ================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Class Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-700 shrink-0">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer min-w-[170px]"
            >
              {assignedClasses.length > 1 && (
                <option value="all">Tất cả các lớp</option>
              )}
              {assignedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo họ tên học sinh..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-600 font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
          <Users className="w-4 h-4 text-slate-400" />
          <span>
            Tổng số bài đã nộp: <strong className="text-slate-900 font-black">{currentExamSubmissions.length}</strong>
          </span>
        </div>
      </div>

      {/* ================= CHARTS & DETAILED STUDENT TABLE ================= */}
      <div className="space-y-6">
        {/* Charts Row: Score Distribution & Cognitive Level Performance */}
        {examStats && examStats.totalSubmissions > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Histogram */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Phổ điểm bài thi</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Điểm TB: <strong className="text-blue-600">{examStats.averageScore.toFixed(1)}đ</strong> • Tỷ lệ đạt: <strong className="text-emerald-600">{examStats.passRate}%</strong>
                </span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={examStats.scoreDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
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
                        <Cell
                          key={`cell-${index}`}
                          fill={SCORE_COLORS[index % SCORE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cognitive Matrix Performance */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Tỷ lệ đúng theo Ma trận nhận thức</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  4 mức độ đánh giá
                </span>
              </div>
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
        )}

        {/* Student Submissions Table */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Bảng kết quả học sinh</span>
              <span className="text-xs font-normal text-slate-400">
                ({currentExamSubmissions.length} bài nộp)
              </span>
            </h3>
          </div>

          {currentExamSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">Chưa có bài nộp nào cho bài kiểm tra / bộ lọc lớp này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 pl-4 w-16">Hạng</th>
                    <th className="py-3.5 px-3">Họ và tên</th>
                    <th className="py-3.5 px-3">Lớp</th>
                    <th className="py-3.5 px-3">Thời gian nộp</th>
                    <th className="py-3.5 px-3">Thời gian làm</th>
                    <th className="py-3.5 px-3">Chuyển tab</th>
                    <th className="py-3.5 pr-4 text-right">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentExamSubmissions
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((sub, rank) => {
                      const durationMin = Math.round(sub.durationSeconds / 60);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pl-4">
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
                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            {sub.studentName}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            {sub.className || assignedClassBadgeText}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            - {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium">
                            {durationMin} phút
                          </td>
                          <td className="py-3.5 px-3">
                            {sub.tabSwitchesCount && sub.tabSwitchesCount > 0 ? (
                              <span className="text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{sub.tabSwitchesCount} lần</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">0</span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-right font-black text-slate-900 text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-lg ${
                                sub.totalScore >= 8
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.totalScore >= 5
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
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
          )}
        </div>
      </div>
    </div>
  );
};
