import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, RotateCcw, Sparkles, CheckCircle2, BookOpen, Headphones } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const LissenlyAudioReader: React.FC = () => {
  const { themeConfig } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<'female_north' | 'male_south'>('female_north');
  const [dyslexicFont, setDyslexicFont] = useState(false);

  const sampleQuestionText =
    "Câu 1: Cho hàm số y = f(x) liên tục trên đoạn [a, b]. Biết đạo hàm f'(x) đổi dấu từ dương sang âm khi qua điểm x0 thuộc khoảng (a, b). Khẳng định nào sau đây là đúng về cực trị của hàm số?";

  const words = sampleQuestionText.split(' ');

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const intervalMs = Math.round(280 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentWordIndex((prev) => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, words.length]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentWordIndex >= words.length - 1) {
        setCurrentWordIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
  };

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl border shadow-sm transition-all"
      style={{
        backgroundColor: themeConfig.colors.surface,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text
      }}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: themeConfig.colors.border }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.primary }}
          >
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
              <span>Trình đọc đề thi AI Voice (Text-to-Speech)</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: themeConfig.colors.badgeBg, color: themeConfig.colors.badgeText }}
              >
                AI Audio
              </span>
            </div>
            <p className="text-[11px] opacity-70">
              Hỗ trợ học sinh khiếm thị, kiểm tra nghe & tăng tính tập trung
            </p>
          </div>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border font-bold cursor-pointer outline-hidden"
            style={{
              backgroundColor: themeConfig.colors.surfaceDim,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text
            }}
          >
            <option value="female_north">Giọng Nữ Hà Nội (Chuẩn sư phạm)</option>
            <option value="male_south">Giọng Nam Sài Gòn (Ấm áp)</option>
          </select>

          <button
            type="button"
            onClick={() => setDyslexicFont(!dyslexicFont)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              dyslexicFont ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: dyslexicFont ? themeConfig.colors.badgeBg : themeConfig.colors.surfaceDim,
              borderColor: dyslexicFont ? themeConfig.colors.primary : themeConfig.colors.border,
              color: dyslexicFont ? themeConfig.colors.primary : themeConfig.colors.text
            }}
            title="Bật chế độ font chữ dễ đọc cho học sinh khó đọc (Dyslexia-friendly)"
          >
            {dyslexicFont ? 'Aa Dyslexia: BẬT' : 'Aa Font'}
          </button>
        </div>
      </div>

      {/* Question Content Display with Live Highlighting */}
      <div className="my-5 p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
        <p
          className={`text-sm sm:text-base leading-relaxed ${
            dyslexicFont ? 'tracking-wider font-sans' : 'font-sans'
          }`}
          style={{ letterSpacing: dyslexicFont ? '0.05em' : 'normal', lineHeight: dyslexicFont ? '1.9' : '1.7' }}
        >
          {words.map((word, idx) => {
            const isCurrent = isPlaying && idx === currentWordIndex;
            return (
              <span
                key={idx}
                className={`transition-colors rounded-sm px-0.5 mx-0.5 ${
                  isCurrent
                    ? 'font-bold text-white shadow-2xs'
                    : 'opacity-95'
                }`}
                style={{
                  backgroundColor: isCurrent ? themeConfig.colors.primary : 'transparent'
                }}
              >
                {word}
              </span>
            );
          })}
        </p>

        {/* Options preview */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            'A. Hàm số đạt cực tiểu tại điểm x0',
            'B. Hàm số đạt cực đại tại điểm x0',
            'C. x0 là điểm uốn của đồ thị hàm số',
            'D. Hàm số không có cực trị tại x0'
          ].map((opt, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                i === 1 ? 'font-bold' : 'opacity-85'
              }`}
              style={{
                backgroundColor: i === 1 ? themeConfig.colors.badgeBg : themeConfig.colors.surface,
                borderColor: i === 1 ? themeConfig.colors.primary : themeConfig.colors.border,
                color: i === 1 ? themeConfig.colors.primary : themeConfig.colors.text
              }}
            >
              <span>{opt}</span>
              {i === 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Audio Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: themeConfig.colors.border }}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePlayToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer active:scale-95"
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Nghe đọc câu hỏi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border transition-colors cursor-pointer"
            style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}
            title="Đọc lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 opacity-75" />
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center gap-1 border rounded-xl p-0.5" style={{ backgroundColor: themeConfig.colors.surfaceDim, borderColor: themeConfig.colors.border }}>
            {[1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd ? 'shadow-2xs text-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: playbackSpeed === spd ? themeConfig.colors.primary : 'transparent'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio Waveform visualization indication */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] opacity-70 mr-1 hidden sm:inline">Trạng thái âm thanh:</span>
          {[4, 10, 14, 8, 16, 12, 6, 15, 9, 5].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying ? 'animate-pulse' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${h}px` : '4px',
                backgroundColor: themeConfig.colors.primary
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
