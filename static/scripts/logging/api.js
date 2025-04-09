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
                throw new Error(`API error: ${response.status}`);
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
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
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
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
     * @returns {Any} - Appropriate fallback data
     * @private
     */
    _handleApiFailure(endpoint, data = null) {
        console.warn('Falling back to localStorage for:', endpoint);
        
        // For different endpoints, return appropriate fallback data
        if (endpoint.startsWith('/food-entries/') && !data) {
            // GET food entries for a date
            const dateKey = endpoint.split('/').pop();
            const storedData = localStorage.getItem(`foodEntries_${dateKey}`);
            return storedData ? JSON.parse(storedData) : [];
        } 
        else if (endpoint === '/food-entries' && data) {
            // POST food entry
            const dateKey = data.date;
            let entries = [];
            const storedData = localStorage.getItem(`foodEntries_${dateKey}`);
            if (storedData) {
                entries = JSON.parse(storedData);
            }
            entries.push(data);
            localStorage.setItem(`foodEntries_${dateKey}`, JSON.stringify(entries));
            return data;
        }
        else if (endpoint.startsWith('/food-entries/') && endpoint.split('/').length > 2) {
            // DELETE food entry
            const entryId = endpoint.split('/').pop();
            // Need to iterate through all dates to find and remove the entry
            // This is inefficient but necessary for the fallback
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('foodEntries_')) {
                    const entries = JSON.parse(localStorage.getItem(key));
                    const updatedEntries = entries.filter(entry => entry.id !== entryId);
                    if (entries.length !== updatedEntries.length) {
                        localStorage.setItem(key, JSON.stringify(updatedEntries));
                        break;
                    }
                }
            }
            return true;
        }
        else if (endpoint.startsWith('/water-entries/') && !data) {
            // GET water entries for a date
            const dateKey = endpoint.split('/').pop();
            const storedData = localStorage.getItem(`waterEntries_${dateKey}`);
            return storedData ? JSON.parse(storedData) : [];
        }
        else if (endpoint === '/water-entries' && data) {
            // POST water entry
            const dateKey = data.date;
            let entries = [];
            const storedData = localStorage.getItem(`waterEntries_${dateKey}`);
            if (storedData) {
                entries = JSON.parse(storedData);
            }
            entries.push(data);
            localStorage.setItem(`waterEntries_${dateKey}`, JSON.stringify(entries));
            return data;
        }
        else if (endpoint.startsWith('/water-entries/') && endpoint.split('/').length > 2) {
            // DELETE water entry
            const entryId = endpoint.split('/').pop();
            // Similar to food entries deletion
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('waterEntries_')) {
                    const entries = JSON.parse(localStorage.getItem(key));
                    const updatedEntries = entries.filter(entry => entry.id !== entryId);
                    if (entries.length !== updatedEntries.length) {
                        localStorage.setItem(key, JSON.stringify(updatedEntries));
                        break;
                    }
                }
            }
            return true;
        }
        else if (endpoint === '/food-database') {
            // GET food database
            const storedData = localStorage.getItem('foodDatabase');
            return storedData ? JSON.parse(storedData) : [];
        }
        else if (endpoint === '/store-database') {
            // GET store database
            const storedData = localStorage.getItem('storeDatabase');
            return storedData ? JSON.parse(storedData) : [];
        }
        else if (endpoint.startsWith('/weekly-data/')) {
            // GET weekly data
            const daysBack = parseInt(endpoint.split('/').pop());
            return this._getLocalWeeklyData(daysBack);
        }
        else if (endpoint === '/quick-add-foods' && !data) {
            // GET quick add foods
            const storedData = localStorage.getItem('quickAddFoods');
            return storedData ? JSON.parse(storedData) : [];
        }
        else if (endpoint === '/quick-add-foods' && data) {
            // POST quick add food
            let foods = [];
            const storedData = localStorage.getItem('quickAddFoods');
            if (storedData) {
                foods = JSON.parse(storedData);
            }
            foods.push(data);
            localStorage.setItem('quickAddFoods', JSON.stringify(foods));
            return data;
        }
        else if (endpoint.startsWith('/quick-add-foods/')) {
            // DELETE quick add food
            const foodId = endpoint.split('/').pop();
            const storedData = localStorage.getItem('quickAddFoods');
            if (storedData) {
                const foods = JSON.parse(storedData);
                const updatedFoods = foods.filter(food => food.id !== foodId);
                localStorage.setItem('quickAddFoods', JSON.stringify(updatedFoods));
            }
            return true;
        }
        else if (endpoint === '/water-containers' && !data) {
            // GET water containers
            const storedData = localStorage.getItem('customWaterContainers');
            return storedData ? JSON.parse(storedData) : [];
        }
        else if (endpoint === '/water-containers' && data) {
            // POST water container
            let containers = [];
            const storedData = localStorage.getItem('customWaterContainers');
            if (storedData) {
                containers = JSON.parse(storedData);
            }
            containers.push(data);
            localStorage.setItem('customWaterContainers', JSON.stringify(containers));
            return data;
        }
        else if (endpoint.startsWith('/water-containers/')) {
            // DELETE water container
            const containerId = endpoint.split('/').pop();
            const storedData = localStorage.getItem('customWaterContainers');
            if (storedData) {
                const containers = JSON.parse(storedData);
                const updatedContainers = containers.filter(container => container.id !== containerId);
                localStorage.setItem('customWaterContainers', JSON.stringify(updatedContainers));
            }
            return true;
        }
        else if (endpoint.startsWith('/settings/')) {
            // GET setting
            const key = endpoint.split('/').pop();
            const value = localStorage.getItem(key);
            return { key, value: value ? JSON.parse(value) : null };
        }
        else if (endpoint === '/settings' && data) {
            // POST setting
            localStorage.setItem(data.key, JSON.stringify(data.value));
            return data;
        }
        
        // Default fallback
        return [];
    }

    /**
     * Generate weekly data from localStorage
     * @param {number} daysBack - Number of days to include
     * @returns {Array} - Array of daily data objects
     * @private
     */
    _getLocalWeeklyData(daysBack) {
        const results = [];
        const today = new Date();
        
        for (let i = 0; i < daysBack; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);
            const dateStr = this._formatDate(currentDate);
            
            // Get food entries
            const foodData = localStorage.getItem(`foodEntries_${dateStr}`);
            const foodEntries = foodData ? JSON.parse(foodData) : [];
            
            // Get water entries
            const waterData = localStorage.getItem(`waterEntries_${dateStr}`);
            const waterEntries = waterData ? JSON.parse(waterData) : [];
            
            results.push({
                date: dateStr,
                foodEntries: foodEntries,
                waterEntries: waterEntries
            });
        }
        
        return results;
    }

    /**
     * Format a date as YYYY-MM-DD
     * @param {Date} date - The date to format
     * @returns {string} - Formatted date string
     * @private
     */
    _formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
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
        const dateStr = this._formatDate(date);
        const entry = {
            ...foodEntry,
            date: dateStr
        };
        
        const result = await this.post('/food-entries', entry);
        
        // Add to food and store databases
        if (foodEntry.name) {
            await this.addToFoodDatabase(foodEntry.name);
        }
        if (foodEntry.store) {
            await this.addToStoreDatabase(foodEntry.store);
        }
        
        return result;
    }
    
    /**
     * Remove a food entry
     * @param {string} entryId - ID of the entry to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeFoodEntry(entryId) {
        return await this.delete(`/food-entries/${entryId}`);
    }
    
    // Water Entries API methods
    
    /**
     * Get water entries for a specific date
     * @param {Date} date - Date object
     * @returns {Promise<Array>} - Promise resolving to an array of water entries
     */
    async getWaterEntries(date) {
        const dateStr = this._formatDate(date);
        return await this.get(`/water-entries/${dateStr}`);
    }
    
    /**
     * Add a water entry
     * @param {Object} waterEntry - Water entry object
     * @param {Date} date - Date object
     * @returns {Promise<Object>} - Promise resolving to the added water entry
     */
    async addWaterEntry(waterEntry, date) {
        const dateStr = this._formatDate(date);
        const entry = {
            ...waterEntry,
            date: dateStr
        };
        
        return await this.post('/water-entries', entry);
    }
    
    /**
     * Remove a water entry
     * @param {string} entryId - ID of the entry to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeWaterEntry(entryId) {
        return await this.delete(`/water-entries/${entryId}`);
    }
    
    // Food and Store Database API methods
    
    /**
     * Add a food to the database
     * @param {string} foodName - Food name
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async addToFoodDatabase(foodName) {
        // No direct endpoint to add a single food, handled during food entry creation
        return true;
    }
    
    /**
     * Add a store to the database
     * @param {string} storeName - Store name
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async addToStoreDatabase(storeName) {
        // No direct endpoint to add a single store, handled during food entry creation
        return true;
    }
    
    /**
     * Get the food database
     * @returns {Promise<Array>} - Promise resolving to an array of food names
     */
    async getFoodDatabase() {
        return await this.get('/food-database');
    }
    
    /**
     * Get the store database
     * @returns {Promise<Array>} - Promise resolving to an array of store names
     */
    async getStoreDatabase() {
        return await this.get('/store-database');
    }
    
    // Quick Add Foods API methods
    
    /**
     * Get all quick add foods
     * @returns {Promise<Array>} - Promise resolving to an array of quick add foods
     */
    async getQuickAddFoods() {
        return await this.get('/quick-add-foods');
    }
    
    /**
     * Add a quick add food
     * @param {Object} foodItem - Quick add food item
     * @returns {Promise<Object>} - Promise resolving to the added quick add food
     */
    async addQuickAddFood(foodItem) {
        return await this.post('/quick-add-foods', foodItem);
    }
    
    /**
     * Remove a quick add food
     * @param {string} itemId - ID of the item to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeQuickAddFood(itemId) {
        return await this.delete(`/quick-add-foods/${itemId}`);
    }
    
    // Water Containers API methods
    
    /**
     * Get all water containers
     * @returns {Promise<Array>} - Promise resolving to an array of water containers
     */
    async getWaterContainers() {
        return await this.get('/water-containers');
    }
    
    /**
     * Add a water container
     * @param {Object} container - Water container object
     * @returns {Promise<Object>} - Promise resolving to the added water container
     */
    async addWaterContainer(container) {
        return await this.post('/water-containers', container);
    }
    
    /**
     * Remove a water container
     * @param {string} containerId - ID of the container to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeWaterContainer(containerId) {
        return await this.delete(`/water-containers/${containerId}`);
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
        return await this.post('/settings', { key, value });
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
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}