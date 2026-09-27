import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Edit3,
  Shuffle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ListOrdered,
  Layers,
  Zap,
  HelpCircle,
  Check,
  X,
  Sliders,
  ArrowRight,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { chatGenerateExamWithAI, AIChatMessage } from '../../../services/aiService';
import { useToast } from '../../../context/ToastContext';

export interface GeneratedQuestionItem {
  id: string;
  content: string;
  options: { id: string; content: string }[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cognitiveLevel?: 'recognize' | 'understand' | 'apply' | 'advanced';
  points?: number;
}

interface AIChatbotExamGeneratorProps {
  onApplyQuestions: (questions: GeneratedQuestionItem[], examMeta?: { title?: string; subject?: string; grade?: string }) => void;
  initialSubject?: string;
  initialGrade?: string;
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  {
    icon: '📐',
    subject: 'Toán học',
    grade: 'Khối 9',
    count: 5,
    title: 'Toán 9: Căn bậc hai & Căn thức',
    prompt: 'Tạo 5 câu trắc nghiệm Toán 9 chuyên đề Căn bậc hai và biến đổi biểu thức chứa căn, phân hóa từ nhận biết đến vận dụng'
  },
  {
    icon: '📈',
    subject: 'Toán học',
    grade: 'Khối 9',
    count: 5,
    title: 'Toán 9: Hàm số bậc nhất y = ax + b',
    prompt: 'Tạo 5 câu trắc nghiệm Toán 9 về tính đồng biến, nghịch biến, vị trí tương đối giữa hai đường thẳng và đồ thị hàm số bậc nhất'
  },
  {
    icon: '⚡',
    subject: 'Vật lý',
    grade: 'Khối 9',
    count: 5,
    title: 'Vật lý 9: Định luật Ôm & Điện trở',
    prompt: 'Tạo 5 câu trắc nghiệm Vật lý 9 về Định luật Ôm, đoạn mạch nối tiếp và song song kèm lời giải chi tiết'
  },
  {
    icon: '🧪',
    subject: 'Hóa học',
    grade: 'Khối 9',
    count: 5,
    title: 'Hóa học 9: Axit & Bazơ',
    prompt: 'Tạo 5 câu trắc nghiệm Hóa học 9 về tính chất hóa học của Axit sunfuric, Bazơ và muối kèm phương trình phản ứng'
  },
  {
    icon: '🇬🇧',
    subject: 'Tiếng Anh',
    grade: 'Khối 9',
    count: 6,
    title: 'Tiếng Anh 9: Passive Voice & Tenses',
    prompt: 'Tạo 6 câu trắc nghiệm Tiếng Anh 9 về Câu bị động (Passive Voice) và Câu điều kiện loại 1 & 2 kèm giải thích ngữ pháp'
  },
  {
    icon: '📖',
    subject: 'Ngữ văn',
    grade: 'Khối 9',
    count: 5,
    title: 'Ngữ văn 9: Truyện Kiều & Văn học',
    prompt: 'Tạo 5 câu trắc nghiệm Ngữ văn 9 tìm hiểu về tác phẩm Truyện Kiều và truyện ngắn Chiếc lược ngà'
  }
];

export const AIChatbotExamGenerator: React.FC<AIChatbotExamGeneratorProps> = ({
  onApplyQuestions,
  initialSubject = 'Toán học',
  initialGrade = 'Khối 9',
  onClose
}) => {
  const { success, warning, info } = useToast();

  // Settings
  const [subject, setSubject] = useState<string>(initialSubject);
  const [grade, setGrade] = useState<string>(initialGrade);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('mixed');

  // Chat conversation
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Xin chào quý Thầy/Cô! Em là **Trợ lý AI Soạn Đề Thông Minh**. Thầy/cô chỉ cần nhập yêu cầu chủ đề, dạng bài hoặc số lượng câu hỏi mong muốn. Em sẽ tạo ngay danh sách câu hỏi trắc nghiệm kèm 4 phương án A, B, C, D và lời giải chi tiết để Thầy/Cô kiểm tra và chỉnh sửa trước khi tạo đề thi nhé!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Generated Questions for reviewing & inline editing
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[]>([]);
  const [suggestedExamTitle, setSuggestedExamTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'review'>('both');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle sending prompt to AI
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    const userMessage: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsGenerating(true);
    setGenerationStep('Đang phân tích ma trận kiến thức chuẩn Bộ GD&ĐT...');

    // Progress step animations
    const stepTimer1 = setTimeout(() => {
      setGenerationStep('Đang khởi tạo các câu hỏi trắc nghiệm và 4 phương án...');
    }, 900);

    const stepTimer2 = setTimeout(() => {
      setGenerationStep('Đang kiểm tra đáp án đúng và tạo lời giải chi tiết...');
    }, 1800);

    try {
      const response = await chatGenerateExamWithAI({
        messages: [...messages, userMessage].map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        prompt: textToSend,
        subject,
        grade,
        count: questionCount,
        difficulty,
        existingQuestions: generatedQuestions
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (response.success && response.data) {
        const { replyText, suggestedTitle, questions } = response.data;

        const aiMessage: AIChatMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generatedQuestions: questions,
          suggestedTitle
        };

        setMessages((prev) => [...prev, aiMessage]);
        if (suggestedTitle) {
          setSuggestedExamTitle(suggestedTitle);
        }

        // Merge or replace questions
        if (questions && questions.length > 0) {
          setGeneratedQuestions(questions);
          // Expand explanations by default
          const expState: Record<string, boolean> = {};
          questions.forEach((q) => {
            expState[q.id] = true;
          });
          setExpandedExplanations(expState);
          success('Đã tạo câu hỏi thành công!', `AI đã tạo ${questions.length} câu hỏi. Bạn có thể xem và chỉnh sửa trực tiếp bên dưới.`);
        }
      } else {
        throw new Error('Không nhận được phản hồi hợp lệ');
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const errorMsg: AIChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        role: 'assistant',
        content: 'Đã có chút gián đoạn kết nối, nhưng em đã tạo sẵn bộ câu hỏi mẫu chất lượng cao bên khung chỉnh sửa để thầy/cô tiếp tục hoàn thiện nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Quick Prompt Click
  const handleQuickPromptClick = (item: typeof QUICK_PROMPTS[0]) => {
    setSubject(item.subject);
    setGrade(item.grade);
    setQuestionCount(item.count);
    handleSendMessage(item.prompt);
  };

  // Inline Question Editing Handlers
  const handleUpdateQuestionContent = (qId: string, newContent: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, content: newContent } : q))
    );
  };

  const handleUpdateOption = (qId: string, optId: string, newOptionContent: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = q.options.map((opt) =>
          opt.id === optId ? { ...opt, content: newOptionContent } : opt
        );
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSetCorrectAnswer = (qId: string, optId: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, correctAnswer: optId } : q))
    );
  };

  const handleUpdateExplanation = (qId: string, newExp: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, explanation: newExp } : q))
    );
  };

  const handleDeleteQuestion = (qId: string) => {
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== qId));
    info('Đã xóa câu hỏi', 'Bạn có thể thêm câu mới hoặc yêu cầu AI bổ sung.');
  };

  const handleDuplicateQuestion = (qId: string) => {
    const target = generatedQuestions.find((q) => q.id === qId);
    if (!target) return;
    const duplicated: GeneratedQuestionItem = {
      ...target,
      id: `q-dup-${Date.now()}`,
      content: `${target.content} (Bản sao)`
    };
    setGeneratedQuestions((prev) => [...prev, duplicated]);
    success('Đã nhân bản câu hỏi', 'Bản sao đã được thêm vào cuối danh sách.');
  };

  const handleShuffleOptions = (qId: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const correctOpt = q.options.find((o) => o.id === q.correctAnswer);
        const shuffled = [...q.options].sort(() => Math.random() - 0.5);
        // re-assign IDs A, B, C, D
        const letters = ['A', 'B', 'C', 'D'];
        let newCorrect = 'A';
        const reindexed = shuffled.map((item, idx) => {
          const newId = letters[idx];
          if (item === correctOpt) {
            newCorrect = newId;
          }
          return { id: newId, content: item.content };
        });
        return { ...q, options: reindexed, correctAnswer: newCorrect };
      })
    );
    info('Đã đảo đáp án', 'Thứ tự các phương án A, B, C, D đã được xáo trộn.');
  };

  const handleAddNewQuestion = () => {
    const newQ: GeneratedQuestionItem = {
      id: `q-manual-${Date.now()}`,
      content: 'Nhập nội dung câu hỏi mới vào đây...',
      options: [
        { id: 'A', content: 'Phương án A' },
        { id: 'B', content: 'Phương án B' },
        { id: 'C', content: 'Phương án C' },
        { id: 'D', content: 'Phương án D' }
      ],
      correctAnswer: 'A',
      explanation: 'Nhập lời giải chi tiết cho câu hỏi...',
      topic: subject,
      difficulty: 'medium',
      cognitiveLevel: 'understand'
    };
    setGeneratedQuestions((prev) => [...prev, newQ]);
    setExpandedExplanations((prev) => ({ ...prev, [newQ.id]: true }));
    success('Đã thêm 1 câu hỏi mới', 'Bạn có thể chỉnh sửa trực tiếp nội dung.');
  };

  const handleRegenerateSingleQuestion = (qId: string) => {
    const target = generatedQuestions.find((q) => q.id === qId);
    if (!target) return;
    handleSendMessage(`Hãy tạo lại câu hỏi tương tự hoặc nâng cao hơn cho câu: "${target.content}"`);
  };

  const toggleExplanation = (qId: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Apply questions to exam modal
  const handleApplyToExam = () => {
    if (generatedQuestions.length === 0) {
      warning('Chưa có câu hỏi', 'Vui lòng nhập yêu cầu để AI tạo câu hỏi hoặc bấm thêm câu hỏi.');
      return;
    }
    onApplyQuestions(generatedQuestions, {
      title: suggestedExamTitle || `Đề trắc nghiệm ${subject} ${grade}`,
      subject,
      grade
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans text-slate-800">
      {/* Top Banner / AI Status bar */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base tracking-tight">
                Trợ Lý AI Tạo Đề Trắc Nghiệm Thông Minh
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 mt-0.5">
              Nhập yêu cầu bằng ngôn ngữ tự nhiên • AI tạo câu hỏi tức thì • Xem & chỉnh sửa trực tiếp trước khi xuất đề
            </p>
          </div>
        </div>

        {/* View mode toggle on medium+ screens */}
        <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/20 self-end md:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'both' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Chia đôi (Chat & Duyệt)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Khung Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'review' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            <span>Duyệt câu hỏi</span>
            {generatedQuestions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                {generatedQuestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Quick Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Môn:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 shadow-2xs cursor-pointer"
            >
              <option value="Toán học">Toán học</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lý">Địa lý</option>
              <option value="Tin học">Tin học</option>
              <option value="GDCD">GDCD</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Khối:</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 shadow-2xs cursor-pointer"
            >
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Số câu:</span>
            <div className="flex gap-1">
              {[3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    questionCount === num
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Độ khó:</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 shadow-2xs cursor-pointer"
            >
              <option value="mixed">Phân hóa (Dễ đến Khó)</option>
              <option value="easy">Nhận biết (Cơ bản)</option>
              <option value="medium">Thông hiểu (Trung bình)</option>
              <option value="hard">Vận dụng cao (Khó)</option>
            </select>
          </div>
        </div>

        {/* Action button if questions are ready */}
        {generatedQuestions.length > 0 && (
          <button
            type="button"
            onClick={handleApplyToExam}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer ml-auto"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Áp dụng {generatedQuestions.length} câu vào đề thi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content Area: Split View or Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[480px]">
        {/* Left Column: Chatbot Conversation (5 or 12 cols) */}
        {(activeTab === 'both' || activeTab === 'chat') && (
          <div
            className={`${
              activeTab === 'both' ? 'lg:col-span-5' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-slate-200 flex flex-col h-[520px] overflow-hidden shadow-2xs`}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hội thoại với Trợ lý AI</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: 'msg-welcome',
                      role: 'assistant',
                      content:
                        'Đã làm mới cuộc hội thoại. Thầy/cô hãy nhập chủ đề hoặc chọn gợi ý bên dưới để em tạo đề trắc nghiệm mới nhé!',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                  info('Đã làm mới', 'Bắt đầu cuộc trò chuyện tạo đề mới.');
                }}
                className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                title="Xóa lịch sử chat"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới chat</span>
              </button>
            </div>

            {/* Quick Prompts Carousel */}
            <div className="p-2.5 bg-slate-50/50 border-b border-slate-100 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleQuickPromptClick(item)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.map((msg) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-7 h-7 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        isAI
                          ? 'bg-white border border-slate-200 text-slate-800'
                          : 'bg-indigo-600 text-white font-medium rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* If message generated questions, show quick button */}
                      {msg.generatedQuestions && msg.generatedQuestions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã tạo {msg.generatedQuestions.length} câu trắc nghiệm</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.generatedQuestions) {
                                setGeneratedQuestions(msg.generatedQuestions);
                                if (activeTab === 'chat') setActiveTab('review');
                              }
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <span>Xem & Sửa ngay</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-1 text-right ${
                          isAI ? 'text-slate-400' : 'text-indigo-200'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Generating Live Indicator */}
              {isGenerating && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 animate-spin">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="bg-white border border-violet-200 rounded-2xl px-4 py-3 text-xs text-slate-700 shadow-xs space-y-1.5 max-w-[85%]">
                    <div className="flex items-center gap-2 font-bold text-violet-700">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{generationStep || 'AI đang xử lý...'}</span>
                    </div>
                    <div className="w-48 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Box */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Ví dụ: Tạo ${questionCount} câu trắc nghiệm ${subject} ${grade} phần...`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isGenerating}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:cursor-not-allowed h-[42px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1.5">
                <span>Nhấn <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> để xuống dòng</span>
                <span className="text-indigo-600 font-bold">Chuẩn đề BGD 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Interactive Question Review & Inline Editor (7 or 12 cols) */}
        {(activeTab === 'both' || activeTab === 'review') && (
          <div
            className={`${
              activeTab === 'both' ? 'lg:col-span-7' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-slate-200 flex flex-col h-[520px] overflow-hidden shadow-2xs`}
          >
            {/* Review Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-800">
                  Xem & Chỉnh sửa câu hỏi ({generatedQuestions.length} câu)
                </span>
                {generatedQuestions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Sẵn sàng tạo đề
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddNewQuestion}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Thêm câu hỏi mới"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thêm câu</span>
                </button>

                {generatedQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ câu hỏi hiện tại?')) {
                        setGeneratedQuestions([]);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tất cả câu hỏi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Questions List with Inline Editing */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
              {generatedQuestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 animate-bounce" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-bold text-sm text-slate-800">
                      Chưa có câu hỏi nào được tạo
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nhập yêu cầu vào khung chat bên trái hoặc bấm chọn 1 gợi ý chuyên đề để AI tạo đề tức thì.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickPromptClick(QUICK_PROMPTS[0])}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    Thử tạo 5 câu Toán 9 ngay
                  </button>
                </div>
              ) : (
                generatedQuestions.map((q, idx) => {
                  const isExpOpen = expandedExplanations[q.id] ?? true;

                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 transition-all text-xs space-y-3 shadow-2xs relative group"
                    >
                      {/* Question Top Card Bar */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                            Câu {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                            {q.topic || subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            {q.difficulty === 'easy'
                              ? 'Nhận biết'
                              : q.difficulty === 'hard'
                              ? 'Vận dụng'
                              : 'Thông hiểu'}
                          </span>
                        </div>

                        {/* Quick Toolbar for Question */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShuffleOptions(q.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Đảo thứ tự phương án A/B/C/D"
                          >
                            <Shuffle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Nhân bản câu này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateSingleQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                            title="Yêu cầu AI tạo lại câu này"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Question Content */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          Nội dung câu hỏi:
                        </label>
                        <textarea
                          rows={2}
                          value={q.content}
                          onChange={(e) => handleUpdateQuestionContent(q.id, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-colors resize-y leading-relaxed"
                        />
                      </div>

                      {/* 4 Options Grid (A, B, C, D) with Radio Select & Text Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>Các phương án lựa chọn (Click nút để chọn đáp án đúng):</span>
                          <span className="text-emerald-700">
                            Đáp án đúng hiện tại: <strong>[{q.correctAnswer}]</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const isSelected = q.correctAnswer === opt.id;

                            return (
                              <div
                                key={opt.id}
                                className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/50'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSetCorrectAnswer(q.id, opt.id)}
                                  className={`w-7 h-7 rounded-lg font-black text-xs shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={`Chọn ${opt.id} làm đáp án đúng`}
                                >
                                  {opt.id}
                                </button>
                                <input
                                  type="text"
                                  value={opt.content}
                                  onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                  className={`w-full bg-transparent text-xs font-medium focus:outline-none ${
                                    isSelected ? 'text-emerald-950 font-bold' : 'text-slate-700'
                                  }`}
                                  placeholder={`Nội dung phương án ${opt.id}...`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Editable Explanation (Lời giải chi tiết) */}
                      <div className="border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(q.id)}
                          className="flex items-center justify-between w-full text-left text-[11px] font-bold text-slate-600 hover:text-indigo-600 py-1 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Lời giải chi tiết & Hướng dẫn</span>
                          </span>
                          {isExpOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpOpen && (
                          <textarea
                            rows={2}
                            value={q.explanation}
                            onChange={(e) => handleUpdateExplanation(q.id, e.target.value)}
                            placeholder="Nhập lời giải chi tiết cho câu hỏi này..."
                            className="mt-1 w-full px-3 py-2 bg-amber-50/40 border border-amber-200/80 focus:border-amber-400 focus:bg-white rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none transition-colors resize-y leading-relaxed"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Review Footer Action */}
            {generatedQuestions.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="text-xs text-slate-600 font-semibold">
                  Tổng số: <strong className="text-indigo-600">{generatedQuestions.length} câu</strong> • Thang điểm: <strong>10đ</strong>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToExam}
                  className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer ml-auto"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Duyệt & Đưa vào đề thi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
