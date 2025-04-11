/**
 * API Client - Handles server communication for data persistence
 */
class ApiClient {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Make a GET request to the API
     * @param {string} endpoint - API endpoint
     * @returns {Promise} - Promise resolving to response data
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                console.info(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            // Fallback to localStorage if API fails
            return this._handleApiFailure(endpoint);
        }
    }

    /**
     * Make a POST request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send
     * @returns {Promise} - Promise resolving to response data
     */
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                console.info(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            // Fallback to localStorage if API fails
            return this._handleApiFailure(endpoint, data);
        }
    }

    /**
     * Make a DELETE request to the API
     * @param {string} endpoint - API endpoint
     * @returns {Promise} - Promise resolving to response data
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken(),
                },
            });
            if (!response.ok) {
                console.info(`API error: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('API DELETE Error:', error);
            // Fallback to localStorage if API fails
            return this._handleApiFailure(endpoint);
        }
    }

    /**
     * Handle API failures by falling back to localStorage
     * @param {string} endpoint - The endpoint that failed
     * @param {Object} data - Data for POST requests
     * @returns {null} - Appropriate fallback data
     * @private
     */
    _handleApiFailure(endpoint, data = null) {
        console.warn('Falling back to localStorage for:', endpoint, data);

        alert("Endpoint : " + endpoint + " failed. Fallback to dashboard");


        // Default fallback
        return null;
    }


    /**
     * Format a date as YYYY-MM-DD
     * @param {Date} date - The date to format
     * @returns {string} - Formatted date string
     * @private
     */
    _formatDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Food Entries API methods

    /**
     * Get food entries for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Array>} - Promise resolving to an array of food entries
     */
    async getFoodEntries(date) {
        const dateStr = this._formatDate(date);
        return await this.get(`/food-entries/${dateStr}`);
    }

    /**
     * Add a food entry
     * @param {Object} foodEntry - Food entry object
     * @param {Date} date - Date object
     * @returns {Promise<Object>} - Promise resolving to the added food entry
     */
    async addFoodEntry(foodEntry, date) {
        console.log("Adding food entry: ", foodEntry);
        const dateStr = this._formatDate(date);
        const entry = {
            ...foodEntry,
            date: dateStr
        };

        const result = await this.post('/food-entries/add/', entry);
        console.log("Result: ", result);
        return result;
    }

    /**
     * Remove a food entry
     * @param {string} entryId - ID of the entry to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeFoodEntry(entryId) {
        return await this.delete(`/food-entries/delete/${entryId}/`);
    }

    // Water Entries API methods

    /**
     * Get water entries for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Array>} - Promise resolving to an array of water entries
     */
    async getWaterEntries(date) {
        const dateStr = this._formatDate(date);
        return await this.get(`/water-entries/${dateStr}/`);
    }

    /**
     * Add a water entry
     * @param {Object} waterEntry - Water entry object
     * @param {Date} date - Date object
     * @returns {Promise<Object>} - Promise resolving to the added water entry
     */
    async addWaterEntry(waterEntry) {
        return await this.post('/water-entries/', waterEntry);
    }

    /**
     * Remove a water entry
     * @param {string} entryId - ID of the entry to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeWaterEntry(entryId) {
        return await this.delete(`/water-entries/delete/${entryId}/`);
    }

    // Food and Store Database API methods


    /**
     * Get the food database
     * @returns {Promise<Array>} - Promise resolving to an array of food names
     */
    async getFoodDatabase() {
        return await this.get('/food-database/');
    }

    /**
     * Get the store database
     * @returns {Promise<Array>} - Promise resolving to an array of store names
     */
    async getStoreDatabase() {
        return await this.get('/store-database/');
    }

    // Quick Add Foods API methods

    /**
     * Get all quick add foods
     * @returns {Promise<Array>} - Promise resolving to an array of quick add foods
     */
    async getQuickAddFoods() {
        return await this.get('/quick-add-foods/');
    }

    async defaultQuickAddFoods() {
        return (await this.getQuickAddFoods()).filter(item => {
                return item.isDefault;
            }
        )
    }


    /**
     * Add a quick add food
     * @param {Object} foodItem - Quick add food item
     * @returns {Promise<Object>} - Promise resolving to the added quick add food
     */
    async addQuickAddFood(foodItem) {
        return await this.post('/quick-add-foods/', foodItem);
    }

    /**
     * Remove a quick add food
     * @param {string} itemId - ID of the item to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeQuickAddFood(itemId) {
        return await this.delete(`/quick-add-foods/${itemId}/`);
    }

    // Water Containers API methods

    /**
     * Get all water containers
     * @returns {Promise<Array>} - Promise resolving to an array of water containers
     */
    async getWaterContainers() {
        return await this.get('/water-containers/');
    }

    /**
     * Add a water container
     * @param {Object} container - Water container object
     * @returns {Promise<Object>} - Promise resolving to the added water container
     */
    async addWaterContainer(container) {
        return await this.post('/water-containers/', container);
    }

    /**
     * Remove a water container
     * @param {string} containerId - ID of the container to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeWaterContainer(containerId) {
        return await this.delete(`/water-containers/${containerId}/`);
    }

    // Settings API methods

    /**
     * Get a setting
     * @param {string} key - Setting key
     * @returns {Promise<any>} - Promise resolving to the setting value
     */
    async getSetting(key) {
        const result = await this.get(`/settings/${key}`);
        return result.value;
    }

    /**
     * Set a setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async setSetting(key, value) {
        return await this.post('/settings/', {key, value});
    }

    // Weekly Data API methods

    /**
     * Get weekly data
     * @param {number} daysBack - Number of days to look back
     * @returns {Promise<Array>} - Promise resolving to an array of daily data objects
     */
    async getWeeklyData(daysBack = 7) {
        return await this.get(`/weekly-data/${daysBack}`);
    }

    /**
     * Generate a unique ID
     * @returns {string} - Unique ID
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    getCsrfToken() {
        const name = 'csrftoken=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }

    /**
     * Get goals
     * @returns {Promise<Array>} - Promise resolving to an array of goals
     */
    async getGoals() {
        return await this.get(`/goals/`);
    }

    /**
     * Update goals
     * @returns {Promise<Array>} - Promise resolving to an array of goals
     */
    async updateGoals(goals) {
        return await this.post(`/goals/`, goals);
    }
}