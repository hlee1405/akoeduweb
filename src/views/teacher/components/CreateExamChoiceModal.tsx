import React from 'react';
import {
  X,
  BookOpen,
  Zap,
  Sparkles,
  Shuffle,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  ChevronRight,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

export type ExamCreationMethod = 'from_scratch' | 'quick' | 'ai' | 'random' | 'word_pdf';

interface CreateExamChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: ExamCreationMethod) => void;
  title?: string;
  subtitle?: string;
}

export const CreateExamChoiceModal: React.FC<CreateExamChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  title = 'Tạo đề thi mới',
  subtitle = 'Chọn phương thức khởi tạo đề thi trắc nghiệm phù hợp với nhu cầu của bạn'
}) => {
  if (!isOpen) return null;

  const options: {
    id: ExamCreationMethod;
    number: number;
    title: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    badge?: string;
    badgeBg?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'from_scratch',
      number: 1,
      title: 'Tạo từ đầu',
      description: 'Chọn câu hỏi từ ngân hàng câu hỏi để tạo đề',
      icon: BookOpen,
      iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
      iconColor: 'text-indigo-600',
      badge: 'Ngân hàng',
      badgeBg: 'bg-indigo-50',
      badgeColor: 'text-indigo-700'
    },
    {
      id: 'quick',
      number: 2,
      title: 'Tạo nhanh',
      description: 'Tạo đề thi nhanh bằng cách nhập danh sách hoặc tải lên từ tệp Excel',
      icon: Zap,
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      iconColor: 'text-emerald-600',
      badge: 'Excel / Nhập nhanh',
      badgeBg: 'bg-emerald-50',
      badgeColor: 'text-emerald-700'
    },
    {
      id: 'ai',
      number: 3,
      title: 'Tạo bằng AI',
      description: 'Từ tài liệu, hình ảnh, văn bản',
      icon: Sparkles,
      iconBg: 'bg-violet-50 border-violet-100 text-violet-600',
      iconColor: 'text-violet-600',
      badge: 'Trợ lý AI',
      badgeBg: 'bg-violet-50',
      badgeColor: 'text-violet-700'
    },
    {
      id: 'random',
      number: 4,
      title: 'Đề ngẫu nhiên',
      description: 'Tạo đề ngẫu nhiên từ danh sách câu hỏi',
      icon: Shuffle,
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
      iconColor: 'text-amber-600',
      badge: 'Ngẫu nhiên',
      badgeBg: 'bg-amber-50',
      badgeColor: 'text-amber-700'
    },
    {
      id: 'word_pdf',
      number: 5,
      title: 'Tạo từ PDF/Word',
      description: 'Tải lên tài liệu PDF/Word của bạn và tiến hành tạo đề',
      icon: FileText,
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600',
      iconColor: 'text-blue-600',
      badge: 'Word .docx / PDF',
      badgeBg: 'bg-blue-50',
      badgeColor: 'text-blue-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of 5 Choices */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectMethod(opt.id);
                }}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Icon Box */}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${opt.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200/60 ${opt.badgeBg} ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 group-hover:text-slate-600 line-clamp-1">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end text-xs text-slate-500">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
