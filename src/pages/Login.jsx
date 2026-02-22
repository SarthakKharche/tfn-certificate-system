import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CalendarCheck, Key } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            console.error('Firebase Login Error:', err);
            let msg = 'Login failed. Please try again.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many attempts. Please try again later.';
            }
            setError(msg + ' (' + (err.code || err.message) + ')');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-icon">
                    <CalendarCheck size={36} color="#fff" />
                </div>
                <div className="login-header">
                    <h1>TFN Certificate System</h1>
                    <p>Admin Login</p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="on">
                    <div className="form-group">
                        <label>📧 <strong>Email</strong></label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter admin email"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label>🔒 <strong>Password</strong></label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <p className="login-error">{error}</p>

                    <button
                        type="submit"
                        className="btn btn-primary-gradient btn-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner"></span> : <><Key size={18} /> Login</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
