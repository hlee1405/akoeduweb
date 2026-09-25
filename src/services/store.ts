import {
  TeacherProfile,
  ClassRoom,
  Student,
  Question,
  Exam,
  Submission,
  TeacherDocument,
  StudentReview,
  ActivityLog,
  AttendanceRecord,
  BonusPointRecord,
  StudentDiligenceSummary,
  AttendanceStatus,
  ClassScheduleItem,
  ClassFeeConfig,
  MonthlyStudentReport,
  CalendarSession,
  TeacherNotification
} from '../types';
import {
  INITIAL_TEACHER,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_QUESTIONS,
  INITIAL_EXAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_DOCUMENTS,
  INITIAL_REVIEWS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_BONUS_POINTS,
  INITIAL_MONTHLY_REPORTS,
  INITIAL_SESSIONS,
  INITIAL_NOTIFICATIONS
} from './demoData';

const STORAGE_KEY = 'ako_storage_v1';
const LEGACY_STORAGE_KEY = 'edu101_storage_v1';

interface AppStorageState {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  submissions: Submission[];
  documents: TeacherDocument[];
  reviews: StudentReview[];
  activityLogs: ActivityLog[];
  attendanceRecords: AttendanceRecord[];
  bonusPoints: BonusPointRecord[];
  monthlyReports: MonthlyStudentReport[];
  sessions: CalendarSession[];
  notifications: TeacherNotification[];
}

class StoreService {
  private state: AppStorageState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): AppStorageState {
    const defaultState: AppStorageState = {
      teacher: INITIAL_TEACHER,
      classes: INITIAL_CLASSES,
      students: INITIAL_STUDENTS,
      questions: INITIAL_QUESTIONS,
      exams: INITIAL_EXAMS,
      submissions: INITIAL_SUBMISSIONS,
      documents: INITIAL_DOCUMENTS,
      reviews: INITIAL_REVIEWS,
      activityLogs: INITIAL_ACTIVITY_LOGS,
      attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
      bonusPoints: INITIAL_BONUS_POINTS,
      monthlyReports: INITIAL_MONTHLY_REPORTS,
      sessions: INITIAL_SESSIONS,
      notifications: INITIAL_NOTIFICATIONS
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.teacher && Array.isArray(parsed.classes) && Array.isArray(parsed.questions)) {
          const storedSubs = Array.isArray(parsed.submissions) ? parsed.submissions : [];
          const finalSubmissions = [
            ...storedSubs,
            ...INITIAL_SUBMISSIONS.filter((initSub) => !storedSubs.some((s: any) => s.id === initSub.id))
          ];

          // Merge schedule and feeConfig if missing in stored classes, and include any new INITIAL_CLASSES
          const storedClasses: ClassRoom[] = Array.isArray(parsed.classes) ? parsed.classes : INITIAL_CLASSES;
          const classMap = new Map<string, ClassRoom>();
          INITIAL_CLASSES.forEach((c) => classMap.set(c.id, c));
          storedClasses.forEach((c) => {
            const initCls = INITIAL_CLASSES.find((ic) => ic.id === c.id);
            const resolvedDescription = initCls ? initCls.description : (c.description ? c.description.slice(0, 30) : '');
            classMap.set(c.id, {
              ...c,
              description: resolvedDescription,
              schedule: c.schedule || initCls?.schedule || [],
              feeConfig: c.feeConfig || initCls?.feeConfig
            });
          });
          const finalClasses = Array.from(classMap.values());

          // Ensure students list has initial students if missing
          const storedStudents: Student[] = Array.isArray(parsed.students) ? parsed.students : INITIAL_STUDENTS;
          const studentMap = new Map<string, Student>();
          INITIAL_STUDENTS.forEach((s) => studentMap.set(s.id, s));
          storedStudents.forEach((s) => studentMap.set(s.id, s));

          // Ensure at least 5 pending students exist for simulation
          const pendingInStore = Array.from(studentMap.values()).filter((s) => s.status === 'pending');
          if (pendingInStore.length < 5) {
            INITIAL_STUDENTS.filter((s) => s.status === 'pending').forEach((s) => {
              studentMap.set(s.id, { ...s, status: 'pending' });
            });
          }

          const finalStudents = Array.from(studentMap.values());

          // If stored sessions is excessively large (the previous 68-session mock), replace with fresh trimmed INITIAL_SESSIONS
          const isOldMockSessions = Array.isArray(parsed.sessions) && (parsed.sessions.length > 15 || parsed.sessions.some((s: any) => s.id === 'sess-68'));
          const storedSessions: CalendarSession[] = (!isOldMockSessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0)
            ? parsed.sessions
            : INITIAL_SESSIONS;

          const storedNotifications: TeacherNotification[] = Array.isArray(parsed.notifications) && parsed.notifications.length > 0
            ? parsed.notifications
            : INITIAL_NOTIFICATIONS;

          // Deduplicate and ensure unique IDs for questions in case duplicates were saved
          const rawQuestions: Question[] = Array.isArray(parsed.questions) ? parsed.questions : INITIAL_QUESTIONS;
          const seenQIds = new Set<string>();
          const sanitizedQuestions: Question[] = rawQuestions.map((q: Question, idx: number) => {
            if (!q.id || seenQIds.has(q.id)) {
              const uniqueId = `q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
              seenQIds.add(uniqueId);
              return { ...q, id: uniqueId };
            }
            seenQIds.add(q.id);
            return q;
          });

          // Ensure exam questions have unique IDs and include initial exams
          const baseRawExams: Exam[] = Array.isArray(parsed.exams) ? parsed.exams : INITIAL_EXAMS;
          const mergedExams = [
            ...baseRawExams,
            ...INITIAL_EXAMS.filter((ie) => !baseRawExams.some((re: Exam) => re.id === ie.id))
          ];
          const seenExamIds = new Set<string>();
          const sanitizedExams: Exam[] = mergedExams.map((ex: Exam, eIdx: number) => {
            const exId = (!ex.id || seenExamIds.has(ex.id)) ? `exam-${Date.now()}-${eIdx}` : ex.id;
            seenExamIds.add(exId);
            const seenInExamQIds = new Set<string>();
            const sanitizedExamQuestions = (ex.questions || []).map((qItem, qIdx) => {
              const qId = (!qItem.questionId || seenInExamQIds.has(qItem.questionId))
                ? `${qItem.questionId || 'q'}-dup-${eIdx}-${qIdx}`
                : qItem.questionId;
              seenInExamQIds.add(qId);
              let qObj = qItem.question;
              if (qObj && (qObj.type as string) === 'essay') {
                qObj = {
                  ...qObj,
                  type: 'single_choice',
                  options: [
                    { id: 'A', content: 'Phương án A' },
                    { id: 'B', content: 'Phương án B' },
                    { id: 'C', content: 'Phương án C' },
                    { id: 'D', content: 'Phương án D' }
                  ],
                  correctAnswers: ['A']
                };
              }
              return {
                ...qItem,
                questionId: qId,
                question: qObj ? { ...qObj, id: qId } : qObj
              };
            });

            const cleanedTitle = (ex.title || '')
              .replace('(Trắc nghiệm + Tự luận)', '(Trắc nghiệm chuẩn 8 câu)')
              .replace('+ Tự luận', '')
              .replace('& Tự luận', '')
              .trim();

            const cleanedDesc = (ex.description || '')
              .replace('và Tự luận giải toán.', '100% trắc nghiệm khách quan.')
              .replace('Tự luận', 'Trắc nghiệm')
              .trim();

            // Normalize 2024 dates to 2026 for consistent time filtering
            const rawCreatedAt = ex.createdAt || '2026-08-15T08:00:00.000Z';
            const normalizedCreatedAt = rawCreatedAt.startsWith('2024-')
              ? rawCreatedAt.replace('2024-', '2026-')
              : rawCreatedAt;

            return {
              ...ex,
              id: exId,
              title: cleanedTitle,
              description: cleanedDesc,
              createdAt: normalizedCreatedAt,
              questions: sanitizedExamQuestions
            };
          });

          // Ensure submission answers have unique questionIds per submission
          const sanitizedSubmissions: Submission[] = finalSubmissions.map((sub: Submission, sIdx: number) => {
            const seenAnsQIds = new Set<string>();
            const sanitizedAnswers = (sub.answers || []).map((ans, aIdx) => {
              const qId = (!ans.questionId || seenAnsQIds.has(ans.questionId))
                ? `${ans.questionId || 'ans'}-dup-${sIdx}-${aIdx}`
                : ans.questionId;
              seenAnsQIds.add(qId);
              return { ...ans, questionId: qId };
            });

            const submittedAtNormalized = sub.submittedAt && sub.submittedAt.startsWith('2024-')
              ? sub.submittedAt.replace('2024-', '2026-')
              : sub.submittedAt;

            return {
              ...sub,
              submittedAt: submittedAtNormalized,
              answers: sanitizedAnswers
            };
          });

          return {
            ...defaultState,
            ...parsed,
            questions: sanitizedQuestions,
            exams: sanitizedExams,
            classes: finalClasses,
            students: finalStudents,
            submissions: sanitizedSubmissions,
            attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : INITIAL_ATTENDANCE_RECORDS,
            bonusPoints: Array.isArray(parsed.bonusPoints) ? parsed.bonusPoints : INITIAL_BONUS_POINTS,
            monthlyReports: Array.isArray(parsed.monthlyReports) && parsed.monthlyReports.length > 0
              ? parsed.monthlyReports.map((r: MonthlyStudentReport) => ({ ...r, includeFee: false }))
              : INITIAL_MONTHLY_REPORTS,
            sessions: storedSessions,
            notifications: storedNotifications
          };
        }
      }
    } catch (e) {
      console.warn('Could not load from localStorage, initializing default demo state.', e);
    }

    this.saveToStorage(defaultState);
    return defaultState;
  }

  private saveToStorage(state: AppStorageState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private notify(): void {
    this.saveToStorage(this.state);
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public restoreDemoData(): void {
    this.state = {
      teacher: INITIAL_TEACHER,
      classes: INITIAL_CLASSES,
      students: INITIAL_STUDENTS,
      questions: INITIAL_QUESTIONS,
      exams: INITIAL_EXAMS,
      submissions: INITIAL_SUBMISSIONS,
      documents: INITIAL_DOCUMENTS,
      reviews: INITIAL_REVIEWS,
      activityLogs: INITIAL_ACTIVITY_LOGS,
      attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
      bonusPoints: INITIAL_BONUS_POINTS,
      monthlyReports: INITIAL_MONTHLY_REPORTS,
      sessions: INITIAL_SESSIONS,
      notifications: INITIAL_NOTIFICATIONS
    };
    this.notify();
  }

  // === Teacher Profile ===
  public getTeacher(): TeacherProfile {
    return this.state.teacher;
  }

  public updateTeacher(updates: Partial<TeacherProfile>): TeacherProfile {
    this.state.teacher = { ...this.state.teacher, ...updates };
    this.notify();
    return this.state.teacher;
  }

  // === Classes ===
  public getClasses(): ClassRoom[] {
    return [...this.state.classes];
  }

  public getClassById(id: string): ClassRoom | undefined {
    return this.state.classes.find((c) => c.id === id);
  }

  public getClassByJoinCode(code: string): ClassRoom | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    return this.state.classes.find(
      (c) => c.joinCode && c.joinCode.trim().toUpperCase() === clean
    );
  }

  public addClass(cls: Omit<ClassRoom, 'id' | 'createdAt'>): ClassRoom {
    const newClass: ClassRoom = {
      ...cls,
      description: cls.description ? cls.description.slice(0, 30) : '',
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.state.classes.unshift(newClass);
    this.addActivityLog({
      title: 'Tạo lớp học mới',
      description: `Đã tạo lớp ${newClass.name} (Mã: ${newClass.joinCode})`,
      type: 'class_created'
    });
    this.notify();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<ClassRoom>): ClassRoom | undefined {
    const index = this.state.classes.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.description !== undefined) {
      sanitizedUpdates.description = sanitizedUpdates.description ? sanitizedUpdates.description.slice(0, 30) : '';
    }
    this.state.classes[index] = { ...this.state.classes[index], ...sanitizedUpdates };
    this.notify();
    return this.state.classes[index];
  }

  public deleteClass(id: string): boolean {
    this.state.classes = this.state.classes.filter((c) => c.id !== id);
    this.state.students = this.state.students.filter((s) => s.classId !== id);
    this.notify();
    return true;
  }

  // === Students ===
  public getStudents(): Student[] {
    return [...this.state.students];
  }

  public getActiveStudents(): Student[] {
    return this.state.students.filter((s) => s.status !== 'pending');
  }

  public getPendingStudents(): Student[] {
    let pending = this.state.students.filter((s) => s.status === 'pending');
    if (pending.length < 5) {
      INITIAL_STUDENTS.filter((s) => s.status === 'pending').forEach((initPending) => {
        const idx = this.state.students.findIndex((s) => s.id === initPending.id);
        if (idx !== -1) {
          this.state.students[idx] = { ...initPending, status: 'pending' };
        } else {
          this.state.students.push({ ...initPending, status: 'pending' });
        }
      });
      this.saveToStorage(this.state);
      pending = this.state.students.filter((s) => s.status === 'pending');
    }
    return pending;
  }

  public resetPendingStudents(): Student[] {
    INITIAL_STUDENTS.filter((s) => s.status === 'pending').forEach((initPending) => {
      const idx = this.state.students.findIndex((s) => s.id === initPending.id);
      if (idx !== -1) {
        this.state.students[idx] = { ...initPending, status: 'pending' };
      } else {
        this.state.students.push({ ...initPending, status: 'pending' });
      }
    });
    this.saveToStorage(this.state);
    this.notify();
    return this.state.students.filter((s) => s.status === 'pending');
  }

  public getStudentsByClassId(classId: string, status?: 'active' | 'pending' | 'all'): Student[] {
    if (status === 'pending') {
      return this.state.students.filter((s) => s.classId === classId && s.status === 'pending');
    }
    if (status === 'active') {
      return this.state.students.filter((s) => s.classId === classId && s.status === 'active');
    }
    if (status === 'all') {
      return this.state.students.filter((s) => s.classId === classId);
    }
    // Default to active students when viewing class members
    return this.state.students.filter((s) => s.classId === classId && s.status !== 'pending');
  }

  public getPendingStudentsByClassId(classId: string): Student[] {
    return this.state.students.filter((s) => s.classId === classId && s.status === 'pending');
  }

  public approveStudent(id: string, updatedData?: Partial<Student>): Student | undefined {
    const index = this.state.students.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    const existing = this.state.students[index];
    const updated: Student = {
      ...existing,
      ...(updatedData || {}),
      status: 'active',
      joinedAt: new Date().toISOString()
    };

    this.state.students[index] = updated;
    this.state.teacher.stats.studentCount = this.state.students.filter((s) => s.status === 'active').length;

    const cls = this.getClassById(updated.classId);
    this.addActivityLog({
      title: 'Duyệt học sinh vào lớp',
      description: `Đã duyệt học sinh ${updated.fullName} (Mã: ${updated.code}) vào lớp ${cls?.name || ''}`,
      type: 'student_added'
    });

    this.notify();
    return updated;
  }

  public rejectStudent(id: string): boolean {
    const student = this.state.students.find((s) => s.id === id);
    if (!student) return false;

    this.state.students = this.state.students.filter((s) => s.id !== id);
    this.state.teacher.stats.studentCount = this.state.students.filter((s) => s.status === 'active').length;

    const cls = this.getClassById(student.classId);
    this.addActivityLog({
      title: 'Từ chối yêu cầu vào lớp',
      description: `Đã từ chối yêu cầu tham gia lớp ${cls?.name || ''} của ${student.fullName}`,
      type: 'student_removed'
    });

    this.notify();
    return true;
  }

  public approveStudentsBatch(studentList: Array<{ id: string; updates?: Partial<Student> }>): Student[] {
    const approved: Student[] = [];
    studentList.forEach(({ id, updates }) => {
      const res = this.approveStudent(id, updates);
      if (res) approved.push(res);
    });
    return approved;
  }

  public rejectStudentsBatch(ids: string[]): boolean {
    ids.forEach((id) => this.rejectStudent(id));
    return true;
  }

  public addStudent(student: Omit<Student, 'id' | 'joinedAt'>): Student {
    const newStudent: Student = {
      ...student,
      id: `hs-${Date.now()}`,
      joinedAt: new Date().toISOString()
    };
    this.state.students.push(newStudent);
    this.state.teacher.stats.studentCount = this.state.students.length;
    this.notify();
    return newStudent;
  }

  public addStudentsBatch(students: Array<Omit<Student, 'id' | 'joinedAt'>>): Student[] {
    const now = new Date().toISOString();
    const created: Student[] = students.map((s, idx) => ({
      ...s,
      id: `hs-${Date.now()}-${idx}`,
      joinedAt: now
    }));
    this.state.students.push(...created);
    this.state.teacher.stats.studentCount = this.state.students.length;
    this.notify();
    return created;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const index = this.state.students.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    this.state.students[index] = { ...this.state.students[index], ...updates };
    this.notify();
    return this.state.students[index];
  }

  public deleteStudent(id: string): boolean {
    this.state.students = this.state.students.filter((s) => s.id !== id);
    this.state.teacher.stats.studentCount = this.state.students.length;
    this.notify();
    return true;
  }

  // === Questions ===
  public getQuestions(): Question[] {
    return [...this.state.questions];
  }

  public getQuestionById(id: string): Question | undefined {
    return this.state.questions.find((q) => q.id === id);
  }

  public addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Question {
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.state.questions.unshift(newQuestion);
    this.notify();
    return newQuestion;
  }

  public addQuestionsBatch(questions: Array<Omit<Question, 'id' | 'createdAt'>>): Question[] {
    const now = new Date().toISOString();
    const created: Question[] = questions.map((q, idx) => ({
      ...q,
      id: `q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now
    }));
    this.addActivityLog({
      title: 'Nhập câu hỏi mới',
      description: `Đã thêm ${created.length} câu hỏi vào ngân hàng câu hỏi`,
      type: 'question_imported'
    });
    this.state.questions.unshift(...created);
    this.notify();
    return created;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | undefined {
    const index = this.state.questions.findIndex((q) => q.id === id);
    if (index === -1) return undefined;
    this.state.questions[index] = { ...this.state.questions[index], ...updates };
    this.notify();
    return this.state.questions[index];
  }

  public deleteQuestion(id: string): boolean {
    this.state.questions = this.state.questions.filter((q) => q.id !== id);
    this.notify();
    return true;
  }

  public duplicateQuestion(id: string): Question | undefined {
    const existing = this.getQuestionById(id);
    if (!existing) return undefined;
    const duplicated: Question = {
      ...existing,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      content: `${existing.content} (Bản sao)`,
      createdAt: new Date().toISOString()
    };
    this.state.questions.unshift(duplicated);
    this.notify();
    return duplicated;
  }

  // === Exams ===
  public getExams(): Exam[] {
    return [...this.state.exams];
  }

  public getExamById(id: string): Exam | undefined {
    return this.state.exams.find((e) => e.id === id);
  }

  public addExam(exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Exam {
    const now = new Date().toISOString();
    const examId = (exam as any).id || `exam-${Date.now()}`;
    const newExam: Exam = {
      ...exam,
      id: examId,
      createdAt: (exam as any).createdAt || now,
      updatedAt: now
    };
    const existingIndex = this.state.exams.findIndex((e) => e.id === examId);
    if (existingIndex >= 0) {
      this.state.exams[existingIndex] = newExam;
    } else {
      this.state.exams.unshift(newExam);
    }
    this.state.teacher.stats.examCount = this.state.exams.length;
    this.addActivityLog({
      title: 'Tạo đề thi mới',
      description: `Đã tạo đề thi "${newExam.title}" (${newExam.questions.length} câu)`,
      type: 'exam_published'
    });
    this.notify();
    return newExam;
  }

  public updateExam(id: string, updates: Partial<Exam>): Exam {
    let index = this.state.exams.findIndex((e) => e.id === id);
    if (index === -1 && updates.title) {
      // Fallback: match by title if id drifted
      index = this.state.exams.findIndex((e) => e.title === updates.title);
    }

    if (index === -1) {
      // Upsert fallback to ensure exam is never lost
      const fallbackExam: Exam = {
        id,
        title: updates.title || 'Đề thi trắc nghiệm',
        description: updates.description || 'Đề kiểm tra trực tuyến',
        subject: updates.subject || 'Toán học',
        grade: updates.grade || 'Khối 9',
        durationMinutes: updates.durationMinutes ?? 45,
        maxScore: updates.maxScore ?? 10,
        passingScore: updates.passingScore ?? 5,
        status: updates.status || 'published',
        questions: updates.questions || [],
        assignedClassIds: updates.assignedClassIds || [],
        settings: updates.settings || {
          shuffleQuestions: false,
          shuffleOptions: false,
          showOneByOne: false,
          allowBacktrack: true,
          autoSubmitOnTimeUp: true,
          allowAnonymous: true,
          showScoreImmediately: true,
          showAnswersImmediately: true,
          showExplanationAfterClose: true,
          trackTabSwitches: false,
          maxAttempts: 1
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      };
      this.state.exams.unshift(fallbackExam);
      this.notify();
      return fallbackExam;
    }

    this.state.exams[index] = {
      ...this.state.exams[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.notify();
    return this.state.exams[index];
  }

  public deleteExam(id: string): boolean {
    this.state.exams = this.state.exams.filter((e) => e.id !== id);
    this.state.teacher.stats.examCount = this.state.exams.length;
    this.notify();
    return true;
  }

  public duplicateExam(id: string): Exam | undefined {
    const existing = this.getExamById(id);
    if (!existing) return undefined;
    const now = new Date().toISOString();
    const duplicated: Exam = {
      ...existing,
      id: `exam-${Date.now()}`,
      title: `${existing.title} (Bản sao)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
    this.state.exams.unshift(duplicated);
    this.state.teacher.stats.examCount = this.state.exams.length;
    this.notify();
    return duplicated;
  }

  // === Submissions ===
  public getSubmissions(): Submission[] {
    return [...this.state.submissions];
  }

  public getSubmissionsByExamId(examId: string): Submission[] {
    return this.state.submissions.filter((s) => s.examId === examId);
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.state.submissions.find((s) => s.id === id);
  }

  public seedPendingSubmissions(): void {
    const existingIds = new Set(this.state.submissions.map((s) => s.id));
    const demoPending = INITIAL_SUBMISSIONS.filter((s) => s.status === 'pending_grading' || s.needsManualGrading);
    demoPending.forEach((sub) => {
      if (existingIds.has(sub.id)) {
        const idx = this.state.submissions.findIndex((s) => s.id === sub.id);
        if (idx !== -1) {
          this.state.submissions[idx] = { ...sub };
        }
      } else {
        this.state.submissions.unshift({ ...sub });
      }
    });
    this.notify();
  }

  public addSubmission(submission: Omit<Submission, 'id'>): Submission {
    const newSubmission: Submission = {
      ...submission,
      id: `sub-${Date.now()}`
    };
    this.state.submissions.unshift(newSubmission);
    this.addActivityLog({
      title: 'Lượt nộp bài mới',
      description: `Học sinh ${newSubmission.studentName} vừa nộp bài (${newSubmission.totalScore}/${newSubmission.maxPossibleScore || 10}đ)`,
      type: 'submission'
    });
    this.notify();
    return newSubmission;
  }

  public updateSubmission(id: string, updates: Partial<Submission>): Submission | undefined {
    const index = this.state.submissions.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    this.state.submissions[index] = { ...this.state.submissions[index], ...updates };
    this.notify();
    return this.state.submissions[index];
  }

  public updateSubmissionGrading(
    id: string,
    updatedAnswers: { questionId: string; scoreAwarded: number; teacherComment?: string }[],
    feedbackSummary?: string
  ): Submission | undefined {
    const index = this.state.submissions.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    const sub = this.state.submissions[index];
    const newAnswers = sub.answers.map((ans) => {
      const patch = updatedAnswers.find((u) => u.questionId === ans.questionId);
      if (patch) {
        return {
          ...ans,
          scoreAwarded: patch.scoreAwarded,
          teacherComment: patch.teacherComment || ans.teacherComment
        };
      }
      return ans;
    });

    const totalScore = Number(newAnswers.reduce((sum, a) => sum + (a.scoreAwarded || 0), 0).toFixed(2));

    this.state.submissions[index] = {
      ...sub,
      answers: newAnswers,
      totalScore,
      status: 'graded',
      needsManualGrading: false,
      gradedAt: new Date().toISOString(),
      gradedBy: this.state.teacher.fullName,
      aiFeedbackSummary: feedbackSummary || sub.aiFeedbackSummary
    };

    this.addActivityLog({
      title: 'Chấm bài hoàn tất',
      description: `Đã chấm bài tự luận cho học sinh ${sub.studentName} (${totalScore}/${sub.maxPossibleScore}đ)`,
      type: 'graded'
    });

    this.notify();
    return this.state.submissions[index];
  }

  // === Activity Logs ===
  public getActivityLogs(): ActivityLog[] {
    return [...this.state.activityLogs];
  }

  public addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.state.activityLogs.unshift(newLog);
    if (this.state.activityLogs.length > 50) {
      this.state.activityLogs.pop();
    }
  }

  // === Documents & Reviews ===
  public getDocuments(): TeacherDocument[] {
    return [...this.state.documents];
  }

  public getReviews(): StudentReview[] {
    return [...this.state.reviews];
  }

  public addReview(review: Omit<StudentReview, 'id' | 'date'>): StudentReview {
    const newReview: StudentReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    this.state.reviews.unshift(newReview);
    this.notify();
    return newReview;
  }

  // === Điểm danh (Attendance) ===
  public getAttendanceRecords(classId?: string, date?: string): AttendanceRecord[] {
    let list = [...(this.state.attendanceRecords || [])];
    if (classId) {
      list = list.filter((r) => r.classId === classId);
    }
    if (date) {
      list = list.filter((r) => r.date === date);
    }
    return list;
  }

  public getAttendanceDates(classId: string): string[] {
    const records = this.getAttendanceRecords(classId);
    const datesSet = new Set<string>();
    records.forEach((r) => datesSet.add(r.date));
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }

  public batchSaveAttendance(
    classId: string,
    date: string,
    sessionName: string,
    studentStatuses: { studentId: string; status: AttendanceStatus; note?: string }[],
    meta?: { scheduleItemId?: string; room?: string; timeRange?: string }
  ): void {
    const students = this.getStudentsByClassId(classId);
    const currentRecords = [...(this.state.attendanceRecords || [])];

    // Remove existing records for this classId, date, and sessionName
    const otherRecords = currentRecords.filter(
      (r) => !(r.classId === classId && r.date === date && (sessionName ? r.sessionName === sessionName : true))
    );

    const newRecords: AttendanceRecord[] = studentStatuses.map((item, idx) => {
      const student = students.find((s) => s.id === item.studentId);
      return {
        id: `att-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        classId,
        studentId: item.studentId,
        studentCode: student?.code || `HS-${item.studentId.slice(-3)}`,
        studentName: student?.fullName || 'Học sinh',
        date,
        sessionName: sessionName || 'Tiết học',
        scheduleItemId: meta?.scheduleItemId,
        room: meta?.room,
        timeRange: meta?.timeRange,
        status: item.status,
        note: item.note || '',
        markedAt: new Date().toISOString()
      };
    });

    this.state.attendanceRecords = [...newRecords, ...otherRecords];

    const presentCount = studentStatuses.filter((s) => s.status === 'present').length;
    const cls = this.getClassById(classId);
    this.addActivityLog({
      title: 'Điểm danh lớp học',
      description: `Đã lưu điểm danh ngày ${date} cho lớp ${cls?.name || classId} (${presentCount}/${studentStatuses.length} có mặt)`,
      type: 'submission'
    });

    this.notify();
  }

  public updateSingleAttendance(
    recordId: string,
    updates: Partial<Omit<AttendanceRecord, 'id' | 'classId' | 'studentId'>>
  ): AttendanceRecord | undefined {
    const idx = (this.state.attendanceRecords || []).findIndex((r) => r.id === recordId);
    if (idx === -1) return undefined;

    this.state.attendanceRecords[idx] = {
      ...this.state.attendanceRecords[idx],
      ...updates,
      markedAt: new Date().toISOString()
    };
    this.notify();
    return this.state.attendanceRecords[idx];
  }

  public deleteAttendanceSession(classId: string, date: string, sessionName?: string): void {
    this.state.attendanceRecords = (this.state.attendanceRecords || []).filter(
      (r) => !(r.classId === classId && r.date === date && (!sessionName || r.sessionName === sessionName))
    );
    this.notify();
  }

  // === Điểm thưởng (Bonus Points & Merit) ===
  public getBonusPoints(classId?: string, studentId?: string): BonusPointRecord[] {
    let list = [...(this.state.bonusPoints || [])];
    if (classId) {
      list = list.filter((b) => b.classId === classId);
    }
    if (studentId) {
      list = list.filter((b) => b.studentId === studentId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addBonusPoint(record: Omit<BonusPointRecord, 'id' | 'createdAt'>): BonusPointRecord {
    const newRecord: BonusPointRecord = {
      ...record,
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    if (!this.state.bonusPoints) {
      this.state.bonusPoints = [];
    }

    this.state.bonusPoints.unshift(newRecord);

    const cls = this.getClassById(record.classId);
    this.addActivityLog({
      title: 'Khen thưởng & Điểm cộng',
      description: `Đã cộng ${record.points > 0 ? '+' : ''}${record.points} điểm cho ${record.studentName} (${record.reason})`,
      type: 'graded'
    });

    this.notify();
    return newRecord;
  }

  public deleteBonusPoint(id: string): void {
    this.state.bonusPoints = (this.state.bonusPoints || []).filter((b) => b.id !== id);
    this.notify();
  }

  public setStudentBonusStars(
    classId: string,
    studentId: string,
    studentCode: string,
    studentName: string,
    targetStars: number
  ): void {
    const clamped = Math.max(0, Math.round(Number(targetStars) || 0));
    // Clear existing bonus points for this student in this class
    this.state.bonusPoints = (this.state.bonusPoints || []).filter(
      (b) => !(b.classId === classId && b.studentId === studentId)
    );

    if (clamped > 0) {
      if (!this.state.bonusPoints) {
        this.state.bonusPoints = [];
      }
      this.state.bonusPoints.unshift({
        id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        classId,
        studentId,
        studentCode,
        studentName,
        points: clamped,
        reason: 'Thưởng sao học tập & thi đua',
        category: 'academic',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    this.notify();
  }

  // === Điểm chuyên cần (Diligence Score & Summaries) ===
  public getClassDiligenceSummaries(classId: string): StudentDiligenceSummary[] {
    const students = this.getStudentsByClassId(classId);
    const attendanceRecords = this.getAttendanceRecords(classId);
    const bonusPoints = this.getBonusPoints(classId);

    // Calculate unique attendance session keys (date + sessionName)
    const sessionKeysSet = new Set<string>();
    attendanceRecords.forEach((r) => sessionKeysSet.add(`${r.date}_${r.sessionName || 'session'}`));
    const totalSessions = Math.max(1, sessionKeysSet.size);

    return students.map((student) => {
      const studentAtt = attendanceRecords.filter((r) => r.studentId === student.id);
      const studentBonus = bonusPoints.filter((b) => b.studentId === student.id);

      const presentCount = studentAtt.filter((r) => r.status === 'present').length;
      const lateCount = studentAtt.filter((r) => r.status === 'late').length;
      const excusedCount = studentAtt.filter((r) => r.status === 'excused_absence').length;
      const unexcusedCount = studentAtt.filter((r) => r.status === 'unexcused_absence').length;

      // Attendance rate formula: (present*1 + late*0.8 + excused*0.5) / recorded_sessions
      const attendedSessions = studentAtt.length;
      let attendanceRate = 100;
      if (attendedSessions > 0) {
        const effectivePresent = presentCount * 1.0 + lateCount * 0.8 + excusedCount * 0.5;
        attendanceRate = Math.min(100, Math.max(0, Math.round((effectivePresent / attendedSessions) * 100)));
      }

      // Bonus points sum
      const totalBonus = studentBonus.reduce((sum, b) => sum + (b.points || 0), 0);

      // Diligence score calculation on 10.0 scale:
      // Base: 10.0
      // Penalty: late (-0.5), excused (-0.5), unexcused (-2.0)
      // Bonus: +0.25 per bonus point (max bonus contribution +2.0)
      let baseScore = 10.0;
      if (attendedSessions > 0) {
        baseScore = 10.0 - (lateCount * 0.5 + excusedCount * 0.5 + unexcusedCount * 2.0);
      }
      const scoreWithBonus = baseScore + Math.min(2.0, totalBonus * 0.25);
      const diligenceScore = Number(Math.max(0, Math.min(10, scoreWithBonus)).toFixed(1));

      let rankTier: StudentDiligenceSummary['rankTier'] = 'Trung bình';
      if (diligenceScore >= 9.0 && attendanceRate >= 95) rankTier = 'Xuất sắc';
      else if (diligenceScore >= 8.0 && attendanceRate >= 85) rankTier = 'Tốt';
      else if (diligenceScore >= 6.5 && attendanceRate >= 70) rankTier = 'Khá';
      else if (diligenceScore >= 5.0) rankTier = 'Trung bình';
      else rankTier = 'Cần rèn luyện';

      return {
        student,
        presentCount,
        lateCount,
        excusedCount,
        unexcusedCount,
        totalSessions: attendedSessions || totalSessions,
        attendanceRate,
        bonusPoints: totalBonus,
        diligenceScore,
        rankTier
      };
    }).sort((a, b) => {
      // Sort by diligence score high to low, then bonus points
      if (b.diligenceScore !== a.diligenceScore) {
        return b.diligenceScore - a.diligenceScore;
      }
      return b.bonusPoints - a.bonusPoints;
    });
  }

  // === Thời khóa biểu & Biểu phí (Schedule & Fee Config) ===
  public syncScheduleToSessions(classId: string, schedule: ClassScheduleItem[]): void {
    const cls = this.getClassById(classId);
    if (!cls) return;

    // Filter out existing auto-synced sessions for this class
    const preservedSessions = (this.state.sessions || []).filter(
      (s) => s.classId !== classId || !s.scheduleItemId
    );

    const newSessions: CalendarSession[] = [];
    const baseDate = new Date(2026, 8, 1); // 2026-09-01
    // Generate for 90 days (covers active semester view: Sep, Oct, Nov)
    const maxDays = 90;

    for (const item of schedule) {
      if (item.repeatType === 'none') {
        const targetDate = item.specificDate || item.startDate || '2026-09-17';
        newSessions.push({
          id: `sess-sync-${item.id}-${targetDate}`,
          classId: cls.id,
          className: item.label || cls.name,
          subject: cls.subject || 'Toán học',
          date: targetDate,
          startTime: item.startTime,
          endTime: item.endTime,
          room: item.room || 'Phòng 201',
          color: item.color || 'indigo',
          notes: item.notes,
          scheduleItemId: item.id,
          repeatType: item.repeatType,
          createdAt: new Date().toISOString()
        });
        continue;
      }

      const daysOfWeekToMatch =
        item.repeatType === 'daily'
          ? [0, 1, 2, 3, 4, 5, 6]
          : item.repeatType === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : item.repeatDays && item.repeatDays.length > 0
          ? item.repeatDays
          : [item.dayOfWeek];

      let countCreated = 0;
      for (let offset = 0; offset < maxDays; offset++) {
        const curr = new Date(baseDate);
        curr.setDate(baseDate.getDate() + offset);
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const dayOfWeek = curr.getDay();

        if (item.startDate && dateStr < item.startDate) continue;
        if (item.repeatEndType === 'until_date' && item.repeatEndDate && dateStr > item.repeatEndDate) continue;
        if (item.repeatEndType === 'after_count' && item.repeatCount && countCreated >= item.repeatCount) break;

        if (item.repeatInterval && item.repeatInterval > 1) {
          const weekIndex = Math.floor(offset / 7);
          if (weekIndex % item.repeatInterval !== 0) continue;
        }

        if (daysOfWeekToMatch.includes(dayOfWeek)) {
          newSessions.push({
            id: `sess-sync-${item.id}-${dateStr}`,
            classId: cls.id,
            className: item.label || cls.name,
            subject: cls.subject || 'Toán học',
            date: dateStr,
            startTime: item.startTime,
            endTime: item.endTime,
            room: item.room || 'Phòng 201',
            color: item.color || 'indigo',
            notes: item.notes,
            scheduleItemId: item.id,
            repeatType: item.repeatType,
            createdAt: new Date().toISOString()
          });
          countCreated++;
        }
      }
    }

    this.state.sessions = [...preservedSessions, ...newSessions];
  }

  public updateClassSchedule(classId: string, schedule: ClassScheduleItem[]): ClassRoom | undefined {
    const idx = this.state.classes.findIndex((c) => c.id === classId);
    if (idx === -1) return undefined;
    this.state.classes[idx] = {
      ...this.state.classes[idx],
      schedule
    };
    this.syncScheduleToSessions(classId, schedule);
    this.addActivityLog({
      title: 'Cập nhật thời khóa biểu',
      description: `Đã cập nhật thời khóa biểu cho lớp ${this.state.classes[idx].name} (${schedule.length} ca học/tuần)`,
      type: 'class_created'
    });
    this.notify();
    return this.state.classes[idx];
  }

  public updateClassFeeConfig(classId: string, feeConfig: ClassFeeConfig): ClassRoom | undefined {
    const idx = this.state.classes.findIndex((c) => c.id === classId);
    if (idx === -1) return undefined;
    this.state.classes[idx] = {
      ...this.state.classes[idx],
      feeConfig
    };
    this.notify();
    return this.state.classes[idx];
  }

  // === Phiếu Báo Cáo Học Tập & Học Phí Tháng (Monthly Student Reports) ===
  public getMonthlyReports(classId?: string, studentId?: string, monthYear?: string): MonthlyStudentReport[] {
    let list = [...(this.state.monthlyReports || [])];
    if (classId) {
      list = list.filter((r) => r.classId === classId);
    }
    if (studentId) {
      list = list.filter((r) => r.studentId === studentId);
    }
    if (monthYear) {
      list = list.filter((r) => r.monthYear === monthYear);
    }
    return list;
  }

  public getMonthlyReportById(id: string): MonthlyStudentReport | undefined {
    return (this.state.monthlyReports || []).find((r) => r.id === id);
  }

  public saveMonthlyReport(report: MonthlyStudentReport): void {
    const existingIdx = (this.state.monthlyReports || []).findIndex((r) => r.id === report.id);
    if (existingIdx >= 0) {
      this.state.monthlyReports[existingIdx] = { ...report };
    } else {
      this.state.monthlyReports.unshift(report);
    }
    this.addActivityLog({
      title: 'Lưu phiếu báo cáo học tập',
      description: `Đã lưu phiếu ${report.studentName} - Tháng ${report.monthYear}`,
      type: 'submission'
    });
    this.notify();
  }

  public deleteMonthlyReport(id: string): boolean {
    this.state.monthlyReports = (this.state.monthlyReports || []).filter((r) => r.id !== id);
    this.notify();
    return true;
  }

  // === Lịch & Ca học (Calendar & Sessions) ===
  public getSessions(filter?: { start?: string; end?: string; classId?: string }): CalendarSession[] {
    let list = [...(this.state.sessions || [])];
    if (filter?.start) {
      list = list.filter((s) => s.date >= filter.start!);
    }
    if (filter?.end) {
      list = list.filter((s) => s.date <= filter.end!);
    }
    if (filter?.classId) {
      list = list.filter((s) => s.classId === filter.classId);
    }
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }

  public getSessionById(id: string): CalendarSession | undefined {
    return (this.state.sessions || []).find((s) => s.id === id);
  }

  public addSession(session: Omit<CalendarSession, 'id' | 'createdAt'>): CalendarSession {
    const newSession: CalendarSession = {
      ...session,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    if (!this.state.sessions) {
      this.state.sessions = [];
    }
    this.state.sessions.push(newSession);
    this.addActivityLog({
      title: 'Thêm ca học mới',
      description: `Đã xếp ca học ${newSession.className} (${newSession.date}, ${newSession.startTime} - ${newSession.endTime})`,
      type: 'class_created'
    });
    this.notify();
    return newSession;
  }

  public updateSession(id: string, updates: Partial<CalendarSession>): CalendarSession | undefined {
    if (!this.state.sessions) return undefined;
    const idx = this.state.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.state.sessions[idx] = { ...this.state.sessions[idx], ...updates };
    this.addActivityLog({
      title: 'Cập nhật ca học',
      description: `Đã cập nhật ca ${this.state.sessions[idx].className}`,
      type: 'class_created'
    });
    this.notify();
    return this.state.sessions[idx];
  }

  public deleteSession(id: string): boolean {
    if (!this.state.sessions) return false;
    const item = this.state.sessions.find((s) => s.id === id);
    this.state.sessions = this.state.sessions.filter((s) => s.id !== id);
    if (item) {
      this.addActivityLog({
        title: 'Hủy ca học',
        description: `Đã hủy ca ${item.className} ngày ${item.date}`,
        type: 'class_created'
      });
    }
    this.notify();
    return true;
  }

  public createDefaultMonthlyReport(classId: string, studentId: string, monthYear: string): MonthlyStudentReport {
    const cls = this.getClassById(classId);
    const student = this.getStudents().find((s) => s.id === studentId);
    const teacher = this.getTeacher();

    // Check attendance in this month (format YYYY-MM)
    // monthYear is "M/YYYY" or "MM/YYYY" e.g. "8/2026"
    const [mStr, yStr] = monthYear.split('/');
    const monthPadded = mStr.padStart(2, '0');
    const yearStr = yStr || new Date().getFullYear().toString();
    const datePrefix = `${yearStr}-${monthPadded}`;

    const studentRecords = this.getAttendanceRecords(classId).filter(
      (r) => r.studentId === studentId && r.date.startsWith(datePrefix) && r.status === 'present'
    );

    // Format dates as DD/MM
    let sessionDates: string[] = studentRecords.map((r) => {
      const parts = r.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    if (sessionDates.length === 0) {
      // Default sample dates for month
      sessionDates = ['04/08', '07/08', '07/08', '09/08', '12/08', '13/08', '17/08', '18/08', '21/08', '24/08', '26/08', '28/08'];
    }

    const sessionCount = sessionDates.length;
    // Estimate hours: 2 hours per session
    const totalHours = Number((sessionCount * 2.2).toFixed(1));

    // Schedule items from class or default
    const scheduleItems = cls?.schedule && cls.schedule.length > 0
      ? cls.schedule.map((s) => s.label || `Thứ ${s.dayOfWeek === 0 ? 'CN' : s.dayOfWeek + 1}: ${s.startTime} - ${s.endTime}`)
      : ['Chiều thứ 4: 16h - 18h', 'Chiều thứ 7: 13h - 15h', 'Chiều chủ nhật: 13h - 15h'];

    // Tuition config: default to false (Đang tắt) when opening report
    const feeConfig = cls?.feeConfig;
    const includeFee = false;
    const feePerSession = feeConfig?.feePerSession || 120000;
    const totalFee = undefined;

    const feeDetails: string[] = [];
    if (includeFee) {
      if (feeConfig?.feeNotes) {
        feeDetails.push(...feeConfig.feeNotes.split('|').map((s) => s.trim()));
      } else {
        feeDetails.push(`Học phí cơ bản: ${feePerSession.toLocaleString('vi-VN')}đ/buổi`);
        if (feeConfig?.supplementaryFeePerSession) {
          feeDetails.push(`Học phí bổ trợ tối: ${feeConfig.supplementaryFeePerSession.toLocaleString('vi-VN')}đ/buổi`);
        }
      }
    }

    return {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      classId,
      studentId,
      monthYear,
      teacherName: `GV. ${teacher.fullName}`,
      teacherPhone: teacher.phone || '0978783058',
      studentName: student?.fullName || 'Học sinh',
      className: cls?.grade || cls?.name || 'Lớp học',
      studentPhone: student?.phone || '',
      includeFee,
      feePerSession,
      sessionCount,
      totalHours,
      totalFee,
      bankName: feeConfig?.bankCode || 'Techcombank',
      bankAccount: feeConfig?.bankAccount || '0978783058',
      bankAccountName: feeConfig?.bankAccountName || 'NGUYEN THANH THUY',
      sessionDates,
      generalComment: '+ Đi học đúng giờ, có tinh thần xây dựng bài trên lớp.\n+ Cần chú ý làm bài tập về nhà đầy đủ và rèn tính cẩn thận khi tính toán.',
      roadmapGeneral: '+ Tiếp tục rèn luyện kỹ năng giải toán và bài toán thực tế.\n+ Củng cố các chuyên đề trọng tâm và tăng cường luyện đề rèn kỹ năng.',
      roadmapAlgebra: 'Tiếp tục rèn luyện kỹ năng giải phương trình và bài toán thực tế.',
      roadmapGeometry: 'Chuyên đề tam giác đồng dạng và các hệ thức lượng trong tam giác.',
      scheduleItems,
      feeDetails: includeFee ? feeDetails : undefined,
      footerNote: includeFee
        ? 'Phụ huynh vui lòng kiểm tra thông tin học phí và lịch học. Cháu cảm ơn ạ.'
        : 'Phụ huynh vui lòng kiểm tra thông tin học tập và lịch học của con. Trân trọng cảm ơn!',
      createdAt: new Date().toISOString()
    };
  }

  // === Thông báo (Notifications) ===
  public getNotifications(): TeacherNotification[] {
    return this.state.notifications || [];
  }

  public getUnreadNotificationCount(): number {
    return (this.state.notifications || []).filter((n) => !n.read).length;
  }

  public markNotificationAsRead(id: string): void {
    if (!this.state.notifications) return;
    const item = this.state.notifications.find((n) => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    if (!this.state.notifications) return;
    let changed = false;
    this.state.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.notify();
    }
  }

  public deleteNotification(id: string): void {
    if (!this.state.notifications) return;
    this.state.notifications = this.state.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  public addNotification(notification: Omit<TeacherNotification, 'id' | 'createdAt' | 'time' | 'read'> & { time?: string; read?: boolean }): TeacherNotification {
    const newNotif: TeacherNotification = {
      time: 'Vừa xong',
      read: false,
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    if (!this.state.notifications) {
      this.state.notifications = [];
    }
    this.state.notifications.unshift(newNotif);
    this.notify();
    return newNotif;
  }
}

export const store = new StoreService();
