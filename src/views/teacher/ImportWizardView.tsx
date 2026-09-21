import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Share2,
  QrCode,
  Layers,
  Zap,
  BookOpen,
  Sliders,
  Eye
} from 'lucide-react';
import { aiService, ExtractedQuestionResult } from '../../services/aiService';
import { store } from '../../services/store';
import { Question, CognitiveLevel, Difficulty, QuestionType, Exam } from '../../types';
import { CognitiveLevelBadge, DifficultyBadge, QuestionTypeBadge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { AssignExamModal } from './components/AssignExamModal';
import { ExamInfoModal } from './components/ExamInfoModal';
import { useToast } from '../../context/ToastContext';

const SAMPLE_DOCS = [
  {
    title: 'Đề kiểm tra 1 tiết Toán 9 - Chương I: Căn bậc hai (Mẫu chuẩn)',
    grade: 'Khối 9',
    subject: 'Toán học',
    text: `ĐỀ KIỂM TRA CHƯƠNG I: CĂN BẬC HAI - ĐẠI SỐ 9
Thời gian: 45 phút

PHẦN I. TRẮC NGHIỆM KHÁCH QUAN (7,0 điểm)

Câu 1. (Nhận biết) Điều kiện xác định của biểu thức \\sqrt{3x - 6} là:
A. x >= 2
B. x <= 2
C. x > 2
D. x < 2
Đáp án đúng: A
Lời giải chi tiết: Biểu thức dưới dấu căn không âm khi 3x - 6 >= 0 <=> 3x >= 6 <=> x >= 2.

Câu 2. (Thông hiểu) Giá trị của biểu thức \\sqrt{(2 - \\sqrt{5})^2} bằng:
A. 2 - \\sqrt{5}
B. \\sqrt{5} - 2
C. 2 + \\sqrt{5}
D. -2 - \\sqrt{5}
Đáp án đúng: B
Lời giải chi tiết: Vì 2 < \\sqrt{5} nên 2 - \\sqrt{5} < 0. Do đó \\sqrt{(2 - \\sqrt{5})^2} = |2 - \\sqrt{5}| = \\sqrt{5} - 2.

Câu 3. (Vận dụng) Rút gọn biểu thức P = \\sqrt{75} - \\sqrt{48} + \\sqrt{300} ta được kết quả là:
A. 11\\sqrt{3}
B. 9\\sqrt{3}
C. 13\\sqrt{3}
D. 7\\sqrt{3}
Đáp án đúng: A
Lời giải chi tiết: P = 5\\sqrt{3} - 4\\sqrt{3} + 10\\sqrt{3} = (5 - 4 + 10)\\sqrt{3} = 11\\sqrt{3}.

Câu 4. (Thông hiểu) Nghiệm của phương trình \\sqrt{x - 3} = 4 là:
A. x = 7
B. x = 19
C. x = 13
D. x = 11
Đáp án đúng: B
Lời giải chi tiết: ĐK x >= 3. Bình phương hai vế ta được: x - 3 = 16 <=> x = 19 (thỏa mãn ĐK).

PHẦN II. TỰ LUẬN (3,0 điểm)

Câu 5. (Tự luận - Vận dụng cao) Cho biểu thức A = (\\sqrt{x}/(\\sqrt{x}+2) + 4/(\\sqrt{x}-2)) : (x+4)/(x-4) với x >= 0, x != 4.
a) Rút gọn biểu thức A.
b) Tìm tất cả giá trị của x nguyên để biểu thức A nhận giá trị nguyên dương.
Đáp án đúng: Tự luận
Lời giải chi tiết: Quy đồng mẫu số và rút gọn thu được A = (x+4)/(x+4) ... Kết hợp điều kiện ta có x thuộc {9, 16}.`
  },
  {
    title: 'Đề ôn tập giữa kì I - Hình học 9: Hệ thức lượng trong tam giác vuông',
    grade: 'Khối 9',
    subject: 'Toán học',
    text: `ĐỀ ÔN TẬP HỆ THỨC LƯỢNG TRONG TAM GIÁC VUÔNG - HÌNH HỌC 9

Câu 1. (Nhận biết) Cho tam giác ABC vuông tại A có đường cao AH. Hệ thức nào sau đây là ĐÚNG?
A. AH^2 = HB . HC
B. AB^2 = BH . BC
C. AH . BC = AB . AC
D. Cả A, B, C đều đúng
Đáp án đúng: D
Lời giải chi tiết: Theo định lý 1, 2 và 3 về hệ thức lượng trong tam giác vuông, cả 3 đẳng thức trên đều chính xác.

Câu 2. (Thông hiểu) Cho tam giác ABC vuông tại A, biết AB = 6cm, AC = 8cm. Độ dài đường cao AH là:
A. 4.8 cm
B. 5 cm
C. 10 cm
D. 2.4 cm
Đáp án đúng: A
Lời giải chi tiết: BC = \\sqrt{AB^2 + AC^2} = 10cm. AH = (AB * AC) / BC = (6 * 8) / 10 = 4.8cm.

Câu 3. (Vận dụng) Cho tam giác ABC vuông tại A, góc B = 30 độ, cạnh BC = 12cm. Độ dài cạnh AB xấp xỉ bằng:
A. 10.39 cm
B. 6 cm
C. 8.48 cm
D. 9.5 cm
Đáp án đúng: A
Lời giải chi tiết: AB = BC * cos(30 độ) = 12 * (\\sqrt{3}/2) = 6\\sqrt{3} ≈ 10.39 cm.`
  }
];

export const ImportWizardView: React.FC = () => {
  const navigate = useNavigate();
  const { success, warning, error } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 states
  const [docTitle, setDocTitle] = useState('Đề kiểm tra 1 tiết Toán 9 - Chương I Căn thức');
  const [docSubject, setDocSubject] = useState('Toán học');
  const [docGrade, setDocGrade] = useState('Khối 9');
  const [rawText, setRawText] = useState(SAMPLE_DOCS[0].text);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Options
  const [optExtractMatrix, setOptExtractMatrix] = useState(true);
  const [optExtractExplanation, setOptExtractExplanation] = useState(true);

  // Step 2 processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Step 3 extracted questions
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Step 4 final publish options
  const [examTitle, setExamTitle] = useState(docTitle);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [targetClassIds, setTargetClassIds] = useState<string[]>(['class-9a1']);
  const [saveToBank, setSaveToBank] = useState(true);
  const [createOnlineExam, setCreateOnlineExam] = useState(true);
  const [publishedExamId, setPublishedExamId] = useState<string | null>(null);
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [infoModalExam, setInfoModalExam] = useState<Exam | null>(null);

  const classes = store.getClasses();

  // Load preset sample
  const handleLoadSample = (sample: typeof SAMPLE_DOCS[0]) => {
    setDocTitle(sample.title);
    setExamTitle(sample.title);
    setDocSubject(sample.subject);
    setDocGrade(sample.grade);
    setRawText(sample.text);
    setUploadedFileName(null);
    success('Đã nạp đề mẫu', `Đã tải: ${sample.title}`);
  };

  // Simulated file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    setExamTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Read text file if txt, else mock reading Word/PDF text
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    } else {
      // Use rich realistic sample for docx/pdf preview
      setRawText(SAMPLE_DOCS[0].text);
    }
    success('Đã tải lên tệp', file.name);
  };

  // Step 1 -> Step 2 AI extraction
  const handleStartExtraction = async () => {
    if (!rawText.trim()) {
      warning('Chưa có nội dung', 'Vui lòng dán văn bản đề thi hoặc tải file lên.');
      return;
    }

    setStep(2);
    setIsProcessing(true);
    setProcessLogs([]);
    setProgressPercent(10);

    const logTimer1 = setTimeout(() => {
      setProcessLogs((prev) => [...prev, 'Đang đọc và phân tích cấu trúc tài liệu Word/PDF...']);
      setProgressPercent(30);
    }, 400);

    const logTimer2 = setTimeout(() => {
      setProcessLogs((prev) => [...prev, 'Đang nhận diện các khối câu hỏi, công thức toán và phương án...']);
      setProgressPercent(60);
    }, 900);

    const logTimer3 = setTimeout(() => {
      setProcessLogs((prev) => [...prev, 'Đang trích xuất ma trận nhận thức (Nhận biết, Thông hiểu, Vận dụng)...']);
      setProgressPercent(85);
    }, 1400);

    try {
      const result = await aiService.extractQuestionsFromDoc(rawText, uploadedFileName || undefined);
      const qList = result.questions || [];
      setProgressPercent(100);
      setProcessLogs((prev) => [...prev, `Hoàn tất! Đã trích xuất thành công ${qList.length} câu hỏi.`]);

      setTimeout(() => {
        setExtractedQuestions(qList);
        if (result.title) {
          setExamTitle(result.title);
        }
        setIsProcessing(false);
        setStep(3);
        success('Bóc tách AI hoàn tất', `Nhận diện ${qList.length} câu hỏi.`);
      }, 500);
    } catch (err: any) {
      setIsProcessing(false);
      error('Lỗi phân tích', 'Không thể bóc tách đề thi. Vui lòng kiểm tra lại văn bản.');
      setStep(1);
    } finally {
      clearTimeout(logTimer1);
      clearTimeout(logTimer2);
      clearTimeout(logTimer3);
    }
  };

  // Step 3 Actions
  const handleUpdateExtracted = (idx: number, updated: ExtractedQuestionResult) => {
    const next = [...extractedQuestions];
    next[idx] = updated;
    setExtractedQuestions(next);
    setEditingIndex(null);
    success('Đã cập nhật câu hỏi', `Câu ${idx + 1}`);
  };

  const handleUpdateExtractedWithoutClosing = (idx: number, updated: ExtractedQuestionResult) => {
    const next = [...extractedQuestions];
    next[idx] = updated;
    setExtractedQuestions(next);
  };

  // Re-select / toggle correct answer for multiple-choice questions
  const handleToggleOptionAnswer = (qIdx: number, optionId: string) => {
    const q = extractedQuestions[qIdx];
    if (!q) return;
    const isMultiple = q.type === 'multiple_choice';
    const currentAnswers = q.correctAnswers || [];
    let nextAnswers: string[];
    if (isMultiple) {
      if (currentAnswers.includes(optionId)) {
        if (currentAnswers.length <= 1) {
          warning('Cần ít nhất 1 đáp án', 'Phải có tối thiểu 1 đáp án đúng.');
          return;
        }
        nextAnswers = currentAnswers.filter((a) => a !== optionId);
      } else {
        nextAnswers = [...currentAnswers, optionId];
      }
    } else {
      nextAnswers = [optionId];
    }
    const updated = { ...q, correctAnswers: nextAnswers };
    const next = [...extractedQuestions];
    next[qIdx] = updated;
    setExtractedQuestions(next);
    success('Đã cập nhật đáp án đúng', `Câu ${qIdx + 1}: Đáp án đúng chuyển sang [${nextAnswers.join(', ')}]`);
  };

  const handleDeleteExtracted = (idx: number) => {
    const next = extractedQuestions.filter((_, i) => i !== idx);
    setExtractedQuestions(next);
    success('Đã xóa câu hỏi', `Còn lại ${next.length} câu.`);
  };

  // Step 4: Finalize
  const handleFinalize = () => {
    if (extractedQuestions.length === 0) {
      warning('Không có câu hỏi', 'Danh sách câu hỏi đang trống.');
      return;
    }

    const createdQuestionEntities: Question[] = [];

    // Save to Question Bank
    extractedQuestions.forEach((eq) => {
      const q = store.addQuestion({
        type: eq.type,
        content: eq.content,
        subject: docSubject,
        grade: docGrade,
        topic: eq.topic || 'Kiểm tra tổng hợp',
        knowledgeUnit: eq.knowledgeUnit,
        cognitiveLevel: eq.cognitiveLevel,
        difficulty: eq.difficulty,
        options: eq.options,
        correctAnswers: eq.correctAnswers,
        explanation: eq.explanation,
        tags: [docSubject, docGrade, eq.topic].filter(Boolean) as string[],
        status: 'published'
      });
      createdQuestionEntities.push(q);
    });

    if (createOnlineExam) {
      const pointsPerQuestion = Number((10 / createdQuestionEntities.length).toFixed(2));
      const newExam = store.addExam({
        title: examTitle,
        description: `Đề kiểm tra trích xuất tự động từ tài liệu: ${docTitle}`,
        subject: docSubject,
        grade: docGrade,
        durationMinutes: durationMinutes,
        maxScore: 10,
        passingScore: 5,
        status: 'published',
        assignedClassIds: targetClassIds,
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
          maxAttempts: 3
        },
        questions: createdQuestionEntities.map((q, idx) => ({
          questionId: q.id,
          points: pointsPerQuestion,
          order: idx + 1,
          question: q
        }))
      });

      setPublishedExamId(newExam.id);
      setPublishedExam(newExam);
      success('Tạo bài thi thành công', `Đề "${newExam.title}" đã sẵn sàng cho học sinh!`);
    } else {
      success('Đã lưu vào ngân hàng', `Đã lưu ${createdQuestionEntities.length} câu hỏi vào ngân hàng.`);
      navigate('/teacher/question-bank');
    }
  };

  return (
    <div id="import-wizard-view" className="max-w-5xl mx-auto space-y-6">
      {/* Wizard Step Indicator */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: '1. Tải đề / Dán text' },
            { num: 2, label: '2. AI Bóc tách' },
            { num: 3, label: '3. Kiểm tra & Hiệu chỉnh' },
            { num: 4, label: '4. Xuất bản đề' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    step === s.num
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden md:inline ${
                    step === s.num ? 'text-blue-600' : step > s.num ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: UPLOAD & PASTE */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Nhập đề thi bằng Trợ lý AI</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tải lên tài liệu Word/PDF hoặc dán đề thi có sẵn. AI tự động tách câu hỏi, đáp án và bảng ma trận.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Nạp đề mẫu:</span>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_DOCS[0])}
                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                Đề Căn thức 9
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_DOCS[1])}
                className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                Đề Hệ thức lượng 9
              </button>
            </div>
          </div>

          {/* Config Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên tài liệu / Tên đề *</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => {
                    setDocTitle(e.target.value);
                    setExamTitle(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Môn học</label>
                <input
                  type="text"
                  value={docSubject}
                  onChange={(e) => setDocSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Khối lớp</label>
                <select
                  value={docGrade}
                  onChange={(e) => setDocGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
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
            </div>

            {/* Drag Drop Area */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tải tệp đề thi (Word .docx, PDF, Text .txt)</label>
              <label
                htmlFor="input-file-doc"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 rounded-2xl cursor-pointer transition-all group text-center"
              >
                <FileUp className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                  {uploadedFileName ? `Tệp đã chọn: ${uploadedFileName}` : 'Nhấn để chọn file Word / PDF hoặc kéo thả vào đây'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Hỗ trợ file .docx, .doc, .pdf, .txt lên tới 25MB</span>
                <input
                  id="input-file-doc"
                  type="file"
                  accept=".docx,.doc,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Paste */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Hoặc dán nội dung văn bản đề thi vào đây:</label>
                <span className="text-[11px] text-slate-400">{rawText.length} ký tự</span>
              </div>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán nội dung đề thi, câu hỏi, các phương án A, B, C, D và đáp án chi tiết..."
                className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Smart Extraction checkboxes */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optExtractMatrix}
                  onChange={(e) => setOptExtractMatrix(e.target.checked)}
                  className="rounded-sm text-blue-600 focus:ring-blue-500"
                />
                <span>Tự động phân loại mức độ nhận thức (Nhận biết, Vận dụng...)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optExtractExplanation}
                  onChange={(e) => setOptExtractExplanation(e.target.checked)}
                  className="rounded-sm text-blue-600 focus:ring-blue-500"
                />
                <span>Tự động bóc tách lời giải chi tiết và đáp án đúng</span>
              </label>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              id="btn-trigger-ai-extract"
              onClick={handleStartExtraction}
              className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Bắt đầu phân tích & Tách câu hỏi bằng AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROCESSING ANIMATION */}
      {step === 2 && (
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-6 animate-fade-in max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">AI đang phân tích tài liệu đề thi</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Trợ lý AI đang bóc tách từng câu hỏi, công thức toán học và xây dựng ma trận đánh giá năng lực học sinh...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Logs */}
          <div className="p-4 bg-slate-950 text-slate-300 rounded-xl text-left font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
            {processLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & EDIT */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Kiểm tra & Hiệu chỉnh kết quả ({extractedQuestions.length} câu hỏi)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem lại nội dung, dạng câu, đáp án đúng và ma trận trước khi xuất bản thành bài thi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Nhập lại
              </button>
              <button
                id="btn-goto-step-4"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>Tiếp tục tạo bài thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="space-y-4">
            {extractedQuestions.map((q, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={idx}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-md">
                        Câu {idx + 1}
                      </span>
                      <QuestionTypeBadge type={q.type} />
                      <CognitiveLevelBadge level={q.cognitiveLevel} />
                      <DifficultyBadge difficulty={q.difficulty} />
                      {q.topic && (
                        <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                          {q.topic}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingIndex(isEditing ? null : idx)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa câu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExtracted(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Xóa câu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline View or Edit */}
                  {!isEditing ? (
                    <div className="space-y-2.5">
                      <p className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                        {q.content}
                      </p>

                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Bấm trực tiếp vào phương án để đổi đáp án đúng:</span>
                            <span>{q.type === 'multiple_choice' ? '(Nhiều đáp án)' : '(1 đáp án đúng)'}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => {
                              const isCorrect = q.correctAnswers.includes(opt.id);
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => handleToggleOptionAnswer(idx, opt.id)}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 text-left transition-all cursor-pointer group ${
                                    isCorrect
                                      ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400/30 shadow-xs'
                                      : 'bg-slate-50/60 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700'
                                  }`}
                                  title={isCorrect ? 'Đáp án đúng hiện tại. Bấm để bỏ chọn nếu là nhiều đáp án' : `Bấm để đặt [${opt.id}] làm đáp án đúng`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 transition-colors ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                                    }`}
                                  >
                                    {opt.id}
                                  </span>
                                  <span className="flex-1 leading-snug">{opt.content}</span>
                                  {isCorrect ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Đúng
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                      Chọn
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-blue-900">Lời giải chi tiết: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit Form inline */
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nội dung câu hỏi</label>
                        <textarea
                          rows={3}
                          value={q.content}
                          onChange={(e) => {
                            const next = { ...q, content: e.target.value };
                            handleUpdateExtractedWithoutClosing(idx, next);
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs outline-hidden focus:border-blue-600"
                        />
                      </div>

                      {q.options && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-slate-700 block">Các lựa chọn & Chọn đáp án đúng:</label>
                            <span className="text-[11px] text-slate-500 italic">Bấm nút chữ cái để đặt làm đáp án đúng</span>
                          </div>
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswers.includes(opt.id);
                            return (
                              <div key={opt.id} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleOptionAnswer(idx, opt.id)}
                                  className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs transition-all shadow-xs cursor-pointer shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                                      : 'bg-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white'
                                  }`}
                                  title={isCorrect ? 'Đáp án đúng' : `Bấm để đặt phương án [${opt.id}] làm đáp án đúng`}
                                >
                                  {opt.id}
                                </button>
                                <input
                                  type="text"
                                  value={opt.content}
                                  onChange={(e) => {
                                    const nextOptions = [...q.options!];
                                    nextOptions[oIdx].content = e.target.value;
                                    handleUpdateExtractedWithoutClosing(idx, { ...q, options: nextOptions });
                                  }}
                                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-hidden focus:border-blue-600"
                                />
                                {isCorrect && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] shrink-0">
                                    Đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: FINALIZE & PUBLISH */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
          {!publishedExamId ? (
            <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Xuất bản đề thi trực tuyến</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình thời gian làm bài, lớp phân công và lưu trữ vào ngân hàng câu hỏi
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tiêu đề bài thi *</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Thời gian làm bài (phút)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Thang điểm tổng</label>
                    <input
                      type="text"
                      disabled
                      value="10.0 điểm"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-blue-700"
                    />
                  </div>
                </div>

                {/* Class assign selector */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">Giao cho các lớp học:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classes.map((c) => {
                      const isChecked = targetClassIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetClassIds([...targetClassIds, c.id]);
                                } else {
                                  setTargetClassIds(targetClassIds.filter((id) => id !== c.id));
                                }
                              }}
                              className="rounded-sm text-blue-600"
                            />
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{c.grade}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Destination options */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createOnlineExam}
                      onChange={(e) => setCreateOnlineExam(e.target.checked)}
                      className="rounded-sm text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Tạo đề thi trực tuyến (Học sinh có thể vào làm ngay)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToBank}
                      onChange={(e) => setSaveToBank(e.target.checked)}
                      className="rounded-sm text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Lưu tất cả câu hỏi vào Ngân hàng câu hỏi của tôi</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại sửa câu</span>
                </button>

                <button
                  id="btn-publish-exam-final"
                  type="button"
                  onClick={handleFinalize}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Xuất bản</span>
                </button>
              </div>
            </div>
          ) : (
            /* Success Published Card */
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Đề thi đã được xuất bản thành công!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Học sinh có thể quét mã QR hoặc truy cập đường link để làm bài ngay trên điện thoại hoặc máy tính.
                </p>
              </div>

              {/* Share actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-open-published-assign"
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  title="Cài đặt thời gian thi, đối tượng làm bài, mật khẩu & chống gian lận"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Cài đặt bài làm</span>
                </button>

                <button
                  id="btn-open-published-qr"
                  onClick={() => setShowQRModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Xem mã QR & Sao chép Link</span>
                </button>

                <Link
                  to={`/exam/${publishedExamId}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Mở thử như học sinh</span>
                </Link>

                <Link
                  to="/teacher/exams"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  <span>Về danh sách đề thi</span>
                </Link>
              </div>

              {/* QR Modal */}
              {showQRModal && (
                <QRModal
                  isOpen={showQRModal}
                  title={`Đề thi: ${examTitle}`}
                  subtitle={`Thời gian: ${durationMinutes} phút • Thang 10đ`}
                  url={`/exam/${publishedExamId}`}
                  code={publishedExamId.slice(-6).toUpperCase()}
                  onClose={() => setShowQRModal(false)}
                />
              )}

              {/* Azota Assign Exam & Settings Modal */}
              {showAssignModal && publishedExam && (
                <AssignExamModal
                  isOpen={showAssignModal}
                  exam={publishedExam}
                  onClose={() => setShowAssignModal(false)}
                  onSuccess={(updated) => {
                    setPublishedExam(updated);
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
                    setPublishedExam(exam);
                    setShowAssignModal(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
