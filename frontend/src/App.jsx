import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DailyLog from './pages/DailyLog.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                  <Navbar />
                  <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
                    <Routes>
                      <Route path="/"         element={<Navigate to="/log" replace />} />
                      <Route path="/log"      element={<DailyLog />} />
                      <Route path="/progress" element={<Progress />} />
                      <Route path="/profile"  element={<Profile />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
