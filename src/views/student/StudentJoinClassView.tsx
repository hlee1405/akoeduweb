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
  Search
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom, Exam, Student } from '../../types';
import { useToast } from '../../context/ToastContext';

export const StudentJoinClassView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const codeParam = searchParams.get('code') || '';
  const [inputCode, setInputCode] = useState(codeParam.toUpperCase());
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);

  // Student form
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [joinedStudent, setJoinedStudent] = useState<Student | null>(null);

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

  const handleSearchClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const found = store.getClassByJoinCode(inputCode.trim().toUpperCase());
    if (found) {
      setCurrentClass(found);
    } else {
      showError('Không tìm thấy lớp', `Không tìm thấy lớp học với mã "${inputCode.trim().toUpperCase()}". Vui lòng kiểm tra lại.`);
    }
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    if (!studentName.trim()) {
      showError('Vui lòng nhập họ tên', 'Họ và tên học sinh là bắt buộc để tham gia lớp.');
      return;
    }

    // Check if student already in class by name
    const existing = store.getStudentsByClassId(currentClass.id).find(
      (s) => s.fullName.toLowerCase() === studentName.trim().toLowerCase()
    );

    let student: Student;
    if (existing) {
      student = existing;
      success('Đã nhận diện học sinh', `Chào mừng em ${student.fullName} quay trở lại lớp!`);
    } else {
      const randomCode = `HS${Math.floor(100 + Math.random() * 900)}`;
      student = store.addStudent({
        code: randomCode,
        fullName: studentName.trim(),
        classId: currentClass.id,
        phone: phone.trim() || undefined,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002?w=120&auto=format&fit=crop&q=80`,
        status: 'active',
        gender: 'other'
      });
      success('Tham gia lớp thành công', `Chào mừng em ${student.fullName} đã vào lớp "${currentClass.name}"!`);
    }

    setJoinedStudent(student);
    setIsJoined(true);
  };

  // Get exams assigned to this class
  const classExams: Exam[] = currentClass
    ? store.getExams().filter((ex) => ex.assignedClassIds.includes(currentClass.id) && ex.status === 'published')
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
        {!isJoined ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
            {/* Header Banner */}
            <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-sm mb-3">
                <School className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Vào Lớp Học Trực Tuyến</h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-md mx-auto">
                Nhập thông tin của em để vào lớp học, xem thời khóa biểu và làm bài kiểm tra
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* If no class selected or code not found, allow entering code */}
              {!currentClass ? (
                <form onSubmit={handleSearchClass} className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
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

                    {/* Class Description */}
                    {currentClass.description && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Mô tả lớp học:
                        </label>
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                          {currentClass.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Student Entry Form */}
                  <form onSubmit={handleJoinClass} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Họ và tên học sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An, Trần Thu Trang..."
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Số điện thoại / Zalo phụ huynh (tùy chọn)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại để nhận kết quả bài thi"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>Xác nhận tham gia lớp học</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Join Success Celebration Screen */
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center bg-linear-to-b from-emerald-50/70 to-white space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs inline-block mb-2">
                  🎉 Tham gia lớp thành công!
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Chào mừng em {joinedStudent?.fullName}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Em đã vào thành công lớp <strong>{currentClass?.name}</strong> do giáo viên{' '}
                  <strong>{teacher.fullName}</strong> phụ trách.
                </p>
              </div>

              {/* Class Info Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 max-w-lg mx-auto">
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
              <div className="text-left pt-4 max-w-lg mx-auto">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Bài kiểm tra / Đề thi của lớp ({classExams.length})</span>
                </h3>

                {classExams.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    Hiện chưa có bài thi nào đang mở cho lớp này. Giáo viên sẽ thông báo khi có bài mới!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3 shadow-2xs"
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
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                        >
                          <span>Làm bài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Link
                  to="/"
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
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
