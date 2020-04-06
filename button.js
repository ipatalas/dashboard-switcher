function ButtonHandler(scheduler) {
    const client = mqtt.connect('ws://home:9001');

    client.on('connect', function() {
        console.log('Connected to MQTT');

        client.subscribe('raw/zigbee2mqtt/button', function(err) {
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