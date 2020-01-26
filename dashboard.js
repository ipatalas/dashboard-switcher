function Dashboard(schedule) {
    this.url = schedule.url;
    this.duration = parseTimespan(schedule.duration);

    const active_hours = (schedule.active_hours || '00:00-23:59').split('-');

    this.activeFrom = parseHourAndMinutes(active_hours[0]);
    this.activeTo = parseHourAndMinutes(active_hours[1]);

    this.isActive = function(now) {
        now = now || new Date();

        const h = now.getHours();
        const m = now.getMinutes();

        return (h > this.activeFrom.h || h == this.activeFrom.h && m >= this.activeFrom.m)
            && (h < this.activeTo.h || h == this.activeTo.h && m <= this.activeTo.m);
    };

    function parseHourAndMinutes(time) {
        const parts = time.split(':');
        return {
            h: parseInt(parts[0]),
            m: parseInt(parts[1])
        };
    }

    function parseTimespan(text) {
        const match = /^(?<value>\d+)(?<unit>[sm])$/.exec(text);
        const value = parseInt(match.groups.value);
        const mul = match.groups.unit === 'm' ? 60000 : 1000;

        return value * mul;
    }
}