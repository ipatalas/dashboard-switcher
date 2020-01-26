// @ts-check
function CountdownTimer() {
    this.nextChange = new Date();

    this.start = function() {
        setInterval(loop.bind(this), 1000);
    };

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