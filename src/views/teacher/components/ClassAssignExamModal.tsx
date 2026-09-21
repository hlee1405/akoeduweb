import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Zap,
  Search,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';
import { Exam, ClassRoom } from '../../../types';
import { store } from '../../../services/store';

interface ClassAssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassRoom;
  onSelectExamToAssign: (exam: Exam) => void;
  onOpenCreateNewExam: () => void;
}

export const ClassAssignExamModal: React.FC<ClassAssignExamModalProps> = ({
  isOpen,
  onClose,
  cls,
  onSelectExamToAssign,
  onOpenCreateNewExam
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const allExams = store.getExams();

  if (!isOpen) return null;

  // Filter exams that can be assigned
  const filteredExams = allExams.filter((ex) => {
    return (
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Giao Đề Thi Cho Lớp: {cls.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn đề trắc nghiệm có sẵn từ kho hoặc tạo đề thi mới
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

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {/* Quick Action: Create New Exam */}
          <div className="p-4 bg-linear-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/5 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Tạo Đề Thi Trắc Nghiệm Mới</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Khuyên dùng
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tải file Word/PDF trắc nghiệm hoặc dùng phiếu đáp án OMR siêu tốc 30 giây để giao ngay cho lớp <strong>{cls.name}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateNewExam();
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề mới ngay</span>
            </button>
          </div>

          {/* Section: Select from Existing Exams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Hoặc chọn từ Kho Đề thi có sẵn ({filteredExams.length} đề thi)</span>
              </span>

              {/* Search */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên đề, môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs outline-hidden w-full font-medium"
                />
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Không tìm thấy đề thi nào phù hợp với từ khóa "{searchTerm}".
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredExams.map((exam) => {
                  const isAssignedToThisClass = (exam.assignedClassIds || []).includes(cls.id);
                  const questionsCount = exam.questions?.length || 0;

                  return (
                    <div
                      key={exam.id}
                      className="p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-sm">
                            {exam.title}
                          </span>
                          {isAssignedToThisClass && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã giao lớp này</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>{questionsCount} câu trắc nghiệm</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{exam.durationMinutes} phút</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectExamToAssign(exam);
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Cấu hình & Giao</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end text-xs text-slate-500">
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
