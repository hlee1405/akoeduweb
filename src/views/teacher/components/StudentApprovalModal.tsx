import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  XCircle,
  Search,
  Edit,
  Check,
  QrCode,
  Clock,
  Phone,
  Mail,
  Calendar,
  User,
  Sparkles,
  AlertCircle,
  Save,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Filter,
  ChevronDown,
  ClipboardCheck
} from 'lucide-react';
import { Student, ClassRoom } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';

interface StudentApprovalModalProps {
  isOpen: boolean;
  classRoom?: ClassRoom; // If provided, filter by this class; if not, show all or let teacher select class
  onClose: () => void;
  onApproved?: (approvedStudents: Student[]) => void;
}

export const StudentApprovalModal: React.FC<StudentApprovalModalProps> = ({
  isOpen,
  classRoom,
  onClose,
  onApproved
}) => {
  const { themeConfig } = useTheme();
  const { success, info, error: showError } = useToast();

  const [classes, setClasses] = useState<ClassRoom[]>(store.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classRoom?.id || 'all');
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [showDetailEditModal, setShowDetailEditModal] = useState(false);
  const [studentForDetailEdit, setStudentForDetailEdit] = useState<Student | null>(null);
  const [showParentSection, setShowParentSection] = useState(false);

  // Load pending students from store
  const refreshPendingList = () => {
    setClasses(store.getClasses());
    const allPending = store.getPendingStudents();
    setPendingStudents(allPending);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPendingList();
      setSelectedClassId(classRoom?.id || 'all');
      setSelectedIds([]);
      setEditingStudentId(null);
    }
  }, [isOpen, classRoom]);

  // Subscribe to store changes
  useEffect(() => {
    const unsub = store.subscribe(() => {
      refreshPendingList();
    });
    return unsub;
  }, []);

  // Filtered pending students
  const filteredList = useMemo(() => {
    return pendingStudents.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSearch =
        !searchTerm.trim() ||
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchClass && matchSearch;
    });
  }, [pendingStudents, selectedClassId, searchTerm]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((s) => s.id));
    }
  };

  // Start inline editing
  const handleStartInlineEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditForm({
      fullName: student.fullName,
      code: student.code,
      classId: student.classId,
      phone: student.phone || '',
      email: student.email || '',
      birthDate: student.birthDate || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentRelationship: student.parentRelationship || 'Bố'
    });
  };

  const handleCancelInlineEdit = () => {
    setEditingStudentId(null);
    setEditForm({});
  };

  const handleSaveInlineEdit = (studentId: string) => {
    if (!editForm.fullName?.trim()) {
      showError('Họ tên không được trống', 'Vui lòng nhập họ và tên học sinh.');
      return;
    }

    const updated = store.updateStudent(studentId, {
      ...editForm,
      fullName: editForm.fullName.trim(),
      code: editForm.code?.trim() || `HS${Math.floor(100 + Math.random() * 900)}`
    });

    if (updated) {
      success('Đã cập nhật thông tin', `Đã lưu thông tin mới của học sinh ${updated.fullName}.`);
      setEditingStudentId(null);
      setEditForm({});
    }
  };

  // Open full detail modal
  const handleOpenDetailModal = (student: Student) => {
    setStudentForDetailEdit(student);
    setEditForm({ ...student });
    setShowParentSection(false);
    setShowDetailEditModal(true);
  };

  // Capitalize Name Helper (Chuẩn hóa viết hoa chữ cái đầu)
  const handleCapitalizeName = (currentName?: string) => {
    if (!currentName) return;
    const formatted = currentName
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setEditForm((prev) => ({ ...prev, fullName: formatted }));
  };

  // Single Approve
  const handleApproveSingle = (student: Student, overrideData?: Partial<Student>) => {
    const dataToSave = overrideData || (editingStudentId === student.id ? editForm : {});
    const approved = store.approveStudent(student.id, dataToSave);
    if (approved) {
      const clsName = classes.find((c) => c.id === approved.classId)?.name || 'Lớp học';
      success(
        'Đã duyệt học sinh vào lớp',
        `Học sinh ${approved.fullName} (Mã: ${approved.code}) đã vào lớp "${clsName}".`
      );
      if (editingStudentId === student.id) {
        setEditingStudentId(null);
        setEditForm({});
      }
      if (onApproved) {
        onApproved([approved]);
      }
    }
  };

  // Single Reject
  const handleRejectSingle = (student: Student) => {
    if (window.confirm(`Bạn có chắc muốn từ chối yêu cầu tham gia của "${student.fullName}"?`)) {
      store.rejectStudent(student.id);
      info('Đã từ chối yêu cầu', `Đã loại bỏ yêu cầu vào lớp của ${student.fullName}.`);
      if (editingStudentId === student.id) {
        setEditingStudentId(null);
      }
    }
  };

  // Batch Approve
  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const studentsToApprove = pendingStudents.filter((s) => selectedIds.includes(s.id));
    const approvedList = store.approveStudentsBatch(
      studentsToApprove.map((s) => ({
        id: s.id,
        updates: editingStudentId === s.id ? editForm : undefined
      }))
    );
    success(
      'Duyệt hàng loạt thành công',
      `Đã phê duyệt ${approvedList.length} học sinh vào lớp học.`
    );
    setSelectedIds([]);
    setEditingStudentId(null);
    if (onApproved) {
      onApproved(approvedList);
    }
  };

  // Batch Reject
  const handleBatchReject = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn từ chối ${selectedIds.length} yêu cầu tham gia đã chọn?`)) {
      store.rejectStudentsBatch(selectedIds);
      info('Đã từ chối hàng loạt', `Đã từ chối ${selectedIds.length} yêu cầu tham gia.`);
      setSelectedIds([]);
      setEditingStudentId(null);
    }
  };

  const getClassName = (cid: string) => {
    return classes.find((c) => c.id === cid)?.name || 'Lớp học';
  };

  return (
    <>
      <div
        id="student-approval-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans"
      >
        <div
          id="student-approval-modal-card"
          className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200"
        >
          {/* MODAL HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: themeConfig.colors.primary }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Duyệt học sinh tham gia lớp
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {filteredList.length} chờ duyệt
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {classRoom
                    ? `Lớp: ${classRoom.name} • Thầy cô có thể chỉnh sửa thông tin học sinh trực tiếp trước khi duyệt`
                    : 'Kiểm tra, chỉnh sửa thông tin và phê duyệt học sinh đăng ký tham gia lớp'}
                </p>
              </div>
            </div>

            <button
              id="btn-close-approval-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TOOLBAR: Filter, Search & Bulk Actions */}
          <div className="p-4 sm:px-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Class Selector if not locked */}
              {!classRoom && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
                  >
                    <option value="all">Tất cả lớp ({pendingStudents.length})</option>
                    {classes.map((c) => {
                      const count = pendingStudents.filter((s) => s.classId === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 max-w-sm text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent w-full text-slate-800 placeholder-slate-400 outline-hidden"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Action Buttons */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-slate-500">
                  Đã chọn <strong className="text-slate-900">{selectedIds.length}</strong>:
                </span>
                <button
                  type="button"
                  onClick={handleBatchApprove}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <span>Duyệt tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={handleBatchReject}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <span>Từ chối</span>
                </button>
              </div>
            )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {filteredList.length === 0 ? (
              /* EMPTY STATE */
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100 shadow-xs">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Không có học sinh nào đang chờ duyệt
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Khi học sinh quét mã QR hoặc truy cập liên kết vào lớp, yêu cầu tham gia sẽ hiển thị tại đây để thầy cô kiểm tra và chỉnh sửa thông tin trước khi duyệt.
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              /* TABLE OF PENDING STUDENTS */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[880px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 pl-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                          onChange={handleSelectAll}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-3 min-w-[200px]">Học sinh</th>
                      <th className="py-3.5 px-3 min-w-[190px]">Lớp yêu cầu</th>
                      <th className="py-3.5 px-3 min-w-[220px]">Liên hệ & Phụ huynh</th>
                      <th className="py-3.5 px-3 min-w-[120px] text-center whitespace-nowrap">Thời gian</th>
                      <th className="py-3.5 pr-5 text-right w-36 whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((st) => {
                      const isSelected = selectedIds.includes(st.id);
                      const isInlineEditing = editingStudentId === st.id;

                      return (
                        <tr
                          key={st.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-blue-50/40'
                              : isInlineEditing
                              ? 'bg-amber-50/40'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 pl-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(st.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Full Name (No student code) */}
                          <td className="py-3.5 px-3">
                            {isInlineEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editForm.fullName || ''}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                                  }
                                  className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-blue-400 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                  placeholder="Họ và tên học sinh"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCapitalizeName(editForm.fullName)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded-md shrink-0 cursor-pointer"
                                  title="Tự động chuẩn hóa viết hoa chữ cái đầu"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                  {st.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                                    {st.fullName}
                                  </div>
                                  {st.email ? (
                                    <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate max-w-[180px]">
                                      {st.email}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Class (Normal Text, No Tag) */}
                          <td className="py-3.5 px-3">
                            {isInlineEditing ? (
                              <select
                                value={editForm.classId || st.classId}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, classId: e.target.value }))
                                }
                                className="w-full px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-blue-400 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                              >
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="font-semibold text-slate-800 text-xs leading-relaxed">
                                {getClassName(st.classId)}
                              </div>
                            )}
                          </td>

                          {/* Contact & Parent Info (Merged) */}
                          <td className="py-3.5 px-3">
                            {isInlineEditing ? (
                              <div className="space-y-1.5 min-w-[220px]">
                                <input
                                  type="tel"
                                  value={editForm.phone || ''}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                                  }
                                  placeholder="SĐT học sinh"
                                  className="w-full px-2 py-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-hidden"
                                />
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editForm.parentName || ''}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({ ...prev, parentName: e.target.value }))
                                    }
                                    placeholder="Tên PH"
                                    className="w-1/2 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-hidden"
                                  />
                                  <input
                                    type="tel"
                                    value={editForm.parentPhone || ''}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({ ...prev, parentPhone: e.target.value }))
                                    }
                                    placeholder="SĐT PH"
                                    className="w-1/2 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-hidden"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1 text-xs leading-relaxed">
                                {/* Student Phone / Email */}
                                {st.phone ? (
                                  <div className="font-mono text-slate-800 font-semibold text-xs">
                                    {st.phone}
                                  </div>
                                ) : st.email ? (
                                  <div className="text-slate-600 text-xs">{st.email}</div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Chưa có SĐT</span>
                                )}

                                {/* Parent Info */}
                                {(st.parentName || st.parentPhone) && (
                                  <div className="text-xs flex items-center gap-1 flex-wrap">
                                    <span className="text-blue-600 font-bold">PH:</span>
                                    <span className="font-semibold text-blue-600">
                                      {st.parentName || 'Phụ huynh'} {st.parentRelationship ? `(${st.parentRelationship})` : ''}
                                    </span>
                                    {st.parentPhone && (
                                      <>
                                        <span className="text-slate-400">·</span>
                                        <span className="font-mono text-slate-700 font-medium">{st.parentPhone}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Time Only (Removed Source & QR Badge) */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="text-xs text-slate-600 font-medium font-mono">
                              {st.requestedAt
                                ? new Date(st.requestedAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit'
                                  })
                                : 'Vừa xong'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-5 text-right whitespace-nowrap">
                            {isInlineEditing ? (
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineEdit(st.id)}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                                  title="Lưu thông tin đã sửa"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Lưu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveSingle(st, editForm)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                                  title="Lưu & Duyệt ngay"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lưu & Duyệt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInlineEdit}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 cursor-pointer whitespace-nowrap"
                                  title="Hủy sửa"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetailModal(st)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                                  title="Kiểm tra thông tin học sinh và duyệt"
                                >
                                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                                  <span>Kiểm tra</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              Tổng số: <strong className="text-slate-800">{filteredList.length}</strong> học sinh đang chờ phê duyệt
            </div>

            <div className="flex items-center gap-2">
              {filteredList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds(filteredList.map((s) => s.id));
                    setTimeout(() => {
                      const all = store.approveStudentsBatch(
                        filteredList.map((s) => ({ id: s.id }))
                      );
                      success('Đã duyệt tất cả', `Đã duyệt toàn bộ ${all.length} học sinh vào lớp học.`);
                      if (onApproved) onApproved(all);
                    }, 50);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <span>Duyệt tất cả</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED STUDENT EDIT & INSPECTION MODAL */}
      {showDetailEditModal && studentForDetailEdit && (
        <div
          id="detail-edit-modal-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Kiểm tra thông tin học sinh
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editForm.fullName?.trim()) {
                  showError('Lỗi', 'Họ tên học sinh không được để trống.');
                  return;
                }
                handleApproveSingle(studentForDetailEdit, editForm);
                setShowDetailEditModal(false);
              }}
              className="p-5 space-y-4 text-xs overflow-y-auto"
            >
              <div className="space-y-3">
                {/* Full Name with Auto Capitalize button */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên học sinh *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={editForm.fullName || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleCapitalizeName(editForm.fullName)}
                      className="px-2.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 font-semibold text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                      title="Chuẩn hóa viết hoa"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Viết hoa chuẩn</span>
                    </button>
                  </div>
                </div>

                {/* Class (Read-only) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp học
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 select-text">
                    {classes.find((c) => c.id === (studentForDetailEdit.classId))?.name || studentForDetailEdit.className || 'Chưa phân lớp'}
                  </div>
                </div>

                {/* Phone & Email (Read-only) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số điện thoại học sinh
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 select-text">
                      {studentForDetailEdit.phone || <span className="text-slate-400 italic">Chưa có</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email học sinh
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 truncate select-text">
                      {studentForDetailEdit.email || <span className="text-slate-400 italic">Chưa có</span>}
                    </div>
                  </div>
                </div>

                {/* Parent Information (Collapsible, Read-only) */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowParentSection(!showParentSection)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        Thông tin Phụ huynh
                      </span>
                      {(studentForDetailEdit.parentName || studentForDetailEdit.parentPhone) && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-md font-bold">
                          Đã điền
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <span>{showParentSection ? 'Thu gọn' : 'Xem thêm'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showParentSection ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {showParentSection && (
                    <div className="mt-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-700 block mb-1">Họ tên phụ huynh</label>
                          <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 select-text">
                            {studentForDetailEdit.parentName || <span className="text-slate-400 italic">Chưa có</span>}
                          </div>
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Mối quan hệ</label>
                          <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 select-text">
                            {studentForDetailEdit.parentRelationship || 'Bố'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">SĐT phụ huynh (Zalo)</label>
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 select-text">
                          {studentForDetailEdit.parentPhone || <span className="text-slate-400 italic">Chưa có</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons: Lưu và duyệt before Từ chối, centered */}
              <div className="pt-3.5 border-t border-slate-200 flex items-center justify-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95 min-w-[120px]"
                >
                  <span>Lưu và duyệt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (studentForDetailEdit) {
                      handleRejectSingle(studentForDetailEdit);
                      setShowDetailEditModal(false);
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer active:scale-95 shadow-xs min-w-[100px]"
                >
                  <span>Từ chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
