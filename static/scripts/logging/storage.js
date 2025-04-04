/**
 * Storage Manager - Handles data persistence with localStorage
 */
class StorageManager {
    constructor() {
        // Initialize storage if needed
        if (!localStorage.getItem('foodHistory')) {
            localStorage.setItem('foodHistory', JSON.stringify({}));
        }
        if (!localStorage.getItem('foodDatabase')) {
            localStorage.setItem('foodDatabase', JSON.stringify([]));
        }
        if (!localStorage.getItem('storeDatabase')) {
            localStorage.setItem('storeDatabase', JSON.stringify([]));
        }
        
        // Clean up data structure
        this.cleanupData();
        
        // Update streak 
        this.updateStreak();
    }

    /**
     * Clean up data and ensure all entries have the expected fields
     */
    cleanupData() {
        try {
            const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
            
            // Loop through all dates in food history
            Object.keys(foodHistory).forEach(dateKey => {
                if (Array.isArray(foodHistory[dateKey])) {
                    // Ensure all entries have required fields
                    foodHistory[dateKey] = foodHistory[dateKey].map(entry => {
                        // Add default ID if missing
                        if (!entry.id) {
                            entry.id = this.generateUniqueId();
                        }
                        
                        // Add default timestamp if missing
                        if (!entry.timestamp) {
                            entry.timestamp = new Date().toISOString();
                        }
                        
                        // Ensure nutrition fields exist
                        if (!entry.hasOwnProperty('protein')) entry.protein = 0;
                        if (!entry.hasOwnProperty('carbs')) entry.carbs = 0;
                        if (!entry.hasOwnProperty('fat')) entry.fat = 0;
                        
                        return entry;
                    });
                }
            });
            
            // Save cleaned data
            localStorage.setItem('foodHistory', JSON.stringify(foodHistory));
        } catch (error) {
            console.error('Error cleaning up data', error);
        }
    }

    /**
     * Gets the date key in YYYY-MM-DD format
     * @param {Date} date - Date object
     * @returns {string} - Date string in YYYY-MM-DD format
     */
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Gets food entries for a specific date
     * @param {Date} date - Date object
     * @returns {Array} - Array of food entries for the date
     */
    getFoodEntries(date) {
        const dateKey = this.getDateKey(date);
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        return foodHistory[dateKey] || [];
    }

    /**
     * Adds a food entry for a specific date
     * @param {Object} foodEntry - Food entry object
     * @param {Date} date - Date object
     */
    addFoodEntry(foodEntry, date) {
        const dateKey = this.getDateKey(date);
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        
        // Add ID and timestamp
        foodEntry.id = this.generateUniqueId();
        foodEntry.timestamp = new Date().toISOString();
        
        // Ensure food entry has all required fields
        if (!foodEntry.hasOwnProperty('protein')) foodEntry.protein = 0;
        if (!foodEntry.hasOwnProperty('carbs')) foodEntry.carbs = 0;
        if (!foodEntry.hasOwnProperty('fat')) foodEntry.fat = 0;
        
        // Initialize array for date if it doesn't exist
        if (!foodHistory[dateKey]) {
            foodHistory[dateKey] = [];
        }
        
        // Add entry
        foodHistory[dateKey].push(foodEntry);
        
        // Save to storage
        localStorage.setItem('foodHistory', JSON.stringify(foodHistory));
        
        // Add to food and store databases
        this.addToFoodDatabase(foodEntry.foodName);
        if (foodEntry.purchased && foodEntry.store) {
            this.addToStoreDatabase(foodEntry.store);
        }
        
        // Update streak
        this.updateStreak();
    }

    /**
     * Removes a food entry for a specific date
     * @param {string} entryId - ID of the entry to remove
     * @param {Date} date - Date object
     */
    removeFoodEntry(entryId, date) {
        const dateKey = this.getDateKey(date);
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        
        // Check if entries exist for the date
        if (!foodHistory[dateKey]) {
            return;
        }
        
        // Filter out the entry to remove
        foodHistory[dateKey] = foodHistory[dateKey].filter(entry => entry.id !== entryId);
        
        // Save to storage
        localStorage.setItem('foodHistory', JSON.stringify(foodHistory));
    }

    /**
     * Adds a food to the database if it doesn't exist
     * @param {string} foodName - Name of the food
     */
    addToFoodDatabase(foodName) {
        const foodDatabase = JSON.parse(localStorage.getItem('foodDatabase') || '[]');
        
        // Check if food already exists
        if (!foodDatabase.includes(foodName)) {
            foodDatabase.push(foodName);
            localStorage.setItem('foodDatabase', JSON.stringify(foodDatabase));
        }
    }

    /**
     * Adds a store to the database if it doesn't exist
     * @param {string} storeName - Name of the store
     */
    addToStoreDatabase(storeName) {
        const storeDatabase = JSON.parse(localStorage.getItem('storeDatabase') || '[]');
        
        // Check if store already exists
        if (!storeDatabase.includes(storeName)) {
            storeDatabase.push(storeName);
            localStorage.setItem('storeDatabase', JSON.stringify(storeDatabase));
        }
    }

    /**
     * Gets all foods from the database
     * @returns {Array} - Array of food names
     */
    getFoodDatabase() {
        return JSON.parse(localStorage.getItem('foodDatabase') || '[]');
    }

    /**
     * Gets all stores from the database
     * @returns {Array} - Array of store names
     */
    getStoreDatabase() {
        return JSON.parse(localStorage.getItem('storeDatabase') || '[]');
    }

    /**
     * Gets total calories for a specific date
     * @param {Date} date - Date object
     * @returns {number} - Total calories
     */
    getTotalCalories(date) {
        const entries = this.getFoodEntries(date);
        return entries.reduce((total, entry) => total + parseInt(entry.calories || 0, 10), 0);
    }

    /**
     * Gets total nutrition values for a specific date
     * @param {Date} date - Date object
     * @returns {Object} - Object with totals for protein, carbs, and fat
     */
    getTotalNutrition(date) {
        const entries = this.getFoodEntries(date);
        return entries.reduce((totals, entry) => {
            totals.protein += parseInt(entry.protein || 0, 10);
            totals.carbs += parseInt(entry.carbs || 0, 10);
            totals.fat += parseInt(entry.fat || 0, 10);
            return totals;
        }, { protein: 0, carbs: 0, fat: 0 });
    }

    /**
     * Updates the streak count
     */
    updateStreak() {
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        const dates = Object.keys(foodHistory).sort();
        
        if (dates.length === 0) {
            localStorage.setItem('streak', '0');
            return;
        }
        
        // Check if there's an entry for today
        const today = this.getDateKey(new Date());
        const hasEntryToday = foodHistory[today] && foodHistory[today].length > 0;
        
        if (!hasEntryToday) {
            // Check if there's an entry for yesterday
            const yesterday = this.getDateKey(new Date(Date.now() - 86400000));
            const hasEntryYesterday = foodHistory[yesterday] && foodHistory[yesterday].length > 0;
            
            if (!hasEntryYesterday) {
                // Reset streak if no entry for yesterday or today
                localStorage.setItem('streak', '0');
                return;
            }
        }
        
        // Calculate streak by checking consecutive days backwards
        let streak = 0;
        let currentDate = new Date();
        
        // Check up to 100 days back to avoid infinite loop
        for (let i = 0; i < 100; i++) {
            const dateKey = this.getDateKey(currentDate);
            const hasEntry = foodHistory[dateKey] && foodHistory[dateKey].length > 0;
            
            if (hasEntry) {
                streak++;
            } else if (streak > 0) {
                // Break if we've already started the streak but found a day with no entries
                break;
            }
            
            // Move to the previous day
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        localStorage.setItem('streak', streak.toString());
    }

    /**
     * Gets the current streak
     * @returns {number} - Number of consecutive days with entries
     */
    getStreak() {
        return parseInt(localStorage.getItem('streak') || '0', 10);
    }

    /**
     * Gets entries for all dates in an array format
     * @returns {Array} - Array of objects with date and entries
     */
    getAllEntries() {
        const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');
        return Object.keys(foodHistory).map(dateKey => ({
            date: dateKey,
            entries: foodHistory[dateKey]
        }));
    }

    /**
     * Gets weekly data
     * @param {number} daysBack - Number of days to look back (default 7)
     * @returns {Array} - Array of objects with date and entries
     */
    getWeeklyData(daysBack = 7) {
        const result = [];
        const today = new Date();
        
        for (let i = daysBack - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            
            const entries = this.getFoodEntries(date);
            
            result.push({
                date: dateKey,
                displayDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                entries: entries
            });
        }
        
        return result;
    }

    /**
     * Generates a unique ID
     * @returns {string} - Unique ID
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }
}
