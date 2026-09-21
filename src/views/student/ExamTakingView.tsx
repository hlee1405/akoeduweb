import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Flag,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  GraduationCap,
  Sparkles,
  Camera,
  Maximize2,
  Lock,
  Calendar,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { store } from '../../services/store';
import { scoringService } from '../../services/scoringService';
import { Exam, ClassRoom, Question, StudentAnswer, ExamQuestionItem } from '../../types';
import { QuestionTypeBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ThemeSelector } from '../../components/theme/ThemeSelector';

export const ExamTakingView: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { warning, error, success } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());

  // Registration states (Pre-exam)
  const [isStarted, setIsStarted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');

  // Exam taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [attachmentsByQuestion, setAttachmentsByQuestion] = useState<Record<string, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Fullscreen helper
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (examId) {
      const found = store.getExamById(examId);
      if (found) {
        setExam(found);
        setSecondsRemaining(found.durationMinutes * 60);

        // Pre-select class if only 1 assigned class
        if (found.assignedClassIds && found.assignedClassIds.length === 1) {
          setSelectedClassId(found.assignedClassIds[0]);
        }
      }
    }
  }, [examId]);

  // Tab switch anti-cheat detection
  useEffect(() => {
    if (!isStarted || !exam?.settings.trackTabSwitches) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchesCount((prev) => {
          const next = prev + 1;
          const maxAllowed = exam?.settings.maxTabSwitchesAllowed || 3;
          warning(
            'Cảnh báo chuyển màn hình',
            `Bạn đã chuyển khỏi màn hình thi (${next}/${maxAllowed} lần). Hệ thống ghi nhận hành vi này!`
          );
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStarted, exam]);

  // Copy-paste prevention
  useEffect(() => {
    if (!isStarted || !exam?.settings.preventCopyPaste) return;

    const handlePrevent = (e: Event) => {
      e.preventDefault();
      warning('Hành động bị chặn', 'Tính năng sao chép, dán và chuột phải bị khóa trong bài thi này.');
    };

    const container = containerRef.current || document;
    container.addEventListener('copy', handlePrevent);
    container.addEventListener('paste', handlePrevent);
    container.addEventListener('contextmenu', handlePrevent);

    return () => {
      container.removeEventListener('copy', handlePrevent);
      container.removeEventListener('paste', handlePrevent);
      container.removeEventListener('contextmenu', handlePrevent);
    };
  }, [isStarted, exam]);

  // Timer countdown / countup
  useEffect(() => {
    if (!isStarted) return;

    const isUnlimited = exam?.settings.isUnlimitedTime || exam?.durationMinutes === 0;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (!isUnlimited) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, exam]);

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      warning('Vui lòng nhập tên', 'Họ và tên học sinh là bắt buộc để làm bài.');
      return;
    }

    // Password validation
    if (exam?.settings.requirePassword && exam.settings.password) {
      if (enteredPassword.trim() !== exam.settings.password.trim()) {
        error('Mật khẩu không đúng', 'Mật khẩu làm bài thi không chính xác. Vui lòng kiểm tra lại với giáo viên.');
        return;
      }
    }

    // Access class requirement
    if (exam?.settings.accessType === 'assigned_classes' && exam.assignedClassIds && exam.assignedClassIds.length > 0) {
      if (!selectedClassId || !exam.assignedClassIds.includes(selectedClassId)) {
        warning('Lớp học không hợp lệ', 'Vui lòng chọn đúng lớp học được phân công làm bài thi này.');
        return;
      }
    }

    // Full screen request if strict
    if (exam?.settings.strictFullScreen && containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {
        // Fullscreen request might be blocked by browser policy; continue gracefully
      });
    }

    setStartTime(Date.now());
    setIsStarted(true);
  };

  const handleSelectOption = (questionId: string, optionId: string, isMultiple = false) => {
    if (!isMultiple) {
      setUserAnswers((prev) => {
        // If clicking the selected option again, deselect it (allows student to change mind or re-select freely)
        if (prev[questionId] === optionId) {
          const next = { ...prev };
          delete next[questionId];
          return next;
        }
        return { ...prev, [questionId]: optionId };
      });
    } else {
      const current = (userAnswers[questionId] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setUserAnswers((prev) => ({ ...prev, [questionId]: updated }));
    }
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const toggleFlag = (questionId: string) => {
    const next = new Set(flaggedQuestions);
    if (next.has(questionId)) next.delete(questionId);
    else next.add(questionId);
    setFlaggedQuestions(next);
  };

  const handleUploadPhoto = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      warning('Định dạng không hợp lệ', 'Chỉ hỗ trợ tệp hình ảnh (PNG, JPG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachmentsByQuestion((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), base64]
      }));
      success('Đã tải ảnh lên', 'Ảnh bài làm tự luận đã được đính kèm vào câu hỏi.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (questionId: string, photoIndex: number) => {
    setAttachmentsByQuestion((prev) => {
      const current = prev[questionId] || [];
      const updated = current.filter((_, idx) => idx !== photoIndex);
      return { ...prev, [questionId]: updated };
    });
  };

  const handleAutoSubmit = () => {
    warning('Hết giờ làm bài', 'Hệ thống đang tự động nộp bài thi của bạn...');
    submitExam();
  };

  const submitExam = () => {
    if (!exam) return;

    // Check minimum time requirement
    const minPercent = exam.settings?.minTimePercentBeforeSubmit || 0;
    if (minPercent > 0 && exam.durationMinutes > 0) {
      const minRequiredSeconds = (exam.durationMinutes * 60 * minPercent) / 100;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed < minRequiredSeconds) {
        const remainingWaitMin = Math.ceil((minRequiredSeconds - elapsed) / 60);
        warning(
          'Chưa đủ thời gian nộp bài',
          `Quy chế thi yêu cầu làm tối thiểu ${minPercent}% thời gian (${Math.round(minRequiredSeconds / 60)} phút). Bạn cần làm thêm khoảng ${remainingWaitMin} phút nữa mới được nộp bài.`
        );
        return;
      }
    }

    // Build StudentAnswer list
    const answers: StudentAnswer[] = exam.questions.map((qItem) => {
      const q = qItem.question;
      const rawAns = userAnswers[qItem.questionId];
      const questionAttachments = attachmentsByQuestion[qItem.questionId] || [];

      if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'true_false') {
        const studentAns = rawAns || '';
        const isCorrect = q.correctAnswers.includes(studentAns);
        return {
          questionId: qItem.questionId,
          studentAnswer: studentAns,
          isCorrect,
          earnedPoints: isCorrect ? qItem.points : 0,
          isGraded: true
        };
      }

      if (q.type === 'multiple_select') {
        const studentList = (rawAns as string[]) || [];
        const isCorrect =
          studentList.length === q.correctAnswers.length &&
          studentList.every((id) => q.correctAnswers.includes(id));
        return {
          questionId: qItem.questionId,
          studentAnswer: studentList,
          isCorrect,
          earnedPoints: isCorrect ? qItem.points : 0,
          isGraded: true
        };
      }

      if (q.type === 'fill_in_blank') {
        const studentText = (rawAns || '').trim().toLowerCase();
        const isCorrect = q.correctAnswers.some((ans) => ans.trim().toLowerCase() === studentText);
        return {
          questionId: qItem.questionId,
          studentAnswer: rawAns || '',
          isCorrect,
          earnedPoints: isCorrect ? qItem.points : 0,
          isGraded: true
        };
      }

      // Essay / Short Answer
      return {
        questionId: qItem.questionId,
        studentAnswer: rawAns || '',
        attachments: questionAttachments,
        isCorrect: false,
        earnedPoints: 0,
        isGraded: false
      };
    });

    // Score calculations
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const objectiveScore = answers
      .filter((a) => a.isGraded)
      .reduce((sum, a) => sum + (a.earnedPoints || 0), 0);

    const hasEssay = exam.questions.some((q) => q.question.type === 'essay' || q.question.type === 'short_answer');
    const isLate = exam.closeTime ? new Date() > new Date(exam.closeTime) : false;
    const allAttachments = Object.values(attachmentsByQuestion).flat() as string[];

    const createdSubmission = store.addSubmission({
      examId: exam.id,
      studentName: studentName.trim(),
      studentCode: studentCode.trim() || undefined,
      studentClassId: selectedClassId || undefined,
      submittedAt: new Date().toISOString(),
      answers,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      isLate,
      durationSeconds,
      objectiveScore: Number(objectiveScore.toFixed(2)),
      totalScore: Number(objectiveScore.toFixed(2)),
      isPassed: objectiveScore >= exam.passingScore,
      status: 'graded',
      needsManualGrading: false,
      tabSwitchesCount
    });

    success('Nộp bài thành công', 'Kết quả bài thi của bạn đã được ghi nhận.');
    navigate(`/exam/${exam.id}/result?submissionId=${createdSubmission.id}`);
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi</h2>
          <p className="text-xs text-slate-500">Mã bài thi không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link to="/" className="text-xs text-blue-600 font-semibold underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Check Timetable Lock (Open / Close Time)
  const now = new Date();
  const isOpenTimeFuture = exam.openTime && new Date(exam.openTime) > now;
  const isCloseTimePassed = exam.closeTime && new Date(exam.closeTime) < now;
  const isLockedOut = isCloseTimePassed && !exam.settings?.allowLateSubmission;

  if (isOpenTimeFuture) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 antialiased text-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Đề thi chưa đến giờ mở</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Đề thi <strong>"{exam.title}"</strong> sẽ chính thức mở vào lúc:
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 font-bold text-sm text-amber-950 font-mono">
            {new Date(exam.openTime!).toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-400">
            Vui lòng quay lại làm bài đúng khung giờ trên.
          </p>
          <Link to="/" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (isLockedOut) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 antialiased text-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Đề thi đã đóng</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hạn chót nộp bài của đề thi <strong>"{exam.title}"</strong> đã kết thúc vào lúc:
          </p>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 font-bold text-sm text-rose-950 font-mono">
            {new Date(exam.closeTime!).toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-400">
            Hệ thống hiện không tiếp nhận thêm bài làm cho đợt thi này.
          </p>
          <Link to="/" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Filter classes according to assignment policy
  const isAssignedClassesOnly = exam.settings?.accessType === 'assigned_classes' && exam.assignedClassIds && exam.assignedClassIds.length > 0;
  const filteredClasses = isAssignedClassesOnly
    ? classes.filter((c) => exam.assignedClassIds?.includes(c.id))
    : classes;

  // PRE-EXAM REGISTRATION SCREEN
  if (!isStarted) {
    const isUnlimited = exam.settings?.isUnlimitedTime || exam.durationMinutes === 0;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold mx-auto shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{exam.title}</h1>
            <p className="text-xs text-slate-300">
              {exam.subject} • {exam.grade} • {exam.questions.length} câu hỏi
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-blue-300 border border-slate-700">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Thời gian: <strong>{isUnlimited ? 'Không giới hạn' : `${exam.durationMinutes} phút`}</strong>
              </span>
            </div>
          </div>

          {/* Late Notice Banner */}
          {isCloseTimePassed && exam.settings?.allowLateSubmission && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Đề thi đã quá hạn chót. Bạn vẫn được nộp bài và sẽ được đánh dấu <strong>Nộp muộn</strong>.</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleStartExam} className="p-6 space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {exam.settings?.requireStudentInfo?.studentCode ? 'Mã HS / SBD *' : 'Mã HS / SBD'}
                  </label>
                  <input
                    type="text"
                    required={exam.settings?.requireStudentInfo?.studentCode}
                    placeholder="HS-091"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lớp học *</label>
                  <select
                    value={selectedClassId}
                    required={isAssignedClassesOnly}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white font-medium"
                  >
                    {!isAssignedClassesOnly && <option value="">(Tự do / Khách)</option>}
                    {filteredClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Phone field */}
              {exam.settings?.requireStudentInfo?.phone && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              )}

              {/* Password Requirement Input */}
              {exam.settings?.requirePassword && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mật khẩu vào thi *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu do giáo viên cung cấp..."
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Exam Rules & Instructions */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 text-blue-950 space-y-1.5 text-[11px] leading-relaxed">
              <span className="font-bold flex items-center gap-1 text-blue-900">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                Quy chế phòng thi trực tuyến:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                <li>
                  Thời gian làm bài: <strong>{isUnlimited ? 'Không giới hạn' : `${exam.durationMinutes} phút`}</strong>
                </li>
                {exam.settings?.trackTabSwitches && (
                  <li>Giám sát tự động: Hệ thống ghi nhận mọi hành vi chuyển tab / thoát màn hình.</li>
                )}
                {exam.settings?.preventCopyPaste && (
                  <li>Tính năng sao chép, dán câu hỏi bị khóa để đảm bảo công bằng.</li>
                )}
                {exam.settings?.allowFileUploadEssay && (
                  <li>Câu hỏi tự luận cho phép chụp ảnh bài làm trên giấy để đính kèm nộp.</li>
                )}
                <li>Tự động lưu câu trả lời sau mỗi thao tác.</li>
              </ul>
            </div>

            <button
              type="submit"
              id="btn-start-exam-action"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Bắt đầu làm bài thi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM ROOM SCREEN
  const currentQItem = exam.questions[currentIndex];
  const currentQ = currentQItem?.question;

  const isUnlimited = exam.settings?.isUnlimitedTime || exam.durationMinutes === 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeWarning = !isUnlimited && secondsRemaining < 5 * 60;

  const answeredCount = Object.keys(userAnswers).filter((k) => {
    const val = userAnswers[k];
    const hasPhoto = (attachmentsByQuestion[k] || []).length > 0;
    return (Array.isArray(val) ? val.length > 0 : Boolean(val)) || hasPhoto;
  }).length;

  const currentPhotos = currentQItem ? attachmentsByQuestion[currentQItem.questionId] || [] : [];

  return (
    <div
      ref={containerRef}
      id="exam-taking-room"
      className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800 font-sans"
    >
      {/* Fixed Sticky Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate max-w-[200px] sm:max-w-xs">
              {exam.title}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Thí sinh: <strong>{studentName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown / Elapsed Clock */}
            {isUnlimited ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm bg-amber-50 border border-amber-300 text-amber-900 shadow-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Đã làm: {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
                </span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base border shadow-xs ${
                  isTimeWarning
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-slate-900 text-white border-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Theme Selector for Student Exam */}
            <ThemeSelector variant="pill" showLabel={false} />
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-exam"
            onClick={() => setShowConfirmSubmit(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài ({answeredCount}/{exam.questions.length})</span>
          </button>
        </div>
      </header>

      {/* Main Taking Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column: Question Content */}
        <div className="md:col-span-3 space-y-4">
          {currentQ && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-xs">
                    Câu {currentIndex + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">({currentQItem.points} điểm)</span>
                  <QuestionTypeBadge type={currentQ.type} />
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQItem.questionId)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    flaggedQuestions.has(currentQItem.questionId)
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions.has(currentQItem.questionId) ? 'Đã đánh dấu xem lại' : 'Đánh dấu'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQ.content}
              </div>

              {/* Multiple Choice / Single Choice / True False Options */}
              {['single_choice', 'multiple_choice', 'true_false'].includes(currentQ.type) && currentQ.options && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                    <span>Chọn đáp án đúng (bấm vào để chọn, bấm lại để bỏ chọn hoặc đổi phương án):</span>
                    {userAnswers[currentQItem.questionId] && (
                      <span className="font-semibold text-blue-600">
                        Đang chọn: [{userAnswers[currentQItem.questionId]}]
                      </span>
                    )}
                  </div>
                  {currentQ.options.map((opt) => {
                    const isSelected = userAnswers[currentQItem.questionId] === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQItem.questionId, opt.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="text-sm leading-relaxed flex-1">{opt.content}</span>
                        {isSelected && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                            Đã chọn
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Select Options */}
              {currentQ.type === 'multiple_select' && currentQ.options && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt) => {
                    const currentList = (userAnswers[currentQItem.questionId] as string[]) || [];
                    const isSelected = currentList.includes(opt.id);

                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQItem.questionId, opt.id, true)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="text-sm leading-relaxed">{opt.content}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the Blank / Short Answer */}
              {currentQ.type === 'fill_in_blank' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-600">Nhập đáp án của bạn:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: x = 2 hoặc kết quả số..."
                    value={userAnswers[currentQItem.questionId] || ''}
                    onChange={(e) => handleTextAnswerChange(currentQItem.questionId, e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              )}

              {/* Navigation buttons: Prev / Next */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs font-semibold text-slate-400">
                  Câu {currentIndex + 1} / {exam.questions.length}
                </span>

                <button
                  type="button"
                  disabled={currentIndex === exam.questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl disabled:opacity-30 cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator Matrix (Sticky) */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 sticky top-20">
            <h3 className="font-bold text-xs text-slate-900">Bảng câu hỏi ({exam.questions.length})</h3>

            {/* Grid of Question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const ans = userAnswers[q.questionId];
                const isAnswered = Array.isArray(ans) ? ans.length > 0 : Boolean(ans);
                const isCurrent = currentIndex === idx;
                const isFlagged = flaggedQuestions.has(q.questionId);

                return (
                  <button
                    key={`${q.questionId}-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300 inline-block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-100 inline-block" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                <span>Đã đánh dấu xem lại</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal to Submit */}
      <ConfirmModal
        isOpen={showConfirmSubmit}
        title="Xác nhận nộp bài thi?"
        message={`Bạn đã hoàn thành ${answeredCount}/${exam.questions.length} câu hỏi. Sau khi nộp bài, bạn không thể thay đổi đáp án.`}
        confirmText="Nộp bài ngay"
        onConfirm={submitExam}
        onCancel={() => setShowConfirmSubmit(false)}
      />
    </div>
  );
};
