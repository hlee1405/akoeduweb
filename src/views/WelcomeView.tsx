import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  FileUp,
  Award,
  BookOpen,
  ArrowRight,
  Users,
  Play,
  Zap,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  Sliders,
  ShieldCheck,
  Star,
  Flame,
  FileText,
  Calculator,
  CalendarCheck,
  Heart,
  Palette,
  ExternalLink,
  HelpCircle,
  Clock,
  Headphones
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, DEFAULT_TEACHER_SLUG } from '../config/appConfig';
import { store } from '../services/store';
import { useTheme } from '../context/ThemeContext';
import { ThemeSelector } from '../components/theme/ThemeSelector';
import { LissenlyAudioReader } from '../components/common/LissenlyAudioReader';

export const WelcomeView: React.FC = () => {
  const navigate = useNavigate();
  const { theme, themeConfig, setTheme, allThemes } = useTheme();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [authEmail, setAuthEmail] = useState('minhanh.math@gmail.com');
  const [authPassword, setAuthPassword] = useState('******');
  const [teacherName, setTeacherName] = useState('Cô Nguyễn Minh Anh');

  // Preview tab state
  const [activePreviewTab, setActivePreviewTab] = useState<'exam' | 'auto_grading' | 'diligence' | 'leaderboard'>('exam');

  // FAQ open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const exams = store.getExams();
  const demoExam = exams.find((e) => e.status === 'published') || exams[0];
  const teacher = store.getTeacher();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuthModal(null);
    navigate('/teacher/dashboard');
  };

  const faqItems = [
    {
      question: 'Nhập đề thi từ file Word/PDF có giữ nguyên công thức Toán và hình vẽ không?',
      answer:
        'Hệ thống AI bóc tách thông minh của chúng tôi tự động nhận diện ký hiệu toán học MathJax/LaTeX như phân số, căn bậc hai, ma trận, tích phân và hình học không gian. Bạn chỉ cần tải file lên, hệ thống sẽ số hóa thành bài trắc nghiệm hoặc tự luận trong tích tắc.'
    },
    {
      question: 'Trợ lý AI chấm tự luận hoạt động như thế nào và có đảm bảo độ chính xác?',
      answer:
        'AI đối chiếu trực tiếp bài làm của học sinh với barem điểm chi tiết do thầy cô cung cấp. Trợ lý sẽ phân tích luận điểm đạt/chưa đạt, đề xuất số điểm và viết nhận xét sư phạm. Thầy cô luôn có quyền xem lại, điều chỉnh và duyệt điểm trước khi công bố.'
    },
    {
      question: 'Hệ thống Điểm danh & Điểm chuyên cần (Thang 10) tính toán như thế nào?',
      answer:
        'Mỗi buổi học, thầy cô có thể điểm danh (Có mặt, Đi muộn, Vắng phép, Vắng không phép). Hệ thống tự động tính điểm chuyên cần thang 10 theo công thức minh bạch: Điểm = 10 - (Vắng KP × 1.0) - (Vắng CP × 0.3) - (Đi muộn × 0.2) + Điểm thưởng sao thi đua. Điểm số được hiển thị trực quan và có thể xuất file CSV tiện lợi.'
    },
    {
      question: 'Tôi có thể đổi giao diện theo ý thích ở bất kỳ lúc nào không?',
      answer:
        'Hoàn toàn có thể! Hệ thống hỗ trợ 4 chủ đề màu sắc chuẩn mực (Xanh Giáo Dục, Xanh Chàm Trí Tuệ, Xanh Ngọc Tri Thức, Đêm Tối Hiện Đại). Chủ đề bạn chọn được tự động lưu lại cho tất cả các trang làm việc, phòng thi và trang công khai.'
    },
    {
      question: 'Học sinh làm bài thi có cần phải tạo tài khoản phức tạp không?',
      answer:
        'Không cần! Thầy cô chỉ cần gửi liên kết hoặc mã QR của bài thi. Học sinh có thể truy cập trực tiếp trên điện thoại hoặc máy tính, nhập tên và làm bài ngay mà không cần tải ứng dụng.'
    }
  ];

  return (
    <div
      id="welcome-view"
      className="min-h-screen flex flex-col transition-colors duration-200 selection:bg-blue-600 selection:text-white"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text
      }}
    >
      {/* 1. TOP NAVBAR */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200"
        style={{
          backgroundColor: `${themeConfig.colors.surface}F2`,
          borderColor: themeConfig.colors.border
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-transform hover:scale-105"
              style={{
                backgroundColor: themeConfig.colors.primary,
                color: themeConfig.colors.textInverse
              }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight">{APP_NAME}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: themeConfig.colors.badgeBg,
                    color: themeConfig.colors.badgeText,
                    borderColor: themeConfig.colors.badgeBorder
                  }}
                >
                  Studio Edition
                </span>
              </div>
              <p className="text-[10px] opacity-70 hidden sm:block font-medium">
                Nền tảng kiểm tra & thương hiệu số giáo viên
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <a href="#features" className="hover:opacity-100 opacity-75 transition-opacity">
              Tính năng
            </a>
            <a href="#audio-reader" className="hover:opacity-100 opacity-75 transition-opacity">
              Đọc đề AI
            </a>
            <a href="#themes" className="hover:opacity-100 opacity-75 transition-opacity">
              Chọn giao diện
            </a>
            <a href="#preview" className="hover:opacity-100 opacity-75 transition-opacity">
              Xem trước
            </a>
            <a href="#faq" className="hover:opacity-100 opacity-75 transition-opacity">
              Hỏi đáp
            </a>
            <Link
              to={`/teacher/${DEFAULT_TEACHER_SLUG}`}
              className="flex items-center gap-1 hover:opacity-100 opacity-75 transition-opacity"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Hồ sơ mẫu</span>
            </Link>
          </nav>

          {/* Action Tools: Theme Selector & Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multiple Themes Switcher */}
            <ThemeSelector variant="pill" showLabel={false} />

            <button
              id="btn-nav-login"
              onClick={() => setShowAuthModal('login')}
              className="text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-80 cursor-pointer"
              style={{
                color: themeConfig.colors.text
              }}
            >
              Đăng nhập
            </button>

            <button
              id="btn-nav-register"
              onClick={() => navigate('/teacher/dashboard')}
              className="text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              style={{
                backgroundColor: themeConfig.colors.primary,
                color: themeConfig.colors.textInverse
              }}
            >
              <span>Vào Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-40 transition-colors duration-500"
          style={{ backgroundColor: themeConfig.colors.primary }}
        />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          {/* Eyebrow Pill */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-colors"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.primary
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thiết kế tối giản • Khảo thí & Giảng dạy số 4.0</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18]">
            Từ tài liệu Word/PDF đến <br className="hidden sm:inline" />
            <span
              className="underline decoration-wavy decoration-2 underline-offset-8"
              style={{ textDecorationColor: themeConfig.colors.primary }}
            >
              bài kiểm tra trực tuyến
            </span>{' '}
            trong vài phút.
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium transition-colors"
            style={{ color: themeConfig.colors.textMuted }}
          >
            Đơn giản hóa việc ra đề và chấm thi. Tận hưởng không gian làm việc êm dịu mắt với các chủ đề màu sắc linh hoạt, trợ lý AI chấm tự luận khách quan và tạo hồ sơ thương hiệu số uy tín cho thầy cô giáo.
          </p>

          {/* Primary Call to Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              id="btn-hero-teacher-demo"
              onClick={() => navigate('/teacher/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
              style={{
                backgroundColor: themeConfig.colors.primary,
                color: themeConfig.colors.textInverse
              }}
            >
              <Zap className="w-4 h-4" />
              <span>Trải nghiệm tài khoản giáo viên</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {demoExam && (
              <Link
                to={`/exam/${demoExam.id}`}
                id="btn-hero-student-demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: themeConfig.colors.surface,
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text
                }}
              >
                <Play className="w-4 h-4 fill-current" style={{ color: themeConfig.colors.primary }} />
                <span>Thử làm bài thi học sinh</span>
              </Link>
            )}
          </div>

          {/* Key Value Micro-Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs opacity-80 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Công thức MathJax chuẩn mực</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Trợ lý AI chấm tự luận theo barem</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Điểm danh & Chuyên cần thang 10</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI AUDIO & EXAM READER SHOWCASE */}
      <section id="audio-reader" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 w-full">
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-2 border"
            style={{
              backgroundColor: themeConfig.colors.badgeBg,
              borderColor: themeConfig.colors.badgeBorder,
              color: themeConfig.colors.badgeText
            }}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Trợ lý âm thanh thông minh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Nghe & Đọc đề thi với trợ lý âm thanh AI
          </h2>
          <p className="text-xs sm:text-sm mt-1.5" style={{ color: themeConfig.colors.textMuted }}>
            Hỗ trợ luyện nghe tiếng Anh, đọc đề toán học sinh hòa nhập và chế độ font chữ chống nhầm lẫn (Dyslexia)
          </p>
        </div>

        {/* Live Audio Reader Component */}
        <LissenlyAudioReader />
      </section>

      {/* 4. MULTIPLE THEMES SHOWCASE */}
      <section id="themes" className="py-16 sm:py-20 border-y transition-colors" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-2 border"
              style={{
                backgroundColor: themeConfig.colors.badgeBg,
                borderColor: themeConfig.colors.badgeBorder,
                color: themeConfig.colors.badgeText
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Hệ thống đa giao diện màu sắc</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Chọn giao diện theo sở thích & bảo vệ mắt bạn
            </h2>
            <p className="text-xs sm:text-sm mt-2 font-medium" style={{ color: themeConfig.colors.textMuted }}>
              Hệ thống mang đến các bảng màu được nghiên cứu tỉ mỉ về độ tương phản, giảm mỏi mắt khi thầy cô phải chấm hàng trăm bài thi vào ban đêm.
            </p>
          </div>

          {/* Theme Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {allThemes.map((t) => {
              const isCurrent = t.id === theme;
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between hover:scale-[1.02] shadow-xs ${
                    isCurrent ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: t.colors.surface,
                    borderColor: isCurrent ? t.colors.primary : t.colors.border,
                    color: t.colors.text
                  }}
                >
                  <div>
                    {/* Swatches & Current Indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: t.previewSwatches[0] }}
                          title="Màu nền"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: t.previewSwatches[1] }}
                          title="Màu bề mặt"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: t.previewSwatches[2] }}
                          title="Màu điểm nhấn"
                        />
                      </div>

                      {isCurrent ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-xs"
                          style={{ backgroundColor: t.colors.primary }}
                        >
                          <Check className="w-3 h-3" />
                          <span>Đang áp dụng</span>
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: t.colors.badgeBg, color: t.colors.badgeText }}
                        >
                          {t.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-xs opacity-60 font-normal">{t.englishName}</span>
                    </h3>

                    <p className="text-xs mt-1.5 opacity-80 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Quick Preview Elements */}
                  <div
                    className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
                    style={{ borderColor: t.colors.border }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{ backgroundColor: t.colors.badgeBg, color: t.colors.badgeText }}
                      >
                        Nút bấm
                      </span>
                      <span className="text-[11px] opacity-75">
                        {t.isDark ? 'Chế độ tối' : 'Chế độ sáng'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="text-[11px] font-bold underline cursor-pointer"
                      style={{ color: t.colors.primary }}
                    >
                      {isCurrent ? 'Màu hiện tại' : 'Nhấp để chọn →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PLATFORM CORE FEATURES */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-2 border"
            style={{
              backgroundColor: themeConfig.colors.badgeBg,
              borderColor: themeConfig.colors.badgeBorder,
              color: themeConfig.colors.badgeText
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đầy đủ công cụ sư phạm</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Giải pháp toàn diện cho khảo thí & thương hiệu số
          </h2>
          <p className="text-xs sm:text-sm mt-2 font-medium" style={{ color: themeConfig.colors.textMuted }}>
            Từ soạn đề, chấm thi bằng AI đến quản lý chuyên cần và vinh danh học sinh nỗ lực
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <FileUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold mb-2">1. Nhập đề AI 4 bước từ Word & PDF</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                Tải file đề thi sẵn có, AI tự động tách câu hỏi, đáp án A/B/C/D, nhận diện công thức toán học MathJax phức tạp, bảng biểu và lời giải chi tiết.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Tiết kiệm 90% thời gian gõ đề</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold mb-2">2. Trợ lý AI Chấm tự luận theo Barem</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                AI đọc hiểu bài làm của học trò, đối chiếu từng ý trong barem, đề xuất điểm chính xác và viết nhận xét sư phạm động viên học sinh tiến bộ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Thầy cô toàn quyền duyệt & sửa điểm</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold mb-2">3. Điểm danh & Điểm chuyên cần (Thang 10)</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                Theo dõi chuyên cần theo từng buổi: có mặt, đi muộn, vắng phép. Công thức tính điểm chuyên cần thang 10 rõ ràng, công khai và xuất báo cáo CSV nhanh chóng.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Quy chế đánh giá minh bạch</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 4 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-base font-extrabold mb-2">4. Bảng vinh danh Top Sao thi đua</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                Tặng sao thi đua theo 4 tiêu chí: Học tập, Thái độ tích cực, Đúng giờ và Hoạt động nhóm. Tự động xếp hạng Top 3 học sinh xuất sắc nhất tháng.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Tạo động lực thi đua học tập</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 5 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold mb-2">5. Hồ sơ số & Thương hiệu giáo viên</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                Trang web cá nhân độc lập dành riêng cho thầy cô (`/teacher/minhanh-math`), hiển thị tiểu sử, chia sẻ tài liệu miễn phí và nhận đánh giá từ học sinh.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Xây dựng uy tín giảng dạy số</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 6 */}
          <div
            className="p-6 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-2xs"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold mb-2">6. Chống gian lận & Phân tích phổ điểm</h3>
              <p className="text-xs leading-relaxed" style={{ color: themeConfig.colors.textMuted }}>
                Theo dõi số lần chuyển tab khi làm bài thi, phát hiện câu hỏi quá khó hoặc gây nhiễu, biểu đồ phổ điểm phân phối chuẩn giúp điều chỉnh giáo án.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold flex items-center gap-1" style={{ borderColor: themeConfig.colors.border, color: themeConfig.colors.primary }}>
              <span>Dữ liệu khách quan & bảo mật</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE TABBED LIVE SHOWCASE */}
      <section id="preview" className="py-16 sm:py-20 border-t transition-colors" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trải nghiệm thực tế giao diện ứng dụng
            </h2>
            <p className="text-xs sm:text-sm mt-1.5 font-medium" style={{ color: themeConfig.colors.textMuted }}>
              Xem trước các mô-đun quan trọng nhất đã được tinh chỉnh trực quan và hiện đại
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { id: 'exam', label: 'Đề thi & MathJax', icon: BookOpen },
              { id: 'auto_grading', label: 'Chấm trắc nghiệm 100%', icon: Award },
              { id: 'diligence', label: 'Chuyên cần thang 10', icon: CalendarCheck },
              { id: 'leaderboard', label: 'Vinh danh Sao thi đua', icon: Star }
            ].map((t) => {
              const isActive = activePreviewTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivePreviewTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive ? 'shadow-xs text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive ? themeConfig.colors.primary : themeConfig.colors.surface,
                    borderColor: themeConfig.colors.border,
                    color: isActive ? themeConfig.colors.textInverse : themeConfig.colors.text
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Cards */}
          <div
            className="p-6 sm:p-8 rounded-2xl border shadow-sm transition-all"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            {activePreviewTab === 'exam' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: themeConfig.colors.border }}>
                  <div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.badgeText }}>
                      Môn Toán Lớp 12
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base mt-1">Đề kiểm tra Khảo sát Hàm số & Tích phân</h4>
                  </div>
                  <span className="text-xs font-bold" style={{ color: themeConfig.colors.primary }}>Thời gian: 45 phút</span>
                </div>

                <div className="p-4 rounded-xl border" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
                  <p className="text-xs sm:text-sm font-semibold mb-2">
                    {'Câu 3 (Vận dụng): Cho hàm số f(x) liên tục trên tập số thực R thỏa mãn tích phân từ 0 đến 2 của f(x)dx = 4. Tính tích phân I = ∫ x·f(x²)dx từ 0 đến 1.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
                    <div className="p-2 rounded-lg border bg-white/5" style={{ borderColor: themeConfig.colors.border }}>A. $I = 2$</div>
                    <div className="p-2 rounded-lg border font-bold" style={{ backgroundColor: themeConfig.colors.badgeBg, borderColor: themeConfig.colors.primary, color: themeConfig.colors.primary }}>B. $I = 2$ (Đáp án đúng)</div>
                    <div className="p-2 rounded-lg border bg-white/5" style={{ borderColor: themeConfig.colors.border }}>C. $I = 8$</div>
                    <div className="p-2 rounded-lg border bg-white/5" style={{ borderColor: themeConfig.colors.border }}>D. $I = 1$</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="opacity-75">Tự động xáo trộn câu hỏi & đáp án cho từng học sinh</span>
                  <Link
                    to={demoExam ? `/exam/${demoExam.id}` : '#'}
                    className="font-bold flex items-center gap-1 hover:underline"
                    style={{ color: themeConfig.colors.primary }}
                  >
                    <span>Mở phòng thi thực tế</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {activePreviewTab === 'auto_grading' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: themeConfig.colors.border }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">Hệ Thống Tự Động Chấm Điểm 100%</h4>
                      <p className="text-[11px] opacity-70">Học sinh: Lê Hải Nam • Lớp 12A1 • Nộp lúc 10:15</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-xl" style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}>
                    Điểm số: 9.5 / 10.0
                  </span>
                </div>

                <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-600 block mb-1">✓ Kết quả làm bài trắc nghiệm khách quan:</span>
                    <p className="opacity-90">• Trả lời đúng 19 / 20 câu trắc nghiệm (Tỷ lệ chính xác 95%).</p>
                    <p className="opacity-90">• Thời gian làm bài: 32 phút • Xếp hạng #1 trong lớp.</p>
                  </div>
                  <div className="text-xs border-t pt-2" style={{ borderColor: themeConfig.colors.border }}>
                    <span className="font-bold block mb-1" style={{ color: themeConfig.colors.primary }}>📊 Phân tích kiến thức tự động:</span>
                    <p className="opacity-90">Nắm vững phần Hàm số và Đạo hàm. Cần củng cố thêm 01 câu phần Tích phân ứng dụng.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 text-xs pt-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ Đã ghi nhận vào sổ điểm lớp học
                  </span>
                </div>
              </div>
            )}

            {activePreviewTab === 'diligence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: themeConfig.colors.border }}>
                  <div>
                    <h4 className="font-extrabold text-sm">Bảng theo dõi Chuyên cần (Thang 10)</h4>
                    <p className="text-[11px] opacity-70">Lớp 12A1 Chuyên Toán • Sĩ số: 38 học sinh</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">Chuyên cần trung bình: 9.4/10</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border text-xs" style={{ backgroundColor: themeConfig.colors.badgeBg, borderColor: themeConfig.colors.badgeBorder, color: themeConfig.colors.badgeText }}>
                  <span className="font-bold">Công thức minh bạch: </span>
                  <span>Điểm = 10 - (Vắng KP × 1.0) - (Vắng CP × 0.3) - (Đi muộn × 0.2) + Điểm thưởng Sao</span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b opacity-75" style={{ borderColor: themeConfig.colors.border }}>
                        <th className="py-2">Học sinh</th>
                        <th className="py-2">Số buổi học</th>
                        <th className="py-2">Vắng</th>
                        <th className="py-2">Muộn</th>
                        <th className="py-2 font-bold">Điểm CC</th>
                        <th className="py-2">Xếp loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: themeConfig.colors.border }}>
                      <tr>
                        <td className="py-2.5 font-bold">Trần Bảo Châu</td>
                        <td className="py-2.5">18/18</td>
                        <td className="py-2.5">0</td>
                        <td className="py-2.5">0</td>
                        <td className="py-2.5 font-extrabold" style={{ color: themeConfig.colors.primary }}>10.0</td>
                        <td className="py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-bold">Xuất sắc</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">Nguyễn Hoàng Anh</td>
                        <td className="py-2.5">17/18</td>
                        <td className="py-2.5">1 (Có phép)</td>
                        <td className="py-2.5">0</td>
                        <td className="py-2.5 font-extrabold" style={{ color: themeConfig.colors.primary }}>9.7</td>
                        <td className="py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-bold">Tốt</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: themeConfig.colors.border }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-600">
                      <Star className="w-4 h-4 fill-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">Bảng Vinh Danh Sao Thi Đua Tháng</h4>
                      <p className="text-[11px] opacity-70">Tuyên dương học sinh nỗ lực & tích cực phát biểu</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">Tháng 09/2026</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-3 rounded-2xl border flex flex-col items-center justify-between" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
                    <span className="text-xs font-bold opacity-75">Hạng 2 🥈</span>
                    <p className="font-extrabold text-xs mt-1">Đặng Quốc Anh</p>
                    <span className="text-[11px] font-bold text-amber-600 mt-1">⭐ +35 Sao</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border-2 flex flex-col items-center justify-between shadow-xs -mt-2" style={{ backgroundColor: themeConfig.colors.badgeBg, borderColor: themeConfig.colors.primary }}>
                    <span className="text-xs font-bold text-amber-600">Quán quân 👑</span>
                    <p className="font-extrabold text-xs sm:text-sm mt-1" style={{ color: themeConfig.colors.primary }}>Trần Bảo Châu</p>
                    <span className="text-xs font-black text-amber-600 mt-1">⭐ +48 Sao</span>
                  </div>
                  <div className="p-3 rounded-2xl border flex flex-col items-center justify-between" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
                    <span className="text-xs font-bold opacity-75">Hạng 3 🥉</span>
                    <p className="font-extrabold text-xs mt-1">Lê Minh Trang</p>
                    <span className="text-[11px] font-bold text-amber-600 mt-1">⭐ +29 Sao</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. TEACHER TESTIMONIALS */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Được tin dùng bởi các thầy cô giáo trên cả nước
          </h2>
          <p className="text-xs sm:text-sm mt-1.5 font-medium" style={{ color: themeConfig.colors.textMuted }}>
            Cảm nhận chân thực về sự tinh tế và tính năng đột phá của nền tảng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
            style={{ backgroundColor: themeConfig.colors.surface, borderColor: themeConfig.colors.border }}
          >
            <p className="text-xs sm:text-sm leading-relaxed italic opacity-90">
              "Giao diện chuẩn mực của hệ thống thực sự cứu rỗi đôi mắt của tôi! Mỗi tối chấm bài tự luận môn Toán không còn bị lóa mắt bởi màn hình trắng toát. AI chấm bám sát barem rất thông minh."
            </p>
            <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: themeConfig.colors.border }}>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 font-bold flex items-center justify-center text-xs">
                MA
              </div>
              <div>
                <p className="text-xs font-bold">Cô Nguyễn Minh Anh</p>
                <p className="text-[10px] opacity-70">GV Toán THPT Chuyên Hà Nội</p>
              </div>
            </div>
          </div>

          <div
            className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
            style={{ backgroundColor: themeConfig.colors.surface, borderColor: themeConfig.colors.border }}
          >
            <p className="text-xs sm:text-sm leading-relaxed italic opacity-90">
              "Tính năng Điểm danh & Điểm chuyên cần thang 10 cực kỳ thực tế. Tôi có thể bấm chấm chuyên cần chỉ trong 30 giây đầu giờ, phụ huynh xem báo cáo cũng khen minh bạch và khen thưởng kịp thời."
            </p>
            <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: themeConfig.colors.border }}>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 font-bold flex items-center justify-center text-xs">
                VT
              </div>
              <div>
                <p className="text-xs font-bold">Thầy Vũ Minh Tuấn</p>
                <p className="text-[10px] opacity-70">GV Vật Lý TP. Hồ Chí Minh</p>
              </div>
            </div>
          </div>

          <div
            className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between"
            style={{ backgroundColor: themeConfig.colors.surface, borderColor: themeConfig.colors.border }}
          >
            <p className="text-xs sm:text-sm leading-relaxed italic opacity-90">
              "Trình đọc đề thi âm thanh AI giúp lớp tiếng Anh của tôi luyện kỹ năng Nghe - Hiểu rất tự nhiên. Chế độ font chữ to rõ cũng giúp các em học sinh tiểu học tiếp cận bài thi dễ dàng."
            </p>
            <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: themeConfig.colors.border }}>
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-700 font-bold flex items-center justify-center text-xs">
                LH
              </div>
              <div>
                <p className="text-xs font-bold">Cô Lê Thu Hương</p>
                <p className="text-[10px] opacity-70">GV Tiếng Anh Đà Nẵng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 sm:py-20 border-t transition-colors" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-2 border"
              style={{
                backgroundColor: themeConfig.colors.badgeBg,
                borderColor: themeConfig.colors.badgeBorder,
                color: themeConfig.colors.badgeText
              }}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Giải đáp thắc mắc</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border transition-all overflow-hidden"
                  style={{
                    backgroundColor: themeConfig.colors.surface,
                    borderColor: themeConfig.colors.border
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-white' : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: isOpen ? themeConfig.colors.primary : themeConfig.colors.surfaceDim
                      }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="px-4 sm:px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3"
                      style={{
                        borderColor: themeConfig.colors.border,
                        color: themeConfig.colors.textMuted
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-20 px-4 text-center">
        <div
          className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl border shadow-lg space-y-6 relative overflow-hidden"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
            style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
          >
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Sẵn sàng chuyển đổi phương pháp kiểm tra số?
          </h2>

          <p className="text-xs sm:text-base max-w-xl mx-auto font-medium" style={{ color: themeConfig.colors.textMuted }}>
            Trải nghiệm ngay không gian làm việc giáo viên với đầy đủ tính năng soạn đề AI, điểm danh chuyên cần và kho giao diện màu sắc phong phú.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: themeConfig.colors.primary }}
            >
              <span>Vào không gian giáo viên ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to={`/teacher/${DEFAULT_TEACHER_SLUG}`}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ borderColor: themeConfig.colors.border, backgroundColor: themeConfig.colors.surfaceDim }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem trang cá nhân giáo viên mẫu</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. AUTH MODAL (LOGIN / REGISTER) */}
      {showAuthModal && (
        <div
          id="auth-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="auth-modal-card"
            className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text
            }}
          >
            {/* Modal header */}
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {showAuthModal === 'login' ? 'Đăng nhập giáo viên' : 'Đăng ký tài khoản giáo viên'}
                  </h3>
                  <p className="text-[11px] opacity-70">
                    {showAuthModal === 'login'
                      ? 'Nhập email hoặc bấm đăng nhập nhanh vào bản demo'
                      : 'Tạo không gian kiểm tra và hồ sơ số riêng'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(null)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs font-bold">
              {showAuthModal === 'register' && (
                <div>
                  <label className="block mb-1.5 opacity-80">Họ và tên giáo viên</label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium outline-hidden"
                    style={{
                      backgroundColor: themeConfig.colors.surfaceDim,
                      borderColor: themeConfig.colors.border,
                      color: themeConfig.colors.text
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block mb-1.5 opacity-80">Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium outline-hidden"
                  style={{
                    backgroundColor: themeConfig.colors.surfaceDim,
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text
                  }}
                />
              </div>

              <div>
                <label className="block mb-1.5 opacity-80">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border font-medium outline-hidden"
                  style={{
                    backgroundColor: themeConfig.colors.surfaceDim,
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text
                  }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-auth-submit"
                  className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                >
                  {showAuthModal === 'login' ? 'Đăng nhập vào Workspace' : 'Đăng ký & Bắt đầu'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(showAuthModal === 'login' ? 'register' : 'login')}
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: themeConfig.colors.primary }}
                >
                  {showAuthModal === 'login'
                    ? 'Chưa có tài khoản? Đăng ký ngay'
                    : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. FOOTER */}
      <footer
        className="mt-auto border-t py-10 transition-colors"
        style={{
          backgroundColor: themeConfig.colors.surface,
          borderColor: themeConfig.colors.border
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeConfig.colors.primary }}
            >
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold">{APP_NAME} — Education Studio</p>
              <p className="text-[10px] opacity-70">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          {/* Quick theme selector in footer */}
          <div className="flex items-center gap-2">
            <span className="opacity-70 text-[11px]">Chủ đề hiện tại:</span>
            <ThemeSelector variant="pill" showLabel={true} />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold opacity-75">
            <a href="#features" className="hover:opacity-100">Tính năng</a>
            <a href="#themes" className="hover:opacity-100">Chủ đề màu</a>
            <Link to={`/teacher/${DEFAULT_TEACHER_SLUG}`} className="hover:opacity-100">Hồ sơ giáo viên</Link>
            <Link to="/teacher/dashboard" className="hover:opacity-100">Workspace</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-[11px] opacity-60" style={{ borderColor: themeConfig.colors.border }}>
          <p>© 2025 {APP_NAME}. Thiết kế chuẩn mực giáo dục số. Phát triển cho giáo viên Việt Nam.</p>
          <p className="mt-2 sm:mt-0">Hỗ trợ: levanhai2206@gmail.com</p>
        </div>
      </footer>
    </div>
  );
};
