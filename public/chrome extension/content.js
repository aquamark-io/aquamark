// Aquamark Chrome Extension: content.js

// Inject 'Watermark with Aquamark' button next to Gmail PDF attachments
function injectButton() {
    const attachments = document.querySelectorAll("[data-tooltip='Download attachment']");
    attachments.forEach((attachment) => {
        if (!attachment.parentElement.querySelector('.aquamark-btn')) {
            const button = document.createElement('button');
            button.textContent = 'Watermark with Aquamark';
            button.classList.add('aquamark-btn');
            button.style.cssText = `
                background-color: #4d2c91;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                margin-left: 8px;
                cursor: pointer;
            `;

            // Append button after the attachment link
            attachment.parentElement.appendChild(button);

            // On click, initiate watermarking process
            button.addEventListener('click', async () => {
                const attachmentUrl = attachment.href;
                console.log('Watermark initiated for:', attachmentUrl);

                // Here we will send a message to background.js to start processing
                chrome.runtime.sendMessage({
                    action: 'WATERMARK_PDF',
                    data: { url: attachmentUrl }
                });
            });
        }
    });
}

// Run injection on DOMContentLoaded
window.addEventListener('DOMContentLoaded', injectButton);

// Monitor for DOM changes (Gmail is dynamically rendered)
const observer = new MutationObserver(injectButton);
observer.observe(document.body, { childList: true, subtree: true });

console.log('Aquamark button injection script loaded.');
