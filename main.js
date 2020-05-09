import { CountdownTimer } from './countdown-timer.js';
import { Scheduler } from './scheduler.js';
import { InstallButtonHandler } from './button.js';

(async () => {
    const urlParams = new URLSearchParams(location.search);

    const logError = msg => {
        const x = document.getElementById('error');
        x.innerText = x.innerText.length > 0 ? x.innerText + '\n' + msg : msg;
    };

    if (urlParams.has('debug')) {
        console.log = logError;
        console.error = logError;
    }

    try {
        const configUrl = urlParams.get('config');
        const response = await fetch(configUrl, { cache: 'no-store' });

        console.log('Config URL: ' + configUrl);

        if (response.status !== 200) {
            logError('Bad response - ' + response.status);
            logError('Params: ' + location.search);
            console.error(await response.text());
        } else {
            const config = await response.json();

            const countdown = new CountdownTimer();
            const scheduler = new Scheduler(config.dashboards, countdown);

            if (config.dashboards.length > 1) {
                scheduler.start();
                countdown.start();

                if (config.mqtt_button) {
                    InstallButtonHandler(scheduler, config.mqtt_button);
                }
            }
        }
    } catch (ex) {
        logError('Error while fetching configuration\n\n' + ex);
    }
})();