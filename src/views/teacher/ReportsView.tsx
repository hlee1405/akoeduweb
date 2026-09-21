import React, { useState, useEffect } from 'react';
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
  Filter
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
import { Exam, ClassRoom, Submission } from '../../types';
import { Badge, CognitiveLevelBadge, DifficultyBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const ReportsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');
  const { info } = useToast();

  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());

  const [selectedExamId, setSelectedExamId] = useState<string>(
    examIdParam && exams.some((e) => e.id === examIdParam) ? examIdParam : exams[0]?.id || ''
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  useEffect(() => {
    const refresh = () => {
      setExams(store.getExams());
      setClasses(store.getClasses());
      setSubmissions(store.getSubmissions());
    };
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const currentExamSubmissions = submissions.filter((s) => {
    const matchExam = s.examId === currentExam?.id;
    const matchClass = selectedClassId === 'all' || s.studentClassId === selectedClassId;
    return matchExam && matchClass;
  });

  const stats = currentExam
    ? scoringService.calculateExamStatistics(currentExam, currentExamSubmissions)
    : null;

  // Chart Color scale for score ranges
  const SCORE_COLORS = ['#f43f5e', '#fb923c', '#eab308', '#3b82f6', '#10b981'];

  return (
    <div id="reports-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Filter & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Báo cáo & Phân tích Phổ điểm</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thống kê kết quả thi, phân tích độ khó từng câu hỏi và tỷ lệ làm chủ kiến thức
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Exam Selector */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold max-w-[220px] truncate"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.title}</option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => info('Xuất báo cáo PDF/Excel', 'Đang kết xuất báo cáo thống kê chi tiết...')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {!stats ? (
        <div className="p-12 text-center text-slate-400">Chưa có dữ liệu bài thi</div>
      ) : (
        <>
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Số lượt nộp</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalSubmissions}</div>
              <span className="text-[11px] text-slate-500">Học sinh đã nộp</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Điểm trung bình</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{stats.averageScore.toFixed(1)}</div>
              <span className="text-[11px] text-slate-500">Thang điểm 10</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Điểm trung vị</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.medianScore.toFixed(1)}</div>
              <span className="text-[11px] text-slate-500">Mức phân bố giữa</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Cao nhất / Thấp nhất</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.highestScore.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ {stats.lowestScore.toFixed(1)}</span>
              </div>
              <span className="text-[11px] text-slate-500">Khoảng điểm</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Tỷ lệ đạt (&gt;=5đ)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.passRate}%</div>
              <span className="text-[11px] text-emerald-600 font-medium">Hoàn thành tốt</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 block">Thời gian làm TB</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.averageTimeMinutes} <span className="text-sm font-normal text-slate-400">phút</span></div>
              <span className="text-[11px] text-slate-500">/{currentExam.durationMinutes} phút tối đa</span>
            </div>
          </div>

          {/* Charts Row: Score Distribution & Cognitive Level Mastery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phổ điểm Histogram */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Phổ điểm bài thi</h3>
                  <p className="text-xs text-slate-400">Phân bố số lượng học sinh theo các dải điểm</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      {stats.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cognitive Matrix Performance */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Tỷ lệ đúng theo Ma trận nhận thức</h3>
                <p className="text-xs text-slate-400">Tỷ lệ trả lời chính xác theo từng mức độ tư duy</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { key: 'recognize', label: 'Nhận biết', color: 'bg-slate-600' },
                  { key: 'understand', label: 'Thông hiểu', color: 'bg-blue-600' },
                  { key: 'apply', label: 'Vận dụng', color: 'bg-amber-500' },
                  { key: 'advanced', label: 'Vận dụng cao', color: 'bg-purple-600' }
                ].map((item) => {
                  const percent = stats.cognitiveLevelPerformance[item.key] || 0;
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

          {/* Question Breakdown Analysis Table */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Phân tích chi tiết từng câu hỏi</h3>
                <p className="text-xs text-slate-400">Tỷ lệ làm đúng, lựa chọn phổ biến và phát hiện câu hỏi khó</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 pl-3">Câu số</th>
                    <th className="py-3">Dạng câu / Mức độ</th>
                    <th className="py-3 min-w-[200px]">Nội dung câu hỏi tóm tắt</th>
                    <th className="py-3">Đáp án</th>
                    <th className="py-3">Tỷ lệ đúng</th>
                    <th className="py-3">Đánh giá sư phạm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.questionStats.map((qs) => {
                    const isHard = qs.correctRate < 50;

                    return (
                      <tr key={`${qs.questionId}-${qs.order}`} className="hover:bg-slate-50/80">
                        <td className="py-3 pl-3 font-mono font-bold text-slate-900">Câu {qs.order}</td>
                        <td className="py-3 space-x-1">
                          <CognitiveLevelBadge level={qs.cognitiveLevel} />
                          <DifficultyBadge difficulty={qs.difficulty} />
                        </td>
                        <td className="py-3 font-medium text-slate-700 truncate max-w-[240px]">
                          {qs.content}
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-700">
                          {qs.correctAnswers.join(', ')}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isHard ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {qs.correctRate}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isHard ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${qs.correctRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {isHard ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Nhiều HS làm sai (Cần ôn lại)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Độ phân hóa tốt</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Submissions Leaderboard */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Bảng kết quả học sinh ({currentExamSubmissions.length} bài)</h3>
                <p className="text-xs text-slate-400">Danh sách điểm chi tiết và thời gian làm bài của từng em</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 pl-3">Hạng</th>
                    <th className="py-3">Mã HS</th>
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
                          <td className="py-3 font-mono font-semibold text-slate-600">{sub.studentCode || 'Vãng lai'}</td>
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
  );
};
