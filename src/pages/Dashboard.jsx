import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { certificateGenerator } from '../services/certificateGenerator';
import { useToast } from '../context/ToastContext';
import {
    Users,
    CheckCircle,
    Clock,
    BarChart,
    Search,
    RefreshCcw,
    Zap,
    Download,
    AlertCircle,
    Trash2,
    FileUp,
    Layout,
    X
} from 'lucide-react';
import CertificateDesigner from '../components/CertificateDesigner';

const RegenerateModal = ({ participant, onClose, onGenerate }) => {
    const [templateType, setTemplateType] = useState('current'); // 'current' or 'new'
    const [newTemplate, setNewTemplate] = useState(null);
    const [newMime, setNewMime] = useState('');
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFileName(file.name);
            setNewMime(file.type);
            const reader = new FileReader();
            reader.onload = (re) => setNewTemplate(re.target.result.split(',')[1]);
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e) => {
        handleFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleAction = async (fieldPositions = null) => {
        setLoading(true);
        try {
            await onGenerate(participant, templateType === 'new' ? newTemplate : null, fieldPositions, templateType === 'new' ? newMime : null);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`modal-overlay ${newTemplate ? 'designer-mode' : ''}`}>
            <div className={`modal-content card ${newTemplate ? 'modal-full' : ''}`} style={!newTemplate ? { maxWidth: '500px', width: '95%' } : {}}>
                {!newTemplate && (
                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Certificate for {participant.name}</h3>
                        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>
                )}

                {!newTemplate && (
                    <div className="form-group">
                        <label>Choose Template Option</label>
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                            <div
                                className={`option-card ${templateType === 'current' ? 'active' : ''}`}
                                onClick={() => setTemplateType('current')}
                                style={{
                                    border: '2px solid' + (templateType === 'current' ? ' var(--primary)' : ' #eee'),
                                    padding: '1rem', borderRadius: '8px', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <Layout size={24} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ fontWeight: '500' }}>Event Template</div>
                            </div>
                            <div
                                className={`option-card ${templateType === 'new' ? 'active' : ''}`}
                                onClick={() => setTemplateType('new')}
                                style={{
                                    border: '2px solid' + (templateType === 'new' ? ' var(--primary)' : ' #eee'),
                                    padding: '1rem', borderRadius: '8px', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <FileUp size={24} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ fontWeight: '500' }}>New Template</div>
                            </div>
                        </div>
                    </div>
                )}

                {templateType === 'new' && !newTemplate && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Upload Custom Background (Image)</label>
                        <div
                            className={`upload-area ${dragOver ? 'dragover' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ padding: '1.5rem', minHeight: 'auto' }}
                        >
                            <FileUp className="upload-icon" size={32} />
                            <p style={{ fontSize: '0.9rem' }}>{fileName || 'Click or drag custom image'}</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>This background will only be used for this participant.</p>
                    </div>
                )}

                {templateType === 'new' && newTemplate && (
                    <div className="designer-full-wrap">
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
                            <h3 style={{ margin: 0 }}>Design Certificate for {participant.name}</h3>
                            <button className="btn-icon" onClick={() => { setNewTemplate(null); setFileName(''); }}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', padding: '1rem' }}>
                            <CertificateDesigner
                                imageUrl={`data:image/png;base64,${newTemplate}`}
                                onSave={handleAction}
                                onCancel={() => { setNewTemplate(null); setFileName(''); }}
                                isSaving={loading}
                                saveLabel="Generate Certificate"
                            />
                        </div>
                    </div>
                )}

                {templateType === 'current' && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                        <button className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
                        <button
                            className="btn btn-primary btn-full"
                            disabled={loading}
                            onClick={() => handleAction(null)}
                        >
                            {loading ? <span className="spinner"></span> : 'Generate Certificate'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [participants, setParticipants] = useState([]);
    const [certMap, setCertMap] = useState({});
    const [currentEvent, setCurrentEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [regenParticipant, setRegenParticipant] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [justDeleted, setJustDeleted] = useState(new Set());

    const activeEventId = searchParams.get('eventId') || localStorage.getItem('tfn_activeEventId');

    const loadData = useCallback(async (eventId) => {
        if (!eventId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [pData, cData, eData] = await Promise.all([
                firebaseService.getCheckedInParticipants(eventId),
                firebaseService.getCertificatesByEvent(eventId),
                firebaseService.getEventById(eventId)
            ]);
            setParticipants(pData);
            setCertMap(cData);
            setCurrentEvent(eData);
            showToast(`Loaded ${pData.length} records`, 'info');
        } catch (err) {
            console.error(err);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadData(activeEventId);
    }, [activeEventId, loadData]);

    const filteredParticipants = participants.filter(p => {
        const matchesFilter =
            filter === 'all' ||
            (filter === 'generated' && certMap[p.id]) ||
            (filter === 'pending' && !certMap[p.id]);

        const q = searchTerm.toLowerCase();
        const matchesSearch =
            !q ||
            (p.name || '').toLowerCase().includes(q) ||
            (p.prn || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: participants.length,
        generated: participants.filter(p => certMap[p.id]).length,
        pending: participants.length - participants.filter(p => certMap[p.id]).length,
        rate: participants.length > 0 ? Math.round((participants.filter(p => certMap[p.id]).length / participants.length) * 100) : 0
    };

    const handleDownload = (pid) => {
        const cert = certMap[pid];
        if (!cert || !cert.pdfData) {
            showToast('No PDF data found', 'error');
            return;
        }
        const bytes = Uint8Array.from(atob(cert.pdfData), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Open in new tab for preview
        window.open(url, '_blank');

        // Note: We don't revokeObjectURL here immediately because the new tab needs it to load
    };

    const handleGenerate = async (participant, customTemplate = null, customPositions = null, customMime = null) => {
        if (!currentEvent || !activeEventId) return;
        try {
            showToast(`Generating for ${participant.name}...`, 'info');
            await certificateGenerator.generate(participant, currentEvent, activeEventId, customTemplate, customPositions, customMime);
            showToast('Certificate generated!', 'success');
            loadData(activeEventId);
        } catch (err) {
            console.error(err);
            showToast('Generation failed: ' + err.message, 'error');
        }
    };

    const handleDelete = async (certId, participantId) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) return;
        setDeletingId(certId);
        try {
            await firebaseService.deleteCertificate(certId);
            showToast('Certificate deleted', 'success');
            setJustDeleted(prev => new Set(prev).add(participantId));
            loadData(activeEventId);
        } catch (err) {
            console.error(err);
            showToast('Delete failed', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteAll = async () => {
        const generatedCount = stats.generated;
        if (generatedCount === 0) return;

        if (!window.confirm(`Are you sure you want to delete ALL ${generatedCount} generated certificates for this event? This action cannot be undone.`)) return;

        setDeletingAll(true);
        try {
            await firebaseService.deleteCertificatesByEvent(activeEventId);
            showToast(`Deleted ${generatedCount} certificates`, 'success');
            loadData(activeEventId);
        } catch (err) {
            console.error(err);
            showToast('Delete all failed: ' + err.message, 'error');
        } finally {
            setDeletingAll(false);
        }
    };

    const handleGenerateAll = async () => {
        const pending = participants.filter(p => !certMap[p.id]);
        if (pending.length === 0) return;

        if (!window.confirm(`Generate ${pending.length} certificates?`)) return;

        setGeneratingAll(true);
        let count = 0;
        try {
            for (const p of pending) {
                await certificateGenerator.generate(p, currentEvent, activeEventId);
                count++;
            }
            showToast(`Generated ${count} certificates`, 'success');
            loadData(activeEventId);
        } catch (err) {
            console.error(err);
            showToast('Error in batch: ' + err.message, 'error');
        } finally {
            setGeneratingAll(false);
        }
    };

    if (!activeEventId) {
        return (
            <div className="container">
                <div className="empty-state" style={{ marginTop: '5rem' }}>
                    <div className="empty-icon"><AlertCircle size={48} /></div>
                    <p>No event selected. Please go to the Events page first.</p>
                    <button className="btn btn-primary mt-2" onClick={() => navigate('/events')}>Go to Events</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1><BarChart size={28} /> Certificate Dashboard</h1>
                <p>Real-time overview of event registrations and certificate generation.</p>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '–' : stats.total}</div>
                        <div className="stat-label">Checked In</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '–' : stats.generated}</div>
                        <div className="stat-label">Generated</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Clock size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '–' : stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><BarChart size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{loading ? '–' : `${stats.rate}%`}</div>
                        <div className="stat-label">Generation Rate</div>
                    </div>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, PRN, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'generated' ? 'active' : ''} onClick={() => setFilter('generated')}>Generated</button>
                    <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                </div>
                <div className="filter-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => loadData(activeEventId)}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        disabled={loading || stats.generated === 0 || deletingAll}
                        onClick={handleDeleteAll}
                    >
                        {deletingAll ? <span className="spinner"></span> : <><Trash2 size={16} /> Delete All</>}
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        disabled={loading || stats.pending === 0 || generatingAll}
                        onClick={handleGenerateAll}
                    >
                        {generatingAll ? <span className="spinner"></span> : <><Zap size={16} /> Generate All</>}
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>PRN</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Certificate</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="loading-overlay">
                                            <div className="spinner spinner-dark"></div>
                                            <span>Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredParticipants.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <p>No participants found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredParticipants.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td><strong>{p.name || '—'}</strong></td>
                                        <td>{p.prn || '—'}</td>
                                        <td>{p.email || '—'}</td>
                                        <td><span className="badge badge-success">✓ Checked In</span></td>
                                        <td>
                                            {certMap[p.id] ? (
                                                <span className="badge badge-success">✓ Generated</span>
                                            ) : (
                                                <span className="badge badge-warning">⏳ Pending</span>
                                            )}
                                        </td>
                                        <td>
                                            {certMap[p.id] ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleDownload(p.id)}>
                                                        <Download size={14} /> Preview
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(certMap[p.id].id, p.id)}
                                                        disabled={deletingId === certMap[p.id].id}
                                                    >
                                                        {deletingId === certMap[p.id].id ? <span className="spinner"></span> : <Trash2 size={14} />}
                                                    </button>
                                                </div>
                                            ) : justDeleted.has(p.id) ? (
                                                <button className="btn btn-primary btn-sm" onClick={() => setRegenParticipant(p)}>
                                                    <RefreshCcw size={14} /> Regenerate
                                                </button>
                                            ) : (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleGenerate(p)}>
                                                    <Zap size={14} /> Generate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {regenParticipant && (
                <RegenerateModal
                    participant={regenParticipant}
                    onClose={() => setRegenParticipant(null)}
                    onGenerate={handleGenerate}
                />
            )}
        </div>
    );
};

export default Dashboard;
