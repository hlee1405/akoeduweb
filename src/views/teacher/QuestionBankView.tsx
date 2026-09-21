import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database,
  Plus,
  Search,
  Filter,
  FileUp,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Square,
  BookOpen
} from 'lucide-react';
import { store } from '../../services/store';
import { Question, QuestionType, CognitiveLevel, Difficulty } from '../../types';
import {
  CognitiveLevelBadge,
  DifficultyBadge,
  QuestionTypeBadge
} from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export const QuestionBankView: React.FC = () => {
  const navigate = useNavigate();
  const { success, warning } = useToast();
  const [questions, setQuestions] = useState<Question[]>(store.getQuestions());

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Question Modal Create / Edit / Preview
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  // Form states
  const [formType, setFormType] = useState<QuestionType>('single_choice');
  const [formContent, setFormContent] = useState('');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formGrade, setFormGrade] = useState('Khối 9');
  const [formTopic, setFormTopic] = useState('Căn bậc hai & Căn bậc ba');
  const [formKnowledgeUnit, setFormKnowledgeUnit] = useState('');
  const [formCognitiveLevel, setFormCognitiveLevel] = useState<CognitiveLevel>('understand');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('medium');
  const [formOptions, setFormOptions] = useState([
    { id: 'A', content: '' },
    { id: 'B', content: '' },
    { id: 'C', content: '' },
    { id: 'D', content: '' }
  ]);
  const [formCorrectAnswers, setFormCorrectAnswers] = useState<string[]>(['A']);
  const [formExplanation, setFormExplanation] = useState('');
  const [formTags, setFormTags] = useState('Toán 9, Căn thức');

  useEffect(() => {
    const handleStore = () => setQuestions(store.getQuestions());
    const unsub = store.subscribe(handleStore);
    return unsub;
  }, []);

  const topics = Array.from(new Set(questions.map((q) => q.topic).filter(Boolean)));

  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.knowledgeUnit && q.knowledgeUnit.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    const matchType = selectedType === 'all' || q.type === selectedType;
    const matchLevel = selectedLevel === 'all' || q.cognitiveLevel === selectedLevel;
    const matchDiff = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;

    return matchSearch && matchTopic && matchType && matchLevel && matchDiff;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleCreateExamFromSelected = () => {
    if (selectedIds.size === 0) {
      warning('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để tạo đề thi.');
      return;
    }
    const selectedList = questions.filter((q) => selectedIds.has(q.id));
    const newExam = store.addExam({
      title: `Đề thi từ ngân hàng (${selectedList.length} câu)`,
      description: `Đề thi tổng hợp gồm các chủ đề: ${Array.from(new Set(selectedList.map((q) => q.topic))).join(', ')}`,
      subject: selectedList[0]?.subject || 'Toán học',
      grade: selectedList[0]?.grade || 'Khối 9',
      durationMinutes: Math.max(15, selectedList.length * 3),
      maxScore: 10,
      passingScore: 5,
      status: 'draft',
      assignedClassIds: [],
      isPublic: true,
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        showOneByOne: false,
        allowBacktrack: true,
        autoSubmitOnTimeUp: true,
        allowAnonymous: true,
        requirePassword: false,
        showScoreImmediately: true,
        showAnswersImmediately: true,
        showExplanationAfterClose: true,
        trackTabSwitches: true,
        maxAttempts: 2
      },
      questions: selectedList.map((q, idx) => ({
        questionId: q.id,
        points: Number((10 / selectedList.length).toFixed(2)),
        order: idx + 1,
        question: q
      }))
    });

    success('Tạo đề thành công', `Đã tạo đề thi gồm ${selectedList.length} câu hỏi.`);
    navigate(`/teacher/exam-builder/${newExam.id}`);
  };

  const openFormModal = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setFormType(q.type);
      setFormContent(q.content);
      setFormSubject(q.subject);
      setFormGrade(q.grade);
      setFormTopic(q.topic);
      setFormKnowledgeUnit(q.knowledgeUnit || '');
      setFormCognitiveLevel(q.cognitiveLevel);
      setFormDifficulty(q.difficulty);
      setFormOptions(q.options || [
        { id: 'A', content: '' },
        { id: 'B', content: '' },
        { id: 'C', content: '' },
        { id: 'D', content: '' }
      ]);
      setFormCorrectAnswers(q.correctAnswers);
      setFormExplanation(q.explanation);
      setFormTags(q.tags.join(', '));
    } else {
      setEditingQuestion(null);
      setFormType('single_choice');
      setFormContent('');
      setFormSubject('Toán học');
      setFormGrade('Khối 9');
      setFormTopic('Căn bậc hai & Căn bậc ba');
      setFormKnowledgeUnit('');
      setFormCognitiveLevel('understand');
      setFormDifficulty('medium');
      setFormOptions([
        { id: 'A', content: '' },
        { id: 'B', content: '' },
        { id: 'C', content: '' },
        { id: 'D', content: '' }
      ]);
      setFormCorrectAnswers(['A']);
      setFormExplanation('');
      setFormTags('Toán 9');
    }
    setShowModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const payload = {
      type: formType,
      content: formContent,
      subject: formSubject,
      grade: formGrade,
      topic: formTopic,
      knowledgeUnit: formKnowledgeUnit,
      cognitiveLevel: formCognitiveLevel,
      difficulty: formDifficulty,
      options: ['single_choice', 'multiple_choice', 'true_false'].includes(formType) ? formOptions : undefined,
      correctAnswers: formCorrectAnswers,
      explanation: formExplanation,
      tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      status: 'published' as const
    };

    if (editingQuestion) {
      store.updateQuestion(editingQuestion.id, payload);
      success('Cập nhật câu hỏi', 'Đã lưu thay đổi vào ngân hàng câu hỏi.');
    } else {
      store.addQuestion(payload);
      success('Thêm câu hỏi mới', 'Đã thêm câu hỏi vào ngân hàng câu hỏi.');
    }

    setShowModal(false);
  };

  const handleDuplicate = (id: string) => {
    const dup = store.duplicateQuestion(id);
    if (dup) success('Đã nhân bản', 'Tạo bản sao câu hỏi thành công.');
  };

  const handleDeleteConfirm = () => {
    if (deleteQuestionId) {
      store.deleteQuestion(deleteQuestionId);
      success('Đã xóa câu hỏi', 'Câu hỏi đã được xóa khỏi ngân hàng.');
      setDeleteQuestionId(null);
    }
  };

  // Quick 1-click re-select correct answer directly from question bank list
  const handleQuickToggleAnswer = (q: Question, optionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentAnswers = q.correctAnswers || [];
    const isMultiple = q.type === 'multiple_choice' || q.type === 'multiple_select';
    let nextAnswers: string[];
    if (isMultiple) {
      if (currentAnswers.includes(optionId)) {
        if (currentAnswers.length <= 1) {
          warning('Cần ít nhất 1 đáp án', 'Câu hỏi trắc nghiệm phải có tối thiểu 1 đáp án đúng.');
          return;
        }
        nextAnswers = currentAnswers.filter((a) => a !== optionId);
      } else {
        nextAnswers = [...currentAnswers, optionId];
      }
    } else {
      nextAnswers = [optionId];
    }
    store.updateQuestion(q.id, { correctAnswers: nextAnswers });
    setQuestions(store.getQuestions());
    success('Đã đổi đáp án đúng', `Đã chọn [${nextAnswers.join(', ')}] làm đáp án đúng.`);
  };

  return (
    <div id="question-bank-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ngân hàng Câu hỏi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng <strong>{questions.length} câu hỏi</strong> được phân loại theo ma trận nhận thức và độ khó
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-goto-ai-import"
            onClick={() => navigate('/teacher/import-wizard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Nhập đề AI (Word/PDF)</span>
          </button>
          <button
            id="btn-create-question-manual"
            onClick={() => openFormModal()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi, công thức, đơn vị kiến thức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-800 outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Tất cả chủ đề ({questions.length})</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Tất cả dạng câu</option>
            <option value="single_choice">Trắc nghiệm 1 đáp án</option>
            <option value="multiple_choice">Nhiều đáp án đúng</option>
            <option value="true_false">Đúng / Sai</option>
            <option value="short_answer">Điền từ / Trả lời ngắn</option>
            <option value="essay">Tự luận</option>
          </select>

          {/* Cognitive Level */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Tất cả mức độ nhận thức</option>
            <option value="recognize">Nhận biết</option>
            <option value="understand">Thông hiểu</option>
            <option value="apply">Vận dụng</option>
            <option value="advanced">Vận dụng cao</option>
          </select>

          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-blue-600 text-white rounded-xl shadow-md text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-white" />
            <span>Đã chọn {selectedIds.size} câu hỏi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors"
            >
              Bỏ chọn
            </button>
            <button
              id="btn-batch-create-exam"
              onClick={handleCreateExamFromSelected}
              className="px-4 py-1.5 bg-white text-blue-900 rounded-lg shadow-sm hover:bg-blue-50 transition-colors font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề thi từ {selectedIds.size} câu này</span>
            </button>
          </div>
        </div>
      )}

      {/* Question List Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
          <button
            onClick={selectAll}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Chọn tất cả ({filteredQuestions.length} câu)</span>
          </button>
        </div>

        {filteredQuestions.map((q, idx) => {
          const isSelected = selectedIds.has(q.id);

          return (
            <div
              key={`${q.id}-${idx}`}
              className={`p-5 rounded-2xl border transition-all bg-white ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleSelect(q.id)}
                    className="mt-1 text-slate-400 hover:text-blue-600 flex-shrink-0 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div className="space-y-2 flex-1">
                    {/* Tags & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <QuestionTypeBadge type={q.type} />
                      <CognitiveLevelBadge level={q.cognitiveLevel} />
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                        {q.topic}
                      </span>
                    </div>

                    {/* Question Content */}
                    <div className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                      {q.content}
                    </div>

                    {/* Options Preview & Quick Answer Re-selection */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Bấm vào phương án để đổi đáp án đúng nhanh:</span>
                          <span>{q.type === 'multiple_choice' ? '(Nhiều đáp án)' : '(1 đáp án đúng)'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const isCorrect = q.correctAnswers.includes(opt.id);
                            return (
                              <button
                                type="button"
                                key={opt.id}
                                onClick={(e) => handleQuickToggleAnswer(q, opt.id, e)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 text-left transition-all cursor-pointer group ${
                                  isCorrect
                                    ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400/30 shadow-xs'
                                    : 'bg-slate-50/60 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700'
                                }`}
                                title={isCorrect ? 'Đáp án đúng hiện tại. Bấm để bỏ chọn nếu có nhiều đáp án' : `Bấm để đặt [${opt.id}] làm đáp án đúng`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 transition-colors ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                                  }`}
                                >
                                  {opt.id}
                                </span>
                                <span className="flex-1 truncate">{opt.content}</span>
                                {isCorrect ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    Đúng
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    Chọn
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation snippet */}
                    {q.explanation && (
                      <div className="mt-2 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-blue-900">Lời giải: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions per question */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDuplicate(q.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Nhân bản câu hỏi"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openFormModal(q)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Chỉnh sửa câu hỏi"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteQuestionId(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi vào ngân hàng'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dạng câu hỏi</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="multiple_choice">Nhiều đáp án đúng</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Điền từ / Trả lời ngắn</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mức độ nhận thức</label>
                  <select
                    value={formCognitiveLevel}
                    onChange={(e) => setFormCognitiveLevel(e.target.value as CognitiveLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chủ đề</label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đơn vị kiến thức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Rút gọn biểu thức"
                    value={formKnowledgeUnit}
                    onChange={(e) => setFormKnowledgeUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập nội dung câu hỏi hoặc công thức toán học..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Options Section for Choices */}
              {['single_choice', 'multiple_choice', 'true_false'].includes(formType) && (
                <div className="space-y-2 pt-2">
                  <label className="font-semibold text-slate-700 block">Các phương án & Đáp án đúng *</label>
                  {formOptions.map((opt, optIdx) => {
                    const isChecked = formCorrectAnswers.includes(opt.id);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (formType === 'single_choice') {
                              setFormCorrectAnswers([opt.id]);
                            } else {
                              if (isChecked) {
                                setFormCorrectAnswers(formCorrectAnswers.filter((a) => a !== opt.id));
                              } else {
                                setFormCorrectAnswers([...formCorrectAnswers, opt.id]);
                              }
                            }
                          }}
                          className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs transition-colors ${
                            isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </button>
                        <input
                          type="text"
                          required
                          placeholder={`Nội dung phương án ${opt.id}...`}
                          value={opt.content}
                          onChange={(e) => {
                            const next = [...formOptions];
                            next[optIdx].content = e.target.value;
                            setFormOptions(next);
                          }}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {formType === 'short_answer' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Đáp án đúng (ngăn cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 6, x=6, x = 6"
                    value={formCorrectAnswers.join(', ')}
                    onChange={(e) => setFormCorrectAnswers(e.target.value.split(',').map((s) => s.trim()))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hướng dẫn giải chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Lời giải chi tiết từng bước cho học sinh xem lại sau bài thi..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingQuestion ? 'Lưu thay đổi' : 'Thêm vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteQuestionId)}
        title="Xác nhận xóa câu hỏi"
        message="Câu hỏi này sẽ bị xóa vĩnh viễn khỏi ngân hàng câu hỏi của thầy cô."
        confirmText="Xóa câu hỏi"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteQuestionId(null)}
      />
    </div>
  );
};
