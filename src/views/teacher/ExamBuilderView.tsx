import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Database,
  Share2,
  Clock,
  Layers,
  Award,
  Edit3,
  Check,
  X,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, Question, ClassRoom, ExamQuestionItem, QuestionType, CognitiveLevel, Difficulty } from '../../types';
import { CognitiveLevelBadge, DifficultyBadge, QuestionTypeBadge, ExamStatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { QRModal } from '../../components/common/QRModal';
import { AssignExamModal } from './components/AssignExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';

export const ExamBuilderView: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, warning, error } = useToast();

  const isNew = !examId || examId === 'new';
  const paramClassId = searchParams.get('classId');
  const paramType = searchParams.get('type'); // 'homework' | 'exam'

  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [bankQuestions, setBankQuestions] = useState<Question[]>(store.getQuestions());

  // Active tab
  const [activeTab, setActiveTab] = useState<'questions' | 'general' | 'security'>('questions');

  // Exam Form State
  const [title, setTitle] = useState(
    paramType === 'homework' ? 'Bài tập về nhà rèn luyện' : 'Đề kiểm tra Toán 9'
  );
  const [description, setDescription] = useState(
    paramType === 'homework' ? 'Bài tập rèn luyện củng cố kiến thức theo chuyên đề' : ''
  );
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Khối 9');
  const [durationMinutes, setDurationMinutes] = useState(paramType === 'homework' ? 30 : 45);
  const [maxScore, setMaxScore] = useState(10);
  const [passingScore, setPassingScore] = useState(5);
  const [status, setStatus] = useState<Exam['status']>('published');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(
    paramClassId ? [paramClassId] : ['class-9a1']
  );
  const [isPublic, setIsPublic] = useState(true);

  // Settings
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showOneByOne, setShowOneByOne] = useState(false);
  const [allowBacktrack, setAllowBacktrack] = useState(true);
  const [autoSubmitOnTimeUp, setAutoSubmitOnTimeUp] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showScoreImmediately, setShowScoreImmediately] = useState(true);
  const [showAnswersImmediately, setShowAnswersImmediately] = useState(true);
  const [showExplanationAfterClose, setShowExplanationAfterClose] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(2);

  // Exam Questions
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([]);

  // Editing Question Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormContent, setEditFormContent] = useState('');
  const [editFormType, setEditFormType] = useState<QuestionType>('single_choice');
  const [editFormPoints, setEditFormPoints] = useState<number>(1);
  const [editFormOptions, setEditFormOptions] = useState<{ id: string; content: string }[]>([]);
  const [editFormCorrectAnswers, setEditFormCorrectAnswers] = useState<string[]>([]);
  const [editFormExplanation, setEditFormExplanation] = useState('');
  const [editFormCognitiveLevel, setEditFormCognitiveLevel] = useState<CognitiveLevel>('understand');
  const [editFormDifficulty, setEditFormDifficulty] = useState<Difficulty>('medium');
  const [editFormTopic, setEditFormTopic] = useState('');

  // Bank Modal Selector
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

  // Share QR Modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Azota Assignment & Settings Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPostCreatePrompt, setShowPostCreatePrompt] = useState(false);
  const [examForAssignModal, setExamForAssignModal] = useState<Exam | null>(null);
  const [infoModalExam, setInfoModalExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!isNew && examId) {
      const existing = store.getExamById(examId);
      if (existing) {
        setExamForAssignModal(existing);
        setTitle(existing.title);
        setDescription(existing.description);
        setSubject(existing.subject);
        setGrade(existing.grade);
        setDurationMinutes(existing.durationMinutes);
        setMaxScore(existing.maxScore);
        setPassingScore(existing.passingScore);
        setStatus(existing.status);
        setAssignedClassIds(existing.assignedClassIds);
        setIsPublic(existing.isPublic);

        setShuffleQuestions(existing.settings.shuffleQuestions);
        setShuffleOptions(existing.settings.shuffleOptions);
        setShowOneByOne(existing.settings.showOneByOne);
        setAllowBacktrack(existing.settings.allowBacktrack);
        setAutoSubmitOnTimeUp(existing.settings.autoSubmitOnTimeUp);
        setAllowAnonymous(existing.settings.allowAnonymous);
        setRequirePassword(existing.settings.requirePassword);
        setPassword(existing.settings.password || '');
        setShowScoreImmediately(existing.settings.showScoreImmediately);
        setShowAnswersImmediately(existing.settings.showAnswersImmediately);
        setShowExplanationAfterClose(existing.settings.showExplanationAfterClose);
        setTrackTabSwitches(existing.settings.trackTabSwitches);
        setMaxAttempts(existing.settings.maxAttempts);

        setQuestions(existing.questions);
      }
    } else if (isNew) {
      // Default to 4 sample questions from bank
      const initialBank = store.getQuestions().slice(0, 4);
      setQuestions(
        initialBank.map((q, idx) => ({
          questionId: q.id,
          points: 2.5,
          order: idx + 1,
          question: q
        }))
      );
    }
  }, [examId, isNew]);

  const currentTotalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  // Auto distribute points evenly
  const handleAutoBalancePoints = () => {
    if (questions.length === 0) return;
    const pts = Number((maxScore / questions.length).toFixed(2));
    setQuestions(
      questions.map((q, idx) => ({
        ...q,
        points: pts,
        order: idx + 1
      }))
    );
    success('Đã chia đều điểm', `Mỗi câu ${pts} điểm (Tổng ${maxScore}đ).`);
  };

  // Reorder
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const next = [...questions];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    // re-assign order
    setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // Remove question
  const removeQuestion = (index: number) => {
    const next = questions.filter((_, i) => i !== index);
    setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // Add questions from bank
  const handleAddFromBank = () => {
    const newItems: ExamQuestionItem[] = [];
    const existingIds = new Set(questions.map((q) => q.questionId));

    selectedBankIds.forEach((qid) => {
      if (!existingIds.has(qid)) {
        const q = bankQuestions.find((item) => item.id === qid);
        if (q) {
          newItems.push({
            questionId: q.id,
            points: 1.0,
            order: questions.length + newItems.length + 1,
            question: q
          });
        }
      }
    });

    const updated = [...questions, ...newItems];
    setQuestions(updated);
    setSelectedBankIds(new Set());
    setShowBankModal(false);
    success('Đã thêm câu hỏi', `Đã thêm ${newItems.length} câu từ ngân hàng.`);
  };

  // Quick 1-click re-select correct answer for multiple-choice questions
  const handleToggleCorrectAnswer = (questionIndex: number, optionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next = [...questions];
    const qItem = next[questionIndex];
    if (!qItem || !qItem.question) return;

    const currentQ = { ...qItem.question };
    const currentAnswers = currentQ.correctAnswers || [];
    const isMultiple = currentQ.type === 'multiple_choice' || currentQ.type === 'multiple_select';

    let newAnswers: string[];
    if (isMultiple) {
      if (currentAnswers.includes(optionId)) {
        if (currentAnswers.length <= 1) {
          warning('Cần ít nhất 1 đáp án', 'Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng.');
          return;
        }
        newAnswers = currentAnswers.filter((a) => a !== optionId);
      } else {
        newAnswers = [...currentAnswers, optionId];
      }
    } else {
      // Single choice, true_false, etc.
      newAnswers = [optionId];
    }

    currentQ.correctAnswers = newAnswers;
    qItem.question = currentQ;
    setQuestions(next);

    // Synchronize to store if present in question bank
    try {
      store.updateQuestion(currentQ.id, { correctAnswers: newAnswers });
    } catch {}

    success('Đã cập nhật đáp án đúng', `Câu ${questionIndex + 1}: Đã chọn [${newAnswers.join(', ')}] làm đáp án chính xác.`);
  };

  // Open Question Edit Modal
  const openEditQuestionModal = (index: number) => {
    const qItem = questions[index];
    if (!qItem || !qItem.question) return;
    const q = qItem.question;
    setEditingIndex(index);
    setEditFormContent(q.content);
    setEditFormType(q.type || 'single_choice');
    setEditFormPoints(Number(qItem.points) || 1);
    setEditFormOptions(
      q.options && q.options.length > 0
        ? JSON.parse(JSON.stringify(q.options))
        : [
            { id: 'A', content: '' },
            { id: 'B', content: '' },
            { id: 'C', content: '' },
            { id: 'D', content: '' }
          ]
    );
    setEditFormCorrectAnswers(q.correctAnswers ? [...q.correctAnswers] : ['A']);
    setEditFormExplanation(q.explanation || '');
    setEditFormCognitiveLevel(q.cognitiveLevel || 'understand');
    setEditFormDifficulty(q.difficulty || 'medium');
    setEditFormTopic(q.topic || 'Chung');
  };

  // Toggle correct answer inside the edit modal
  const handleToggleEditOptionAnswer = (optId: string) => {
    const isMultiple = editFormType === 'multiple_choice' || editFormType === 'multiple_select';
    if (isMultiple) {
      if (editFormCorrectAnswers.includes(optId)) {
        if (editFormCorrectAnswers.length <= 1) {
          warning('Cần ít nhất 1 đáp án', 'Phải có ít nhất một đáp án đúng.');
          return;
        }
        setEditFormCorrectAnswers(editFormCorrectAnswers.filter((a) => a !== optId));
      } else {
        setEditFormCorrectAnswers([...editFormCorrectAnswers, optId]);
      }
    } else {
      setEditFormCorrectAnswers([optId]);
    }
  };

  // Add an option in edit modal
  const handleAddOptionInEdit = () => {
    const nextLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = nextLetters[editFormOptions.length] || `OPT${editFormOptions.length + 1}`;
    setEditFormOptions([...editFormOptions, { id: nextLetter, content: '' }]);
  };

  // Remove an option in edit modal
  const handleRemoveOptionInEdit = (optIndex: number) => {
    if (editFormOptions.length <= 2) {
      warning('Không thể xóa', 'Câu trắc nghiệm cần tối thiểu 2 phương án.');
      return;
    }
    const removedId = editFormOptions[optIndex].id;
    const nextOpts = editFormOptions.filter((_, idx) => idx !== optIndex);
    setEditFormOptions(nextOpts);
    // If the removed option was in correctAnswers, reset to first option
    if (editFormCorrectAnswers.includes(removedId)) {
      const remainingCorrect = editFormCorrectAnswers.filter((a) => a !== removedId);
      setEditFormCorrectAnswers(remainingCorrect.length > 0 ? remainingCorrect : [nextOpts[0].id]);
    }
  };

  // Save changes from Edit Modal
  const handleSaveEditedQuestion = () => {
    if (editingIndex === null) return;
    if (!editFormContent.trim()) {
      warning('Thiếu nội dung', 'Vui lòng nhập nội dung câu hỏi.');
      return;
    }
    if (['single_choice', 'multiple_choice', 'true_false'].includes(editFormType) && editFormCorrectAnswers.length === 0) {
      warning('Chưa chọn đáp án', 'Vui lòng chọn ít nhất một đáp án đúng.');
      return;
    }

    const next = [...questions];
    const target = next[editingIndex];
    if (!target) return;

    const isChoiceType = ['single_choice', 'multiple_choice', 'true_false'].includes(editFormType);
    const updatedQuestion: Question = {
      ...target.question,
      content: editFormContent.trim(),
      type: editFormType,
      options: isChoiceType ? editFormOptions : undefined,
      correctAnswers: editFormCorrectAnswers,
      explanation: editFormExplanation.trim(),
      cognitiveLevel: editFormCognitiveLevel,
      difficulty: editFormDifficulty,
      topic: editFormTopic.trim() || 'Chung',
      updatedAt: new Date().toISOString()
    };

    next[editingIndex] = {
      ...target,
      points: Number(editFormPoints) || 1,
      question: updatedQuestion
    };

    setQuestions(next);
    try {
      store.updateQuestion(updatedQuestion.id, updatedQuestion);
    } catch {}

    setEditingIndex(null);
    success('Đã lưu câu hỏi', `Câu ${editingIndex + 1} đã được cập nhật nội dung và đáp án thành công.`);
  };

  // Save Exam
  const handleSave = (openSettingsAfterSave = false): Exam | null => {
    if (!title.trim()) {
      warning('Thiếu tiêu đề', 'Vui lòng nhập tên đề thi.');
      return null;
    }
    if (questions.length === 0) {
      warning('Chưa có câu hỏi', 'Đề thi phải có ít nhất 1 câu hỏi.');
      return null;
    }

    const payload = {
      title,
      description,
      subject,
      grade,
      durationMinutes,
      maxScore,
      passingScore,
      status,
      assignedClassIds,
      isPublic,
      settings: {
        shuffleQuestions,
        shuffleOptions,
        showOneByOne,
        allowBacktrack,
        autoSubmitOnTimeUp,
        allowAnonymous,
        requirePassword,
        password,
        showScoreImmediately,
        showAnswersImmediately,
        showExplanationAfterClose,
        trackTabSwitches,
        maxAttempts
      },
      questions: questions.map((q, idx) => ({
        questionId: q.questionId,
        points: Number(q.points),
        order: idx + 1,
        question: q.question
      }))
    };

    let targetExam: Exam | null = null;
    if (isNew) {
      const created = store.addExam(payload);
      targetExam = created;
      setExamForAssignModal(created);
      success('Tạo đề thành công', `Đề thi "${title}" đã được tạo.`);
      if (openSettingsAfterSave) {
        setShowAssignModal(true);
      } else {
        setShowPostCreatePrompt(true);
      }
      navigate(`/teacher/exam-builder/${created.id}`, { replace: true });
    } else if (examId) {
      store.updateExam(examId, payload);
      targetExam = store.getExamById(examId) || null;
      if (targetExam) {
        setExamForAssignModal(targetExam);
      }
      success('Lưu thay đổi', 'Thông tin đề thi đã được cập nhật.');
      if (openSettingsAfterSave) {
        setShowAssignModal(true);
      }
    }

    return targetExam;
  };

  const filteredBank = bankQuestions.filter((q) => {
    return (
      q.content.toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.topic.toLowerCase().includes(bankSearch.toLowerCase())
    );
  });

  return (
    <div id="exam-builder-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/exams')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {title || 'Tạo đề thi mới'}
              </h2>
              <ExamStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {questions.length} câu hỏi • Tổng điểm: <strong>{currentTotalPoints.toFixed(1)}/{maxScore}đ</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && examId && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Chia sẻ</span>
              </button>
              <Link
                to={`/exam/${examId}`}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Xem thử</span>
              </Link>
            </>
          )}

          {/* Quick Save */}
          <button
            id="btn-save-exam"
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Lưu đề thi</span>
          </button>

          {/* Cài đặt bài làm Button */}
          <button
            id="btn-assign-exam-settings"
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
            title="Cài đặt bài làm: thời gian làm, giao lớp, bảo mật chống gian lận, xem điểm & lời giải"
          >
            <Sliders className="w-4 h-4" />
            <span>Cài đặt bài làm</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'questions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Danh sách câu hỏi ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cấu hình chung</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Trải nghiệm & Chống gian lận</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Tổng số: <strong>{questions.length} câu</strong></span>
              <span>•</span>
              <span className={currentTotalPoints !== maxScore ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                Tổng điểm: {currentTotalPoints.toFixed(2)}/{maxScore}đ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoBalancePoints}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Chia đều điểm</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBankModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Thêm từ Ngân hàng</span>
              </button>
            </div>
          </div>

          {/* Question List Items */}
          <div className="space-y-3">
            {questions.map((qItem, idx) => {
              const q = qItem.question;
              if (!q) return null;

              return (
                <div
                  key={`${qItem.questionId}-${idx}`}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-xs rounded-md">
                        Câu {idx + 1}
                      </span>
                      <QuestionTypeBadge type={q.type} />
                      <CognitiveLevelBadge level={q.cognitiveLevel} />
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                        {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Points input */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-semibold">Điểm:</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="10"
                          value={qItem.points}
                          onChange={(e) => {
                            const next = [...questions];
                            next[idx].points = Number(e.target.value);
                            setQuestions(next);
                          }}
                          className="w-16 px-2 py-1 border border-slate-300 rounded-md text-xs font-bold text-blue-700 text-center"
                        />
                      </div>

                      {/* Actions: Edit, Reorder, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditQuestionModal(idx)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          title="Chỉnh sửa nội dung và đáp án câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa câu</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => moveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md transition-colors"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md transition-colors"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 ml-0.5 transition-colors"
                          title="Xóa câu khỏi đề"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.content}
                  </div>

                  {/* Interactive Options Preview & Re-selection */}
                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                          Bấm trực tiếp vào phương án A, B, C, D để đổi đáp án đúng nhanh:
                        </span>
                        <span className="text-slate-400">
                          {q.type === 'multiple_choice' || q.type === 'multiple_select'
                            ? '(Có thể chọn nhiều đáp án đúng)'
                            : '(Chỉ có 1 đáp án đúng)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt) => {
                          const isCorrect = q.correctAnswers.includes(opt.id);
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={(e) => handleToggleCorrectAnswer(idx, opt.id, e)}
                              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer group ${
                                isCorrect
                                  ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400/40 shadow-xs'
                                  : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 hover:text-slate-900'
                              }`}
                              title={isCorrect ? 'Đáp án đúng hiện tại. Bấm để bỏ chọn nếu là nhiều đáp án' : `Bấm để chọn [${opt.id}] làm đáp án đúng`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="flex-1 leading-snug">{opt.content}</span>
                              {isCorrect ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  Đáp án đúng
                                </span>
                              ) : (
                                <span className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  Chọn làm đáp án đúng
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Non-multiple-choice: short answer or essay display */}
                  {(!q.options || q.options.length === 0) && q.correctAnswers && q.correctAnswers.length > 0 && (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <span className="font-bold">Đáp án chuẩn: </span>
                      {q.correctAnswers.join(', ')}
                    </div>
                  )}

                  {/* Explanation preview if available */}
                  {q.explanation && (
                    <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-blue-900">Lời giải chi tiết: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action & Summary Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Tổng cộng: <strong className="text-slate-900">{questions.length} câu hỏi</strong> • Điểm hiện tại:{' '}
              <strong className="text-blue-600 font-bold">
                {currentTotalPoints.toFixed(1)}/{maxScore}đ
              </strong>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAutoBalancePoints}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Chia đều điểm
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu đề thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL CONFIG */}
      {activeTab === 'general' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên đề thi *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mô tả / Hướng dẫn làm bài</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hướng dẫn học sinh các quy chế làm bài, không sử dụng tài liệu..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Thời gian (phút)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Thang điểm tối đa</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Điểm đạt (Qua môn)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Trạng thái phát hành</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Exam['status'])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
            >
              <option value="published">Đang mở (Học sinh có thể vào làm bài ngay)</option>
              <option value="draft">Bản nháp (Chỉ giáo viên thấy)</option>
              <option value="closed">Đã đóng (Không nhận thêm bài nộp)</option>
            </select>
          </div>

          {/* Assigned Classes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Giao cho các lớp học:</label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((c) => {
                const checked = assignedClassIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                      checked ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedClassIds([...assignedClassIds, c.id]);
                          else setAssignedClassIds(assignedClassIds.filter((id) => id !== c.id));
                        }}
                        className="rounded-sm text-blue-600"
                      />
                      <span>{c.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & EXPERIENCE */}
      {activeTab === 'security' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Trải nghiệm phòng thi & Chống gian lận</h4>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Xáo trộn thứ tự câu hỏi</span>
                <span className="text-slate-500 text-[11px]">Mỗi học sinh sẽ nhận được thứ tự câu hỏi ngẫu nhiên khác nhau.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Xáo trộn các phương án A, B, C, D</span>
                <span className="text-slate-500 text-[11px]">Đảo ngẫu nhiên vị trí các lựa chọn trong từng câu trắc nghiệm.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={trackTabSwitches}
                onChange={(e) => setTrackTabSwitches(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Giám sát chuyển tab / Thoát màn hình thi</span>
                <span className="text-slate-500 text-[11px]">Hệ thống ghi nhận và cảnh báo nếu học sinh chuyển sang tab khác trong khi làm bài.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSubmitOnTimeUp}
                onChange={(e) => setAutoSubmitOnTimeUp(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Tự động nộp bài khi hết giờ</span>
                <span className="text-slate-500 text-[11px]">Tự động thu bài và khóa form làm bài ngay khi đồng hồ đếm ngược về 00:00.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Xem kết quả & Lời giải</h4>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showScoreImmediately}
                onChange={(e) => setShowScoreImmediately(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Hiển thị điểm số ngay sau khi nộp</span>
                <span className="text-slate-500 text-[11px]">Học sinh biết ngay kết quả phần trắc nghiệm sau khi hoàn thành.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnswersImmediately}
                onChange={(e) => setShowAnswersImmediately(e.target.checked)}
                className="mt-0.5 rounded-sm text-blue-600"
              />
              <div>
                <span className="font-semibold text-slate-800 block">Hiển thị đáp án đúng & Lời giải chi tiết</span>
                <span className="text-slate-500 text-[11px]">Cho phép học sinh xem lời giải để tự rút kinh nghiệm.</span>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Số lần nộp bài tối đa</label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={1}>1 lần duy nhất (Thi chính thức)</option>
                  <option value={2}>2 lần (Luyện tập)</option>
                  <option value={3}>3 lần</option>
                  <option value={99}>Không giới hạn</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Chọn câu hỏi từ Ngân hàng câu hỏi</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <input
                type="text"
                placeholder="Tìm theo nội dung, chủ đề..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
              {filteredBank.map((q, qIdx) => {
                const isSelected = selectedBankIds.has(q.id);
                const isAlreadyInExam = questions.some((item) => item.questionId === q.id);

                return (
                  <label
                    key={`${q.id}-${qIdx}`}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isAlreadyInExam
                        ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isAlreadyInExam}
                      checked={isSelected || isAlreadyInExam}
                      onChange={(e) => {
                        const next = new Set(selectedBankIds);
                        if (e.target.checked) next.add(q.id);
                        else next.delete(q.id);
                        setSelectedBankIds(next);
                      }}
                      className="mt-1 rounded-sm text-blue-600"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <QuestionTypeBadge type={q.type} />
                        <CognitiveLevelBadge level={q.cognitiveLevel} />
                        <span className="text-[11px] text-slate-400">{q.topic}</span>
                        {isAlreadyInExam && <span className="text-[10px] text-amber-600 font-bold">(Đã có trong đề)</span>}
                      </div>
                      <p className="font-semibold text-slate-900 leading-snug">{q.content}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Đã chọn {selectedBankIds.size} câu mới</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddFromBank}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Thêm vào đề thi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  #{editingIndex + 1}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Chỉnh sửa chi tiết Câu hỏi {editingIndex + 1}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chỉnh sửa nội dung câu hỏi, phương án lựa chọn và chọn lại đáp án đúng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs custom-scrollbar">
              {/* Meta row: Type, Points, Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Loại câu hỏi</label>
                  <select
                    value={editFormType}
                    onChange={(e) => setEditFormType(e.target.value as QuestionType)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 outline-hidden focus:border-blue-600"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án đúng (A, B, C, D)</option>
                    <option value="multiple_choice">Trắc nghiệm nhiều đáp án đúng</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Điền đáp án ngắn (số / chữ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Điểm số</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="10"
                    value={editFormPoints}
                    onChange={(e) => setEditFormPoints(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-blue-700 outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chủ đề / Bài học</label>
                  <input
                    type="text"
                    value={editFormTopic}
                    onChange={(e) => setEditFormTopic(e.target.value)}
                    placeholder="Ví dụ: Đại số, Hàm số bậc nhất..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Cognitive level and difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mức độ nhận thức</label>
                  <select
                    value={editFormCognitiveLevel}
                    onChange={(e) => setEditFormCognitiveLevel(e.target.value as CognitiveLevel)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 outline-hidden focus:border-blue-600"
                  >
                    <option value="recognize">Nhận biết</option>
                    <option value="understand">Thông hiểu</option>
                    <option value="apply">Vận dụng</option>
                    <option value="advanced">Vận dụng cao</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Độ khó</label>
                  <select
                    value={editFormDifficulty}
                    onChange={(e) => setEditFormDifficulty(e.target.value as Difficulty)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 outline-hidden focus:border-blue-600"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  value={editFormContent}
                  onChange={(e) => setEditFormContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 leading-relaxed font-medium outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Options Section for Multiple Choice */}
              {['single_choice', 'multiple_choice', 'true_false'].includes(editFormType) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-semibold text-slate-800 block text-xs">
                        Các phương án trả lời & Chọn đáp án đúng:
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        👉 Bấm trực tiếp vào ô chữ cái <strong>A, B, C, D</strong> để chọn/đổi đáp án chính xác (màu xanh lá là đáp án đúng).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddOptionInEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm phương án</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editFormOptions.map((opt, oIdx) => {
                      const isCorrect = editFormCorrectAnswers.includes(opt.id);

                      return (
                        <div
                          key={opt.id || oIdx}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400/40'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {/* Option selector button */}
                          <button
                            type="button"
                            onClick={() => handleToggleEditOptionAnswer(opt.id)}
                            className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                            }`}
                            title={
                              isCorrect
                                ? 'Đây là đáp án đúng. Bấm để bỏ chọn nếu có nhiều đáp án'
                                : `Bấm để đặt phương án [${opt.id}] làm đáp án đúng`
                            }
                          >
                            {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
                          </button>

                          {/* Content input */}
                          <input
                            type="text"
                            value={opt.content}
                            onChange={(e) => {
                              const nextOpts = [...editFormOptions];
                              nextOpts[oIdx].content = e.target.value;
                              setEditFormOptions(nextOpts);
                            }}
                            placeholder={`Nội dung phương án ${opt.id}...`}
                            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-hidden focus:border-blue-600"
                          />

                          {/* Status Badge */}
                          {isCorrect && (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] shrink-0">
                              Đáp án đúng
                            </span>
                          )}

                          {/* Delete Option */}
                          {editFormOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionInEdit(oIdx)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Xóa phương án này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short Answer Input */}
              {editFormType === 'short_answer' && (
                <div className="space-y-1.5 pt-2">
                  <label className="font-semibold text-slate-700 block">Đáp án chuẩn (cho tự động chấm):</label>
                  <input
                    type="text"
                    value={editFormCorrectAnswers[0] || ''}
                    onChange={(e) => setEditFormCorrectAnswers([e.target.value])}
                    placeholder="Ví dụ: 12 hoặc x=4..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 outline-hidden focus:border-blue-600"
                  />
                </div>
              )}

              {/* Explanation Input */}
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700 block">Lời giải chi tiết & hướng dẫn chấm:</label>
                <textarea
                  rows={3}
                  value={editFormExplanation}
                  onChange={(e) => setEditFormExplanation(e.target.value)}
                  placeholder="Nhập các bước giải chi tiết, công thức, giải thích lý do chọn đáp án..."
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 leading-relaxed outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Đáp án đúng đã chọn:{' '}
                <strong className="text-emerald-700">
                  {editFormCorrectAnswers.length > 0 ? `[${editFormCorrectAnswers.join(', ')}]` : 'Chưa chọn'}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedQuestion}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu thay đổi câu hỏi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && examId && (
        <QRModal
          isOpen={showShareModal}
          title={`Đề thi: ${title}`}
          subtitle={`Thời gian: ${durationMinutes} phút • Thang 10đ`}
          url={`/exam/${examId}`}
          code={examId.slice(-6).toUpperCase()}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Post Creation Prompt Modal (Azota style) */}
      {showPostCreatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Tạo đề thi thành công
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">{title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đề thi đã được lưu vào hệ thống. Bạn có muốn <strong>Cài đặt bài làm</strong> (thời hạn nộp, chỉ định lớp làm bài, mật khẩu, chống gian lận) để học sinh vào làm ngay không?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="btn-post-create-assign"
                onClick={() => {
                  setShowPostCreatePrompt(false);
                  setShowAssignModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Cài đặt bài làm ngay</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostCreatePrompt(false)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Ở lại soạn câu hỏi
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/exams')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Về danh sách đề
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Azota Assign Exam & Settings Modal */}
      {showAssignModal && examForAssignModal && (
        <AssignExamModal
          isOpen={showAssignModal}
          exam={examForAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={(updated) => {
            setExamForAssignModal(updated);
            if (updated.settings) {
              setShuffleQuestions(updated.settings.shuffleQuestions);
              setShuffleOptions(updated.settings.shuffleOptions);
              setRequirePassword(updated.settings.requirePassword);
              setPassword(updated.settings.password || '');
              setTrackTabSwitches(updated.settings.trackTabSwitches);
              setMaxAttempts(updated.settings.maxAttempts);
            }
            setShowAssignModal(false);
            setInfoModalExam(updated);
          }}
        />
      )}

      {/* Exam Information Popup */}
      {infoModalExam && (
        <ExamInfoModal
          isOpen={Boolean(infoModalExam)}
          exam={infoModalExam}
          onClose={() => setInfoModalExam(null)}
          onAssign={(exam) => {
            setInfoModalExam(null);
            setExamForAssignModal(exam);
            setShowAssignModal(true);
          }}
        />
      )}
    </div>
  );
};
