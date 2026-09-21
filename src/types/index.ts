export type CognitiveLevel = 'recognize' | 'understand' | 'apply' | 'advanced';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'multiple_select';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D', etc.
  content: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  code?: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correctAnswers: string[]; // ['A'] or ['A', 'C'] or ['true'] or text for short answer
  explanation: string;
  subject: string;
  grade: string;
  topic: string;
  knowledgeUnit?: string;
  cognitiveLevel: CognitiveLevel;
  difficulty: Difficulty;
  confidence?: number;
  warnings?: string[];
  tags: string[];
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt?: string;
  usageCount?: number;
  points?: number;
}

export interface ExamSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showOneByOne: boolean;
  allowBacktrack: boolean;
  autoSubmitOnTimeUp: boolean;
  allowAnonymous: boolean;
  requirePassword?: boolean;
  password?: string;
  showScoreImmediately: boolean;
  showAnswersImmediately: boolean;
  showExplanationAfterClose: boolean;
  trackTabSwitches: boolean;
  maxAttempts: number;

  // Azota-style Online Exam & Homework Assignment Configurations
  // 1. Time & Deadlines
  isUnlimitedTime?: boolean; // Không giới hạn thời gian làm bài (bài tập về nhà / luyện tập)
  openTime?: string; // Thời gian bắt đầu mở đề (YYYY-MM-DDTHH:mm)
  closeTime?: string; // Thời gian kết thúc / Hạn nộp bài (YYYY-MM-DDTHH:mm)
  allowLateSubmission?: boolean; // Cho phép nộp muộn sau hạn chót (có gắn cờ nộp muộn)
  minTimePercentBeforeSubmit?: number; // Thời gian tối thiểu phải làm trước khi nộp (ví dụ: 0%, 30%, 50%)

  // 2. Target & Access Control
  accessType?: 'all' | 'assigned_classes' | 'registered'; // Đối tượng: Tất cả / Lớp chỉ định / Đã đăng ký
  requireStudentInfo?: {
    fullName: boolean;
    studentCode: boolean;
    classRoom: boolean;
    phone?: boolean;
    school?: boolean;
  };

  // 3. Score & Answer Key Visibility Policies
  scoreViewPolicy?: 'never' | 'after_submit' | 'after_closed'; // Khi nào được xem điểm: Không cho xem | Sau khi nộp bài | Khi tất cả thi xong / Đóng đề
  answerViewPolicy?: 'never' | 'after_submit' | 'after_closed' | 'when_passed'; // Khi nào được xem đáp án & lời giải
  minScoreToViewAnswer?: number; // Điểm tối thiểu để xem đáp án (nếu policy là when_passed)

  // 4. Proctoring & Anti-Cheat
  enableProctoring?: boolean; // Giám sát chống gian lận tự động
  strictFullScreen?: boolean; // Bắt buộc chế độ toàn màn hình khi làm bài
  preventCopyPaste?: boolean; // Chặn copy / paste / chuột phải
  maxTabSwitchesAllowed?: number; // Giới hạn số lần chuyển tab tối đa trước khi thu bài

  // 5. Submission & Layout Mode
  allowFileUploadEssay?: boolean; // Cho phép chụp ảnh bài làm tự luận tải lên (Azota signature feature)
  assignmentType?: 'exam' | 'homework'; // Loại: Đề thi / Bài tập về nhà
}

export type ExamStatus = 'draft' | 'scheduled' | 'published' | 'closed';

export interface ExamQuestionItem {
  questionId: string;
  points: number;
  order: number;
  question: Question;
}

export type ExamQuestion = ExamQuestionItem;

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  maxScore: number;
  passingScore: number;
  status: ExamStatus;
  openTime?: string;
  closeTime?: string;
  assignedClassIds: string[];
  settings: ExamSettings;
  questions: ExamQuestionItem[];
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  code: string; // e.g. HS001
  fullName: string;
  email?: string;
  phone?: string;
  classId: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  // Parent information (Thông tin phụ huynh mở rộng)
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string; // 'Bố' | 'Mẹ' | 'Người giám hộ' | 'Khác'
  parentNote?: string;
}

export type DayOfWeek = number; // 0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7

export type ScheduleRepeatType = 'none' | 'weekly' | 'daily' | 'weekdays' | 'custom';

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: DayOfWeek; // 1: Thứ 2, 2: Thứ 3, ..., 6: Thứ 7, 0: Chủ Nhật
  startTime: string; // e.g. "16:00"
  endTime: string; // e.g. "18:00"
  room?: string; // e.g. "Phòng 204"
  label?: string; // e.g. "Chiều thứ 4: 16h - 18h"
  color?: string; // e.g. "indigo"
  notes?: string;
  repeatType?: ScheduleRepeatType; // 'none' | 'weekly' | 'daily' | 'weekdays' | 'custom'
  repeatDays?: DayOfWeek[]; // e.g. [1, 3, 5] for T2, T4, T6
  repeatInterval?: number; // e.g. 1
  repeatEndType?: 'never' | 'until_date' | 'after_count';
  repeatEndDate?: string; // YYYY-MM-DD
  repeatCount?: number; // Số buổi
  startDate?: string; // YYYY-MM-DD
  specificDate?: string; // YYYY-MM-DD (dành cho 'none')
}

export interface SessionMaterialItem {
  id: string;
  title: string;
  url?: string;
  type?: string; // 'pdf' | 'docx' | 'slide' | 'link' | 'video'
  fileSize?: string;
}

export interface ClassTeachingSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: number; // 0..6
  shift: string; // e.g. "1 - 2" hoặc "Ca 1 - 2"
  startTime?: string;
  endTime?: string;
  room?: string; // e.g. "102_HQV"
  format?: 'offline' | 'online' | 'hybrid'; // "Trực tiếp" | "Online"
  teacherName?: string; // e.g. "Vũ Văn Thương"
  title?: string; // Tiêu đề / chủ đề bài giảng
  materials?: SessionMaterialItem[];
  assignedExamIds?: string[];
  attendanceDone?: boolean;
  notes?: string;
}

export interface CalendarSession {
  id: string;
  classId?: string; // Reference to ClassRoom
  className: string; // Class name or session title
  subject?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. "07:00"
  endTime: string; // HH:mm e.g. "09:00"
  room?: string; // e.g. "102_HQV" or "Phòng 201"
  color?: string; // e.g. "cyan" | "teal" | "blue" | "indigo" | "emerald" | "amber" | "rose"
  teacherName?: string;
  notes?: string;
  scheduleItemId?: string;
  repeatType?: ScheduleRepeatType;
  createdAt?: string;
}

export interface ClassFeeConfig {
  enabled: boolean; // Optional: whether tuition is tracked / shown
  feePerSession?: number; // e.g. 120000
  supplementaryFeePerSession?: number; // e.g. 30000
  feeNotes?: string; // e.g. "Học phí cơ bản: 120k/buổi"
  bankCode?: string; // e.g. "Techcombank"
  bankAccount?: string; // e.g. "0978783058"
  bankAccountName?: string; // e.g. "NGUYEN THANH THUY"
}

export interface ClassRoom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  academicYear: string;
  description: string;
  joinCode: string;
  allowSelfJoin: boolean;
  status: 'active' | 'archived';
  createdAt: string;
  schedule?: ClassScheduleItem[];
  feeConfig?: ClassFeeConfig;
}

export type AttendanceStatus = 'present' | 'late' | 'excused_absence' | 'unexcused_absence';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  sessionName?: string;
  scheduleItemId?: string; // ID ca học trong thời khóa biểu
  room?: string; // Phòng học từ TKB
  timeRange?: string; // Khung giờ từ TKB (ví dụ: 16:00 - 18:00)
  status: AttendanceStatus;
  note?: string;
  markedAt: string;
}

export interface BonusPointRecord {
  id: string;
  classId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  points: number; // e.g. +1, +2, +5, -1
  reason: string;
  category: 'academic' | 'attitude' | 'activity' | 'punctuality';
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface StudentDiligenceSummary {
  student: Student;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  unexcusedCount: number;
  totalSessions: number;
  attendanceRate: number; // 0 - 100 (%)
  bonusPoints: number; // sum of points
  diligenceScore: number; // 0 - 10 scale
  rankTier: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Cần rèn luyện';
}

export interface StudentAnswer {
  questionId: string;
  studentAnswer?: any;
  selectedOptions?: string[]; // for choices
  textAnswer?: string; // for short answer / essay
  attachments?: string[]; // ảnh chụp bài làm tự luận tải lên (Azota photo submission)
  isCorrect?: boolean;
  earnedPoints?: number;
  scoreAwarded?: number;
  manualScore?: number;
  isGraded?: boolean;
  teacherFeedback?: string;
  teacherComment?: string;
  aiSuggestedScore?: number;
  aiComment?: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId?: string;
  studentCode?: string;
  studentName: string;
  studentClassId?: string;
  className?: string;
  startedAt?: string;
  submittedAt: string;
  durationSeconds: number;
  answers: StudentAnswer[];
  attachments?: string[]; // Ảnh bài thi tổng hợp
  isLate?: boolean; // Nộp bài quá hạn
  objectiveScore?: number;
  totalScore: number;
  maxPossibleScore?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  tabSwitchCount?: number;
  tabSwitchesCount?: number;
  isPassed?: boolean;
  status: 'graded' | 'pending_grading';
  needsManualGrading: boolean;
  gradedAt?: string;
  gradedBy?: string;
  aiFeedbackSummary?: string;
}

export interface PublicDocument {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  fileType: string;
  downloadUrl?: string;
  downloadsCount: number;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  title: string; // e.g. Thạc sĩ Sư phạm Toán, Giáo viên THCS
  school: string;
  experienceYears: number;
  slug: string;
  bio: string;
  contactEmail?: string;
  contactPhone?: string;
  email: string;
  phone: string;
  avatarUrl: string;
  coverUrl?: string;
  brandColor?: string;
  customDomain?: string;
  customDomainConnected?: boolean;
  subjectSpecialties: string[];
  achievements?: string[];
  subjectsTaught?: string[];
  gradesTaught?: string[];
  socialLinks: {
    zalo?: string;
    facebook?: string;
    youtube?: string;
  };
  publicDocuments?: PublicDocument[];
  reviews?: ReviewItem[];
  stats: {
    studentCount: number;
    examCount: number;
    followerCount: number;
    publicDocumentCount: number;
  };
  sectionVisibility?: {
    about: boolean;
    freeExams: boolean;
    documents: boolean;
    reviews: boolean;
    contact: boolean;
  };
}

export interface TeacherDocument extends PublicDocument {
  downloadCount?: number;
  fileSize?: string;
  url?: string;
}

export interface StudentReview extends ReviewItem {
  studentName?: string;
  grade?: string;
  date?: string;
  avatarUrl?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'exam_published' | 'submission' | 'class_created' | 'question_imported' | 'graded';
  meta?: Record<string, any>;
}

export interface AIParsedQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  topic: string;
  knowledgeUnit?: string;
  cognitiveLevel: CognitiveLevel;
  difficulty: Difficulty;
  confidence: number;
  warnings?: string[];
}

export interface AIParsedExamResult {
  title: string;
  subject: string;
  grade: string;
  questions: AIParsedQuestion[];
}

export interface AIGradingResult {
  suggestedScore: number;
  maxScore: number;
  confidence: number;
  rationale: string;
  suggestedFeedback: string;
  keyPointsHit: string[];
  keyPointsMissed: string[];
}

export interface MonthlyStudentReport {
  id: string;
  classId: string;
  studentId: string;
  monthYear: string; // e.g. "8/2026"
  teacherName: string; // e.g. "GV. Nguyễn Thanh Thúy"
  teacherPhone: string; // e.g. "0978783058"
  studentName: string; // e.g. "Duy Anh"
  className: string; // e.g. "Lớp 9"
  studentPhone?: string; // e.g. "0987873058"
  
  // Optional Fee Details
  includeFee: boolean; // default false
  feePerSession?: number; // e.g. 120000
  sessionCount: number; // e.g. 12
  totalHours: number; // e.g. 26.6
  totalFee?: number; // e.g. 1320000
  
  // Bank details for VietQR (if includeFee is true)
  bankName?: string; // e.g. "Techcombank"
  bankAccount?: string; // e.g. "0978783058"
  bankAccountName?: string; // e.g. "NGUYEN THANH THUY"
  
  // Study Days in month
  sessionDates: string[]; // e.g. ['04/08', '07/08', '07/08', '09/08', '12/08', '13/08', '17/08', '18/08', '21/08', '24/08', '26/08', '28/08']
  
  // Assessment sections (Teacher writes manually, NO AI required)
  generalComment: string; // Nhận xét của giáo viên
  algebraComment?: string; // Nhận xét môn/phân môn 1 (ví dụ: Đại số - tuỳ chọn)
  geometryComment?: string; // Nhận xét môn/phân môn 2 (ví dụ: Hình học - tuỳ chọn)
  otherComment?: string; // Nhận xét bổ sung
  
  // Upcoming Roadmap
  roadmapGeneral?: string; // Lộ trình & Mục tiêu chung sắp tới
  roadmapAlgebra?: string; // Lộ trình phân môn 1 (cũ)
  roadmapGeometry?: string; // Lộ trình phân môn 2 (cũ)
  roadmapOther?: string; // Lộ trình khác
  
  // Schedule and Fee text at bottom
  scheduleItems: string[]; // e.g. ["Chiều thứ 4: 16h - 18h", "Chiều thứ 7: 13h - 15h", "Chiều chủ nhật: 13h - 15h"]
  feeDetails?: string[]; // e.g. ["Học phí cơ bản: 120k/buổi", "Học phí bổ trợ tối: 30k/buổi"]
  footerNote: string; // e.g. "Phụ huynh vui lòng kiểm tra thông tin học phí và lịch học. Cháu cảm ơn ạ."
  createdAt: string;
}

export interface TeacherNotification {
  id: string;
  title: string;
  message: string;
  time: string; // Display time, e.g. "10 phút trước", "Hôm nay, 08:30"
  type: 'submission' | 'grading' | 'attendance' | 'schedule' | 'fee' | 'message' | 'system';
  read: boolean;
  actionUrl?: string;
  senderName?: string;
  avatar?: string;
  createdAt: string;
}
