
class DestinationTagService {

    constructor( docClient ) {
        this.docClient = docClient;
    }

    getDestinationTagByAccountId( accountId ) {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_destination_tag_mapping",
                KeyConditionExpression: "accountId = :accountId",
                ExpressionAttributeValues: {
                    ":accountId": accountId
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve({status:500, error: err});
                } else {
                    console.log('Following Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status:200, data: data.Items[0]});
                    } else {
                        resolve({status:404, error: 'Not found.'});
                    }
                }
            });
        })
    }


    getByXrpAddressAndTag(xrp_address, destination_tag) {
        const self = this;
        if (typeof id === "number") {
            id = id.toFixed(0);
        }
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_destination_tag_mapping",
                KeyConditionExpression: "xrp_address = :xrp_address and destination_tag = :destination_tag",
                IndexName: 'xrp_address-destination_tag-index',
                ScanIndexForward: true,
                ExpressionAttributeValues: {
                    ":destination_tag": destination_tag,
                    ":xrp_address": xrp_address
                }
            };

            self.docClient.query(params, function (err, data) {
                if (err) {
                    resolve({status: 500, error: err});
                } else {
                    console.log('Following Items Len:' + data.Items.length);
                    if (data.Items.length > 0) {
                        resolve({status: 200, data: data.Items[0]})
                    } else {
                        resolve({status: 404, error: 'Not Found.'});
                    }
                }
            });
        })
    }

    setDestinationTag(accountId, token_id, xrp_address, destination_tag, platform, senderScreenName, botXrpAddress ) {


        const self = this;
        if (typeof destination_tag === "number") {
            destination_tag = destination_tag.toFixed(0);
        }
        return new Promise(async (resolve, reject) => {
            const dataBody = {
                accountId: accountId,
                token_id: token_id,
                xrp_address: xrp_address,
                bot_xrp_address: botXrpAddress,
                destination_tag: destination_tag,
                tag: destination_tag,
                social_platform: platform,
                social_id: senderScreenName
            };
            const update = {
                Put: {
                    TableName: 'sidewinder_destination_tag_mapping',
                    Item: dataBody,
                    ConditionExpression: "attribute_not_exists(accountId)"
                }
            }

            resolve(await self.transactionalWrite(update));
        });
    }

    transactionalWrite( update ) {
        const self = this;
        return new Promise( async (resolve, reject) => {

            console.log('Items:' + JSON.stringify([update], null, 2));

            console.log('Sending Write Request to DB');
            self.docClient.transactWrite({ TransactItems: [update] }, function (err, data) {
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

}

module.exports.DestinationTagService = DestinationTagService;