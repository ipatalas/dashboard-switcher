
export class Dashboard {
    /**
     * @param {Object} schedule
     * @param {string} schedule.url
     * @param {string} schedule.duration
     * @param {string} schedule.active_hours
     */
    constructor(schedule) {
        this.url = schedule.url;
        this.duration = parseTimespan(schedule.duration);

        const active_hours = (schedule.active_hours || '00:00-23:59').split('-');
        this.activeFrom = parseHourAndMinutes(active_hours[0]);
        this.activeTo = parseHourAndMinutes(active_hours[1]);

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

            return this.isOvernight
                ? isAfterFrom || isBeforeTo
                : isAfterFrom && isBeforeTo;
        };

        /**
         * @param {string} time
         */
        function parseHourAndMinutes(time) {
            const [h, m] = time.split(':');
            return { h, m };
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
