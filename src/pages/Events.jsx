import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { Calendar, CheckCircle, ArrowRight } from 'lucide-react';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeEventId, setActiveEventId] = useState(localStorage.getItem('tfn_activeEventId'));
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await firebaseService.getEvents();
                setEvents(data);
            } catch (err) {
                console.error(err);
                showToast('Failed to load events', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [showToast]);

    const handleSelectEvent = (event) => {
        localStorage.setItem('tfn_activeEventId', event.id);
        localStorage.setItem('tfn_activeEventName', event.eventName || event.name || 'Untitled');
        setActiveEventId(event.id);
        showToast(`"${event.eventName || event.name}" is now the active event`, 'success');
    };

    const formatDate = (d) => {
        if (!d) return '—';
        if (d.toDate) d = d.toDate();
        const date = new Date(d);
        return date.toLocaleDateString('en-CA');
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1><Calendar size={28} /> Events</h1>
                <p>Select an event to view its certificate dashboard.</p>
            </div>

            <h2 className="section-header">📋 Your Events</h2>

            {loading ? (
                <div className="loading-overlay">
                    <div className="spinner spinner-dark"></div>
                    <span>Loading events...</span>
                </div>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No events found.</p>
                </div>
            ) : (
                <div className="events-grid">
                    {events.map((ev) => {
                        const name = ev.eventName || ev.name || 'Untitled';
                        const isActive = ev.id === activeEventId;
                        return (
                            <div key={ev.id} className={`event-card ${isActive ? 'active' : ''}`}>
                                <div className="event-card-header">
                                    <div className="event-icon">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="event-info">
                                        <h3>{name}</h3>
                                        <div className="event-date">🕐 {formatDate(ev.date)}</div>
                                    </div>
                                    {isActive && <span className="active-badge"><CheckCircle size={14} /> Active</span>}
                                </div>
                                <div className="event-card-divider"></div>
                                <div className="event-card-actions">
                                    {isActive ? (
                                        <button className="btn btn-selected" disabled>
                                            <CheckCircle size={16} /> Selected
                                        </button>
                                    ) : (
                                        <button className="btn btn-select" onClick={() => handleSelectEvent(ev)}>
                                            Select Event
                                        </button>
                                    )}
                                    <button className="btn btn-outline" onClick={() => navigate(`/dashboard?eventId=${ev.id}`)}>
                                        View Dashboard <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Events;
