import { CountdownTimer } from './countdown-timer.js';
import { Scheduler } from './scheduler.js';
import { InstallButtonHandler } from './button.js';
import { OtelLogger } from "./logger.js";

const attributes = {
    'origin': document.URL,
    'userAgent': navigator.userAgent,
};
const logger = new OtelLogger('dashboard-switcher', 'http://otel.debian.local:4318/v1/logs', attributes);

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

        const response = await fetch(configUrl, { cache: 'no-store' });

        console.log('Config URL: ' + configUrl);

        if (response.status !== 200) {
            logger.error({ status: response.status, params: location.search }, 'Bad response');
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
        logger.error(ex, 'Error while fetching configuration');
        logError('Error while fetching configuration\n\n' + ex);
    }
})();