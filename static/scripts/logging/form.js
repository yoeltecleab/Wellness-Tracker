/**
 * Form Manager - Handles form interactions and autocomplete
 */
class FormManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.form = document.getElementById('foodEntryForm');
        this.foodNameInput = document.getElementById('foodName');
        this.purchasedCheckbox = document.getElementById('purchased');
        this.storeInput = document.getElementById('store');
        this.storeField = document.querySelector('.store-field');
        
        this.setupEventListeners();
        this.setupAutocomplete();
    }

    /**
     * Sets up all event listeners for the form
     */
    setupEventListeners() {
        // Toggle store field based on purchased checkbox
        this.purchasedCheckbox.addEventListener('change', () => {
            this.storeField.style.display = this.purchasedCheckbox.checked ? 'block' : 'none';
            if (!this.purchasedCheckbox.checked) {
                this.storeInput.value = '';
            }
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.handleFormSubmit();
            }
        });
        
        // Health rating stars
        document.querySelectorAll('.rating__input').forEach(input => {
            input.addEventListener('change', () => {
                const ratingText = document.querySelector('.health-rating-text');
                const ratingValue = document.querySelector('input[name="healthRating"]:checked').value;
                
                switch (ratingValue) {
                    case '1':
                        ratingText.textContent = 'Unhealthy';
                        break;
                    case '2':
                        ratingText.textContent = 'Neutral';
                        break;
                    case '3':
                        ratingText.textContent = 'Healthy';
                        break;
                    default:
                        ratingText.textContent = 'Select Health Rating';
                }
            });
        });
    }

    /**
     * Sets up autocomplete functionality for food and store inputs
     */
    setupAutocomplete() {
        // Food name autocomplete
        this.foodNameInput.addEventListener('input', () => {
            this.showAutocomplete(
                this.foodNameInput,
                document.getElementById('foodNameSuggestions'),
                this.storageManager.getFoodDatabase()
            );
        });
        
        // Store autocomplete
        this.storeInput.addEventListener('input', () => {
            this.showAutocomplete(
                this.storeInput,
                document.getElementById('storeSuggestions'),
                this.storageManager.getStoreDatabase()
            );
        });
        
        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.matches('.autocomplete-container input')) {
                document.querySelectorAll('.autocomplete-items').forEach(list => {
                    list.style.display = 'none';
                });
            }
        });
    }

    /**
     * Shows autocomplete suggestions
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} suggestionsList - Suggestions container element
     * @param {Array} items - Array of suggestion items
     */
    showAutocomplete(input, suggestionsList, items) {
        const value = input.value.toLowerCase();
        
        // Clear previous suggestions
        suggestionsList.innerHTML = '';
        suggestionsList.style.display = 'none';
        
        if (!value) return;
        
        // Filter items based on input value
        const matchingItems = items.filter(item => 
            item.toLowerCase().includes(value)
        );
        
        if (matchingItems.length === 0) return;
        
        // Create suggestion elements
        matchingItems.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item;
            div.addEventListener('click', () => {
                input.value = item;
                suggestionsList.style.display = 'none';
                
                // If it's a food item, try to auto-fill calories
                if (input === this.foodNameInput) {
                    this.tryAutoFillCalories(item);
                }
            });
            suggestionsList.appendChild(div);
        });
        
        suggestionsList.style.display = 'block';
    }
    
    /**
     * Tries to auto-fill calories from previous entries
     * @param {string} foodName - Name of the food
     */
    tryAutoFillCalories(foodName) {
        // Get all food history
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        
        // Iterate through all dates and entries
        let matchingEntries = [];
        
        Object.values(foodHistory).forEach(entries => {
            entries.forEach(entry => {
                if (entry.foodName === foodName) {
                    matchingEntries.push(entry);
                }
            });
        });
        
        // If we found matching entries, use the most recent one to auto-fill
        if (matchingEntries.length > 0) {
            // Sort by timestamp, most recent first
            matchingEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            const mostRecent = matchingEntries[0];
            
            // Auto-fill calories
            document.getElementById('calories').value = mostRecent.calories;
            
            // Auto-fill protein, carbs, fat if available
            if (mostRecent.protein) document.getElementById('protein').value = mostRecent.protein;
            if (mostRecent.carbs) document.getElementById('carbs').value = mostRecent.carbs;
            if (mostRecent.fat) document.getElementById('fat').value = mostRecent.fat;
            
            // Auto-fill health rating
            document.getElementById(`health-${mostRecent.healthRating}`).checked = true;
            
            // Update health rating text
            const ratingText = document.querySelector('.health-rating-text');
            switch (mostRecent.healthRating) {
                case '1':
                    ratingText.textContent = 'Unhealthy';
                    break;
                case '2':
                    ratingText.textContent = 'Neutral';
                    break;
                case '3':
                    ratingText.textContent = 'Healthy';
                    break;
            }
            
            // Auto-fill meal type
            document.getElementById('mealType').value = mostRecent.mealType;
        }
    }

    /**
     * Handles form submission
     */
    handleFormSubmit() {
        // Get form data
        const formData = {
            foodName: this.foodNameInput.value.trim(),
            calories: parseInt(document.getElementById('calories').value, 10),
            purchased: this.purchasedCheckbox.checked,
            store: this.purchasedCheckbox.checked ? this.storeInput.value.trim() : '',
            healthRating: document.querySelector('input[name="healthRating"]:checked').value,
            mealType: document.getElementById('mealType').value,
            notes: document.getElementById('notes').value.trim(),
            protein: document.getElementById('protein').value ? parseInt(document.getElementById('protein').value, 10) : 0,
            carbs: document.getElementById('carbs').value ? parseInt(document.getElementById('carbs').value, 10) : 0,
            fat: document.getElementById('fat').value ? parseInt(document.getElementById('fat').value, 10) : 0
        };
        
        // Add entry to storage
        const currentDate = app.currentDisplayDate;
        this.storageManager.addFoodEntry(formData, currentDate);
        
        // Show success notification
        app.settingsManager.showToast(`Added ${formData.foodName} to your food log!`, 'success');
        
        // Reset form
        this.form.reset();
        this.storeField.style.display = 'none';
        document.querySelector('.health-rating-text').textContent = 'Select Health Rating';
        
        // Update UI
        app.refreshUI();
    }

    /**
     * Validates the form
     * @returns {boolean} - Whether the form is valid
     */
    validateForm() {
        // Basic validation (HTML5 required attributes handle most of it)
        if (!this.foodNameInput.value.trim()) {
            app.settingsManager.showToast('Please enter a food name', 'warning');
            this.foodNameInput.focus();
            return false;
        }
        
        const calories = document.getElementById('calories').value;
        if (!calories || isNaN(parseInt(calories, 10)) || parseInt(calories, 10) < 0) {
            app.settingsManager.showToast('Please enter a valid calorie count', 'warning');
            document.getElementById('calories').focus();
            return false;
        }
        
        if (this.purchasedCheckbox.checked && !this.storeInput.value.trim()) {
            app.settingsManager.showToast('Please enter the store where you purchased the food', 'warning');
            this.storeInput.focus();
            return false;
        }
        
        if (!document.querySelector('input[name="healthRating"]:checked')) {
            app.settingsManager.showToast('Please select a health rating', 'warning');
            return false;
        }
        
        if (!document.getElementById('mealType').value) {
            app.settingsManager.showToast('Please select a meal type', 'warning');
            document.getElementById('mealType').focus();
            return false;
        }
        
        return true;
    }
}
