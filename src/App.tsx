import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import { TeacherLayout } from './components/layout/TeacherLayout';

// Views
import { WelcomeView } from './views/WelcomeView';
import { DashboardView } from './views/teacher/DashboardView';
import { ImportWizardView } from './views/teacher/ImportWizardView';
import { QuestionBankView } from './views/teacher/QuestionBankView';
import { HomeworkListView } from './views/teacher/HomeworkListView';
import { ExamListView } from './views/teacher/ExamListView';
import { ExamBuilderView } from './views/teacher/ExamBuilderView';
import { ClassListView } from './views/teacher/ClassListView';
import { ClassDetailView } from './views/teacher/ClassDetailView';
import { ReportsView } from './views/teacher/ReportsView';
import { TeacherProfileSettingsView } from './views/teacher/TeacherProfileSettingsView';
import { TeacherCalendarView } from './views/teacher/TeacherCalendarView';

// Public & Student Views
import { TeacherPublicProfileView } from './views/public/TeacherPublicProfileView';
import { ExamTakingView } from './views/student/ExamTakingView';
import { ExamResultView } from './views/student/ExamResultView';
import { StudentJoinClassView } from './views/student/StudentJoinClassView';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Welcome / Landing Screen */}
            <Route path="/" element={<WelcomeView />} />

            {/* Teacher Private Workspace */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardView />} />
              <Route path="import-wizard" element={<ImportWizardView />} />
              <Route path="questions" element={<QuestionBankView />} />
              <Route path="homework" element={<Navigate to="/teacher/exams" replace />} />
              <Route path="exams" element={<ExamListView />} />
              <Route path="exam-builder/:examId" element={<ExamBuilderView />} />
              <Route path="classes" element={<ClassListView />} />
              <Route path="classes/:classId" element={<ClassDetailView />} />
              <Route path="calendar" element={<TeacherCalendarView />} />
              <Route path="grading" element={<Navigate to="/teacher/exams" replace />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="profile-settings" element={<TeacherProfileSettingsView />} />
            </Route>

            {/* Public Teacher Digital Brand Page */}
            <Route path="/teacher/:slug" element={<TeacherPublicProfileView />} />

            {/* Student Class Joining, Exam Taking & Results */}
            <Route path="/classes/join" element={<StudentJoinClassView />} />
            <Route path="/exam/:examId" element={<ExamTakingView />} />
            <Route path="/exam/:examId/result" element={<ExamResultView />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
