// Aquamark Chrome Extension: background.js

// Import Supabase properly
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = 'https://dvzmnikrvkvgragzhrof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2em1uaWtydmt2Z3JhZ3pocm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njg5NzUsImV4cCI6MjA1OTU0NDk3NX0.FaHsjIRNlgf6YWbe5foz0kJFtCO4FuVFo7KVcfhKPEk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listen for messages from content.js
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'WATERMARK_PDF') {
        const { url } = request.data;
        console.log('Background received URL:', url);

        try {
            // Retrieve the user's logo from Supabase
            const userEmail = await getUserEmail();
            if (!userEmail) {
                console.error('User email not found.');
                sendResponse({ success: false, message: 'User email not found.' });
                return;
            }

            // Get the latest logo from Supabase
            const { data: filesList, error: listError } = await supabase.storage
                .from('logos')
                .list(userEmail);

            if (listError || !filesList.length) {
                console.error('Error retrieving logo:', listError);
                sendResponse({ success: false, message: 'Logo not found.' });
                return;
            }

            const latestLogo = filesList.sort((a, b) => b.created_at - a.created_at)[0];
            const { data } = supabase.storage.from('logos').getPublicUrl(`${userEmail}/${latestLogo.name}`);

            if (!data || !data.publicUrl) {
                console.error('Logo URL not found.');
                sendResponse({ success: false, message: 'Logo URL not found.' });
                return;
            }

            console.log('Logo URL:', data.publicUrl);
console.log('Watermark process initiated for:', url);

            // Pass the URL and logo to the next step (watermark.js)
            sendResponse({ success: true, logoUrl: data.publicUrl, pdfUrl: url });
        } catch (error) {
            console.error('Error in background script:', error);
            sendResponse({ success: false, message: 'Unexpected error.' });
        }
    }
    return true; // Indicates async response
});

async function getUserEmail() {
    return new Promise((resolve) => {
        chrome.identity.getProfileUserInfo((userInfo) => {
            if (userInfo.email) {
                resolve(userInfo.email);
            } else {
                resolve(null);
            }
        });
    });
}
