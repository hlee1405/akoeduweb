import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Download,
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

          {/* Metadata (Bỏ thẻ môn học theo yêu cầu, giữ lại tên GV) */}
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap text-xs">
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

        {/* Modal Body - QR & Join Code & Link */}
        <div className="px-6 py-4 space-y-3.5">
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

            {/* Nút tải ảnh QR ngay dưới ảnh QR */}
            <button
              id="btn-download-qr"
              type="button"
              onClick={handleDownloadQR}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Tải ảnh QR</span>
            </button>

            <span className="text-[11px] text-slate-400 mt-2 font-medium">
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
