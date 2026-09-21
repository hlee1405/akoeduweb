import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  Globe,
  Settings,
  FileUp,
  Menu,
  X,
  ExternalLink,
  GraduationCap,
  Sparkles,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Edit2,
  Trash2,
  QrCode,
  School,
  Calendar
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom } from '../../types';
import { APP_NAME, APP_SUBTITLE } from '../../config/appConfig';
import { ClassFormModal } from '../classes/ClassFormModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { QRModal } from '../common/QRModal';
import { useToast } from '../../context/ToastContext';
import { ThemeSelector } from '../theme/ThemeSelector';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';

interface TeacherLayoutProps {
  children?: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success } = useToast();
  const { theme, themeConfig, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('teacher_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('teacher_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [teacher, setTeacher] = useState(store.getTeacher());
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());

  // Class Action Modals State
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [qrClass, setQrClass] = useState<ClassRoom | null>(null);

  useEffect(() => {
    const updateStats = () => {
      setTeacher(store.getTeacher());
      setClasses(store.getClasses());
    };

    updateStats();
    const unsub = store.subscribe(updateStats);
    return unsub;
  }, []);

  const isClassRoute = location.pathname.startsWith('/teacher/classes');

  const openCreateClassModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClass(null);
    setClassModalOpen(true);
  };

  const openEditClassModal = (cls: ClassRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClass(cls);
    setClassModalOpen(true);
  };

  const openDeleteClassModal = (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteClassId(classId);
  };

  const openQRModal = (cls: ClassRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQrClass(cls);
  };

  const handleDeleteClassConfirm = () => {
    if (deleteClassId) {
      const cls = classes.find((c) => c.id === deleteClassId);
      store.deleteClass(deleteClassId);
      success('Đã xóa lớp học', `Lớp ${cls?.name || ''} đã được xóa.`);
      if (location.pathname === `/teacher/classes/${deleteClassId}`) {
        navigate('/teacher/classes');
      }
      setDeleteClassId(null);
    }
  };

  const navItems = [
    {
      label: 'Tổng quan',
      path: '/teacher/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Thời gian biểu',
      path: '/teacher/calendar',
      icon: Calendar,
      badge: null
    },
    // Classes handled with interactive submenu
    {
      label: 'Ngân hàng câu hỏi',
      path: '/teacher/questions',
      icon: Database,
      badge: null
    },
    {
      label: 'Đề thi',
      path: '/teacher/exams',
      icon: FileText,
      badge: null
    },
    {
      label: 'Hồ sơ',
      path: '/teacher/profile-settings',
      icon: Globe,
      badge: 'PRO'
    }
  ];

  const allStudents = store.getStudents();

  return (
    <div
      id="teacher-layout"
      className="flex h-screen w-full font-sans overflow-hidden antialiased transition-colors duration-200"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text
      }}
    >
      {/* Mobile Top Header */}
      <header
        className="md:hidden fixed top-0 inset-x-0 h-16 z-40 px-4 flex items-center justify-between border-b transition-colors"
        style={{
          backgroundColor: themeConfig.colors.sidebarBg,
          borderColor: themeConfig.colors.sidebarBorder,
          color: themeConfig.colors.sidebarText
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs"
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            A
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector variant="pill" showLabel={false} />
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl transition-colors hover:opacity-80"
            style={{ color: themeConfig.colors.sidebarTextMuted }}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Bright Light Aesthetic + Collapsible on Desktop) */}
      <aside
        id="teacher-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out md:translate-x-0 md:static shrink-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
        style={{
          backgroundColor: themeConfig.colors.sidebarBg,
          borderColor: themeConfig.colors.sidebarBorder,
          color: themeConfig.colors.sidebarText
        }}
      >
        {/* Brand Header */}
        <div
          className={`p-4 flex items-center border-b transition-all ${
            sidebarCollapsed ? 'justify-center' : 'justify-between px-5'
          }`}
          style={{ borderColor: themeConfig.colors.sidebarBorder }}
        >
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Link to="/teacher/dashboard" title={`${APP_NAME} - Trang chủ`}>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md hover:scale-105 transition-transform"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                >
                  A
                </div>
              </Link>
              <button
                id="btn-sidebar-expand-top"
                onClick={toggleSidebarCollapse}
                className="hidden md:flex p-1.5 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
                style={{
                  color: themeConfig.colors.sidebarTextMuted,
                  backgroundColor: themeConfig.colors.surfaceDim
                }}
                title="Mở rộng thanh bên"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/teacher/dashboard" className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                >
                  A
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight" style={{ color: themeConfig.colors.sidebarText }}>{APP_NAME}</span>
                  <p className="text-[11px] font-medium" style={{ color: themeConfig.colors.sidebarTextMuted }}>Education Studio</p>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  id="btn-sidebar-collapse-top"
                  onClick={toggleSidebarCollapse}
                  className="hidden md:flex p-1.5 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
                  style={{
                    color: themeConfig.colors.sidebarTextMuted,
                    backgroundColor: themeConfig.colors.surfaceDim
                  }}
                  title="Thu gọn thanh bên"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden p-1 rounded-lg cursor-pointer"
                  style={{ color: themeConfig.colors.sidebarTextMuted }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action button inside sidebar */}
        <div className={`pt-3.5 pb-2 transition-all ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {sidebarCollapsed ? (
            <button
              id="btn-sidebar-import-wizard-collapsed"
              onClick={() => {
                setMobileOpen(false);
                navigate('/teacher/import-wizard');
              }}
              title="Nhập đề AI (Word/PDF)"
              className="w-11 h-11 mx-auto flex items-center justify-center text-white rounded-xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              style={{ backgroundColor: themeConfig.colors.primary }}
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
            </button>
          ) : (
            <button
              id="btn-sidebar-import-wizard"
              onClick={() => {
                setMobileOpen(false);
                navigate('/teacher/import-wizard');
              }}
              className="w-full flex items-center justify-center gap-2 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
              style={{ backgroundColor: themeConfig.colors.primary }}
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Nhập đề AI (Word/PDF)</span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 space-y-1 py-3 overflow-y-auto custom-scrollbar">
          {/* Dashboard Item */}
          {sidebarCollapsed ? (
            <Link
              id="nav-link-dashboard-collapsed"
              to="/teacher/dashboard"
              onClick={() => setMobileOpen(false)}
              title="Tổng quan"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all relative group ${
                location.pathname === '/teacher/dashboard' ? 'shadow-xs font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
              style={{
                backgroundColor: location.pathname === '/teacher/dashboard' ? themeConfig.colors.sidebarActive : 'transparent',
                border: location.pathname === '/teacher/dashboard' ? `1.5px solid ${themeConfig.colors.primary}` : '1.5px solid transparent',
                color: location.pathname === '/teacher/dashboard' ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
              }}
            >
              <LayoutDashboard className="w-5 h-5" style={{ color: location.pathname === '/teacher/dashboard' ? themeConfig.colors.primary : 'currentColor' }} />
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Tổng quan
              </div>
            </Link>
          ) : (
            <Link
              id="nav-link-dashboard"
              to="/teacher/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/teacher/dashboard'
                  ? 'border-l-4 font-bold shadow-xs'
                  : 'hover:bg-slate-100/80 hover:text-slate-900'
              }`}
              style={{
                backgroundColor: location.pathname === '/teacher/dashboard' ? themeConfig.colors.sidebarActive : 'transparent',
                borderColor: themeConfig.colors.primary,
                color: location.pathname === '/teacher/dashboard' ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
              }}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" style={{ color: location.pathname === '/teacher/dashboard' ? themeConfig.colors.primary : 'currentColor' }} />
                <span>Tổng quan</span>
              </div>
            </Link>
          )}

          {/* MENU LỚP HỌC (Thuần tab Lớp học) */}
          {sidebarCollapsed ? (
            <Link
              id="nav-link-classes-collapsed"
              to="/teacher/classes"
              onClick={() => setMobileOpen(false)}
              title="Lớp học"
              className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all relative group ${
                isClassRoute ? 'shadow-xs font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
              style={{
                backgroundColor: isClassRoute ? themeConfig.colors.sidebarActive : 'transparent',
                border: isClassRoute ? `1.5px solid ${themeConfig.colors.primary}` : '1.5px solid transparent',
                color: isClassRoute ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
              }}
            >
              <Users className="w-5 h-5" style={{ color: isClassRoute ? themeConfig.colors.primary : 'currentColor' }} />
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Lớp học
              </div>
            </Link>
          ) : (
            <Link
              id="nav-link-classes"
              to="/teacher/classes"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isClassRoute
                  ? 'border-l-4 font-bold shadow-xs'
                  : 'hover:bg-slate-100/80 hover:text-slate-900'
              }`}
              style={{
                backgroundColor: isClassRoute ? themeConfig.colors.sidebarActive : 'transparent',
                borderColor: themeConfig.colors.primary,
                color: isClassRoute ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
              }}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" style={{ color: isClassRoute ? themeConfig.colors.primary : 'currentColor' }} />
                <span>Lớp học</span>
              </div>
            </Link>
          )}

          {/* Rest of Navigation items */}
          {navItems.slice(1).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            if (sidebarCollapsed) {
              return (
                <Link
                  key={item.path}
                  id={`nav-link-collapsed-${item.path.replace(/\//g, '-')}`}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                  className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all relative group ${
                    isActive ? 'shadow-xs font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={{
                    backgroundColor: isActive ? themeConfig.colors.sidebarActive : 'transparent',
                    border: isActive ? `1.5px solid ${themeConfig.colors.primary}` : '1.5px solid transparent',
                    color: isActive ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? themeConfig.colors.primary : 'currentColor' }} />
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-1 text-[9px] min-w-4 h-4 px-1 rounded-full font-bold flex items-center justify-center shadow-xs ${
                        item.badge === 'PRO'
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {typeof item.badge === 'number' ? (item.badge > 9 ? '9+' : item.badge) : '★'}
                    </span>
                  )}
                  {/* Tooltip on hover for collapsed mode */}
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                id={`nav-link-${item.path.replace(/\//g, '-')}`}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-l-4 font-bold shadow-xs'
                    : 'hover:bg-slate-100/80 hover:text-slate-900'
                }`}
                style={{
                  backgroundColor: isActive ? themeConfig.colors.sidebarActive : 'transparent',
                  borderColor: themeConfig.colors.primary,
                  color: isActive ? themeConfig.colors.primary : themeConfig.colors.sidebarTextMuted
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" style={{ color: isActive ? themeConfig.colors.primary : 'currentColor' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.badge === 'PRO'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Card / User footer */}
        <div className={`mt-auto border-t space-y-2 ${sidebarCollapsed ? 'p-2 flex flex-col items-center' : 'p-3.5'}`} style={{ borderColor: themeConfig.colors.sidebarBorder }}>
          {sidebarCollapsed ? (
            <>
              <Link to="/teacher/profile-settings" title={`Hồ sơ: ${teacher.fullName}`}>
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  className="w-10 h-10 rounded-2xl object-cover border-2 shadow-xs hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: themeConfig.colors.primary,
                    borderColor: themeConfig.colors.sidebarBorder
                  }}
                />
              </Link>
              <Link
                to="/"
                title="Về trang chủ"
                className="p-2 rounded-xl transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4" />
              </Link>
              <button
                id="btn-sidebar-expand-bottom"
                onClick={toggleSidebarCollapse}
                className="hidden md:flex items-center justify-center p-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                style={{ backgroundColor: themeConfig.colors.surfaceDim }}
                title="Mở rộng thanh bên"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  className="w-10 h-10 rounded-2xl object-cover border-2 shadow-xs shrink-0"
                  style={{
                    backgroundColor: themeConfig.colors.primary,
                    borderColor: themeConfig.colors.sidebarBorder
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: themeConfig.colors.sidebarText }}>{teacher.fullName}</p>
                  <p className="text-[10px] truncate" style={{ color: themeConfig.colors.sidebarTextMuted }}>Teacher Account</p>
                </div>
                <Link
                  to="/"
                  title="Về trang chủ"
                  className="p-2 rounded-xl transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <LogOut className="w-4 h-4" />
                </Link>
              </div>

              {/* Desktop Collapse Toggle Button at bottom of sidebar */}
              <button
                id="btn-sidebar-collapse-bottom"
                onClick={toggleSidebarCollapse}
                className="hidden md:flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer hover:bg-slate-100 text-slate-600 border"
                style={{
                  backgroundColor: themeConfig.colors.surfaceDim,
                  borderColor: themeConfig.colors.sidebarBorder
                }}
                title="Thu gọn thanh bên"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Thu gọn thanh bên</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pt-16 md:pt-0 transition-colors"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text
        }}
      >
        {/* Top Header */}
        <header
          className="h-16 border-b px-6 sm:px-8 flex items-center justify-end shrink-0 relative z-30 transition-colors"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Multiple Themes Switcher */}
            <ThemeSelector variant="pill" showLabel={true} />

            <Link
              to={`/teacher/${teacher.slug}`}
              target="_blank"
              title="Xem trang cá nhân công khai"
              className="p-2 rounded-xl transition-colors hidden sm:inline-flex items-center justify-center border hover:opacity-80"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.surfaceDim,
                color: themeConfig.colors.text
              }}
            >
              <Globe className="w-4 h-4" style={{ color: themeConfig.colors.primary }} />
            </Link>

            <NotificationDropdown />
          </div>
        </header>

        {/* Inner Scrollable View Body */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors custom-scrollbar"
          style={{
            backgroundColor: themeConfig.colors.bg,
            color: themeConfig.colors.text
          }}
        >
          {children || <Outlet />}
        </div>
      </main>

      {/* Global Class Modals from Menu */}
      <ClassFormModal
        isOpen={classModalOpen}
        editingClass={editingClass}
        onClose={() => {
          setClassModalOpen(false);
          setEditingClass(null);
        }}
        onSuccess={() => {
          // Handled within modal navigation options
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteClassId)}
        title="Xác nhận xóa lớp học"
        message="Bạn có chắc chắn muốn xóa lớp học này? Tất cả dữ liệu học sinh trong lớp sẽ bị xóa bỏ."
        confirmText="Xóa lớp"
        isDestructive
        onConfirm={handleDeleteClassConfirm}
        onCancel={() => setDeleteClassId(null)}
      />

      {qrClass && (
        <QRModal
          isOpen={Boolean(qrClass)}
          title={`Mã QR Lớp ${qrClass.name}`}
          subtitle="Học sinh quét mã để tự động tham gia lớp học"
          url={`/classes/join?code=${qrClass.joinCode}`}
          code={qrClass.joinCode}
          onClose={() => setQrClass(null)}
        />
      )}

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-[#2D211C]/60 backdrop-blur-xs z-40"
        />
      )}
    </div>
  );
};
