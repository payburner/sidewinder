
class MetricsService {

    constructor( docClient ) {

        this.docClient = docClient;

    }

    metricExists(metric, key) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metric,
                    ":sw_key": key
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    if (data.Items.length === 0) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        });
    }

    publishMetrics( updates ) {


        const self = this;



        const items = [];
        updates.forEach( (update) => {
            items.push(
                new Promise(async (resolve) => {
                    const exists = await self.metricExists(update.metric, update.key);
                    console.log('Metric exists:' + update.metric + ' ' + update.key + ' ' + exists);
                    if (exists) {
                        resolve({
                            Update: {
                                TableName: 'sidewinder_metrics',
                                Key: {
                                    sw_metric: update.metric,
                                    sw_key: update.key
                                },
                                UpdateExpression: 'SET sw_value = sw_value + :input_value',
                                'ExpressionAttributeValues': {
                                    ':input_value' : update.value
                                }
                            }
                        });
                    }
                    else {
                        resolve({
                            Put: {
                                TableName: 'sidewinder_metrics',
                                Item: {
                                    sw_metric: update.metric,
                                    sw_key: update.key,
                                    sw_value: update.value
                                }
                            }
                        });
                    }
                })
            );

        });
        return new Promise( async (resolve, reject) => {
            const values = await Promise.all(items);
            console.log('Items:' + JSON.stringify(values, null, 2));

            console.log('Sending Metrics to DB');
            self.docClient.transactWrite({ TransactItems: values }, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        });
    }

    getMetric(metric, key) {
        const self = this;
        return new Promise((resolve) => {
            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metric,
                    ":sw_key": key
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    if (data.Items.length === 0) {
                        resolve(data.Items[0].sw_value);
                    }
                    else {
                        resolve(0);
                    }
                }
            });
        });
    }

    getFullMetric(metric, display, key) {
        const self = this;
        return new Promise((resolve) => {

            const params = {
                TableName: "sidewinder_metrics",
                KeyConditionExpression: "sw_metric = :sw_metric and sw_key = :sw_key",
                ExpressionAttributeValues: {
                    ":sw_metric": metric,
                    ":sw_key": key
                }
            };
            console.log('get metric:' + JSON.stringify(params, null, 2));

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve(false);
                } else {
                    console.log('got metric:' + JSON.stringify(data, null, 2));
                    if (data.Items.length > 0) {
                        resolve(
                            {
                                metric: metric,
                                key: key,
                                display: display,
                                value: typeof data.Items[0].sw_value === 'undefined' ? 0 : data.Items[0].sw_value
                            } );
                    }
                    else {
                        resolve({
                            metric: metric,
                            key: key,
                            display: display,
                            value: 0
                        });
                    }
                }
            });
        });
    }

}

module.exports.MetricsService = MetricsService;