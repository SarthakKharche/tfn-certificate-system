import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import {
    Search,
    Download,
    FileText,
    AlertCircle,
    CheckCircle,
    User,
    Calendar,
    Trophy,
    ChevronDown
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DownloadCertificate = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await firebaseService.getEvents();
                setEvents(data);
                // Optionally auto-select the first event if available
                if (data.length > 0) {
                    // setSelectedEventId(data[0].id);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load events', 'error');
            } finally {
                setFetchingEvents(false);
            }
        };
        loadEvents();
    }, [showToast]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!selectedEventId) {
            showToast('Please select an event', 'error');
            return;
        }
        if (!identifier.trim()) {
            showToast('Please enter your PRN or Email', 'error');
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const results = await firebaseService.getCertificatesByStudentAndEvent(identifier.trim(), selectedEventId);
            setCertificates(results);
            if (results.length === 0) {
                showToast('No certificates found for this identifier in this event', 'info');
            } else {
                showToast(`Certificate found!`, 'success');
            }
        } catch (err) {
            console.error(err);
            showToast('Search failed: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (cert) => {
        const byteCharacters = atob(cert.pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    if (fetchingEvents) {
        return (
            <div className="container text-center" style={{ marginTop: '10rem' }}>
                <div className="spinner-lg"></div>
                <p className="mt-3 text-secondary">Loading available events...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '700px', marginTop: '4rem', paddingBottom: '4rem' }}>
            <div className="text-center mb-5">
                <div
                    className="mb-4"
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--primary-light)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)',
                        margin: '0 auto'
                    }}
                >
                    <Trophy size={40} />
                </div>
                <h1 className="mb-2" style={{ fontSize: '2.8rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Find Your Certificate
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
                    Select your event and enter your details to download your certificate.
                </p>
            </div>

            <div className="card shadow-lg mb-4" style={{ borderRadius: '24px', overflow: 'hidden', border: 'none' }}>
                <div className="card-body p-4 p-md-5" style={{ background: '#fff' }}>
                    <form onSubmit={handleSearch}>
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2">1. Select Event</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="form-control"
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    style={{
                                        height: '60px',
                                        fontSize: '1.1rem',
                                        borderRadius: '15px',
                                        border: '2px solid #e2e8f0',
                                        appearance: 'none',
                                        paddingRight: '3rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="" disabled>Choose an event...</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.eventName || event.name} ({new Date(event.date).getFullYear()})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={20}
                                    style={{
                                        position: 'absolute',
                                        right: '1.2rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="form-label fw-bold mb-2">2. Enter PRN or Email</label>
                            <div style={{ position: 'relative' }}>
                                <Search
                                    size={22}
                                    style={{
                                        position: 'absolute',
                                        left: '1.2rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)'
                                    }}
                                />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter PRN or Registered Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    style={{
                                        paddingLeft: '3.5rem',
                                        height: '60px',
                                        fontSize: '1.1rem',
                                        borderRadius: '15px',
                                        border: '2px solid #e2e8f0',
                                        transition: 'all 0.3s'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary-gradient btn-full py-3"
                            disabled={loading}
                            style={{ borderRadius: '15px', fontSize: '1.2rem', fontWeight: 700, height: '60px' }}
                        >
                            {loading ? <span className="spinner"></span> : 'Generate Certificate'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="results-container mt-4">
                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-lg"></div>
                        <p className="mt-3 text-secondary">Searching records...</p>
                    </div>
                ) : certificates.length > 0 ? (
                    <div className="row">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="col-12">
                                <div className="card shadow-md animate-fade-in" style={{ borderRadius: '20px', border: '2px solid var(--success-light)', background: '#f0fdf4' }}>
                                    <div className="card-body d-flex flex-column flex-md-row align-items-center gap-4 p-4">
                                        <div
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                background: '#fff',
                                                borderRadius: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--success)',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <CheckCircle size={32} />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <h3 style={{ margin: 0, fontWeight: 800, color: '#166534', fontSize: '1.2rem' }}>Certificate Found!</h3>
                                            <p className="text-secondary mt-1 mb-0" style={{ fontSize: '0.95rem' }}>
                                                <strong>{cert.participantName}</strong> — {cert.eventName}
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-success px-4 py-3"
                                            onClick={() => handleDownload(cert)}
                                            style={{ borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Download size={20} /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched && (
                    <div className="empty-state text-center p-5 card shadow-sm" style={{ borderRadius: '24px', background: '#fff' }}>
                        <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>
                            <AlertCircle size={64} opacity={0.6} />
                        </div>
                        <h3 className="fw-bold">No Certificate Found</h3>
                        <p className="text-secondary mx-auto mb-0" style={{ maxWidth: '450px' }}>
                            We couldn't find a certificate for "{identifier}" in the selected event. Please check your details.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DownloadCertificate;
