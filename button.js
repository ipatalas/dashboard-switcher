/*global mqtt */
export function InstallButtonHandler(scheduler, config) {
    const client = mqtt.connect(config.server);

    client.on('connect', function() {
        console.log('Connected to MQTT');

        client.subscribe(config.topic, function(err) {
            if (err) {
                console.log(err);
            }
        });

        client.on('message', function(_, payload) {
            payload = JSON.parse(payload.toString());

            if (payload.click == 'single') {
                scheduler.next();
            }
        });
    });
}