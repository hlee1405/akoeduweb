import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Download,
  Share2,
  Settings
} from 'lucide-react';
import { Exam } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface ExamInfoModalProps {
  isOpen: boolean;
  exam: Exam | null;
  onClose: () => void;
  onAssign?: (exam: Exam) => void;
  onOpenLiveMonitor?: (exam: Exam) => void;
}

export const ExamInfoModal: React.FC<ExamInfoModalProps> = ({
  isOpen,
  exam,
  onClose,
  onAssign
}) => {
  const { success } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !exam) return null;

  const examUrl = `${window.location.origin}/exam/${exam.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(examUrl)}`;

  // Generate or format a 6-digit access code matching demo screenshot
  const rawCode = (exam as any).accessCode || exam.id.replace(/\D/g, '');
  const accessCode = rawCode.length >= 6 ? rawCode.slice(-6) : (rawCode.padStart(6, '0') || '698358');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(examUrl);
    setCopiedLink(true);
    success('Đã sao chép link', 'Đường dẫn vào làm bài thi đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopiedCode(true);
    success('Đã sao chép mã', `Mã tham gia ${accessCode} đã được sao chép.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrApiUrl;
    link.download = `QR-${exam.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Tải mã QR', 'Đang tải mã QR của đề thi về máy.');
  };

  const durationText = exam.durationMinutes > 0 && !exam.settings?.isUnlimitedTime
    ? `${exam.durationMinutes} phút`
    : 'Không giới hạn';

  return (
    <div
      id="exam-info-modal-backdrop"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans animate-in fade-in duration-200"
    >
      <div
        id="exam-info-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                Chia sẻ đề thi: {exam.title}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Thời gian: {durationText} • Thang điểm: {exam.maxScore || 10}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center">
          {/* Centered QR */}
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
            <img
              src={qrApiUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-lg object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Join Code */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MÃ THAM GIA:</span>
            <span className="px-3 py-1 bg-blue-50 text-blue-800 font-mono font-bold rounded-lg border border-blue-200 tracking-wider">
              {accessCode}
            </span>
            <button
              id="btn-copy-join-code"
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              title="Sao chép mã"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Direct link box */}
          <div className="mt-5 text-left">
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Đường dẫn trực tiếp:</label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                id="input-share-url"
                type="text"
                readOnly
                value={examUrl}
                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-hidden select-all"
              />
              <button
                id="btn-copy-share-url"
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <a
              id="link-open-student-preview"
              href={examUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở thử</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh QR</span>
            </button>

            {onAssign && (
              <button
                id="btn-exam-settings"
                type="button"
                onClick={() => {
                  onClose();
                  onAssign(exam);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt bài làm</span>
              </button>
            )}
          </div>

          <button
            id="btn-done-qr-modal"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
