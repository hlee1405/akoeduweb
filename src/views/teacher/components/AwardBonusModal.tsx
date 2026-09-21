import React, { useState } from 'react';
import { Sparkles, X, Star, CheckCircle2, ThumbsUp, Heart, BookOpen, Clock } from 'lucide-react';
import { Student, ClassRoom } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface AwardBonusModalProps {
  cls: ClassRoom;
  students: Student[];
  initialStudent?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AwardBonusModal: React.FC<AwardBonusModalProps> = ({
  cls,
  students,
  initialStudent,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { success, error } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || (students[0]?.id || ''));
  const [points, setPoints] = useState<number>(1);
  const [category, setCategory] = useState<'academic' | 'attitude' | 'activity' | 'punctuality'>('academic');
  const [reason, setReason] = useState<string>('Phát biểu xây dựng bài sôi nổi & chính xác');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const quickReasons: Record<string, string[]> = {
    academic: [
      'Phát biểu xây dựng bài sôi nổi & chính xác',
      'Hoàn thành bài tập về nhà xuất sắc đạt 10/10',
      'Tìm ra cách giải sáng tạo cho bài toán khó',
      'Đạt điểm tối đa bài kiểm tra 15 phút',
      'Có tiến bộ vượt bậc trong tuần học'
    ],
    attitude: [
      'Tập trung nghe giảng và ghi chép bài đầy đủ',
      'Ý thức kỷ luật gương mẫu trong giờ học',
      'Tích cực trao đổi, phản biện xây dựng bài',
      'Chủ động chuẩn bị đồ dùng học tập chu đáo'
    ],
    activity: [
      'Nhiệt tình hướng dẫn và giúp đỡ bạn cùng tiến',
      'Nhóm trưởng điều phối nhóm học tập xuất sắc',
      'Tích cực tham gia hoạt động giải đố vui môn học',
      'Vệ sinh lớp học và bảo quản trang thiết bị tốt'
    ],
    punctuality: [
      'Đi học đúng giờ đủ 100% trong tháng',
      'Nộp bài tập trực tuyến sớm nhất lớp',
      'Vào lớp ổn định vị trí nhanh chóng'
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      error('Chưa chọn học sinh', 'Vui lòng chọn học sinh được khen thưởng.');
      return;
    }

    if (selectedStudentId === '__all__') {
      // Award to all students in class
      students.forEach((s) => {
        store.addBonusPoint({
          classId: cls.id,
          studentId: s.id,
          studentCode: s.code,
          studentName: s.fullName,
          points,
          reason,
          category,
          date
        });
      });
      success('Khen thưởng cả lớp', `Đã cộng ${points > 0 ? '+' : ''}${points} điểm thưởng cho toàn bộ ${students.length} học sinh.`);
    } else {
      const student = students.find((s) => s.id === selectedStudentId);
      if (!student) return;

      store.addBonusPoint({
        classId: cls.id,
        studentId: student.id,
        studentCode: student.code,
        studentName: student.fullName,
        points,
        reason,
        category,
        date
      });

      success('Thưởng điểm thành công', `Đã cộng ${points > 0 ? '+' : ''}${points} điểm cho học sinh ${student.fullName}.`);
    }

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C453C]/50 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#EFE3DD] overflow-hidden">
        {/* Header - Lissenly Styling */}
        <div className="p-5 bg-[#5C453C] text-white flex items-center justify-between border-b border-[#4A3730]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/10">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">Khen thưởng & Điểm cộng thi đua</h3>
              <p className="text-xs text-[#EFE3DD] font-medium">Lớp {cls.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Student */}
          <div>
            <label className="font-bold text-[#5C453C] block mb-1">Chọn học sinh được thưởng *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#EFE3DD] rounded-xl font-bold text-[#5C453C] bg-[#F5F0EA] focus:bg-[#FFFDF9] focus:ring-2 focus:ring-[#B68176] outline-hidden cursor-pointer"
            >
              <option value="__all__">🌟 Toàn bộ lớp {cls.name} ({students.length} học sinh)</option>
              <optgroup label="Từng học sinh trong lớp">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.fullName}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Points & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#5C453C] block mb-1">Số sao / điểm thưởng *</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPoints(num)}
                    className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      points === num
                        ? 'bg-[#B68176] text-white shadow-xs'
                        : 'bg-[#F5F0EA] text-[#5C453C] hover:bg-[#EFE3DD] border border-[#EFE3DD]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${points === num ? 'fill-amber-300 text-amber-300' : 'text-amber-500'}`} />
                    <span>+{num}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-[#5C453C] block mb-1">Ngày khen thưởng</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#EFE3DD] bg-[#F5F0EA] text-[#5C453C] font-bold rounded-xl outline-hidden focus:bg-[#FFFDF9]"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div>
            <label className="font-bold text-[#5C453C] block mb-1.5">Danh mục khen thưởng</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'academic', label: 'Học tập & Bài vở', icon: BookOpen },
                { id: 'attitude', label: 'Kỷ luật & Thái độ', icon: Heart },
                { id: 'activity', label: 'Hoạt động & Giúp bạn', icon: ThumbsUp },
                { id: 'punctuality', label: 'Đúng giờ & Chuyên cần', icon: Clock }
              ].map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id as any);
                      if (quickReasons[cat.id]?.[0]) {
                        setReason(quickReasons[cat.id][0]);
                      }
                    }}
                    className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F9EAEA] text-[#B68176] font-bold border-[#F0D5D0] shadow-xs'
                        : 'bg-[#FFFDF9] text-[#5C453C] border-[#EFE3DD] hover:bg-[#F5F0EA]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#B68176]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason input and quick chips */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#5C453C] block">Lý do khen thưởng cụ thể *</label>
            <input
              type="text"
              required
              placeholder="VD: Phát biểu sôi nổi, giải đúng câu khó..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#EFE3DD] bg-[#FFFDF9] text-[#5C453C] rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#B68176]"
            />

            {/* Quick Reason Suggestions */}
            <div className="pt-1">
              <span className="text-[11px] text-[#9A8A85] block mb-1">Gợi ý nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {(quickReasons[category] || []).map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="px-2 py-1 rounded-lg bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] text-[11px] border border-[#EFE3DD] transition-colors cursor-pointer text-left"
                  >
                    + {qr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#EFE3DD] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] font-semibold rounded-xl transition-colors cursor-pointer border border-[#EFE3DD]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#B68176] hover:bg-[#A37066] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Ghi nhận thưởng sao</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
