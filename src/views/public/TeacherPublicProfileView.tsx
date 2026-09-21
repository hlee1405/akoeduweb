import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Download,
  Star,
  Globe,
  Share2,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  Plus
} from 'lucide-react';
import { store } from '../../services/store';
import { TeacherProfile, Exam, PublicDocument, ReviewItem } from '../../types';
import { QRModal } from '../../components/common/QRModal';
import { useToast } from '../../context/ToastContext';
import { APP_NAME } from '../../config/appConfig';

export const TeacherPublicProfileView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { success, info } = useToast();

  const [teacher, setTeacher] = useState<TeacherProfile>(store.getTeacher());
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [activeTab, setActiveTab] = useState<'exams' | 'materials' | 'courses' | 'reviews'>('exams');
  const [showShareModal, setShowShareModal] = useState(false);

  // Add review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRole, setReviewRole] = useState('Học sinh Lớp 9A1');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  useEffect(() => {
    const refresh = () => {
      setTeacher(store.getTeacher());
      setExams(store.getExams().filter((e) => e.isPublic && e.status === 'published'));
    };
    refresh();
    const unsub = store.subscribe(refresh);
    return unsub;
  }, [slug]);

  const publicExams = exams.filter((e) => e.isPublic && e.status === 'published');
  const documents = teacher.publicDocuments || [];
  const reviews = teacher.reviews || [];

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewContent.trim()) return;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      authorName: reviewAuthor,
      authorRole: reviewRole,
      rating: reviewRating,
      content: reviewContent,
      createdAt: new Date().toISOString()
    };

    const updated = [newRev, ...reviews];
    store.updateTeacher({ reviews: updated });
    success('Cảm ơn bạn', 'Lời cảm nhận của bạn đã được đăng tải thành công.');
    setShowReviewModal(false);
    setReviewAuthor('');
    setReviewContent('');
  };

  return (
    <div id="teacher-public-profile-view" className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight">{teacher.fullName}</span>
              <span className="text-xs text-blue-600 ml-2 font-medium">| {teacher.subjectSpecialties.join(' & ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-share-profile"
              onClick={() => setShowShareModal(true)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Chia sẻ trang"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <Link
              to="/teacher/dashboard"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Vào Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Profile Banner */}
      <section className="bg-linear-to-b from-blue-950 via-slate-900 to-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {/* Avatar & Badges */}
          <div className="relative flex-shrink-0">
            <img
              src={teacher.avatarUrl}
              alt={teacher.fullName}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
            <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full shadow-md border-2 border-slate-900" title="Giáo viên Xác thực">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Profile Bio Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                {teacher.title}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>5.0 ({reviews.length} đánh giá)</span>
              </span>
              {teacher.customDomain && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
                  {teacher.customDomain}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{teacher.fullName}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">{teacher.bio}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-1">
              <span>Trường: <strong className="text-white">{teacher.school}</strong></span>
              <span>•</span>
              <span>Kinh nghiệm: <strong className="text-white">{teacher.experienceYears}+ năm</strong></span>
              <span>•</span>
              <span>Học sinh đã dạy: <strong className="text-white">1,500+ em</strong></span>
            </div>

            {/* Contacts & Social */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              {teacher.contactPhone && (
                <a
                  href={`tel:${teacher.contactPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{teacher.contactPhone}</span>
                </a>
              )}
              {teacher.socialLinks.zalo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 text-blue-200 border border-blue-500/30 rounded-lg text-xs font-semibold">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zalo: {teacher.socialLinks.zalo}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('exams')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Đề thi mở miễn phí ({publicExams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'materials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tài liệu & Đề cương ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Các lớp bồi dưỡng Toán 9</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Cảm nhận học trò ({reviews.length})</span>
          </button>
        </div>

        {/* TAB 1: FREE ONLINE EXAMS */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {publicExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {exam.subject} • {exam.grade}
                      </span>
                      <span className="text-xs text-slate-400">Đề mở miễn phí</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">{exam.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {exam.description || 'Bài thi trắc nghiệm và tự luận trực tuyến với hệ thống tự động chấm điểm và xem lời giải chi tiết.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Thời gian</span>
                      <span className="font-bold text-slate-800">{exam.durationMinutes} phút</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Số câu</span>
                      <span className="font-bold text-slate-800">{exam.questions.length} câu</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Thang điểm</span>
                      <span className="font-bold text-blue-700">{exam.maxScore}đ</span>
                    </div>
                  </div>

                  <Link
                    to={`/exam/${exam.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
                  >
                    <span>Làm bài thi thử ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FREE STUDY MATERIALS */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{doc.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{doc.grade} • {doc.subject}</span>
                      <span>•</span>
                      <span>{doc.downloadsCount} lượt tải</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    info('Tải tài liệu PDF', `Đang bắt đầu tải tệp: ${doc.title}`);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tài liệu PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: COURSES & TUTORING */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                  Luyện thi Chuyên Toán 9
                </span>
                <span className="text-xs font-bold text-blue-700">Khóa Online & Offline</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Chuyên đề Căn thức, Bất đẳng thức & Hình học 9 nâng cao
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Khóa học chuyên sâu dành cho học sinh mục tiêu thi vào các trường Chuyên Sư Phạm, Hà Nội - Amsterdam, Khoa học Tự nhiên.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">✓ Lộ trình 24 buổi học bám sát cấu trúc đề mới</li>
                <li className="flex items-center gap-2">✓ Hàng tuần làm đề thi kiểm tra online trên hệ thống {APP_NAME}</li>
                <li className="flex items-center gap-2">✓ Trực tiếp cô Minh Anh chấm bài và chữa bài chi tiết</li>
              </ul>
              <button
                onClick={() => info('Đăng ký tư vấn', 'Vui lòng liên hệ Hotline hoặc Zalo của cô để được tư vấn xếp lớp!')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Đăng ký tư vấn khóa học
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Lấy gốc & Ôn thi vào 10 đại trà
                </span>
                <span className="text-xs font-bold text-emerald-700">Mục tiêu 8.5+</span>
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Làm chủ Đại số 9 và Hình học cơ bản
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Phương pháp học nhẹ nhàng, hiểu bản chất, không học vẹt, rèn luyện kỹ năng trình bày sạch đẹp không bị trừ điểm.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">✓ Đảm bảo nắm chắc 7.5 - 8.5 điểm thi vào 10</li>
                <li className="flex items-center gap-2">✓ Kho ngân hàng đề thi đa dạng làm trực tiếp trên điện thoại</li>
              </ul>
              <button
                onClick={() => info('Đăng ký tư vấn', 'Vui lòng liên hệ Hotline hoặc Zalo của cô để được tư vấn xếp lớp!')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Đăng ký tư vấn khóa học
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Cảm nhận từ các thế hệ học trò & phụ huynh</h3>
                <p className="text-xs text-slate-500">Động lực để thầy cô không ngừng đổi mới phương pháp giảng dạy</p>
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Viết cảm nhận</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {rev.authorName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{rev.authorName}</h4>
                        <span className="text-[11px] text-slate-400">{rev.authorRole}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.content}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <QRModal
          isOpen={showShareModal}
          title={`Trang giáo viên: ${teacher.fullName}`}
          subtitle={`Website số cá nhân: ${teacher.customDomain || `${teacher.slug}.ako.vn`}`}
          url={`/teacher/${teacher.slug}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Add Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Gửi lời cảm nhận tới cô giáo</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddReview} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên của bạn *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Trí"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vai trò</label>
                <input
                  type="text"
                  value={reviewRole}
                  onChange={(e) => setReviewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung cảm nhận *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Chia sẻ kỷ niệm, cảm xúc hoặc kết quả tiến bộ khi được cô giảng dạy..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Gửi cảm nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>Hồ sơ số giáo viên được cung cấp bởi nền tảng {APP_NAME}.</p>
      </footer>
    </div>
  );
};
