// dashboard.js

// Fetch the Chart.js library dynamically
function loadChartJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            if (window.Chart) {
                resolve(window.Chart);
            } else {
                reject(new Error('Chart.js was loaded, but Chart object is not defined.'));
            }
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Fetch the Chart.js datalabels plugin dynamically
function loadChartJsDatalabels() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0';
        script.onload = () => {
            if (window.Chart && window.Chart.register) {
                // Resolve with the datalabels plugin
                resolve();
            } else {
                reject(new Error('Chart.js datalabels plugin was loaded, but not correctly defined.'));
            }
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Your existing dashboard logic
async function initializeDashboard() {
    try {
        const Chart = await loadChartJs(); // Await and get Chart
        await loadChartJsDatalabels();

        // Chart.js is now loaded, you can use it here.

        const openBtn = document.querySelector(".open-btn");
        const closeBtn = document.querySelector(".close-btn");
        const sidebar = document.querySelector(".sidebar");
        const navLinks = document.querySelectorAll(".nav-links a");
        const fulfillmentCtx = document
            .querySelector(".fulfillment-chart canvas")
            .getContext("2d");
        const VisitorsCtx = document
            .querySelector(".visitors-chart canvas")
            .getContext("2d");
        // Add Radial Chart
        const radialCtx = document
            .querySelector(".radial-chart canvas") // Get the context from the canvas in the HTML
            .getContext("2d");

        // open sidebar
        openBtn.addEventListener("click", function () {
            sidebar.classList.add("open");
        });

        // close sidebar
        closeBtn.addEventListener("click", function () {
            sidebar.classList.remove("open");
        });

        // control active nav-link
        navLinks.forEach((navLink) => {
            navLink.addEventListener("click", function () {
                navLinks.forEach((l) => l.classList.remove("active"));
                this.classList.add("active");
            });
        });

        // customer fulfillment chart
        // create linear gradient for first dataset
        const gradient1 = fulfillmentCtx.createLinearGradient(0, 0, 0, 200);
        gradient1.addColorStop(0, "#f2c8ed");
        gradient1.addColorStop(1, "#21222d");

        // create linear gradient for second dataset
        const gradient2 = fulfillmentCtx.createLinearGradient(0, 0, 0, 200);
        gradient2.addColorStop(0, "#a9dfd8");
        gradient2.addColorStop(1, "#21222d");

        const fulfillmentChart = new Chart(fulfillmentCtx, { // Use the Chart object
            type: "line",
            data: {
                labels: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31"],
                datasets: [
                    {
                        label: "This month",
                        data: [40, 43, 50, 28, 32, 38, 36, 42, 40, 36, 55],
                        borderColor: "#f2c8ed",
                        backgroundColor: gradient1,
                        fill: true,
                        pointRadius: 3,
                    },
                    {
                        label: "Last month",
                        data: [72, 60, 62, 68, 55, 56, 68, 66, 52, 55, 90],
                        borderColor: "#a9dfd8",
                        backgroundColor: gradient2,
                        fill: true,
                        pointRadius: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });

        // create linear gradient for first dataset
        const visitorsGradient = fulfillmentCtx.createLinearGradient(0, 0, 0, 400);
        visitorsGradient.addColorStop(0, "#a9dfd8");
        visitorsGradient.addColorStop(1, "#21222d");

        const visitorsChart = new Chart(VisitorsCtx, { // Use the Chart object
            type: "line",
            data: {
                labels: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                ],
                datasets: [
                    {
                        label: "New Visitors",
                        data: [60, 95, 450, 250, 350, 500, 280, 420, 380, 270, 120, 320],
                        borderColor: "#a9dfd8",
                        backgroundColor: visitorsGradient,
                        fill: true,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#ccc",
                        },
                    },
                    x: {
                        ticks: {
                            color: "#ccc",
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });

        const radialGradient = radialCtx.createLinearGradient(0, 0, 0, 400);
        // radialGradient.addColorStop(0, "#a9dfd8");
        // radialCtx.addColorStop(1, "#21222d");
        const radialChart = new Chart(radialCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    label: 'Completion',
                    data: [80, 20],
                    backgroundColor: [
                        '#45d9c6',
                        '#21222d',
                    ],
                    borderWidth: 0,
                }]
            },
            options: {
                rotation: 10,
                circumference: 360,
                cutout: '65%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    // Add this block for the percentage text
                    tooltip: {
                        enabled: true, // Disable tooltips
                    },
                    doughnutlabel: {
                        labels: {
                            center: {
                                text: 'Total: ' + 80, // Replace totalValue with the actual value
                                font: {
                                    size: 24,
                                },
                                color: 'white'
                            },
                        },
                    },
                },
                elements: {
                    arc: {
                        borderWidth: 0,
                    },
                },
            },
        });

    } catch (error) {
        console.error('Failed to load Chart.js or initialize dashboard:', error);
        // Handle the error appropriately (e.g., display an error message to the user)
    }
}

// Call the initialization function when the script is loaded
initializeDashboard();


// Navbar
// PROFILE DROPDOWN
const profile = document.querySelector('.right-nav .profile');
const imgProfile = profile.querySelector('.right-nav .profile img');
const dropdownProfile = profile.querySelector('.profile-link');

imgProfile.addEventListener('click', function () {
    dropdownProfile.classList.toggle('show');
})


// MENU
const allMenu = document.querySelectorAll('main .content-data .head .menu');

allMenu.forEach(item => {
    const icon = item.querySelector('.icon');
    const menuLink = item.querySelector('.menu-link');

    icon.addEventListener('click', function () {
        menuLink.classList.toggle('show');
    })
})


window.addEventListener('click', function (e) {
    if (e.target !== imgProfile) {
        if (e.target !== dropdownProfile) {
            if (dropdownProfile.classList.contains('show')) {
                dropdownProfile.classList.remove('show');
            }
        }
    }

    allMenu.forEach(item => {
        const icon = item.querySelector('.icon');
        const menuLink = item.querySelector('.menu-link');

        if (e.target !== icon) {
            if (e.target !== menuLink) {
                if (menuLink.classList.contains('show')) {
                    menuLink.classList.remove('show')
                }
            }
        }
    })
})


// PROGRESSBAR
const allProgress = document.querySelectorAll('main .card .progress');

allProgress.forEach(item => {
    item.style.setProperty('--value', item.dataset.value)
})


// APEXCHART
const options = {
    series: [{
        name: 'series1',
        data: [31, 40, 28, 51, 42, 109, 100]
    }, {
        name: 'series2',
        data: [11, 32, 45, 32, 34, 52, 41]
    }],
    chart: {
        height: 350,
        type: 'area'
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth'
    },
    xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
    },
    tooltip: {
        x: {
            format: 'dd/MM/yy HH:mm'
        },
    },
};

const chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();