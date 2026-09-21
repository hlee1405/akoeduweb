import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Upload,
  FileText,
  Image,
  Users,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Database,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Camera,
  CheckSquare,
  Edit3,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { store } from '../../../services/store';
import { Exam, ClassRoom, Question } from '../../../types';
import { useToast } from '../../../context/ToastContext';

export interface ComposedHomeworkItem {
  id: string;
  type: 'single_choice' | 'essay';
  content: string;
  options: { id: string; content: string }[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

const DEFAULT_COMPOSED_HOMEWORK: ComposedHomeworkItem[] = [
  {
    id: 'hw-composed-1',
    type: 'single_choice',
    content: 'Căn bậc hai số học của số 81 là:',
    options: [
      { id: 'A', content: '9' },
      { id: 'B', content: '-9' },
      { id: 'C', content: '±9' },
      { id: 'D', content: '81' }
    ],
    correctAnswer: 'A',
    explanation: 'Căn bậc hai số học của a ≥ 0 là số không âm x sao cho x² = a. Do đó √81 = 9.',
    points: 3
  },
  {
    id: 'hw-composed-2',
    type: 'single_choice',
    content: 'Cho tam giác ABC vuông tại A có AB = 6cm, AC = 8cm. Độ dài cạnh huyền BC bằng:',
    options: [
      { id: 'A', content: '10 cm' },
      { id: 'B', content: '14 cm' },
      { id: 'C', content: '12 cm' },
      { id: 'D', content: '7 cm' }
    ],
    correctAnswer: 'A',
    explanation: 'Theo định lý Pythagore: BC² = AB² + AC² = 6² + 8² = 100 => BC = 10 cm.',
    points: 3
  },
  {
    id: 'hw-composed-3',
    type: 'essay',
    content: 'Bài toán tự luận: Giải bài toán sau vào vở bài tập, trình bày chi tiết các bước và chụp ảnh bài làm tải lên hệ thống:\nMột chiếc thang dài 4m tựa vào tường tạo với mặt đất một góc 65°. Tính chiều cao của thang đạt được trên tường (làm tròn đến chữ số thập phân thứ nhất).',
    options: [
      { id: 'A', content: '' },
      { id: 'B', content: '' },
      { id: 'C', content: '' },
      { id: 'D', content: '' }
    ],
    correctAnswer: '',
    explanation: 'Gọi chiều cao là h. Ta có: h = 4 . sin(65°) ≈ 4 . 0.9063 ≈ 3.6m.',
    points: 4
  }
];

interface CreateHomeworkModalProps {
  isOpen: boolean;
  initialClassId?: string;
  initialMode?: 'upload' | 'manual' | 'bank';
  onClose: () => void;
  onSuccess?: (createdHomework: Exam) => void;
}

export const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
  isOpen,
  initialClassId,
  initialMode,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { success, warning } = useToast();
  const classes: ClassRoom[] = store.getClasses();
  const bankQuestions: Question[] = store.getQuestions();

  // Wizard Step: 1 = Nội dung đề bài, 2 = Cài đặt giao bài, 3 = Thành công & Giao bài
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Content & Mode
  const [contentMode, setContentMode] = useState<'upload' | 'manual' | 'bank'>(initialMode || 'upload');
  const [manualSubMode, setManualSubMode] = useState<'composer' | 'text'>('composer');
  const [composedItems, setComposedItems] = useState<ComposedHomeworkItem[]>(DEFAULT_COMPOSED_HOMEWORK);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Khối 9');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    initialClassId ? [initialClassId] : classes[0] ? [classes[0].id] : []
  );

  useEffect(() => {
    if (initialMode) {
      setContentMode(initialMode);
    }
  }, [initialMode, isOpen]);

  // File Attachments
  const [attachedFiles, setAttachedFiles] = useState<string[]>([
    'Phieu_bai_tap_ren_luyen_chuyen_de_01.pdf'
  ]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Manual questions / Bank questions state
  const [manualQuestionText, setManualQuestionText] = useState(
    '1. Rút gọn biểu thức chứa căn thức bậc hai.\n2. Giải phương trình vô tỉ cơ bản.\n3. Bài toán thực tế ứng dụng hệ thức lượng.'
  );
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);

  // Azota Assignment Deadline & Submissions
  const defaultCloseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [closeTime, setCloseTime] = useState(defaultCloseDate());
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [allowFileUploadEssay, setAllowFileUploadEssay] = useState(true);
  const [allowTextInput, setAllowTextInput] = useState(true);
  const [showScorePolicy, setShowScorePolicy] = useState<'immediate' | 'after_graded'>('immediate');
  const [showAnswerAfterClose, setShowAnswerAfterClose] = useState(true);
  const [requireNameSelection, setRequireNameSelection] = useState(true);

  // Submission result state
  const [createdExam, setCreatedExam] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);

  if (!isOpen) return null;

  const toggleClass = (id: string) => {
    if (selectedClassIds.includes(id)) {
      setSelectedClassIds(selectedClassIds.filter((cid) => cid !== id));
    } else {
      setSelectedClassIds([...selectedClassIds, id]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  const setDeadlineOffsetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setCloseTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const setDeadlineToThisWeekend = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7; // days until Sunday
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setCloseTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      if (!attachedFiles.includes(file.name)) {
        setAttachedFiles([...attachedFiles, file.name]);
      }
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      success('Đã tải lên tệp bài tập', file.name);
    }
  };

  // Helper handlers for self-authoring composed questions
  const handleAddComposedQuestion = (type: 'single_choice' | 'essay' = 'single_choice') => {
    const newItem: ComposedHomeworkItem = {
      id: `hw-item-${Date.now()}`,
      type,
      content: '',
      options: [
        { id: 'A', content: '' },
        { id: 'B', content: '' },
        { id: 'C', content: '' },
        { id: 'D', content: '' }
      ],
      correctAnswer: 'A',
      explanation: '',
      points: 2.5
    };
    setComposedItems([...composedItems, newItem]);
  };

  const handleUpdateComposedItem = (id: string, updates: Partial<ComposedHomeworkItem>) => {
    setComposedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleUpdateComposedOption = (itemId: string, optionId: string, text: string) => {
    setComposedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newOpts = item.options.map((opt) =>
          opt.id === optionId ? { ...opt, content: text } : opt
        );
        return { ...item, options: newOpts };
      })
    );
  };

  const handleRemoveComposedItem = (id: string) => {
    if (composedItems.length <= 1) {
      warning('Không thể xóa', 'Bài tập cần có ít nhất 1 câu hỏi.');
      return;
    }
    setComposedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateComposedItem = (id: string) => {
    const target = composedItems.find((item) => item.id === id);
    if (!target) return;
    const duplicate: ComposedHomeworkItem = {
      ...target,
      id: `hw-item-${Date.now()}`,
      content: target.content ? `${target.content} (Bản sao)` : ''
    };
    setComposedItems([...composedItems, duplicate]);
  };

  const handleAutoBalancePoints = () => {
    if (composedItems.length === 0) return;
    const pts = parseFloat((10 / composedItems.length).toFixed(2));
    setComposedItems((prev) =>
      prev.map((item) => ({ ...item, points: pts }))
    );
    success('Đã chia đều 10 điểm', `Mỗi câu ${pts} điểm.`);
  };

  const handleResetSampleQuestions = () => {
    setComposedItems(DEFAULT_COMPOSED_HOMEWORK);
    success('Đã nạp câu hỏi mẫu', 'Đã tải 3 câu bài tập mẫu (2 trắc nghiệm + 1 tự luận).');
  };

  const handleNextToSettings = () => {
    if (!title.trim()) {
      warning('Thiếu tên bài tập', 'Vui lòng nhập tiêu đề bài tập về nhà.');
      return;
    }
    setCurrentStep(2);
  };

  const handleFinalCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      warning('Thiếu tên bài tập', 'Vui lòng nhập tiêu đề bài tập về nhà.');
      return;
    }

    if (selectedClassIds.length === 0) {
      warning('Chưa chọn lớp', 'Vui lòng chọn ít nhất một lớp nhận bài tập.');
      return;
    }

    // Build question payload
    let homeworkQuestions: any[] = [];

    if (contentMode === 'bank' && selectedBankQuestionIds.length > 0) {
      const selected = bankQuestions.filter((q) => selectedBankQuestionIds.includes(q.id));
      homeworkQuestions = selected.map((q, idx) => ({
        questionId: q.id,
        points: Number((10 / selected.length).toFixed(2)),
        order: idx + 1,
        question: q
      }));
    } else if (contentMode === 'manual') {
      if (manualSubMode === 'composer' && composedItems.length > 0) {
        homeworkQuestions = composedItems.map((item, idx) => {
          const isChoice = item.type === 'single_choice';
          const qId = `q-hw-${Date.now()}-${idx + 1}`;
          const qObj: Question = {
            id: qId,
            type: item.type,
            content: item.content.trim() || `Bài tập số ${idx + 1}`,
            options: isChoice
              ? item.options.map((opt) => ({
                  id: opt.id,
                  content: opt.content.trim() || `Phương án ${opt.id}`
                }))
              : undefined,
            correctAnswers: isChoice && item.correctAnswer ? [item.correctAnswer] : [],
            explanation:
              item.explanation.trim() ||
              (isChoice
                ? `Đáp án đúng là ${item.correctAnswer}`
                : 'Giáo viên xem bài giải học sinh nộp ảnh và chấm điểm.'),
            topic: 'Bài tập về nhà',
            difficulty: 'medium',
            cognitiveLevel: 'apply',
            tags: ['Bài tập', 'Tự soạn'],
            status: 'published',
            grade,
            subject,
            createdAt: new Date().toISOString()
          };
          return {
            questionId: qId,
            points: Number(item.points) || 1,
            order: idx + 1,
            question: qObj
          };
        });
      } else {
        const essayContent =
          manualQuestionText.trim() ||
          `${title.trim()}:\n${
            description.trim() ||
            'Học sinh giải chi tiết ra giấy/vở rồi dùng điện thoại chụp ảnh rõ nét tải lên hệ thống trước hạn.'
          }`;

        homeworkQuestions = [
          {
            questionId: `q-hw-${Date.now()}`,
            points: 10,
            order: 1,
            question: {
              id: `q-hw-${Date.now()}`,
              type: 'essay',
              content: essayContent,
              correctAnswers: [],
              explanation: 'Giáo viên sẽ xem bài làm học sinh và chấm trực tiếp bằng bút chấm điểm.',
              topic: 'Bài tập về nhà',
              difficulty: 'medium',
              cognitiveLevel: 'apply',
              tags: ['Bài tập'],
              status: 'published',
              grade,
              subject,
              createdAt: new Date().toISOString()
            }
          }
        ];
      }
    } else {
      // Default / Upload question item
      const essayContent = `${title.trim()}:\n${
        description.trim() ||
        'Xem nội dung bài tập trong tài liệu đính kèm bên dưới. Học sinh giải chi tiết ra giấy/vở rồi dùng điện thoại chụp ảnh rõ nét tải lên hệ thống trước hạn.'
      }`;

      homeworkQuestions = [
        {
          questionId: `q-hw-${Date.now()}`,
          points: 10,
          order: 1,
          question: {
            id: `q-hw-${Date.now()}`,
            type: 'essay',
            content: essayContent,
            correctAnswers: [],
            explanation: 'Giáo viên sẽ xem bài làm học sinh và chấm trực tiếp bằng bút chấm điểm.',
            topic: 'Bài tập về nhà',
            difficulty: 'medium',
            cognitiveLevel: 'apply',
            tags: ['Bài tập'],
            status: 'published',
            grade,
            subject,
            createdAt: new Date().toISOString()
          }
        }
      ];
    }

    // Create homework in store
    const newHomework = store.addExam({
      title: title.trim(),
      description:
        description.trim() ||
        'Bài tập rèn luyện về nhà. Học sinh làm vào vở và chụp ảnh bài làm nộp trước hạn.',
      subject,
      grade,
      durationMinutes: 0, // 0 = Không giới hạn giờ làm (Bài tập về nhà)
      maxScore: 10,
      passingScore: 5,
      status: 'published',
      assignedClassIds: selectedClassIds,
      closeTime: closeTime ? new Date(closeTime).toISOString() : undefined,
      isPublic: true,
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showOneByOne: false,
        allowBacktrack: true,
        autoSubmitOnTimeUp: false,
        allowAnonymous: !requireNameSelection,
        showScoreImmediately: showScorePolicy === 'immediate',
        showAnswersImmediately: false,
        showExplanationAfterClose: showAnswerAfterClose,
        trackTabSwitches: false,
        maxAttempts: 99,
        isUnlimitedTime: true,
        closeTime: closeTime ? new Date(closeTime).toISOString() : undefined,
        allowLateSubmission,
        allowFileUploadEssay,
        scoreViewPolicy: showScorePolicy === 'immediate' ? 'after_submit' : 'never',
        answerViewPolicy: showAnswerAfterClose ? 'after_closed' : 'never',
        assignmentType: 'homework',
        accessType: 'assigned_classes',
        requireStudentInfo: {
          fullName: true,
          classRoom: true,
          studentCode: true,
          phone: false
        }
      },
      questions: homeworkQuestions
    });

    setCreatedExam(newHomework);
    setCurrentStep(3);
    success('Giao bài tập thành công!', `Đã giao "${newHomework.title}" cho ${selectedClassIds.length} lớp.`);
    if (onSuccess) onSuccess(newHomework);
  };

  const shareUrl = createdExam ? `${window.location.origin}/exam/${createdExam.id}` : '';
  const qrApiUrl = createdExam
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&margin=8`
    : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyZalo = () => {
    if (!createdExam) return;
    const deadlineStr = closeTime ? new Date(closeTime).toLocaleString('vi-VN') : 'Không giới hạn';
    const classNames = selectedClassIds
      .map((cid) => classes.find((c) => c.id === cid)?.name)
      .filter(Boolean)
      .join(', ');

    const msg = `📢 BÀI TẬP VỀ NHÀ MỚI: ${createdExam.title}
📚 Lớp: ${classNames || 'Toàn bộ'}
⏰ Hạn nộp bài: ${deadlineStr}
👉 Học sinh làm bài và nộp tại link: ${shareUrl}
📌 Hướng dẫn: Các em làm bài vào vở, chụp ảnh bài làm rõ nét các trang và bấm Nộp bài.`;

    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {currentStep === 3 ? 'Giao bài tập thành công!' : 'Tạo & Giao Bài tập về nhà'}
                </h3>
              </div>
              <p className="text-xs text-blue-100">
                {currentStep === 1
                  ? 'Bước 1/2: Thiết lập nội dung đề bài tập'
                  : currentStep === 2
                  ? 'Bước 2/2: Cài đặt hạn nộp, lớp nhận và chế độ chụp ảnh'
                  : 'Chia sẻ link và mã QR nộp bài cho học sinh'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator (Steps 1 & 2) */}
        {currentStep !== 3 && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                  currentStep === 1 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                    currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  1
                </span>
                <span>Nội dung bài tập</span>
              </button>

              <span className="text-slate-300">→</span>

              <button
                type="button"
                onClick={() => title.trim() && setCurrentStep(2)}
                className={`flex items-center gap-1.5 font-bold transition-colors ${
                  currentStep === 2 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                    currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  2
                </span>
                <span>Cài đặt giao bài & Hạn nộp</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              Học sinh nộp bằng ảnh chụp bài làm hoặc gõ đáp án
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* STEP 1: CONTENT OF HOMEWORK */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Title & Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>Tiêu đề bài tập về nhà</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài tập về nhà buổi 12 - Rút gọn biểu thức chứa căn thức bậc hai..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs text-slate-900 outline-hidden font-medium transition-all"
                />
              </div>

              {/* Mode Selection Tabs (Azota 3 Ways) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Phương thức đưa đề bài tập vào:</label>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Chọn cách thức phù hợp với giáo án của bạn
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentMode('upload')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      contentMode === 'upload'
                        ? 'bg-blue-50/90 border-blue-500 text-blue-900 font-bold shadow-2xs ring-1 ring-blue-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold">Tải file đề</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline font-normal">Word / PDF / Ảnh</span>
                  </button>

                  <button
                    type="button"
                    id="btn-tab-self-compose-homework"
                    onClick={() => setContentMode('manual')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      contentMode === 'manual'
                        ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-wider uppercase shadow-2xs">
                      Tự soạn
                    </span>
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold">Tự soạn bài tập</span>
                    <span className="text-[10px] text-indigo-600 hidden sm:inline font-semibold">Trắc nghiệm & Tự luận</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentMode('bank')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      contentMode === 'bank'
                        ? 'bg-amber-50/90 border-amber-500 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-400/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">Ngân hàng câu hỏi</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline font-normal">{bankQuestions.length} câu có sẵn</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: File Upload */}
              {contentMode === 'upload' && (
                <div className="space-y-2.5">
                  <label
                    htmlFor="input-file-homework"
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 rounded-2xl cursor-pointer transition-all text-center group"
                  >
                    <Upload className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-bold text-slate-800">
                      {uploadedFileName ? `Tệp đã chọn: ${uploadedFileName}` : 'Nhấn để chọn file Word, PDF hoặc Ảnh đề bài'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ .docx, .doc, .pdf, .png, .jpg lên tới 25MB
                    </span>
                    <input
                      id="input-file-homework"
                      type="file"
                      accept=".docx,.doc,.pdf,.png,.jpg,.jpeg,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Attached files chips */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Tệp đề đính kèm sẵn:</span>
                      {attachedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate">{file}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                            ✓ Sẵn sàng cho học sinh xem
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    placeholder="Ghi chú hướng dẫn bài làm (Ví dụ: Làm bài 1, 2, 3 ra vở bài tập, chụp ảnh trang giải nộp...)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs text-slate-900 outline-hidden transition-all mt-1"
                  />
                </div>
              )}

              {/* Mode 2: Interactive Self-Composed Homework */}
              {contentMode === 'manual' && (
                <div className="space-y-3.5">
                  {/* Sub-mode navigation bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setManualSubMode('composer')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          manualSubMode === 'composer'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-indigo-600'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Soạn từng câu ({composedItems.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualSubMode('text')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          manualSubMode === 'text'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-indigo-600'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Gõ nhanh văn bản</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAutoBalancePoints}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Tự động chia đều 10 điểm cho các câu hỏi"
                      >
                        <Sliders className="w-3 h-3 text-indigo-600" />
                        <span>Chia đều 10đ</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetSampleQuestions}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        title="Tải 3 câu hỏi mẫu gồm cả trắc nghiệm và tự luận"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-600" />
                        <span>Nạp mẫu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate('/teacher/exam-builder/new?type=homework');
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                        title="Chuyển sang trình soạn chuyên sâu toàn màn hình"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-200" />
                        <span>Soạn chuyên sâu</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-mode A: Question Composer Cards */}
                  {manualSubMode === 'composer' ? (
                    <div className="space-y-3">
                      {composedItems.map((item, idx) => {
                        const isChoice = item.type === 'single_choice';

                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 transition-all hover:border-indigo-300"
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  Câu {idx + 1}
                                </span>

                                {/* Type selector */}
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateComposedItem(item.id, { type: 'single_choice' })}
                                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                      isChoice
                                        ? 'bg-white text-indigo-700 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Trắc nghiệm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateComposedItem(item.id, { type: 'essay' })}
                                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                      !isChoice
                                        ? 'bg-white text-indigo-700 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Tự luận
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Points Input */}
                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                  <span className="text-[11px] text-slate-500 font-medium">Điểm:</span>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    max="10"
                                    value={item.points}
                                    onChange={(e) =>
                                      handleUpdateComposedItem(item.id, {
                                        points: parseFloat(e.target.value) || 0
                                      })
                                    }
                                    className="w-12 bg-transparent text-xs font-bold text-indigo-900 outline-hidden text-right"
                                  />
                                  <span className="text-[11px] text-slate-500">đ</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateComposedItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Nhân bản câu hỏi này"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveComposedItem(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa câu hỏi này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Question Content Input */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Nội dung câu hỏi bài tập *
                              </label>
                              <textarea
                                rows={2}
                                value={item.content}
                                onChange={(e) =>
                                  handleUpdateComposedItem(item.id, { content: e.target.value })
                                }
                                placeholder={`Nhập nội dung đề bài câu ${idx + 1}...`}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-xs text-slate-900 outline-hidden leading-relaxed transition-all"
                              />
                            </div>

                            {/* If Single Choice: Options A, B, C, D */}
                            {isChoice ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <label className="font-bold text-slate-700">
                                    Các phương án trả lời (Bấm vào chữ A, B, C, D để chọn đáp án đúng):
                                  </label>
                                  <span className="text-emerald-700 font-semibold text-[10px]">
                                    Đáp án đúng: {item.correctAnswer}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {item.options.map((opt) => {
                                    const isCorrect = item.correctAnswer === opt.id;
                                    return (
                                      <div
                                        key={opt.id}
                                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                          isCorrect
                                            ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUpdateComposedItem(item.id, { correctAnswer: opt.id })
                                          }
                                          className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                            isCorrect
                                              ? 'bg-emerald-600 text-white shadow-2xs'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                          title={`Chọn ${opt.id} làm đáp án đúng`}
                                        >
                                          {opt.id}
                                        </button>

                                        <input
                                          type="text"
                                          value={opt.content}
                                          onChange={(e) =>
                                            handleUpdateComposedOption(item.id, opt.id, e.target.value)
                                          }
                                          placeholder={`Phương án ${opt.id}...`}
                                          className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-hidden font-medium"
                                        />

                                        {isCorrect && (
                                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                            <Check className="w-3 h-3" />
                                            <span>Đúng</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              /* If Essay Question Notice */
                              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                                <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] leading-relaxed">
                                  <strong>Dạng bài tự luận:</strong> Học sinh sẽ giải chi tiết ra giấy/vở bài tập, sau đó dùng camera điện thoại chụp ảnh bài giải hoặc gõ trực tiếp câu trả lời để nộp.
                                </div>
                              </div>
                            )}

                            {/* Explanation / Solution Guide */}
                            <div className="space-y-1 pt-1">
                              <label className="text-[11px] font-semibold text-slate-500 block">
                                Lời giải chi tiết / Gợi ý đáp án (học sinh xem sau khi công bố):
                              </label>
                              <input
                                type="text"
                                value={item.explanation}
                                onChange={(e) =>
                                  handleUpdateComposedItem(item.id, { explanation: e.target.value })
                                }
                                placeholder="Nhập tóm tắt lời giải hoặc đáp số chính xác..."
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-xs text-slate-700 outline-hidden transition-all placeholder:text-slate-400"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddComposedQuestion('single_choice')}
                          className="py-2.5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 rounded-xl font-bold text-xs text-indigo-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-indigo-600" />
                          <span>+ Thêm câu trắc nghiệm</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddComposedQuestion('essay')}
                          className="py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50 rounded-xl font-bold text-xs text-amber-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-amber-600" />
                          <span>+ Thêm câu tự luận (nộp ảnh)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Sub-mode B: Quick raw text input */
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700">Dán danh sách bài tập tự luận:</label>
                        <span className="text-[11px] text-slate-400">Mỗi dòng hoặc mục một bài toán</span>
                      </div>
                      <textarea
                        rows={7}
                        value={manualQuestionText}
                        onChange={(e) => setManualQuestionText(e.target.value)}
                        placeholder="1. Rút gọn biểu thức chứa căn thức bậc hai...&#10;2. Giải phương trình vô tỉ cơ bản...&#10;3. Bài toán thực tế ứng dụng hệ thức lượng..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-xs text-slate-900 outline-hidden leading-relaxed font-mono"
                      />
                      <p className="text-[11px] text-slate-500">
                        Nội dung này sẽ được hiển thị cho học sinh đọc đề và nộp ảnh bài giải từng câu vào hệ thống.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Bank questions selection */}
              {contentMode === 'bank' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Chọn câu hỏi từ Ngân hàng ({bankQuestions.length} câu có sẵn):
                    </span>
                    <span className="text-[11px] text-blue-700 font-bold">
                      Đã chọn {selectedBankQuestionIds.length} câu
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50 custom-scrollbar">
                    {bankQuestions.map((q) => {
                      const isChecked = selectedBankQuestionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 cursor-pointer transition-all ${
                            isChecked ? 'bg-blue-50 border-blue-300 text-blue-950 font-medium' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBankQuestionIds([...selectedBankQuestionIds, q.id]);
                              } else {
                                setSelectedBankQuestionIds(selectedBankQuestionIds.filter((id) => id !== q.id));
                              }
                            }}
                            className="mt-0.5 rounded text-blue-600"
                          />
                          <div className="flex-1 line-clamp-2">{q.content}</div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Step 1 */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleNextToSettings}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>Tiếp tục: Cài đặt giao bài</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AZOTA SETTINGS & ASSIGNMENT CONFIG */}
          {currentStep === 2 && (
            <form onSubmit={handleFinalCreate} className="space-y-4 animate-in fade-in duration-150">
              {/* 1. Target Classes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Lớp nhận bài tập</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {selectedClassIds.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả các lớp'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map((c) => {
                    const isSelected = selectedClassIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleClass(c.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 text-blue-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Azota Deadline Configuration */}
              <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Hạn nộp bài tập (Deadline)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDeadlineOffsetDays(1)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer"
                    >
                      +1 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlineOffsetDays(3)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer"
                    >
                      +3 ngày
                    </button>
                    <button
                      type="button"
                      onClick={setDeadlineToThisWeekend}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer"
                    >
                      Chủ Nhật
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1 font-medium">
                      Thời điểm hết hạn nộp:
                    </label>
                    <input
                      type="datetime-local"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-hidden font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={allowLateSubmission}
                        onChange={(e) => setAllowLateSubmission(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Cho phép nộp muộn sau hạn (gắn nhãn Nộp muộn)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={requireNameSelection}
                        onChange={(e) => setRequireNameSelection(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Học sinh chọn tên trong danh sách lớp khi nộp bài</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Azota Submission Format: Photo of Paperwork */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Hình thức học sinh làm & nộp bài</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowFileUploadEssay}
                      onChange={(e) => setAllowFileUploadEssay(e.target.checked)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Chụp ảnh bài làm trong vở nộp
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Học sinh giải ra giấy/vở rồi chụp ảnh nhiều trang tải lên
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowTextInput}
                      onChange={(e) => setAllowTextInput(e.target.checked)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Gõ câu trả lời trực tiếp
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cho phép soạn thảo văn bản / câu trả lời trên màn hình
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Score & Explanation Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Xem điểm bài tập:
                  </label>
                  <select
                    value={showScorePolicy}
                    onChange={(e) => setShowScorePolicy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  >
                    <option value="immediate">Xem điểm ngay sau khi nộp</option>
                    <option value="after_graded">Chỉ xem điểm khi giáo viên đã chấm xong</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Xem đáp án & lời giải chi tiết:
                  </label>
                  <select
                    value={showAnswerAfterClose ? 'after_close' : 'never'}
                    onChange={(e) => setShowAnswerAfterClose(e.target.value === 'after_close')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  >
                    <option value="after_close">Chỉ xem lời giải sau khi hết hạn nộp bài</option>
                    <option value="never">Không cho xem lời giải</option>
                  </select>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại đề bài</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Giao bài tập ngay</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & SHARING SCREEN (AZOTA STYLE) */}
          {currentStep === 3 && createdExam && (
            <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{createdExam.title}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đã giao thành công cho <strong>{selectedClassIds.length} lớp học</strong>. Hạn nộp bài:{' '}
                  <strong>{closeTime ? new Date(closeTime).toLocaleString('vi-VN') : 'Không giới hạn'}</strong>
                </p>
              </div>

              {/* Link Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
                <label className="text-xs font-bold text-slate-700 block">Link nộp bài tập trực tuyến:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã chép' : 'Sao chép link'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code & Zalo Box */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-1">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
                  <img
                    src={qrApiUrl}
                    alt="QR Code bài tập"
                    className="w-36 h-36 object-contain rounded-xl mx-auto"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
                    Quét nhanh bằng Zalo / Camera
                  </span>
                </div>

                <div className="space-y-3 text-left w-full sm:w-72">
                  <a
                    href={`/exam/${createdExam.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span>Xem trước giao diện học sinh</span>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
