const demoBtn = document.getElementById('demo-user-button');
const checkDemoUserApiUrl = 'http://localhost:8000/api/check-demo-user/'; // API to check if demo user exists
const createDemoUserApiUrl = 'http://localhost:8000/demo/'; // API to create demo user
const loginUrl = 'http://localhost:8000/signin/';
const loadingContainerId = 'loading-container'; // ID of the element to show loading

demoBtn.addEventListener('click', async () => {
    try {
        // Show loading scene immediately
        showLoading();

        const checkResponse = await fetch(checkDemoUserApiUrl);
        if (!checkResponse.ok) {
            throw new Error(`HTTP error checking demo user: status ${checkResponse.status}`);
        }
        const checkData = await checkResponse.json();
        const demoUserExists = checkData.exists; // Assuming the API returns { exists: true/false }

        if (demoUserExists) {
            const confirmed = confirm('A demo user already exists. Continuing will erase all data and create a new demo user. Are you sure?');
            if (confirmed) {
                await createNewDemoUser();
            } else {
                hideLoading();
            }
        } else {
            const confirmedCreate = confirm('No demo user exists. Do you want to create a new demo user?');
            if (confirmedCreate) {
                await createNewDemoUser();
            } else {
                hideLoading();
            }
        }

    } catch (error) {
        console.error('There was an error:', error);
        alert('An error occurred during the process.');
        hideLoading();
    }
});

async function createNewDemoUser() {
    try {
        // Initiate the request to create the demo user
        const createResponse = await fetch(createDemoUserApiUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
            // Add any necessary data to the request
            // Or 'GET' depending on your API
            // Add any necessary headers or body here
        });

        if (!createResponse.ok) {
            console.error('Error creating demo user:', createResponse.status);
            alert('Failed to create demo user.');
            hideLoading();
            return;
        }

        // Wait for a few seconds (simulating background work)
        await delay(1000); // 1 second

        // Redirect to the login page
        window.location.href = loginUrl;

    } catch (error) {
        console.error('Error creating demo user:', error);
        alert('An error occurred while creating the demo user.');
        hideLoading();
    }
}

function showLoading() {
    const loadingContainer = document.getElementById(loadingContainerId);
    if (loadingContainer) {
        loadingContainer.style.display = 'block';
    } else {
        console.warn(`Loading container with ID '${loadingContainerId}' not found.`);
    }
}

function hideLoading() {
    const loadingContainer = document.getElementById(loadingContainerId);
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getCsrfToken() {
    const name = 'csrftoken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}