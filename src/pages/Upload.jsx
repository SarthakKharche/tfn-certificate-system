import React, { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import {
    FileUp,
    Info,
    Trash2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import CertificateDesigner from '../components/CertificateDesigner';

const Upload = () => {
    const { showToast } = useToast();
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBase64, setSelectedBase64] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [existingTemplate, setExistingTemplate] = useState(null);

    const activeEventId = localStorage.getItem('tfn_activeEventId');
    const activeEventName = localStorage.getItem('tfn_activeEventName');

    const checkTemplate = useCallback(async () => {
        if (!activeEventId) return;
        try {
            const tpl = await firebaseService.getTemplateData(activeEventId);
            if (tpl) {
                setExistingTemplate(tpl);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeEventId]);

    useEffect(() => {
        checkTemplate();
    }, [checkTemplate]);

    const handleFile = (file) => {
        const ok = ['image/png', 'image/jpeg'];
        if (!ok.includes(file.type)) {
            showToast('Please select a PNG or JPG image', 'error');
            return;
        }
        if (file.size > 750 * 1024) {
            showToast('File too large (max 750 KB)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedBase64(reader.result.split(',')[1]);
            setSelectedFile(file);
        };
        reader.readAsDataURL(file);
    };

    const clearExistingTemplate = async () => {
        if (!activeEventId || !window.confirm('Remove current template?')) return;
        try {
            const eventRef = doc(db, 'events', activeEventId);
            await updateDoc(eventRef, {
                templateData: deleteField(),
                templateType: deleteField(),
                templateName: deleteField(),
                fieldPositions: deleteField()
            });
            setExistingTemplate(null);
            setSelectedFile(null);
            setSelectedBase64(null);
            showToast('Template removed', 'success');
        } catch (err) {
            showToast('Failed to remove: ' + err.message, 'error');
        }
    };

    const handleSave = async (fieldPositions) => {
        if (!activeEventId || !selectedFile || !selectedBase64) return;

        setUploading(true);
        setProgress(50);

        try {
            await firebaseService.uploadCertificateTemplate(
                selectedBase64,
                selectedFile.type,
                selectedFile.name,
                activeEventId,
                fieldPositions
            );

            setProgress(100);
            showToast('Template & positions saved!', 'success');
            setTimeout(() => {
                setUploading(false);
                checkTemplate();
            }, 1000);
        } catch (err) {
            console.error(err);
            showToast('Upload failed: ' + err.message, 'error');
            setUploading(false);
        }
    };

    if (!activeEventId) {
        return (
            <div className="container">
                <div className="empty-state" style={{ marginTop: '5rem' }}>
                    <div className="empty-icon"><AlertCircle size={48} /></div>
                    <p>No event selected. Please go to the Events page first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1><FileUp size={28} /> Certificate Designer</h1>
                <p>Upload a template and position fields for <strong>{activeEventName}</strong>.</p>
            </div>

            <div className="info-card">
                <h3><Info size={18} /> How it works</h3>
                <p>1. Upload a PNG/JPG template. 2. Drag field blocks onto the preview. 3. Resize and position them exactly where you want them.</p>
            </div>

            <div className="card mb-2">
                <div className="card-body">
                    {!selectedFile && !existingTemplate && (
                        <div
                            className="upload-area"
                            onClick={() => document.getElementById('templateInput').click()}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                            onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                            onDrop={e => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('dragover');
                                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                            }}
                        >
                            <FileUp size={48} className="upload-icon" />
                            <p>Click or drag template image here</p>
                            <p className="upload-hint">Supports PNG, JPG (Max 750KB)</p>
                            <input
                                type="file"
                                id="templateInput"
                                hidden
                                accept=".png,.jpg,.jpeg"
                                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                            />
                        </div>
                    )}

                    {existingTemplate && !selectedFile && (
                        <div className="alert alert-success">
                            <CheckCircle size={18} />
                            <span>A template is already set for this event.</span>
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={clearExistingTemplate}>
                                <Trash2 size={14} /> Remove Existing
                            </button>
                        </div>
                    )}

                    {selectedFile && (
                        <div>
                            {uploading && (
                                <div className="progress-bar mb-1">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}
                            <CertificateDesigner
                                imageUrl={URL.createObjectURL(selectedFile)}
                                onSave={handleSave}
                                onCancel={() => { setSelectedFile(null); setSelectedBase64(null); }}
                                isSaving={uploading}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
