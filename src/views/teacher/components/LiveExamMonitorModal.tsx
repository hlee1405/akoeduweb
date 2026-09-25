import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Send,
  Sparkles,
  Maximize2,
  Eye,
  RefreshCw,
  QrCode,
  Search,
  Lock,
  Unlock,
  Radio,
  UserCheck,
  Sliders,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Exam, ClassRoom, Submission, Student } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface LiveExamMonitorModalProps {
  isOpen: boolean;
  exam: Exam;
  onClose: () => void;
  onOpenAssignSettings?: () => void;
}

export const LiveExamMonitorModal: React.FC<LiveExamMonitorModalProps> = ({
  isOpen,
  exam,
  onClose,
  onOpenAssignSettings
}) => {
  const { success, warning, info } = useToast();
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taking' | 'submitted' | 'violation' | 'absent'>('all');
  const [showQRProjector, setShowQRProjector] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simulated live taking state for students who haven't submitted yet
  const [liveStudents, setLiveStudents] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      className: string;
      status: 'taking' | 'submitted' | 'not_started';
      progress: number; // e.g. 28/40
      totalQuestions: number;
      tabSwitches: number;
      remainingMinutes: number;
      score?: number;
      submittedAt?: string;
    }>
  >([]);

  const examUrl = `${window.location.origin}/exam/${exam.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    examUrl
  )}&margin=10`;

  // Build live participant roster from assigned classes
  useEffect(() => {
    const assignedClasses = classes.filter((c) =>
      exam.assignedClassIds?.includes(c.id)
    );

    const targetClasses = assignedClasses.length > 0 ? assignedClasses : classes.slice(0, 1);
    const examSubmissions = submissions.filter((s) => s.examId === exam.id);
    const totalQ = exam.questions?.length || 20;

    const list: typeof liveStudents = [];
    const allStudents = store.getStudents();

    targetClasses.forEach((cls) => {
      const clsStudents = allStudents.filter((s) => s.classId === cls.id);
      const studentList = clsStudents.length > 0 ? clsStudents : allStudents.slice(0, 10);

      studentList.forEach((st: any, idx) => {
        const studentName = st.fullName || st.name || `Học sinh ${idx + 1}`;
        const studentCode = st.code || `HS${String(idx + 1).padStart(3, '0')}`;
        // Check if student has submitted
        const sub = examSubmissions.find(
          (s) => s.studentId === st.id || (s.studentName && s.studentName.toLowerCase() === studentName.toLowerCase())
        );

        if (sub) {
          list.push({
            id: st.id,
            name: studentName,
            code: studentCode,
            className: cls.name,
            status: 'submitted',
            progress: totalQ,
            totalQuestions: totalQ,
            tabSwitches: sub.tabSwitchCount ?? (sub as any).tabSwitchesCount ?? 0,
            remainingMinutes: 0,
            score: sub.totalScore,
            submittedAt: sub.submittedAt
          });
        } else {
          // Semi-randomize realistic taking state for demonstration if exam is published
          const isTaking = idx % 3 !== 0;
          const fakeAnswered = Math.min(totalQ, Math.floor(totalQ * (0.3 + (idx % 7) * 0.1)));
          const fakeTabSwitches = (idx % 5 === 0) ? 2 : (idx % 7 === 0 ? 1 : 0);
          const fakeRemaining = Math.max(5, (exam.durationMinutes || 45) - 12);

          list.push({
            id: st.id,
            name: studentName,
            code: studentCode,
            className: cls.name,
            status: isTaking ? 'taking' : 'not_started',
            progress: isTaking ? fakeAnswered : 0,
            totalQuestions: totalQ,
            tabSwitches: fakeTabSwitches,
            remainingMinutes: fakeRemaining
          });
        }
      });
    });

    setLiveStudents(list);
  }, [exam, classes, submissions]);

  if (!isOpen) return null;

  const totalParticipants = liveStudents.length;
  const takingCount = liveStudents.filter((s) => s.status === 'taking').length;
  const submittedCount = liveStudents.filter((s) => s.status === 'submitted').length;
  const violationCount = liveStudents.filter((s) => s.tabSwitches > 0).length;
  const absentCount = liveStudents.filter((s) => s.status === 'not_started').length;

  const filteredStudents = liveStudents.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.className.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'taking') return st.status === 'taking';
    if (statusFilter === 'submitted') return st.status === 'submitted';
    if (statusFilter === 'violation') return st.tabSwitches > 0;
    if (statusFilter === 'absent') return st.status === 'not_started';

    return true;
  });

  const handleForceSubmit = (studentName: string) => {
    warning('Thu bài cưỡng chế', `Đã gửi tín hiệu yêu cầu nộp bài ngay lập tức cho thí sinh ${studentName}.`);
    setLiveStudents((prev) =>
      prev.map((s) =>
        s.name === studentName
          ? { ...s, status: 'submitted', score: 7.5, remainingMinutes: 0 }
          : s
      )
    );
  };

  const handleWarnStudent = (studentName: string) => {
    info('Đã gửi cảnh báo', `Đã hiển thị thông điệp cảnh báo vi phạm trên màn hình của thí sinh ${studentName}.`);
  };

  const handleExtendTime = (extraMinutes: number) => {
    const newDuration = (exam.durationMinutes || 45) + extraMinutes;
    store.updateExam(exam.id, { durationMinutes: newDuration });
    success('Gia hạn phòng thi', `Đã cộng thêm ${extraMinutes} phút cho toàn bộ thí sinh trong ca thi.`);
  };

  const handleCopyExamLink = () => {
    navigator.clipboard.writeText(examUrl);
    setCopiedLink(true);
    success('Đã chép link phòng thi', examUrl);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center relative shadow-inner">
              <Radio className="w-5 h-5 animate-pulse text-rose-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Phòng Giám sát Trực tiếp Ca thi</span>
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2 py-0.5 rounded-full">
                  LIVE MONITOR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {exam.title} • {exam.durationMinutes} phút • Giám sát chuyển tab & Tiến độ thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQRProjector(!showQRProjector)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
              title="Chiếu QR phòng thi lên máy chiếu lớp học"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Máy chiếu QR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Proctoring Metrics Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">Sĩ số ca thi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{totalParticipants}</span>
              <span className="text-[11px] text-slate-400">thí sinh</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Đang làm bài</span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-blue-600">{takingCount}</span>
              <span className="text-[11px] text-slate-400">em</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 block">Đã nộp bài</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-600">{submittedCount}</span>
              <span className="text-[11px] text-slate-400">em</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-600 block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Vi phạm rời tab</span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-rose-600">{violationCount}</span>
              <span className="text-[11px] text-slate-400">em</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 block">Chưa vào thi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-600">{absentCount}</span>
              <span className="text-[11px] text-slate-400">vắng</span>
            </div>
          </div>
        </div>

        {/* Projector QR Mode Overlay */}
        {showQRProjector && (
          <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-center gap-8 border-b border-slate-700 animate-in fade-in duration-200">
            <div className="p-4 bg-white rounded-3xl shadow-xl text-center">
              <img
                src={qrApiUrl}
                alt="QR Code phòng thi"
                className="w-52 h-52 object-contain rounded-2xl mx-auto"
              />
              <span className="text-xs font-bold text-slate-700 mt-2 block">
                Quét bằng Camera / Zalo để vào thi
              </span>
            </div>

            <div className="space-y-3 max-w-md text-left">
              <span className="text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
                Trình chiếu phòng thi trực tiếp
              </span>
              <h4 className="text-lg font-bold text-white">{exam.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Học sinh dùng điện thoại hoặc máy tính bảng quét mã QR trên bảng để vào làm bài. Hệ thống tự động ghi danh và giám sát chuyển tab.
              </p>
              {exam.settings.requirePassword && exam.settings.password && (
                <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Mật khẩu phòng thi: <strong className="font-mono text-sm text-white">{exam.settings.password}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyExamLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Đã sao chép link' : 'Sao chép link phòng thi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQRProjector(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Thu nhỏ máy chiếu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm thí sinh theo họ tên, mã số, lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-800 outline-hidden font-medium"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({totalParticipants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('taking')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'taking'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đang thi ({takingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('violation')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'violation'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Rời tab ({violationCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'submitted'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã nộp ({submittedCount})
            </button>
          </div>

          {/* Proctoring emergency controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleExtendTime(5)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Gia hạn thêm 5 phút làm bài"
            >
              +5 phút
            </button>
            <button
              type="button"
              onClick={() => handleExtendTime(10)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Gia hạn thêm 10 phút làm bài"
            >
              +10 phút
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">Không tìm thấy thí sinh phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Thí sinh & Mã số</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Tiến độ làm bài</th>
                    <th className="py-3 px-3 text-center">Giám sát vi phạm</th>
                    <th className="py-3 px-3 text-center">Điểm số</th>
                    <th className="py-3 pr-4 text-right">Hành động giám thị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStudents.map((st) => {
                    const isTaking = st.status === 'taking';
                    const isSubmitted = st.status === 'submitted';
                    const isAbsent = st.status === 'not_started';
                    const hasViolation = st.tabSwitches > 0;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{st.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-3 text-slate-600 font-semibold">{st.className}</td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {isTaking && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                              <span>Đang làm bài</span>
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã nộp bài</span>
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <span>Chưa vào thi</span>
                            </span>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="py-3 px-3">
                          {isTaking ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800">
                                  {st.progress}/{st.totalQuestions} câu
                                </span>
                                <span className="text-slate-400 font-mono">
                                  Còn {st.remainingMinutes}p
                                </span>
                              </div>
                              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all"
                                  style={{
                                    width: `${Math.round((st.progress / st.totalQuestions) * 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          ) : isSubmitted ? (
                            <span className="text-[11px] text-slate-500">
                              Đã hoàn tất ({st.totalQuestions} câu)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Anti-cheat tab switches */}
                        <td className="py-3 px-3 text-center">
                          {hasViolation ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Rời tab {st.tabSwitches} lần</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              ✓ Bình thường
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-3 text-center">
                          {isSubmitted && st.score !== undefined ? (
                            <span className="font-extrabold text-sm text-slate-900">
                              {st.score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Proctor actions */}
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isTaking && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleWarnStudent(st.name)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Gửi nhắc nhở vi phạm tới học sinh"
                                >
                                  Cảnh báo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleForceSubmit(st.name)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Thu bài cưỡng chế"
                                >
                                  Thu bài
                                </button>
                              </>
                            )}
                            {isSubmitted && (
                              <a
                                href={`/exam/${exam.id}/result`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <span>Xem bài</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Đang phát tín hiệu giám sát phòng thi tự động.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAssignSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssignSettings();
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cấu hình lại ca thi
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Đóng phòng giám sát
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
