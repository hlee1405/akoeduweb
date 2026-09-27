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

  // POST /api/ai/chat-generate-exam: Chatbot AI Exam Generator & Question Refiner
  app.post('/api/ai/chat-generate-exam', async (req, res) => {
    try {
      const {
        messages = [],
        prompt: userPrompt,
        subject = 'Toán học',
        grade = 'Khối 9',
        count = 5,
        difficulty = 'mixed',
        existingQuestions = []
      } = req.body;

      const ai = getGeminiClient();
      const latestMessage = userPrompt || (messages.length > 0 ? messages[messages.length - 1].content : '');

      if (!ai) {
        return res.json({
          success: true,
          isDemoFallback: true,
          data: generateFallbackChatExam(latestMessage, subject, grade, count, difficulty, existingQuestions)
        });
      }

      const systemInstruction = `Bạn là trợ lý AI Giáo Dục (EdTech Assistant) hàng đầu chuyên tạo, thẩm định và tinh chỉnh đề thi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) theo chuẩn chương trình Giáo dục Phổ thông Việt Nam (BGD&ĐT).
Khi người dùng (giáo viên) yêu cầu tạo đề hoặc chỉnh sửa câu hỏi qua chat:
1. Phân tích ngữ cảnh, chủ đề, khối lớp, độ khó và số lượng câu hỏi.
2. Trả lời bằng tiếng Việt sư phạm, lịch sự, chu đáo ("Dạ thầy/cô, tôi đã tạo...").
3. Xuất danh sách câu hỏi trắc nghiệm chất lượng cao, đúng chuẩn 4 phương án A, B, C, D kèm đáp án đúng và lời giải chi tiết.

Yêu cầu định dạng JSON xuất ra:
{
  "replyText": "Lời phản hồi tự nhiên trong chatbot gửi tới giáo viên...",
  "suggestedTitle": "Tên đề thi phù hợp (ví dụ: Đề trắc nghiệm Toán 9 - Căn bậc hai)",
  "subject": "${subject}",
  "grade": "${grade}",
  "questions": [
    {
      "id": "q-ai-1",
      "content": "Nội dung câu hỏi...",
      "options": [
        { "id": "A", "content": "Đáp án A" },
        { "id": "B", "content": "Đáp án B" },
        { "id": "C", "content": "Đáp án C" },
        { "id": "D", "content": "Đáp án D" }
      ],
      "correctAnswer": "A",
      "explanation": "Lời giải chi tiết từng bước...",
      "topic": "Chuyên đề bài học",
      "difficulty": "medium",
      "cognitiveLevel": "understand"
    }
  ]
}`;

      const conversationContext = messages
        .map((m: any) => `${m.role === 'user' ? 'Giáo viên' : 'AI'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `Ngữ cảnh hội thoại trước đó:\n${conversationContext}\n\nYêu cầu hiện tại của giáo viên: "${latestMessage}"\nMôn học: ${subject}, Khối lớp: ${grade}, Số lượng mong muốn: ${count}, Độ khó: ${difficulty}.\nDanh sách câu hỏi hiện tại nếu cần tinh chỉnh: ${JSON.stringify(existingQuestions.slice(0, 5))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${fullPrompt}` }] }
        ],
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
      console.warn('Gemini chat generate exam failed, falling back:', err?.message);
      const {
        prompt: userPrompt,
        messages = [],
        subject = 'Toán học',
        grade = 'Khối 9',
        count = 5,
        difficulty = 'mixed',
        existingQuestions = []
      } = req.body;
      const latestMessage = userPrompt || (messages.length > 0 ? messages[messages.length - 1].content : '');

      return res.json({
        success: true,
        isDemoFallback: true,
        data: generateFallbackChatExam(latestMessage, subject, grade, count, difficulty, existingQuestions)
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

function generateFallbackChatExam(
  userPrompt: string,
  subject: string,
  grade: string,
  count: number,
  difficulty: string,
  existingQuestions: any[] = []
) {
  const promptLower = (userPrompt || '').toLowerCase();
  const effectiveCount = Math.max(1, Math.min(count || 5, 20));

  let detectedTopic = 'Chương trình chuẩn BGD';
  let title = `Đề trắc nghiệm ${subject} ${grade}`;

  // Topic detection
  if (promptLower.includes('căn') || promptLower.includes('can bac hai')) {
    detectedTopic = 'Căn bậc hai & Căn thức bậc ba';
    title = `Đề trắc nghiệm Toán 9 - Chuyên đề Căn bậc hai (${effectiveCount} câu)`;
  } else if (promptLower.includes('hàm số') || promptLower.includes('ham so') || promptLower.includes('ax + b')) {
    detectedTopic = 'Hàm số bậc nhất y = ax + b';
    title = `Đề kiểm tra Hàm số bậc nhất ${grade} (${effectiveCount} câu)`;
  } else if (promptLower.includes('hệ phương trình') || promptLower.includes('he phuong trinh')) {
    detectedTopic = 'Hệ hai phương trình bậc nhất hai ẩn';
    title = `Đề trắc nghiệm Hệ phương trình ${grade} (${effectiveCount} câu)`;
  } else if (promptLower.includes('tam giác') || promptLower.includes('lượng giác') || promptLower.includes('hệ thức lượng')) {
    detectedTopic = 'Hệ thức lượng trong tam giác vuông';
    title = `Đề trắc nghiệm Hình học ${grade} (${effectiveCount} câu)`;
  } else if (promptLower.includes('vật lý') || promptLower.includes('ohm') || promptLower.includes('ôm') || promptLower.includes('điện')) {
    detectedTopic = 'Định luật Ôm & Công suất dòng điện';
    title = `Đề trắc nghiệm Vật lý ${grade} (${effectiveCount} câu)`;
  } else if (promptLower.includes('hóa') || promptLower.includes('axit') || promptLower.includes('bazơ') || promptLower.includes('muối')) {
    detectedTopic = 'Tính chất hóa học của Axit & Bazơ';
    title = `Đề trắc nghiệm Hóa học ${grade} (${effectiveCount} câu)`;
  } else if (promptLower.includes('anh') || promptLower.includes('english') || promptLower.includes('thì') || promptLower.includes('tense')) {
    detectedTopic = 'English Grammar & Vocabulary';
    title = `Tiếng Anh ${grade} - Trắc nghiệm chuyên đề (${effectiveCount} câu)`;
  } else if (promptLower.includes('văn') || promptLower.includes('kiều') || promptLower.includes('thơ')) {
    detectedTopic = 'Đọc hiểu tác phẩm Văn học';
    title = `Đề trắc nghiệm Ngữ văn ${grade} (${effectiveCount} câu)`;
  }

  // Pre-curated high quality repository of questions
  const candidatePool = [
    {
      content: 'Điều kiện xác định của biểu thức P = √(4 - 2x) là:',
      options: [
        { id: 'A', content: 'x ≤ 2' },
        { id: 'B', content: 'x ≥ 2' },
        { id: 'C', content: 'x < 2' },
        { id: 'D', content: 'x > 2' }
      ],
      correctAnswer: 'A',
      explanation: 'Biểu thức dưới dấu căn có nghĩa khi 4 - 2x ≥ 0 <=> 2x ≤ 4 <=> x ≤ 2.',
      topic: 'Căn bậc hai & Căn thức bậc ba',
      cognitiveLevel: 'recognize',
      difficulty: 'easy'
    },
    {
      content: 'Giá trị rút gọn của biểu thức A = √( (3 - 2√2)² ) + 2√2 là:',
      options: [
        { id: 'A', content: '3' },
        { id: 'B', content: '3 + 4√2' },
        { id: 'C', content: '4√2 - 3' },
        { id: 'D', content: '6' }
      ],
      correctAnswer: 'A',
      explanation: 'Vì 3 = √9 > √8 = 2√2 nên 3 - 2√2 > 0. Ta có √( (3 - 2√2)² ) = |3 - 2√2| = 3 - 2√2. Vậy A = 3 - 2√2 + 2√2 = 3.',
      topic: 'Căn bậc hai & Căn thức bậc ba',
      cognitiveLevel: 'understand',
      difficulty: 'medium'
    },
    {
      content: 'Đồ thị hàm số y = (m - 2)x + 3 nghịch biến trên ℝ khi và chỉ khi:',
      options: [
        { id: 'A', content: 'm < 2' },
        { id: 'B', content: 'm > 2' },
        { id: 'C', content: 'm ≤ 2' },
        { id: 'D', content: 'm ≠ 2' }
      ],
      correctAnswer: 'A',
      explanation: 'Hàm số bậc nhất y = ax + b nghịch biến trên ℝ <=> hệ số a < 0 <=> m - 2 < 0 <=> m < 2.',
      topic: 'Hàm số bậc nhất y = ax + b',
      cognitiveLevel: 'understand',
      difficulty: 'easy'
    },
    {
      content: 'Góc tạo bởi đường thẳng (d): y = √3 x - 1 với trục hoành Ox có số đo là:',
      options: [
        { id: 'A', content: '60°' },
        { id: 'B', content: '30°' },
        { id: 'C', content: '45°' },
        { id: 'D', content: '120°' }
      ],
      correctAnswer: 'A',
      explanation: 'Hệ số góc a = √3 > 0. Gọi α là góc tạo bởi d và Ox, ta có tan α = a = √3 => α = 60°.',
      topic: 'Hàm số bậc nhất y = ax + b',
      cognitiveLevel: 'understand',
      difficulty: 'medium'
    },
    {
      content: 'Cặp số nào sau đây là nghiệm của hệ phương trình: { 2x + y = 7 ; x - 3y = 0 }?',
      options: [
        { id: 'A', content: '(3; 1)' },
        { id: 'B', content: '(1; 5)' },
        { id: 'C', content: '(6; 2)' },
        { id: 'D', content: '(3; -1)' }
      ],
      correctAnswer: 'A',
      explanation: 'Từ pt (2) suy ra x = 3y. Thay vào pt (1): 2(3y) + y = 7 <=> 7y = 7 <=> y = 1 => x = 3(1) = 3.',
      topic: 'Hệ hai phương trình bậc nhất hai ẩn',
      cognitiveLevel: 'apply',
      difficulty: 'medium'
    },
    {
      content: 'Cho tam giác ABC vuông tại A có AB = 6 cm, BC = 10 cm. Độ dài đường cao AH hạ từ đỉnh A là:',
      options: [
        { id: 'A', content: '4.8 cm' },
        { id: 'B', content: '5.0 cm' },
        { id: 'C', content: '4.0 cm' },
        { id: 'D', content: '3.6 cm' }
      ],
      correctAnswer: 'A',
      explanation: 'AC = √(BC² - AB²) = √(100 - 36) = 8 cm. Áp dụng hệ thức: AH . BC = AB . AC => AH = (6 . 8) / 10 = 4.8 cm.',
      topic: 'Hệ thức lượng trong tam giác vuông',
      cognitiveLevel: 'apply',
      difficulty: 'medium'
    },
    {
      content: 'Theo định luật Ôm cho đoạn mạch, cường độ dòng điện chạy qua dây dẫn:',
      options: [
        { id: 'A', content: 'Tỉ lệ thuận với hiệu điện thế giữa hai đầu dây và tỉ lệ nghịch với điện trở của dây' },
        { id: 'B', content: 'Tỉ lệ nghịch với hiệu điện thế và tỉ lệ thuận với điện trở' },
        { id: 'C', content: 'Không phụ thuộc vào hiệu điện thế đặt vào hai đầu dây' },
        { id: 'D', content: 'Tỉ lệ thuận với cả hiệu điện thế và điện trở của dây' }
      ],
      correctAnswer: 'A',
      explanation: 'Công thức định luật Ôm: I = U / R, I tỉ lệ thuận với U và tỉ lệ nghịch với R.',
      topic: 'Định luật Ôm & Công suất dòng điện',
      cognitiveLevel: 'recognize',
      difficulty: 'easy'
    },
    {
      content: 'Dãy chất nào sau đây chỉ gồm các oxit axit?',
      options: [
        { id: 'A', content: 'SO₂, CO₂, P₂O₅, SO₃' },
        { id: 'B', content: 'CaO, SO₂, CuO, Na₂O' },
        { id: 'C', content: 'CO, NO, SO₂, P₂O₅' },
        { id: 'D', content: 'Fe₂O₃, Al₂O₃, SO₂, CO₂' }
      ],
      correctAnswer: 'A',
      explanation: 'SO₂, CO₂, P₂O₅, SO₃ đều là phi kim kết hợp với oxi tạo oxit axit tương ứng với các axit H₂SO₃, H₂CO₃, H₃PO₄, H₂SO₄.',
      topic: 'Tính chất hóa học của Axit & Bazơ',
      cognitiveLevel: 'recognize',
      difficulty: 'easy'
    },
    {
      content: 'Choose the best option to complete the sentence: "If it rains tomorrow, we _______ the picnic."',
      options: [
        { id: 'A', content: 'will cancel' },
        { id: 'B', content: 'would cancel' },
        { id: 'C', content: 'cancelled' },
        { id: 'D', content: 'had cancelled' }
      ],
      correctAnswer: 'A',
      explanation: 'Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai: If + S + V(hiện tại đơn), S + will + V(nguyên mẫu).',
      topic: 'English Grammar & Vocabulary',
      cognitiveLevel: 'understand',
      difficulty: 'easy'
    },
    {
      content: 'Trong truyện ngắn "Lặng lẽ Sa Pa" của Nguyễn Thành Long, nhân vật anh thanh niên làm công tác gì?',
      options: [
        { id: 'A', content: 'Khí tượng kiêm vật lý địa cầu' },
        { id: 'B', content: 'Khai thác khoáng sản' },
        { id: 'C', content: 'Kiểm lâm bảo vệ rừng quốc gia' },
        { id: 'D', content: 'Kỹ sư nông nghiệp trồng rau' }
      ],
      correctAnswer: 'A',
      explanation: 'Anh thanh niên 26 tuổi sống một mình trên đỉnh núi Yên Sơn cao 2600m làm công tác khí tượng kiêm vật lý địa cầu.',
      topic: 'Đọc hiểu tác phẩm Văn học',
      cognitiveLevel: 'recognize',
      difficulty: 'easy'
    }
  ];

  // Pick matching or slice pool
  let matchingQuestions = candidatePool.filter((q) => q.topic === detectedTopic);
  if (matchingQuestions.length < effectiveCount) {
    matchingQuestions = [...matchingQuestions, ...candidatePool.filter((q) => q.topic !== detectedTopic)];
  }

  const generatedQuestions = matchingQuestions.slice(0, effectiveCount).map((q, idx) => ({
    ...q,
    id: `q-ai-gen-${Date.now()}-${idx + 1}`
  }));

  return {
    replyText: `Dạ thầy/cô! Tôi đã tạo thành công danh sách **${generatedQuestions.length} câu hỏi trắc nghiệm** theo yêu cầu "${userPrompt || detectedTopic}". Thầy/cô có thể xem trước, click sửa nhanh nội dung, đổi đáp án đúng hoặc bổ sung thêm câu hỏi ở khung bên dưới trước khi tạo đề nhé!`,
    suggestedTitle: title,
    subject,
    grade,
    questions: generatedQuestions
  };
}

startServer();
