import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Clock,
  Calendar,
  Shield,
  Users,
  Lock,
  Eye,
  Camera,
  CheckCircle2,
  Sparkles,
  Shuffle,
  Smartphone,
  AlertTriangle,
  FileText,
  MessageSquare,
  Send,
  Radio,
  LayoutList,
  Download,
  Settings
} from 'lucide-react';
import { Exam, ExamSettings, ClassRoom } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';

interface AssignExamModalProps {
  isOpen: boolean;
  exam: Exam;
  initialClassId?: string; // Pre-select a class if opened from class view
  onClose: () => void;
  onSuccess?: (updatedExam: Exam) => void;
  onOpenLiveMonitor?: (exam: Exam) => void;
}

type TabType = 'target' | 'time' | 'security' | 'review' | 'format';

export const AssignExamModal: React.FC<AssignExamModalProps> = ({
  isOpen,
  exam,
  initialClassId,
  onClose,
  onSuccess,
  onOpenLiveMonitor
}) => {
  const { success, warning } = useToast();
  const { themeConfig } = useTheme();
  const classes: ClassRoom[] = store.getClasses();

  // State: Tab & Mode
  const [activeTab, setActiveTab] = useState<TabType>('target');
  const [assignmentType, setAssignmentType] = useState<'exam' | 'homework'>(
    exam.settings?.assignmentType || (exam.durationMinutes > 0 && exam.durationMinutes <= 60 ? 'exam' : 'homework')
  );
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Tab 1: Classes & Target Access
  const [accessType, setAccessType] = useState<'assigned_classes' | 'all' | 'registered'>(
    exam.settings?.accessType || 'assigned_classes'
  );
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(
    initialClassId
      ? Array.from(new Set([...(exam.assignedClassIds || []), initialClassId]))
      : exam.assignedClassIds || []
  );
  const [requirePassword, setRequirePassword] = useState<boolean>(
    exam.settings?.requirePassword || false
  );
  const [password, setPassword] = useState<string>(exam.settings?.password || '');
  const [requireInfo, setRequireInfo] = useState({
    fullName: exam.settings?.requireStudentInfo?.fullName ?? true,
    classRoom: exam.settings?.requireStudentInfo?.classRoom ?? true,
    studentCode: exam.settings?.requireStudentInfo?.studentCode ?? true,
    phone: exam.settings?.requireStudentInfo?.phone ?? false
  });

  // Tab 2: Time & Deadlines
  const [isUnlimitedTime, setIsUnlimitedTime] = useState<boolean>(
    exam.settings?.isUnlimitedTime || assignmentType === 'homework'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(exam.durationMinutes || 45);
  const [openTime, setOpenTime] = useState<string>(
    exam.openTime || exam.settings?.openTime || ''
  );
  const [closeTime, setCloseTime] = useState<string>(
    exam.closeTime || exam.settings?.closeTime || ''
  );
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(
    exam.settings?.allowLateSubmission ?? true
  );
  const [minTimePercentBeforeSubmit, setMinTimePercentBeforeSubmit] = useState<number>(
    exam.settings?.minTimePercentBeforeSubmit ?? 0
  );

  // Tab 3: Anti-Cheat & Security
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(
    exam.settings?.shuffleQuestions ?? true
  );
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(
    exam.settings?.shuffleOptions ?? true
  );
  const [trackTabSwitches, setTrackTabSwitches] = useState<boolean>(
    exam.settings?.trackTabSwitches ?? true
  );
  const [strictFullScreen, setStrictFullScreen] = useState<boolean>(
    exam.settings?.strictFullScreen ?? false
  );
  const [preventCopyPaste, setPreventCopyPaste] = useState<boolean>(
    exam.settings?.preventCopyPaste ?? true
  );
  const [autoSubmitOnTimeUp, setAutoSubmitOnTimeUp] = useState<boolean>(
    exam.settings?.autoSubmitOnTimeUp ?? true
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(
    exam.settings?.maxAttempts ?? (assignmentType === 'exam' ? 1 : 3)
  );

  // Tab 4: Score & Answer Visibility
  const [scoreViewPolicy, setScoreViewPolicy] = useState<'after_submit' | 'after_closed' | 'never'>(
    exam.settings?.scoreViewPolicy || (exam.settings?.showScoreImmediately ? 'after_submit' : 'after_closed')
  );
  const [answerViewPolicy, setAnswerViewPolicy] = useState<'after_submit' | 'after_closed' | 'when_passed' | 'never'>(
    exam.settings?.answerViewPolicy || (exam.settings?.showAnswersImmediately ? 'after_submit' : 'after_closed')
  );
  const [minScoreToViewAnswer, setMinScoreToViewAnswer] = useState<number>(
    exam.settings?.minScoreToViewAnswer ?? 5
  );

  // Tab 5: Submission & Format
  const [allowFileUploadEssay, setAllowFileUploadEssay] = useState<boolean>(
    exam.settings?.allowFileUploadEssay ?? true
  );
  const [showOneByOne, setShowOneByOne] = useState<boolean>(
    exam.settings?.showOneByOne ?? false
  );

  if (!isOpen) return null;

  const examUrl = `${window.location.origin}/exam/${exam.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    examUrl
  )}&margin=8`;

  // Quick Preset Handlers
  const handleSelectPreset = (type: 'exam' | 'homework') => {
    setAssignmentType(type);
    if (type === 'exam') {
      setIsUnlimitedTime(false);
      if (durationMinutes === 0) setDurationMinutes(45);
      setMaxAttempts(1);
      setTrackTabSwitches(true);
      setPreventCopyPaste(true);
      setScoreViewPolicy('after_submit');
      setAnswerViewPolicy('after_closed');
    } else {
      setIsUnlimitedTime(true);
      setMaxAttempts(99);
      setTrackTabSwitches(false);
      setPreventCopyPaste(false);
      setScoreViewPolicy('after_submit');
      setAnswerViewPolicy('after_submit');
      setAllowFileUploadEssay(true);
    }
  };

  const handleSetOpenNow = () => {
    const now = new Date();
    // Local ISO string YYYY-MM-DDTHH:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setOpenTime(localISOTime);
  };

  const handleSetCloseOffset = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    target.setHours(23, 59, 0, 0);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setCloseTime(localISOTime);
  };

  const handleToggleClass = (classId: string) => {
    if (assignedClassIds.includes(classId)) {
      setAssignedClassIds(assignedClassIds.filter((id) => id !== classId));
    } else {
      setAssignedClassIds([...assignedClassIds, classId]);
    }
  };

  const handleSelectAllClasses = () => {
    if (assignedClassIds.length === classes.length) {
      setAssignedClassIds([]);
    } else {
      setAssignedClassIds(classes.map((c) => c.id));
    }
  };

  // Submit and Save
  const handleSaveAndPublish = () => {
    if (accessType === 'assigned_classes' && assignedClassIds.length === 0) {
      warning('Chưa chọn lớp học', 'Vui lòng chọn ít nhất một lớp học để giao đề, hoặc chọn chế độ "Tất cả mọi người".');
      setActiveTab('target');
      return;
    }

    if (requirePassword && !password.trim()) {
      warning('Thiếu mật khẩu', 'Vui lòng nhập mật khẩu vào thi hoặc tắt tùy chọn yêu cầu mật khẩu.');
      setActiveTab('target');
      return;
    }

    const updatedSettings: ExamSettings = {
      ...exam.settings,
      assignmentType,
      shuffleQuestions,
      shuffleOptions,
      showOneByOne,
      allowBacktrack: true,
      autoSubmitOnTimeUp,
      allowAnonymous: accessType === 'all',
      requirePassword,
      password: requirePassword ? password.trim() : undefined,
      showScoreImmediately: scoreViewPolicy === 'after_submit',
      showAnswersImmediately: answerViewPolicy === 'after_submit',
      showExplanationAfterClose: answerViewPolicy === 'after_closed',
      trackTabSwitches,
      maxAttempts: isUnlimitedTime && maxAttempts === 1 ? 99 : maxAttempts,

      // Advanced Azota settings
      isUnlimitedTime,
      openTime: openTime || undefined,
      closeTime: closeTime || undefined,
      allowLateSubmission,
      minTimePercentBeforeSubmit,
      accessType,
      requireStudentInfo: requireInfo,
      scoreViewPolicy,
      answerViewPolicy,
      minScoreToViewAnswer: answerViewPolicy === 'when_passed' ? minScoreToViewAnswer : undefined,
      enableProctoring: trackTabSwitches || strictFullScreen,
      strictFullScreen,
      preventCopyPaste,
      maxTabSwitchesAllowed: trackTabSwitches ? 3 : undefined,
      allowFileUploadEssay
    };

    const targetId = exam.id || `exam-${Date.now()}`;
    const updated = store.updateExam(targetId, {
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      questions: exam.questions || [],
      durationMinutes: isUnlimitedTime ? 0 : durationMinutes,
      openTime: openTime || undefined,
      closeTime: closeTime || undefined,
      assignedClassIds,
      isPublic: accessType === 'all',
      status: 'published',
      settings: updatedSettings
    });

    const resultExam = updated || {
      ...exam,
      id: targetId,
      status: 'published',
      settings: updatedSettings
    };

    success('Giao đề thành công', `Đã cấu hình và giao đề "${resultExam.title}" trực tuyến.`);
    if (onSuccess) {
      onSuccess(resultExam);
    } else {
      setIsPublishedSuccess(true);
    }
  };

    const rawCode = (exam as any).accessCode || exam.id.replace(/\D/g, '');
    const accessCode = rawCode.length >= 6 ? rawCode.slice(-6) : (rawCode.padStart(6, '0') || '698358');

    // Copy helpers
    const handleCopyLink = () => {
      navigator.clipboard.writeText(examUrl);
      setCopiedLink(true);
      success('Đã sao chép liên kết', 'Link làm bài đã được copy vào bộ nhớ tạm.');
      setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyCode = () => {
      navigator.clipboard.writeText(accessCode);
      setCopiedCode(true);
      success('Đã sao chép mã', `Mã tham gia ${accessCode} đã được sao chép.`);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleDownloadQR = () => {
      const link = document.createElement('a');
      link.href = qrApiUrl;
      link.download = `QR-${exam.title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Tải mã QR', 'Đang tải mã QR của đề thi về máy.');
    };

    const durationText = durationMinutes > 0 && !isUnlimitedTime
      ? `${durationMinutes} phút`
      : 'Không giới hạn';

    return (
      <div
        id="assign-exam-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans"
      >
        <div
          id="assign-exam-modal-card"
          className={`w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 ${
            isPublishedSuccess ? 'max-w-md' : 'max-w-4xl max-h-[92vh]'
          }`}
        >
          {/* MODAL HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isPublishedSuccess ? 'bg-blue-100 text-blue-700' : 'text-white'
                }`}
                style={!isPublishedSuccess ? { backgroundColor: themeConfig.colors.primary } : undefined}
              >
                {isPublishedSuccess ? <Share2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {isPublishedSuccess ? `Chia sẻ đề thi: ${exam.title}` : 'Cài đặt đề & Giao bài trực tuyến'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {isPublishedSuccess
                    ? `Thời gian: ${durationText} • Thang điểm: ${exam.maxScore || 10}`
                    : `${exam.title} • ${exam.questions?.length || 0} câu hỏi`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONTENT AREA: SUCCESS STATE vs CONFIGURATION TABS */}
          {isPublishedSuccess ? (
            /* SIMPLIFIED SUCCESS SHARE SCREEN */
            <>
              <div className="p-6 text-center">
                {/* Centered QR */}
                <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
                  <img
                    src={qrApiUrl}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto rounded-lg object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Join Code */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MÃ THAM GIA:</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-800 font-mono font-bold rounded-lg border border-blue-200 tracking-wider">
                    {accessCode}
                  </span>
                  <button
                    id="btn-copy-join-code"
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Direct link box */}
                <div className="mt-5 text-left">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Đường dẫn trực tiếp:</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      id="input-share-url"
                      type="text"
                      readOnly
                      value={examUrl}
                      className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-hidden select-all"
                    />
                    <button
                      id="btn-copy-share-url"
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <a
                    id="link-open-student-preview"
                    href={examUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở thử</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải ảnh QR</span>
                  </button>

                  <button
                    id="btn-reconfigure-settings"
                    type="button"
                    onClick={() => setIsPublishedSuccess(false)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Cài đặt bài làm</span>
                  </button>
                </div>

                <button
                  id="btn-done-qr-modal"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </>
          ) : (
          /* CONFIGURATION WORKFLOW */
          <>
            {/* PRESET CHANGER: ĐỀ THI vs BÀI TẬP VỀ NHÀ */}
            <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Mục đích giao bài:</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('exam')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    assignmentType === 'exam'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Đề thi / Kiểm tra</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('homework')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    assignmentType === 'homework'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bài tập về nhà / Ôn luyện</span>
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="px-2 sm:px-6 border-b border-slate-200 bg-white shrink-0 grid grid-cols-5 gap-1">
              {[
                {
                  id: 'target',
                  label: 'Lớp & Phân quyền',
                  shortLabel: 'Phân quyền',
                  icon: Users
                },
                {
                  id: 'time',
                  label: 'Thời gian & Hạn nộp',
                  shortLabel: 'Thời gian',
                  icon: Clock
                },
                {
                  id: 'security',
                  label: 'Chống gian lận',
                  shortLabel: 'Gian lận',
                  icon: Shield
                },
                {
                  id: 'review',
                  label: 'Xem điểm & Lời giải',
                  shortLabel: 'Xem điểm',
                  icon: Eye
                },
                {
                  id: 'format',
                  label: 'Bố cục làm bài',
                  shortLabel: 'Bố cục',
                  icon: LayoutList
                }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-3 px-1 sm:px-2 font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer text-center ${
                      isActive
                        ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate hidden md:inline">{tab.label}</span>
                    <span className="truncate md:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* TAB 1: TARGET & CLASSES */}
              {activeTab === 'target' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-900 block mb-2 text-sm">
                      Ai được phép làm bài này?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'assigned_classes',
                          title: 'Chỉ lớp được chọn',
                          desc: 'Chỉ học sinh trong danh sách lớp được giao mới vào được.'
                        },
                        {
                          id: 'all',
                          title: 'Tất cả mọi người',
                          desc: 'Bất kỳ ai có link/mã đều có thể tự điền thông tin để làm bài.'
                        },
                        {
                          id: 'registered',
                          title: 'Học sinh đăng ký',
                          desc: 'Học sinh cần có tài khoản trong hệ thống trường/lớp.'
                        }
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                            accessType === item.id
                              ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="accessType"
                              value={item.id}
                              checked={accessType === item.id}
                              onChange={() => setAccessType(item.id as any)}
                              className="mt-0.5 text-blue-600"
                            />
                            <div>
                              <span className="font-bold text-xs block">{item.title}</span>
                              <span className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5 block">
                                {item.desc}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Class Selection Box (System Logic Kept) */}
                  {accessType === 'assigned_classes' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Chọn lớp học giao bài:</span>
                          <span className="text-slate-400 font-normal">
                            ({assignedClassIds.length}/{classes.length} lớp đã chọn)
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={handleSelectAllClasses}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {assignedClassIds.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {classes.map((cls) => {
                          const isChecked = assignedClassIds.includes(cls.id);
                          return (
                            <label
                              key={cls.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-white border-blue-500 shadow-2xs font-bold text-slate-900'
                                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleClass(cls.id)}
                                  className="rounded-sm text-blue-600"
                                />
                                <span className="truncate">{cls.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                {cls.subject}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Password Protection */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="font-bold text-slate-800 block">Yêu cầu mật khẩu vào thi</span>
                          <span className="text-slate-500 text-[11px]">Học sinh phải nhập đúng mã mật khẩu mới được vào làm bài.</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={requirePassword}
                        onChange={(e) => setRequirePassword(e.target.checked)}
                        className="w-4 h-4 rounded-sm text-blue-600"
                      />
                    </label>

                    {requirePassword && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                        <span className="text-slate-600 font-semibold shrink-0">Mật khẩu làm bài:</span>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ví dụ: TOAN9A1 hoặc 123456"
                          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden w-full max-w-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Verification Info from Student */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-slate-800 block">Thông tin bắt buộc học sinh điền trước khi vào bài:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <input
                          type="checkbox"
                          checked={requireInfo.fullName}
                          disabled
                          className="rounded-sm text-blue-600 opacity-60"
                        />
                        <span className="font-medium">Họ và tên (bắt buộc)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requireInfo.classRoom}
                          onChange={(e) => setRequireInfo({ ...requireInfo, classRoom: e.target.checked })}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium">Lớp học</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requireInfo.phone}
                          onChange={(e) => setRequireInfo({ ...requireInfo, phone: e.target.checked })}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium">Số điện thoại</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIME & DEADLINES */}
              {activeTab === 'time' && (
                <div className="space-y-4">
                  {/* Duration Mode */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-sm">Thời gian làm bài:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          !isUnlimitedTime
                            ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 text-blue-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="timeLimitMode"
                          checked={!isUnlimitedTime}
                          onChange={() => setIsUnlimitedTime(false)}
                          className="text-blue-600"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span>Giới hạn thời gian (phút):</span>
                          <input
                            type="number"
                            min={1}
                            max={360}
                            value={durationMinutes}
                            disabled={isUnlimitedTime}
                            onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900 outline-hidden"
                          />
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          isUnlimitedTime
                            ? 'bg-amber-50/60 border-amber-600 ring-1 ring-amber-600 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="timeLimitMode"
                          checked={isUnlimitedTime}
                          onChange={() => setIsUnlimitedTime(true)}
                          className="text-amber-600"
                        />
                        <div>
                          <span>Không giới hạn thời gian làm bài</span>
                          <span className="block text-[11px] font-normal text-slate-500">
                            Thích hợp cho bài tập về nhà, tự ôn luyện không áp lực giờ.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Open & Close Timetable */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <label className="font-bold text-slate-900 block text-sm">Thời hạn mở & đóng đề thi:</label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Open Time */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Thời gian bắt đầu (Mở đề):</span>
                          <button
                            type="button"
                            onClick={handleSetOpenNow}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Mở ngay
                          </button>
                        </div>
                        <input
                          type="datetime-local"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          Để trống nếu muốn học sinh có thể làm bất cứ lúc nào.
                        </span>
                      </div>

                      {/* Close Time */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Thời gian kết thúc (Hạn nộp):</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-semibold">
                            <button
                              type="button"
                              onClick={() => handleSetCloseOffset(1)}
                              className="hover:underline cursor-pointer"
                            >
                              +24h
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleSetCloseOffset(3)}
                              className="hover:underline cursor-pointer"
                            >
                              +3 ngày
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleSetCloseOffset(7)}
                              className="hover:underline cursor-pointer"
                            >
                              +1 tuần
                            </button>
                          </div>
                        </div>
                        <input
                          type="datetime-local"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          Học sinh không thể nộp bài sau mốc thời gian này (trừ khi cho phép nộp muộn).
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowLateSubmission}
                          onChange={(e) => setAllowLateSubmission(e.target.checked)}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium text-slate-800">
                          Cho phép nộp muộn sau thời hạn (Hệ thống sẽ gắn cờ "Nộp muộn")
                        </span>
                      </label>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-600 font-medium">Làm tối thiểu:</span>
                        <select
                          value={minTimePercentBeforeSubmit}
                          onChange={(e) => setMinTimePercentBeforeSubmit(Number(e.target.value))}
                          className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        >
                          <option value={0}>Không yêu cầu</option>
                          <option value={30}>Tối thiểu 30% thời gian</option>
                          <option value={50}>Tối thiểu 50% thời gian</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANTI-CHEAT & PROCTORING */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-sm">Chống gian lận & Giám sát phòng thi:</label>

                    <div className="space-y-2.5">
                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={trackTabSwitches}
                          onChange={(e) => setTrackTabSwitches(e.target.checked)}
                          className="mt-0.5 rounded-sm text-blue-600"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">
                            Giám sát chuyển tab / Thoát ứng dụng
                          </span>
                          <span className="text-slate-500 text-[11px] leading-relaxed block">
                            Hệ thống cảnh báo và đếm số lần học sinh rời màn hình làm bài, lưu lịch sử để giáo viên kiểm tra gian lận.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={strictFullScreen}
                          onChange={(e) => setStrictFullScreen(e.target.checked)}
                          className="mt-0.5 rounded-sm text-blue-600"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">
                            Bắt buộc chế độ toàn màn hình khi làm bài
                          </span>
                          <span className="text-slate-500 text-[11px] leading-relaxed block">
                            Tự động phóng to toàn màn hình, học sinh không thể mở song song cửa sổ khác.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={preventCopyPaste}
                          onChange={(e) => setPreventCopyPaste(e.target.checked)}
                          className="mt-0.5 rounded-sm text-blue-600"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">
                            Chặn sao chép, bôi đen và chuột phải
                          </span>
                          <span className="text-slate-500 text-[11px] leading-relaxed block">
                            Ngăn chặn học sinh copy câu hỏi tra cứu trên Google hoặc gửi đáp án ra ngoài.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Shuffle & Attempts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                      <span className="font-bold text-slate-900 block text-sm">Xáo trộn nội dung (Đảo đề):</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium text-slate-800">Xáo trộn thứ tự các câu hỏi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shuffleOptions}
                          onChange={(e) => setShuffleOptions(e.target.checked)}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium text-slate-800">Xáo trộn thứ tự các đáp án A, B, C, D</span>
                      </label>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                      <span className="font-bold text-slate-900 block text-sm">Số lần làm bài tối đa:</span>
                      <select
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value={1}>1 lần duy nhất (Thi chính thức)</option>
                        <option value={2}>2 lần</option>
                        <option value={3}>3 lần</option>
                        <option value={99}>Không giới hạn (Luyện tập)</option>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={autoSubmitOnTimeUp}
                          onChange={(e) => setAutoSubmitOnTimeUp(e.target.checked)}
                          className="rounded-sm text-blue-600"
                        />
                        <span className="font-medium text-slate-700">Tự động nộp bài khi hết giờ</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCORE & KEY REVIEW */}
              {activeTab === 'review' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-sm">
                      Khi nào cho học sinh xem điểm số?
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'after_submit', label: 'Ngay sau khi nộp bài xong', desc: 'Học sinh biết ngay điểm trắc nghiệm sau khi bấm nộp bài.' },
                        { id: 'after_closed', label: 'Khi tất cả học sinh thi xong / Sau khi đóng đề', desc: 'Tránh việc học sinh thi trước tiết lộ kết quả cho học sinh thi sau.' },
                        { id: 'never', label: 'Không cho xem điểm', desc: 'Chỉ giáo viên mới xem được điểm trong trang quản lý.' }
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            scoreViewPolicy === opt.id
                              ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="scoreViewPolicy"
                            checked={scoreViewPolicy === opt.id}
                            onChange={() => setScoreViewPolicy(opt.id as any)}
                            className="mt-0.5 text-blue-600"
                          />
                          <div>
                            <span className="font-bold text-xs block">{opt.label}</span>
                            <span className="text-[11px] text-slate-500 font-normal">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-sm">
                      Khi nào cho xem đáp án & lời giải chi tiết?
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'after_submit', label: 'Ngay sau khi nộp bài', desc: 'Xem lại toàn bộ đáp án đúng và lời giải chi tiết của từng câu.' },
                        { id: 'after_closed', label: 'Khi tất cả học sinh thi xong / Sau khi đóng đề', desc: 'Khuyên dùng cho kỳ thi chính thức để bảo mật tuyệt đối đề thi.' },
                        { id: 'when_passed', label: 'Chỉ khi đạt điểm sàn', desc: 'Chỉ cho học sinh xem lời giải nếu đạt từ điểm quy định trở lên.' },
                        { id: 'never', label: 'Không bao giờ cho xem đáp án', desc: 'Bảo mật hoàn toàn bộ câu hỏi và đáp án.' }
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            answerViewPolicy === opt.id
                              ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="answerViewPolicy"
                            checked={answerViewPolicy === opt.id}
                            onChange={() => setAnswerViewPolicy(opt.id as any)}
                            className="mt-0.5 text-blue-600"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-xs block">{opt.label}</span>
                            <span className="text-[11px] text-slate-500 font-normal">{opt.desc}</span>

                            {opt.id === 'when_passed' && answerViewPolicy === 'when_passed' && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-slate-600 font-semibold">Điểm sàn tối thiểu:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={minScoreToViewAnswer}
                                  onChange={(e) => setMinScoreToViewAnswer(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                                />
                                <span>/ 10 điểm</span>
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FORMAT & ESSAY UPLOAD */}
              {activeTab === 'format' && (
                <div className="space-y-4">
                  {/* Trắc nghiệm khách quan 100% note */}
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-950 text-sm">
                        Đề thi 100% trắc nghiệm khách quan
                      </span>
                    </div>
                    <p className="text-emerald-800/80 text-xs leading-relaxed pl-6">
                      Hệ thống tự động chấm điểm, tính phổ điểm và lưu kết quả ngay lập tức khi học sinh nộp bài. Không cần chấm tay tự luận.
                    </p>
                  </div>

                  {/* Question Layout Mode */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-sm">Chế độ hiển thị câu hỏi:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          !showOneByOne
                            ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="layoutMode"
                          checked={!showOneByOne}
                          onChange={() => setShowOneByOne(false)}
                          className="text-blue-600"
                        />
                        <div>
                          <span>Toàn bộ câu hỏi trên một trang (Cuộn)</span>
                          <span className="block text-[11px] font-normal text-slate-500">
                            Học sinh dễ dàng lướt xem toàn bộ đề thi giống như trên giấy.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          showOneByOne
                            ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="layoutMode"
                          checked={showOneByOne}
                          onChange={() => setShowOneByOne(true)}
                          className="text-blue-600"
                        />
                        <div>
                          <span>Từng câu một (One-by-one)</span>
                          <span className="block text-[11px] font-normal text-slate-500">
                            Tập trung làm từng câu, có nút Câu trước / Câu tiếp theo.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="text-slate-500 text-xs flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Cấu hình tự động lưu và áp dụng tức thì</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  id="btn-confirm-assign-exam"
                  onClick={handleSaveAndPublish}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu cấu hình & Giao đề ngay</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
