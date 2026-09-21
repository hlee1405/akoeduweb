import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  Star,
  Sparkles,
  Info,
  ShieldCheck,
  Medal,
  HelpCircle,
  X
} from 'lucide-react';
import { ClassRoom, Student, StudentDiligenceSummary } from '../../../types';
import { store } from '../../../services/store';
import { DiligenceRankBadge } from '../../../components/common/Badge';
import { useToast } from '../../../context/ToastContext';

interface DiligenceTrackerProps {
  cls: ClassRoom;
  students: Student[];
  onBonusClick: (student: Student) => void;
}

export const DiligenceTracker: React.FC<DiligenceTrackerProps> = ({ cls, students, onBonusClick }) => {
  const { info } = useToast();
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>('all');

  const summaries: StudentDiligenceSummary[] = store.getClassDiligenceSummaries(cls.id);

  // Overall class metrics
  const avgScore = summaries.length > 0
    ? (summaries.reduce((sum, s) => sum + s.diligenceScore, 0) / summaries.length).toFixed(1)
    : '10.0';

  const avgAttendanceRate = summaries.length > 0
    ? Math.round(summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / summaries.length)
    : 100;

  const excellentCount = summaries.filter((s) => s.rankTier === 'Xuất sắc').length;
  const goodCount = summaries.filter((s) => s.rankTier === 'Tốt').length;
  const totalStarsAwarded = summaries.reduce((sum, s) => sum + s.bonusPoints, 0);

  const filteredSummaries = summaries.filter((s) => {
    const matchSearch =
      s.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRank = selectedRankFilter === 'all' || s.rankTier === selectedRankFilter;
    return matchSearch && matchRank;
  });

  const handleExportCSV = () => {
    const rows = [
      [
        'Xếp hạng',
        'Mã HS',
        'Họ và tên',
        'Có mặt',
        'Đi muộn',
        'Nghỉ có phép',
        'Vắng không phép',
        'Tỷ lệ chuyên cần (%)',
        'Sao thưởng',
        'Điểm chuyên cần (Thang 10)',
        'Xếp loại'
      ],
      ...summaries.map((s, idx) => [
        idx + 1,
        s.student.code,
        s.student.fullName,
        s.presentCount,
        s.lateCount,
        s.excusedCount,
        s.unexcusedCount,
        `${s.attendanceRate}%`,
        s.bonusPoints,
        s.diligenceScore,
        s.rankTier
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DiemChuyenCan_${cls.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('Đã xuất báo cáo chuyên cần', 'Tệp CSV đã được tải xuống.');
  };

  return (
    <div id="diligence-tracker" className="space-y-5 font-sans">
      {/* Top Overview KPI Banner - Lissenly Aesthetic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#5C453C] text-white rounded-2xl shadow-xs border border-[#4A3730]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#EFE3DD]">Điểm chuyên cần TB</span>
            <ShieldCheck className="w-4 h-4 text-[#F9EAEA]" />
          </div>
          <div className="text-2xl font-black font-mono mt-2">{avgScore} <span className="text-sm font-normal text-[#EFE3DD]">/ 10.0</span></div>
          <p className="text-[11px] text-[#EFE3DD]/80 mt-1">Toàn thể lớp {cls.name}</p>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9A8A85]">Tỷ lệ đi học trung bình</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black font-mono text-[#5C453C] mt-2">{avgAttendanceRate}%</div>
          <div className="w-full bg-[#F5F0EA] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${avgAttendanceRate}%` }} />
          </div>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9A8A85]">Gương mẫu & Xuất sắc</span>
            <Medal className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-[#B68176] mt-2">{excellentCount} <span className="text-xs font-normal text-[#9A8A85]">/ {students.length} em</span></div>
          <p className="text-[11px] text-[#9A8A85] mt-1">Điểm ≥ 9.0 & Đi học ≥ 95%</p>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9A8A85]">Tổng sao thưởng thi đua</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-[#5C453C] mt-2 flex items-center gap-1.5">
            <span>{totalStarsAwarded}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500 inline" />
          </div>
          <p className="text-[11px] text-[#9A8A85] mt-1">Đã khen thưởng toàn khóa</p>
        </div>
      </div>

      {/* Transparent Formula & Rule Notice Card */}
      <div className="p-4 bg-[#FAF4F0] rounded-2xl border border-[#EFE3DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#B68176] shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-[#5C453C]">Quy tắc tính Điểm chuyên cần (Thang 10): </span>
            <span className="text-[#5C453C]/90">
              Điểm gốc 10.0đ. Trừ: Đi muộn (-0.5đ), Có phép (-0.5đ), Vắng không phép (-2.0đ). Cộng: Sao thưởng thi đua (+0.25đ/sao, tối đa +2.0đ).
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowFormulaModal(true)}
          className="px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#F5F0EA] text-[#B68176] font-bold rounded-xl border border-[#EFE3DD] transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          Xem chi tiết thang điểm
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã HS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-[#EFE3DD] bg-[#F5F0EA] rounded-xl text-xs text-[#5C453C] placeholder-[#9A8A85] flex-1 min-w-[200px] max-w-xs outline-hidden focus:bg-[#FFFDF9] focus:ring-2 focus:ring-[#B68176]"
          />

          <select
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
            className="px-3.5 py-2 border border-[#EFE3DD] rounded-xl text-xs font-bold bg-[#F5F0EA] text-[#5C453C] outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả xếp loại</option>
            <option value="Xuất sắc">Xuất sắc</option>
            <option value="Tốt">Tốt</option>
            <option value="Khá">Khá</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Cần rèn luyện">Cần rèn luyện</option>
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F5F0EA] hover:bg-[#EFE3DD] text-[#5C453C] text-xs font-bold rounded-xl transition-colors border border-[#EFE3DD] cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-[#9A8A85]" />
          <span>Xuất Báo cáo Chuyên cần (CSV)</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#EFE3DD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F0EA] border-b border-[#EFE3DD] text-[#5C453C] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 pl-4 text-center w-14">Hạng</th>
                <th className="py-3.5 w-24">Mã HS</th>
                <th className="py-3.5 min-w-[180px]">Họ và tên</th>
                <th className="py-3.5 text-center min-w-[140px]">Chuyên cần buổi học</th>
                <th className="py-3.5 text-center min-w-[140px]">Tỷ lệ đi học</th>
                <th className="py-3.5 text-center min-w-[100px]">Sao thưởng</th>
                <th className="py-3.5 text-center min-w-[120px] bg-[#F9EAEA] font-extrabold text-[#B68176]">
                  Điểm chuyên cần
                </th>
                <th className="py-3.5 text-center min-w-[110px]">Xếp loại</th>
                <th className="py-3.5 pr-4 text-right min-w-[100px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE3DD]">
              {filteredSummaries.map((item, idx) => {
                const isTop1 = idx === 0 && item.diligenceScore >= 9.0;
                const isTop2 = idx === 1 && item.diligenceScore >= 8.5;
                const isTop3 = idx === 2 && item.diligenceScore >= 8.0;

                return (
                  <tr key={item.student.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                    {/* Rank Badge */}
                    <td className="py-3 pl-4 text-center">
                      {isTop1 ? (
                        <span className="w-7 h-7 mx-auto rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300 shadow-2xs">
                          🥇 1
                        </span>
                      ) : isTop2 ? (
                        <span className="w-7 h-7 mx-auto rounded-full bg-[#EFE3DD] text-[#5C453C] font-black text-xs flex items-center justify-center border border-[#E5D3CC]">
                          🥈 2
                        </span>
                      ) : isTop3 ? (
                        <span className="w-7 h-7 mx-auto rounded-full bg-[#F9EAEA] text-[#B68176] font-black text-xs flex items-center justify-center border border-[#F0D5D0]">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-semibold text-[#9A8A85]">{idx + 1}</span>
                      )}
                    </td>

                    {/* Student Code */}
                    <td className="py-3 font-mono font-bold text-[#B68176]">{item.student.code}</td>

                    {/* Student Info */}
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F9EAEA] text-[#B68176] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#F0D5D0]">
                          {item.student.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#5C453C]">{item.student.fullName}</div>
                          <div className="text-[11px] text-[#9A8A85]">{item.student.email || item.student.phone || 'Học sinh'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Attendance breakdown */}
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200" title="Có mặt">
                          {item.presentCount}✔
                        </span>
                        {item.lateCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200" title="Muộn">
                            {item.lateCount}⏰
                          </span>
                        )}
                        {item.excusedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#F5F0EA] text-[#5C453C] font-bold border border-[#EFE3DD]" title="Có phép">
                            {item.excusedCount}📝
                          </span>
                        )}
                        {item.unexcusedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#F9EAEA] text-[#B68176] font-bold border border-[#F0D5D0]" title="Vắng không phép">
                            {item.unexcusedCount}❌
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold font-mono text-[#5C453C] text-xs">{item.attendanceRate}%</span>
                        <div className="w-16 bg-[#F5F0EA] h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              item.attendanceRate >= 90
                                ? 'bg-emerald-600'
                                : item.attendanceRate >= 75
                                ? 'bg-[#5C453C]'
                                : 'bg-[#B68176]'
                            }`}
                            style={{ width: `${item.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Bonus Points */}
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>+{item.bonusPoints}</span>
                      </span>
                    </td>

                    {/* Final Diligence Score */}
                    <td className="py-3 text-center font-black font-mono text-base text-[#B68176] bg-[#F9EAEA]/50">
                      {item.diligenceScore.toFixed(1)}đ
                    </td>

                    {/* Rank Tier */}
                    <td className="py-3 text-center">
                      <DiligenceRankBadge rank={item.rankTier} />
                    </td>

                    {/* Action */}
                    <td className="py-3 pr-4 text-right">
                      <button
                        onClick={() => onBonusClick(item.student)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Thưởng sao thi đua"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>+Sao</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C453C]/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#EFE3DD] overflow-hidden">
            <div className="p-4 border-b border-[#EFE3DD] bg-[#F5F0EA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#B68176]" />
                <h3 className="font-extrabold text-[#5C453C] text-sm">Công thức tính Điểm chuyên cần (Thang 10)</h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-[#9A8A85] hover:text-[#5C453C] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#5C453C] leading-relaxed">
              <div className="p-3 bg-[#FAF4F0] rounded-xl border border-[#EFE3DD] font-mono text-[11px] text-[#B68176] font-bold">
                Điểm = 10.0 - (Muộn * 0.5) - (Có_phép * 0.5) - (Vắng_KP * 2.0) + Min(Sao * 0.25, 2.0)
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#5C453C]">1. Điểm khởi đầu chuẩn mực:</h4>
                <p className="text-[#9A8A85]">Mỗi học sinh bắt đầu với 10.0 điểm chuyên cần tuyệt đối.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#5C453C]">2. Quy định trừ điểm vi phạm:</h4>
                <ul className="list-disc list-inside space-y-1 text-[#9A8A85]">
                  <li><strong>Đi muộn:</strong> Trừ 0.5 điểm / lần</li>
                  <li><strong>Nghỉ có phép:</strong> Trừ 0.5 điểm / lần (sau 3 buổi miễn trừ)</li>
                  <li><strong>Vắng không phép:</strong> Trừ 2.0 điểm / lần</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#5C453C]">3. Cộng điểm thi đua & Khích lệ:</h4>
                <ul className="list-disc list-inside space-y-1 text-[#9A8A85]">
                  <li><strong>Mỗi Sao thưởng:</strong> Cộng +0.25 điểm vào điểm chuyên cần (tối đa +2.0đ).</li>
                  <li>Điểm chuyên cần cuối cùng được giới hạn trong khoảng [0.0; 10.0].</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#5C453C]">4. Xếp loại chuyên cần:</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
                    <strong>Xuất sắc:</strong> ≥ 9.0đ & Chuyên cần ≥ 95%
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                    <strong>Tốt:</strong> 8.0 - 8.9đ
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                    <strong>Khá:</strong> 6.5 - 7.9đ
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-900 rounded-lg border border-rose-200">
                    <strong>Cần rèn luyện:</strong> &lt; 5.0đ
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F5F0EA] border-t border-[#EFE3DD] flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-[#B68176] hover:bg-[#A37066] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
