/**
 * Confetti Manager - Handles the confetti animation when calorie goal is reached
 */
class ConfettiManager {
    constructor() {
        this.loadTriggerStatus();
    }

    /**
     * Loads whether confetti has been triggered today
     */
    loadTriggerStatus() {
        const today = new Date().toISOString().split('T')[0];
        const triggeredDates = JSON.parse(localStorage.getItem('confettiTriggered') || '{}');
        this.triggeredToday = triggeredDates[today] || false;
    }

    /**
     * Checks if confetti should be triggered based on calorie count
     * @param {number} calories - Current calorie count
     * @param {number} goal - Calorie goal
     */
    checkAndTrigger(calories, goal) {
        // If we've already triggered confetti today, don't trigger again
        if (this.triggeredToday) {
            return;
        }
        
        // If we've reached the goal, trigger confetti
        if (calories >= goal) {
            this.triggerConfetti();
            this.showCongratulationsMessage();
            this.markAsTriggered();
        }
    }

    /**
     * Triggers the confetti animation
     */
    triggerConfetti() {
        // Make sure confetti function exists
        if (typeof confetti !== 'function') {
            console.error('Confetti library not loaded');
            return;
        }
        
        // Trigger confetti from multiple origins
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };
        
        // Launch from left
        confetti({
            ...defaults,
            particleCount: count,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        
        // Launch from right
        confetti({
            ...defaults,
            particleCount: count,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
    }

    /**
     * Shows a congratulations message
     */
    showCongratulationsMessage() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        const toastContainer = document.querySelector('.toast-container');
        
        // Create toast element
        const toastElement = document.createElement('div');
        toastElement.className = 'toast align-items-center text-white bg-success border-0';
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        
        // Create toast content
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-trophy me-2"></i> Congratulations! You've reached your calorie goal for today!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastElement);
        
        // Create bootstrap toast instance
        const toast = new bootstrap.Toast(toastElement, {
            autohide: false
        });
        toast.show();
    }

    /**
     * Marks confetti as triggered for today
     */
    markAsTriggered() {
        const today = new Date().toISOString().split('T')[0];
        const triggeredDates = JSON.parse(localStorage.getItem('confettiTriggered') || '{}');
        
        triggeredDates[today] = true;
        localStorage.setItem('confettiTriggered', JSON.stringify(triggeredDates));
        
        this.triggeredToday = true;
    }

    /**
     * Resets the trigger status for a new day
     */
    resetTriggerStatus() {
        this.triggeredToday = false;
    }
}

/**
 * Helper function for random range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number in range
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
