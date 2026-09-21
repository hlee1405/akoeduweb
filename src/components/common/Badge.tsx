import React from 'react';
import { CognitiveLevel, Difficulty, ExamStatus, QuestionType } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    outline: 'bg-transparent text-slate-700 border-slate-300'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] font-semibold rounded-full',
    md: 'px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider'
  };

  return (
    <span
      className={`inline-flex items-center border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const CognitiveLevelBadge: React.FC<{ level: CognitiveLevel }> = ({ level }) => {
  const map: Record<CognitiveLevel, { label: string; variant: BadgeProps['variant'] }> = {
    recognize: { label: 'Nhận biết', variant: 'default' },
    understand: { label: 'Thông hiểu', variant: 'primary' },
    apply: { label: 'Vận dụng', variant: 'warning' },
    advanced: { label: 'Vận dụng cao', variant: 'purple' }
  };
  const config = map[level] || { label: level, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
  const map: Record<Difficulty, { label: string; variant: BadgeProps['variant'] }> = {
    easy: { label: 'Dễ', variant: 'success' },
    medium: { label: 'Trung bình', variant: 'warning' },
    hard: { label: 'Khó', variant: 'danger' }
  };
  const config = map[difficulty] || { label: difficulty, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const QuestionTypeBadge: React.FC<{ type: QuestionType }> = ({ type }) => {
  const map: Record<QuestionType, { label: string; variant: BadgeProps['variant'] }> = {
    single_choice: { label: 'Trắc nghiệm 1 đáp án', variant: 'primary' },
    multiple_choice: { label: 'Nhiều đáp án', variant: 'purple' },
    multiple_select: { label: 'Nhiều đáp án', variant: 'purple' },
    true_false: { label: 'Đúng / Sai', variant: 'warning' },
    short_answer: { label: 'Trả lời ngắn', variant: 'success' },
    fill_in_blank: { label: 'Điền từ khuyết', variant: 'success' },
    essay: { label: 'Tự luận', variant: 'danger' }
  };
  const config = map[type] || { label: type, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const ExamStatusBadge: React.FC<{ status: ExamStatus }> = ({ status }) => {
  const map: Record<ExamStatus, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'BẢN NHÁP', variant: 'default' },
    scheduled: { label: 'LÊN LỊCH', variant: 'primary' },
    published: { label: 'ĐANG MỞ', variant: 'success' },
    closed: { label: 'ĐÃ ĐÓNG', variant: 'default' }
  };
  const config = map[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant} size="md">{config.label}</Badge>;
};

export const AttendanceStatusBadge: React.FC<{ status: 'present' | 'late' | 'excused_absence' | 'unexcused_absence' }> = ({ status }) => {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    present: { label: 'Có mặt', variant: 'success' },
    late: { label: 'Đi muộn', variant: 'warning' },
    excused_absence: { label: 'Nghỉ có phép', variant: 'primary' },
    unexcused_absence: { label: 'Vắng không phép', variant: 'danger' }
  };
  const config = map[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const DiligenceRankBadge: React.FC<{ rank: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Cần rèn luyện' | string }> = ({ rank }) => {
  const map: Record<string, BadgeProps['variant']> = {
    'Xuất sắc': 'purple',
    'Tốt': 'success',
    'Khá': 'primary',
    'Trung bình': 'warning',
    'Cần rèn luyện': 'danger'
  };
  const variant = map[rank] || 'default';
  return <Badge variant={variant}>{rank}</Badge>;
};


