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
            if (window.Chart) {
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
function initializeDashboard() {
    try {


        const openBtn = document.querySelector(".open-btn");
        const closeBtn = document.querySelector(".close-btn");
        const sidebar = document.querySelector(".sidebar");
        const navLinks = document.querySelectorAll(".nav-links a");

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

// --------------------------------------- UPDATING DASHBOARD FROM API ---------------------------------------

import {fetchDataFromApi} from './utils.js';

async function updateUI() {

    const Chart = await loadChartJs(); // Await and get Chart
    await loadChartJsDatalabels();

    let today_intake_endpoint = "http://localhost:8000/api/todays_intake/"
    let top_n_foods_endpoint = "http://localhost:8000/api/top_n_foods/20"
    let top_n_stores_endpoint = "http://localhost:8000/api/top_n_stores/10"
    let weekly_comparison_endpoint = "http://localhost:8000/api/weekly_comparison/"
    let yearly_water_chart_endpoint = "http://localhost:8000/api/yearly_water_chart/"
    let today_water_chart_endpoint = "http://localhost:8000/api/today_water_chart/"

    const todays_intake = await fetchDataFromApi(today_intake_endpoint);
    const top_n_foods = await fetchDataFromApi(top_n_foods_endpoint);
    const top_n_stores = await fetchDataFromApi(top_n_stores_endpoint);
    const weekly_comparison = await fetchDataFromApi(weekly_comparison_endpoint);
    const yearly_water_chart = await fetchDataFromApi(yearly_water_chart_endpoint);
    window.today_water_chart = await fetchDataFromApi(today_water_chart_endpoint);


    // top left card
    if (todays_intake) {
        document.querySelector(".sales-detail.sales-total h3").innerText = todays_intake["today_water_intake"] + " ml";
        document.querySelector(".sales-detail.sales-total span").innerText = (todays_intake["water_change_percentage"] >= 0 ? "+" : "") +
            todays_intake["water_change_percentage"] + "% from yesterday";

        document.querySelector(".sales-detail.sales-orders h3").innerText = todays_intake["today_calorie_intake"] + " cal";
        document.querySelector(".sales-detail.sales-orders span").innerText = (todays_intake["calorie_change_percentage"] >= 0 ? "+" : "") +
            todays_intake["calorie_change_percentage"] + "% from yesterday";

        document.querySelector(".sales-detail.sales-products h3").innerText = todays_intake["today_healthy_food_count"];
        document.querySelector(".sales-detail.sales-products span").innerText = (todays_intake["healthy_food_change_percentage"] >= 0 ? "+" : "") +
            todays_intake["healthy_food_change_percentage"] + "% from yesterday";

        document.querySelector(".sales-detail.sales-customers h3").innerText = todays_intake["today_new_store_count"];
        document.querySelector(".sales-detail.sales-customers span").innerText = (todays_intake["new_store_change_percentage"] >= 0 ? "+" : "") +
            todays_intake["new_store_change_percentage"] + "% from yesterday";


    } else {
        document.querySelector(".sales-detail.sales-total span").innerText = "Error fetching data";
        document.querySelector(".sales-detail.sales-orders span").innerText = "Error fetching data";
        document.querySelector(".sales-detail.sales-products span").innerText = "Error fetching data";
        document.querySelector(".sales-detail.sales-customers span").innerText = "Error fetching data";
    }

    //top right card
    if (top_n_stores) {
        for (let store of top_n_stores) {
            document.querySelector(".nearest-locations table tbody").innerHTML += `
                <tr>
                    <td>${store["name"]}</td>
                    <td>${store["address"]}</td>
                    <td>
                        <div class="sales-volume sv-${store["id"]}">${store["visits"]}</div>
                    </td>
                </tr>
            `
            let volumeDiv = document.querySelector(".nearest-locations table tbody tr:last-child .sales-volume");
            volumeDiv.style.color = "var(--clr-yellow-500)";
            volumeDiv.style.borderColor = "var(--clr-yellow-500)";
            volumeDiv.style.backgroundColor = "rgba(252, 184, 89, 0.12)";
        }
    } else {
        document.querySelector(".nearest-locations table tbody").innerText = "Error fetching data";
    }

    // middle left card
    if (top_n_foods) {
        for (let food of top_n_foods) {
            document.querySelector(".top-products-details table tbody").innerHTML += `
                <tr>
                    <td>${food["id"]}</td>
                    <td>${food["name"]}</td>
                    <td>${food["max_calorie"]}</td>
                    <td>${food["min_calorie"]}</td>
                    <td>
                        <div class="sales-volume">${food["frequency"]}</div>
                    </td>
                </tr>
            `
            let volumeDiv = document.querySelector(".top-products-details table tbody tr:last-child .sales-volume");
            volumeDiv.style.color = "var(--clr-yellow-500)";
            volumeDiv.style.borderColor = "var(--clr-yellow-500)";
            volumeDiv.style.backgroundColor = "rgba(252, 184, 89, 0.12)";
        }
    } else {
        document.querySelector(".top-products-details table tbody").innerText = "Error fetching data";
    }

    // Add weekly comparison chart
    const fulfillmentCtx = document
        .querySelector(".fulfillment-chart canvas")
        .getContext("2d");

    // Add year summary chart
    const VisitorsCtx = document
        .querySelector(".visitors-chart canvas")
        .getContext("2d");

    // Add daily intake chart
    const radialCtx = document
        .querySelector(".radial-chart canvas") // Get the context from the canvas in the HTML
        .getContext("2d");

    // Weekly comparison chart - middle right card
    let list_days = []
    let this_week_data = []
    let last_week_data = []
    for (let i = 0; i < 7; i++) {
        list_days.push(weekly_comparison[1]['data'][i]['date'])
        this_week_data.push(weekly_comparison[1]['data'][i]['total'])
        last_week_data.push(weekly_comparison[4]['data'][i]['total'])
    }
    let this_week_total = weekly_comparison[2]['total'];
    let last_week_total = weekly_comparison[5]['total'];
    document.querySelector("body > div > main > section > div.card.top-products > div.chart.fulfillment-chart > div.labels > div:nth-child(1) > span")
        .innerText = this_week_total + " ml";
    document.querySelector("body > div > main > section > div.card.top-products > div.chart.fulfillment-chart > div.labels > div:nth-child(3) > span")
        .innerText = last_week_total + " ml";


    // create linear gradient for this week
    const gradient1 = fulfillmentCtx.createLinearGradient(0, 0, 0, 500);
    gradient1.addColorStop(0, "#09e826");
    gradient1.addColorStop(1, "rgba(33,34,45,0)");

    // create linear gradient for last week
    const gradient2 = fulfillmentCtx.createLinearGradient(0, 0, 0, 350);
    gradient2.addColorStop(0, "#fa04f5");
    gradient2.addColorStop(1, "#21222d");

    new Chart(fulfillmentCtx, { // Use the Chart object
        type: "line",
        data: {
            labels: list_days,
            datasets: [
                {
                    label: "This week",
                    data: this_week_data,
                    borderColor: "#f2c8ed",
                    backgroundColor: gradient1,
                    fill: true,
                    pointRadius: 5,
                },
                {
                    label: "Last week",
                    data: last_week_data,
                    borderColor: "#a9dfd8",
                    backgroundColor: gradient2,
                    fill: true,
                    pointRadius: 5,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: (Math.min(...(this_week_data.concat(last_week_data))) * 2 / 3),
                    ticks: {
                        color: '#02f8c9',
                    },
                },
                x: {
                    ticks: {
                        color: '#02f8c9',
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                    position: "top",
                    labels: {
                        color: "#ffffff",
                        font: {
                            // size: 12,
                        },
                    },
                },
            },
        },
    });


    // Yearly summary - bottom right card
    let list_months = []
    let this_year_data = []
    for (let i = 0; i < 12; i++) {
        list_months.push(yearly_water_chart["this_year_data"][i]['month'])
        this_year_data.push(yearly_water_chart["this_year_data"][i]['intake'])
    }
    let this_year_total = yearly_water_chart['total_this_year'];

    const visitorsGradient = VisitorsCtx.createLinearGradient(0, 0, 0, 400);
    visitorsGradient.addColorStop(1, "#09c6f3");
    visitorsGradient.addColorStop(0, "#1809ee");

    new Chart(VisitorsCtx, { // Use the Chart object
        type: "line",
        data: {
            labels: list_months,
            datasets: [
                {
                    label: "This year's intake",
                    data: this_year_data,
                    borderColor: "#08ee13",
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
                    min: (Math.min(...this_year_data) * 9 / 10),
                    ticks: {
                        color: '#02f8c9',
                    },
                },
                x: {
                    ticks: {
                        color: '#02f8c9',
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    position: "bottom",
                    text: "This year's intake: " + this_year_total + " ml",
                    color: "white",
                    font: {
                        size: 16,
                    },
                },
                legend: {
                    display: false,
                },
            },
        },
    });

    // daily water intake - bottom left card
    let todays_intake_value = today_water_chart['today_intake'];
    let last_week_same_day = today_water_chart['same_day_last_week_intake'];
    let change = today_water_chart['change'];
    let today_goal = today_water_chart['goal'];
    let remaining = today_goal - todays_intake_value > 0 ? today_goal - todays_intake_value : 0;

    console.log("Today's intake value: ", todays_intake_value);
    console.log("Last week same day: ", last_week_same_day);
    console.log("Change: ", change);
    console.log("Today's goal: ", today_goal);


    new Chart(radialCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                label: '',
                data: [todays_intake_value, remaining],
                backgroundColor: [],
                borderWidth: 0,
            }]
        },
        options: {
            rotation: 10,
            circumference: 360,
            cutout: '65%', // Ensures space in the middle
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: false},
                tooltip: {enabled: true},
            },
            elements: {
                arc: {borderWidth: 0}
            }
        },
        plugins: [{
            beforeDraw: function(chart) {
            let ctx = chart.ctx;
            let chartArea = chart.chartArea;
            if (!chartArea) return; // Prevent errors on initialization

            // Define gradient for first segment (Completed)
            let gradient1 = ctx.createLinearGradient(chartArea.left, chartArea.top, chartArea.right, chartArea.bottom);
            gradient1.addColorStop(0, "#047ef6"); // Start color (blue)
            gradient1.addColorStop(1, "#02f841"); // End color (green)

            // Define gradient for second segment (Remaining)
            let gradient2 = ctx.createLinearGradient(chartArea.left, chartArea.bottom, chartArea.right, chartArea.top);
            gradient2.addColorStop(0, "rgba(0,7,140,0)"); // Start color (pink)
            gradient2.addColorStop(1, "rgba(182,132,4,0)"); // End color (yellow)

            // Assign gradients to dataset
            chart.data.datasets[0].backgroundColor = [gradient1, gradient2];

            chart.update(); // Refresh the chart
        },
            afterDraw: function (chart) {
                let ctx = chart.ctx;
                let width = chart.width;
                let height = chart.height;
                let centerX = width / 2;
                let centerY = height / 2;

                ctx.save();
                ctx.font = 'bold 14px Arial'; // Set font size and style
                ctx.fillStyle = '#fff'; // Text color
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Array of lines
                let lines = ["GOAL: " + today_goal + " ml"]; // Replace with dynamic values
                if (todays_intake_value >= today_goal) {
                    lines.push("GOAL REACHED 🎉🎉🎉");
                    if (todays_intake_value > today_goal) {
                        lines.push("Over by " + (todays_intake_value - today_goal) + " ml");
                    }
                }
                let lineHeight = 18; // Adjust spacing between lines

                // Loop through each line and draw it
                lines.forEach((line, index) => {
                    ctx.fillText(line, centerX, centerY + (index * lineHeight) - (lineHeight * (lines.length - 1) / 2));
                });

                ctx.restore();
            }
        }]
    });
    document.querySelector("body > div > main > section > div.card.earnings > div.chart.earnings-chart > div:nth-child(2) > strong")
        .innerText = todays_intake_value + " ml";
    document.querySelector("body > div > main > section > div.card.earnings > div.chart.earnings-chart > div:nth-child(2) > p")
        .innerText = "Water intake " + change + "% " + (change < 0 ? "less" : "more") +
        " than same day of last week of " + last_week_same_day + " ml";
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", updateUI); // Call