import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeId } from '../../types/theme';

interface ThemeSelectorProps {
  variant?: 'compact' | 'pill' | 'button' | 'inline-grid';
  showLabel?: boolean;
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'compact',
  showLabel = true,
  className = ''
}) => {
  const { theme, themeConfig, setTheme, allThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'inline-grid') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
        {allThemes.map((t) => {
          const isSelected = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 shadow-sm'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: t.colors.surface,
                borderColor: isSelected ? t.colors.primary : t.colors.border,
                color: t.colors.text
              }}
            >
              {/* Color Swatch Header */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <div className="flex items-center -space-x-1">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.previewSwatches[0] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.previewSwatches[1] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.previewSwatches[2] }}
                  />
                </div>
                {isSelected && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: t.colors.primary }}
                  >
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div>
                <div className="font-bold text-xs truncate">{t.name}</div>
                <div className="text-[10px] opacity-75 truncate">{t.englishName}</div>
              </div>

              <div
                className="mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-block self-start truncate max-w-full"
                style={{
                  backgroundColor: t.colors.badgeBg,
                  color: t.colors.badgeText
                }}
              >
                {t.tag}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text
          }}
          title="Chọn giao diện màu sắc"
        >
          <div className="flex items-center -space-x-1">
            <div
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: themeConfig.previewSwatches[0] }}
            />
            <div
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: themeConfig.previewSwatches[2] }}
            />
          </div>
          {showLabel && <span className="truncate max-w-[120px]">{themeConfig.name}</span>}
          <Palette className="w-3.5 h-3.5 opacity-70" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text
          }}
          title="Đổi chủ đề màu sắc"
        >
          <div className="flex items-center -space-x-1">
            <div
              className="w-3.5 h-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: themeConfig.previewSwatches[0] }}
            />
            <div
              className="w-3.5 h-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: themeConfig.previewSwatches[2] }}
            />
          </div>
          {showLabel && (
            <span className="hidden sm:inline font-bold">{themeConfig.name}</span>
          )}
          <Palette className="w-3.5 h-3.5 opacity-70" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: themeConfig.colors.border }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: themeConfig.colors.primary }} />
              <div>
                <h4 className="font-extrabold text-xs">Giao diện màu sắc</h4>
                <p className="text-[10px] opacity-70">Chọn phong cách thị giác hệ thống</p>
              </div>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: themeConfig.colors.badgeBg,
                color: themeConfig.colors.badgeText
              }}
            >
              {allThemes.length} chủ đề
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {allThemes.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected ? 'ring-2' : 'hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: t.colors.surface,
                    borderColor: isSelected ? t.colors.primary : t.colors.border,
                    color: t.colors.text
                  }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center -space-x-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: t.previewSwatches[0] }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: t.previewSwatches[1] }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: t.previewSwatches[2] }}
                      />
                    </div>
                    {t.isDark ? (
                      <Moon className="w-3 h-3 opacity-60" />
                    ) : (
                      <Sun className="w-3 h-3 opacity-60" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span className="truncate">{t.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: t.colors.primary }} />
                      )}
                    </div>
                    <p className="text-[10px] opacity-70 line-clamp-1 mt-0.5">{t.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t text-[10px] text-center opacity-70" style={{ borderColor: themeConfig.colors.border }}>
            Chủ đề được tự động lưu lại cho tất cả các trang & phòng thi.
          </div>
        </div>
      )}
    </div>
  );
};
