/**
 * Chart Manager - Handles the calorie chart visualization
 */
class ChartManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.calorieGoal = 3000;
        this.chart = null;
        this.initChart();
    }



    /**
     * Initializes the donut chart
     */
    initChart() {
        const canvas = document.getElementById('calorieChart');
        if (!canvas) {
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Consumed', 'Remaining'],
                datasets: [{
                    data: [0, this.calorieGoal],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(220, 220, 220, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(220, 220, 220, 0.5)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} calories`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Updates the chart with new calorie data
     * @param {number} consumedCalories - Calories consumed
     */
    async updateChart(consumedCalories) {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }

        // Get the latest calorie goal (in case it was updated in settings)
        const goals = await this.storageManager.getGoals();
        this.calorieGoal = goals.calorieGoal || 0;

        // Calculate remaining calories
        let remaining = this.calorieGoal - consumedCalories;
        if (remaining < 0) remaining = 0;

        // Update chart data
        this.chart.data.datasets[0].data = [consumedCalories, remaining];

        // Update chart colors based on percentage
        const percentConsumed = (consumedCalories / this.calorieGoal) * 100;

        if (percentConsumed >= 100) {
            this.chart.data.datasets[0].backgroundColor[0] = 'rgba(2,246,58,0.6)';
            this.chart.data.datasets[0].borderColor[0] = 'rgb(6,137,246)';
        } else if (percentConsumed < 50) {
            this.chart.data.datasets[0].backgroundColor[0] = 'rgba(75, 192, 192, 0.6)';
            this.chart.data.datasets[0].borderColor[0] = 'rgba(75, 192, 192, 1)';
        } else if (percentConsumed < 80) {
            this.chart.data.datasets[0].backgroundColor[0] = 'rgba(255, 159, 64, 0.6)';
            this.chart.data.datasets[0].borderColor[0] = 'rgba(255, 159, 64, 1)';
        } else {
            this.chart.data.datasets[0].backgroundColor[0] = 'rgba(255, 99, 132, 0.6)';
            this.chart.data.datasets[0].borderColor[0] = 'rgba(255, 99, 132, 1)';
        }

        // Update chart
        this.chart.update();

        // Update progress bar and counter
        this.updateProgressBar(consumedCalories);
    }

    /**
     * Updates the progress bar and counter text
     * @param {number} consumedCalories - Calories consumed
     */
    updateProgressBar(consumedCalories) {
        const progressBar = document.getElementById('calorieProgress');
        const counterText = document.getElementById('calorieCounter');
        
        if (!progressBar || !counterText) {
            console.error('Progress bar or counter elements not found');
            return;
        }
        
        // Calculate percentage
        let percentage = (consumedCalories / this.calorieGoal) * 100;
        if (percentage > 100) percentage = 100;
        
        // Update progress bar
        progressBar.style.width = `${percentage}%`;
        
        // Update color based on percentage
        if (percentage < 50) {
            progressBar.className = 'progress-bar bg-success';
        } else if (percentage < 80) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-danger';
        }
        
        // Update counter text
        counterText.textContent = `${consumedCalories} / ${this.calorieGoal} calories`;
    }
}
