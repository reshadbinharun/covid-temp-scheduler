require('dotenv').config();
var express = require('express');
var router = express.Router();
const accountSid = process.env.TWILIO_AC;
const authToken = process.env.TWILIO_AUTH;
const client = require('twilio')(accountSid, authToken);
const moment = require('moment');
var { checkIn, getUniqueUsers } = require('../cronHelpers');

router.get('/start', async (req, res) => {
    try {
        const flow = process.env.TWILIO_CHECKIN_FLOW;
        const timeNow = moment().format('MMMM Do YYYY, h:mm:ss a');
        client.studio.v1.flows(flow).executions.create({ to: process.env.TWILIO_TO, from: process.env.TWILIO_FROM, parameters: JSON.stringify({time: timeNow})}).then(function(execution) { console.log("Successfully executed flow!", execution.sid); });
        res.send('Successfully started process with no errors')
    } catch (e) {
        console.error("Error -> /twilio/start: ", e);
        res.json({
            message: e
        });
    }
});

router.get('/firstCall', async (req, res) => {
    try {
        dbclient = req.client;
        const flow = process.env.TWILIO_FIRST_CALL_FLOW
        let ingestedUsers = await readCollection(dbclient, process.env.DB, process.env.INGEST_COLLECTION)
        const existingUsers = await getUniqueUsers(dbclient);
        const existingPhones = existingUsers.map(user => user.phone);
        ingestedUsers = ingestedUsers.filter(user => {
            return !existingPhones.includes(user.phone);
        })
        await Promise.all(ingestedUsers.map(async (numberRecord) => {
            const phone = numberRecord.phone.replace(/\s/g, '');
            client.studio.v1.flows(flow).executions.create({ to: phone, from: process.env.TWILIO_FROM, MachineDetection: "Enable" }).then(function(execution) { console.log("Successfully executed flow!", execution.sid); });
        }));
        res.send("Successfully executed first calls via twilio API")
    } catch (e) {
        console.error("/twilio/firstCall :", e);
        res.json({
            message: e
        });
    }
});

router.get('/checkIn/morning', async (req, res, next) => {
    try {
        dbclient = req.client;
        await checkIn(dbclient, "6pm tonight", "morning");
        res.send("Successfully started morning checkIn twilio API");
    } catch (e) {
        console.error("/twilio/checkIn/morning :", e);
        next(e);
    }
});

router.get('/checkIn/evening', async (req, res, next) => {
    try {
        dbclient = req.client;
        await checkIn(dbclient, "9am tomorrow morning", "evening");
        res.send("Successfully started evening checkIn twilio API");
    } catch (e) {
        console.error("/twilio/checkIn/evening :", e);
        next(e);
    }
});

router.get('/test/tempCheck/:textOrPhone/:period/:phone', async (req, res, next) => {
    try {
        const isTextTest = req.params.textOrPhone === 'text';
        let period, nextCheckIn;
        if (req.params.period === 'morning') {
            period = 'morning';
            nextCheckIn = '6pm tonight'
        } else {
            period = 'evening';
            nextCheckIn = '9am tomorrow morning'
        }
        const phone = req.params.phone;
        await testTemperatureCheckin(client, phone, isTextTest, nextCheckIn, period);
        res.send("Successfully started evening checkIn twilio API");
    } catch (e) {
        console.error("/twilio/test/tempCheck/:textOrPhone/:period/:phone :", e);
        next(e);
    }
});

async function readCollection(dbclient, database, collection) {
    const cursor = await dbclient.db(database).collection(collection)
        .find({})
    const results = await cursor.toArray();
    return results;
}

/*
@params: twilioClient 
    - client object, used to make Twilio API calls
    - userPhone string, for user's phone number to test with
    - isTextTest boolean, true if testing with text-based temperature checkin
    - nextCheck string, duration of next checkin
    - period string, morning/evening
*/
async function testTemperatureCheckin(twilioClient, userPhone, isTextTest, nextCheckIn, period) {
    const flow = isTextTest ? process.env.TWILIO_TEXT_CHECKIN_FLOW : process.env.TWILIO_PHONE_CHECKIN_FLOW;
    await twilioClient.studio.v1.flows(flow)
        .executions
        .create(
            { 
                to: userPhone,
                from: process.env.TWILIO_FROM,
                parameters: JSON.stringify({nextCheckIn, period})
            }
        ).then(execution => 
            {
                console.log(`Successfully sent temperature check for ${userPhone}! using ${execution.sid}`);
            }
        ).catch (e => {
            console.log(`Error sending temperature check for ${userPhone}! using ${execution.sid}`);
        })
}

module.exports = router;
