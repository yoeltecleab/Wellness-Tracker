// let menu = document.querySelector('#menu-icon');
// let navlist = document.querySelector('.navlist');
//
// menu.onclick = () => {
//     menu.classList.toggle('bx-x');
//     navlist.classList.toggle('open');
// };
//
// const sr = ScrollReveal ({
//     distance: '65px',
//     duration: 2600,
// delay: 450,
// reset: true
// });
//
// sr.reveal('.hero-text', {delay:200, origin:'top'});
// sr.reveal('.hero-img', {delay:450, origin:'top'});
// sr.reveal('.icons', {delay:500, origin:'left'});
// sr.reveal('.scroll-down', {delay:500, origin:'right'});

const demoBtn = document.getElementById('demo-user-button');
const apiUrl = 'http://localhost:8000/api/check-demo-user/'; // Replace with your actual API endpoint
const demoUrl = 'http://localhost:8000/demo';
const loginUrl = 'http://localhost:8000/signin/';
const loadingContainerId = 'loading-container'; // ID of the element to show loading

demoBtn.addEventListener('click', async () => {
    try {
        // Show loading scene immediately
        showLoading();

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.exists) {
            const confirmed = confirm('Are you sure you want to proceed? A demo user already exists. ' +
                'Continuing will erase all data and create a new demo user');
            if (confirmed) {
                // Initiate the background request to the demo URL
                fetch(demoUrl, {
                    method: 'GET', // Or 'POST' depending on your demo URL
                    // Add any necessary headers or body here
                }).then(demoResponse => {
                    if (!demoResponse.ok) {
                        console.error('Error fetching demo URL in the background:', demoResponse.status);
                        // Optionally show an error message to the user
                    }
                    // We don't need to process the demoResponse body unless needed
                }).catch(error => {
                    console.error('Error fetching demo URL in the background:', error);
                    // Optionally show an error message to the user
                });

                // Wait for a few seconds (simulating background work)
                await delay(3000); // 3 seconds

                // Redirect to the login page
                window.location.href = loginUrl;
            } else {
                // User cancelled, hide loading
                hideLoading();
            }
        } else {
            // Data was not true, handle accordingly (e.g., show a message)
            alert('Operation not allowed based on the data.');
            hideLoading();
        }

    } catch (error) {
        console.error('There was an error:', error);
        alert('An error occurred during the process.');
        hideLoading();
    }
});

function showLoading() {
    const loadingContainer = document.getElementById(loadingContainerId);
    if (loadingContainer) {
        loadingContainer.style.display = 'block'; // Or any other way to show your loading element
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