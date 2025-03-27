class WaterTracker {
    constructor() {
        this.targetIntake = 2000; // ml
        this.currentIntake = 0;
        this.logs = [];
        this.circle = document.querySelector('.progress-ring-circle');
        this.currentIntakeDisplay = document.getElementById('current-intake');
        this.waterLog = document.getElementById('water-log');
        this.currentDateDisplay = document.getElementById('currentDate');
        this.prevDayBtn = document.getElementById('prevDay');
        this.nextDayBtn = document.getElementById('nextDay');

        // Calculate circle properties
        const radius = this.circle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        // Create milestone notification element
        this.createMilestoneNotification();

        // Initialize date navigation
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);

        this.init();
    }

    init() {
        // Load saved data
        this.loadData();

        // Add event listeners
        document.querySelectorAll('.water-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.ml);
                this.addWater(amount);
                this.animateButton(btn);
            });
        });

        document.getElementById('add-custom').addEventListener('click', () => {
            const input = document.getElementById('custom-amount');
            const amount = parseInt(input.value);
            if (amount > 0) {
                this.addWater(amount);
                input.value = '';
                this.animateButton(document.getElementById('add-custom'));
            }
        });

        document.getElementById('custom-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('add-custom').click();
            }
        });

        document.getElementById('reset').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset today\'s progress?')) {
                this.reset();
            }
        });

        // Date navigation listeners
        this.prevDayBtn.addEventListener('click', () => this.navigateDay(-1));
        this.nextDayBtn.addEventListener('click', () => this.navigateDay(1));

        // Initial update
        this.updateDisplay();
        this.updateDateDisplay();
    }

    createMilestoneNotification() {
        const notification = document.createElement('div');
        notification.className = 'milestone-notification';
        document.body.appendChild(notification);
        this.milestoneNotification = notification;
    }

    showMilestoneNotification(message) {
        this.milestoneNotification.textContent = message;
        this.milestoneNotification.classList.add('show');
        setTimeout(() => {
            this.milestoneNotification.classList.remove('show');
        }, 3000);
    }

    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    formatDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }

    updateDateDisplay() {
        this.currentDateDisplay.textContent = this.formatDate(this.currentDate);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Disable next button if we're on today
        this.nextDayBtn.disabled = this.currentDate.getTime() === today.getTime();

        // Enable/disable controls based on whether we're viewing today
        const controls = document.querySelector('.controls');
        const resetBtn = document.getElementById('reset');
        if (this.currentDate.getTime() === today.getTime()) {
            controls.style.display = 'block';
            resetBtn.style.display = 'block';
        } else {
            controls.style.display = 'none';
            resetBtn.style.display = 'none';
        }
    }

    navigateDay(offset) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + offset);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Don't allow navigating to future dates
        if (newDate.getTime() <= today.getTime()) {
            this.currentDate = newDate;
            this.loadData();
            this.updateDisplay();
            this.updateDateDisplay();
        }
    }

    loadData() {
        const dateKey = this.currentDate.toLocaleDateString();
        const savedData = localStorage.getItem(`waterTracker_${dateKey}`);

        if (savedData) {
            const data = JSON.parse(savedData);
            this.currentIntake = data.intake;
            this.logs = data.logs;
        } else {
            this.currentIntake = 0;
            this.logs = [];
        }
    }

    saveData() {
        const dateKey = this.currentDate.toLocaleDateString();
        const data = {
            intake: this.currentIntake,
            logs: this.logs
        };
        localStorage.setItem(`waterTracker_${dateKey}`, JSON.stringify(data));
    }

    checkMilestones(previousIntake) {
        const milestones = [500, 1000, 1500, 2000];
        const previousMilestone = milestones.filter(m => previousIntake < m);
        const currentMilestone = milestones.filter(m => this.currentIntake >= m);

        const achievedMilestone = currentMilestone.find(m => !previousMilestone.includes(m));
        if (achievedMilestone) {
            this.showMilestoneNotification(`🎉 Congratulations! You've reached ${achievedMilestone}ml`);
        }
    }

    addWater(amount) {
        const previousIntake = this.currentIntake;
        this.currentIntake += amount;
        const time = new Date().toLocaleTimeString();
        this.logs.unshift({ amount, time });

        this.updateDisplay();
        this.saveData();
        this.checkMilestones(previousIntake);

        // Add animation effect
        this.circle.classList.add('pulse');
        setTimeout(() => this.circle.classList.remove('pulse'), 300);
    }

    updateDisplay() {
        // Update progress ring
        const progress = Math.min(this.currentIntake / this.targetIntake, 1);
        const offset = this.circumference - (progress * this.circumference);
        this.circle.style.strokeDashoffset = offset;

        // Update current intake display with animation
        const currentValue = parseInt(this.currentIntakeDisplay.textContent);
        this.animateNumber(currentValue, this.currentIntake);

        // Update log entries with animation
        this.waterLog.innerHTML = this.logs
            .map(log => `
                <div class="log-entry">
                    <span>${log.amount}ml added</span>
                    <span>${log.time}</span>
                </div>
            `)
            .join('');
    }

    animateNumber(start, end) {
        const duration = 500;
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const value = Math.round(start + (end - start) * progress);
            this.currentIntakeDisplay.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    reset() {
        this.currentIntake = 0;
        this.logs = [];
        this.updateDisplay();
        this.saveData();
    }
}

// Initialize the tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WaterTracker();
});