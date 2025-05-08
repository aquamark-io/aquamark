// Aquamark Chrome Extension: watermark.js

// Import PDFLib for watermarking
import { PDFDocument } from 'pdf-lib';

// Listen for incoming watermark tasks
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'WATERMARK_PDF') {
        const { pdfUrl, logoUrl } = request.data;
        console.log('Received for watermarking:', pdfUrl);

        try {
            // Fetch the PDF
            const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

            // Fetch the logo image
            const logoBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());

            // Load the PDF and image
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const logoImage = await pdfDoc.embedPng(logoBytes);

            // Get dimensions
            const pages = pdfDoc.getPages();
            const { width, height } = pages[0].getSize();

            // Calculate scale
            const scale = 0.3;
            const logoWidth = logoImage.width * scale;
            const logoHeight = logoImage.height * scale;

            // Loop through pages and add watermark
            pages.forEach((page) => {
                const xOffset = (width - logoWidth) / 2;
                const yOffset = (height - logoHeight) / 2;
                page.drawImage(logoImage, {
                    x: xOffset,
                    y: yOffset,
                    width: logoWidth,
                    height: logoHeight,
                    opacity: 0.3
                });
            });

            // Serialize the document
            const pdfBytesFinal = await pdfDoc.save();

            // Trigger download
            const blob = new Blob([pdfBytesFinal], { type: 'application/pdf' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'Aquamark_Watermarked.pdf';
            a.click();
            URL.revokeObjectURL(downloadUrl);

            console.log('Watermarking complete!');
            sendResponse({ success: true, message: 'Watermarking complete!' });
        } catch (error) {
            console.error('Error during watermarking:', error);
            sendResponse({ success: false, message: 'Error during watermarking.' });
        }
    }
    return true;
});
