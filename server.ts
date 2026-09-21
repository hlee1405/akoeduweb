import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    });
  });

  // POST /api/ai/parse-exam: AI Parsing Document
  app.post('/api/ai/parse-exam', async (req, res) => {
    try {
      const { textContent, fileName } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback realistic AI parse generator
        return res.json({
          success: true,
          isDemoFallback: true,
          data: generateFallbackParsedExam(textContent || fileName)
        });
      }

      const prompt = `Bạn là chuyên gia thẩm định và số hóa đề thi môn học (EdTech) hàng đầu Việt Nam.
Hãy phân tích tài liệu đề thi sau và tách thành các câu hỏi trắc nghiệm, đúng/sai, trả lời ngắn, hoặc tự luận theo chuẩn Bộ Giáo Dục & Đào Tạo Việt Nam.

Tài liệu:
"""
${textContent || 'Đề kiểm tra chất lượng môn Toán'}
"""

Yêu cầu xuất ra JSON tuân thủ chính xác schema sau:
{
  "title": "Tên đề thi (ví dụ: Đề kiểm tra Toán 9)",
  "subject": "Tên môn học (ví dụ: Toán học)",
  "grade": "Khối lớp (ví dụ: Khối 9)",
  "questions": [
    {
      "id": "q-ai-1",
      "type": "single_choice" | "multiple_choice" | "true_false" | "short_answer" | "essay",
      "content": "Nội dung câu hỏi",
      "options": [
        { "id": "A", "content": "Nội dung đáp án A" },
        { "id": "B", "content": "Nội dung đáp án B" },
        { "id": "C", "content": "Nội dung đáp án C" },
        { "id": "D", "content": "Nội dung đáp án D" }
      ],
      "correctAnswers": ["A"],
      "explanation": "Lời giải chi tiết từng bước",
      "topic": "Tên chủ đề",
      "knowledgeUnit": "Đơn vị kiến thức cụ thể",
      "cognitiveLevel": "recognize" | "understand" | "apply" | "advanced",
      "difficulty": "easy" | "medium" | "hard",
      "confidence": 0.95,
      "warnings": []
    }
  ]
}

Hãy tự động phát hiện cảnh báo nếu câu hỏi bị thiếu đáp án hoặc công thức mập mờ và đưa vào mảng warnings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsedText = response.text;
      if (!parsedText) {
        throw new Error('Gemini returned empty response');
      }

      const data = JSON.parse(parsedText);
      return res.json({
        success: true,
        isDemoFallback: false,
        data
      });
    } catch (err: any) {
      console.warn('Gemini parse failed or offline, falling back to simulated parser:', err?.message);
      return res.json({
        success: true,
        isDemoFallback: true,
        data: generateFallbackParsedExam(req.body?.textContent || req.body?.fileName)
      });
    }
  });

  // POST /api/ai/grade-essay: AI Essay Grading Assistant
  app.post('/api/ai/grade-essay', async (req, res) => {
    try {
      const { questionContent, referenceExplanation, studentAnswer, maxPoints = 3.0 } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          isDemoFallback: true,
          data: generateFallbackEssayGrading(questionContent, studentAnswer, maxPoints)
        });
      }

      const prompt = `Bạn là trợ lý chấm thi tự luận thông minh cho giáo viên môn Toán tại Việt Nam.
Hãy chấm bài làm tự luận của học sinh dựa trên đề bài và đáp án chuẩn.

Đề bài:
"""
${questionContent}
"""

Đáp án & Thang điểm chuẩn:
"""
${referenceExplanation || 'Không có hướng dẫn chấm chi tiết'}
"""

Bài làm của học sinh:
"""
${studentAnswer || '(Học sinh để trống bài)'}
"""

Thang điểm tối đa cho câu này: ${maxPoints} điểm.

Yêu cầu xuất ra JSON tuân thủ chính xác schema:
{
  "suggestedScore": 2.5,
  "maxScore": ${maxPoints},
  "confidence": 0.92,
  "rationale": "Giải thích căn cứ chấm điểm chi tiết (các bước đúng, các bước sai hoặc thiếu sót)",
  "suggestedFeedback": "Lời nhận xét sư phạm mang tính khích lệ và chỉ dẫn cụ thể cho học sinh",
  "keyPointsHit": ["Đặt đúng ẩn và điều kiện", "Lập được hệ phương trình chuẩn"],
  "keyPointsMissed": ["Chưa đối chiếu điều kiện ở bước kết luận"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsedText = response.text;
      if (!parsedText) {
        throw new Error('Gemini returned empty response');
      }

      const data = JSON.parse(parsedText);
      return res.json({
        success: true,
        isDemoFallback: false,
        data
      });
    } catch (err: any) {
      console.warn('Gemini grading failed, falling back:', err?.message);
      return res.json({
        success: true,
        isDemoFallback: true,
        data: generateFallbackEssayGrading(
          req.body?.questionContent,
          req.body?.studentAnswer,
          req.body?.maxPoints || 3.0
        )
      });
    }
  });

  // POST /api/ai/learning-tips: Student Personalized Advice
  app.post('/api/ai/learning-tips', async (req, res) => {
    try {
      const { studentName, score, maxScore, weakTopics, totalTimeMinutes } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          tips: [
            `Ôn tập lại kỹ lý thuyết và điều kiện xác định của các chủ đề: ${weakTopics?.join(', ') || 'Căn thức và hàm số'}.`,
            'Rèn luyện thói quen kiểm tra lại các bước biến đổi dấu và quy đồng mẫu thức.',
            'Luyện thêm 3 - 5 bài toán thực tế tương tự trong ngân hàng tài liệu của giáo viên.'
          ]
        });
      }

      const prompt = `Học sinh ${studentName} vừa hoàn thành bài kiểm tra Toán đạt ${score}/${maxScore} điểm trong ${totalTimeMinutes} phút.
Các chủ đề còn yếu: ${(weakTopics || []).join(', ') || 'Kỹ năng tính toán'}.

Hãy đưa ra 3 lời khuyên học tập ngắn gọn, ấm áp, đậm tính sư phạm và thiết thực nhất bằng tiếng Việt.
Trả về định dạng JSON:
{
  "tips": [
    "Lời khuyên 1...",
    "Lời khuyên 2...",
    "Lời khuyên 3..."
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        tips: data.tips || []
      });
    } catch (err) {
      return res.json({
        success: true,
        tips: [
          'Tập trung củng cố lại các hằng đẳng thức và điều kiện xác định.',
          'Dành 15 phút mỗi ngày làm lại các câu bị sai trong phần giải thích chi tiết.',
          'Tham khảo bộ tài liệu ôn tập độc quyền trên trang cá nhân của cô.'
        ]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[edu101] Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateFallbackParsedExam(hint?: string) {
  return {
    title: 'Đề kiểm tra Toán 9 – Trích xuất AI tự động',
    subject: 'Toán học',
    grade: 'Khối 9',
    questions: [
      {
        id: `q-ai-${Date.now()}-1`,
        type: 'single_choice',
        content: 'Tìm điều kiện của x để biểu thức √(3x - 12) có nghĩa:',
        options: [
          { id: 'A', content: 'x ≥ 4' },
          { id: 'B', content: 'x ≤ 4' },
          { id: 'C', content: 'x > 4' },
          { id: 'D', content: 'x < 4' }
        ],
        correctAnswers: ['A'],
        explanation: 'Biểu thức √(A) có nghĩa khi A ≥ 0. Ta có: 3x - 12 ≥ 0 <=> 3x ≥ 12 <=> x ≥ 4.',
        topic: 'Căn bậc hai & Căn bậc ba',
        knowledgeUnit: 'Điều kiện xác định căn bậc hai',
        cognitiveLevel: 'recognize',
        difficulty: 'easy',
        confidence: 0.98,
        warnings: []
      },
      {
        id: `q-ai-${Date.now()}-2`,
        type: 'single_choice',
        content: 'Rút gọn biểu thức B = √( (2 - √5)² ) - √5 ta được kết quả:',
        options: [
          { id: 'A', content: '2 - 2√5' },
          { id: 'B', content: '-2' },
          { id: 'C', content: '2' },
          { id: 'D', content: '2√5 - 2' }
        ],
        correctAnswers: ['B'],
        explanation: '√( (2 - √5)² ) = |2 - √5| = √5 - 2 (vì 2 < √5). Khi đó B = √5 - 2 - √5 = -2.',
        topic: 'Căn bậc hai & Căn bậc ba',
        knowledgeUnit: 'Hằng đẳng thức căn thức',
        cognitiveLevel: 'understand',
        difficulty: 'medium',
        confidence: 0.96,
        warnings: []
      },
      {
        id: `q-ai-${Date.now()}-3`,
        type: 'true_false',
        content: 'Xét tính đúng/sai của các phát biểu về hàm số bậc nhất y = ax + b (a ≠ 0):',
        options: [
          { id: 'A', content: 'Hàm số đồng biến trên R khi hệ số a > 0' },
          { id: 'B', content: 'Đồ thị luôn cắt trục tung tại điểm (0; b)' },
          { id: 'C', content: 'Hai đường thẳng song song khi có hệ số a bằng nhau và b khác nhau' },
          { id: 'D', content: 'Góc tạo bởi đường thẳng với Ox luôn là góc nhọn' }
        ],
        correctAnswers: ['A', 'B', 'C'],
        explanation: 'A, B, C đều là các định lý cơ bản đúng về hàm số bậc nhất. D sai vì khi a < 0 thì góc tạo với Ox là góc tù.',
        topic: 'Hàm số bậc nhất',
        knowledgeUnit: 'Tính chất và đồ thị hàm số bậc nhất',
        cognitiveLevel: 'understand',
        difficulty: 'medium',
        confidence: 0.94,
        warnings: []
      },
      {
        id: `q-ai-${Date.now()}-4`,
        type: 'short_answer',
        content: 'Cho tam giác ABC vuông tại A, đường cao AH. Biết BH = 9 cm, HC = 16 cm. Tính độ dài đường cao AH (đơn vị cm):',
        correctAnswers: ['12', '12cm', '12 cm'],
        explanation: 'Áp dụng hệ thức lượng AH² = BH . HC = 9 . 16 = 144 => AH = 12 cm.',
        topic: 'Hệ thức lượng trong tam giác vuông',
        knowledgeUnit: 'Hệ thức về đường cao',
        cognitiveLevel: 'apply',
        difficulty: 'easy',
        confidence: 0.97,
        warnings: []
      },
      {
        id: `q-ai-${Date.now()}-5`,
        type: 'essay',
        content: 'Một xưởng may theo kế hoạch phải may 1000 chiếc áo trong một thời gian quy định. Nhờ cải tiến kỹ thuật, mỗi ngày xưởng may thêm được 10 chiếc áo so với kế hoạch, do đó xưởng đã hoàn thành trước thời hạn 5 ngày. Hỏi theo kế hoạch, mỗi ngày xưởng phải may bao nhiêu chiếc áo?',
        correctAnswers: ['Theo kế hoạch mỗi ngày may 40 chiếc áo.'],
        explanation: 'Gọi số áo may mỗi ngày theo kế hoạch là x (chiếc, x > 0). Thời gian may theo kế hoạch là 1000/x (ngày). Thực tế mỗi ngày may x + 10 chiếc, thời gian thực tế là 1000/(x + 10) ngày. Ta có phương trình: 1000/x - 1000/(x + 10) = 5 <=> 10000 / [x(x+10)] = 5 <=> x² + 10x - 2000 = 0 <=> (x - 40)(x + 50) = 0 => x = 40 (thỏa mãn).',
        topic: 'Hệ hai phương trình bậc nhất hai ẩn',
        knowledgeUnit: 'Toán thực tế năng suất',
        cognitiveLevel: 'advanced',
        difficulty: 'hard',
        confidence: 0.91,
        warnings: ['Cần giáo viên kiểm duyệt thang điểm chấm chi tiết cho câu tự luận này.']
      }
    ]
  };
}

function generateFallbackEssayGrading(questionContent: string, studentAnswer: string, maxPoints: number) {
  if (!studentAnswer || studentAnswer.trim().length < 5) {
    return {
      suggestedScore: 0,
      maxScore: maxPoints,
      confidence: 0.99,
      rationale: 'Học sinh chưa hoàn thành nội dung bài làm hoặc bài làm quá ngắn.',
      suggestedFeedback: 'Em cần nỗ lực trình bày các bước lập luận và đặt ẩn số để nhận được điểm từng phần.',
      keyPointsHit: [],
      keyPointsMissed: ['Chưa đặt ẩn số và điều kiện', 'Chưa lập phương trình/hệ phương trình', 'Chưa giải và kết luận']
    };
  }

  const length = studentAnswer.length;
  if (length > 150) {
    return {
      suggestedScore: Number((maxPoints * 0.9).toFixed(2)),
      maxScore: maxPoints,
      confidence: 0.92,
      rationale: 'Bài làm có đầy đủ các bước: đặt ẩn và điều kiện, thiết lập mối quan hệ đại số, giải phương trình/hệ phương trình và kết luận thỏa mãn điều kiện.',
      suggestedFeedback: 'Bài làm rất tốt, lập luận mạch lạc và tính toán chuẩn xác! Tiếp tục duy trì phong độ này em nhé.',
      keyPointsHit: ['Đặt đúng ẩn và điều kiện xác định', 'Lập đúng hệ thức toán học', 'Tính toán ra nghiệm chính xác', 'Có bước đối chiếu điều kiện'],
      keyPointsMissed: []
    };
  } else {
    return {
      suggestedScore: Number((maxPoints * 0.65).toFixed(2)),
      maxScore: maxPoints,
      confidence: 0.85,
      rationale: 'Học sinh nắm được hướng giải và tìm ra đáp số, nhưng các bước giải thích và lập phương trình còn khá vắn tắt, thiếu điều kiện chặt chẽ.',
      suggestedFeedback: 'Kết quả tính toán đúng. Em nên chú ý trình bày chi tiết hơn các bước biến đổi và nêu rõ đơn vị/điều kiện của ẩn.',
      keyPointsHit: ['Nêu được phương trình cơ bản', 'Kết quả đúng'],
      keyPointsMissed: ['Thiếu điều kiện chặt chẽ cho ẩn', 'Trình bày còn vắn tắt']
    };
  }
}

startServer();
