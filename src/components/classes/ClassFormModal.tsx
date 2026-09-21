import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  School,
  FileText
} from 'lucide-react';
import { ClassRoom } from '../../types';
import { store } from '../../services/store';
import { useToast } from '../../context/ToastContext';
import { ClassShareModal } from './ClassShareModal';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass?: ClassRoom | null;
  onSuccess?: (cls: ClassRoom) => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  editingClass,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Khối 9');
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [allowSelfJoin, setAllowSelfJoin] = useState(true);

  // State to show the created class info & QR popup right after creation
  const [createdClassForShare, setCreatedClassForShare] = useState<ClassRoom | null>(null);

  const generateRandomCode = (subjectName: string, gradeName: string) => {
    const subPrefix = subjectName.includes('Toán') ? 'TOAN' :
                      subjectName.includes('Văn') ? 'VAN' :
                      subjectName.includes('Anh') ? 'ENG' :
                      subjectName.includes('Lý') ? 'LY' :
                      subjectName.includes('Hóa') ? 'HOA' :
                      subjectName.includes('Sinh') ? 'SINH' : 'LOP';
    const gradeNum = gradeName.replace(/\D/g, '') || '9';
    const rand = Math.floor(100 + Math.random() * 900);
    return `${subPrefix}${gradeNum}-${rand}`;
  };

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setSubject(editingClass.subject || 'Toán học');
      setGrade(editingClass.grade || 'Khối 9');
      setAcademicYear(editingClass.academicYear || '2024 - 2025');
      setDescription(editingClass.description || '');
      setJoinCode(editingClass.joinCode);
      setAllowSelfJoin(editingClass.allowSelfJoin ?? true);
    } else {
      setName('');
      setSubject('Toán học');
      setGrade('Khối 9');
      setAcademicYear('2024 - 2025');
      setDescription('');
      setJoinCode(generateRandomCode('Toán học', 'Khối 9'));
      setAllowSelfJoin(true);
    }
    setCreatedClassForShare(null);
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  // If a new class was just created, display the Info & QR Share Popup
  if (createdClassForShare) {
    return (
      <ClassShareModal
        isOpen={true}
        classRoom={createdClassForShare}
        isNewlyCreated={true}
        onClose={() => {
          const finishedClass = createdClassForShare;
          setCreatedClassForShare(null);
          onClose();
          if (onSuccess) onSuccess(finishedClass);
        }}
        onNavigateToClass={() => {
          const finishedClass = createdClassForShare;
          setCreatedClassForShare(null);
          onClose();
          if (onSuccess) onSuccess(finishedClass);
          navigate(`/teacher/classes/${finishedClass.id}`);
        }}
      />
    );
  }

  // Infer subject & grade from class name (e.g., "Toán 9A1" -> Toán học, Khối 9)
  const inferSubjectAndGrade = (className: string) => {
    let resolvedSubject = subject || 'Toán học';
    const lower = className.toLowerCase();
    if (lower.includes('văn')) resolvedSubject = 'Ngữ văn';
    else if (lower.includes('anh') || lower.includes('eng')) resolvedSubject = 'Tiếng Anh';
    else if (lower.includes('lý') || lower.includes('vật')) resolvedSubject = 'Vật lý';
    else if (lower.includes('hóa')) resolvedSubject = 'Hóa học';
    else if (lower.includes('sinh')) resolvedSubject = 'Sinh học';
    else if (lower.includes('sử')) resolvedSubject = 'Lịch sử';
    else if (lower.includes('địa')) resolvedSubject = 'Địa lý';
    else if (lower.includes('tin')) resolvedSubject = 'Tin học';
    else if (lower.includes('toán')) resolvedSubject = 'Toán học';

    let resolvedGrade = grade || 'Khối 9';
    const matchGrade = className.match(/(?:khối|k|lớp|\s|^)(1[0-2]|[6-9])(?:\b|\D)/i);
    if (matchGrade) {
      resolvedGrade = `Khối ${matchGrade[1]}`;
    }

    return { resolvedSubject, resolvedGrade };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { resolvedSubject, resolvedGrade } = inferSubjectAndGrade(name.trim());
    const finalSubject = editingClass ? (editingClass.subject || resolvedSubject) : resolvedSubject;
    const finalGrade = editingClass ? (editingClass.grade || resolvedGrade) : resolvedGrade;
    const formattedCode = (joinCode.trim() || generateRandomCode(finalSubject, finalGrade)).toUpperCase();

    if (editingClass) {
      const updated = store.updateClass(editingClass.id, {
        name: name.trim(),
        subject: finalSubject,
        grade: finalGrade,
        academicYear,
        description: description.trim(),
        joinCode: formattedCode,
        allowSelfJoin
      });
      success('Cập nhật thành công', `Đã lưu thông tin lớp "${name}"`);
      if (updated && onSuccess) onSuccess(updated);
      onClose();
    } else {
      const created = store.addClass({
        name: name.trim(),
        subject: finalSubject,
        grade: finalGrade,
        academicYear,
        description: description.trim(),
        joinCode: formattedCode,
        allowSelfJoin,
        status: 'active'
      });
      success('Tạo lớp học thành công!', `Lớp "${name.trim()}" đã sẵn sàng.`);
      // Transition immediately to the created class info & QR popup!
      setCreatedClassForShare(created);
    }
  };

  return (
    <div
      id="modal-class-form-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-class-form-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {editingClass ? 'Chỉnh sửa thông tin lớp học' : 'Tạo lớp học mới'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingClass
                  ? 'Cập nhật tên lớp, mô tả, môn học và mã tham gia'
                  : 'Điền tên lớp và mô tả để tạo lớp, nhận mã QR và mã vào lớp ngay'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-class-form-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1 custom-scrollbar">
          {/* 1. Tên lớp học (Trọng tâm) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 text-xs block">
              Tên lớp học <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-class-name"
              type="text"
              required
              placeholder="Ví dụ: Toán 9A1 - Luyện thi Chuyên, 12 Tin, Lý 10 Nâng cao..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden text-slate-900 font-semibold shadow-2xs"
            />
          </div>

          {/* 2. Mô tả lớp học (Trọng tâm) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Mô tả lớp học</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">{description.length}/30 ký tự</span>
            </div>
            <textarea
              id="textarea-class-description"
              rows={2}
              maxLength={30}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 30))}
              placeholder="Ghi chú ngắn gọn (tối đa 30 ký tự)..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden text-slate-800 leading-relaxed shadow-2xs resize-none"
            />
          </div>

          {/* Join Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Mã vào lớp</label>
              <button
                id="btn-regenerate-join-code"
                type="button"
                onClick={() => {
                  const { resolvedSubject, resolvedGrade } = inferSubjectAndGrade(name);
                  setJoinCode(generateRandomCode(resolvedSubject, resolvedGrade));
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Đổi mã khác
              </button>
            </div>
            <input
              id="input-class-join-code"
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Mã gồm chữ và số"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-extrabold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden tracking-wider uppercase bg-blue-50/40 shadow-2xs"
            />
          </div>

          {/* Settings / Allow Self Join */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="chk-modal-self-join"
              checked={allowSelfJoin}
              onChange={(e) => setAllowSelfJoin(e.target.checked)}
              className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="chk-modal-self-join" className="text-slate-700 text-xs cursor-pointer leading-relaxed">
              <span className="font-bold text-slate-900 block">
                Cho phép học sinh tự tham gia qua Mã / QR Code
              </span>
              Tạo xong lớp, hệ thống sẽ mở ngay popup thông tin kèm mã QR và mã vào lớp để chia sẻ cho học sinh.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-class-form"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer text-xs"
            >
              Hủy bỏ
            </button>
            <button
              id="btn-submit-class-form"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{editingClass ? 'Lưu cập nhật' : 'Tạo lớp & Lấy mã QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
