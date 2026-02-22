import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Participants from './pages/Participants';
import Upload from './pages/Upload';
import VerifyParticipant from './pages/VerifyParticipant';
import DownloadCertificate from './pages/DownloadCertificate';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/events" /> : children;
};

const HomeRedirect = () => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/events" /> : <Navigate to="/download" />;
};

import { ToastProvider } from './context/ToastContext';
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/events" element={
              <PrivateRoute>
                <Events />
              </PrivateRoute>
            } />
            <Route path="/participants/:eventId" element={
              <PrivateRoute>
                <Participants />
              </PrivateRoute>
            } />
            <Route path="/upload" element={
              <PrivateRoute>
                <Upload />
              </PrivateRoute>
            } />
            <Route path="/verify" element={<VerifyParticipant />} />
            <Route path="/download" element={<DownloadCertificate />} />
            <Route path="/" element={<HomeRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
