/**
 * Water Tracking Manager - Handles water intake tracking functionality
 */
class WaterTrackingManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.waterChart = null;
        this.weeklyWaterChart = null;
        this.currentDate = new Date();

        this.updateWaterGoal();
        this.initWaterChart();
        this.initWeeklyWaterChart();
        this.setupEventListeners();
        this.setupWaterDateNavigation();
        this.updateWaterUI();
        this.setupWaterStatsButton();
        this.loadCustomContainers();
    }

    /**
     * Initializes the water intake donut chart
     */
    initWaterChart() {
        const ctx = document.getElementById('waterChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.waterChart) {
            this.waterChart.destroy();
        }

        this.waterChart = new Chart(ctx, {
            type: 'doughnut', data: {
                labels: ['Consumed', 'Remaining'], datasets: [{
                    data: [0, this.waterGoal],
                    backgroundColor: ['rgba(13, 110, 253, 0.8)', 'rgba(233, 236, 239, 0.8)'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            }, options: {
                responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {
                        display: false
                    }, tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.raw + 'ml';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Updates the water chart with new data
     * @param {number} consumedWater - Amount of water consumed
     */
    updateWaterChart(consumedWater) {
        this.waterChart.data.datasets[0].data = [consumedWater, Math.max(0, this.waterGoal - consumedWater)];
        this.waterChart.update();

        // Update water counter and progress bar
        const percentage = Math.min(100, Math.round((consumedWater / this.waterGoal) * 100)) || 0;
        document.getElementById('waterCounter').textContent = `${consumedWater} / ${this.waterGoal} ml`;
        document.getElementById('waterProgressBar').style.width = `${percentage}%`;

        // Update stat cards
        document.getElementById('totalWaterCard').textContent = `${consumedWater} ml`;
        document.getElementById('waterGoalCompletionCard').textContent = `${percentage}%`;
    }

    /**
     * Sets up event listeners for water tracking functionality
     */
    async setupEventListeners() {
        // Water form submission
        document.getElementById('waterEntryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWaterFormSubmit();
        });

        // Water preset buttons
        document.querySelectorAll('.water-preset').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('waterAmount').value = parseInt(button.dataset.amount);
            });
        });

        // Setup custom water container form
        document.getElementById('waterContainerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCustomContainer();
        });

        // Setup water container deletion
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('delete-container')) {
                const containerId = e.target.closest('.delete-container').dataset.id;
                this.deleteCustomContainer(containerId);
            }
        });

        // Setup default containers toggle
        const showDefaultContainersToggle = document.getElementById('showDefaultContainers');
        if (showDefaultContainersToggle) {
            // Set initial state based on stored preference
            let defaults = await this.storageManager.getDefaultWaterContainers();

            showDefaultContainersToggle.checked = defaults[0].isActive;

            // Add change event listener
            showDefaultContainersToggle.addEventListener('change', async () => {
                defaults.forEach(c => {
                    c.isActive = showDefaultContainersToggle.checked;
                })
                defaults.forEach(c => {
                    this.addCustomContainer(c)
                })
                await this.updateCustomContainerPresets(await this.getCustomContainers());
            });
        }

        // Water log deletion
        this.setupWaterLogDeletion();
    }

    /**
     * Handle water form submission
     */
    async handleWaterFormSubmit() {
        const waterAmount = parseInt(document.getElementById('waterAmount').value);

        if (!waterAmount || waterAmount <= 0) {
            return;
        }

        const waterEntry = {
            amount: waterAmount,
        };

        await this.addWaterEntry(waterEntry);
        document.getElementById('waterEntryForm').reset();
    }

    /**
     * Adds a water entry to storage and updates UI
     * @param {Object} waterEntry - The water entry to add
     */
    async addWaterEntry(waterEntry) {
        // Get existing water entries for the current date
        await this.storageManager.addWaterEntry(waterEntry);
        // Update UI
        this.updateWaterUI();
    }

    /**
     * Removes a water entry and updates UI
     * @param {string} entryId - ID of the entry to remove
     */
    async removeWaterEntry(entryId) {
        await this.storageManager.removeWaterEntry(entryId);
        this.updateWaterUI();
    }

    /**
     * Sets up water log entry deletion
     */
    setupWaterLogDeletion() {
        document.addEventListener('click', async (e) => {
            if (e.target && e.target.classList.contains('delete-water-entry')) {
                const entryId = e.target.closest('.delete-water-entry').dataset.id;
                console.log("E target: ", entryId);
                if (confirm('Are you sure you want to delete this water entry?')) {
                    console.log("Yes")
                    await this.removeWaterEntry(entryId);
                }
            }
        });
    }

    /**
     * Updates the water UI with current data
     */
    updateWaterUI() {
        // Update water log table
        this.updateWaterLog();

        // Update water chart and stats
        this.updateWaterData();

        // Update date display
        this.updateWaterDateDisplay();
    }

    /**
     * Updates the water log table
     */
    async updateWaterLog() {
        const waterLogTable = document.getElementById('waterLogTable');
        let waterEntries = await this.storageManager.getWaterEntries(this.currentDate);

        if (waterEntries.length === 0) {
            waterLogTable.innerHTML = `
                <tr class="empty-state">
                    <td colspan="3" class="text-center py-4">
                        <div class="empty-state-container">
                            <i class="fas fa-tint empty-state-icon mb-3"></i>
                            <p class="mb-0">No water intake logged for this day.</p>
                            <p class="text-muted small">Track your hydration by adding water entries above.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort entries by timestamp (newest first)
        waterEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let tableHtml = '';
        waterEntries.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            tableHtml += `
                <tr>
                    <td>${time}</td>
                    <td>${entry.amount} ml</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-water-entry" data-id="${entry.id}">
                            <i class="fas fa-trash" style="pointer-events: none"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        waterLogTable.innerHTML = tableHtml;
    }

    /**
     * Updates water data and chart
     */
    async updateWaterData() {
        let waterEntries = await this.storageManager.getWaterEntries(this.currentDate);

        // Calculate total water intake
        const totalWater = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);

        // Update chart
        this.updateWaterChart(totalWater);
    }

    /**
     * Sets up date navigation for water tracking
     */
    setupWaterDateNavigation() {
        document.getElementById('waterPrevDay').addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.updateWaterUI();
        });

        document.getElementById('waterNextDay').addEventListener('click', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Don't allow navigating to future dates
            if (this.currentDate < tomorrow) {
                console.log("Current date: ", this.currentDate);
                console.log("Tomorrow: ", tomorrow);
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                this.updateWaterUI();
            }
        });

        document.getElementById('waterCurrentDay').addEventListener('click', () => {
            this.currentDate = new Date();
            this.updateWaterUI();
        });
    }

    /**
     * Updates the water current date display
     */
    updateWaterDateDisplay() {
        const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        document.getElementById('waterCurrentDate').textContent = this.currentDate.toLocaleDateString(undefined, options);
    }

    /**
     * Initializes the weekly water chart
     */
    async initWeeklyWaterChart() {
        const ctx = document.getElementById('weeklyWaterChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.weeklyWaterChart) {
            this.weeklyWaterChart.destroy();
        }

        const weeklyData = await this.getWeeklyWaterData();

        this.weeklyWaterChart = new Chart(ctx, {
            type: 'bar', data: {
                labels: weeklyData.labels, datasets: [{
                    label: 'Water Intake (ml)',
                    data: weeklyData.data,
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }, {
                    label: 'Goal',
                    data: Array(7).fill(this.waterGoal),
                    type: 'line',
                    borderColor: 'rgba(40, 167, 69, 0.7)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            }, options: {
                responsive: true, maintainAspectRatio: false, scales: {
                    y: {
                        beginAtZero: true, title: {
                            display: true, text: 'Water (ml)'
                        }
                    }, x: {
                        title: {
                            display: true, text: 'Date'
                        }
                    }
                }, plugins: {
                    legend: {
                        display: true, position: 'top'
                    }, tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (context.dataset.label === 'Goal') {
                                    return `Goal: ${context.raw} ml`;
                                }
                                return `Intake: ${context.raw} ml`;
                            }
                        }
                    }
                }
            }
        });

        // Update weekly stats summary
        this.updateWeeklyWaterStats();
    }

    /**
     * Gets weekly water data
     * @returns {Object} - Object with labels and water data
     */
    async getWeeklyWaterData() {
        const weeklyData = await this.storageManager.getWeeklyData(7);
        const labels = [];
        const data = [];


        if (!weeklyData) return {labels, data};
        for (const day of weeklyData) {
            // Format date for label (e.g., "Mon 5")
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString(undefined, {weekday: 'short'});
            const dayNumber = date.getDate();
            labels.push(`${dayName} ${dayNumber}`);

            // Get water data for this day
            let waterEntries = await this.storageManager.getWaterEntries(date)

            // Sum water intake for this day
            const dayTotal = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
            data.push(dayTotal);
        }

        return {labels, data};
    }

    /**
     * Updates the weekly water statistics
     */
    async updateWeeklyWaterStats() {
        const weeklyData = await this.getWeeklyWaterData();
        const totalWeeklyWater = weeklyData.data.reduce((sum, amount) => sum + amount, 0);
        const avgDailyWater = Math.round(totalWeeklyWater / 7);
        const daysAboveGoal = weeklyData.data.filter(amount => amount >= this.waterGoal).length;

        // Update stats in the UI
        document.getElementById('totalWeeklyWater').textContent = `${totalWeeklyWater} ml`;
        document.getElementById('avgDailyWater').textContent = `${avgDailyWater} ml`;
        document.getElementById('daysAboveWaterGoal').textContent = `${daysAboveGoal} / 7`;

        // Calculate streak
        let currentStreak = 0;
        for (let i = weeklyData.data.length - 1; i >= 0; i--) {
            if (weeklyData.data[i] >= this.waterGoal) {
                currentStreak++;
            } else {
                break;
            }
        }
        document.getElementById('waterStreak').textContent = `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`;

        // Calculate percentage change from previous week
        window.previousWeekData = await this.getPreviousWeekWaterData();
        const previousWeekTotal = previousWeekData.reduce((sum, amount) => sum + amount, 0);

        let percentChange = 0;
        if (previousWeekTotal > 0) {
            percentChange = Math.round((totalWeeklyWater - previousWeekTotal) / previousWeekTotal * 100);
        }

        const changeElement = document.getElementById('waterWeeklyChange');
        changeElement.textContent = `${Math.abs(percentChange)}%`;

        if (percentChange > 0) {
            changeElement.classList.remove('text-danger');
            changeElement.classList.add('text-success');
            document.getElementById('waterChangeIcon').innerHTML = '<i class="fas fa-arrow-up"></i>';
        } else if (percentChange < 0) {
            changeElement.classList.remove('text-success');
            changeElement.classList.add('text-danger');
            document.getElementById('waterChangeIcon').innerHTML = '<i class="fas fa-arrow-down"></i>';
        } else {
            changeElement.classList.remove('text-success', 'text-danger');
            document.getElementById('waterChangeIcon').innerHTML = '<i class="fas fa-equals"></i>';
        }
    }

    /**
     * Gets water data for the previous week
     * @returns {Array} - Array of daily totals for previous week
     */
    async getPreviousWeekWaterData() {
        const data = [];
        const today = new Date();

        // Calculate start and end dates for the previous week
        const end = new Date(today);
        end.setDate(end.getDate() - 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);

        // Loop through each day of the previous week
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            let waterEntries = await this.storageManager.getWaterEntries(date);

            // Sum water intake for this day
            const dayTotal = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
            data.push(dayTotal);
        }

        return data;
    }

    /**
     * Sets up the water stats button to toggle weekly stats view
     */
    setupWaterStatsButton() {
        // Setup toggle button for weekly stats
        const statsButton = document.getElementById('toggleWaterStats');
        const statsSection = document.getElementById('waterWeeklyStatsSection');

        if (statsButton && statsSection) {
            statsButton.addEventListener('click', () => {
                if (statsSection.classList.contains('d-none')) {
                    statsSection.classList.remove('d-none');
                    statsButton.innerHTML = '<i class="fas fa-chart-bar"></i> Hide Weekly Stats';
                    this.initWeeklyWaterChart(); // Refresh chart when shown
                } else {
                    statsSection.classList.add('d-none');
                    statsButton.innerHTML = '<i class="fas fa-chart-bar"></i> Show Weekly Stats';
                }
            });
        }

        // Setup modal water stats button
        const weeklyWaterStatsBtn = document.getElementById('weeklyWaterStatsBtn');
        if (weeklyWaterStatsBtn) {
            weeklyWaterStatsBtn.addEventListener('click', () => {
                this.populateWaterStatsModal();
            });
        }
    }

    /**
     * Initialize the modal weekly water chart
     */
    async initModalWeeklyWaterChart() {
        const ctx = document.getElementById('modalWeeklyWaterChart');
        if (!ctx) return;

        const modalWaterChart = Chart.getChart(ctx);
        if (modalWaterChart) {
            modalWaterChart.destroy();
        }

        const weeklyData = await this.getWeeklyWaterData();

        new Chart(ctx, {
            type: 'bar', data: {
                labels: weeklyData.labels, datasets: [{
                    label: 'Water Intake (ml)',
                    data: weeklyData.data,
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }, {
                    label: 'Goal',
                    data: Array(7).fill(this.waterGoal),
                    type: 'line',
                    borderColor: 'rgba(40, 167, 69, 0.7)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            }, options: {
                responsive: true, maintainAspectRatio: false, scales: {
                    y: {
                        beginAtZero: true, title: {
                            display: true, text: 'Water (ml)'
                        }
                    }, x: {
                        title: {
                            display: true, text: 'Date'
                        }
                    }
                }, plugins: {
                    legend: {
                        display: true, position: 'top'
                    }, tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (context.dataset.label === 'Goal') {
                                    return `Goal: ${context.raw} ml`;
                                }
                                return `Intake: ${context.raw} ml`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Populate the water statistics modal with data
     */
    async populateWaterStatsModal() {
        // Initialize the chart
        this.initModalWeeklyWaterChart();

        // Get weekly data
        const weeklyData = await this.getWeeklyWaterData();
        const totalWeeklyWater = weeklyData.data.reduce((sum, amount) => sum + amount, 0);
        const avgDailyWater = Math.round(totalWeeklyWater / 7);
        const daysAboveGoal = weeklyData.data.filter(amount => amount >= this.waterGoal).length;

        // Update stats in the modal
        document.getElementById('modalTotalWeeklyWater').textContent = `${totalWeeklyWater} ml`;
        document.getElementById('modalAvgDailyWater').textContent = `${avgDailyWater} ml`;
        document.getElementById('modalDaysAboveWaterGoal').textContent = `${daysAboveGoal}/7`;

        // Calculate percentage change from previous week
        const previousWeekData = await this.getPreviousWeekWaterData();
        const previousWeekTotal = previousWeekData.reduce((sum, amount) => sum + amount, 0);

        let percentChange = 0;
        if (previousWeekTotal > 0) {
            percentChange = Math.round((totalWeeklyWater - previousWeekTotal) / previousWeekTotal * 100);
        }

        const changeElement = document.getElementById('modalWaterWeeklyChange');
        changeElement.textContent = `${Math.abs(percentChange)}%`;

        if (percentChange > 0) {
            changeElement.classList.remove('text-danger');
            changeElement.classList.add('text-success');
            document.getElementById('modalWaterChangeIcon').innerHTML = '<i class="fas fa-arrow-up"></i>';
        } else if (percentChange < 0) {
            changeElement.classList.remove('text-success');
            changeElement.classList.add('text-danger');
            document.getElementById('modalWaterChangeIcon').innerHTML = '<i class="fas fa-arrow-down"></i>';
        } else {
            changeElement.classList.remove('text-success', 'text-danger');
            document.getElementById('modalWaterChangeIcon').innerHTML = '<i class="fas fa-equals"></i>';
        }

        // Populate daily breakdown table
        this.populateWaterDailyBreakdown(weeklyData);
    }

    /**
     * Populate the daily breakdown table in the water stats modal
     * @param {Object} weeklyData - The weekly water data
     */
    populateWaterDailyBreakdown(weeklyData) {
        const tbody = document.getElementById('waterDailyBreakdown');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        // Get the dates for the past 7 days
        const weeklyDates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            weeklyDates.push(date);
        }

        // Create rows for each day
        weeklyData.labels.forEach((label, index) => {
            const amount = weeklyData.data[index];
            const percentOfGoal = Math.round((amount / this.waterGoal) * 100);
            const date = weeklyDates[index];
            const dateString = date.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});

            const row = document.createElement('tr');

            // Determine status and badge class
            let statusBadge;
            if (percentOfGoal >= 100) {
                statusBadge = '<span class="badge bg-success">Goal Met</span>';
            } else if (percentOfGoal >= 75) {
                statusBadge = '<span class="badge bg-warning">Nearly There</span>';
            } else {
                statusBadge = '<span class="badge bg-danger">Below Goal</span>';
            }

            row.innerHTML = `
                <td>${dateString}</td>
                <td>${amount} ml</td>
                <td>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${percentOfGoal >= 100 ? 'bg-success' : 'bg-info'}" 
                             role="progressbar" 
                             style="width: ${Math.min(percentOfGoal, 100)}%"></div>
                    </div>
                    <small class="mt-1 d-block ${percentOfGoal >= 100 ? 'text-success' : ''}">${percentOfGoal}%</small>
                </td>
                <td>${statusBadge}</td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Loads custom water containers from storage and displays them
     */
    async loadCustomContainers() {
        const [containers] = await Promise.all([this.getCustomContainers()]);
        this.updateCustomContainersTable(containers);
        await this.updateCustomContainerPresets(containers);

        // Setup event listeners for dynamically added presets
        this.setupDynamicPresetsListeners();
    }

    /**
     * Gets custom water containers from storage
     * @returns {Array} - Array of custom container objects
     */
    async getCustomContainers() {
        const containers = await this.storageManager.getWaterContainers();
        containers.filter(c => !c.isDefault);
        return containers;
    }

    /**
     * Updates the custom containers table in the modal
     * @param {Array} containers - Array of container objects
     */
    updateCustomContainersTable(containers) {
        const table = document.getElementById('customContainersTable');

        if (containers.length === 0) {
            table.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4" class="text-center py-3">
                        <p class="text-muted mb-0">No custom containers defined yet.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        // console.log("Containers: ", containers);
        containers.forEach(container => {
            html += `
                <tr>
                    <td><i class="fas ${container.icon || 'fa-tint'}"></i></td>
                    <td>${container.label}</td>
                    <td>${container.amount} ml</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-container" data-id="${container.id}">
                            <i class="fas fa-trash" style="pointer-events: none"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        table.innerHTML = html;
    }

    /**
     * Updates the custom container presets in the water form
     * @param {Array} containers - Array of container objects
     */
    async updateCustomContainerPresets(containers) {
        // Get the container where presets will be added
        const presetsContainer = document.getElementById('waterPresetsContainer');

        // Check if default containers should be shown
        let defaults = await this.storageManager.getDefaultWaterContainers();

        const showDefaultContainers = defaults[0].isActive;

        // Clear all existing presets
        presetsContainer.innerHTML = '';

        // Add default presets if enabled
        if (showDefaultContainers) {
            defaults.forEach(container => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-info water-preset default-water-preset';
                button.dataset.amount = container.amount;
                button.innerHTML = `<i class="fas ${container.icon} me-1"></i> ${container.label}`;

                presetsContainer.appendChild(button);
            });
        }

        // Add custom presets
        if (containers) {
            containers.forEach(container => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-primary water-preset custom-water-preset';
                button.dataset.amount = container.amount;
                button.innerHTML = `<i class="fas ${container.icon || 'fa-tint'} me-1"></i> ${container.label} (${container.amount}ml)`;

                presetsContainer.appendChild(button);
            });
        }

        // If no containers are visible, show a message
        if (!showDefaultContainers && containers.length === 0) {
            const message = document.createElement('div');
            message.className = 'text-muted text-center p-2';
            message.innerHTML = '<small>No water container presets available. Enable default containers or add custom ones.</small>';
            presetsContainer.appendChild(message);
        }
    }

    /**
     * Sets up event listeners for dynamically added preset buttons
     */
    setupDynamicPresetsListeners() {
        document.querySelectorAll('.water-preset').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('waterAmount').value = parseInt(button.dataset.amount);
            });
        });
    }

    /**
     * Handles adding a new custom container
     */
    async handleAddCustomContainer() {
        const nameInput = document.getElementById('containerName');
        const sizeInput = document.getElementById('containerSize');
        const iconInput = document.getElementById('containerIcon');

        const name = nameInput.value.trim();
        const size = parseInt(sizeInput.value);
        const icon = iconInput.value;

        if (!name || !size || size <= 0) {
            alert('Please enter a valid container name and size.');
            return;
        }

        const newContainer = {
            label: name, amount: size, icon: icon
        };

        await this.addCustomContainer(newContainer);

        // Reset form
        nameInput.value = '';
        sizeInput.value = '';

        // Show success message
        // alert(`Added "${name}" container successfully!`);
        app.settingsManager.showToast(`Added "${name}" container successfully!`, 'success');
    }

    /**
     * Adds a custom container to storage and updates UI
     * @param {Object} container - The container object to add
     */
    async addCustomContainer(container) {
        // Save to storage
        await this.storageManager.addCustomWaterContainer(container);

        let containers = await this.storageManager.getWaterContainers();
        // Update UI
        this.updateCustomContainersTable(containers);
        this.updateCustomContainerPresets(containers);
        this.setupDynamicPresetsListeners();
    }

    /**
     * Deletes a custom container from storage and updates UI
     * @param {string} containerId - ID of the container to delete
     */
    async deleteCustomContainer(containerId) {

        // Save to storage

        await this.storageManager.deleteCustomWaterContainer(containerId);

        let containers = await this.storageManager.getWaterContainers();

        // Update UI
        this.updateCustomContainersTable(containers);
        this.updateCustomContainerPresets(containers);
        this.setupDynamicPresetsListeners();
    }

    async updateWaterGoal() {
        const goals = await this.storageManager.getGoals();
        this.waterGoal = goals.waterGoal || 0;
        this.updateWaterUI();
    }
}