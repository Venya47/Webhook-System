import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import WebhooksPage from './pages/WebhooksPage';
import AddWebhookPage from './pages/AddWebhookPage';
import PreviewWebhookPage from './pages/PreviewWebhookPage';
import EditWebhookPage from './pages/EditWebhookPage';
import ActivityPage from './pages/ActivityPage';
import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/webhooks"
            element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>}
          />
          <Route
            path="/webhooks/new"
            element={<ProtectedRoute><AddWebhookPage /></ProtectedRoute>}
          />
          <Route
            path="/webhooks/:id"
            element={<ProtectedRoute><PreviewWebhookPage /></ProtectedRoute>}
          />
          <Route
            path="/webhooks/:id/edit"
            element={<ProtectedRoute><EditWebhookPage /></ProtectedRoute>}
          />
          <Route
            path="/activity"
            element={<ProtectedRoute><ActivityPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/webhooks" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}