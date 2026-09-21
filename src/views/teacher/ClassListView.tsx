import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  QrCode,
  Copy,
  BookOpen,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Download,
  LayoutGrid,
  List as ListIcon,
  FileText,
  TrendingUp,
  Send,
  Sparkles,
  Filter,
  Check
} from 'lucide-react';
import { store } from '../../services/store';
import { ClassRoom, Student, Exam, Submission } from '../../types';
import { QRModal } from '../../components/common/QRModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const ClassListView: React.FC = () => {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const { success, info } = useToast();
  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [students, setStudents] = useState<Student[]>(store.getStudents());
  const [exams, setExams] = useState<Exam[]>(store.getExams());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [copiedClassId, setCopiedClassId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [qrClass, setQrClass] = useState<ClassRoom | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [assignExamClass, setAssignExamClass] = useState<ClassRoom | null>(null);
  const [selectedExamIdsToAssign, setSelectedExamIdsToAssign] = useState<string[]>([]);

  // Create / Edit Class Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  useEffect(() => {
    const handleStoreChange = () => {
      setClasses(store.getClasses());
      setStudents(store.getStudents());
      setExams(store.getExams());
      setSubmissions(store.getSubmissions());
    };
    const unsub = store.subscribe(handleStoreChange);
    return unsub;
  }, []);

  const openCreateModal = (cls?: ClassRoom) => {
    setEditingClass(cls || null);
    setShowCreateModal(true);
  };

  const handleToggleArchive = (cls: ClassRoom) => {
    const nextStatus = cls.status === 'active' ? 'archived' : 'active';
    store.updateClass(cls.id, { status: nextStatus });
    success(
      nextStatus === 'active' ? 'Khôi phục lớp học' : 'Lưu trữ lớp học',
      `Lớp ${cls.name} hiện ở trạng thái ${nextStatus === 'active' ? 'Đang học' : 'Lưu trữ'}.`
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteClassId) {
      const cls = classes.find((c) => c.id === deleteClassId);
      store.deleteClass(deleteClassId);
      success('Đã xóa lớp học', `Lớp ${cls?.name || ''} và danh sách học sinh đã được xóa.`);
      setDeleteClassId(null);
    }
  };

  const handleOpenAssignModal = (cls: ClassRoom) => {
    setAssignExamClass(cls);
    const alreadyAssigned = exams
      .filter((e) => e.assignedClassIds.includes(cls.id))
      .map((e) => e.id);
    setSelectedExamIdsToAssign(alreadyAssigned);
  };

  const handleSaveAssignedExams = () => {
    if (!assignExamClass) return;
    exams.forEach((exam) => {
      const isSelected = selectedExamIdsToAssign.includes(exam.id);
      const isCurrentlyAssigned = exam.assignedClassIds.includes(assignExamClass.id);

      if (isSelected && !isCurrentlyAssigned) {
        store.updateExam(exam.id, {
          assignedClassIds: [...exam.assignedClassIds, assignExamClass.id]
        });
      } else if (!isSelected && isCurrentlyAssigned) {
        store.updateExam(exam.id, {
          assignedClassIds: exam.assignedClassIds.filter((id) => id !== assignExamClass.id)
        });
      }
    });

    success('Giao đề thi thành công', `Đã cập nhật danh sách đề thi phân công cho lớp ${assignExamClass.name}`);
    setAssignExamClass(null);
  };

  const handleExportClassesCSV = () => {
    const header = ['Mã lớp', 'Tên lớp học', 'Môn học', 'Khối', 'Năm học', 'Số học sinh', 'Điểm TB', 'Trạng thái'];
    const rows = filteredClasses.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id);
      const classSubs = submissions.filter((s) => s.studentClassId === cls.id);
      const avg = classSubs.length > 0
        ? (classSubs.reduce((sum, s) => sum + s.totalScore, 0) / classSubs.length).toFixed(1)
        : '0.0';
      return [
        cls.joinCode,
        `"${cls.name.replace(/"/g, '""')}"`,
        `"${cls.subject}"`,
        cls.grade,
        cls.academicYear,
        classStudents.length,
        avg,
        cls.status === 'active' ? 'Đang học' : 'Lưu trữ'
      ];
    });

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_sach_lop_hoc_Ako_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('Đã xuất file CSV', 'Tải danh sách các lớp thành công');
  };

  // Filtered classes logic
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.joinCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = selectedGrade === 'all' || c.grade === selectedGrade;
      const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
      return matchSearch && matchGrade && matchStatus;
    });
  }, [classes, searchTerm, selectedGrade, selectedStatus]);

  const gradesList = ['Khối 6', 'Khối 7', 'Khối 8', 'Khối 9', 'Khối 10', 'Khối 11', 'Khối 12'];

  const getClassBadgeStyle = (grade?: string, name?: string) => {
    const combined = `${grade || ''} ${name || ''}`.toLowerCase();
    if (combined.includes('9')) {
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', dot: 'bg-blue-500' };
    }
    if (combined.includes('8')) {
      return { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', dot: 'bg-sky-500' };
    }
    if (combined.includes('10')) {
      return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-500' };
    }
    if (combined.includes('11')) {
      return { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', dot: 'bg-teal-500' };
    }
    if (combined.includes('12')) {
      return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', dot: 'bg-purple-500' };
    }
    return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
  };

  return (
    <div id="class-list-view" className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs"
              style={{
                backgroundColor: `${themeConfig.colors.primary}12`,
                borderColor: `${themeConfig.colors.primary}25`,
                color: themeConfig.colors.primary,
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <span>Quản lý Lớp học</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý sĩ số, theo dõi ca học, phân phối đề thi và đánh giá kết quả học sinh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-classes"
            onClick={handleExportClassesCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Xuất CSV</span>
          </button>

          <button
            id="btn-create-new-class"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-98"
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lớp mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 flex-1 max-w-md focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, môn học, mã tham gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer">
              Xóa
            </button>
          )}
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3.5 py-2 rounded-xl focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="archived">Lưu trữ</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'}`}
              title="Xem dạng thẻ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'}`}
              title="Xem dạng bảng"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Classes Grid or Table */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all'
              ? 'Không có lớp học nào khớp với bộ lọc hiện tại. Vui lòng thử tìm kiếm khác.'
              : 'Bạn chưa tạo lớp học nào. Hãy bắt đầu bằng cách tạo lớp đầu tiên!'}
          </p>
          <button
            onClick={() => openCreateModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90"
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lớp mới ngay</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const badge = getClassBadgeStyle(cls.grade, cls.name);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group hover:-translate-y-0.5 duration-200"
              >
                <div className="p-5 pb-4">
                  {/* Header Row: Avatar, Info & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-2xs shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                        {cls.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors truncate">
                          <Link to={`/teacher/classes/${cls.id}`} title={cls.name}>{cls.name}</Link>
                        </h3>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0 inline-flex items-center gap-1.5 ${
                      cls.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {cls.status === 'active' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span>{cls.status === 'active' ? 'Đang học' : 'Lưu trữ'}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1.5 leading-relaxed font-normal">
                    {cls.description || 'Chưa có mô tả'}
                  </p>

                  {/* Join code & QR trigger */}
                  <div className="mt-3 flex items-center justify-between px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-[11px] font-medium text-slate-400">Mã lớp:</span>
                      <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs select-all">
                        {cls.joinCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(cls.joinCode);
                          setCopiedClassId(cls.id);
                          setTimeout(() => setCopiedClassId(null), 1800);
                          success('Đã sao chép mã lớp', `Mã: ${cls.joinCode}`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-lg transition-colors cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedClassId === cls.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setQrClass(cls)}
                        className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xem mã QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCreateModal(cls)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200/80 hover:shadow-2xs transition-all cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(cls)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-200/80 hover:shadow-2xs transition-all cursor-pointer"
                      title={cls.status === 'active' ? 'Lưu trữ lớp' : 'Khôi phục lớp'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteClassId(cls.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200/80 hover:shadow-2xs transition-all cursor-pointer"
                      title="Xóa lớp học"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    to={`/teacher/classes/${cls.id}`}
                    className="flex-1 inline-flex items-center justify-center py-2 px-3 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
                    style={{ backgroundColor: themeConfig.colors.primary }}
                  >
                    <span>Chi tiết</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tên lớp học</th>
                  <th className="py-3.5 px-3">Mô tả</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Mã tham gia</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          to={`/teacher/classes/${cls.id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors block"
                        >
                          {cls.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-500 font-normal max-w-[200px] truncate" title={cls.description}>
                        {cls.description || 'Chưa có mô tả'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span>{cls.joinCode}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cls.joinCode);
                              success('Đã sao chép', cls.joinCode);
                            }}
                            className="text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Sao chép"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap ${
                          cls.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {cls.status === 'active' ? 'Đang học' : 'Lưu trữ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setQrClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openCreateModal(cls)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(cls)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={cls.status === 'active' ? 'Lưu trữ lớp' : 'Khôi phục lớp'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteClassId(cls.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa lớp học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/teacher/classes/${cls.id}`}
                            className="ml-1 inline-flex items-center justify-center px-3.5 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                            style={{ backgroundColor: themeConfig.colors.primary }}
                          >
                            <span>Chi tiết</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Class Modal */}
      <ClassFormModal
        isOpen={showCreateModal}
        editingClass={editingClass}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClass(null);
        }}
      />

      {/* Quick Assign Exam Modal */}
      {assignExamClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                Giao đề thi cho lớp {assignExamClass.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Chọn các đề thi muốn phân công cho học sinh lớp này làm bài
              </p>
            </div>

            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              {exams.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Chưa có đề thi nào trong hệ thống.</p>
              ) : (
                exams.map((exam) => {
                  const isChecked = selectedExamIdsToAssign.includes(exam.id);
                  return (
                    <label
                      key={exam.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isChecked ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExamIdsToAssign([...selectedExamIdsToAssign, exam.id]);
                          } else {
                            setSelectedExamIdsToAssign(selectedExamIdsToAssign.filter((id) => id !== exam.id));
                          }
                        }}
                        className="mt-0.5 rounded-sm text-[#3B82F6] focus:ring-[#3B82F6]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{exam.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {exam.subject} • {exam.durationMinutes} phút • {exam.questions.length} câu
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setAssignExamClass(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedExams}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Lưu phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrClass && (
        <QRModal
          isOpen={Boolean(qrClass)}
          title={`Mã QR Lớp ${qrClass.name}`}
          subtitle={`Học sinh quét mã QR bằng camera điện thoại để tự động tham gia lớp`}
          url={`/classes/join?code=${qrClass.joinCode}`}
          code={qrClass.joinCode}
          onClose={() => setQrClass(null)}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteClassId)}
        title="Xác nhận xóa lớp học"
        message="Thao tác này sẽ xóa lớp học và danh sách học sinh thuộc lớp. Dữ liệu đề thi đã giao sẽ được chuyển sang dạng tự do."
        confirmText="Xóa lớp"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteClassId(null)}
      />
    </div>
  );
};
