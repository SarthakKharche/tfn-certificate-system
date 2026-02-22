import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { Users, UserPlus, Search, ArrowLeft, Trash2, Edit } from 'lucide-react';

const Participants = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [event, setEvent] = useState(null);

    useEffect(() => {
        const loadParticipants = async () => {
            try {
                const [pData, eData] = await Promise.all([
                    firebaseService.getAllParticipants(eventId),
                    firebaseService.getEventById(eventId)
                ]);
                setParticipants(pData);
                setEvent(eData);
            } catch (err) {
                console.error(err);
                showToast('Failed to load participants', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadParticipants();
    }, [eventId, showToast]);

    const filteredParticipants = participants.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.prn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container">
            <div className="page-header">
                <button className="btn btn-outline btn-sm mb-1" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h1><Users size={28} /> Participants</h1>
                <p>Manage participants for <strong>{event?.eventName || 'Event'}</strong>.</p>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary btn-sm">
                    <UserPlus size={16} /> Add Participant
                </button>
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
                                <th>Checked In</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="loading-overlay">
                                            <div className="spinner spinner-dark"></div>
                                            <span>Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredParticipants.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <p>No participants found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredParticipants.map((p, i) => (
                                    <tr key={p.id}>
                                        <td>{i + 1}</td>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.prn}</td>
                                        <td>{p.email}</td>
                                        <td>
                                            {p.checkedIn ? (
                                                <span className="badge badge-success">Yes</span>
                                            ) : (
                                                <span className="badge badge-warning">No</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-outline btn-sm"><Edit size={14} /></button>
                                                <button className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Participants;
