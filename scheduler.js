import { Dashboard } from './dashboard.js';
import { CountdownTimer } from './countdown-timer.js';

export class Scheduler {
    /**
     * @param {Object[]} dashboards
     * @param {string} dashboards.url
     * @param {number} dashboards.duration
     * @param {string} dashboards.active_hours
     * @param {CountdownTimer} countdownTimer
     */
    constructor(dashboards, countdownTimer) {
        this.dashboards = dashboards.map(x => new Dashboard(x));
        this.countdownTimer = countdownTimer;

        this.frames = Array.from(document.querySelectorAll('iframe'));
        this.timerId = null;

        this.visibleFrame = this.detectVisibleFrameIndex();
        this.visibleDashboardIndex = null;
        this.preloadedDashboardIndex = null;

        console.table(this.dashboards);
    }

    start() {
        this.clearTimer();

        if (this.dashboards.length === 0 || this.frames.length < 2) {
            console.warn('Scheduler cannot start: missing dashboards or iframes');
            return;
        }

        const now = new Date();
        const currentIndex = this.dashboards.findIndex(d => d.isActive(now));

        if (currentIndex === -1) {
            console.warn('No active dashboards at start');
            this.scheduleRetry();
            return;
        }

        const url = this.dashboards[currentIndex].url;
        this.frames[this.visibleFrame].src = url;
        this.visibleDashboardIndex = currentIndex;

        this.planNextCycle(now);
    }

    next() {
        this.clearTimer();

        if (this.visibleDashboardIndex === null) {
            this.start();
            return;
        }

        this.onTick();
    }

    onTick() {
        if (this.visibleDashboardIndex === null) {
            this.start();
            return;
        }

        const now = new Date();
        const currentIndex = this.visibleDashboardIndex;
        const candidateIndex = this.pickNextDifferentIndex(currentIndex, now);

        if (candidateIndex !== null) {
            this.ensurePreloaded(candidateIndex);
            this.swapFrames();
            this.visibleDashboardIndex = candidateIndex;
            this.preloadedDashboardIndex = null;

            console.log(`Switched to: ${this.dashboards[candidateIndex].url}`);
        } else {
            console.log(`Staying on: ${this.dashboards[currentIndex].url}`);
        }

        this.planNextCycle(now);
    }

    planNextCycle(now) {
        const currentIndex = this.visibleDashboardIndex;

        if (currentIndex === null) {
            this.scheduleRetry();
            return;
        }

        const duration = this.dashboards[currentIndex].duration;
        const nextChange = new Date(now.getTime() + duration);
        this.countdownTimer.nextChange = nextChange;

        const preloadIndex = this.pickNextDifferentIndex(currentIndex, nextChange);
        if (preloadIndex !== null) {
            this.ensurePreloaded(preloadIndex);
            console.log(`Preloaded next: ${this.dashboards[preloadIndex].url}`);
        } else {
            this.preloadedDashboardIndex = null;
            console.log('No different active dashboard to preload');
        }

        this.timerId = setTimeout(() => this.onTick(), duration);
    }

    ensurePreloaded(dashboardIndex) {
        const hiddenFrame = this.getHiddenFrameIndex();
        const url = this.dashboards[dashboardIndex].url;

        if (this.preloadedDashboardIndex === dashboardIndex) {
            return;
        }

        this.frames[hiddenFrame].src = url;
        this.preloadedDashboardIndex = dashboardIndex;
    }

    swapFrames() {
        const newVisible = this.getHiddenFrameIndex();

        this.frames[this.visibleFrame].classList.remove('visible');
        this.frames[newVisible].classList.add('visible');

        this.visibleFrame = newVisible;
    }

    pickNextDifferentIndex(currentIndex, at) {
        if (currentIndex === null || this.dashboards.length === 0) {
            return null;
        }

        const currentUrl = this.dashboards[currentIndex].url;

        for (let step = 1; step <= this.dashboards.length; step++) {
            const i = (currentIndex + step) % this.dashboards.length;
            const d = this.dashboards[i];

            if (!d.isActive(at)) continue;
            if (d.url !== currentUrl) return i;
        }

        return null;
    }

    detectVisibleFrameIndex() {
        const idx = this.frames.findIndex(f => f.classList.contains('visible'));
        if (idx >= 0) return idx;

        throw new Error('No visible frame detected. Please ensure exactly one iframe has the "visible" class in HTML.');
    }

    getHiddenFrameIndex() {
        return (this.visibleFrame + 1) % 2;
    }

    scheduleRetry() {
        this.timerId = setTimeout(() => this.start(), 10_000);
    }

    clearTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}
