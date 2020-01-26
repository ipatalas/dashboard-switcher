function Scheduler(dashboards, countdownTimer) {
    this.dashboards = dashboards.map(x => new Dashboard(x));
    this.countdownTimer = countdownTimer;
    this.index = 0;
    this.activeFrame = 0;
    this.preloadTime = 5000;

    this.frames = [
        document.getElementById('main'),
        document.getElementById('main2'),
    ];

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

    setTimeout(this.mainLoop.bind(this), interval);
    setTimeout(this.preloadFrame.bind(this), interval - this.preloadTime);
}

Scheduler.prototype.swapFrames = function() {
    console.log('Swapping frames');
    this.frames.forEach(frame => {
        frame.classList.toggle('visible');
    });
}

Scheduler.prototype.preloadFrame = function() {
    console.log('Preloading next dashboard');

    this.activeFrame = ++this.activeFrame % 2;

    const preloadFrame = this.frames[this.activeFrame];
    preloadFrame.src = this.dashboards[this.index].url;
}

Scheduler.prototype.skipInactiveDashboards = function(now) {
    while (!this.dashboards[this.index].isActive(now)) {
        console.log('Ignoring inactive dashboard, skipping to next one');

        this.index = ++this.index % this.dashboards.length;
    }
}

Scheduler.prototype.start = function() {
    this.mainLoop();
}