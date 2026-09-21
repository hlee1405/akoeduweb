import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Edit3,
  Check,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
  Plus,
  FileText,
  Clock,
  Eye,
  UserCheck,
  TrendingUp,
  Compass,
  Award,
  CheckCircle2,
  CalendarDays,
  User,
  Phone,
  Building,
  DollarSign
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { MonthlyStudentReport, ClassRoom, Student } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface MonthlyStudentReportModalProps {
  cls: ClassRoom;
  student?: Student;
  initialReportId?: string;
  onClose: () => void;
}

// Common comment and roadmap templates for teachers to quick-pick without AI
const QUICK_TEMPLATES = {
  general: [
    'Đi học đúng giờ, có ý thức lắng nghe giảng bài và ghi chép bài đầy đủ.',
    'Hoàn thành bài tập về nhà đầy đủ, bài làm cẩn thận và có tiến bộ rõ rệt.',
    'Chưa chủ động trong quá trình học, thường xuyên thiếu BTVN, trong giờ học hay sao nhãng.',
    'Trình bày bài chưa chỉn chu, làm ẩu, cần rèn thêm tính cẩn thận khi tính toán.',
    'Nắm chắc kiến thức lý thuyết cơ bản, cần tăng cường thêm các dạng toán tư duy nâng cao.',
    'Khả năng tiếp thu bài nhanh, cần rèn luyện thêm tính kiên nhẫn khi gặp bài khó.'
  ],
  roadmap: [
    'Hoàn thành các chuyên đề trọng tâm, tổng hợp và hệ thống lại kiến thức đã học.',
    'Tập trung khắc phục lỗi sai tính toán cơ bản và nâng cao tốc độ giải bài tập.',
    'Tăng cường luyện đề khảo sát định kỳ, rèn luyện kỹ năng trình bày bài thi chỉn chu.',
    'Củng cố phần kiến thức còn hổng và chuẩn bị kiến thức cho các kỳ kiểm tra sắp tới.'
  ]
};

// Helper to normalize report and ensure single roadmap field, schedule and bank info are auto-calculated
const normalizeReport = (r: MonthlyStudentReport, classData?: ClassRoom): MonthlyStudentReport => {
  let roadmapGeneral = r.roadmapGeneral;
  if (!roadmapGeneral) {
    const parts = [r.roadmapAlgebra, r.roadmapGeometry].filter(Boolean);
    if (parts.length > 0) {
      roadmapGeneral = parts.map((p) => (p?.startsWith('+') ? p : `+ ${p}`)).join('\n');
    } else {
      roadmapGeneral = '+ Hoàn thiện các chuyên đề trọng tâm và tăng cường luyện đề rèn kỹ năng.';
    }
  }
  const studentPhone = r.studentPhone || store.getStudents().find((s) => s.id === r.studentId)?.phone || '';

  // Auto-calculate weekly recurring schedule in background from class
  let scheduleItems = r.scheduleItems;
  if (!scheduleItems || scheduleItems.length === 0) {
    if (classData?.schedule && classData.schedule.length > 0) {
      scheduleItems = classData.schedule.map((s) => `${s.dayOfWeek}: ${s.startTime} - ${s.endTime}`);
    } else {
      scheduleItems = ['Chiều thứ 4: 16h - 18h', 'Chiều thứ 7: 13h - 15h', 'Chiều chủ nhật: 13h - 15h'];
    }
  }

  // Auto-fetch teacher details in background
  const teacher = store.getTeacher();
  const teacherName = r.teacherName || teacher.fullName ? `GV. ${teacher.fullName.replace(/^GV\.?\s*/i, '')}` : 'GV. Nguyễn Thanh Thúy';
  const teacherPhone = r.teacherPhone || teacher.phone || '0978783058';

  // Auto-fetch bank / VietQR account details in background from teacher profile / class fee config
  const feeConfig = classData?.feeConfig;
  const bankName = r.bankName || feeConfig?.bankCode || 'Techcombank';
  const bankAccount = r.bankAccount || feeConfig?.bankAccount || teacher.phone || '0978783058';
  const bankAccountName = r.bankAccountName || feeConfig?.bankAccountName || teacher.fullName || 'NGUYEN THANH THUY';

  return {
    ...r,
    teacherName,
    teacherPhone,
    roadmapGeneral,
    studentPhone,
    scheduleItems,
    bankName,
    bankAccount,
    bankAccountName
  };
};

export const MonthlyStudentReportModal: React.FC<MonthlyStudentReportModalProps> = ({
  cls,
  student,
  initialReportId,
  onClose
}) => {
  const { success, error, info } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const students = store.getStudentsByClassId(cls.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    student?.id || (students.length > 0 ? students[0].id : '')
  );

  const [selectedMonth, setSelectedMonth] = useState('8');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Preview or Edit mode (default to edit/input first)
  const [mode, setMode] = useState<'preview' | 'edit'>('edit');
  const [isExporting, setIsExporting] = useState(false);

  // Helper state for adding items in edit mode
  const [newDateInput, setNewDateInput] = useState('');

  // Report state
  const [report, setReport] = useState<MonthlyStudentReport>(() => {
    let baseReport: MonthlyStudentReport;
    if (initialReportId) {
      const found = store.getMonthlyReportById(initialReportId);
      if (found) {
        baseReport = found;
      } else {
        baseReport = store.createDefaultMonthlyReport(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
      }
    } else {
      const existing = store.getMonthlyReports(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
      if (existing.length > 0) {
        baseReport = existing[0];
      } else {
        baseReport = store.createDefaultMonthlyReport(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
      }
    }

    // Default to false (Đang tắt) when newly opening the report modal
    return normalizeReport({
      ...baseReport,
      includeFee: false,
      totalFee: undefined
    }, cls);
  });

  // When student or month changes, reload or create report while preserving user toggle choice
  useEffect(() => {
    const monthYear = `${selectedMonth}/${selectedYear}`;
    const existing = store.getMonthlyReports(cls.id, selectedStudentId, monthYear);
    if (existing.length > 0) {
      setReport((prev) => normalizeReport({
        ...existing[0],
        includeFee: prev.includeFee,
        totalFee: prev.includeFee && existing[0].feePerSession ? existing[0].sessionCount * existing[0].feePerSession : undefined
      }, cls));
    } else {
      const newDef = store.createDefaultMonthlyReport(cls.id, selectedStudentId, monthYear);
      setReport((prev) => normalizeReport({
        ...newDef,
        includeFee: prev.includeFee,
        totalFee: prev.includeFee && newDef.feePerSession ? newDef.sessionCount * newDef.feePerSession : undefined
      }, cls));
    }
  }, [selectedStudentId, selectedMonth, selectedYear, cls.id]);

  // Always scroll to top when changing views or students
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [mode, selectedStudentId, selectedMonth, selectedYear, report.includeFee]);

  // Recalculate total tuition when sessions or feePerSession change
  const handleSessionCountChange = (count: number) => {
    const totalFee = report.includeFee && report.feePerSession ? count * report.feePerSession : report.totalFee;
    const totalHours = Number((count * 2.2).toFixed(1));
    setReport((prev) => ({
      ...prev,
      sessionCount: count,
      totalHours,
      totalFee
    }));
  };

  const handleFeePerSessionChange = (fee: number) => {
    const totalFee = report.sessionCount ? report.sessionCount * fee : 0;
    setReport((prev) => ({
      ...prev,
      feePerSession: fee,
      totalFee
    }));
  };

  const handleSaveReport = () => {
    store.saveMonthlyReport(report);
    success('Đã lưu thông tin phiếu báo cáo');
    setMode('preview');
  };

  // Export to PNG image (Perfect for sending to parents via Zalo)
  const handleExportPNG = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      info('Đang tạo ảnh chất lượng cao để gửi Zalo...');

      const dataUrl = await toPng(printRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `Bao-cao-${report.studentName.replace(/\s+/g, '_')}-T${report.monthYear.replace('/', '_')}.png`;
      link.href = dataUrl;
      link.click();

      success('Đã tải ảnh phiếu báo cáo thành công!');
    } catch (err) {
      console.error('Error generating image:', err);
      error('Không thể tạo ảnh. Vui lòng thử lại hoặc sử dụng tính năng In phiếu.');
    } finally {
      setIsExporting(false);
    }
  };

  // Print or Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Add date chip to sessionDates
  const handleAddDate = () => {
    if (!newDateInput.trim()) return;
    setReport((prev) => {
      const updated = [...prev.sessionDates, newDateInput.trim()];
      return {
        ...prev,
        sessionDates: updated,
        sessionCount: updated.length,
        totalHours: Number((updated.length * 2.2).toFixed(1)),
        totalFee: prev.includeFee && prev.feePerSession ? updated.length * prev.feePerSession : prev.totalFee
      };
    });
    setNewDateInput('');
  };

  const handleRemoveDate = (index: number) => {
    setReport((prev) => {
      const updated = prev.sessionDates.filter((_, idx) => idx !== index);
      return {
        ...prev,
        sessionDates: updated,
        sessionCount: updated.length,
        totalHours: Number((updated.length * 2.2).toFixed(1)),
        totalFee: prev.includeFee && prev.feePerSession ? updated.length * prev.feePerSession : prev.totalFee
      };
    });
  };

  // Generate VietQR URL if tuition is enabled
  const vietQrUrl =
    report.includeFee && report.bankAccount
      ? `https://img.vietqr.io/image/${report.bankName || 'TCB'}-${report.bankAccount}-compact.png?amount=${report.totalFee || 0}&addInfo=HOC%20PHI%20T${report.monthYear.replace('/', '_')}%20${encodeURIComponent(report.studentName)}&accountName=${encodeURIComponent(report.bankAccountName || '')}`
      : '';

  // Helper to format raw multiline comments into clean, elegant bullet items
  const renderBulletList = (text?: string, dotColor: string = 'bg-blue-600') => {
    if (!text) return null;
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    return (
      <div className="space-y-1.5 pt-0.5">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[+\-•*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1.5`} />
              <span className="flex-1">{cleanLine}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-300 flex flex-col max-h-[96vh] overflow-hidden my-auto">
        {/* Top Control Bar */}
        <div className="bg-white px-4 sm:px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {report.includeFee ? 'Phiếu Báo Cáo Học Tập & Thu Học Phí' : 'Phiếu Báo Cáo Kết Quả Học Tập Tháng'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode: Edit (Nội dung) vs Preview */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mode === 'edit' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Nội dung</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mode === 'preview' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem phiếu</span>
              </button>
            </div>

            {/* Export PNG */}
            <button
              id="btn-export-report-png"
              type="button"
              disabled={isExporting}
              onClick={handleExportPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Tải ảnh PNG sắc nét để gửi ngay vào Zalo của phụ huynh"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải ảnh'}</span>
            </button>

            {/* Print / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar: Select Student, Month, Fee Toggle */}
        <div className="bg-slate-50 px-4 sm:px-5 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Select Student */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Học sinh:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.code || 'HS'})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Month & Year */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          {/* Fee Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Kèm thông tin học phí & QR:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={report.includeFee}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setReport((prev) => ({
                    ...prev,
                    includeFee: checked,
                    totalFee: checked && prev.feePerSession ? prev.sessionCount * prev.feePerSession : undefined,
                    footerNote: checked
                      ? 'Phụ huynh vui lòng kiểm tra thông tin học phí và lịch học. Mọi thắc mắc xin liên hệ giáo viên: ' + prev.teacherPhone
                      : 'Kính mong quý phụ huynh tiếp tục đồng hành và nhắc nhở con ôn tập theo lộ trình. Mọi trao đổi xin liên hệ giáo viên: ' + prev.teacherPhone
                  }));
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {report.includeFee ? '(Đang bật)' : '(Đang tắt)'}
            </span>
          </div>
        </div>

        {/* Content Area: Either Preview or Edit */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/50 flex justify-center"
        >
          {mode === 'preview' ? (
            /* ===== THE ELEGANT REPORT CARD: A COMPLETE, SINGLE UNIFIED CONTAINER ===== */
            <div
              ref={printRef}
              id="report-card-to-export"
              className="w-full max-w-[740px] h-fit self-start bg-white text-slate-800 p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200/90 space-y-5"
              style={{
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              {/* 1. Header: Teacher Info + Title */}
              <div className="border-b border-slate-200/80 pb-4">
                <div className="flex items-center justify-end text-xs text-slate-500 font-medium pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="text-slate-500 font-semibold">
                    GV: <span className="text-slate-800 font-bold">{report.teacherName}</span> • Hotline/Zalo:{' '}
                    <span className="text-slate-800 font-bold">{report.teacherPhone}</span>
                  </div>
                </div>

                <div className="text-center space-y-1.5 pt-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {report.includeFee
                      ? `PHIẾU BÁO CÁO HỌC TẬP & HỌC PHÍ`
                      : `PHIẾU BÁO CÁO KẾT QUẢ HỌC TẬP`}
                  </h1>
                  <div>
                    <span className="inline-block px-3 py-0.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-full border border-blue-100">
                      THÁNG {report.monthYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Overview Stats Grid */}
              <div className={`grid gap-3 ${report.includeFee ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {/* Student info tile */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học sinh</div>
                  <div className="mt-1">
                    <div className="font-extrabold text-slate-900 text-base leading-tight">
                      {report.studentName}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-0.5">
                      Sđt: <span className="text-slate-700 font-bold">{report.studentPhone || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {/* Session count tile */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Số buổi học</div>
                  <div className="mt-1">
                    <div className="font-extrabold text-blue-900 text-base leading-tight">
                      {report.sessionCount} buổi
                    </div>
                    <div className="text-xs text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tham gia đầy đủ</span>
                    </div>
                  </div>
                </div>

                {/* Total hours tile */}
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Thời lượng học</div>
                  <div className="mt-1">
                    <div className="font-extrabold text-indigo-900 text-base leading-tight">
                      {report.totalHours} giờ
                    </div>
                    <div className="text-xs text-indigo-500 font-semibold mt-0.5">
                      Tiết học thực tế
                    </div>
                  </div>
                </div>

                {/* Total fee tile (Only when includeFee is true) */}
                {report.includeFee && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Tổng học phí</div>
                    <div className="mt-1">
                      <div className="font-extrabold text-rose-600 text-base leading-tight">
                        {report.totalFee ? `${report.totalFee.toLocaleString('vi-VN')} đ` : 'Chưa tính'}
                      </div>
                      <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                        {report.feePerSession?.toLocaleString('vi-VN')} đ/buổi
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Session Dates Pill Grid */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/90 space-y-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chi tiết các buổi học trong tháng ({report.sessionDates.length} buổi)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {report.sessionDates.map((dateStr, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs"
                    >
                      {dateStr}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Teacher's Assessment Section (Nhận xét học tập) */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhận xét của giáo viên</span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed">
                  {renderBulletList(report.generalComment, 'bg-blue-600')}
                </div>
              </div>

              {/* 5. Upcoming Roadmap & Fixed Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Next Month Roadmap */}
                <div className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lộ trình & Mục tiêu sắp tới</span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {renderBulletList(
                      report.roadmapGeneral || report.roadmapAlgebra || 'Hoàn thành các chuyên đề trọng tâm và tăng cường luyện đề rèn kỹ năng.',
                      'bg-indigo-500'
                    )}
                  </div>
                </div>

                {/* Recurring Schedule */}
                <div className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lịch học định kỳ hàng tuần</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    {report.scheduleItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Tuition & VietQR Payment Box (ONLY IF includeFee = true) */}
              {report.includeFee && (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/40 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-amber-200 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Thông tin thanh toán học phí qua VietQR</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-8 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                        <span className="text-slate-500 font-medium">Học sinh:</span>
                        <span className="font-bold text-slate-800">{report.studentName} ({report.className})</span>
                      </div>
                      <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                        <span className="text-slate-500 font-medium">Số buổi đã học:</span>
                        <span className="font-bold text-slate-800">{report.sessionCount} buổi</span>
                      </div>
                      <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                        <span className="text-slate-500 font-medium">Tổng tiền học phí:</span>
                        <span className="font-black text-rose-600 text-base">
                          {report.totalFee ? `${report.totalFee.toLocaleString('vi-VN')} đ` : 'Chưa tính'}
                        </span>
                      </div>
                      <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
                        <div>
                          Ngân hàng: <span className="font-bold text-slate-800">{report.bankName}</span> - STK:{' '}
                          <span className="font-bold text-slate-800">{report.bankAccount}</span>
                        </div>
                        <div className="uppercase">
                          Chủ tài khoản: <span className="font-bold text-slate-800">{report.bankAccountName}</span>
                        </div>
                        <div className="text-amber-800 font-medium mt-1">
                          Nội dung chuyển khoản: <span className="font-mono font-bold bg-amber-100/70 px-1.5 py-0.5 rounded">HOC PHI T{report.monthYear.replace('/', '_')} {report.studentName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-4 flex flex-col items-center justify-center text-center">
                      {vietQrUrl ? (
                        <img
                          src={vietQrUrl}
                          alt="VietQR Chuyển khoản"
                          className="w-32 h-32 object-contain rounded-xl border border-amber-200 bg-white p-1 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center border border-amber-200 shadow-xs">
                          <QrCode className="w-16 h-16 text-slate-400" />
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold mt-1">Quét mã để thanh toán</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ===== EDIT MODE (COMPLETELY SYNCHRONIZED WITH THE PREVIEW SECTIONS) ===== */
            <div className="w-full max-w-[740px] h-fit self-start bg-white text-slate-800 p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200/90 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      Nội dung phiếu báo cáo
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu & Xem phiếu</span>
                </button>
              </div>

              {/* Section 1: Thông tin học sinh */}
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/60">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Thông tin học sinh</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Họ và tên học sinh</label>
                    <input
                      type="text"
                      value={report.studentName}
                      onChange={(e) => setReport({ ...report, studentName: e.target.value })}
                      placeholder="Họ và tên học sinh"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={report.studentPhone || ''}
                      onChange={(e) => setReport({ ...report, studentPhone: e.target.value })}
                      placeholder="Ví dụ: 0987873058"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Số buổi, Thời lượng & Đơn giá */}
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Thống kê Buổi học & Học phí</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số buổi đã học</label>
                    <input
                      type="number"
                      value={report.sessionCount}
                      onChange={(e) => handleSessionCountChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tổng thời lượng (giờ)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={report.totalHours}
                      onChange={(e) => setReport({ ...report, totalHours: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Đơn giá học phí/buổi (VNĐ)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={report.feePerSession || 120000}
                      onChange={(e) => handleFeePerSessionChange(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Danh sách ngày học */}
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Chi tiết các ngày học trong tháng ({report.sessionDates.length} buổi)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {report.sessionDates.map((d, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(idx)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Xóa ngày này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nhập ngày (ví dụ: 30/08)"
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDate();
                      }
                    }}
                    className="w-48 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDate}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ngày</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Nhận xét của giáo viên */}
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/60">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. Nhận xét của Giáo viên</span>
                </div>

                {/* Single General Comment */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Nội dung nhận xét (Ý thức, tác phong & tiến độ học tập)
                    </label>
                    <span className="text-[11px] text-slate-400">Chọn mẫu nhanh:</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-1">
                    {QUICK_TEMPLATES.general.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setReport((prev) => ({
                            ...prev,
                            generalComment: prev.generalComment ? `${prev.generalComment}\n+ ${tpl}` : `+ ${tpl}`
                          }))
                        }
                        className="text-[11px] px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium transition-colors cursor-pointer text-left"
                      >
                        + {tpl.slice(0, 35)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={4}
                    value={report.generalComment}
                    onChange={(e) => setReport({ ...report, generalComment: e.target.value })}
                    placeholder="+ Ý thức học tập trên lớp, làm bài tập về nhà, mức độ tiếp thu và tiến bộ..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                  />
                </div>
              </div>

              {/* Section 5: Lộ trình sắp tới */}
              <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/60">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>5. Lộ trình & Mục tiêu sắp tới</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Mục tiêu & Kế hoạch học tập sắp tới
                    </label>
                    <span className="text-[11px] text-slate-400">Chọn mẫu nhanh:</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-1">
                    {QUICK_TEMPLATES.roadmap.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setReport((prev) => ({
                            ...prev,
                            roadmapGeneral: prev.roadmapGeneral ? `${prev.roadmapGeneral}\n+ ${tpl}` : `+ ${tpl}`
                          }))
                        }
                        className="text-[11px] px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-medium transition-colors cursor-pointer text-left"
                      >
                        + {tpl.slice(0, 35)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={report.roadmapGeneral || ''}
                    onChange={(e) => setReport({ ...report, roadmapGeneral: e.target.value })}
                    placeholder="+ Hoàn thành các chuyên đề trọng tâm, rèn luyện kỹ năng giải bài..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
