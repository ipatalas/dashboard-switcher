import { Dashboard } from './dashboard.js';
// eslint-disable-next-line no-unused-vars
import { CountdownTimer } from './countdown-timer.js';

export class Scheduler {
    /**
     * @param {Object[]} dashboards
     * @param {string} dashboards.url
     * @param {string} dashboards.duration
     * @param {string} dashboards.active_hours
     * @param {CountdownTimer} countdownTimer
     */
    constructor(dashboards, countdownTimer) {
        this.dashboards = dashboards.map(x => new Dashboard(x));
        this.countdownTimer = countdownTimer;
        this.index = 0;
        this.activeFrame = 0;
        this.mainTimeout = null;

        this.frames = document.querySelectorAll('iframe');
        console.table(this.dashboards);

        this.skipInactiveDashboards(new Date());

        const frame = this.frames[this.activeFrame];
        if (frame.src != this.dashboards[this.index].url) {
            frame.src = this.dashboards[this.index].url;
        }
    }

    mainLoop() {
        this.swapFrames();
        const interval = this.dashboards[this.index].duration;

        this.countdownTimer.nextChange = new Date(Date.now() + interval);
        this.index = ++this.index % this.dashboards.length;
        this.skipInactiveDashboards(this.countdownTimer.nextChange);

        console.log(`Set next dashboard to: ${this.dashboards[this.index].url}`);

        this.mainTimeout = setTimeout(this.mainLoop.bind(this), interval);
        this.preloadFrame();
    }

    swapFrames() {
        console.log('Swapping frames');
        this.frames.forEach(x => x.classList.toggle('visible'));
    }

    preloadFrame() {
        console.log(`Preloading next dashboard: ${this.dashboards[this.index].url}`);
        this.activeFrame = ++this.activeFrame % 2;

        const preloadFrame = this.frames[this.activeFrame];
        preloadFrame.src = this.dashboards[this.index].url;
    }

    /**
     * @param {Date} now
     */
    skipInactiveDashboards(now) {
        while (!this.dashboards[this.index].isActive(now)) {
            console.log(`Skipping ${this.dashboards[this.index].url} (inactive at ${now})`);
            this.index = ++this.index % this.dashboards.length;
        }
    }

    start() {
        this.mainLoop();
    }

    next() {
        this.mainTimeout && clearTimeout(this.mainTimeout);
        this.mainLoop();
    }
}
