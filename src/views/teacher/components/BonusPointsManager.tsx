import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Star,
  Trash2,
  BookOpen,
  Heart,
  ThumbsUp,
  Clock,
  Search
} from 'lucide-react';
import { ClassRoom, Student, BonusPointRecord } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface BonusPointsManagerProps {
  cls: ClassRoom;
  students: Student[];
  onOpenAwardModal: (student?: Student) => void;
}

export const BonusPointsManager: React.FC<BonusPointsManagerProps> = ({
  cls,
  students,
  onOpenAwardModal
}) => {
  const { success } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const records = store.getBonusPoints(cls.id);

  // Group by student for leaderboard
  const studentPointsMap: Record<string, { student: Student; totalPoints: number }> = {};
  students.forEach((s) => {
    studentPointsMap[s.id] = { student: s, totalPoints: 0 };
  });

  records.forEach((r) => {
    if (studentPointsMap[r.studentId]) {
      studentPointsMap[r.studentId].totalPoints += r.points;
    }
  });

  const topStudents = Object.values(studentPointsMap)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 3)
    .filter((item) => item.totalPoints > 0);

  const filteredRecords = records.filter((r) => {
    const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleDeleteRecord = (id: string, name: string) => {
    store.deleteBonusPoint(id);
    success('Đã thu hồi điểm thưởng', `Đã xóa bản ghi thưởng điểm của ${name}`);
  };

  const getCategoryBadge = (cat: BonusPointRecord['category']) => {
    switch (cat) {
      case 'academic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F0EA] text-[#5C453C] border border-[#EFE3DD]">
            <BookOpen className="w-3 h-3 text-[#B68176]" /> Học tập
          </span>
        );
      case 'attitude':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F9EAEA] text-[#B68176] border border-[#F0D5D0]">
            <Heart className="w-3 h-3" /> Kỷ luật & Thái độ
          </span>
        );
      case 'activity':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ThumbsUp className="w-3 h-3 text-emerald-600" /> Hoạt động & Giúp bạn
          </span>
        );
      case 'punctuality':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Đúng giờ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="bonus-points-manager" className="space-y-6 font-sans">
      {/* Top Leaderboard Podium & Award Action - Lissenly Styling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Podium Hall of Fame */}
        <div className="lg:col-span-2 p-5 bg-[#5C453C] text-white rounded-2xl shadow-xs space-y-4 border border-[#4A3730]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <h3 className="font-extrabold text-base tracking-tight">Bảng Vinh Danh Top Sao Thi Đua</h3>
            </div>
            <span className="text-xs bg-white/15 text-[#FFFDF9] font-bold px-2.5 py-1 rounded-full border border-white/10">
              Lớp {cls.name}
            </span>
          </div>

          {topStudents.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {topStudents.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="p-3 bg-[#4A3730]/70 rounded-2xl text-center space-y-1.5 border border-[#8C6D62]/30 relative"
                >
                  <div className="text-xl">
                    {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-bold text-xs text-[#FFFDF9] truncate" title={item.student.fullName}>
                    {item.student.fullName}
                  </div>
                  <div className="text-[10px] text-[#EFE3DD]/80 font-mono">{item.student.code}</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFDF9] text-amber-900 font-extrabold text-xs shadow-2xs">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>+{item.totalPoints} sao</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white/10 rounded-2xl text-center text-xs text-[#EFE3DD]">
              Chưa có học sinh nào được cộng sao thi đua trong kỳ này.
            </div>
          )}
        </div>

        {/* Quick Award Card */}
        <div className="p-5 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#5C453C] font-extrabold text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>Khen thưởng học sinh</span>
            </div>
            <p className="text-xs text-[#9A8A85] mt-1.5 leading-relaxed">
              Khích lệ tinh thần học tập, khen ngợi bài làm xuất sắc, ý thức xây dựng bài hoặc thành tích vượt bậc.
            </p>
          </div>

          <button
            id="btn-open-award-bonus-modal"
            type="button"
            onClick={() => onOpenAwardModal()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#B68176] hover:bg-[#A37066] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thưởng điểm / Sao mới</span>
          </button>
        </div>
      </div>

      {/* Filter and History Bar */}
      <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-[#9A8A85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#EFE3DD] bg-[#F5F0EA] rounded-xl text-xs text-[#5C453C] placeholder-[#9A8A85] outline-hidden focus:bg-[#FFFDF9] focus:ring-2 focus:ring-[#B68176]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-[#EFE3DD] rounded-xl text-xs font-bold bg-[#F5F0EA] text-[#5C453C] outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả danh mục thưởng</option>
            <option value="academic">Học tập & Bài vở</option>
            <option value="attitude">Kỷ luật & Thái độ</option>
            <option value="activity">Hoạt động & Giúp bạn</option>
            <option value="punctuality">Đúng giờ & Chuyên cần</option>
          </select>
        </div>

        <div className="text-xs text-[#9A8A85] font-semibold">
          Tổng cộng: <strong>{filteredRecords.length}</strong> lượt khen thưởng
        </div>
      </div>

      {/* Bonus History Table */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-[#9A8A85] text-xs">
            Chưa có lượt thưởng điểm nào thỏa mãn điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F5F0EA] border-b border-[#EFE3DD] text-[#5C453C] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-4">Học sinh</th>
                  <th className="py-3.5 text-center">Điểm cộng</th>
                  <th className="py-3.5">Danh mục</th>
                  <th className="py-3.5 min-w-[240px]">Lý do khen thưởng</th>
                  <th className="py-3.5">Ngày ghi nhận</th>
                  <th className="py-3.5 pr-4 text-right">Thu hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE3DD]">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                    <td className="py-3 pl-4">
                      <div>
                        <div className="font-bold text-[#5C453C]">{r.studentName}</div>
                        <div className="text-[11px] font-mono text-[#B68176]">{r.studentCode}</div>
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-extrabold text-xs border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>+{r.points}</span>
                      </span>
                    </td>

                    <td className="py-3">{getCategoryBadge(r.category)}</td>

                    <td className="py-3 text-[#5C453C] font-medium leading-relaxed">{r.reason}</td>

                    <td className="py-3 text-[#9A8A85] whitespace-nowrap">{r.date}</td>

                    <td className="py-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id, r.studentName)}
                        className="p-1.5 text-[#9A8A85] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Thu hồi điểm thưởng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
