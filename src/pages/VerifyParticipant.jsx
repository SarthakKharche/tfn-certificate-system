import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { Search, Download, AlertCircle, CheckCircle, Clock, XCircle, GraduationCap } from 'lucide-react';

const VerifyParticipant = () => {
    const { showToast } = useToast();
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await firebaseService.getEvents();
                setEvents(data);
                const activeId = localStorage.getItem('tfn_activeEventId');
                if (activeId) setSelectedEventId(activeId);
            } catch (err) {
                console.error(err);
                showToast('Failed to load events', 'error');
            }
        };
        loadEvents();
    }, [showToast]);

    const handleLookup = async (e) => {
        if (e) e.preventDefault();
        if (!selectedEventId) { showToast('Please select an event', 'error'); return; }
        if (!input.trim()) { showToast('Please enter your PRN or email', 'error'); return; }

        setLoading(true);
        setResult(null);

        try {
            const participants = await firebaseService.getAllParticipants(selectedEventId);
            const participant = participants.find(p =>
                p.prn === input.trim() || p.email === input.trim()
            );

            if (!participant) {
                setResult({ status: 'not-found' });
            } else if (!participant.checkedIn) {
                setResult({ status: 'not-checked-in', participant });
            } else {
                const cert = await firebaseService.getCertificate(participant.id, selectedEventId);
                if (!cert) {
                    setResult({ status: 'no-certificate', participant });
                } else {
                    setResult({ status: 'ready', participant, certificate: cert });
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Lookup failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result?.certificate?.pdfData) return;
        const bytes = Uint8Array.from(atob(result.certificate.pdfData), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Open in new tab for preview
        window.open(url, '_blank');
    };

    return (
        <div className="container">
            <div className="hero-section" style={{ textAlign: 'center', padding: '3rem 1rem 1rem' }}>
                <h1><GraduationCap size={48} style={{ marginBottom: '1rem' }} /> Download Your Certificate</h1>
                <p>Enter your details to find and download your participation certificate</p>
            </div>

            <div className="card" style={{ maxWidth: '520px', margin: '2rem auto' }}>
                <div className="card-body">
                    <form onSubmit={handleLookup}>
                        <div className="form-group">
                            <label>📅 Select Event</label>
                            <select
                                className="form-control"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                <option value="">— Select an event —</option>
                                {events.map(e => (
                                    <option key={e.id} value={e.id}>{e.eventName || e.name || 'Untitled'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>🔑 Enter PRN or Email</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., PRN101 or name@email.com"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary-gradient btn-full btn-lg"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : <><Search size={18} /> Find My Certificate</>}
                        </button>
                    </form>
                </div>
            </div>

            {result && (
                <div className="card" style={{ maxWidth: '520px', margin: '1.5rem auto' }}>
                    <div className="card-body">
                        <div className="cert-preview" style={{ textAlign: 'center' }}>
                            <div className="cert-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                {result.status === 'not-found' && <XCircle color="var(--danger)" />}
                                {result.status === 'not-checked-in' && <AlertCircle color="var(--warning)" />}
                                {result.status === 'no-certificate' && <Clock color="var(--info)" />}
                                {result.status === 'ready' && <CheckCircle color="var(--success)" />}
                            </div>
                            <h3>
                                {result.status === 'not-found' && 'Participant Not Found'}
                                {result.status === 'not-checked-in' && 'Not Checked In'}
                                {result.status === 'no-certificate' && 'Certificate Not Ready Yet'}
                                {result.status === 'ready' && 'Certificate Ready!'}
                            </h3>
                        </div>

                        <div className={`alert ${result.status === 'not-found' ? 'alert-danger' :
                            result.status === 'not-checked-in' ? 'alert-warning' :
                                result.status === 'no-certificate' ? 'alert-info' : 'alert-success'
                            }`} style={{ marginTop: '1rem' }}>
                            {result.status === 'not-found' && 'No participant found with that PRN/email for the selected event. Check your details and try again.'}
                            {result.status === 'not-checked-in' && `Hi ${result.participant.name}, you were registered but not checked in. Certificates are only for checked-in attendees.`}
                            {result.status === 'no-certificate' && `Hi ${result.participant.name}, your check-in was recorded! Your certificate hasn't been generated yet. Please check back later.`}
                            {result.status === 'ready' && `Congratulations ${result.participant.name}! Your certificate is ready for download.`}
                        </div>

                        {result.status === 'ready' && (
                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Certificate ID: <strong>{result.certificate.certificateId || result.certificate.id}</strong>
                                </p>
                                <button className="btn btn-success btn-lg" onClick={handleDownload} style={{ padding: '0.75rem 2.5rem' }}>
                                    <Download size={18} /> Download Certificate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifyParticipant;
