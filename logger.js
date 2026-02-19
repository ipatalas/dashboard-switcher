export class OtelLogger {
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
            info: { number: 9, text: 'INFO' },
            warn: { number: 13, text: 'WARNING' },
            error: { number: 17, text: 'ERROR' }
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
            resourceLogs: [
                {
                    resource: {
                        attributes: [
                            {
                                key: 'service.name',
                                value: {
                                    stringValue: this.serviceName
                                }
                            }
                        ]
                    },
                    scopeLogs: [
                        {
                            scope: {},
                            logRecords: [
                                {
                                    timeUnixNano: String(Date.now() * 1000000),
                                    severityNumber: severity.number,
                                    severityText: severity.text,
                                    body: {
                                        stringValue: message
                                    },
                                    attributes: attributes
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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