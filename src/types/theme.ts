export type ThemeId = 'blue' | 'indigo' | 'emerald' | 'slate';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceDim: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  border: string;
  borderSubtle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarActive: string;
  sidebarHover: string;
  sidebarBorder: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  englishName: string;
  description: string;
  tag: string;
  isDark: boolean;
  colors: ThemeColors;
  previewSwatches: [string, string, string]; // [bg, surface, primary]
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'blue',
    name: 'Xanh Giáo Dục',
    englishName: 'Classic Blue',
    description: 'Giao diện xanh lam chuẩn mực, hiện đại, sắc nét và chuyên nghiệp cho hệ thống giáo dục.',
    tag: 'Mặc định',
    isDark: false,
    previewSwatches: ['#F8FAFC', '#FFFFFF', '#2563EB'],
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceDim: '#F1F5F9',
      surfaceHover: '#E2E8F0',
      text: '#0F172A',
      textMuted: '#64748B',
      textInverse: '#FFFFFF',
      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      primaryLight: '#EFF6FF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      badgeBg: '#EFF6FF',
      badgeText: '#2563EB',
      badgeBorder: '#BFDBFE',
      sidebarBg: '#FFFFFF',
      sidebarText: '#0F172A',
      sidebarTextMuted: '#64748B',
      sidebarActive: '#EFF6FF',
      sidebarHover: '#F8FAFC',
      sidebarBorder: '#E2E8F0'
    }
  },
  {
    id: 'indigo',
    name: 'Xanh Chàm Trí Tuệ',
    englishName: 'Academic Indigo',
    description: 'Sắc chàm thanh lịch, giúp nâng cao khả năng tập trung khi soạn giáo án và chấm bài.',
    tag: 'Tập trung',
    isDark: false,
    previewSwatches: ['#F8FAFC', '#FFFFFF', '#4F46E5'],
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceDim: '#F3F4F6',
      surfaceHover: '#E5E7EB',
      text: '#111827',
      textMuted: '#6B7280',
      textInverse: '#FFFFFF',
      primary: '#4F46E5',
      primaryHover: '#4338CA',
      primaryLight: '#EEF2FF',
      border: '#E5E7EB',
      borderSubtle: '#F3F4F6',
      badgeBg: '#EEF2FF',
      badgeText: '#4F46E5',
      badgeBorder: '#C7D2FE',
      sidebarBg: '#FFFFFF',
      sidebarText: '#111827',
      sidebarTextMuted: '#6B7280',
      sidebarActive: '#EEF2FF',
      sidebarHover: '#F8FAFC',
      sidebarBorder: '#E5E7EB'
    }
  },
  {
    id: 'emerald',
    name: 'Xanh Ngọc Tri Thức',
    englishName: 'Emerald Forest',
    description: 'Gam màu xanh ngọc dịu nhẹ, cân bằng thị giác và mang lại cảm giác tươi mới cho bài thi.',
    tag: 'Thư thái dịu mắt',
    isDark: false,
    previewSwatches: ['#F0FDF4', '#FFFFFF', '#059669'],
    colors: {
      bg: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceDim: '#DCFCE7',
      surfaceHover: '#BBF7D0',
      text: '#064E3B',
      textMuted: '#047857',
      textInverse: '#FFFFFF',
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#ECFDF5',
      border: '#D1FAE5',
      borderSubtle: '#E6F9F0',
      badgeBg: '#ECFDF5',
      badgeText: '#059669',
      badgeBorder: '#A7F3D0',
      sidebarBg: '#FFFFFF',
      sidebarText: '#064E3B',
      sidebarTextMuted: '#047857',
      sidebarActive: '#ECFDF5',
      sidebarHover: '#F0FDF4',
      sidebarBorder: '#D1FAE5'
    }
  },
  {
    id: 'slate',
    name: 'Đêm Tối Hiện Đại',
    englishName: 'Dark Slate',
    description: 'Chế độ nền tối than sâu sang trọng, bảo vệ mắt tối ưu khi làm việc hoặc chấm thi buổi tối.',
    tag: 'Chế độ tối',
    isDark: true,
    previewSwatches: ['#0F172A', '#1E293B', '#38BDF8'],
    colors: {
      bg: '#0F172A',
      surface: '#1E293B',
      surfaceDim: '#334155',
      surfaceHover: '#29394F',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textInverse: '#0F172A',
      primary: '#38BDF8',
      primaryHover: '#0EA5E9',
      primaryLight: '#1E3A5F',
      border: '#334155',
      borderSubtle: '#475569',
      badgeBg: '#1E293B',
      badgeText: '#38BDF8',
      badgeBorder: '#294366',
      sidebarBg: '#090D16',
      sidebarText: '#F8FAFC',
      sidebarTextMuted: '#94A3B8',
      sidebarActive: '#1E293B',
      sidebarHover: '#131D2E',
      sidebarBorder: '#243248'
    }
  }
];

// Alias for backward compatibility
export const LISSENLY_THEMES = APP_THEMES;
