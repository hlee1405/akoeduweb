import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Upload,
  Zap,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
  ChevronRight,
  ListOrdered,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Edit3,
  ExternalLink,
  Check,
  Sliders,
  Camera
} from 'lucide-react';
import { Exam, Question, ExamQuestionItem } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';
import { ExamInfoModal } from './ExamInfoModal';

interface AzotaCreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndAssign: (exam: Exam) => void;
  onSaveToRepository?: (exam: Exam) => void;
  initialClassId?: string;
  initialTab?: CreateTab;
}

type CreateTab = 'file' | 'compose' | 'quick_sheet' | 'bank';

interface SelfComposedQuestion {
  id: string;
  type?: 'single_choice' | 'essay';
  content: string;
  options: { id: string; content: string }[];
  correctAnswer: string;
  explanation: string;
  points?: number;
}

const DEFAULT_COMPOSED_QUESTIONS: SelfComposedQuestion[] = [
  {
    id: 'composed-1',
    content: 'Căn bậc hai số học của số 81 là:',
    options: [
      { id: 'A', content: '9' },
      { id: 'B', content: '-9' },
      { id: 'C', content: '±9' },
      { id: 'D', content: '81' }
    ],
    correctAnswer: 'A',
    explanation: 'Căn bậc hai số học của a ≥ 0 là số không âm x sao cho x² = a. Do đó √81 = 9.'
  },
  {
    id: 'composed-2',
    content: 'Phương trình bậc nhất hai ẩn 2x - y = 3 nhận cặp số nào sau đây làm nghiệm?',
    options: [
      { id: 'A', content: '(2; 1)' },
      { id: 'B', content: '(1; -1)' },
      { id: 'C', content: '(0; 3)' },
      { id: 'D', content: '(3; 0)' }
    ],
    correctAnswer: 'A',
    explanation: 'Thay x = 2, y = 1 vào phương trình: 2(2) - 1 = 4 - 1 = 3 (thỏa mãn).'
  },
  {
    id: 'composed-3',
    content: 'Giá trị của biểu thức lượng giác P = sin² 30° + cos² 30° bằng:',
    options: [
      { id: 'A', content: '1' },
      { id: 'B', content: '0' },
      { id: 'C', content: '1/2' },
      { id: 'D', content: '√3/2' }
    ],
    correctAnswer: 'A',
    explanation: 'Với mọi góc nhọn α, luôn có hệ thức lượng cơ bản: sin² α + cos² α = 1.'
  },
  {
    id: 'composed-4',
    content: 'Đồ thị hàm số y = ax + 3 đi qua điểm M(1; 5) khi hệ số a bằng:',
    options: [
      { id: 'A', content: 'a = 2' },
      { id: 'B', content: 'a = -2' },
      { id: 'C', content: 'a = 8' },
      { id: 'D', content: 'a = 1' }
    ],
    correctAnswer: 'A',
    explanation: 'Thay tọa độ điểm M(1; 5) vào hàm số: 5 = a(1) + 3 => a = 5 - 3 = 2.'
  }
];

// Sample 20 questions for Grade 9 Math Multiple Choice test
const SAMPLE_EXAM_20_QUESTIONS: {
  content: string;
  options: { id: string; content: string }[];
  correctAnswer: string;
  explanation: string;
}[] = [
  {
    content: 'Biểu thức √(2x - 6) có nghĩa (xác định) khi và chỉ khi:',
    options: [
      { id: 'A', content: 'x ≥ 3' },
      { id: 'B', content: 'x > 3' },
      { id: 'C', content: 'x ≤ 3' },
      { id: 'D', content: 'x < 3' }
    ],
    correctAnswer: 'A',
    explanation: '2x - 6 ≥ 0 <=> 2x ≥ 6 <=> x ≥ 3.'
  },
  {
    content: 'Giá trị của biểu thức A = √( (3 - √5)² ) + √5 là:',
    options: [
      { id: 'A', content: '3 - 2√5' },
      { id: 'B', content: '3' },
      { id: 'C', content: '2√5 - 3' },
      { id: 'D', content: '6' }
    ],
    correctAnswer: 'B',
    explanation: '√( (3 - √5)² ) = |3 - √5| = 3 - √5 vì 3 > √5. A = 3 - √5 + √5 = 3.'
  },
  {
    content: 'Rút gọn biểu thức B = (√12 - √27 + √48) : √3 ta được kết quả là:',
    options: [
      { id: 'A', content: '3' },
      { id: 'B', content: '2√3' },
      { id: 'C', content: '3√3' },
      { id: 'D', content: '√3' }
    ],
    correctAnswer: 'A',
    explanation: '√12 = 2√3, √27 = 3√3, √48 = 4√3. (2√3 - 3√3 + 4√3) = 3√3. 3√3 : √3 = 3.'
  },
  {
    content: 'Nghiệm của phương trình √(x² - 4x + 4) = 5 là:',
    options: [
      { id: 'A', content: 'x = 7' },
      { id: 'B', content: 'x = -3' },
      { id: 'C', content: 'x = 7 hoặc x = -3' },
      { id: 'D', content: 'x = 3 hoặc x = -7' }
    ],
    correctAnswer: 'C',
    explanation: '|x - 2| = 5 <=> x - 2 = 5 hoặc x - 2 = -5 <=> x = 7 hoặc x = -3.'
  },
  {
    content: 'Hàm số nào sau đây là hàm số bậc nhất đồng biến trên ℝ?',
    options: [
      { id: 'A', content: 'y = 2 - 3x' },
      { id: 'B', content: 'y = (√3 - 2)x + 1' },
      { id: 'C', content: 'y = (2 - √3)x - 5' },
      { id: 'D', content: 'y = 2/x + 3' }
    ],
    correctAnswer: 'C',
    explanation: 'Vì 2 = √4 > √3 nên hệ số a = 2 - √3 > 0, do đó hàm số đồng biến trên ℝ.'
  },
  {
    content: 'Đồ thị hàm số y = ax + 3 đi qua điểm M(-1; 1). Hệ số a bằng:',
    options: [
      { id: 'A', content: 'a = 2' },
      { id: 'B', content: 'a = -2' },
      { id: 'C', content: 'a = 4' },
      { id: 'D', content: 'a = -4' }
    ],
    correctAnswer: 'A',
    explanation: 'Thay x = -1, y = 1 vào hàm số: 1 = a(-1) + 3 <=> -a = -2 <=> a = 2.'
  },
  {
    content: 'Tìm m để hai đường thẳng (d1): y = (m - 1)x + 3 và (d2): y = 2x + 3 song song với nhau:',
    options: [
      { id: 'A', content: 'm = 3' },
      { id: 'B', content: 'm ≠ 3' },
      { id: 'C', content: 'Không có m thỏa mãn (vì trùng nhau)' },
      { id: 'D', content: 'm = 1' }
    ],
    correctAnswer: 'C',
    explanation: 'Khi m = 3 thì hệ số góc a = a\' = 2 và b = b\' = 3 trùng nhau, nên không tồn tại m để song song.'
  },
  {
    content: 'Góc tạo bởi đường thẳng y = √3 x + 1 với trục hoành Ox bằng:',
    options: [
      { id: 'A', content: '30°' },
      { id: 'B', content: '45°' },
      { id: 'C', content: '60°' },
      { id: 'D', content: '120°' }
    ],
    correctAnswer: 'C',
    explanation: 'tan(α) = a = √3 => α = 60°.'
  },
  {
    content: 'Nghiệm của hệ phương trình { 2x + y = 5 ; x - 3y = -8 } là cặp số (x; y):',
    options: [
      { id: 'A', content: '(1; 3)' },
      { id: 'B', content: '(3; 1)' },
      { id: 'C', content: '(-1; 7)' },
      { id: 'D', content: '(2; 1)' }
    ],
    correctAnswer: 'A',
    explanation: 'Từ pt (1) y = 5 - 2x. Thay vào (2): x - 3(5 - 2x) = -8 <=> 7x = 7 <=> x = 1 => y = 3.'
  },
  {
    content: 'Hệ phương trình { mx + y = 1 ; x + my = 2 } vô nghiệm khi và chỉ khi:',
    options: [
      { id: 'A', content: 'm = 1' },
      { id: 'B', content: 'm = -1' },
      { id: 'C', content: 'm = 2' },
      { id: 'D', content: 'm = 0' }
    ],
    correctAnswer: 'B',
    explanation: 'D = m² - 1 = 0 <=> m = ±1. Với m = -1 thì Dx = 1 - 2(-1) = 3 ≠ 0 => vô nghiệm.'
  },
  {
    content: 'Cho tam giác ABC vuông tại A có đường cao AH. Biết BH = 4 cm, CH = 9 cm. Độ dài AH là:',
    options: [
      { id: 'A', content: '6 cm' },
      { id: 'B', content: '13 cm' },
      { id: 'C', content: '36 cm' },
      { id: 'D', content: '√13 cm' }
    ],
    correctAnswer: 'A',
    explanation: 'AH² = BH . CH = 4 . 9 = 36 => AH = 6 cm.'
  },
  {
    content: 'Cho tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. Giá trị của sin B bằng:',
    options: [
      { id: 'A', content: '4/5' },
      { id: 'B', content: '3/5' },
      { id: 'C', content: '4/3' },
      { id: 'D', content: '3/4' }
    ],
    correctAnswer: 'A',
    explanation: 'BC = √(6² + 8²) = 10 cm. sin B = AC / BC = 8 / 10 = 4/5.'
  },
  {
    content: 'Cho tam giác ABC vuông tại A có góc C = 30° và BC = 12 cm. Độ dài cạnh AB bằng:',
    options: [
      { id: 'A', content: '6 cm' },
      { id: 'B', content: '6√3 cm' },
      { id: 'C', content: '4 cm' },
      { id: 'D', content: '8 cm' }
    ],
    correctAnswer: 'A',
    explanation: 'AB = BC . sin C = 12 . sin 30° = 12 . 0.5 = 6 cm.'
  },
  {
    content: 'Cho đường tròn (O; 5 cm) và dây AB = 8 cm. Khoảng cách từ tâm O đến dây AB là:',
    options: [
      { id: 'A', content: '3 cm' },
      { id: 'B', content: '4 cm' },
      { id: 'C', content: '√41 cm' },
      { id: 'D', content: '2 cm' }
    ],
    correctAnswer: 'A',
    explanation: 'Kẻ OH ⊥ AB => H là trung điểm AB => AH = 4 cm. OH = √(OA² - AH²) = √(25 - 16) = 3 cm.'
  },
  {
    content: 'Hai đường tròn (O; 4 cm) và (O\'; 3 cm) có đoạn nối tâm OO\' = 5 cm. Vị trí tương đối của hai đường tròn là:',
    options: [
      { id: 'A', content: 'Cắt nhau tại 2 điểm' },
      { id: 'B', content: 'Tiếp xúc ngoài' },
      { id: 'C', content: 'Ở ngoài nhau' },
      { id: 'D', content: 'Tiếp xúc trong' }
    ],
    correctAnswer: 'A',
    explanation: '|R - r| = 1 < OO\' = 5 < R + r = 7 nên hai đường tròn cắt nhau tại hai điểm.'
  },
  {
    content: 'Giá trị của biểu thức P = cos² 20° + cos² 70° là:',
    options: [
      { id: 'A', content: '1' },
      { id: 'B', content: '0' },
      { id: 'C', content: '2' },
      { id: 'D', content: '0.5' }
    ],
    correctAnswer: 'A',
    explanation: 'Vì 70° phụ với 20° nên cos 70° = sin 20°. P = cos² 20° + sin² 20° = 1.'
  },
  {
    content: 'Điểm nào sau đây thuộc đồ thị hàm số y = -2x + 5?',
    options: [
      { id: 'A', content: 'M(2; 1)' },
      { id: 'B', content: 'N(1; 2)' },
      { id: 'C', content: 'P(0; -5)' },
      { id: 'D', content: 'Q(-1; 3)' }
    ],
    correctAnswer: 'A',
    explanation: 'Thay x = 2 vào y = -2(2) + 5 = 1 => Điểm M(2; 1) thuộc đồ thị.'
  },
  {
    content: 'Căn bậc ba của -64 là:',
    options: [
      { id: 'A', content: '-4' },
      { id: 'B', content: '4' },
      { id: 'C', content: '±4' },
      { id: 'D', content: 'Không xác định' }
    ],
    correctAnswer: 'A',
    explanation: '(-4)³ = -64 nên ³√(-64) = -4.'
  },
  {
    content: 'Đường thẳng (d) tiếp xúc với đường tròn (O; R) khi khoảng cách d từ O đến đường thẳng thỏa mãn:',
    options: [
      { id: 'A', content: 'd = R' },
      { id: 'B', content: 'd < R' },
      { id: 'C', content: 'd > R' },
      { id: 'D', content: 'd ≤ R' }
    ],
    correctAnswer: 'A',
    explanation: 'Đường thẳng tiếp xúc đường tròn khi và chỉ khi khoảng cách từ tâm đến đường thẳng bằng bán kính R.'
  },
  {
    content: 'Hệ số góc của đường thẳng y = -5x + 7 là:',
    options: [
      { id: 'A', content: '-5' },
      { id: 'B', content: '5' },
      { id: 'C', content: '7' },
      { id: 'D', content: '-7' }
    ],
    correctAnswer: 'A',
    explanation: 'Đường thẳng y = ax + b có hệ số góc là a = -5.'
  }
];

export const AzotaCreateExamModal: React.FC<AzotaCreateExamModalProps> = ({
  isOpen,
  onClose,
  onSaveAndAssign,
  onSaveToRepository,
  initialClassId,
  initialTab
}) => {
  const navigate = useNavigate();
  const { success, warning } = useToast();

  const [activeTab, setActiveTab] = useState<CreateTab>(initialTab || 'file');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Exam Meta
  const [examTitle, setExamTitle] = useState('Đề kiểm tra trắc nghiệm Toán 9 - Giữa kỳ I');
  const [examSubject, setExamSubject] = useState('Toán học');
  const [examGrade, setExamGrade] = useState('Khối 9');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [totalPoints, setTotalPoints] = useState(10);
  const [savedExamForInfo, setSavedExamForInfo] = useState<Exam | null>(null);

  // Tab: Self-compose questions
  const [composedQuestions, setComposedQuestions] = useState<SelfComposedQuestion[]>(DEFAULT_COMPOSED_QUESTIONS);

  const handleAddComposedQuestion = (type: 'single_choice' | 'essay' = 'single_choice') => {
    const newId = `composed-${Date.now()}`;
    const newQ: SelfComposedQuestion = {
      id: newId,
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
      points: Number((totalPoints / (composedQuestions.length + 1)).toFixed(2))
    };
    setComposedQuestions((prev) => [...prev, newQ]);
    success('Đã thêm câu hỏi', `Câu hỏi số ${composedQuestions.length + 1} đã được thêm.`);
  };

  const handleAutoBalanceComposedPoints = () => {
    if (composedQuestions.length === 0) return;
    const pts = parseFloat((totalPoints / composedQuestions.length).toFixed(2));
    setComposedQuestions((prev) => prev.map((q) => ({ ...q, points: pts })));
    success('Đã chia đều điểm', `Mỗi câu ${pts} điểm (Tổng ${totalPoints}đ).`);
  };

  const handleRemoveComposedQuestion = (id: string) => {
    if (composedQuestions.length <= 1) {
      warning('Không thể xóa', 'Đề thi cần có ít nhất 1 câu hỏi.');
      return;
    }
    setComposedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDuplicateComposedQuestion = (id: string) => {
    const target = composedQuestions.find((q) => q.id === id);
    if (!target) return;
    const newQ: SelfComposedQuestion = {
      ...target,
      id: `composed-${Date.now()}`,
      content: target.content ? `${target.content} (Bản sao)` : ''
    };
    setComposedQuestions((prev) => [...prev, newQ]);
    success('Đã nhân bản câu hỏi');
  };

  const handleUpdateComposedQuestion = (id: string, updates: Partial<SelfComposedQuestion>) => {
    setComposedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const handleUpdateComposedOption = (qId: string, optId: string, text: string) => {
    setComposedQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map((opt) => (opt.id === optId ? { ...opt, content: text } : opt))
        };
      })
    );
  };

  const handleSelectComposedCorrectAnswer = (qId: string, optId: string) => {
    setComposedQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, correctAnswer: optId } : q))
    );
  };

  const handleLoadSampleComposed = () => {
    setComposedQuestions(DEFAULT_COMPOSED_QUESTIONS);
    success('Đã nạp câu hỏi mẫu', 'Đã tải 4 câu hỏi trắc nghiệm mẫu sẵn sàng để chỉnh sửa.');
  };

  // Tab 1: File parsed questions
  const [parsedQuestions, setParsedQuestions] = useState<typeof SAMPLE_EXAM_20_QUESTIONS>(
    SAMPLE_EXAM_20_QUESTIONS
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>('De_thi_trac_nghiem_Toan_9_20_cau.docx');

  // Tab 2: Quick OMR Sheet
  const [quickQuestionCount, setQuickQuestionCount] = useState<number>(20);
  const [quickAnswers, setQuickAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    const defaultPattern = ['A', 'B', 'C', 'D', 'C', 'A', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'B', 'C', 'A', 'D', 'B', 'C', 'A'];
    for (let i = 1; i <= 20; i++) {
      initial[i] = defaultPattern[(i - 1) % defaultPattern.length];
    }
    return initial;
  });
  const [quickPasteText, setQuickPasteText] = useState('');
  const [attachedPdfName, setAttachedPdfName] = useState<string>('');

  // Tab 3: Question Bank
  const allBankQuestions = store.getQuestions().filter((q) => q.type === 'single_choice' || q.type === 'multiple_choice');
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(
    new Set(allBankQuestions.slice(0, 8).map((q) => q.id))
  );

  if (!isOpen) return null;

  // Helpers
  const pointsPerQuestion = parsedQuestions.length > 0 ? (totalPoints / parsedQuestions.length).toFixed(2) : '0.5';

  // Load sample test
  const handleLoadSampleExam = (count: 10 | 20) => {
    const loaded = SAMPLE_EXAM_20_QUESTIONS.slice(0, count);
    setParsedQuestions(loaded);
    setUploadedFileName(`De_Toan_9_${count}_cau_trac_nghiem.docx`);
    setExamTitle(`Đề kiểm tra trắc nghiệm Toán 9 (${count} câu)`);
    setDurationMinutes(count === 10 ? 15 : 45);
    success('Đã tải đề mẫu trắc nghiệm', `Đã nạp ${count} câu hỏi trắc nghiệm khách quan thành công.`);
  };

  // Change answer in parsed questions
  const handleToggleParsedAnswer = (index: number, optionId: string) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], correctAnswer: optionId };
      }
      return next;
    });
  };

  // Quick sheet: Update question count
  const handleSetQuickCount = (count: number) => {
    setQuickQuestionCount(count);
    setQuickAnswers((prev) => {
      const next = { ...prev };
      const pattern = ['A', 'B', 'C', 'D'];
      for (let i = 1; i <= count; i++) {
        if (!next[i]) {
          next[i] = pattern[(i - 1) % 4];
        }
      }
      return next;
    });
  };

  // Quick sheet: Click answer option
  const handleSelectQuickAnswer = (qNum: number, opt: string) => {
    setQuickAnswers((prev) => ({ ...prev, [qNum]: opt }));
  };

  // Quick sheet: Parse pasted string (e.g., "1A 2B 3C 4D" or "ABCDABCD...")
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) {
      warning('Chưa nhập chuỗi đáp án', 'Vui lòng dán chuỗi đáp án (ví dụ: 1A 2B 3C 4D... hoặc ABCD...)');
      return;
    }

    const text = quickPasteText.toUpperCase().trim();
    const newAnswers: Record<number, string> = { ...quickAnswers };

    // Format 1: Matches like "1A", "2B", "3-C", "4.D"
    const regex = /(\d+)[\s.:-]*([A-D])/gi;
    let match;
    let foundCount = 0;

    while ((match = regex.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      const opt = match[2];
      if (num >= 1 && num <= quickQuestionCount) {
        newAnswers[num] = opt;
        foundCount++;
      }
    }

    // Format 2: Continuous string e.g. "ABCDABCD"
    if (foundCount === 0) {
      const lettersOnly = text.replace(/[^A-D]/g, '');
      if (lettersOnly.length > 0) {
        for (let i = 0; i < Math.min(lettersOnly.length, quickQuestionCount); i++) {
          newAnswers[i + 1] = lettersOnly[i];
          foundCount++;
        }
      }
    }

    if (foundCount > 0) {
      setQuickAnswers(newAnswers);
      success('Đã áp dụng chuỗi đáp án', `Đã tự động cập nhật ${foundCount} câu trả lời.`);
      setQuickPasteText('');
    } else {
      warning('Không nhận diện được đáp án', 'Vui lòng kiểm tra lại định dạng chuỗi (ví dụ: 1A 2B 3C 4D hoặc ABCD)');
    }
  };

  // Generate random keys for quick sheet
  const handleRandomizeQuickAnswers = () => {
    const letters = ['A', 'B', 'C', 'D'];
    const rand: Record<number, string> = {};
    for (let i = 1; i <= quickQuestionCount; i++) {
      rand[i] = letters[Math.floor(Math.random() * letters.length)];
    }
    setQuickAnswers(rand);
    success('Đã sinh đáp án mẫu ngẫu nhiên', `Đã tạo đáp án cho ${quickQuestionCount} câu trắc nghiệm.`);
  };

  // Final compilation into Exam object
  const buildExamObject = (): Exam => {
    const examId = `exam-${Date.now()}`;
    let examQuestions: ExamQuestionItem[] = [];

    if (activeTab === 'compose') {
      const defaultPts = composedQuestions.length > 0 ? totalPoints / composedQuestions.length : 1;
      examQuestions = composedQuestions.map((cq, idx) => {
        const qId = `q-comp-${Date.now()}-${idx + 1}`;
        const isEssay = cq.type === 'essay';
        const questionObj: Question = {
          id: qId,
          type: isEssay ? 'essay' : 'single_choice',
          content: cq.content.trim() || `Câu hỏi số ${idx + 1}`,
          options: isEssay
            ? undefined
            : cq.options.map((opt) => ({
                id: opt.id,
                content: opt.content.trim() || `Phương án ${opt.id}`
              })),
          correctAnswers: isEssay ? undefined : [cq.correctAnswer || 'A'],
          explanation: cq.explanation.trim() || 'Học sinh đối chiếu phương án đúng được hệ thống hiển thị.',
          subject: examSubject,
          grade: examGrade,
          topic: 'Tự soạn đề thi',
          cognitiveLevel: 'understand',
          difficulty: 'medium',
          tags: ['Tự soạn', isEssay ? 'Tự luận' : 'Trắc nghiệm'],
          status: 'published',
          createdAt: new Date().toISOString()
        };

        return {
          questionId: qId,
          points: cq.points ? parseFloat(cq.points.toFixed(2)) : parseFloat(defaultPts.toFixed(2)),
          order: idx + 1,
          question: questionObj
        };
      });
    } else if (activeTab === 'file') {
      const points = totalPoints / parsedQuestions.length;
      examQuestions = parsedQuestions.map((pq, idx) => {
        const qId = `q-${Date.now()}-${idx + 1}`;
        const questionObj: Question = {
          id: qId,
          type: 'single_choice',
          content: pq.content,
          options: pq.options,
          correctAnswers: [pq.correctAnswer],
          explanation: pq.explanation,
          subject: examSubject,
          grade: examGrade,
          topic: 'Kiểm tra trắc nghiệm',
          cognitiveLevel: 'understand',
          difficulty: 'medium',
          tags: ['Trắc nghiệm'],
          status: 'published',
          createdAt: new Date().toISOString()
        };

        return {
          questionId: qId,
          points: parseFloat(points.toFixed(2)),
          order: idx + 1,
          question: questionObj
        };
      });
    } else if (activeTab === 'quick_sheet') {
      const points = totalPoints / quickQuestionCount;
      examQuestions = Array.from({ length: quickQuestionCount }).map((_, idx) => {
        const qNum = idx + 1;
        const qId = `q-omr-${Date.now()}-${qNum}`;
        const correctOpt = quickAnswers[qNum] || 'A';

        const questionObj: Question = {
          id: qId,
          type: 'single_choice',
          content: `Câu ${qNum} (Xem nội dung trên đề thi giấy hoặc tệp đính kèm)`,
          options: [
            { id: 'A', content: 'Phương án A' },
            { id: 'B', content: 'Phương án B' },
            { id: 'C', content: 'Phương án C' },
            { id: 'D', content: 'Phương án D' }
          ],
          correctAnswers: [correctOpt],
          explanation: `Đáp án chính xác là ${correctOpt}`,
          subject: examSubject,
          grade: examGrade,
          topic: 'Phiếu trắc nghiệm OMR',
          cognitiveLevel: 'understand',
          difficulty: 'medium',
          tags: ['OMR', 'Trắc nghiệm'],
          status: 'published',
          createdAt: new Date().toISOString()
        };

        return {
          questionId: qId,
          points: parseFloat(points.toFixed(2)),
          order: qNum,
          question: questionObj
        };
      });
    } else {
      // From Bank
      const selected = allBankQuestions.filter((q) => selectedBankIds.has(q.id));
      const points = selected.length > 0 ? totalPoints / selected.length : 1;
      examQuestions = selected.map((q, idx) => ({
        questionId: q.id,
        points: parseFloat(points.toFixed(2)),
        order: idx + 1,
        question: q
      }));
    }

    const newExam: Exam = {
      id: examId,
      title: examTitle.trim() || 'Đề thi trắc nghiệm trực tuyến',
      description: `Đề thi trắc nghiệm khách quan 100% (${examQuestions.length} câu) - Tự động chấm điểm`,
      subject: examSubject,
      grade: examGrade,
      durationMinutes: durationMinutes,
      maxScore: totalPoints,
      passingScore: 5,
      status: 'draft',
      assignedClassIds: initialClassId ? [initialClassId] : [],
      isPublic: true,
      settings: {
        assignmentType: 'exam',
        shuffleQuestions: true,
        shuffleOptions: true,
        showOneByOne: false,
        allowBacktrack: true,
        autoSubmitOnTimeUp: true,
        allowAnonymous: false,
        requirePassword: false,
        showScoreImmediately: true,
        showAnswersImmediately: false,
        showExplanationAfterClose: true,
        trackTabSwitches: true,
        strictFullScreen: true,
        preventCopyPaste: true,
        maxAttempts: 1,
        accessType: initialClassId ? 'assigned_classes' : 'all'
      },
      questions: examQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return newExam;
  };

  // Handler: Save & Assign
  const handleSaveAndAssignClick = () => {
    if (!examTitle.trim()) {
      warning('Thiếu tên đề thi', 'Vui lòng nhập tên đề thi.');
      return;
    }

    const newExam = buildExamObject();
    if (newExam.questions.length === 0) {
      warning('Chưa có câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi trắc nghiệm.');
      return;
    }

    const saved = store.addExam(newExam);
    success('Tạo đề thi thành công', `Đã lưu đề "${saved.title}" với ${saved.questions.length} câu trắc nghiệm.`);
    onClose();
    onSaveAndAssign(saved);
  };

  // Handler: Save to Repository
  const handleSaveToRepoClick = () => {
    if (!examTitle.trim()) {
      warning('Thiếu tên đề thi', 'Vui lòng nhập tên đề thi.');
      return;
    }

    const newExam = buildExamObject();
    if (newExam.questions.length === 0) {
      warning('Chưa có câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi trắc nghiệm.');
      return;
    }

    const saved = store.addExam(newExam);
    success('Lưu vào kho đề thành công', `Đề thi "${saved.title}" đã được thêm vào Kho Đề thi của bạn.`);
    if (onSaveToRepository) {
      onSaveToRepository(saved);
    }
    setSavedExamForInfo(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Tạo Đề Thi Trắc Nghiệm Mới
                </h3>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  100% Trắc nghiệm khách quan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chấm điểm tự động tức thì • Nhận diện đề Word/PDF • Tạo phiếu đáp án OMR siêu tốc
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Main Method Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Upload className={`w-4 h-4 shrink-0 ${activeTab === 'file' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div className="text-left min-w-0">
              <span className="block leading-tight truncate">Tải file Word / PDF</span>
              <span className="text-[10px] font-normal text-slate-400 hidden sm:block truncate">Tự bóc tách câu & đáp án</span>
            </div>
          </button>

          <button
            type="button"
            id="btn-tab-self-compose-exam"
            onClick={() => setActiveTab('compose')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer relative ${
              activeTab === 'compose'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs ring-1 ring-emerald-400/40'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-wider uppercase shadow-2xs">
              Tự soạn
            </span>
            <Edit3 className={`w-4 h-4 shrink-0 ${activeTab === 'compose' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div className="text-left min-w-0">
              <span className="block leading-tight truncate">Tự soạn đề thi</span>
              <span className="text-[10px] font-normal text-slate-400 hidden sm:block truncate">Soạn từng câu trực tiếp</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick_sheet')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'quick_sheet'
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-4 h-4 shrink-0 ${activeTab === 'quick_sheet' ? 'text-amber-600' : 'text-slate-400'}`} />
            <div className="text-left min-w-0">
              <span className="block leading-tight truncate">Phiếu đáp án (OMR)</span>
              <span className="text-[10px] font-normal text-slate-400 hidden sm:block truncate">Dán key/tô bảng đáp án</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'bank' ? 'text-blue-600' : 'text-slate-400'}`} />
            <div className="text-left min-w-0">
              <span className="block leading-tight truncate">Ngân hàng câu hỏi</span>
              <span className="text-[10px] font-normal text-slate-400 hidden sm:block truncate">{allBankQuestions.length} câu có sẵn</span>
            </div>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* General Metadata Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2 md:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">Tên đề thi *</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Nhập tên đề thi..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Thời gian làm bài</label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full pl-8 pr-12 py-2 bg-white rounded-xl border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-hidden"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <span className="text-[11px] text-slate-400 absolute right-3 top-2.5 font-bold">phút</span>
              </div>
            </div>
          </div>

          {/* TAB 1: FILE WORD / PDF PARSER (AZOTA SPLIT-VIEW) */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* File Upload Box */}
              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors rounded-2xl p-5 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Kéo thả hoặc tải lên file đề thi (Word .docx hoặc PDF)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">
                    Hệ thống tự động nhận diện câu hỏi trắc nghiệm (Câu 1, 2, 3...) và các phương án A, B, C, D, đáp án gạch chân hoặc in đậm.
                  </p>

                  <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      📄 File đang nạp: <strong className="text-indigo-600">{uploadedFileName}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleLoadSampleExam(20)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Dùng đề mẫu 20 câu Toán 9</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadSampleExam(10)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      Đề 10 câu ôn nhanh
                    </button>
                  </div>
                </div>
              </div>

              {/* AZOTA SPLIT VIEW: Left = Questions List, Right = Matrix Answer Sheet */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Questions List (8 cols) */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-600" />
                      <span>Danh sách câu hỏi bóc tách ({parsedQuestions.length} câu trắc nghiệm)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Mỗi câu: ~{pointsPerQuestion} điểm
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {parsedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors text-xs space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                            Câu {idx + 1}
                          </span>
                          <p className="font-bold text-slate-800 flex-1 leading-relaxed">
                            {q.content}
                          </p>
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => {
                            const isCorrect = q.correctAnswer === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleParsedAnswer(idx, opt.id)}
                                className={`p-2 rounded-xl text-left flex items-start gap-2 border transition-all cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 font-bold'
                                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {opt.id}
                                </span>
                                <span className="leading-snug text-[11px]">{opt.content}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Azota Matrix Answer Sheet (4 cols) */}
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bảng đáp án (OMR Key)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Click để đổi</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Giáo viên click trực tiếp vào nút A, B, C, D để sửa nhanh đáp án chuẩn:
                  </p>

                  {/* Grid of question rows */}
                  <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
                    {parsedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs"
                      >
                        <span className="font-bold text-slate-700 w-12 text-[11px]">
                          C.{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const isSelected = q.correctAnswer === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleToggleParsedAnswer(idx, opt)}
                                className={`w-7 h-7 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SELF-COMPOSE QUESTIONS DIRECTLY */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Edit3 className="w-4 h-4 text-emerald-600" />
                    <span>Tự Soạn Từng Câu Hỏi Đề Thi Trực Tiếp</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                      {composedQuestions.length} câu • {(totalPoints / (composedQuestions.length || 1)).toFixed(2)} đ/câu
                    </span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed text-[11px]">
                    Thầy cô nhập nội dung câu hỏi, điền 4 đáp án A/B/C/D, chọn đáp án đúng và bổ sung lời giải chi tiết.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAutoBalanceComposedPoints}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Chia đều điểm cho tất cả câu hỏi theo thang điểm đề"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chia đều {totalPoints}đ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddComposedQuestion('single_choice')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm câu hỏi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleComposed}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="Nạp lại 4 câu hỏi trắc nghiệm mẫu để chỉnh sửa nhanh"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nạp câu mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/teacher/exam-builder/new');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                    title="Mở trình soạn thảo toàn màn hình với công cụ nâng cao, ma trận đề, kéo thả"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trình soạn nâng cao</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                {composedQuestions.map((q, idx) => {
                  const defaultPts = (totalPoints / (composedQuestions.length || 1)).toFixed(2);
                  const isChoice = q.type !== 'essay';

                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 hover:border-emerald-300 transition-all"
                    >
                      {/* Top Bar of Question Card */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            Câu {idx + 1}
                          </span>

                          <span className="text-[11px] text-slate-500 hidden sm:inline">
                            • Đáp án đúng: <strong className="text-emerald-700 font-black">{q.correctAnswer}</strong>
                          </span>
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
                              value={q.points !== undefined ? q.points : Number(defaultPts)}
                              onChange={(e) =>
                                handleUpdateComposedQuestion(q.id, {
                                  points: parseFloat(e.target.value) || 0
                                })
                              }
                              className="w-12 bg-transparent text-xs font-bold text-emerald-900 outline-hidden text-right"
                            />
                            <span className="text-[11px] text-slate-500">đ</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDuplicateComposedQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Nhân bản câu hỏi này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveComposedQuestion(q.id)}
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
                          Nội dung câu hỏi *
                        </label>
                        <textarea
                          rows={2}
                          value={q.content}
                          onChange={(e) => handleUpdateComposedQuestion(q.id, { content: e.target.value })}
                          placeholder={`Nhập nội dung câu hỏi số ${idx + 1}...`}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-slate-900 outline-hidden leading-relaxed transition-all"
                        />
                      </div>

                      {/* Options Grid (A, B, C, D) for Choice */}
                      {isChoice ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="font-bold text-slate-700">
                              Các phương án trả lời (Bấm vào chữ A, B, C, D để chọn đáp án đúng):
                            </label>
                            <span className="text-emerald-700 font-semibold text-[10px]">
                              Đáp án đúng: {q.correctAnswer}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => {
                              const isCorrect = q.correctAnswer === opt.id;
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
                                    onClick={() => handleSelectComposedCorrectAnswer(q.id, opt.id)}
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
                                    onChange={(e) => handleUpdateComposedOption(q.id, opt.id, e.target.value)}
                                    placeholder={`Nội dung phương án ${opt.id}...`}
                                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-hidden font-medium"
                                  />

                                  {isCorrect ? (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                      <Check className="w-3 h-3" />
                                      <span>Đúng</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectComposedCorrectAnswer(q.id, opt.id)}
                                      className="text-[10px] text-slate-400 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 shrink-0 cursor-pointer"
                                    >
                                      Chọn đúng
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Essay Question Notice */
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <strong>Dạng bài tự luận:</strong> Học sinh sẽ giải chi tiết ra giấy làm bài rồi chụp ảnh tải lên hoặc nhập trực tiếp nội dung bài giải vào khung trả lời.
                          </div>
                        </div>
                      )}

                      {/* Explanation (Optional) */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-slate-500 block">
                          Lời giải chi tiết / Hướng dẫn chấm (Hiển thị cho học sinh sau khi thi):
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleUpdateComposedQuestion(q.id, { explanation: e.target.value })}
                          placeholder="Ví dụ: Áp dụng định lí Pytago... nên đáp án chính xác là..."
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-slate-700 outline-hidden transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Add Question Button Card */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddComposedQuestion('single_choice')}
                    className="w-full py-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl font-bold text-xs text-emerald-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>+ Thêm câu hỏi (A/B/C/D)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK OMR SHEET GENERATOR (30 SECONDS) */}
          {activeTab === 'quick_sheet' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Tạo Đề Trắc Nghiệm Bằng Phiếu Đáp Án (Tối ưu cho đề thi giấy / PDF có sẵn)</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Thầy cô đã có sẵn file đề thi hoặc phát đề giấy cho học sinh trên lớp? Chỉ cần chọn số lượng câu, tô bảng đáp án hoặc dán nhanh chuỗi đáp án (ví dụ 1A 2B 3C...) là có ngay ca thi trực tuyến tự động chấm điểm 100%!
                </p>
              </div>

              {/* Step 1: Pick number of questions */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-800 block text-xs">
                  Bước 1: Chọn số lượng câu hỏi trắc nghiệm
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 15, 20, 25, 30, 40, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSetQuickCount(num)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        quickQuestionCount === num
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto text-xs">
                    <span className="text-slate-500 font-medium">Tùy chỉnh:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quickQuestionCount}
                      onChange={(e) => handleSetQuickCount(Math.max(1, Number(e.target.value)))}
                      className="w-16 px-2 py-1 bg-slate-50 rounded-lg border border-slate-300 font-bold text-center text-slate-900 outline-hidden"
                    />
                    <span className="text-slate-500">câu</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Quick Paste Answer String (Azota Quick Paste) */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bước 2: Dán nhanh chuỗi đáp án (Copy & Paste Key)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleRandomizeQuickAnswers}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tạo đáp án mẫu ngẫu nhiên</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickPasteText}
                    onChange={(e) => setQuickPasteText(e.target.value)}
                    placeholder="Ví dụ dán: 1A 2B 3C 4D 5A 6B hoặc chuỗi ABCDABCD..."
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium outline-hidden focus:border-amber-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    Áp dụng đáp án
                  </button>
                </div>
              </div>

              {/* Step 3: Interactive Answer Sheet Grid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Phiếu trả lời trắc nghiệm ({quickQuestionCount} câu • Điểm mỗi câu: {(totalPoints / quickQuestionCount).toFixed(2)}đ)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bấm chọn chữ cái A, B, C, D để lưu đáp án
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {Array.from({ length: quickQuestionCount }).map((_, idx) => {
                    const qNum = idx + 1;
                    const selectedOpt = quickAnswers[qNum] || 'A';

                    return (
                      <div
                        key={qNum}
                        className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                      >
                        <span className="font-bold text-slate-600 text-xs w-6">
                          {qNum}.
                        </span>
                        <div className="flex items-center gap-1">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const isSelected = selectedOpt === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectQuickAnswer(qNum, opt)}
                                className={`w-6 h-6 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FROM QUESTION BANK */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Chọn câu hỏi trắc nghiệm từ ngân hàng (Đã chọn {selectedBankIds.size}/{allBankQuestions.length} câu)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBankIds(new Set(allBankQuestions.map((q) => q.id)))}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBankIds(new Set())}
                    className="text-slate-500 font-bold hover:underline cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
                {allBankQuestions.map((q, idx) => {
                  const isChecked = selectedBankIds.has(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400/40'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = new Set(selectedBankIds);
                          if (e.target.checked) next.add(q.id);
                          else next.delete(q.id);
                          setSelectedBankIds(next);
                        }}
                        className="mt-1 w-4 h-4 rounded-sm text-blue-600 shrink-0"
                      />
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-800">Câu {idx + 1}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                            {q.topic || 'Chuyên đề'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 leading-relaxed">
                          {q.content}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>Đáp án đúng: <strong className="text-emerald-600 font-bold">[{q.correctAnswers?.join(', ')}]</strong></span>
                          <span>{q.options?.length || 4} phương án</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-500">
            Tổng số câu: <strong className="text-slate-800">{activeTab === 'compose' ? composedQuestions.length : activeTab === 'file' ? parsedQuestions.length : activeTab === 'quick_sheet' ? quickQuestionCount : selectedBankIds.size} câu</strong> • Thang điểm: <strong className="text-indigo-600">10 điểm</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveToRepoClick}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Lưu vào kho đề
            </button>

            <button
              type="button"
              onClick={handleSaveAndAssignClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Lưu & Giao ca thi ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exam Information Popup upon Saving */}
      {savedExamForInfo && (
        <ExamInfoModal
          isOpen={Boolean(savedExamForInfo)}
          exam={savedExamForInfo}
          onClose={() => {
            setSavedExamForInfo(null);
            onClose();
          }}
          onAssign={(exam) => {
            setSavedExamForInfo(null);
            onClose();
            onSaveAndAssign(exam);
          }}
        />
      )}
    </div>
  );
};
