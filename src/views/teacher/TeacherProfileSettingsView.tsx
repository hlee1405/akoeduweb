import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { store } from '../../services/store';
import { TeacherProfile, PublicDocument, ReviewItem } from '../../types';
import { useToast } from '../../context/ToastContext';

export const TeacherProfileSettingsView: React.FC = () => {
  const { success } = useToast();
  const [teacher, setTeacher] = useState<TeacherProfile>(store.getTeacher());

  // Form states
  const [fullName, setFullName] = useState(teacher.fullName);
  const [title, setTitle] = useState(teacher.title);
  const [slug] = useState(teacher.slug);
  const [customDomain] = useState(teacher.customDomain || '');
  const [school, setSchool] = useState(teacher.school);
  const [bio, setBio] = useState(teacher.bio);
  const [avatarUrl, setAvatarUrl] = useState(teacher.avatarUrl);
  const [experienceYears, setExperienceYears] = useState(teacher.experienceYears);
  const [email, setEmail] = useState(teacher.contactEmail);
  const [phone, setPhone] = useState(teacher.contactPhone);
  const [zalo, setZalo] = useState(teacher.socialLinks.zalo || '');
  const [facebook, setFacebook] = useState(teacher.socialLinks.facebook || '');
  const [youtube, setYoutube] = useState(teacher.socialLinks.youtube || '');

  // Documents
  const [documents, setDocuments] = useState<PublicDocument[]>(teacher.publicDocuments || []);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docGrade, setDocGrade] = useState('Khối 9');
  const [docSubject, setDocSubject] = useState('Toán học');

  // Reviews
  const [reviews] = useState<ReviewItem[]>(teacher.reviews || []);

  useEffect(() => {
    const refresh = () => setTeacher(store.getTeacher());
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    store.updateTeacher({
      fullName,
      title,
      slug: slug.toLowerCase().trim(),
      customDomain: customDomain.trim(),
      school,
      bio,
      avatarUrl,
      experienceYears: Number(experienceYears),
      contactEmail: email,
      contactPhone: phone,
      socialLinks: {
        zalo,
        facebook,
        youtube
      },
      publicDocuments: documents,
      reviews
    });

    success('Cập nhật thành công', 'Thông tin hồ sơ đã được lưu.');
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newDoc: PublicDocument = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      description: docDescription,
      grade: docGrade,
      subject: docSubject,
      fileType: 'pdf',
      downloadUrl: '#',
      downloadsCount: 1,
      createdAt: new Date().toISOString()
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    store.updateTeacher({ publicDocuments: updated });
    setShowDocModal(false);
    setDocTitle('');
    setDocDescription('');
    success('Đã thêm tài liệu', newDoc.title);
  };

  const handleDeleteDoc = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    store.updateTeacher({ publicDocuments: updated });
    success('Đã xóa tài liệu');
  };

  return (
    <div id="teacher-profile-settings-view" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            <span>Hồ sơ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xây dựng uy tín giảng dạy, chia sẻ đề thi công khai và tài liệu cho học sinh trên toàn quốc
          </p>
        </div>

        <Link
          to={`/teacher/${slug}`}
          target="_blank"
          id="btn-preview-public-page"
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Xem trang công khai của tôi</span>
        </Link>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* General Profile Info */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Thông tin giáo viên</h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
            <div className="flex-1 w-full">
              <label className="font-semibold text-slate-700 block mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Chức danh / Học vị</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Đơn vị công tác / Trường</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số năm kinh nghiệm</label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Giới thiệu bản thân & Triết lý giáo dục</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Thông tin liên hệ & Kênh mạng xã hội</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email liên hệ</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số điện thoại / Hotline</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số Zalo</label>
              <input
                type="text"
                placeholder="0981 234 567"
                value={zalo}
                onChange={(e) => setZalo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facebook cá nhân / Fanpage</label>
              <input
                type="text"
                placeholder="https://facebook.com/..."
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kênh YouTube giảng dạy</label>
              <input
                type="text"
                placeholder="https://youtube.com/@..."
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Public Documents Management */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tài liệu & Đề cương công khai</h3>
              <p className="text-slate-500 mt-0.5">Tài liệu được hiển thị trên trang cá nhân cho học sinh tải về</p>
            </div>

            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tài liệu</span>
            </button>
          </div>

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{doc.title}</h4>
                    <span className="text-[11px] text-slate-400">{doc.grade} • {doc.subject} • {doc.downloadsCount} lượt tải</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            id="btn-save-profile"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu toàn bộ thay đổi</span>
          </button>
        </div>
      </form>

      {/* Add Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Thêm tài liệu công khai</h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 100 Câu hình học trọng tâm thi vào 10"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Khối lớp</label>
                  <select
                    value={docGrade}
                    onChange={(e) => setDocGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Môn học</label>
                  <input
                    type="text"
                    value={docSubject}
                    onChange={(e) => setDocSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Thêm tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
