import { db } from '../firebase/config';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    limit,
    addDoc,
    setDoc,
    serverTimestamp,
    deleteField,
    deleteDoc
} from 'firebase/firestore';

export const firebaseService = {
    // ... items above ...

    // Certificates
    async deleteCertificate(certificateId) {
        const docRef = doc(db, 'certificates', certificateId);
        await deleteDoc(docRef);
        return { success: true };
    },

    async deleteCertificatesByEvent(eventId) {
        const q = query(collection(db, 'certificates'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        const batch = [];
        querySnapshot.docs.forEach(docSnap => {
            batch.push(deleteDoc(doc(db, 'certificates', docSnap.id)));
        });
        await Promise.all(batch);
        return { success: true, count: querySnapshot.size };
    },
    // Events
    async getEvents() {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return events.sort((a, b) => {
            const da = a.date || '';
            const db2 = b.date || '';
            return db2 > da ? 1 : db2 < da ? -1 : 0;
        });
    },

    async getEventById(eventId) {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    },

    // Attendees
    async getCheckedInParticipants(eventId) {
        const q = query(collection(db, 'attendees'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.checkedIn === true || p.checkedIn === 'true');
    },

    async getAllParticipants(eventId) {
        const q = query(collection(db, 'attendees'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Certificates
    async getCertificate(participantId, eventId) {
        const q = query(
            collection(db, 'certificates'),
            where('participantId', '==', participantId),
            where('eventId', '==', eventId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    async getCertificatesByEvent(eventId) {
        const q = query(collection(db, 'certificates'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        const map = {};
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            map[data.participantId] = { id: doc.id, ...data };
        });
        return map;
    },

    async saveCertificateRecord(data) {
        const docRef = await addDoc(collection(db, 'certificates'), data);
        return docRef.id;
    },

    // Templates
    async uploadCertificateTemplate(base64Data, mimeType, fileName, eventId, fieldPositions) {
        const eventRef = doc(db, 'events', eventId);
        const updateData = {
            templateData: base64Data,
            templateType: mimeType,
            templateName: fileName,
            fieldPositions: fieldPositions || {}
        };
        await setDoc(eventRef, updateData, { merge: true });
        return { success: true };
    },

    async getTemplateData(eventId) {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().templateData) {
            const d = docSnap.data();
            return {
                data: d.templateData,
                type: d.templateType,
                name: d.templateName,
                fieldPositions: d.fieldPositions || {}
            };
        }
        return null;
    },

    async getCertificatesByStudent(identifier) {
        if (!identifier) return [];

        // 1. Find participant(s) by PRN or Email
        const attendeeCollection = collection(db, 'attendees');

        // Search by Email
        const qEmail = query(attendeeCollection, where('email', '==', identifier));
        const emailSnap = await getDocs(qEmail);

        // Search by PRN
        const qPrn = query(attendeeCollection, where('prn', '==', identifier));
        const prnSnap = await getDocs(qPrn);

        const participants = [];
        emailSnap.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));
        prnSnap.forEach(doc => {
            if (!participants.find(p => p.id === doc.id)) {
                participants.push({ id: doc.id, ...doc.data() });
            }
        });

        if (participants.length === 0) return [];

        const results = [];

        // 2. For each participant, find their certificates
        for (const p of participants) {
            const certQ = query(collection(db, 'certificates'), where('participantId', '==', p.id));
            const certSnap = await getDocs(certQ);

            for (const cDoc of certSnap.docs) {
                const cData = cDoc.data();
                // Get event data for event name
                const eventRef = doc(db, 'events', cData.eventId);
                const eventSnap = await getDoc(eventRef);
                const eventName = eventSnap.exists() ? (eventSnap.data().eventName || eventSnap.data().name) : 'Unknown Event';

                results.push({
                    id: cDoc.id,
                    ...cData,
                    eventName,
                    participantName: p.name
                });
            }
        }

        return results.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    },

    async getCertificatesByStudentAndEvent(identifier, eventId) {
        if (!identifier || !eventId) return [];

        const attendeeCollection = collection(db, 'attendees');

        // Search by Email + eventId
        const qEmail = query(attendeeCollection,
            where('email', '==', identifier),
            where('eventId', '==', eventId)
        );
        const emailSnap = await getDocs(qEmail);

        // Search by PRN + eventId
        const qPrn = query(attendeeCollection,
            where('prn', '==', identifier),
            where('eventId', '==', eventId)
        );
        const prnSnap = await getDocs(qPrn);

        const participants = [];
        emailSnap.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));
        prnSnap.forEach(doc => {
            if (!participants.find(p => p.id === doc.id)) {
                participants.push({ id: doc.id, ...doc.data() });
            }
        });

        if (participants.length === 0) return [];

        const results = [];
        for (const p of participants) {
            const certQ = query(collection(db, 'certificates'),
                where('participantId', '==', p.id),
                where('eventId', '==', eventId)
            );
            const certSnap = await getDocs(certQ);

            for (const cDoc of certSnap.docs) {
                const cData = cDoc.data();
                const eventRef = doc(db, 'events', eventId);
                const eventSnap = await getDoc(eventRef);
                const eventName = eventSnap.exists() ? (eventSnap.data().eventName || eventSnap.data().name) : 'Unknown Event';

                results.push({
                    id: cDoc.id,
                    ...cData,
                    eventName,
                    participantName: p.name
                });
            }
        }

        return results;
    }
};
