import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Users,
  Check
} from 'lucide-react';
import { Student } from '../../../types';
import { store } from '../../../services/store';
import { useToast } from '../../../context/ToastContext';

interface StudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSuccess?: (count: number) => void;
}

interface ParsedStudentRow {
  code: string;
  fullName: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  parentRelationship?: string;
  isValid: boolean;
  errorMessage?: string;
}

export const StudentExcelImportModal: React.FC<StudentExcelImportModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clean Vietnamese string helper for key matching
  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Map header name to field
  const matchField = (header: string): string | null => {
    const norm = normalizeHeader(header);
    if (/^(hoten|hovaten|tenhocsinh|ten|fullname|name|studentname)$/.test(norm)) return 'fullName';
    if (/^(mahs|mahocsinh|code|masv|id|studentcode)$/.test(norm)) return 'code';
    if (/^(sdt|sodienthoai|dienthoai|phone|tel|mobile)$/.test(norm)) return 'phone';
    if (/^(email|mail|thudientu)$/.test(norm)) return 'email';
    if (/^(ngaysinh|dob|birthdate|birthday)$/.test(norm)) return 'birthDate';
    if (/^(hotenphuhuynh|tenphuhuynh|phuhuynh|ph|parentname|parent)$/.test(norm)) return 'parentName';
    if (/^(sdtphuhuynh|sdtph|sdtbome|parentphone)$/.test(norm)) return 'parentPhone';
    if (/^(moiquanhe|quanhe|relationship)$/.test(norm)) return 'parentRelationship';
    return null;
  };

  const processWorkbookData = (rows: any[][]) => {
    if (!rows || rows.length < 2) {
      error('File trống', 'File không chứa đủ dữ liệu hoặc không có dòng tiêu đề.');
      setParsedRows([]);
      return;
    }

    // Find header row (usually first non-empty row)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const rowStr = rows[i].map((c) => String(c || '')).join(' ');
      if (
        /họ|tên|name|sđt|phone|email|mã/i.test(rowStr) ||
        normalizeHeader(rowStr).includes('hoten') ||
        normalizeHeader(rowStr).includes('ten')
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = rows[headerRowIdx].map((c) => String(c || '').trim());
    const headerMapping: { [colIdx: number]: string } = {};

    headers.forEach((h, idx) => {
      const field = matchField(h);
      if (field) {
        headerMapping[idx] = field;
      }
    });

    // If no mapped header found, default by column position (0: code, 1: name, 2: phone, 3: email)
    const hasNameMapping = Object.values(headerMapping).includes('fullName');
    const dataRows = rows.slice(headerRowIdx + 1);

    const parsed: ParsedStudentRow[] = [];

    dataRows.forEach((row, rIdx) => {
      // Skip completely empty rows
      if (!row || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
        return;
      }

      let code = '';
      let fullName = '';
      let phone = '';
      let email = '';
      let birthDate = '';
      let parentName = '';
      let parentPhone = '';
      let parentRelationship = 'Bố';

      if (hasNameMapping) {
        row.forEach((cellVal, colIdx) => {
          const field = headerMapping[colIdx];
          const val = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
          if (!field || !val) return;

          if (field === 'code') code = val;
          else if (field === 'fullName') fullName = val;
          else if (field === 'phone') phone = val;
          else if (field === 'email') email = val;
          else if (field === 'birthDate') birthDate = val;
          else if (field === 'parentName') parentName = val;
          else if (field === 'parentPhone') parentPhone = val;
          else if (field === 'parentRelationship') parentRelationship = val;
        });
      } else {
        // Fallback positional
        const raw0 = String(row[0] || '').trim();
        const raw1 = String(row[1] || '').trim();
        const raw2 = String(row[2] || '').trim();
        const raw3 = String(row[3] || '').trim();
        const raw4 = String(row[4] || '').trim();
        const raw5 = String(row[5] || '').trim();

        // Check if col 0 looks like a code (e.g. HS01, 1, 2) and col 1 is a name
        if (raw1 && isNaN(Number(raw1))) {
          code = raw0;
          fullName = raw1;
          phone = raw2;
          email = raw3;
          parentName = raw4;
          parentPhone = raw5;
        } else {
          fullName = raw0;
          phone = raw1;
          email = raw2;
          parentName = raw3;
          parentPhone = raw4;
        }
      }

      if (!code) {
        code = `HS${Math.floor(900 + Math.random() * 99)}`;
      }

      const isValid = Boolean(fullName && fullName.length >= 2);
      const errorMessage = !fullName
        ? 'Thiếu họ tên học sinh'
        : fullName.length < 2
        ? 'Họ tên quá ngắn'
        : undefined;

      parsed.push({
        code,
        fullName,
        phone: phone || undefined,
        email: email || undefined,
        birthDate: birthDate || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        parentRelationship: parentRelationship || 'Bố',
        isValid,
        errorMessage
      });
    });

    setParsedRows(parsed);
    if (parsed.length === 0) {
      error('Không tìm thấy dữ liệu', 'Không có dòng dữ liệu học sinh nào được tìm thấy trong file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseSelectedFile(selectedFile);
    }
  };

  const parseSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        processWorkbookData(rows);
      } catch (err) {
        console.error('Error parsing excel file:', err);
        error('Lỗi đọc file', 'Không thể đọc nội dung file. Vui lòng đảm bảo file đúng định dạng .xlsx, .xls hoặc .csv');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      error('Lỗi đọc file', 'Có lỗi xảy ra trong quá trình đọc file.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'Họ và tên': 'Duy Anh',
        'Số điện thoại': '0987873058',
        'Email': 'duyanh@gmail.com',
        'Họ tên phụ huynh': 'Nguyễn Văn Hùng',
        'Mối quan hệ': 'Bố',
        'SĐT phụ huynh': '0912888999'
      },
      {
        'STT': 2,
        'Họ và tên': 'Trần Bảo Nam',
        'Số điện thoại': '0981112201',
        'Email': 'baonam.tran@gmail.com',
        'Họ tên phụ huynh': 'Lê Thị Thu',
        'Mối quan hệ': 'Mẹ',
        'SĐT phụ huynh': '0983123456'
      },
      {
        'STT': 3,
        'Họ và tên': 'Lê Quỳnh Anh',
        'Số điện thoại': '0981112202',
        'Email': 'quynhanh.le@gmail.com',
        'Họ tên phụ huynh': 'Lê Tuấn Dũng',
        'Mối quan hệ': 'Bố',
        'SĐT phụ huynh': '0975666777'
      },
      {
        'STT': 4,
        'Họ và tên': 'Nguyễn Đăng Khoa',
        'Số điện thoại': '0981112203',
        'Email': 'dangkhoa.ng@gmail.com',
        'Họ tên phụ huynh': '',
        'Mối quan hệ': '',
        'SĐT phụ huynh': ''
      },
      {
        'STT': 5,
        'Họ và tên': 'Phạm Minh Tuấn',
        'Số điện thoại': '0981112204',
        'Email': 'minhtuan.pham@gmail.com',
        'Họ tên phụ huynh': '',
        'Mối quan hệ': '',
        'SĐT phụ huynh': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh');
    XLSX.writeFile(workbook, 'Mau_nhap_hoc_sinh_AKO.xlsx');
    success('Đã tải mẫu Excel', 'Mẫu danh sách học sinh chuẩn (.xlsx) đã được tải xuống máy.');
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImportSubmit = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      error('Không thể nhập', 'Không có học sinh hợp lệ nào để thêm vào lớp.');
      return;
    }

    const studentsToCreate = validRows.map((r) => ({
      code: r.code,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      birthDate: r.birthDate,
      parentName: r.parentName,
      parentPhone: r.parentPhone,
      parentRelationship: r.parentRelationship,
      classId,
      status: 'active' as const
    }));

    store.addStudentsBatch(studentsToCreate);
    success('Nhập thành công', `Đã thêm ${validRows.length} học sinh vào lớp học.`);
    if (onSuccess) {
      onSuccess(validRows.length);
    }
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nhập danh sách học sinh từ file Excel
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ định dạng file <strong className="text-slate-700">.xlsx, .xls, .csv</strong> {className ? `vào lớp ${className}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Action Bar / Download template */}
          <div className="flex items-center justify-end gap-2 pb-1">
            {/* Template Download Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu (.xlsx)</span>
            </button>
          </div>

          {/* File Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Upload className="w-6 h-6" />
              </div>
              {file ? (
                <div>
                  <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB &bull; Nhấp để chọn file khác
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Kéo thả file Excel / CSV vào đây, hoặc{' '}
                    <span className="text-emerald-600 underline">chọn từ máy tính</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Hỗ trợ cột: Họ và tên, SĐT, Email, Họ tên phụ huynh, SĐT phụ huynh
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Xem trước ({parsedRows.length} học sinh):
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800">
                      {invalidCount} lỗi
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFile(null);
                  }}
                  className="text-slate-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa kết quả
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-3 w-10">STT</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">SĐT</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Phụ huynh</th>
                      <th className="py-2 px-3 text-right">Trạng thái</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.isValid ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.fullName || (
                            <span className="text-red-500 italic">Chưa có tên</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.phone || '-'}</td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">
                          {row.email || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">
                          {row.parentName ? (
                            <span>
                              {row.parentName} {row.parentPhone ? `(${row.parentPhone})` : ''}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" /> {row.errorMessage || 'Lỗi'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-200 cursor-pointer"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleImportSubmit}
              className={`flex items-center gap-1.5 px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all ${
                validCount > 0 && !isProcessing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {validCount > 0
                  ? `Nhập ${validCount} học sinh vào lớp`
                  : 'Chưa có học sinh hợp lệ'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
