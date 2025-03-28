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
        this.currentDateLog = document.querySelector('.history h2');

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
        this.currentDateLog.textContent = "Intake log from " + this.formatDate(this.currentDate);

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
        this.logs.unshift({amount, time});

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
        this.circle.style.strokeDashoffset = this.circumference - (progress * this.circumference);

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

            this.currentIntakeDisplay.textContent = Math.round(start + (end - start) * progress).toString();

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


// Navbar
// PROFILE DROPDOWN
const profile = document.querySelector('.right-nav .profile');
const imgProfile = profile.querySelector('.right-nav .profile img');
const dropdownProfile = profile.querySelector('.profile-link');

imgProfile.addEventListener('click', function () {
    dropdownProfile.classList.toggle('show');
})


// MENU
const allMenu = document.querySelectorAll('main .content-data .head .menu');

allMenu.forEach(item => {
    const icon = item.querySelector('.icon');
    const menuLink = item.querySelector('.menu-link');

    icon.addEventListener('click', function () {
        menuLink.classList.toggle('show');
    })
})


window.addEventListener('click', function (e) {
    if (e.target !== imgProfile) {
        if (e.target !== dropdownProfile) {
            if (dropdownProfile.classList.contains('show')) {
                dropdownProfile.classList.remove('show');
            }
        }
    }

    allMenu.forEach(item => {
        const icon = item.querySelector('.icon');
        const menuLink = item.querySelector('.menu-link');

        if (e.target !== icon) {
            if (e.target !== menuLink) {
                if (menuLink.classList.contains('show')) {
                    menuLink.classList.remove('show')
                }
            }
        }
    })
})


// PROGRESSBAR
const allProgress = document.querySelectorAll('main .card .progress');

allProgress.forEach(item => {
    item.style.setProperty('--value', item.dataset.value)
})


// APEXCHART
const options = {
    series: [{
        name: 'series1',
        data: [31, 40, 28, 51, 42, 109, 100]
    }, {
        name: 'series2',
        data: [11, 32, 45, 32, 34, 52, 41]
    }],
    chart: {
        height: 350,
        type: 'area'
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth'
    },
    xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"]
    },
    tooltip: {
        x: {
            format: 'dd/MM/yy HH:mm'
        },
    },
};

const chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

const openBtn = document.querySelector(".open-btn");
const closeBtn = document.querySelector(".close-btn");
const sidebar = document.querySelector(".sidebar");
const navLinks = document.querySelectorAll(".nav-links a");

openBtn.addEventListener("click", function () {
    sidebar.classList.add("open");
});

// close sidebar
closeBtn.addEventListener("click", function () {
    sidebar.classList.remove("open");
});

// control active nav-link
navLinks.forEach((navLink) => {
    navLink.addEventListener("click", function () {
        navLinks.forEach((l) => l.classList.remove("active"));
        this.classList.add("active");
    });
});