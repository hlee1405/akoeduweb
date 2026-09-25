import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Save,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  CalendarDays,
  User,
  Phone,
  Building,
  DollarSign,
  ChevronDown,
  BookOpen,
  Check,
  FileText,
  Settings2,
  ArrowRightLeft,
  Upload,
  Trash2,
  Image as ImageIcon
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

// Popular Vietnamese Banks for VietQR
export const POPULAR_BANKS = [
  { code: 'TCB', name: 'Techcombank', label: 'Techcombank (Ngân hàng Kỹ thương)' },
  { code: 'VCB', name: 'Vietcombank', label: 'Vietcombank (Ngân hàng Ngoại thương)' },
  { code: 'MB', name: 'MB Bank', label: 'MB Bank (Ngân hàng Quân đội)' },
  { code: 'BIDV', name: 'BIDV', label: 'BIDV (Ngân hàng Đầu tư & Phát triển)' },
  { code: 'VPB', name: 'VPBank', label: 'VPBank (Ngân hàng Thịnh Vượng)' },
  { code: 'ACB', name: 'ACB', label: 'ACB (Ngân hàng Á Châu)' },
  { code: 'TPB', name: 'TPBank', label: 'TPBank (Ngân hàng Tiên Phong)' },
  { code: 'CTG', name: 'VietinBank', label: 'VietinBank (Ngân hàng Công thương)' },
  { code: 'VBA', name: 'Agribank', label: 'Agribank (Nông nghiệp & PTNT)' },
  { code: 'STB', name: 'Sacombank', label: 'Sacombank (Ngân hàng Sài Gòn Thương Tín)' },
  { code: 'VIB', name: 'VIB', label: 'VIB (Ngân hàng Quốc tế)' },
  { code: 'CAKE', name: 'CAKE', label: 'CAKE by VPBank' }
];

// Quick sample templates for remarks and learning roadmap
const QUICK_TEMPLATES = {
  general: [
    'Có ý thức, cố gắng, hợp tác trong quá trình học. Có tiến bộ trong phản xạ, có khả năng tư duy số học tốt tuy nhiên cần chăm chỉ ôn tập bài.',
    'Đi học đúng giờ, có ý thức lắng nghe giảng bài và ghi chép bài đầy đủ, chủ động phát biểu xây dựng bài.',
    'Nắm chắc kiến thức lý thuyết cơ bản, bài làm cẩn thận và có tiến bộ rõ rệt qua từng tuần học.',
    'Khả năng tiếp thu bài nhanh, tuy nhiên trình bày bài còn hơi ẩu, cần rèn thêm tính cẩn thận khi tính toán.'
  ],
  roadmap: [
    '+ Tiếp tục rèn luyện kỹ năng giải bài tập nâng cao và bài toán thực tế.\n+ Củng cố các chuyên đề trọng tâm chuẩn bị cho kỳ kiểm tra sắp tới.\n+ Tăng cường tự luyện đề định kỳ để kiểm soát thời gian làm bài.',
    '+ Nắm chắc kiến thức nền tảng và các dạng bài tập phân loại.\n+ Rèn luyện phương pháp tư duy suy luận logic, giải bài theo từng bước rõ ràng.\n+ Bổ trợ kiến thức còn thiếu sót qua các buổi phụ đạo.',
    '+ Luyện tập các dạng bài thi học kỳ và tuyển sinh.\n+ Chú trọng kỹ năng trình bày, tránh mất điểm ở các lỗi tính toán cơ bản.'
  ]
};

// Date format conversion helpers
const toInputDate = (d?: string): string => {
  if (!d) return '2026-08-01';
  if (d.includes('-')) return d; // already YYYY-MM-DD
  const parts = d.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '2026-08-01';
};

const fromInputDate = (d: string): string => {
  if (!d) return '01/08/2026';
  if (d.includes('/')) return d; // already DD/MM/YYYY
  const parts = d.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return d;
};

// Helper to normalize report state with all default toggle values
const normalizeReport = (r: MonthlyStudentReport, classData?: ClassRoom): MonthlyStudentReport => {
  const teacher = store.getTeacher();
  const teacherName = r.teacherName || (teacher.fullName ? `GV. ${teacher.fullName.replace(/^GV\.?\s*/i, '')}` : 'GV. Nguyễn Thanh Thúy');
  const teacherPhone = r.teacherPhone || teacher.phone || '0978783058';

  const feeConfig = classData?.feeConfig;
  const bankName = r.bankName || feeConfig?.bankCode || 'Techcombank';
  const bankAccount = r.bankAccount || feeConfig?.bankAccount || teacher.phone || '0978783058';
  const bankAccountName = r.bankAccountName || feeConfig?.bankAccountName || teacher.fullName || 'NGUYEN THANH THUY';

  const feeType = r.feeType || feeConfig?.feeType || 'per_session';
  const feePerSession = r.feePerSession !== undefined ? r.feePerSession : (feeConfig?.feePerSession || 120000);
  const fixedFeeAmount = r.fixedFeeAmount !== undefined ? r.fixedFeeAmount : (feeConfig?.fixedFeeAmount || 1500000);
  const sessionCount = r.sessionCount || (r.sessionDates?.length > 0 ? r.sessionDates.length : 8);
  const totalFee = feeType === 'fixed_period' ? fixedFeeAmount : sessionCount * feePerSession;

  const defaultDates = r.sessionDates && r.sessionDates.length > 0
    ? r.sessionDates
    : ['04/08', '07/08', '09/08', '12/08', '13/08', '17/08', '18/08', '21/08', '24/08', '26/08', '28/08'];

  const startDate = r.startDate || `01/08/2026`;
  const endDate = r.endDate || `31/08/2026`;
  const customTitle = r.customTitle || `HỌC PHÍ THÁNG ${r.monthYear || '8/2026'}`;
  const customQrImage = r.customQrImage || feeConfig?.customQrImage;
  const qrMode = r.qrMode || feeConfig?.qrMode || (customQrImage ? 'custom_image' : 'auto_vietqr');

  return {
    ...r,
    teacherName,
    teacherPhone,
    bankName,
    bankAccount,
    bankAccountName,
    feeType,
    feePerSession,
    fixedFeeAmount,
    sessionCount,
    totalFee,
    sessionDates: defaultDates,
    startDate,
    endDate,
    customTitle,
    customQrImage,
    qrMode,
    templateStyle: r.templateStyle || 'template1',
    // Visibility toggles
    showStudentName: r.showStudentName !== undefined ? r.showStudentName : true,
    showStudentPhone: r.showStudentPhone !== undefined ? r.showStudentPhone : true,
    showFeePerSession: r.showFeePerSession !== undefined ? r.showFeePerSession : true,
    showSessionCount: r.showSessionCount !== undefined ? r.showSessionCount : true,
    showSessionDates: r.showSessionDates !== undefined ? r.showSessionDates : true,
    showQrCode: r.showQrCode !== undefined ? r.showQrCode : true,
    includeFee: true,
    generalComment: r.generalComment || QUICK_TEMPLATES.general[0],
    roadmapGeneral: r.roadmapGeneral || QUICK_TEMPLATES.roadmap[0]
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
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const safeOpenPicker = (inputEl: HTMLInputElement | null) => {
    if (!inputEl) return;
    try {
      if (typeof inputEl.showPicker === 'function') {
        inputEl.showPicker();
      } else {
        inputEl.focus();
      }
    } catch (err) {
      try {
        inputEl.focus();
      } catch {}
    }
  };

  const students = store.getStudentsByClassId(cls.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    student?.id || (students.length > 0 ? students[0].id : '')
  );

  const [selectedMonth, setSelectedMonth] = useState('8');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeTemplate, setActiveTemplate] = useState<'template1' | 'template2'>('template1');
  const [isExporting, setIsExporting] = useState(false);

  // QR config modal state
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [showQrConfigModal, setShowQrConfigModal] = useState(false);
  const [qrBankName, setQrBankName] = useState(cls.feeConfig?.bankCode || 'Techcombank');
  const [qrBankAccount, setQrBankAccount] = useState(cls.feeConfig?.bankAccount || '0978783058');
  const [qrBankAccountName, setQrBankAccountName] = useState(cls.feeConfig?.bankAccountName || 'NGUYEN THANH THUY');
  const [qrTransferPrefix, setQrTransferPrefix] = useState(cls.feeConfig?.qrTransferContent || 'HP');
  const [qrMode, setQrMode] = useState<'auto_vietqr' | 'custom_image'>(
    cls.feeConfig?.qrMode || (cls.feeConfig?.customQrImage ? 'custom_image' : 'auto_vietqr')
  );
  const [customQrImage, setCustomQrImage] = useState<string | undefined>(
    cls.feeConfig?.customQrImage
  );

  // Report state
  const [report, setReport] = useState<MonthlyStudentReport>(() => {
    let baseReport: MonthlyStudentReport;
    if (initialReportId) {
      const found = store.getMonthlyReportById(initialReportId);
      baseReport = found || store.createDefaultMonthlyReport(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
    } else {
      const existing = store.getMonthlyReports(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
      baseReport = existing.length > 0 ? existing[0] : store.createDefaultMonthlyReport(cls.id, selectedStudentId, `${selectedMonth}/${selectedYear}`);
    }
    return normalizeReport(baseReport, cls);
  });

  // Recompute sessions, attendance days and tuition when timerange or student changes
  const computeDatesFromTimeRange = (
    startDDMMYYYY: string,
    endDDMMYYYY: string,
    studId: string,
    currentFeeType: 'per_session' | 'fixed_period',
    feePerSess: number,
    fixedAmount: number
  ) => {
    const startISO = toInputDate(startDDMMYYYY);
    const endISO = toInputDate(endDDMMYYYY);

    // Filter attendance records
    const attendanceRecords = store.getAttendanceRecords(cls.id).filter(
      (r) =>
        r.studentId === studId &&
        r.date >= startISO &&
        r.date <= endISO &&
        (r.status === 'present' || r.status === 'late')
    );

    let sessionDates: string[] = [];
    if (attendanceRecords.length > 0) {
      const sorted = [...attendanceRecords].sort((a, b) => a.date.localeCompare(b.date));
      const dateSet = new Set<string>();
      sorted.forEach((r) => {
        const parts = r.date.split('-');
        if (parts.length === 3) dateSet.add(`${parts[2]}/${parts[1]}`);
      });
      sessionDates = Array.from(dateSet);
    } else {
      // Fallback: check class schedule or sessions
      const allClassSessions = store.getSessions(cls.id).filter(
        (s) => s.date >= startISO && s.date <= endISO
      );
      if (allClassSessions.length > 0) {
        const dateSet = new Set<string>();
        allClassSessions.forEach((s) => {
          const parts = s.date.split('-');
          if (parts.length === 3) dateSet.add(`${parts[2]}/${parts[1]}`);
        });
        sessionDates = Array.from(dateSet).sort();
      } else {
        // Generate valid dates within range based on start and end
        const sDate = new Date(startISO);
        const eDate = new Date(endISO);
        const dates: string[] = [];
        const cur = new Date(sDate);
        while (cur <= eDate && dates.length < 16) {
          const day = cur.getDay();
          // Monday, Wednesday, Friday, Sunday
          if (day === 1 || day === 3 || day === 5 || day === 0) {
            const dd = String(cur.getDate()).padStart(2, '0');
            const mm = String(cur.getMonth() + 1).padStart(2, '0');
            dates.push(`${dd}/${mm}`);
          }
          cur.setDate(cur.getDate() + 1);
        }
        sessionDates = dates.length > 0 ? dates : ['04/08', '07/08', '09/08', '12/08', '13/08', '17/08', '18/08', '21/08', '24/08', '26/08', '28/08'];
      }
    }

    const sessionCount = sessionDates.length;
    const totalFee = currentFeeType === 'fixed_period' ? fixedAmount : sessionCount * feePerSess;

    return { sessionDates, sessionCount, totalFee };
  };

  // When student changes, reload or update report state
  useEffect(() => {
    const currentStudent = students.find((s) => s.id === selectedStudentId);
    const monthYear = `${selectedMonth}/${selectedYear}`;
    const existing = store.getMonthlyReports(cls.id, selectedStudentId, monthYear);

    if (existing.length > 0) {
      setReport(normalizeReport(existing[0], cls));
    } else {
      const newDef = store.createDefaultMonthlyReport(cls.id, selectedStudentId, monthYear);
      if (currentStudent) {
        newDef.studentName = currentStudent.fullName;
        newDef.studentPhone = currentStudent.phone;
      }
      setReport(normalizeReport(newDef, cls));
    }
  }, [selectedStudentId, selectedMonth, selectedYear, cls.id]);

  const handleSaveDraft = () => {
    store.saveMonthlyReport(report);
    success('Đã lưu bản nháp', 'Phiếu báo cáo & học phí đã được lưu vào hệ thống.');
  };

  // Switch between Per Session vs Fixed Period
  const handleToggleFeeType = (type: 'per_session' | 'fixed_period') => {
    const totalFee =
      type === 'fixed_period'
        ? (report.fixedFeeAmount || 1500000)
        : report.sessionCount * (report.feePerSession || 120000);
    setReport((prev) => ({
      ...prev,
      feeType: type,
      totalFee
    }));
    success(
      'Đã đổi hình thức thu học phí',
      type === 'fixed_period' ? 'Đã chuyển sang thu cố định theo kỳ' : 'Đã chuyển sang thu theo số buổi học thực tế'
    );
  };

  // Change Fee Per Session
  const handleFeePerSessionChange = (amount: number) => {
    const safeAmount = Math.max(0, isNaN(amount) ? 0 : amount);
    const totalFee = report.sessionCount * safeAmount;
    setReport((prev) => ({
      ...prev,
      feePerSession: safeAmount,
      totalFee: prev.feeType === 'per_session' ? totalFee : prev.totalFee
    }));
  };

  // Change Fixed Fee Amount
  const handleFixedFeeAmountChange = (amount: number) => {
    const safeAmount = Math.max(0, isNaN(amount) ? 0 : amount);
    setReport((prev) => ({
      ...prev,
      fixedFeeAmount: safeAmount,
      totalFee: prev.feeType === 'fixed_period' ? safeAmount : prev.totalFee
    }));
  };

  // Handle Date Range Change
  const handleStartDateChange = (val: string) => {
    const parts = val.split('/');
    let autoTitle = report.customTitle;
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      const y = parts[2] || '2026';
      if (!isNaN(m)) {
        autoTitle = `HỌC PHÍ THÁNG ${m}/${y}`;
      }
    }

    const { sessionDates, sessionCount, totalFee } = computeDatesFromTimeRange(
      val,
      report.endDate || '31/08/2026',
      selectedStudentId,
      report.feeType || 'per_session',
      report.feePerSession || 120000,
      report.fixedFeeAmount || 1500000
    );

    setReport((prev) => ({
      ...prev,
      startDate: val,
      customTitle: autoTitle,
      sessionDates,
      sessionCount,
      totalFee
    }));

    if ((report.feeType || 'per_session') === 'per_session') {
      info(
        'Đã cập nhật kỳ học',
        `Đã quét và tính ${sessionCount} buổi học (${val} đến ${report.endDate || '31/08/2026'})`
      );
    }
  };

  const handleEndDateChange = (val: string) => {
    const { sessionDates, sessionCount, totalFee } = computeDatesFromTimeRange(
      report.startDate || '01/08/2026',
      val,
      selectedStudentId,
      report.feeType || 'per_session',
      report.feePerSession || 120000,
      report.fixedFeeAmount || 1500000
    );

    setReport((prev) => ({
      ...prev,
      endDate: val,
      sessionDates,
      sessionCount,
      totalFee
    }));

    if ((report.feeType || 'per_session') === 'per_session') {
      info(
        'Đã cập nhật kỳ học',
        `Đã quét và tính ${sessionCount} buổi học (${report.startDate || '01/08/2026'} đến ${val})`
      );
    }
  };

  // Upload Custom QR Image
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('File không hợp lệ', 'Vui lòng chọn file ảnh (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('File quá lớn', 'Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomQrImage(result);
      setQrMode('custom_image');
      success('Đã tải ảnh QR', 'Đã tải ảnh mã QR lên thành công.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomQrImage = () => {
    setCustomQrImage(undefined);
    setQrMode('auto_vietqr');
    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = '';
    }
    info('Đã xóa ảnh QR', 'Đã chuyển về tạo mã VietQR tự động.');
  };

  // Save QR config
  const handleSaveQrConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFeeConfig = {
      ...(cls.feeConfig || { enabled: true }),
      bankCode: qrBankName,
      bankAccount: qrBankAccount,
      bankAccountName: qrBankAccountName.toUpperCase(),
      qrTransferContent: qrTransferPrefix,
      customQrImage,
      qrMode
    };

    store.updateClass(cls.id, { feeConfig: updatedFeeConfig });

    setReport((prev) => ({
      ...prev,
      bankName: qrBankName,
      bankAccount: qrBankAccount,
      bankAccountName: qrBankAccountName.toUpperCase(),
      customQrImage,
      qrMode
    }));

    setShowQrConfigModal(false);
    success('Đã lưu thông tin QR', 'Mã QR và thông tin ngân hàng trên phiếu đã được cập nhật.');
  };

  // Derive dynamic header title from customTitle or startDate / endDate
  const getDynamicTitle = () => {
    if (report.customTitle) {
      return report.customTitle;
    }
    if (report.startDate) {
      const parts = report.startDate.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        const y = parts[2] || '2026';
        if (!isNaN(m)) {
          return `HỌC PHÍ THÁNG ${m}/${y}`;
        }
      }
    }
    return `HỌC PHÍ THÁNG ${report.monthYear || '8/2026'}`;
  };

  // Export to PNG image
  const handleExportPNG = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      info('Đang tạo ảnh chất lượng cao để tải về...');

      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });

      const studentNameClean = (report.studentName || 'HocSinh').replace(/\s+/g, '_');
      const filename = `Phieu_Hoc_Phi_${studentNameClean}_${(report.monthYear || '8_2026').replace('/', '_')}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      success('Tải ảnh thành công', `Đã lưu phiếu vào máy: ${filename}`);
    } catch (err) {
      console.error(err);
      error('Lỗi khi xuất ảnh', 'Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy PNG image to clipboard
  const handleCopyImage = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      info('Đang sao chép ảnh vào bộ nhớ tạm (clipboard)...');

      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob
          })
        ]);
        success('Đã sao chép ảnh', 'Bạn có thể dán (Ctrl + V) trực tiếp vào Zalo hoặc tin nhắn cho phụ huynh.');
      } else {
        const link = document.createElement('a');
        link.download = `Phieu_Hoc_Phi.png`;
        link.href = dataUrl;
        link.click();
        success('Đã tải ảnh về', 'Trình duyệt không hỗ trợ copy ảnh trực tiếp, đã tự động tải về file ảnh.');
      }
    } catch (err) {
      console.error(err);
      error('Lỗi sao chép ảnh', 'Vui lòng nhấn Tải ảnh về để lưu ảnh.');
    } finally {
      setIsExporting(false);
    }
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Generate VietQR URL
  const totalDueAmount =
    report.totalFee !== undefined
      ? report.totalFee
      : report.feeType === 'fixed_period'
      ? (report.fixedFeeAmount || 1500000)
      : (report.sessionCount * (report.feePerSession || 120000));

  const transferContent = `${qrTransferPrefix} ${report.studentName || 'HS'} T${report.monthYear ? report.monthYear.replace('/', '-') : '8-2026'}`;
  const foundBank = POPULAR_BANKS.find(b => b.name.toLowerCase() === report.bankName?.toLowerCase() || b.code.toLowerCase() === report.bankName?.toLowerCase());
  const bankCode = foundBank ? foundBank.code : 'TCB';

  const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${report.bankAccount || '0978783058'}-compact.png?amount=${totalDueAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(report.bankAccountName || 'NGUYEN THANH THUY')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Học phí và Báo cáo
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {report.teacherName.replace(/^GV\.?\s*/i, '')} - STK {report.bankAccount} ({report.bankName})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Template Selectors */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium mr-1">Chọn mẫu</span>
              <button
                type="button"
                onClick={() => setActiveTemplate('template1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTemplate === 'template1'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mẫu 1
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('template2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTemplate === 'template2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mẫu 2
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-COLUMN SPLIT BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ================= LEFT COLUMN: CONTROLS & INPUTS ================= */}
          <div className="lg:col-span-6 p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(94vh-130px)]">
            {/* Section 1: Thông tin học sinh */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Thông tin học sinh
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Bật/tắt các mục hiển thị trên phiếu ({report.feeType === 'fixed_period' ? 'Học phí cố định theo kỳ' : 'Học phí tính theo số buổi'})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrConfigModal(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cấu hình QR</span>
                </button>
              </div>

              {/* 2-Column Grid of Clean Cards with Toggle Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Học sinh */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Học sinh</label>
                    <p className="font-bold text-xs text-slate-800 truncate">
                      {report.studentName || 'Học sinh'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showStudentName}
                      onChange={(e) => setReport({ ...report, showStudentName: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 2. Số điện thoại */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Số điện thoại</label>
                    <p className="font-bold text-xs text-slate-800 truncate">
                      {report.studentPhone || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showStudentPhone}
                      onChange={(e) => setReport({ ...report, showStudentPhone: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 3. Học phí áp dụng */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                      {report.feeType === 'fixed_period' ? 'Học phí theo kỳ' : 'Học phí áp dụng'}
                    </label>
                    <p className="font-bold text-xs text-slate-800">
                      {report.feeType === 'fixed_period'
                        ? `${(report.fixedFeeAmount || 1500000).toLocaleString('vi-VN')} đ/kỳ`
                        : `${(report.feePerSession || 120000).toLocaleString('vi-VN')} đ/buổi`}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showFeePerSession}
                      onChange={(e) => setReport({ ...report, showFeePerSession: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 4. Số buổi học */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Số buổi học</label>
                    <p className="font-bold text-xs text-slate-800">
                      {report.sessionCount} buổi
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showSessionCount}
                      onChange={(e) => setReport({ ...report, showSessionCount: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 5. Ngày học */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Ngày học</label>
                    <p className="font-bold text-xs text-slate-800">
                      {report.sessionDates.length} ngày
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showSessionDates}
                      onChange={(e) => setReport({ ...report, showSessionDates: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 6. Ảnh QR */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Ảnh QR</label>
                    <p className="font-bold text-xs text-slate-800 truncate">
                      {report.bankName} - {report.bankAccount}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={report.showQrCode}
                      onChange={(e) => setReport({ ...report, showQrCode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Hình thức thu học phí & Thông tin kỳ học */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                  02
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Hình thức thu học phí & Kỳ học
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Chọn 1 trong 2 hình thức: Thu theo số buổi thực tế hoặc Thu cố định trọn gói
                  </p>
                </div>
              </div>

              {/* 2 Big Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Thu theo buổi */}
                <button
                  type="button"
                  onClick={() => handleToggleFeeType('per_session')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    (report.feeType || 'per_session') === 'per_session'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          (report.feeType || 'per_session') === 'per_session'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Thu theo buổi</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {(report.feePerSession || 120000).toLocaleString('vi-VN')} đ / buổi
                        </div>
                      </div>
                    </div>
                    {(report.feeType || 'per_session') === 'per_session' && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Tự động tính theo số buổi học thực tế trong khoảng thời gian chọn.
                  </p>
                </button>

                {/* Option 2: Thu cố định theo kỳ */}
                <button
                  type="button"
                  onClick={() => handleToggleFeeType('fixed_period')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    report.feeType === 'fixed_period'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          report.feeType === 'fixed_period'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Thu cố định kỳ</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {(report.fixedFeeAmount || 1500000).toLocaleString('vi-VN')} đ / kỳ
                        </div>
                      </div>
                    </div>
                    {report.feeType === 'fixed_period' && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Mức học phí cố định trọn gói cả kỳ/tháng, không phụ thuộc số buổi.
                  </p>
                </button>
              </div>

              {/* Dynamic Inputs according to the selected Fee Mode */}
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Time range selection: Từ ngày -> Đến ngày */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Khoảng thời gian kỳ học
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Từ ngày */}
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-0.5 font-medium">Từ ngày</span>
                      <div className="relative flex items-center group">
                        <input
                          ref={startDateInputRef}
                          type="date"
                          value={toInputDate(report.startDate)}
                          onChange={(e) => handleStartDateChange(fromInputDate(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pr-9 outline-hidden focus:border-blue-500 cursor-pointer transition-colors group-hover:border-slate-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            safeOpenPicker(startDateInputRef.current);
                          }}
                          className="absolute right-2.5 text-slate-400 group-hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Đến ngày */}
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-0.5 font-medium">Đến ngày</span>
                      <div className="relative flex items-center group">
                        <input
                          ref={endDateInputRef}
                          type="date"
                          value={toInputDate(report.endDate)}
                          onChange={(e) => handleEndDateChange(fromInputDate(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 pr-9 outline-hidden focus:border-blue-500 cursor-pointer transition-colors group-hover:border-slate-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            safeOpenPicker(endDateInputRef.current);
                          }}
                          className="absolute right-2.5 text-slate-400 group-hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiêu đề kỳ học */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiêu đề kỳ học</label>
                  <input
                    type="text"
                    value={report.customTitle !== undefined ? report.customTitle : `HỌC PHÍ THÁNG ${report.monthYear || '8/2026'}`}
                    onChange={(e) => setReport({ ...report, customTitle: e.target.value })}
                    placeholder="Ví dụ: HỌC PHÍ THÁNG 8/2026 hoặc HỌC PHÍ KỲ 1"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:border-blue-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Nhận xét & Lộ trình học tập */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    03
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Đánh giá học sinh
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Nhận xét và định hướng học tập
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">Hiển thị ở chân phiếu</span>
              </div>

              {/* 1. Nhận xét học tập */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Nhận xét học tập</label>
                  <div className="flex items-center gap-1">
                    {QUICK_TEMPLATES.general.slice(0, 3).map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReport({ ...report, generalComment: tpl })}
                        className="text-[10px] text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded bg-blue-50 cursor-pointer hover:bg-blue-100 font-medium"
                      >
                        Mẫu {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={report.generalComment}
                  onChange={(e) => setReport({ ...report, generalComment: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:border-blue-500 font-sans"
                  placeholder="Nhận xét thái độ, ý thức học tập, mức độ tiếp thu..."
                />
              </div>

              {/* 2. Lộ trình học tập */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Lộ trình học tập</label>
                  <div className="flex items-center gap-1">
                    {QUICK_TEMPLATES.roadmap.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReport({ ...report, roadmapGeneral: tpl })}
                        className="text-[10px] text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded bg-blue-50 cursor-pointer hover:bg-blue-100 font-medium"
                      >
                        Mẫu {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={report.roadmapGeneral || ''}
                  onChange={(e) => setReport({ ...report, roadmapGeneral: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:border-blue-500 font-sans"
                  placeholder="+ Kế hoạch và mục tiêu học tập sắp tới..."
                />
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE REAL-TIME PREVIEW ================= */}
          <div className="lg:col-span-6 p-5 sm:p-6 bg-slate-100/70 flex flex-col justify-between overflow-y-auto max-h-[calc(94vh-130px)]">
            <div className="space-y-3">
              {/* Header above preview */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Phiếu hiển thị trực tiếp - {activeTemplate === 'template1' ? 'Mẫu 1' : 'Mẫu 2'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {report.feeType === 'fixed_period' ? 'Học phí trọn gói theo kỳ' : `Học phí tính theo ${report.sessionCount} buổi học`}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1" />
                  TRỰC TIẾP
                </span>
              </div>

              {/* THE VOUCHER CARD CANVAS (REF FOR PNG/PDF EXPORT) */}
              <div
                ref={printRef}
                id="live-tuition-report-card"
                className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-4 select-text"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
              >
                {/* 1. Voucher Top Bar: Teacher & Hotline */}
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div>
                    {report.teacherName}
                  </div>
                  <div>
                    SĐT. {report.teacherPhone}
                  </div>
                </div>

                {/* 2. Main Title */}
                <div className="text-center pt-1 pb-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {getDynamicTitle()}
                  </h1>
                </div>

                {/* 3. Main Info Section: 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-1">
                  {/* Left Column: Student Details */}
                  <div className="sm:col-span-7 space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      THÔNG TIN HỌC SINH
                    </div>

                    {report.showStudentName && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-500 font-medium min-w-[72px]">Học sinh:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {report.studentName || 'Học sinh'}
                        </span>
                      </div>
                    )}

                    {report.showStudentPhone && report.studentPhone && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-500 font-medium min-w-[72px]">SĐT:</span>
                        <span className="font-semibold text-slate-800">
                          {report.studentPhone}
                        </span>
                      </div>
                    )}

                    {report.showFeePerSession && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-500 font-medium min-w-[72px]">Học phí:</span>
                        <span className="font-semibold text-slate-800">
                          {report.feeType === 'fixed_period'
                            ? `${(report.fixedFeeAmount || 1500000).toLocaleString('vi-VN')} đ/kỳ`
                            : `${(report.feePerSession || 120000).toLocaleString('vi-VN')} đ/buổi`}
                        </span>
                      </div>
                    )}

                    {report.showSessionCount && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-500 font-medium min-w-[72px]">Số buổi:</span>
                        <span className="font-semibold text-slate-800">
                          {report.sessionCount} buổi
                        </span>
                      </div>
                    )}

                    {report.showSessionDates && report.sessionDates && report.sessionDates.length > 0 && (
                      <div className="pt-1">
                        <div className="text-slate-500 font-medium mb-1">Ngày học:</div>
                        <div className="text-slate-700 font-medium leading-relaxed">
                          {report.sessionDates.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Total Fee, QR & Bank Account */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-between text-center space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    {/* Big Total Fee Box */}
                    <div className="w-full text-center">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                        TỔNG HỌC PHÍ
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                        {totalDueAmount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    {/* QR Code */}
                    {report.showQrCode && (
                      <div className="flex flex-col items-center">
                        {(report.qrMode === 'custom_image' || !vietQrUrl) && report.customQrImage ? (
                          <img
                            src={report.customQrImage}
                            alt="Mã QR Chuyển khoản"
                            className="w-28 h-28 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
                          />
                        ) : vietQrUrl ? (
                          <img
                            src={vietQrUrl}
                            alt="VietQR Chuyển khoản"
                            className="w-28 h-28 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-2xs">
                            <QrCode className="w-14 h-14 text-slate-400" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bank Info */}
                    {report.showQrCode && (
                      <div className="text-[10px] text-slate-600 leading-tight space-y-0.5">
                        <div>
                          Ngân hàng: <span className="font-semibold text-slate-800">{report.bankName}</span>
                        </div>
                        <div>
                          Số TK: <span className="font-bold text-slate-900">{report.bankAccount}</span>
                        </div>
                        <div className="uppercase">
                          Chủ TK: <span className="font-semibold text-slate-800">{report.bankAccountName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Bottom Section: Assessment Comments & Learning Roadmap */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  {report.generalComment && (
                    <div className="text-slate-700 leading-relaxed">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        NHẬN XÉT HỌC TẬP
                      </div>
                      <span>{report.generalComment}</span>
                    </div>
                  )}

                  {report.roadmapGeneral && (
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line pt-0.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        LỘ TRÌNH HỌC TẬP
                      </div>
                      <span>{report.roadmapGeneral}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất PDF</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleCopyImage}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy ảnh</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPNG}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất phiếu (ảnh)'}</span>
          </button>
        </div>
      </div>

      {/* ================= QR & BANK CONFIG MODAL ================= */}
      {showQrConfigModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cấu hình Mã QR & Ngân hàng</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tùy chọn tạo VietQR tự động hoặc tải ảnh QR có sẵn lên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveQrConfig} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* HIDDEN FILE INPUT */}
              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrFileUpload}
                className="hidden"
              />

              {/* 1. KHU VỰC TẢI ẢNH QR */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Ảnh mã QR thanh toán</label>
                {customQrImage ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={customQrImage}
                        alt="Ảnh QR đã tải"
                        className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Đã tải ảnh mã QR</p>
                        <p className="text-[11px] text-slate-500 font-medium">Phiếu sẽ ưu tiên hiển thị ảnh QR này</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCustomQrImage}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => qrFileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50/60 hover:bg-blue-50/30 flex items-center justify-center gap-3 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-xs text-slate-800">
                        Tải ảnh mã QR lên (tùy chọn)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Nhấp để chọn ảnh từ máy (PNG, JPG, WebP)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. THÔNG TIN NGÂN HÀNG & TÀI KHOẢN */}
              <div className="pt-2 border-t border-slate-100 space-y-3.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Thông tin ngân hàng thụ hưởng
                </div>

                {/* Ngân hàng */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ngân hàng thụ hưởng</label>
                  <select
                    value={qrBankName}
                    onChange={(e) => setQrBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Số tài khoản */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Số tài khoản (STK)</label>
                  <input
                    type="text"
                    required
                    value={qrBankAccount}
                    onChange={(e) => setQrBankAccount(e.target.value)}
                    placeholder="Ví dụ: 0978783058 hoặc 19033..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Tên chủ tài khoản */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tên chủ tài khoản (In hoa không dấu)</label>
                  <input
                    type="text"
                    required
                    value={qrBankAccountName}
                    onChange={(e) => setQrBankAccountName(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: NGUYEN THANH THUY"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Tiền tố nội dung chuyển khoản */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cú pháp nội dung chuyển khoản</label>
                  <input
                    type="text"
                    value={qrTransferPrefix}
                    onChange={(e) => setQrTransferPrefix(e.target.value)}
                    placeholder="Ví dụ: HP (Học phí)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mẫu trên QR: <span className="font-semibold text-slate-600">{qrTransferPrefix} {report.studentName || 'HS'} T{report.monthYear || '8-2026'}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Lưu cấu hình QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
