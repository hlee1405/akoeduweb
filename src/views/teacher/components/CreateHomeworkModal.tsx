import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Upload,
  FileText,
  Image as ImageIcon,
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
  Plus,
  Trash2,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Sigma,
  Code,
  Eye,
  Sliders,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  FileCode,
  FileType,
  Send,
  RotateCcw
} from 'lucide-react';
import { store } from '../../../services/store';
import { Exam, ClassRoom, Student, Question } from '../../../types';
import { useToast } from '../../../context/ToastContext';

export interface AttachedHomeworkFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'doc' | 'image' | 'other';
  url?: string;
}

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
  const { success, warning, info } = useToast();
  const classes: ClassRoom[] = store.getClasses();
  const allStudents: Student[] = store.getStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modal Step: 'form' (Nhập & Cấu hình theo Azota) -> 'success' (Chia sẻ link sau khi giao)
  const [modalView, setModalView] = useState<'form' | 'success'>('form');

  // 1. Tên bài tập
  const [title, setTitle] = useState('');

  // 2. Thời gian nộp bài (Hạn nộp)
  const defaultCloseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  const [deadline, setDeadline] = useState<string>(defaultCloseDate());

  // 3. Nội dung bài tập & Files
  const [content, setContent] = useState(
    'Các em hoàn thành các bài tập trong file đính kèm vào vở ghi bài tập.\nTrình bày chi tiết các bước giải, sau đó dùng điện thoại chụp ảnh các trang vở bài làm và tải lên hệ thống trước hạn nộp.'
  );
  const [attachedFiles, setAttachedFiles] = useState<AttachedHomeworkFile[]>([
    {
      id: 'f-1',
      name: 'Phieu_bai_tap_ren_luyen_toan_9_chu_de_01.pdf',
      size: '2.4 MB',
      type: 'pdf'
    }
  ]);

  // 4. Cài đặt & Cấu hình giao bài tập (Azota Settings)
  const [requireLogin, setRequireLogin] = useState<boolean>(false);
  const [hideScore, setHideScore] = useState<boolean>(false);
  const [hideAnswers, setHideAnswers] = useState<boolean>(true);
  const [singleSubmissionOnly, setSingleSubmissionOnly] = useState<boolean>(false);
  const [allowPhotoSubmission, setAllowPhotoSubmission] = useState<boolean>(true);
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(true);

  // 5. Giao cho ai: Lớp & Học sinh
  const [assignTargetType, setAssignTargetType] = useState<'all_classes' | 'specific_students'>('all_classes');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    initialClassId ? [initialClassId] : classes.length > 0 ? [classes[0].id] : []
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // 6. State giao bài thành công
  const [createdHomework, setCreatedHomework] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialClassId && !selectedClassIds.includes(initialClassId)) {
      setSelectedClassIds([initialClassId]);
    }
  }, [initialClassId]);

  if (!isOpen) return null;

  // Xử lý Reset Hạn nộp về không giới hạn
  const handleResetDeadline = () => {
    setDeadline('');
    info('Đã đặt lại: Bài tập không giới hạn thời gian nộp');
  };

  // Shortcut đặt hạn nộp
  const handleSetDeadlineShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setDeadline(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleSetDeadlineSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    d.setHours(23, 59, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setDeadline(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  // Xử lý đính kèm file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedHomeworkFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: AttachedHomeworkFile['type'] = 'other';
      if (ext === 'pdf') type = 'pdf';
      else if (ext === 'docx' || ext === 'doc') type = 'docx';
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image';

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${sizeInMB} MB`;

      newFiles.push({
        id: `f-${Date.now()}-${i}`,
        name: file.name,
        size: displaySize,
        type
      });

      // Tự động gợi ý tên bài tập nếu chưa nhập
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    success('Đã tải lên tệp bài tập', `Đã thêm ${newFiles.length} tệp.`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Toolbar Editor formatting helpers
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = 'văn bản') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      }
    }, 0);
  };

  // Chọn lớp
  const toggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
    } else {
      setSelectedClassIds([...selectedClassIds, classId]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  // Chọn học sinh cụ thể
  const toggleStudent = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  // Nộp & Giao bài tập
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim() || 'Bài tập về nhà';
    if (selectedClassIds.length === 0) {
      warning('Chưa chọn lớp nhận bài', 'Vui lòng chọn ít nhất 1 lớp học để giao bài tập.');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetClasses = classes.filter((c) => selectedClassIds.includes(c.id));
      const firstClass = targetClasses[0];

      // Tạo câu hỏi bài tập tự luận / đính kèm chuẩn format
      const qId = `q-hw-${Date.now()}-1`;
      const baseQuestion: Question = {
        id: qId,
        type: 'essay',
        content: content || 'Giải bài tập ra giấy hoặc vở, chụp ảnh bài giải và tải lên nộp bài.',
        options: [],
        correctAnswers: [],
        explanation: 'Xem lại bài giảng và đối chiếu với lời giải chi tiết của giáo viên.',
        subject: firstClass?.subject || 'Toán học',
        grade: firstClass?.grade || 'Khối 9',
        topic: 'Bài tập rèn luyện',
        cognitiveLevel: 'apply',
        difficulty: 'medium',
        tags: ['BTVN', 'Tự luận'],
        status: 'published',
        createdAt: new Date().toISOString(),
        points: 10
      };

      const examQuestions = [
        {
          questionId: qId,
          order: 1,
          points: 10,
          question: baseQuestion
        }
      ];

      const newHomeworkExam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'> = {
        title: cleanTitle,
        description: content.slice(0, 160) || 'Bài tập rèn luyện về nhà',
        subject: firstClass?.subject || 'Toán học',
        grade: firstClass?.grade || 'Khối 9',
        durationMinutes: 0, // 0 = Không giới hạn thời gian làm bài (BTVN)
        maxScore: 10,
        passingScore: 5,
        status: 'published',
        openTime: new Date().toISOString(),
        closeTime: deadline ? new Date(deadline).toISOString() : undefined,
        assignedClassIds: selectedClassIds,
        assignedStudentIds: assignTargetType === 'specific_students' ? selectedStudentIds : undefined,
        questions: examQuestions,
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
          showOneByOne: false,
          allowBacktrack: true,
          autoSubmitOnTimeUp: false,
          allowAnonymous: !requireLogin,
          showScoreImmediately: !hideScore,
          showAnswersImmediately: !hideAnswers,
          showExplanationAfterClose: true,
          trackTabSwitches: false,
          maxAttempts: singleSubmissionOnly ? 1 : 99,
          assignmentType: 'homework',
          isUnlimitedTime: true,
          allowLateSubmission: allowLateSubmission,
          allowFileUploadEssay: allowPhotoSubmission,
          scoreViewPolicy: hideScore ? 'never' : 'after_submit',
          answerViewPolicy: hideAnswers ? 'never' : 'after_submit',
          accessType: 'assigned_classes',
          requireStudentInfo: {
            fullName: true,
            studentCode: false,
            classRoom: true
          },
          attachedFiles: attachedFiles.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type
          }))
        }
      };

      const saved = store.addExam(newHomeworkExam);
      setCreatedHomework(saved);
      setIsSubmitting(false);
      setModalView('success');
      success('Giao bài tập thành công!', `Đã giao "${saved.title}" cho ${selectedClassIds.length} lớp.`);

      if (onSuccess) {
        onSuccess(saved);
      }
    } catch (err) {
      setIsSubmitting(false);
      warning('Có lỗi xảy ra', 'Không thể lưu bài tập. Vui lòng thử lại.');
    }
  };

  const shareUrl = createdHomework
    ? `${window.location.origin}/exam/${createdHomework.id}`
    : `${window.location.origin}/exam/demo`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    success('Đã sao chép link bài tập', 'Bạn có thể gửi link này vào Zalo nhóm lớp hoặc Facebook.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyZaloMessage = () => {
    if (!createdHomework) return;
    const deadlineText = deadline
      ? new Date(deadline).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'Không giới hạn thời gian';

    const msg = `📢 [THÔNG BÁO BÀI TẬP VỀ NHÀ]\n📝 Tên bài tập: ${createdHomework.title}\n⏰ Hạn nộp: ${deadlineText}\n🔗 Link làm bài và nộp ảnh bài tập: ${shareUrl}\n👉 Các em hoàn thành và nộp đúng hạn nhé!`;
    navigator.clipboard.writeText(msg);
    setCopiedZalo(true);
    success('Đã sao chép mẫu tin nhắn Zalo', 'Dán ngay vào nhóm Zalo lớp học.');
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Header theo chuẩn Azota */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {modalView === 'form' ? 'Giao bài tập' : 'Giao bài tập thành công!'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 flex-1 custom-scrollbar">
          {modalView === 'form' ? (
            <form id="azota-homework-form" onSubmit={handleSubmit} className="space-y-4.5">
              {/* 1. Tên bài tập */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>Tên</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên bài tập..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-900 outline-hidden font-medium transition-all shadow-2xs"
                />
              </div>

              {/* 2. Thời gian nộp bài / Hạn nộp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hạn nộp</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetDeadlineShortcut(1)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      +1 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDeadlineShortcut(3)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      +3 ngày
                    </button>
                    <button
                      type="button"
                      onClick={handleSetDeadlineSunday}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      Chủ Nhật
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDeadline}
                      className="px-2.5 py-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Xóa hạn nộp bài"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt lại</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-800 outline-hidden font-medium shadow-2xs"
                  />
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  Để trống nếu không giới hạn thời gian nộp bài
                </p>
              </div>

              {/* 3. Nội dung & Nút Thêm file bài tập */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nội dung</span>
                  </label>

                  {/* Nút Thêm file bài tập phong cách Azota */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Thêm file bài tập</span>
                    </button>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      (Hỗ trợ .pdf, .docx, .doc, .png, .jpg tối đa 50MB)
                    </span>
                  </div>
                </div>

                {/* Danh sách tệp đính kèm */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Tệp đính kèm ({attachedFiles.length}):</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">✓ Học sinh có thể xem & tải về</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {file.type === 'pdf' ? (
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : file.type === 'docx' ? (
                              <FileType className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : file.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400">{file.size}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                            title="Xóa tệp đính kèm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rich text / Text Editor Container */}
                <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-1.5 bg-slate-50 border-b border-slate-200 flex-wrap text-slate-700">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**', 'chữ đậm')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold transition-colors cursor-pointer"
                      title="In đậm (Bold)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*', 'chữ nghiêng')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 italic transition-colors cursor-pointer"
                      title="In nghiêng (Italic)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('<u>', '</u>', 'gạch chân')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Gạch chân (Underline)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('~~', '~~', 'gạch ngang')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Gạch ngang chữ"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => insertFormatting('\n- ', '', 'Mục bài tập')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Danh sách gạch đầu dòng"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n1. ', '', 'Bài toán 1')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Danh sách đánh số"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => insertFormatting('$ \\sqrt{x} + y^2 = 10 $', '', '')}
                      className="p-1.5 hover:bg-slate-200 rounded text-blue-700 font-semibold flex items-center gap-0.5 text-xs transition-colors cursor-pointer"
                      title="Chèn công thức toán học"
                    >
                      <Sigma className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[10px]">Toán</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Chèn hình ảnh vào bài tập"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => insertFormatting('[Link tham khảo](', ')', 'https://')}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                      title="Chèn liên kết"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung bài tập hoặc hướng dẫn làm bài cho học sinh..."
                    className="w-full p-3 bg-white text-xs text-slate-900 outline-hidden leading-relaxed font-sans resize-y"
                  />
                </div>
              </div>

              {/* 4. Cài đặt bài tập (Cấu hình Azota Toggles) */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Cấu hình & Cài đặt làm bài</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Chuẩn giao diện Azota</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle 1: Yêu cầu đăng nhập */}
                  <label className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Yêu cầu đăng nhập để nộp bài
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Tắt: học sinh chỉ cần nhập Họ & Tên
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireLogin}
                      onChange={(e) => setRequireLogin(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 2: Không cho xem điểm */}
                  <label className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Không cho xem điểm
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Ẩn điểm số ngay sau khi nộp
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hideScore}
                      onChange={(e) => setHideScore(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 3: Không cho xem đáp án */}
                  <label className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Không cho xem đáp án
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Chỉ xem lại sau khi giáo viên công bố
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hideAnswers}
                      onChange={(e) => setHideAnswers(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 4: Chỉ nộp 1 lần */}
                  <label className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Chỉ cho phép nộp 1 lần
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Không thể sửa bài sau khi đã gửi
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={singleSubmissionOnly}
                      onChange={(e) => setSingleSubmissionOnly(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 5: Cho phép nộp ảnh bài làm */}
                  <label className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all sm:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cho phép học sinh nộp ảnh chụp bài làm (Tự luận)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Học sinh giải ra giấy/vở rồi dùng camera chụp ảnh nhiều trang tải lên hệ thống để giáo viên chấm điểm
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowPhotoSubmission}
                      onChange={(e) => setAllowPhotoSubmission(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* 5. Giao cho ai / Chọn lớp & Học sinh */}
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
                    const classStudents = allStudents.filter((s) => s.classId === c.id);

                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleClass(c.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-400/40'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="truncate text-xs">{c.name}</p>
                          <p className="text-[10px] font-normal text-slate-500">
                            {classStudents.length} học sinh
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            /* STEP SUCCESS: Giao bài thành công & chia sẻ link */
            <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{createdHomework?.title}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đã giao bài tập thành công cho <strong>{selectedClassIds.length} lớp học</strong>.
                  <br />
                  Hạn nộp:{' '}
                  <strong>
                    {deadline ? new Date(deadline).toLocaleString('vi-VN') : 'Không giới hạn thời gian'}
                  </strong>
                </p>
              </div>

              {/* Hộp Link làm bài */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
                <label className="text-xs font-bold text-slate-700 block">Link nộp bài trực tuyến:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer ${
                      copiedLink ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã chép' : 'Sao chép link'}</span>
                  </button>
                </div>
              </div>

              {/* Nút gửi Zalo & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyZaloMessage}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                    copiedZalo
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-blue-50/70 border-blue-200 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>{copiedZalo ? '✓ Đã chép tin nhắn Zalo' : 'Gửi thông báo qua Zalo lớp'}</span>
                </button>

                <a
                  href={`/exam/${createdHomework?.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Xem trước giao diện học sinh</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          {modalView === 'form' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Hủy
              </button>

              <button
                type="submit"
                form="azota-homework-form"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang giao bài...' : 'Lưu & Giao bài'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              Hoàn tất & Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
