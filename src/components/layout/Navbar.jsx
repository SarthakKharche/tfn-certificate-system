import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, FileText, BarChart, LogOut, Menu, CalendarCheck, Download } from 'lucide-react';

const Navbar = () => {
    const { logout, currentUser } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('tfn_activeEventId');
            localStorage.removeItem('tfn_activeEventName');
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const pages = currentUser ? [
        { name: 'Events', path: '/events', icon: <Calendar size={18} /> },
        { name: 'Upload Template', path: '/upload', icon: <FileText size={18} /> },
        { name: 'Dashboard', path: '/dashboard', icon: <BarChart size={18} /> }
    ] : [];

    const activeEventName = localStorage.getItem('tfn_activeEventName');

    return (
        <>
            <nav className="navbar">
                <NavLink className="navbar-brand" to={currentUser ? "/dashboard" : "/download"}>
                    <CalendarCheck size={26} strokeWidth={2.2} />
                    TFN Certificate System
                </NavLink>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`} id="navLinks">
                    <NavLink
                        to="/download"
                        className={({ isActive }) => isActive ? 'active' : ''}
                        onClick={() => setMenuOpen(false)}
                    >
                        <Download size={18} /> Student Portal
                    </NavLink>

                    {pages.map((page) => (
                        <NavLink
                            key={page.path}
                            to={page.path}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            {page.icon} {page.name}
                        </NavLink>
                    ))}

                    {currentUser ? (
                        <button onClick={handleLogout} className="logout-link btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', font: 'inherit' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    ) : (
                        <NavLink
                            to="/login"
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={() => setMenuOpen(false)}
                        >
                            Log In
                        </NavLink>
                    )}
                </div>

                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                    <span></span><span></span><span></span>
                </button>
            </nav>

            {activeEventName && !['/download', '/verify', '/login'].includes(location.pathname) && (
                <div className="active-event-banner">
                    <Calendar size={18} />
                    <span className="event-label">Active Event:</span>
                    <span className="event-name">{activeEventName}</span>
                </div>
            )}
        </>
    );
};

export default Navbar;
