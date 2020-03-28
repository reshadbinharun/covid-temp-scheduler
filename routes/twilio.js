require('dotenv').config();
var express = require('express');
var router = express.Router();
const accountSid = process.env.TWILIO_AC;
const authToken = process.env.TWILIO_AUTH;
const client = require('twilio')(accountSid, authToken);
const moment = require('moment');

router.get('/start', async (req, res) => {
    try {
        const flow = process.env.TWILIO_FLOW;
        const timeNow = moment().format('MMMM Do YYYY, h:mm:ss a');
        client.studio.v1.flows(flow).executions.create({ to: process.env.TWILIO_TO, from: process.env.TWILIO_FROM, parameters: JSON.stringify({time: timeNow})}).then(function(execution) { console.log("Successfully executed flow!", execution.sid); });
    } catch (e) {
        res.json({
            message: e
        });
    }
    res.send('Successfully started process with no errors')
});

module.exports = router;
