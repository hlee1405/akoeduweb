import { Exam, Question, StudentAnswer, Submission } from '../types';

export interface ScoreDistributionItem {
  range: string;
  count: number;
}

export interface QuestionStatItem {
  questionId: string;
  order: number;
  content: string;
  type: string;
  cognitiveLevel: string;
  difficulty: string;
  correctAnswers: string[];
  correctRate: number;
}

export interface DetailedExamStatistics {
  totalSubmissions: number;
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTimeMinutes: number;
  scoreDistribution: ScoreDistributionItem[];
  cognitiveLevelPerformance: Record<string, number>;
  questionStats: QuestionStatItem[];
}

export function computeExamStatistics(exam: Exam, submissions: Submission[]): DetailedExamStatistics {
  const examSubs = submissions.filter((s) => s.examId === exam.id);

  if (examSubs.length === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      medianScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      averageTimeMinutes: 0,
      scoreDistribution: [
        { range: '< 5.0đ', count: 0 },
        { range: '5.0 - 6.4đ', count: 0 },
        { range: '6.5 - 7.9đ', count: 0 },
        { range: '8.0 - 8.9đ', count: 0 },
        { range: '9.0 - 10đ', count: 0 }
      ],
      cognitiveLevelPerformance: {
        recognize: 0,
        understand: 0,
        apply: 0,
        advanced: 0
      },
      questionStats: []
    };
  }

  const scores = examSubs.map((s) => s.totalScore).sort((a, b) => a - b);
  const totalScoreSum = scores.reduce((sum, val) => sum + val, 0);
  const averageScore = Number((totalScoreSum / scores.length).toFixed(1));

  const mid = Math.floor(scores.length / 2);
  const medianScore =
    scores.length % 2 !== 0 ? scores[mid] : Number(((scores[mid - 1] + scores[mid]) / 2).toFixed(1));

  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passCount = scores.filter((s) => s >= (exam.passingScore || 5)).length;
  const passRate = Math.round((passCount / scores.length) * 100);

  const totalDurationSec = examSubs.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const averageTimeMinutes = Math.round(totalDurationSec / examSubs.length / 60);

  // Score distribution bins
  const dist: ScoreDistributionItem[] = [
    { range: '< 5.0đ', count: 0 },
    { range: '5.0 - 6.4đ', count: 0 },
    { range: '6.5 - 7.9đ', count: 0 },
    { range: '8.0 - 8.9đ', count: 0 },
    { range: '9.0 - 10đ', count: 0 }
  ];

  scores.forEach((score) => {
    if (score < 5.0) dist[0].count++;
    else if (score < 6.5) dist[1].count++;
    else if (score < 8.0) dist[2].count++;
    else if (score < 9.0) dist[3].count++;
    else dist[4].count++;
  });

  // Question stats breakdown
  const questionStats: QuestionStatItem[] = exam.questions.map((qItem, idx) => {
    const q = qItem.question;
    let correctCount = 0;

    examSubs.forEach((sub) => {
      const studentAns = sub.answers.find((a) => a.questionId === qItem.questionId);
      if (studentAns && (studentAns.isCorrect || (studentAns.earnedPoints || 0) >= qItem.points * 0.9)) {
        correctCount++;
      }
    });

    const correctRate = Math.round((correctCount / examSubs.length) * 100);

    return {
      questionId: qItem.questionId,
      order: idx + 1,
      content: q.content,
      type: q.type,
      cognitiveLevel: q.cognitiveLevel,
      difficulty: q.difficulty,
      correctAnswers: q.correctAnswers,
      correctRate
    };
  });

  // Cognitive level performance calculation
  const cognitiveCounts: Record<string, { correct: number; total: number }> = {
    recognize: { correct: 0, total: 0 },
    understand: { correct: 0, total: 0 },
    apply: { correct: 0, total: 0 },
    advanced: { correct: 0, total: 0 }
  };

  exam.questions.forEach((qItem) => {
    const lvl = qItem.question.cognitiveLevel || 'recognize';
    if (!cognitiveCounts[lvl]) {
      cognitiveCounts[lvl] = { correct: 0, total: 0 };
    }

    examSubs.forEach((sub) => {
      cognitiveCounts[lvl].total++;
      const ans = sub.answers.find((a) => a.questionId === qItem.questionId);
      if (ans && (ans.isCorrect || (ans.earnedPoints || 0) >= qItem.points * 0.9)) {
        cognitiveCounts[lvl].correct++;
      }
    });
  });

  const cognitiveLevelPerformance: Record<string, number> = {};
  for (const [key, val] of Object.entries(cognitiveCounts)) {
    cognitiveLevelPerformance[key] = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 75;
  }

  return {
    totalSubmissions: examSubs.length,
    averageScore,
    medianScore,
    highestScore,
    lowestScore,
    passRate,
    averageTimeMinutes,
    scoreDistribution: dist,
    cognitiveLevelPerformance,
    questionStats
  };
}

export const scoringService = {
  calculateExamStatistics: (exam: Exam, submissions: Submission[]): DetailedExamStatistics => {
    return computeExamStatistics(exam, submissions);
  },

  exportToCSV: (exam: Exam, submissions: Submission[]): string => {
    const headers = ['Mã HS', 'Họ và tên', 'Tổng điểm', 'Thời gian làm (phút)', 'Chuyển tab', 'Trạng thái', 'Ngày nộp'];
    const rows = submissions
      .filter((s) => s.examId === exam.id)
      .map((s) => [
        s.studentCode || 'Vãng lai',
        `"${s.studentName.replace(/"/g, '""')}"`,
        s.totalScore,
        Math.round((s.durationSeconds || 0) / 60),
        s.tabSwitchesCount || 0,
        s.status === 'graded' ? 'Đã chấm' : 'Chờ chấm tự luận',
        new Date(s.submittedAt).toLocaleString('vi-VN')
      ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
};
