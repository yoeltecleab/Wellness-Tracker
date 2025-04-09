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
        this.quickAddForm = document.getElementById('quickAddForm');
        
        this.setupEventListeners();
        this.setupAutocomplete();
        this.loadQuickAddItems();
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
        
        // Quick Add form handling
        if (this.quickAddForm) {
            this.quickAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickAddSubmit();
            });
        }
        
        // Quick Add item delete buttons
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('delete-quick-add-item')) {
                const itemId = e.target.dataset.id;
                this.deleteQuickAddItem(itemId);
            }
        });
        
        // Update the quick add menu and set up event listeners
        this.updateQuickAddMenu();
        
        // Set up event handler for dropdown opening
        const quickAddDropdown = document.getElementById('quickAddDropdown');
        if (quickAddDropdown) {
            quickAddDropdown.addEventListener('shown.bs.dropdown', () => {
                // Refresh the quick add menu when the dropdown is opened
                this.updateQuickAddMenu();
            });
        }
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
    
    /**
     * Loads all quick add items from storage and displays them in the tables
     */
    loadQuickAddItems() {
        // Load custom items
        this.loadCustomQuickAddItems();
        
        // Load default items
        this.loadDefaultQuickAddItems();
        
        // Update the quick add dropdown menu
        this.updateQuickAddMenu();
    }
    
    /**
     * Loads custom quick add items into the table
     */
    loadCustomQuickAddItems() {
        const quickAddItems = this.storageManager.getQuickAddFoods();
        const tableBody = document.getElementById('quickAddItemsTable');
        
        if (!tableBody) return;
        
        // Clear existing table
        tableBody.innerHTML = '';
        
        if (quickAddItems.length === 0) {
            // Show empty state
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 8;
            cell.className = 'text-center text-muted';
            cell.textContent = 'No custom quick add items yet. Add some above!';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }
        
        // Add each item to the table
        quickAddItems.forEach(item => {
            const row = document.createElement('tr');
            
            // Food name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = item.foodName;
            row.appendChild(nameCell);
            
            // Calories cell
            const caloriesCell = document.createElement('td');
            caloriesCell.textContent = item.calories;
            row.appendChild(caloriesCell);
            
            // Protein cell
            const proteinCell = document.createElement('td');
            proteinCell.textContent = item.protein || '0';
            row.appendChild(proteinCell);
            
            // Carbs cell
            const carbsCell = document.createElement('td');
            carbsCell.textContent = item.carbs || '0';
            row.appendChild(carbsCell);
            
            // Fat cell
            const fatCell = document.createElement('td');
            fatCell.textContent = item.fat || '0';
            row.appendChild(fatCell);
            
            // Meal type cell
            const mealCell = document.createElement('td');
            mealCell.textContent = this.capitalizeFirstLetter(item.mealType);
            row.appendChild(mealCell);
            
            // Health rating cell
            const healthCell = document.createElement('td');
            let healthRating = '';
            switch (item.healthRating) {
                case '1':
                    healthRating = 'Unhealthy';
                    break;
                case '2':
                    healthRating = 'Neutral';
                    break;
                case '3':
                    healthRating = 'Healthy';
                    break;
                default:
                    healthRating = 'Unknown';
            }
            healthCell.textContent = healthRating;
            row.appendChild(healthCell);
            
            // Actions cell
            const actionsCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger delete-quick-add-item';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.dataset.id = item.id;
            actionsCell.appendChild(deleteBtn);
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Loads default quick add items into the table
     */
    loadDefaultQuickAddItems() {
        const tableBody = document.getElementById('defaultQuickAddItemsTable');
        if (!tableBody) return;
        
        // Clear existing table
        tableBody.innerHTML = '';
        
        // Get saved default items state
        const savedDefaultItems = JSON.parse(localStorage.getItem('defaultQuickAddItems') || 'null');
        
        // Define default items
        const defaultItems = [
            {id: 'default-1', foodName: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-2', foodName: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-3', foodName: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, mealType: 'lunch', healthRating: '3', isDefault: true},
            {id: 'default-4', foodName: 'Salad', calories: 120, protein: 2, carbs: 10, fat: 8, mealType: 'lunch', healthRating: '3', isDefault: true},
            {id: 'default-5', foodName: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5, mealType: 'breakfast', healthRating: '3', isDefault: true},
            {id: 'default-6', foodName: 'Greek Yogurt', calories: 100, protein: 15, carbs: 5, fat: 0.4, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-7', foodName: 'Eggs (2)', calories: 155, protein: 13, carbs: 1, fat: 11, mealType: 'breakfast', healthRating: '3', isDefault: true},
            {id: 'default-8', foodName: 'Avocado Toast', calories: 190, protein: 5, carbs: 15, fat: 10, mealType: 'breakfast', healthRating: '3', isDefault: true}
        ];
        
        // If we have saved state, update default items
        if (savedDefaultItems) {
            // For each default item, check if it's disabled
            defaultItems.forEach(item => {
                const savedItem = savedDefaultItems.find(saved => saved.id === item.id);
                if (savedItem) {
                    item.disabled = savedItem.disabled || false;
                }
            });
        }
        
        // Add each default item to the table
        defaultItems.forEach(item => {
            const row = document.createElement('tr');
            
            // Food name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = item.foodName;
            row.appendChild(nameCell);
            
            // Calories cell
            const caloriesCell = document.createElement('td');
            caloriesCell.textContent = item.calories;
            row.appendChild(caloriesCell);
            
            // Nutrition cell (combined)
            const nutritionCell = document.createElement('td');
            nutritionCell.innerHTML = `
                <span class="me-2"><i class="fas fa-drumstick-bite text-danger"></i> ${item.protein}g</span>
                <span class="me-2"><i class="fas fa-bread-slice text-warning"></i> ${item.carbs}g</span>
                <span><i class="fas fa-cheese text-info"></i> ${item.fat}g</span>
            `;
            row.appendChild(nutritionCell);
            
            // Meal type cell
            const mealCell = document.createElement('td');
            const mealBadgeClass = this.getMealTypeBadgeClass(item.mealType);
            mealCell.innerHTML = `<span class="badge ${mealBadgeClass}">${this.capitalizeFirstLetter(item.mealType)}</span>`;
            row.appendChild(mealCell);
            
            // Health rating cell
            const healthCell = document.createElement('td');
            let healthRating = '';
            let healthClass = '';
            switch (item.healthRating) {
                case '1':
                    healthRating = 'Unhealthy';
                    healthClass = 'text-danger';
                    break;
                case '2':
                    healthRating = 'Neutral';
                    healthClass = 'text-warning';
                    break;
                case '3':
                    healthRating = 'Healthy';
                    healthClass = 'text-success';
                    break;
                default:
                    healthRating = 'Unknown';
            }
            healthCell.innerHTML = `<span class="${healthClass}">${healthRating}</span>`;
            row.appendChild(healthCell);
            
            // Toggle cell
            const toggleCell = document.createElement('td');
            const toggleDiv = document.createElement('div');
            toggleDiv.className = 'form-check form-switch';
            
            const toggleInput = document.createElement('input');
            toggleInput.className = 'form-check-input default-item-toggle';
            toggleInput.type = 'checkbox';
            toggleInput.id = `toggle-${item.id}`;
            toggleInput.checked = !item.disabled;
            toggleInput.dataset.id = item.id;
            
            // Add event listener to toggle
            toggleInput.addEventListener('change', (e) => {
                const itemId = e.target.dataset.id;
                const isEnabled = e.target.checked;
                
                // Update the saved state
                const savedItems = JSON.parse(localStorage.getItem('defaultQuickAddItems') || '[]');
                const itemIndex = savedItems.findIndex(item => item.id === itemId);
                
                if (itemIndex !== -1) {
                    savedItems[itemIndex].disabled = !isEnabled;
                } else {
                    // Item not found, add it
                    savedItems.push({
                        id: itemId,
                        disabled: !isEnabled
                    });
                }
                
                localStorage.setItem('defaultQuickAddItems', JSON.stringify(savedItems));
                
                // Update the quick add menu
                this.updateQuickAddMenu();
                
                // Show a toast
                app.settingsManager.showToast(
                    `${item.foodName} ${isEnabled ? 'added to' : 'removed from'} quick add menu`,
                    'success'
                );
            });
            
            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'form-check-label';
            toggleLabel.htmlFor = `toggle-${item.id}`;
            
            toggleDiv.appendChild(toggleInput);
            toggleDiv.appendChild(toggleLabel);
            toggleCell.appendChild(toggleDiv);
            row.appendChild(toggleCell);
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Gets the Bootstrap badge class for a meal type
     * @param {string} mealType - Meal type
     * @returns {string} - Badge class
     */
    getMealTypeBadgeClass(mealType) {
        switch (mealType.toLowerCase()) {
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
     * Updates the quick add dropdown menu with items from storage
     */
    updateQuickAddMenu() {
        const quickAddItems = this.storageManager.getQuickAddFoods();
        const dropdownMenu = document.querySelector('.quick-add-menu');
        
        if (!dropdownMenu) return;
        
        // Find the divider before "Manage Quick Add Items"
        const divider = document.querySelector('.dropdown-divider');
        if (!divider) {
            console.error('Divider not found in quick add menu');
            return;
        }
        
        // Get the manage link (last item)
        const manageLink = document.querySelector('.quick-add-menu .dropdown-item[data-bs-toggle="modal"]');
        if (!manageLink) {
            console.error('Manage link not found in quick add menu');
            return;
        }
        
        // Clear all existing dropdown items
        dropdownMenu.innerHTML = '';
        
        // Get saved default items state (which ones are enabled)
        const savedDefaultItems = JSON.parse(localStorage.getItem('defaultQuickAddItems') || 'null');
        
        // Define default items
        const defaultItems = [
            {id: 'default-1', foodName: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-2', foodName: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-3', foodName: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, mealType: 'lunch', healthRating: '3', isDefault: true},
            {id: 'default-4', foodName: 'Salad', calories: 120, protein: 2, carbs: 10, fat: 8, mealType: 'lunch', healthRating: '3', isDefault: true},
            {id: 'default-5', foodName: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5, mealType: 'breakfast', healthRating: '3', isDefault: true},
            {id: 'default-6', foodName: 'Greek Yogurt', calories: 100, protein: 15, carbs: 5, fat: 0.4, mealType: 'snack', healthRating: '3', isDefault: true},
            {id: 'default-7', foodName: 'Eggs (2)', calories: 155, protein: 13, carbs: 1, fat: 11, mealType: 'breakfast', healthRating: '3', isDefault: true},
            {id: 'default-8', foodName: 'Avocado Toast', calories: 190, protein: 5, carbs: 15, fat: 10, mealType: 'breakfast', healthRating: '3', isDefault: true}
        ];
        
        // If we have saved state, update default items
        if (savedDefaultItems) {
            // For each default item, check if it's disabled
            defaultItems.forEach(item => {
                const savedItem = savedDefaultItems.find(saved => saved.id === item.id);
                if (savedItem) {
                    item.disabled = savedItem.disabled || false;
                }
            });
        } else {
            // First time, save all default items as enabled
            localStorage.setItem('defaultQuickAddItems', JSON.stringify(defaultItems));
        }
        
        // Add default items that aren't disabled
        defaultItems.forEach(item => {
            if (!item.disabled) {
                this.addItemToQuickAddMenu(item, dropdownMenu);
            }
        });
        
        // Add the user's custom quick add items
        quickAddItems.forEach(item => {
            this.addItemToQuickAddMenu(item, dropdownMenu);
        });
        
        // Add back the divider and manage link
        const newDivider = document.createElement('li');
        newDivider.innerHTML = '<hr class="dropdown-divider">';
        dropdownMenu.appendChild(newDivider);
        
        const newManageLi = document.createElement('li');
        const newManageLink = document.createElement('a');
        newManageLink.className = 'dropdown-item';
        newManageLink.href = '#';
        newManageLink.setAttribute('data-bs-toggle', 'modal');
        newManageLink.setAttribute('data-bs-target', '#quickAddModal');
        newManageLink.textContent = 'Manage Quick Add Items';
        newManageLi.appendChild(newManageLink);
        dropdownMenu.appendChild(newManageLi);
        
        // Re-add the event listeners to all quick add items
        this.setupQuickAddItemListeners();
    }
    
    /**
     * Adds an item to the quick add dropdown menu
     * @param {Object} item - The item to add
     * @param {HTMLElement} dropdownMenu - The dropdown menu element
     */
    addItemToQuickAddMenu(item, dropdownMenu) {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = '#';
        link.textContent = `${item.foodName} (${item.calories} cal)`;
        
        // Set data attributes
        link.dataset.food = item.foodName;
        link.dataset.calories = item.calories;
        if (item.protein) link.dataset.protein = item.protein;
        if (item.carbs) link.dataset.carbs = item.carbs;
        if (item.fat) link.dataset.fat = item.fat;
        if (item.mealType) link.dataset.meal = item.mealType;
        if (item.healthRating) link.dataset.health = item.healthRating;
        
        listItem.appendChild(link);
        dropdownMenu.appendChild(listItem);
    }
    
    /**
     * Sets up event listeners for all quick add items in the dropdown
     */
    setupQuickAddItemListeners() {
        document.querySelectorAll('.quick-add-menu .dropdown-item').forEach(item => {
            if (!item.dataset.food) return; // Skip the "Manage" option
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Fill form with quick add item data
                document.getElementById('foodName').value = item.dataset.food;
                document.getElementById('calories').value = item.dataset.calories;
                
                // Set nutrition data if available
                if (item.dataset.protein) document.getElementById('protein').value = item.dataset.protein;
                if (item.dataset.carbs) document.getElementById('carbs').value = item.dataset.carbs;
                if (item.dataset.fat) document.getElementById('fat').value = item.dataset.fat;
                
                // Set meal type
                if (item.dataset.meal) {
                    document.getElementById('mealType').value = item.dataset.meal;
                }
                
                // Set health rating
                if (item.dataset.health) {
                    const healthRating = parseInt(item.dataset.health);
                    document.getElementById(`health-${healthRating}`).checked = true;
                    
                    // Update health rating text
                    const ratingText = document.querySelector('.health-rating-text');
                    switch (healthRating) {
                        case 1: ratingText.textContent = 'Unhealthy'; break;
                        case 2: ratingText.textContent = 'Neutral'; break;
                        case 3: ratingText.textContent = 'Healthy'; break;
                    }
                }
            });
        });
    }
    
    /**
     * Handles the quick add form submission
     */
    handleQuickAddSubmit() {
        // Get form data
        const foodItem = {
            foodName: document.getElementById('quickAddFoodName').value.trim(),
            calories: parseInt(document.getElementById('quickAddCalories').value, 10),
            protein: document.getElementById('quickAddProtein').value ? parseInt(document.getElementById('quickAddProtein').value, 10) : 0,
            carbs: document.getElementById('quickAddCarbs').value ? parseInt(document.getElementById('quickAddCarbs').value, 10) : 0,
            fat: document.getElementById('quickAddFat').value ? parseInt(document.getElementById('quickAddFat').value, 10) : 0,
            mealType: document.getElementById('quickAddMealType').value,
            healthRating: document.getElementById('quickAddHealthRating') ? document.getElementById('quickAddHealthRating').value : '3'
        };
        
        // Add item to storage
        this.storageManager.addQuickAddFood(foodItem);
        
        // Show success notification
        app.settingsManager.showToast(`Added ${foodItem.foodName} to your quick add items!`, 'success');
        
        // Reset form
        document.getElementById('quickAddForm').reset();
        
        // Reload quick add items
        this.loadQuickAddItems();
    }
    
    /**
     * Deletes a quick add item
     * @param {string} itemId - ID of the item to delete
     */
    deleteQuickAddItem(itemId) {
        this.storageManager.removeQuickAddFood(itemId);
        
        // Show success notification
        app.settingsManager.showToast('Item removed from quick add list', 'success');
        
        // Reload quick add items
        this.loadQuickAddItems();
    }
    
    /**
     * Capitalizes the first letter of a string
     * @param {string} string - String to capitalize
     * @returns {string} - Capitalized string
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
