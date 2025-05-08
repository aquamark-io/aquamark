document.getElementById('fetchEmail').addEventListener('click', async () => {
    chrome.identity.getProfileUserInfo((userInfo) => {
        if (userInfo.email) {
            document.getElementById('email').innerText = `Logged in as: ${userInfo.email}`;
            console.log("User Email:", userInfo.email);
        } else {
            document.getElementById('email').innerText = "Could not fetch email.";
            console.error("Failed to get user email.");
        }
    });
});
