import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, QrCode, Share2, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ClassRoom } from '../../types';
import { store } from '../../services/store';
import { ClassShareModal } from '../classes/ClassShareModal';

interface QRModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  url: string;
  code?: string;
  classRoom?: ClassRoom;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  title,
  subtitle,
  url,
  code,
  classRoom,
  onClose
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // If this QR is for a class, use the rich ClassShareModal!
  const matchedClass = classRoom || (code ? store.getClassByJoinCode(code) : undefined);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  useEffect(() => {
    if (!isOpen || matchedClass) return;

    QRCode.toDataURL(fullUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => {
        console.error('QR error', err);
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(fullUrl)}&margin=10`);
      });
  }, [isOpen, fullUrl, matchedClass]);

  if (!isOpen) return null;

  if (matchedClass) {
    return (
      <ClassShareModal
        isOpen={isOpen}
        classRoom={matchedClass}
        onClose={onClose}
      />
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    success('Đã sao chép link', 'Link đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    success('Đã sao chép mã', `Mã: ${code}`);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QRCode_${code || 'share'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã tải ảnh QR', 'Ảnh mã QR đã được lưu về máy.');
  };

  return (
    <div id="qr-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="qr-modal-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          <button
            id="btn-close-qr-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          {/* QR Box */}
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          {code && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã tham gia:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-800 font-mono font-bold rounded-lg border border-blue-200 tracking-wider">
                {code}
              </span>
              <button
                id="btn-copy-join-code"
                onClick={handleCopyCode}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                title="Sao chép mã"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Link box */}
          <div className="mt-5 text-left">
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Đường dẫn trực tiếp:</label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                id="input-share-url"
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-hidden select-all"
              />
              <button
                id="btn-copy-share-url"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <a
              id="link-open-student-preview"
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở thử</span>
            </a>

            {qrDataUrl && (
              <button
                type="button"
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh QR</span>
              </button>
            )}
          </div>

          <button
            id="btn-done-qr-modal"
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
