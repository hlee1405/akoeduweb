import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  RotateCcw,
  GraduationCap,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { store } from '../../services/store';
import { Exam, Submission, Question } from '../../types';
import { Badge, CognitiveLevelBadge, QuestionTypeBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { QRModal } from '../../components/common/QRModal';

export const ExamResultView: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const navigate = useNavigate();
  const { info } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (examId) {
      const foundExam = store.getExamById(examId);
      if (foundExam) setExam(foundExam);
    }
    if (submissionId) {
      const foundSub = store.getSubmissionById(submissionId);
      if (foundSub) setSubmission(foundSub);
    }
  }, [examId, submissionId]);

  if (!exam || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả bài thi</h2>
          <Link to="/" className="text-xs text-blue-600 font-semibold underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const durationMin = Math.floor(submission.durationSeconds / 60);
  const durationSec = submission.durationSeconds % 60;
  const isPassed = submission.totalScore >= exam.passingScore;
  const teacher = store.getTeacher();

  // Azota visibility policies check
  const scoreViewPolicy = exam.settings?.scoreViewPolicy || 'immediately';
  const now = new Date();
  const isExamClosed = exam.status === 'closed' || (exam.closeTime ? now > new Date(exam.closeTime) : false);

  const canViewScore =
    scoreViewPolicy === 'immediately' ||
    (scoreViewPolicy === 'after_closed' && isExamClosed);

  const answerViewPolicy = exam.settings?.answerViewPolicy || 'immediately';
  const minScoreReq = exam.settings?.minScoreToViewAnswer ?? exam.passingScore;

  const canViewAnswers =
    answerViewPolicy === 'immediately' ||
    (answerViewPolicy === 'after_closed' && isExamClosed) ||
    (answerViewPolicy === 'when_passed' && submission.totalScore >= minScoreReq);

  return (
    <div id="exam-result-view" className="min-h-screen bg-slate-100 antialiased text-slate-800 font-sans py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Result Card */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả bài thi trực tuyến</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{exam.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Thí sinh: <strong>{submission.studentName}</strong> • {submission.studentCode && `SBD: ${submission.studentCode}`}
              {submission.isLate && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                  Nộp muộn
                </span>
              )}
            </p>
          </div>

          {/* Score Badge Gauge or Hidden Lock Card */}
          {canViewScore ? (
            <div className="py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                {submission.totalScore.toFixed(1)}
                <span className="text-xl font-normal text-slate-400">/{exam.maxScore}đ</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isPassed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {isPassed ? '✓ ĐẠT YÊU CẦU' : '✕ CHƯA ĐẠT'}
                </span>

                {submission.needsManualGrading && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                    Chờ cô chấm tự luận
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-5 px-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Điểm số được bảo mật</h4>
              <p className="text-xs text-slate-500">
                {scoreViewPolicy === 'after_closed'
                  ? 'Điểm số sẽ tự động hiển thị sau khi kỳ thi kết thúc.'
                  : 'Điểm số của bài thi này không được công bố trực tiếp theo quy định của giáo viên.'}
              </p>
            </div>
          )}

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs text-slate-600 pt-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Thời gian làm</span>
              <span className="font-bold text-slate-800">{durationMin}p {durationSec}s</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Số câu hoàn thành</span>
              <span className="font-bold text-slate-800">{submission.answers.length}/{exam.questions.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Chuyển tab</span>
              <span className="font-bold text-slate-800">{submission.tabSwitchesCount || 0} lần</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ kết quả</span>
            </button>

            <Link
              to={`/exam/${exam.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bài thi</span>
            </Link>

            <Link
              to={`/teacher/${teacher.slug}`}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <span>Về trang cô {teacher.fullName}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Detailed Solutions & Answers Review or Policy Notice */}
        {canViewAnswers ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Chi tiết lời giải & Đáp án từng câu</h3>
              <span className="text-xs text-slate-500">Đối chiếu bài làm của bạn</span>
            </div>

            {exam.questions.map((qItem, idx) => {
              const q = qItem.question;
              const studentAns = submission.answers.find((a) => a.questionId === qItem.questionId);
              const isCorrect = studentAns?.isCorrect;
              const earnedPts = studentAns?.earnedPoints || 0;
              const photos = studentAns?.attachments || [];

              return (
                <div
                  key={`${qItem.questionId}-${idx}`}
                  className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-900 text-white font-bold text-xs rounded-lg">
                        Câu {idx + 1}
                      </span>
                      <QuestionTypeBadge type={q.type} />
                      <CognitiveLevelBadge level={q.cognitiveLevel} />
                    </div>

                    <div className="flex items-center gap-1 font-bold text-xs">
                      <span className={isCorrect ? 'text-emerald-600' : 'text-slate-500'}>
                        +{earnedPts}/{qItem.points}đ
                      </span>
                    </div>
                  </div>

                  {/* Question content */}
                  <div className="text-sm font-bold text-slate-900 leading-relaxed">
                    {q.content}
                  </div>

                  {/* Multiple choice review */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt) => {
                        const isStudentChoice =
                          studentAns?.studentAnswer === opt.id ||
                          (Array.isArray(studentAns?.studentAnswer) && studentAns?.studentAnswer.includes(opt.id));
                        const isCorrectChoice = q.correctAnswers.includes(opt.id);

                        let style = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isCorrectChoice) {
                          style = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold';
                        } else if (isStudentChoice && !isCorrectChoice) {
                          style = 'bg-rose-50 border-rose-300 text-rose-950 font-semibold';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                  isCorrectChoice
                                    ? 'bg-emerald-600 text-white'
                                    : isStudentChoice
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span>{opt.content}</span>
                            </div>

                            {isStudentChoice && (
                              <span className="text-[10px] uppercase font-bold text-slate-500">
                                (Lựa chọn của bạn)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay or Text Answer student input */}
                  {q.type === 'essay' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                        <span className="font-bold text-slate-500 block text-[11px] uppercase">
                          Bài làm dạng văn bản của bạn:
                        </span>
                        <p className="font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                          {studentAns?.studentAnswer || '(Không nhập văn bản)'}
                        </p>
                      </div>

                      {/* Photo attachments */}
                      {photos.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-700 text-xs block">
                            Ảnh bài làm viết tay ({photos.length} trang):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {photos.map((imgUrl, pIdx) => (
                              <a
                                key={pIdx}
                                href={imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-xl overflow-hidden border border-slate-300 aspect-4/3 relative group shadow-xs hover:border-blue-500 transition-colors"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Trang bài làm ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                                  Trang {pIdx + 1}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher feedback if available */}
                  {studentAns?.teacherFeedback && (
                    <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Nhận xét của cô giáo:</span>
                      </div>
                      <p className="text-blue-950 leading-relaxed italic">{studentAns.teacherFeedback}</p>
                    </div>
                  )}

                  {/* Step-by-step Solution */}
                  {q.explanation && (
                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs text-amber-950 space-y-1 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hướng dẫn giải chi tiết:</span>
                      </div>
                      <div className="whitespace-pre-line text-slate-700 font-normal pt-1">
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">Đáp án và lời giải đang được ẩn</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {answerViewPolicy === 'after_closed' &&
                'Đáp án và lời giải chi tiết sẽ được tự động mở sau khi thời hạn nộp bài kết thúc.'}
              {answerViewPolicy === 'when_passed' &&
                `Lời giải chi tiết chỉ mở cho thí sinh đạt từ ${minScoreReq} điểm trở lên.`}
              {answerViewPolicy === 'never' &&
                'Theo quy định của giáo viên bộ môn, đáp án và lời giải chi tiết không được công bố cho bài kiểm tra này.'}
            </p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <QRModal
          isOpen={showShareModal}
          title={`Kết quả bài thi: ${submission.studentName}`}
          subtitle={`Điểm số: ${submission.totalScore.toFixed(1)}/10đ • ${exam.title}`}
          url={`/exam/${exam.id}/result?submissionId=${submission.id}`}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
