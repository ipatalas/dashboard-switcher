function Scheduler(dashboards, countdownTimer) {
    this.dashboards = dashboards.map(x => new Dashboard(x));
    this.countdownTimer = countdownTimer;
    this.index = 0;
    this.activeFrame = 0;
    this.preloadTime = 5000;

    this.mainTimeout = null;
    this.preloadTimeout = null;

    this.frames = document.querySelectorAll('iframe');

    console.table(this.dashboards);

    this.skipInactiveDashboards();

    const frame = this.frames[this.activeFrame];

    if (frame.src != this.dashboards[this.index].url) {
        frame.src = this.dashboards[this.index].url;
    }
}

Scheduler.prototype.mainLoop = function () {
    this.swapFrames();

    const interval = this.dashboards[this.index].duration;
    this.countdownTimer.nextChange = new Date(Date.now() + interval);

    // set next dashboard
    this.index = ++this.index % this.dashboards.length;
    this.skipInactiveDashboards(this.countdownTimer.nextChange);
    console.log(`Set next dashboard to: ${this.dashboards[this.index].url}`);

    this.mainTimeout = setTimeout(this.mainLoop.bind(this), interval);
    this.preloadTimeout = setTimeout(this.preloadFrame.bind(this), interval - this.preloadTime);
}

Scheduler.prototype.swapFrames = function() {
    console.log('Swapping frames');

    this.frames.forEach(x => x.classList.toggle('visible'));
}

Scheduler.prototype.preloadFrame = function() {
    this.preloadTimeout = null;
    console.log(`Preloading next dashboard: ${this.dashboards[this.index].url}`);

    this.activeFrame = ++this.activeFrame % 2;

    const preloadFrame = this.frames[this.activeFrame];
    preloadFrame.src = this.dashboards[this.index].url;
}

Scheduler.prototype.skipInactiveDashboards = function(now) {
    while (!this.dashboards[this.index].isActive(now)) {
        console.log(`Skipping ${this.dashboards[this.index].url} (inactive at ${now})`);

        this.index = ++this.index % this.dashboards.length;
    }
}

Scheduler.prototype.start = function() {
    this.mainLoop();
}

Scheduler.prototype.next = function() {
    if (this.preloadTimeout) {
        clearTimeout(this.preloadTimeout);
        this.preloadFrame();
    }

    this.mainTimeout && clearTimeout(this.mainTimeout);
    setTimeout(this.mainLoop.bind(this), 200);
}