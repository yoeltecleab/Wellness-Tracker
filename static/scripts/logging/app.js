/**
 * Main Application Class
 */
class FoodIntakeApp {
    constructor() {
        // Initialize managers
        this.storageManager = new StorageManager();


        // Add a small delay to ensure DOM is fully loaded
        setTimeout(async () => {
            this.chartManager = new ChartManager(this.storageManager);
            this.confettiManager = new ConfettiManager();
            this.statisticsManager = new StatisticsManager(this.storageManager);
            this.settingsManager = new SettingsManager(this.storageManager);
            this.waterTrackingManager = new WaterTrackingManager(this.storageManager);
            new FormManager(this.storageManager);

            // Current date being displayed (default to today)
            this.currentDisplayDate = new Date();

            // Initialize the app
            await this.initApp();

            // Hide loading overlay
            this.hideLoadingOverlay();
        }, 5);

        // Show loading overlay
        this.showLoadingOverlay();
    }

    /**
     * Shows the loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    /**
     * Hides the loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    /**
     * Initializes the application
     */
    async initApp() {
        // Setup date navigation
        await this.setupDateNavigation();

        // Update UI for the current date
        await this.updateCurrentDateDisplay();
        await this.refreshUI();

        // Setup delete functionality for food log
        await this.setupFoodLogDeletion();
    }

    /**
     * Sets up date navigation buttons
     */
    async setupDateNavigation() {
        const prevDay = document.getElementById('prevDay');
        const nextDay = document.getElementById('nextDay');
        const currentDay = document.getElementById('currentDay');

        if (prevDay) {
            prevDay.addEventListener('click', async () => {
                await this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() - 1);
                await this.updateCurrentDateDisplay();
                await this.refreshUI();
            });
        }

        if (nextDay) {
            nextDay.addEventListener('click', () => {
                // Don't allow navigating to future dates
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (this.currentDisplayDate < new Date(tomorrow.setHours(0, 0, 0, 0))) {
                    this.currentDisplayDate.setDate(this.currentDisplayDate.getDate() + 1);
                    this.updateCurrentDateDisplay();
                    this.refreshUI();
                }
            });
        }

        if (currentDay) {
            currentDay.addEventListener('click', () => {
                this.currentDisplayDate = new Date();
                this.updateCurrentDateDisplay();
                this.refreshUI();
            });
        }
    }

    /**
     * Updates the current date display
     */
    updateCurrentDateDisplay() {
        const currentDateElem = document.getElementById('currentDate');
        if (!currentDateElem) return;

        const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        currentDateElem.textContent = this.currentDisplayDate.toLocaleDateString(undefined, options);

        // Disable next day button if we're on today
        const nextDayBtn = document.getElementById('nextDay');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentDate = new Date(this.currentDisplayDate);
        currentDate.setHours(0, 0, 0, 0);

        if (nextDayBtn) {
            nextDayBtn.disabled = currentDate.getTime() === today.getTime();
        }

        // Highlight today button if we're on today
        const todayBtn = document.getElementById('currentDay');
        if (todayBtn) {
            if (currentDate.getTime() === today.getTime()) {
                todayBtn.classList.remove('btn-outline-info');
                todayBtn.classList.add('btn-primary');
            } else {
                todayBtn.classList.remove('btn-primary');
                todayBtn.classList.add('btn-outline-info');
            }
        }
    }

    /**
     * Refreshes the UI with current data
     */
    async refreshUI() {
        await this.updateFoodLog();
        await this.updateCalorieData();
        await this.statisticsManager.updateNutritionSummary(this.currentDisplayDate);
        await this.statisticsManager.updateStatCards(this.currentDisplayDate);
    }

    /**
     * Updates the food log table
     */
    async updateFoodLog() {
        const foodLogTable = document.getElementById('foodLogTable');
        const emptyLogMessage = document.getElementById('emptyLogMessage');

        if (!foodLogTable || !emptyLogMessage) return;

        const foodEntries = await this.storageManager.getFoodEntries(this.currentDisplayDate);

        // Clear existing entries
        foodLogTable.innerHTML = '';

        // Show or hide empty message
        if (foodEntries['length'] === 0) {
            emptyLogMessage.style.display = 'block';
            return;
        } else {
            emptyLogMessage.style.display = 'none';
        }

        // Sort entries by timestamp (newest first)
        foodEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Add entries to the table
        foodEntries.forEach(entry => {
            const row = document.createElement('tr');

            // Create health rating indicator
            const healthRatingIndicator = document.createElement('span');
            healthRatingIndicator.className = `health-rating-indicator health-rating-${entry.healthRating}`;

            // Get health rating text
            const healthRatingText = this.getHealthRatingText(entry.healthRating);

            // Create meal type badge
            const mealTypeBadge = document.createElement('span');
            mealTypeBadge.className = `badge ${this.getMealTypeBadgeClass(entry.mealType)}`;
            mealTypeBadge.textContent = this.capitalizeFirstLetter(entry.mealType);

            // Format the food entry
            let foodNameText = entry.foodName;
            if (entry.purchased) {
                foodNameText += ` <small class="text-muted">(from ${entry.store})</small>`;
            }

            // Add nutrition info if available
            let nutritionInfo = '';
            if (entry.protein || entry.carbs || entry.fat) {
                nutritionInfo = `<div class="small text-muted mt-1">`;
                if (entry.protein) nutritionInfo += `<span class="me-2">P: ${entry.protein}g</span>`;
                if (entry.carbs) nutritionInfo += `<span class="me-2">C: ${entry.carbs}g</span>`;
                if (entry.fat) nutritionInfo += `<span>F: ${entry.fat}g</span>`;
                nutritionInfo += `</div>`;
            }

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-sm btn-outline-danger';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.dataset.entryId = entry.id;

            // Add all content to the row
            row.innerHTML = `
                <td>${foodNameText}${nutritionInfo}</td>
                <td>${entry.calories}</td>
                <td>${mealTypeBadge.outerHTML}</td>
                <td>${healthRatingIndicator.outerHTML} ${healthRatingText}</td>
                <td></td>
            `;

            // Add delete button to the last cell
            row.lastElementChild.appendChild(deleteButton);

            // Add tooltip with notes if present
            if (entry.notes) {
                row.setAttribute('data-bs-toggle', 'tooltip');
                row.setAttribute('data-bs-placement', 'top');
                row.setAttribute('title', entry.notes);
            }

            foodLogTable.appendChild(row);
        });

        // Initialize tooltips
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    /**
     * Updates calorie data and chart
     */
    async updateCalorieData() {
        const totalCalories = await this.storageManager.getTotalCalories(this.currentDisplayDate);

        // Update the chart if it exists
        if (this.chartManager && this.chartManager.chart) {
            await this.chartManager.updateChart(totalCalories);

            // Check if we should trigger confetti (only for today)
            const today = new Date();
            const isToday = this.currentDisplayDate.toDateString() === today.toDateString();

            if (isToday && this.confettiManager) {
                this.confettiManager.checkAndTrigger(totalCalories, this.calorieGoal);
            }
        }
    }

    /**
     * Sets up deletion functionality for food log entries
     */
    setupFoodLogDeletion() {
        const foodLogTable = document.getElementById('foodLogTable');
        if (!foodLogTable) return;

        foodLogTable.addEventListener('click', async (e) => {
            // Check if the click was on a delete button
            window.deleteButton = e.target.closest('.btn-outline-danger');
            if (!deleteButton) return;

            const entryId = deleteButton.dataset.entryId;

            if (confirm('Are you sure you want to delete this food entry?')) {
                await this.storageManager.removeFoodEntry(entryId, this.currentDisplayDate);
                await this.refreshUI();

                // Show notification
                this.settingsManager.showToast('Food entry deleted successfully', 'info');
            }
        });
    }

    /**
     * Gets the text representation of a health rating
     * @param {string} rating - Health rating (1, 2, or 3)
     * @returns {string} - Text representation
     */
    getHealthRatingText(rating) {
        switch (rating) {
            case '1':
                return 'Unhealthy';
            case '2':
                return 'Neutral';
            case '3':
                return 'Healthy';
            default:
                return 'Unknown';
        }
    }

    /**
     * Gets the Bootstrap badge class for a meal type
     * @param {string} mealType - Meal type
     * @returns {string} - Badge class
     */
    getMealTypeBadgeClass(mealType) {
        switch (mealType) {
            case 'breakfast':
                return 'bg-primary';
            case 'lunch':
                return 'bg-success';
            case 'dinner':
                return 'bg-danger';
            case 'snack':
                return 'bg-warning';
            default:
                return 'bg-secondary';
        }
    }

    /**
     * Capitalizes the first letter of a string
     * @param {string} string - Input string
     * @returns {string} - String with first letter capitalized
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add Bootstrap script for tooltips and toasts
    const bootstrapScript = document.createElement('script');
    bootstrapScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
    bootstrapScript.onload = () => {
        // console.log('Bootstrap loaded successfully');
    };
    document.body.appendChild(bootstrapScript);

    // Initialize the app with a small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.app = new FoodIntakeApp();
    }, 3);
});

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

// SIDEBAR
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