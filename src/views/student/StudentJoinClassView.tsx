import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  School,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
  RefreshCw,
  Phone,
  User,
  MessageSquare,
  Check,
  Edit2
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom, Exam, Student } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StudentJoinClassView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, info, error: showError } = useToast();

  const codeParam = searchParams.get('code') || '';
  const [inputCode, setInputCode] = useState(codeParam.toUpperCase());
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);

  // Student form state
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // Flow states
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const teacher = store.getTeacher();

  // Look up class when codeParam or inputCode changes
  useEffect(() => {
    const code = (inputCode || codeParam).trim().toUpperCase();
    if (code) {
      const found = store.getClassByJoinCode(code);
      setCurrentClass(found || null);
    } else {
      setCurrentClass(null);
    }
  }, [inputCode, codeParam]);

  // Real-time store polling / listener to detect when teacher approves
  useEffect(() => {
    if (!pendingStudentId) return;

    const checkApproval = () => {
      const allStudents = store.getStudents();
      const current = allStudents.find((s) => s.id === pendingStudentId);
      if (current) {
        if (current.status === 'active') {
          setActiveStudent(current);
          setIsApproved(true);
        }
      }
    };

    checkApproval();
    const unsub = store.subscribe(checkApproval);
    const interval = setInterval(checkApproval, 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [pendingStudentId]);

  const handleSearchClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const found = store.getClassByJoinCode(inputCode.trim().toUpperCase());
    if (found) {
      setCurrentClass(found);
    } else {
      showError(
        'Không tìm thấy lớp',
        `Không tìm thấy lớp học với mã "${inputCode.trim().toUpperCase()}". Vui lòng kiểm tra lại.`
      );
    }
  };

  const handleJoinRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    if (!studentName.trim()) {
      showError('Vui lòng nhập họ tên', 'Họ và tên học sinh là bắt buộc để tham gia lớp.');
      return;
    }

    // Check if student already actively in class
    const existing = store.getStudentsByClassId(currentClass.id, 'all').find(
      (s) =>
        s.fullName.toLowerCase() === studentName.trim().toLowerCase() &&
        (!phone || !s.phone || s.phone === phone.trim())
    );

    if (existing && existing.status === 'active') {
      setActiveStudent(existing);
      setIsApproved(true);
      success('Chào mừng quay trở lại', `Chào em ${existing.fullName}! Em đã là thành viên của lớp.`);
      return;
    }

    if (existing && existing.status === 'pending') {
      setPendingStudentId(existing.id);
      info('Yêu cầu đang chờ duyệt', 'Thông tin của em đã được gửi trước đó và đang chờ thầy cô phê duyệt.');
      return;
    }

    // Generate code and create student with pending status
    const randomCode = `HS${Math.floor(100 + Math.random() * 900)}`;
    const newStudent = store.addStudent({
      code: randomCode,
      fullName: studentName.trim(),
      classId: currentClass.id,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      birthDate: birthDate || undefined,
      status: 'pending',
      requestSource: 'qr',
      requestedAt: new Date().toISOString(),
      requestNotes: requestNotes.trim() || undefined,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      parentRelationship: 'Phụ huynh'
    });

    // Notify teacher in real-time
    store.addNotification({
      title: 'Yêu cầu vào lớp qua QR',
      message: `Học sinh ${studentName.trim()} vừa quét mã QR xin tham gia lớp "${currentClass.name}". Thầy cô vui lòng kiểm tra và duyệt.`,
      type: 'class',
      actionUrl: `/classes/${currentClass.id}`
    });

    setPendingStudentId(newStudent.id);
    success('Đã gửi yêu cầu vào lớp', 'Yêu cầu của em đã được gửi tới giáo viên phụ trách để phê duyệt.');
  };

  // Manual check status button handler
  const handleManualCheckStatus = () => {
    if (!pendingStudentId) return;
    setIsCheckingStatus(true);
    setTimeout(() => {
      const allStudents = store.getStudents();
      const current = allStudents.find((s) => s.id === pendingStudentId);
      if (current && current.status === 'active') {
        setActiveStudent(current);
        setIsApproved(true);
        success('Đã được phê duyệt!', `Giáo viên đã duyệt thông tin của em vào lớp "${currentClass?.name}".`);
      } else if (!current) {
        showError('Yêu cầu không còn hiệu lực', 'Yêu cầu của bạn chưa được duyệt hoặc đã bị từ chối.');
      } else {
        info('Đang chờ phê duyệt', 'Thầy/cô đang xem xét thông tin yêu cầu của em. Vui lòng chờ ít phút nhé!');
      }
      setIsCheckingStatus(false);
    }, 600);
  };

  // Get exams assigned to this class
  const classExams: Exam[] = currentClass
    ? store
        .getExams()
        .filter((ex) => ex.assignedClassIds.includes(currentClass.id) && ex.status === 'published')
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <School className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">
                Cổng Học Sinh Tham Gia Lớp
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Lớp học của {teacher.fullName}
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            Trang chủ
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 my-auto">
        {!pendingStudentId && !isApproved ? (
          /* STEP 1: CLASS SEARCH & REGISTRATION FORM */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-sm mb-3">
                <School className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Vào Lớp Học Trực Tuyến</h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-md mx-auto">
                Quét mã QR hoặc nhập mã lớp để gửi thông tin tham gia lớp học
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* If no class selected or code not found, allow entering code */}
              {!currentClass ? (
                <form onSubmit={handleSearchClass} className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <span className="font-bold block">Chưa tìm thấy lớp học</span>
                      Vui lòng nhập chính xác mã vào lớp do giáo viên cung cấp (ví dụ: TOAN9-123).
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Mã vào lớp (Join Code)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã ví dụ: TOAN9-482"
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm uppercase tracking-wider font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Tìm lớp
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  {/* Found Class Details Card */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-md text-[11px]">
                            {currentClass.subject}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded-md text-[11px]">
                            Mã lớp: {currentClass.joinCode}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">{currentClass.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Giáo viên phụ trách: <span className="font-semibold text-slate-700">{teacher.fullName}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentClass(null)}
                        className="text-[11px] text-blue-600 hover:underline font-medium shrink-0 cursor-pointer"
                      >
                        Đổi mã lớp khác
                      </button>
                    </div>

                    {/* Notice about Teacher Approval */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        Khi em gửi thông tin, giáo viên sẽ kiểm tra, đối soát và phê duyệt vào danh sách lớp chính thức.
                      </span>
                    </div>
                  </div>

                  {/* Student Entry Form */}
                  <form onSubmit={handleJoinRequestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Họ và tên học sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Số điện thoại học sinh
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Email (tùy chọn)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="hocsinh@gmail.com"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">
                        Thông tin liên hệ Phụ huynh (tùy chọn)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="Họ tên bố / mẹ"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden text-slate-900"
                        />
                        <input
                          type="tel"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="Số điện thoại phụ huynh"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Note to teacher */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Lời nhắn / Ghi chú gửi tới Thầy/Cô (tùy chọn)
                      </label>
                      <textarea
                        rows={2}
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                        placeholder="Ví dụ: Em quét QR tại bảng tin xin tham gia lớp Toán 9..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>Gửi yêu cầu tham gia lớp</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : !isApproved ? (
          /* STEP 2: PENDING APPROVAL SCREEN */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center bg-linear-to-b from-amber-50/80 to-white space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner border border-amber-200 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs inline-flex items-center gap-1.5 border border-amber-200 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Đang chờ giáo viên phê duyệt
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Đã gửi yêu cầu tham gia!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Thông tin của em đã được chuyển đến giáo viên <strong>{teacher.fullName}</strong>.
                  Thầy/cô sẽ kiểm tra và duyệt em vào danh sách lớp sớm nhất.
                </p>
              </div>

              {/* Submitted Info Review Card */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Họ và tên:</span>
                  <strong className="text-slate-900 font-bold">{studentName}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Lớp học đăng ký:</span>
                  <span className="font-bold text-blue-700">{currentClass?.name}</span>
                </div>
                {phone && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Số điện thoại:</span>
                    <span className="font-mono font-semibold text-slate-800">{phone}</span>
                  </div>
                )}
                {requestNotes && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">Lời nhắn gửi:</span>
                    <p className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 italic">
                      "{requestNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Status refresh buttons */}
              <div className="pt-2 space-y-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái duyệt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingStudentId(null);
                  }}
                  className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-medium cursor-pointer"
                >
                  Chỉnh sửa lại thông tin đã gửi
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 3: APPROVED SUCCESS CELEBRATION SCREEN */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center bg-linear-to-b from-emerald-50/80 to-white space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs inline-block mb-2 border border-emerald-200">
                  🎉 Phê duyệt thành công!
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Chào mừng em {activeStudent?.fullName || studentName}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Em đã chính thức là thành viên lớp <strong>{currentClass?.name}</strong> do giáo viên{' '}
                  <strong>{teacher.fullName}</strong> phụ trách.
                </p>
              </div>

              {/* Class Info Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Môn học:</span>
                  <span className="font-semibold text-slate-800">{currentClass?.subject}</span>
                </div>
                {currentClass?.description && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Mô tả lớp:</span>
                    <span className="text-slate-700 font-medium">{currentClass.description}</span>
                  </div>
                )}
              </div>

              {/* Assigned Exams Section */}
              <div className="text-left pt-3 max-w-lg mx-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Bài tập, đề thi của lớp ({classExams.length})</span>
                </h3>

                {classExams.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    Hiện chưa có bài thi nào đang mở cho lớp này. Giáo viên sẽ thông báo khi có bài mới!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3.5 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{exam.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{exam.questions?.length || 0} câu hỏi</span>
                            <span>•</span>
                            <span>{exam.durationMinutes} phút</span>
                          </p>
                        </div>
                        <Link
                          to={`/exam/${exam.id}`}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Làm bài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <Link
                  to="/"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        Hệ thống Quản lý Học tập & Khảo thí Trực tuyến • {teacher.fullName}
      </footer>
    </div>
  );
};
