/**
 * API Storage Manager - Handles data persistence with server API
 * Replace the original storage.js with this file and rename it to storage.js
 */
class StorageManager {
    constructor() {
        // Initialize API client
        this.apiClient = new ApiClient();

        // Clean up any existing data
        this.cleanupData();
    }

    /**
     * Clean up data and ensure all entries have the expected fields
     */
    cleanupData() {
        // This method is replaced with server-side data validation
        // console.log('API Storage Manager initialized');
    }

    /**
     * Gets the date key in YYYY-MM-DD format
     * @param {Date} date - Date object
     * @returns {string} - Date string in YYYY-MM-DD format
     */
    getDateKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Gets food entries for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Array>} - Promise resolving to an array of food entries
     */
    async getFoodEntries(date) {
        return await this.apiClient.getFoodEntries(date);
    }

    /**
     * Adds a food entry for a specific date
     * @param {Object} foodEntry - Food entry object
     * @param {Date} date - Date object
     */
    async addFoodEntry(foodEntry, date) {
        // Generate a unique ID if not provided
        if (!foodEntry.id) {
            foodEntry.id = this.generateUniqueId();
        }

        return await this.apiClient.addFoodEntry(foodEntry, date);
    }

    /**
     * Removes a food entry for a specific date
     * @param {string} entryId - ID of the entry to remove
     * @param {Date} date - Date object (not required for API)
     */
    async removeFoodEntry(entryId, date) {
        return await this.apiClient.removeFoodEntry(entryId);
    }

    /**
     * Adds a food to the database if it doesn't exist
     * @param {string} foodName - Name of the food
     */
    async addToFoodDatabase(foodName) {
        return await this.apiClient.addToFoodDatabase(foodName);
    }

    /**
     * Adds a store to the database if it doesn't exist
     * @param {string} storeName - Name of the store
     */
    async addToStoreDatabase(storeName) {
        return await this.apiClient.addToStoreDatabase(storeName);
    }

    /**
     * Gets all foods from the database
     * @returns {Promise<Array>} - Promise resolving to an array of food names
     */
    async getFoodDatabase() {
        return await this.apiClient.getFoodDatabase();
    }

    /**
     * Gets all stores from the database
     * @returns {Promise<Array>} - Promise resolving to an array of store names
     */
    async getStoreDatabase() {
        return await this.apiClient.getStoreDatabase();
    }

    /**
     * Gets total calories for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<number>} - Promise resolving to total calories
     */
    async getTotalCalories(date) {
        const entries = await this.getFoodEntries(date);
        return entries.reduce((total, entry) => total + (entry.calories || 0), 0);
    }

    /**
     * Gets total nutrition values for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Object>} - Promise resolving to an object with totals for protein, carbs, and fat
     */
    async getTotalNutrition(date) {
        const entries = await this.getFoodEntries(date);
        return entries.reduce((totals, entry) => {
            return {
                protein: totals.protein + (entry.protein || 0),
                carbs: totals.carbs + (entry.carbs || 0),
                fat: totals.fat + (entry.fat || 0)
            };
        }, {protein: 0, carbs: 0, fat: 0});
    }

    /**
     * Updates the streak count
     */
    async updateStreak() {
        // Get current streak
        let streak = await this.getStreak();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Check if there are entries for today
        const todayEntries = await this.getFoodEntries(today);

        if (todayEntries.length > 0) {
            // Check if there were entries yesterday
            const yesterdayEntries = await this.getFoodEntries(yesterday);

            if (yesterdayEntries.length > 0) {
                // Continue streak
                streak++;
            } else {
                // Reset streak
                streak = 1;
            }

            // Save updated streak
            await this.apiClient.setSetting('streak', streak);
        }
    }

    /**
     * Gets the current streak
     * @returns {Promise<number>} - Promise resolving to number of consecutive days with entries
     */
    async getStreak() {
        const streak = await this.apiClient.getSetting('streak');
        return streak || 0;
    }

    /**
     * Gets entries for all dates in an array format
     * @returns {Promise<Array>} - Promise resolving to an array of objects with date and entries
     */
    async getAllEntries() {
        // This would be inefficient to implement with the API
        // Instead, we'll get the last 30 days of data
        return await this.getWeeklyData(30);
    }

    /**
     * Gets weekly data
     * @param {number} daysBack - Number of days to look back (default 7)
     * @returns {Promise<Array>} - Promise resolving to an array of objects with date and entries
     */
    async getWeeklyData(daysBack = 7) {
        return await this.apiClient.getWeeklyData(daysBack);
    }

    /**
     * Generates a unique ID
     * @returns {string} - Unique ID
     */
    generateUniqueId() {
        return this.apiClient.generateUniqueId();
    }

    /**
     * Gets all quick add food items
     * @returns {Promise<Array>} - Promise resolving to an array of quick add food items
     */
    async getQuickAddFoods() {
        return await this.apiClient.getQuickAddFoods();
    }

    async defaultQuickAddFoods() {
        return (await this.getQuickAddFoods()).filter(item => {
                return item.isDefault;
            }
        )
    }

    /**
     * Adds a quick add food item
     * @param {Object} foodItem - Quick add food item object
     */
    async addQuickAddFood(foodItem) {
        // Generate a unique ID if not provided
        if (!foodItem.id) {
            foodItem.id = this.generateUniqueId();
        }

        return await this.apiClient.addQuickAddFood(foodItem);
    }

    /**
     * Removes a quick add food item
     * @param {string} itemId - ID of the item to remove
     */
    async removeQuickAddFood(itemId) {
        return await this.apiClient.removeQuickAddFood(itemId);
    }

    /**
     * Gets water entries for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Array>} - Promise resolving to an array of water entries
     */
    async getWaterEntries(date) {
        return await this.apiClient.getWaterEntries(date);
    }

    /**
     * Adds a water entry for a specific date
     * @param {Object} waterEntry - Water entry object
     * @param {Date} date - Date object
     */
    async addWaterEntry(waterEntry, date) {
        // Generate a unique ID if not provided
        if (!waterEntry.id) {
            waterEntry.id = this.generateUniqueId();
        }

        return await this.apiClient.addWaterEntry(waterEntry, date);
    }

    /**
     * Removes a water entry
     * @param {string} entryId - ID of the entry to remove
     */
    async removeWaterEntry(entryId) {
        return await this.apiClient.removeWaterEntry(entryId);
    }

    /**
     * Gets total water for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<number>} - Promise resolving to total water
     */
    async getTotalWater(date) {
        const entries = await this.getWaterEntries(date);
        return entries.reduce((total, entry) => total + (entry.amount || 0), 0);
    }

    /**
     * Gets custom water containers
     * @returns {Promise<Array>} - Promise resolving to an array of container objects
     */
    async getCustomWaterContainers() {
        return await this.apiClient.getWaterContainers();
    }

    /**
     * Adds a custom water container
     * @param {Object} container - The container object to add
     */
    async addCustomWaterContainer(container) {
        // Generate a unique ID if not provided
        if (!container.id) {
            container.id = this.generateUniqueId();
        }

        return await this.apiClient.addWaterContainer(container);
    }

    /**
     * Deletes a custom water container
     * @param {string} containerId - ID of the container to delete
     */
    async deleteCustomWaterContainer(containerId) {
        return await this.apiClient.removeWaterContainer(containerId);
    }

    /**
     * Gets a setting
     * @param {string} key - Setting key
     * @returns {Promise<any>} - Promise resolving to the setting value
     */
    async getSetting(key) {
        return await this.apiClient.getSetting(key);
    }

    /**
     * Sets a setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     */
    async setSetting(key, value) {
        return await this.apiClient.setSetting(key, value);
    }
}