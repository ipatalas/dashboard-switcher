(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InstallButtonHandler = InstallButtonHandler;
/*global mqtt */
function InstallButtonHandler(scheduler, config) {
  const client = mqtt.connect(config.server);
  client.on('connect', function () {
    console.log('Connected to MQTT');
    client.subscribe(config.topic, function (err) {
      if (err) {
        console.log(err);
      }
    });
    client.on('message', function (_, payload) {
      payload = JSON.parse(payload.toString());
      if (payload.click == 'single') {
        scheduler.next();
      }
    });
  });
}

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CountdownTimer = void 0;
class CountdownTimer {
  constructor() {
    this.nextChange = new Date();
    this.start = function () {
      setInterval(loop.bind(this), 1000);
    };

    /**
     * @this {CountdownTimer}
     */
    function loop() {
      const now = new Date();
      const diffSeconds = (this.nextChange.getTime() - now.getTime()) / 1000;
      const el = document.getElementById('countdown');
      el.innerHTML = Math.round(diffSeconds) + 's';
      if (diffSeconds <= 15) {
        el.classList.add('before-change');
      } else {
        el.classList.remove('before-change');
      }
    }
  }
}
exports.CountdownTimer = CountdownTimer;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Dashboard = void 0;
class Dashboard {
  /**
   * @param {Object} schedule
   * @param {string} schedule.url
   * @param {string} schedule.duration
   * @param {string} schedule.active_hours
   * @param {Array<string>} schedule.weekdays
   */
  constructor(schedule) {
    this.url = schedule.url;
    this.duration = parseTimespan(schedule.duration);
    const active_hours = (schedule.active_hours || '00:00-23:59').split('-');
    this.activeFrom = parseHourAndMinutes(active_hours[0]);
    this.activeTo = parseHourAndMinutes(active_hours[1]);
    this.activeWeekday = schedule.weekdays || ['all'];
    this.isOvernight = this.activeFrom.h > this.activeTo.h;

    /**
     * @param {Date} now
     */
    this.isActive = function (now) {
      now = now || new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const isAfterFrom = h > this.activeFrom.h || h == this.activeFrom.h && m >= this.activeFrom.m;
      const isBeforeTo = h < this.activeTo.h || h == this.activeTo.h && m <= this.activeTo.m;
      return this._weekdayMatches(now) && (this.isOvernight ? isAfterFrom || isBeforeTo : isAfterFrom && isBeforeTo);
    };

    /**
     * @param {Date} now
     */
    this._weekdayMatches = function (now) {
      if (this.activeWeekday.includes('all')) {
        return true;
      }
      const weekday = now.getDay();
      if (this.activeWeekday.includes('workdays')) {
        return weekday >= 1 && weekday <= 5;
      }
      const weekdayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday];
      return this.activeWeekday.includes(weekdayName);
    };

    /**
     * @param {string} time
     */
    function parseHourAndMinutes(time) {
      const [h, m] = time.split(':');
      return {
        h,
        m
      };
    }

    /**
     * @param {string} text
     */
    function parseTimespan(text) {
      const match = /^(?<value>\d+)(?<unit>[sm])$/.exec(text);
      const value = parseInt(match.groups.value);
      const multiplier = match.groups.unit === 'm' ? 60000 : 1000;
      return value * multiplier;
    }
  }
}
exports.Dashboard = Dashboard;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OtelLogger = void 0;
class OtelLogger {
  /**
   * @param {string} serviceName - Name of the service to identify in logs
   * @param {string} endpoint - OTLP HTTP endpoint (e.g., http://localhost:4318/v1/logs)
   * @param {Object} defaultAttributes - Default attributes to include in every log
   */
  constructor(serviceName, endpoint, defaultAttributes = {}) {
    this.serviceName = serviceName;
    this.endpoint = endpoint;
    this.defaultAttributes = defaultAttributes;
  }
  async log(level, arg1, arg2) {
    const severity = {
      info: {
        number: 9,
        text: 'INFO'
      },
      warn: {
        number: 13,
        text: 'WARNING'
      },
      error: {
        number: 17,
        text: 'ERROR'
      }
    }[level];
    let message = '';
    let attributes = this.getAttributes(this.defaultAttributes);
    if (typeof arg1 === 'string') {
      message = arg1;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      message = arg2 || '';
      attributes = attributes.concat(this.getAttributes(arg1));
    }
    const payload = {
      resourceLogs: [{
        resource: {
          attributes: [{
            key: 'service.name',
            value: {
              stringValue: this.serviceName
            }
          }]
        },
        scopeLogs: [{
          scope: {},
          logRecords: [{
            timeUnixNano: String(Date.now() * 1000000),
            severityNumber: severity.number,
            severityText: severity.text,
            body: {
              stringValue: message
            },
            attributes: attributes
          }]
        }]
      }]
    };
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to send log:', err);
    }
  }
  getAttributes(attributes) {
    return Object.getOwnPropertyNames(attributes).map(key => ({
      key,
      value: {
        stringValue: String(attributes[key])
      }
    }));
  }
  info(arg1, arg2) {
    return this.log('info', arg1, arg2);
  }
  warn(arg1, arg2) {
    return this.log('warn', arg1, arg2);
  }
  error(arg1, arg2) {
    return this.log('error', arg1, arg2);
  }
}
exports.OtelLogger = OtelLogger;

},{}],5:[function(require,module,exports){
"use strict";

var _countdownTimer = require("./countdown-timer.js");
var _scheduler = require("./scheduler.js");
var _button = require("./button.js");
var _logger = require("./logger.js");
const attributes = {
  'origin': document.URL,
  'userAgent': navigator.userAgent
};
const logger = new _logger.OtelLogger('dashboard-switcher', 'http://otel.debian.local:4318/v1/logs', attributes);
(async () => {
  const urlParams = new URLSearchParams(location.search);
  const logError = msg => {
    const x = document.getElementById('error');
    x.style.display = 'block';
    x.innerText = x.innerText.length > 0 ? x.innerText + '\n' + msg : msg;
  };
  if (urlParams.has('debug')) {
    console.log = logError;
    console.error = logError;
  }
  try {
    const configUrl = urlParams.get('config');
    if (!configUrl) {
      logger.error('No configuration URL provided');
      logError('No configuration URL provided');
      return;
    }
    const response = await fetch(configUrl, {
      cache: 'no-store'
    });
    console.log('Config URL: ' + configUrl);
    if (response.status !== 200) {
      logger.error({
        status: response.status,
        params: location.search
      }, 'Bad response');
      logError('Bad response - ' + response.status);
      logError('Params: ' + location.search);
      console.error(await response.text());
    } else {
      const config = await response.json();
      const countdown = new _countdownTimer.CountdownTimer();
      const scheduler = new _scheduler.Scheduler(config.dashboards, countdown);
      if (config.dashboards.length > 1) {
        scheduler.start();
        countdown.start();
        if (config.mqtt_button) {
          (0, _button.InstallButtonHandler)(scheduler, config.mqtt_button);
        }
      }
    }
  } catch (ex) {
    logger.error(ex, 'Error while fetching configuration');
    logError(`Error while fetching configuration\n\n${ex.message}\n\n${ex.stack}`);
  }
})();

},{"./button.js":1,"./countdown-timer.js":2,"./logger.js":4,"./scheduler.js":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Scheduler = void 0;
var _dashboard = require("./dashboard.js");
var _countdownTimer = require("./countdown-timer.js");
// eslint-disable-next-line no-unused-vars

class Scheduler {
  /**
   * @param {Object[]} dashboards
   * @param {string} dashboards.url
   * @param {string|number} dashboards.duration
   * @param {string} dashboards.active_hours
   * @param {CountdownTimer} countdownTimer
   */
  constructor(dashboards, countdownTimer) {
    this.dashboards = dashboards.map(x => new _dashboard.Dashboard(x));
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
exports.Scheduler = Scheduler;

},{"./countdown-timer.js":2,"./dashboard.js":3}]},{},[5]);
