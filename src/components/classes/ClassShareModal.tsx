import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  ArrowRight
} from 'lucide-react';
import { ClassRoom } from '../../types';
import { store } from '../../services/store';
import { useToast } from '../../context/ToastContext';

interface ClassShareModalProps {
  isOpen: boolean;
  classRoom: ClassRoom;
  onClose: () => void;
  isNewlyCreated?: boolean;
  onNavigateToClass?: () => void;
}

export const ClassShareModal: React.FC<ClassShareModalProps> = ({
  isOpen,
  classRoom,
  onClose,
  isNewlyCreated = false,
  onNavigateToClass
}) => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const teacher = store.getTeacher();
  const joinUrl = `${window.location.origin}/classes/join?code=${classRoom.joinCode}`;

  // Generate QR Data URL using local QRCode library
  useEffect(() => {
    if (!isOpen || !classRoom) return;

    let isMounted = true;
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        if (isMounted) {
          setQrDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&margin=4`
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, joinUrl, classRoom]);

  if (!isOpen || !classRoom) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classRoom.joinCode);
    setCopiedCode(true);
    success('Đã sao chép mã lớp', classRoom.joinCode);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    success('Đã sao chép link vào lớp', 'Đã lưu đường dẫn vào bộ nhớ tạm');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${classRoom.joinCode}_${classRoom.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải ảnh mã QR', 'Ảnh mã QR đã được lưu về máy');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Thẻ tham gia lớp - ${classRoom.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              padding: 24px;
              color: #0f172a;
              text-align: center;
            }
            .card {
              border: 2px dashed #cbd5e1;
              border-radius: 24px;
              padding: 40px 32px;
              max-width: 440px;
              width: 100%;
              box-sizing: border-box;
            }
            h1 { font-size: 26px; margin: 0 0 6px; color: #0f172a; }
            .meta { font-size: 14px; color: #64748b; margin-bottom: 24px; }
            .qr-img { width: 220px; height: 220px; margin: 0 auto; display: block; border-radius: 12px; }
            .code-box {
              margin-top: 24px;
              background: #f8fafc;
              padding: 12px 24px;
              border-radius: 14px;
              display: inline-block;
              border: 1px solid #e2e8f0;
            }
            .code-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
            .code-value { font-size: 26px; font-weight: 800; color: #2563eb; font-family: monospace; letter-spacing: 2px; }
            .guide { font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${classRoom.name}</h1>
            <div class="meta">GV: ${teacher.fullName} • ${classRoom.subject || ''} ${classRoom.grade ? `(${classRoom.grade})` : ''}</div>
            <img src="${qrDataUrl}" class="qr-img" />
            <div class="code-box">
              <div class="code-label">Mã vào lớp</div>
              <div class="code-value">${classRoom.joinCode}</div>
            </div>
            <div class="guide">
              Quét mã QR bằng Camera điện thoại hoặc Zalo để tham gia lớp học và làm bài kiểm tra trực tuyến.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGoToClass = () => {
    onClose();
    if (onNavigateToClass) {
      onNavigateToClass();
    } else {
      navigate(`/teacher/classes/${classRoom.id}`);
    }
  };

  return (
    <div
      id="class-share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="class-share-modal-content"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative"
      >
        {/* Close Button */}
        <button
          id="btn-close-class-share-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-6 pb-1 px-6 text-center">
          {/* Hero Class Name */}
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {classRoom.name}
          </h3>

          {/* Metadata */}
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap text-xs">
            {classRoom.subject && (
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                {classRoom.subject}
              </span>
            )}
            <span className="text-slate-500 font-medium">
              GV: {teacher.fullName}
            </span>
          </div>

          {classRoom.description && (
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 mt-2.5 text-left line-clamp-2">
              {classRoom.description}
            </p>
          )}
        </div>

        {/* Modal Body - QR & Join Code */}
        <div className="px-6 py-3 space-y-3.5">
          {/* QR Code Container */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${classRoom.name}`}
                  className="w-44 h-44 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-2 font-medium">
              Quét bằng Camera điện thoại hoặc Zalo
            </span>
          </div>

          {/* Join Code Display */}
          <div className="bg-blue-50/70 border border-blue-150 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Mã vào lớp nhanh
              </span>
              <span className="text-xl font-mono font-extrabold text-blue-700 tracking-wider">
                {classRoom.joinCode}
              </span>
            </div>
            <button
              id="btn-copy-join-code"
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Đã chép' : 'Sao chép mã'}</span>
            </button>
          </div>

          {/* Direct Link Row */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 px-2.5 text-xs text-slate-600 bg-transparent font-mono outline-hidden select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedLink ? 'Đã chép link' : 'Chép link'}
            </button>
          </div>

          {/* Extra Actions: Print & Download */}
          <div className="flex items-center justify-center gap-5 text-xs text-slate-500 pt-0.5">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh QR</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In thẻ dán lớp</span>
            </button>
          </div>
        </div>

        {/* Modal Footer - Single full-width primary action */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoToClass}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Vào quản lý lớp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
