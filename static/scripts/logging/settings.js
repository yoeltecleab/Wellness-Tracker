/**
 * Settings Manager - Handles user preferences and application settings
 */
class SettingsManager {
    constructor(storageManager) {
        this.storageManager = storageManager;

        // Setup event listeners for settings
        this.setupEventListeners();

        // Initialize toasts container
        this.initializeToasts();
    }

    /**
     * Setup event listeners for settings
     */
    async setupEventListeners() {
        // Settings save button click
        document.getElementById('saveSettings').addEventListener('click', async () => {
            // Save settings
            const calorieGoal = document.getElementById('calorieGoalInput').value;
            const proteinGoal = document.getElementById('proteinGoalInput').value;
            const carbsGoal = document.getElementById('carbsGoalInput').value;
            const fatGoal = document.getElementById('fatGoalInput').value;
            const waterGoal = document.getElementById('waterGoalInput').value;

            const goals = {
                calorieGoal: parseInt(calorieGoal),
                proteinGoal: parseInt(proteinGoal),
                carbsGoal: parseInt(carbsGoal),
                fatGoal: parseInt(fatGoal),
                waterGoal: parseInt(waterGoal)
            }

            await this.storageManager.updateGoals(goals);

            // Update the application
            if(app.chartManager) {
                await app.chartManager.updateChart(await app.storageManager.getTotalCalories(app.currentDisplayDate));
            }
            if (app.statisticsManager) {
                await app.statisticsManager.updateNutritionSummary(app.currentDisplayDate);
            }

            // Update water tracking if it exists
            if (app.waterTrackingManager) {
                app.waterTrackingManager.waterGoal = parseInt(waterGoal);
                app.waterTrackingManager.updateWaterUI();
            }

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal.hide();

            // Show success message
            this.showToast('Settings saved successfully', 'success');
        });


        // Open settings modal - load current settings
        document.getElementById('settingsModal').addEventListener('show.bs.modal', async () => {
            const goal = await app.storageManager.getGoals();
            document.getElementById('calorieGoalInput').value = goal.calorieGoal;
            document.getElementById('proteinGoalInput').value = goal.proteinGoal;
            document.getElementById('carbsGoalInput').value = goal.carbsGoal;
            document.getElementById('fatGoalInput').value = goal.fatGoal;
            document.getElementById('waterGoalInput').value = goal.waterGoal;
        });

        // Quick add functionality
        document.querySelectorAll('.quick-add-menu .dropdown-item').forEach(item => {
            if (!item.dataset.food) return; // Skip if not a food item

            item.addEventListener('click', async (e) => {
                e.preventDefault();

                // Get data from item
                const foodName = item.dataset.food;
                const calories = parseInt(item.dataset.calories, 10);
                const healthRating = item.dataset.health;
                const mealType = item.dataset.meal;

                // Create food entry
                const foodEntry = {
                    foodName,
                    calories,
                    purchased: false,
                    store: '',
                    healthRating,
                    mealType,
                    notes: 'Quick add',
                    protein: 0, // Default values for quick add
                    carbs: 0,
                    fat: 0
                };

                // Add to storage
                await app.storageManager.addFoodEntry(foodEntry, app.currentDisplayDate);

                // Show success message
                this.showToast(`Added ${foodName} to your food log!`, 'success');

                // Update UI
                app.refreshUI();
            });
        });

        // Export data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Import data button
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        // Import file input change
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
            }
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
                await this.storageManager.clearData();
                // Refresh page
                window.location.reload();
            }
        });
    }

    /**
     * Initialize toast container
     */
    initializeToasts() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, info, warning, danger)
     */
    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');

        // Create toast element
        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');

        // Create toast content
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toastElement);

        // Create bootstrap toast instance
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Auto-remove after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    /**
     * Export data as a JSON file
     */
    async exportData() {
    try {
        const response = await fetch('http://localhost:8000/api/export-data/'); // Replace with your actual API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();

        const newWindow = window.open('http://localhost:8000/api/data', '_blank'); // Replace with the actual path to your HTML file

        if (newWindow) {
            // Wait for the new window to be loaded
            newWindow.onload = () => {
                // Pass the JSON data to the new window using localStorage
                newWindow.localStorage.setItem('exported_json_data', JSON.stringify(jsonData));
            };
        } else {
            this.showToast('Failed to open a new window.', 'error');
        }

        this.showToast('Data will be displayed in a new window.', 'success');

    } catch (error) {
        console.error('Error exporting data:', error);
        this.showToast(`Error exporting data: ${error.message}`, 'error');
    }
}


    /**
     * Import data from a JSON file
     * @param {File} file - The JSON file to import
     */
    importData(file) {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                await this.storageManager.importData(importedData);

                // Show success message
                this.showToast('Data imported successfully', 'success');

                // Refresh page
                window.location.reload();
            } catch (error) {
                this.showToast('Error importing data. Please check the file format.', 'danger');
                console.error('Import error', error);
            }
        };

        // Read the file
        reader.readAsText(file);
    }
}
