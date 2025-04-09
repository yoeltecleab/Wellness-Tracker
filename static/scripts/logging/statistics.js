/**
 * Statistics Manager - Handles weekly statistics and data visualization
 */
class StatisticsManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        
        // Initialize charts when the weekly stats modal is opened
        document.getElementById('weeklyStatsBtn').addEventListener('click', () => {
            setTimeout(() => {
                this.initWeeklyCharts();
                this.updateWeeklyStats();
            }, 5); // Small delay to ensure DOM is ready
        });
    }
    
    /**
     * Initializes all weekly charts
     */
    initWeeklyCharts() {
        this.initWeeklyCaloriesChart();
        this.initWeeklyNutritionChart();
        this.initWeeklyHealthChart();
    }
    
    /**
     * Initializes the weekly calories chart
     */
    initWeeklyCaloriesChart() {
        const ctx = document.getElementById('weeklyCaloriesChart').getContext('2d');
        const data = this.getWeeklyCalorieData();
        
        if (this.weeklyCaloriesChart) {
            this.weeklyCaloriesChart.destroy();
        }
        
        this.weeklyCaloriesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Calories',
                    data: data.calories,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calories'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    /**
     * Initializes the weekly nutrition chart
     */
    initWeeklyNutritionChart() {
        const ctx = document.getElementById('weeklyNutritionChart').getContext('2d');
        const data = this.getWeeklyNutritionData();
        
        if (this.weeklyNutritionChart) {
            this.weeklyNutritionChart.destroy();
        }
        
        this.weeklyNutritionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Protein',
                        data: data.protein,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Carbs',
                        data: data.carbs,
                        backgroundColor: 'rgba(255, 205, 86, 0.2)',
                        borderColor: 'rgba(255, 205, 86, 1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Fat',
                        data: data.fat,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Grams'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Initializes the weekly health score chart
     */
    initWeeklyHealthChart() {
        const ctx = document.getElementById('weeklyHealthChart').getContext('2d');
        const data = this.getWeeklyHealthData();
        
        if (this.weeklyHealthChart) {
            this.weeklyHealthChart.destroy();
        }
        
        this.weeklyHealthChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Calories Goal', 'Healthy Foods', 'Protein Intake', 'Meal Distribution', 'Water Intake'],
                datasets: [{
                    label: 'Health Score',
                    data: [data.calorieScore, data.healthScore, data.proteinScore, data.mealScore, data.waterScore],
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }
            }
        });
    }
    
    /**
     * Gets weekly calorie data for the last 7 days
     * @returns {Object} - Object with labels and calorie data
     */
    getWeeklyCalorieData() {
        const weeklyData = this.storageManager.getWeeklyData();
        const labels = [];
        const calories = [];
        
        weeklyData.forEach(day => {
            // Convert date string to readable format (e.g., "Mon", "Tue")
            const date = new Date(day.date);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Calculate total calories for the day
            const totalCalories = day.entries.reduce((sum, entry) => sum + parseInt(entry.calories, 10), 0);
            calories.push(totalCalories);
        });
        
        return { labels, calories };
    }
    
    /**
     * Gets weekly nutrition data for the last 7 days
     * @returns {Object} - Object with labels and nutrition data
     */
    getWeeklyNutritionData() {
        const weeklyData = this.storageManager.getWeeklyData();
        const labels = [];
        const protein = [];
        const carbs = [];
        const fat = [];
        
        weeklyData.forEach(day => {
            // Convert date string to readable format (e.g., "Mon", "Tue")
            const date = new Date(day.date);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Calculate total nutrition values for the day
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            day.entries.forEach(entry => {
                totalProtein += parseInt(entry.protein || 0, 10);
                totalCarbs += parseInt(entry.carbs || 0, 10);
                totalFat += parseInt(entry.fat || 0, 10);
            });
            
            protein.push(totalProtein);
            carbs.push(totalCarbs);
            fat.push(totalFat);
        });
        
        return { labels, protein, carbs, fat };
    }
    
    /**
     * Gets weekly health data
     * @returns {Object} - Object with health score data
     */
    getWeeklyHealthData() {
        // Calculate health scores based on last week's data
        const weeklyData = this.storageManager.getWeeklyData();
        const calorieGoal = parseInt(localStorage.getItem('calorieGoal') || '3000', 10);
        
        // Default scores
        const scores = {
            calorieScore: 5,
            healthScore: 5,
            proteinScore: 5,
            mealScore: 5,
            waterScore: 5
        };
        
        // Calculate average values for the week
        let totalEntries = 0;
        let daysWithEntries = 0;
        let calorieGoalReached = 0;
        let healthyFoodCount = 0;
        let proteinTotal = 0;
        let waterTotal = 0;
        
        const mealTypeCounts = {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0
        };
        
        weeklyData.forEach(day => {
            if (day.entries.length > 0) {
                daysWithEntries++;
                
                // Calculate daily calories
                const dailyCalories = day.entries.reduce((sum, entry) => sum + parseInt(entry.calories, 10), 0);
                if (dailyCalories >= calorieGoal * 0.9 && dailyCalories <= calorieGoal * 1.1) {
                    calorieGoalReached++;
                }
                
                // Count healthy foods
                healthyFoodCount += day.entries.filter(entry => entry.healthRating === '3').length;
                
                // Calculate protein intake
                const dailyProtein = day.entries.reduce((sum, entry) => sum + parseInt(entry.protein || 0, 10), 0);
                proteinTotal += dailyProtein;
                
                // Count meal types
                day.entries.forEach(entry => {
                    if (mealTypeCounts[entry.mealType]) {
                        mealTypeCounts[entry.mealType]++;
                    }
                });
                
                // Add to total entries
                totalEntries += day.entries.length;
                
                // Calculate water intake (from localStorage)
                const waterKey = `waterIntake_${day.date}`;
                const dailyWater = parseInt(localStorage.getItem(waterKey) || '0', 10);
                waterTotal += dailyWater;
            }
        });
        
        // Calculate scores if we have data
        if (daysWithEntries > 0) {
            // Calorie score (0-10) based on how often the goal was reached
            scores.calorieScore = (calorieGoalReached / daysWithEntries) * 10;
            
            // Health score (0-10) based on percentage of healthy foods
            scores.healthScore = totalEntries > 0 ? (healthyFoodCount / totalEntries) * 10 : 5;
            
            // Protein score (0-10) based on average daily protein
            const avgProtein = proteinTotal / daysWithEntries;
            scores.proteinScore = Math.min(avgProtein / 15, 10); // 150g protein = perfect score
            
            // Meal distribution score (0-10)
            const mealBalance = Object.values(mealTypeCounts).reduce((a, b) => a + b, 0);
            const mealVariety = Object.values(mealTypeCounts).filter(count => count > 0).length;
            scores.mealScore = mealBalance > 0 ? (mealVariety / 4) * 10 : 5;
            
            // Water score (0-10) based on average daily water intake
            const avgWater = waterTotal / daysWithEntries;
            scores.waterScore = Math.min(avgWater / 8 * 10, 10); // 8 glasses = perfect score
        }
        
        return scores;
    }
    
    /**
     * Updates the weekly statistics summary
     */
    updateWeeklyStats() {
        const weeklyData = this.storageManager.getWeeklyData();
        
        // Calculate total calories for the week
        let totalCalories = 0;
        let totalHealthyFoods = 0;
        let totalEntries = 0;
        let daysWithEntries = 0;
        
        weeklyData.forEach(day => {
            if (day.entries.length > 0) {
                daysWithEntries++;
                totalEntries += day.entries.length;
                
                day.entries.forEach(entry => {
                    totalCalories += parseInt(entry.calories, 10);
                    if (entry.healthRating === '3') {
                        totalHealthyFoods++;
                    }
                });
            }
        });
        
        // Calculate averages
        const avgCaloriesPerDay = daysWithEntries > 0 ? Math.round(totalCalories / daysWithEntries) : 0;
        const healthyFoodPercentage = totalEntries > 0 ? Math.round((totalHealthyFoods / totalEntries) * 100) : 0;
        
        // Update the weekly summary
        document.getElementById('weeklyTotalCalories').textContent = totalCalories;
        document.getElementById('weeklyAvgCalories').textContent = avgCaloriesPerDay;
        document.getElementById('weeklyDaysLogged').textContent = daysWithEntries;
        document.getElementById('weeklyHealthyPercentage').textContent = `${healthyFoodPercentage}%`;
        
        // Get current streak
        const streak = this.storageManager.getStreak();
        document.getElementById('weeklyCurrStreak').textContent = streak;
    }
    
    /**
     * Updates the nutrition counters on the main page
     * @param {Date} date - The date to show nutrition data for
     */
    updateNutritionSummary(date) {
        const nutrition = this.storageManager.getTotalNutrition(date);
        
        // Get goals from settings or use defaults
        const proteinGoal = parseInt(localStorage.getItem('proteinGoal') || '150', 10);
        const carbsGoal = parseInt(localStorage.getItem('carbsGoal') || '300', 10);
        const fatGoal = parseInt(localStorage.getItem('fatGoal') || '65', 10);
        
        // Update nutrition displays
        document.getElementById('proteinCount').textContent = `${nutrition.protein}g`;
        document.getElementById('carbsCount').textContent = `${nutrition.carbs}g`;
        document.getElementById('fatCount').textContent = `${nutrition.fat}g`;
        
        // Update progress bars
        const proteinPercent = Math.min((nutrition.protein / proteinGoal) * 100, 100);
        const carbsPercent = Math.min((nutrition.carbs / carbsGoal) * 100, 100);
        const fatPercent = Math.min((nutrition.fat / fatGoal) * 100, 100);
        
        document.getElementById('proteinProgress').style.width = `${proteinPercent}%`;
        document.getElementById('carbsProgress').style.width = `${carbsPercent}%`;
        document.getElementById('fatProgress').style.width = `${fatPercent}%`;
    }
    
    /**
     * Updates the stat cards on the main page
     * @param {Date} date - The date to show stats for
     */
    updateStatCards(date) {
        const entries = this.storageManager.getFoodEntries(date);
        const totalCalories = this.storageManager.getTotalCalories(date);
        
        // Update total calories card
        document.getElementById('totalCaloriesCard').textContent = totalCalories;
        
        // Update meal count card (unique meal types)
        const mealTypes = new Set();
        entries.forEach(entry => mealTypes.add(entry.mealType));
        document.getElementById('mealCountCard').textContent = entries.length;
        
        // Update health score card
        const healthyEntries = entries.filter(entry => entry.healthRating === '3').length;
        const healthScore = entries.length > 0 ? Math.round((healthyEntries / entries.length) * 10) : 0;
        document.getElementById('healthScoreCard').textContent = `${healthScore}/10`;
        
        // Update streak card
        const streak = this.storageManager.getStreak();
        document.getElementById('streakCard').textContent = streak;
    }
}
