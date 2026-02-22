import React, { useState, useEffect, useRef } from 'react';
import {
    Type,
    Hash,
    Calendar as CalendarIcon,
    Tag,
    Plus,
    Minus,
    X,
    Trash2
} from 'lucide-react';

export const FIELDS_CONFIG = {
    name: { label: 'Attendee Name', preview: 'John Doe', icon: <Type size={16} />, baseFontPx: 32 },
    prn: { label: 'PRN', preview: 'PRN: 12345678', icon: <Hash size={16} />, baseFontPx: 16 },
    date: { label: 'Event Date', preview: '18 Feb 2026', icon: <CalendarIcon size={16} />, baseFontPx: 16 },
    eventName: { label: 'Event Name', preview: 'Science Fair 2026', icon: <Tag size={16} />, baseFontPx: 18 },
};

const SCALE_STEP = 0.1;
const SCALE_MIN = 0.4;
const SCALE_MAX = 3.0;

const DraggableField = ({ fieldKey, pos, config, onUpdate, onResize, onRemove, canvasRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startCoord = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.closest('.field-controls')) return;
        setIsDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        startPos.current = { x: e.clientX, y: e.clientY };
        startCoord.current = { x: (pos.x / 100) * rect.width, y: (pos.y / 100) * rect.height };

        const handleMouseMove = (mmE) => {
            const dx = mmE.clientX - startPos.current.x;
            const dy = mmE.clientY - startPos.current.y;
            const newX = ((startCoord.current.x + dx) / rect.width) * 100;
            const newY = ((startCoord.current.y + dy) / rect.height) * 100;
            onUpdate(fieldKey, newX, newY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`field-block ${isDragging ? 'dragging' : ''}`}
            style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${config.baseFontPx * (pos.scale || 1)}px`,
                cursor: 'grab',
                padding: '4px 12px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1.5px solid var(--primary)',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                zIndex: isDragging ? 100 : 10,
                boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                transition: isDragging ? 'none' : 'box-shadow 0.15s',
                textAlign: 'center',
                ...(fieldKey === 'name' ? { fontFamily: "'Great Vibes', cursive", borderColor: 'var(--primary)' } : {}),
                ...(fieldKey === 'prn' ? { borderColor: 'var(--success)' } : {}),
                ...(fieldKey === 'date' ? { borderColor: 'var(--purple)' } : {}),
                ...(fieldKey === 'eventName' ? { borderColor: 'var(--orange)' } : {}),
            }}
            onMouseDown={handleMouseDown}
        >
            {config.preview}

            <div className="field-controls" style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                display: 'flex',
                gap: '2px'
            }}>
                <button className="btn-resize-up" style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)',
                    color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer'
                }} onClick={(e) => { e.stopPropagation(); onResize(fieldKey, SCALE_STEP); }}>+</button>
                <button className="btn-resize-down" style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-light)',
                    color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer'
                }} onClick={(e) => { e.stopPropagation(); onResize(fieldKey, -SCALE_STEP); }}>−</button>
                <button className="btn-remove" style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--danger)',
                    color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer'
                }} onClick={(e) => { e.stopPropagation(); onRemove(fieldKey); }}>×</button>
            </div>

            <span className="scale-badge" style={{
                position: 'absolute',
                bottom: '-8px',
                right: '-8px',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '8px'
            }}>{(pos.scale || 1).toFixed(1)}x</span>
        </div>
    );
};

const CertificateDesigner = ({
    imageUrl,
    initialPositions = {},
    onSave,
    onCancel,
    isSaving = false,
    saveLabel = "Save Template & Positions"
}) => {
    const [fieldPositions, setFieldPositions] = useState(initialPositions);
    const canvasWrapRef = useRef(null);

    const handleDragStart = (e, field) => {
        e.dataTransfer.setData('field', field);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const field = e.dataTransfer.getData('field');
        if (!field || fieldPositions[field]) return;

        const rect = canvasWrapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setFieldPositions(prev => ({
            ...prev,
            [field]: { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)), scale: 1.0 }
        }));
    };

    const updatePosition = (field, x, y) => {
        setFieldPositions(prev => ({
            ...prev,
            [field]: { ...prev[field], x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) }
        }));
    };

    const updateScale = (field, delta) => {
        setFieldPositions(prev => {
            const current = prev[field].scale || 1.0;
            const next = Math.max(SCALE_MIN, Math.min(SCALE_MAX, current + delta));
            return {
                ...prev,
                [field]: { ...prev[field], scale: parseFloat(next.toFixed(1)) }
            };
        });
    };

    const removeField = (field) => {
        setFieldPositions(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleInternalSave = () => {
        const canvasW = canvasWrapRef.current.getBoundingClientRect().width;
        const processedPositions = {};

        Object.entries(fieldPositions).forEach(([key, val]) => {
            const visualFontPx = FIELDS_CONFIG[key].baseFontPx * (val.scale || 1);
            const fontPct = (visualFontPx / canvasW) * 100;
            processedPositions[key] = {
                x: parseFloat(val.x.toFixed(2)),
                y: parseFloat(val.y.toFixed(2)),
                scale: val.scale || 1.0,
                fontPct: parseFloat(fontPct.toFixed(3))
            };
        });

        onSave(processedPositions);
    };

    return (
        <div className="designer-layout" style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', height: '100%', overflow: 'hidden', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
            <div
                className="canvas-container"
                style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '2px dashed var(--primary-light)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    position: 'relative',
                    padding: '20px'
                }}
            >
                <div
                    className="canvas-wrap"
                    ref={canvasWrapRef}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    style={{
                        position: 'relative',
                        display: 'inline-block',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                >
                    <img
                        src={imageUrl}
                        alt="Template"
                        style={{
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: 'calc(96vh - 150px)',
                            width: 'auto',
                            height: 'auto',
                            pointerEvents: 'none'
                        }}
                    />

                    {Object.entries(fieldPositions).map(([key, pos]) => (
                        <DraggableField
                            key={key}
                            fieldKey={key}
                            pos={pos}
                            config={FIELDS_CONFIG[key]}
                            onUpdate={updatePosition}
                            onResize={updateScale}
                            onRemove={removeField}
                            canvasRef={canvasWrapRef}
                        />
                    ))}
                </div>
            </div>

            <div className="sidebar" style={{ width: window.innerWidth < 768 ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📦 Field Blocks</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Drag onto the certificate</p>

                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'row' : 'column', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {Object.entries(FIELDS_CONFIG).map(([key, cfg]) => (
                        <div
                            key={key}
                            className={`block-chip ${fieldPositions[key] ? 'placed' : ''}`}
                            draggable={!fieldPositions[key]}
                            onDragStart={e => handleDragStart(e, key)}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: fieldPositions[key] ? '#f1f5f9' : '#fff',
                                cursor: fieldPositions[key] ? 'default' : 'grab',
                                opacity: fieldPositions[key] ? 0.5 : 1,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flex: window.innerWidth < 768 ? '1 1 calc(50% - 0.5rem)' : 'none'
                            }}
                        >
                            {cfg.icon} {cfg.label}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            className="btn btn-primary btn-full btn-lg"
                            onClick={handleInternalSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <span className="spinner"></span> : saveLabel}
                        </button>
                        {onCancel && (
                            <button
                                className="btn btn-outline btn-full"
                                onClick={onCancel}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {Object.keys(fieldPositions).length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Placed fields:</p>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            {Object.entries(fieldPositions).map(([key, pos]) => (
                                <div key={key} style={{ borderBottom: '1px solid var(--border)', padding: '0.25rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{FIELDS_CONFIG[key].label}</span>
                                    <span style={{ color: 'var(--info)' }}>{pos.scale.toFixed(1)}x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateDesigner;
