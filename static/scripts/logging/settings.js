/**
 * Settings Manager - Handles user preferences and application settings
 */
class SettingsManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        
        // Initialize with default values if not set
        if (!localStorage.getItem('calorieGoal')) {
            localStorage.setItem('calorieGoal', '3000');
        }
        if (!localStorage.getItem('proteinGoal')) {
            localStorage.setItem('proteinGoal', '150');
        }
        if (!localStorage.getItem('carbsGoal')) {
            localStorage.setItem('carbsGoal', '300');
        }
        if (!localStorage.getItem('fatGoal')) {
            localStorage.setItem('fatGoal', '65');
        }
        if (!localStorage.getItem('waterGoal')) {
            localStorage.setItem('waterGoal', '8');
        }
        
        // Initialize theme
        this.initializeTheme();
        
        // Setup event listeners for settings
        this.setupEventListeners();
        
        // Initialize toasts container
        this.initializeToasts();
    }
    
    /**
     * Initialize theme based on localStorage or system preference
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // Apply theme
        if (savedTheme) {
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
            
            // Update icon
            if (savedTheme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
        
        // Add event listener to theme toggle button
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            if (newTheme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
            
            this.showToast(`Switched to ${newTheme} theme`, 'info');
        });
    }
    
    /**
     * Setup event listeners for settings
     */
    setupEventListeners() {
        // Settings form submission
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Save settings
            const calorieGoal = document.getElementById('settingsCalorieGoal').value;
            const proteinGoal = document.getElementById('settingsProteinGoal').value;
            const carbsGoal = document.getElementById('settingsCarbsGoal').value;
            const fatGoal = document.getElementById('settingsFatGoal').value;
            const waterGoal = document.getElementById('settingsWaterGoal').value;
            
            localStorage.setItem('calorieGoal', calorieGoal);
            localStorage.setItem('proteinGoal', proteinGoal);
            localStorage.setItem('carbsGoal', carbsGoal);
            localStorage.setItem('fatGoal', fatGoal);
            localStorage.setItem('waterGoal', waterGoal);
            
            // Update the application
            app.chartManager.updateChart(app.storageManager.getTotalCalories(app.currentDisplayDate));
            app.statisticsManager.updateNutritionSummary(app.currentDisplayDate);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal.hide();
            
            // Show success message
            this.showToast('Settings saved successfully', 'success');
        });
        
        // Open settings modal - load current settings
        document.getElementById('settingsModal').addEventListener('show.bs.modal', () => {
            document.getElementById('settingsCalorieGoal').value = localStorage.getItem('calorieGoal') || '3000';
            document.getElementById('settingsProteinGoal').value = localStorage.getItem('proteinGoal') || '150';
            document.getElementById('settingsCarbsGoal').value = localStorage.getItem('carbsGoal') || '300';
            document.getElementById('settingsFatGoal').value = localStorage.getItem('fatGoal') || '65';
            document.getElementById('settingsWaterGoal').value = localStorage.getItem('waterGoal') || '8';
        });
        
        // Quick add functionality
        document.querySelectorAll('.quick-add-menu .dropdown-item').forEach(item => {
            if (!item.dataset.food) return; // Skip if not a food item
            
            item.addEventListener('click', (e) => {
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
                app.storageManager.addFoodEntry(foodEntry, app.currentDisplayDate);
                
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
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
                localStorage.clear();
                
                // Reinitialize with default values
                localStorage.setItem('calorieGoal', '3000');
                localStorage.setItem('proteinGoal', '150');
                localStorage.setItem('carbsGoal', '300');
                localStorage.setItem('fatGoal', '65');
                localStorage.setItem('waterGoal', '8');
                localStorage.setItem('foodHistory', JSON.stringify({}));
                localStorage.setItem('foodDatabase', JSON.stringify([]));
                localStorage.setItem('storeDatabase', JSON.stringify([]));
                
                // Show success message
                this.showToast('All data has been cleared', 'warning');
                
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
    exportData() {
        const exportData = {
            calorieGoal: localStorage.getItem('calorieGoal'),
            proteinGoal: localStorage.getItem('proteinGoal'),
            carbsGoal: localStorage.getItem('carbsGoal'),
            fatGoal: localStorage.getItem('fatGoal'),
            waterGoal: localStorage.getItem('waterGoal'),
            foodHistory: JSON.parse(localStorage.getItem('foodHistory')),
            foodDatabase: JSON.parse(localStorage.getItem('foodDatabase')),
            storeDatabase: JSON.parse(localStorage.getItem('storeDatabase')),
            streak: localStorage.getItem('streak'),
            theme: localStorage.getItem('theme')
        };
        
        // Convert to JSON string
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `nutritrack_export_${new Date().toISOString().slice(0, 10)}.json`;
        
        // Click the link to download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Show success message
        this.showToast('Data exported successfully', 'success');
    }
    
    /**
     * Import data from a JSON file
     * @param {File} file - The JSON file to import
     */
    importData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data
                if (!importedData.foodHistory) {
                    throw new Error('Invalid data format');
                }
                
                // Import all data
                if (importedData.calorieGoal) localStorage.setItem('calorieGoal', importedData.calorieGoal);
                if (importedData.proteinGoal) localStorage.setItem('proteinGoal', importedData.proteinGoal);
                if (importedData.carbsGoal) localStorage.setItem('carbsGoal', importedData.carbsGoal);
                if (importedData.fatGoal) localStorage.setItem('fatGoal', importedData.fatGoal);
                if (importedData.waterGoal) localStorage.setItem('waterGoal', importedData.waterGoal);
                if (importedData.foodHistory) localStorage.setItem('foodHistory', JSON.stringify(importedData.foodHistory));
                if (importedData.foodDatabase) localStorage.setItem('foodDatabase', JSON.stringify(importedData.foodDatabase));
                if (importedData.storeDatabase) localStorage.setItem('storeDatabase', JSON.stringify(importedData.storeDatabase));
                if (importedData.streak) localStorage.setItem('streak', importedData.streak);
                if (importedData.theme) localStorage.setItem('theme', importedData.theme);
                
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
