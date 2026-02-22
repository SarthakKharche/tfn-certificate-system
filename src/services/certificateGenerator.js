import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { firebaseService } from './firebaseService';

const CURSIVE_FONT_URL = 'https://fonts.gstatic.com/s/greatvibes/v18/RWmMoKWR9v4ksMfaWd_JN-XCg6UKDXlq.ttf';
let cursiveFontBytes = null;

async function loadCursiveFont() {
    if (cursiveFontBytes) return cursiveFontBytes;
    try {
        const resp = await fetch(CURSIVE_FONT_URL);
        cursiveFontBytes = await resp.arrayBuffer();
        return cursiveFontBytes;
    } catch (err) {
        console.error('Failed to load cursive font:', err);
        return null; // Fallback to standard font
    }
}

export const certificateGenerator = {
    async generate(participant, event, eventId, customTemplateData = null, customPositions = null, customMimeType = null) {
        if (!event || (!event.templateData && !customTemplateData)) {
            throw new Error('No certificate template found for this event');
        }

        const dataToUse = customTemplateData || event.templateData;
        const templateBytes = Uint8Array.from(atob(dataToUse), c => c.charCodeAt(0));

        let mime = event.templateType || '';
        if (customTemplateData) {
            mime = customMimeType || (dataToUse.startsWith('iVBORw0KGgo') ? 'image/png' : 'image/jpeg');
        }

        let pdfDoc, firstPage, width, height;

        if (mime === 'application/pdf') {
            pdfDoc = await PDFDocument.load(templateBytes);
            const pages = pdfDoc.getPages();
            firstPage = pages[0];
            const size = firstPage.getSize();
            width = size.width;
            height = size.height;
        } else {
            // Image template (PNG/JPG) → embed in a new PDF
            pdfDoc = await PDFDocument.create();
            let img;
            if (mime.includes('png')) {
                img = await pdfDoc.embedPng(templateBytes);
            } else {
                img = await pdfDoc.embedJpg(templateBytes);
            }
            const imgDims = img.scale(1);
            width = imgDims.width;
            height = imgDims.height;
            firstPage = pdfDoc.addPage([width, height]);
            firstPage.drawImage(img, { x: 0, y: 0, width, height });
        }

        pdfDoc.registerFontkit(fontkit);

        // Load fonts
        const cursiveBytes = await loadCursiveFont();
        let cursiveFont;
        if (cursiveBytes) {
            cursiveFont = await pdfDoc.embedFont(cursiveBytes);
        }
        const sansFont = await pdfDoc.embedFont('Helvetica');
        const sansBoldFont = await pdfDoc.embedFont('Helvetica-Bold');

        const positions = customPositions || event.fieldPositions || {};

        // Helper to draw text based on % positions
        const drawField = (text, posKey, fontToUse) => {
            const pos = positions[posKey];
            if (!pos || !text) return;

            const isCursive = posKey === 'name';
            const font = fontToUse || (isCursive ? (cursiveFont || sansBoldFont) : sansBoldFont);

            const x = (pos.x / 100) * width;
            const y = height - ((pos.y / 100) * height);
            const fontSize = (pos.fontPct / 100) * width;

            const textWidth = font.widthOfTextAtSize(text, fontSize);

            firstPage.drawText(text, {
                x: x - (textWidth / 2),
                y: y,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
            });
        };

        const formatDate = (raw) => {
            if (!raw) return '';
            try {
                const d = new Date(raw);
                if (isNaN(d.getTime())) return raw;
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (_) {
                return raw;
            }
        };

        drawField(participant.name, 'name', cursiveFont);
        drawField(participant.prn, 'prn', sansFont);
        drawField(event.eventName || event.name, 'eventName', sansBoldFont);
        drawField(event.date ? formatDate(event.date) : '', 'date', sansFont);

        const pdfBase64 = await pdfDoc.saveAsBase64();

        // Save to Firestore
        await firebaseService.saveCertificateRecord({
            participantId: participant.id,
            eventId: eventId,
            pdfData: pdfBase64,
            generatedAt: new Date().toISOString()
        });

        return pdfBase64;
    }
};
