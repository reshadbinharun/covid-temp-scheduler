require('dotenv').config();
var express = require('express');
var router = express.Router();
const moment = require('moment');
const { checkIn } = require('../cronHelpers');

router.get('/users', async (req, res, next) => {
    client = req.client;
    let users = []
    try {
        users = await client.db(process.env.DB).collection("User").find().toArray();
    } catch (e) {
        console.error("Error -> mongo/test: ", e);
        next(e);
    }
    res.send(users)
});

/*
ENDPOINTS TO TEST TWILIO INTEGRATION
v v v
*/
router.get('/twilioTest', async (req, res, next) => {
    await checkIn(req.client, 'nextCheckin', 'period');
    res.send('Hit twilio endpoint');
});

router.get('/noReply', async (req, res, next) => {
    res.send('No reply');
});
/*
^ ^ ^
ENDPOINTS TO TEST TWILIO INTEGRATION
*/

/*
Exposed to Twilio
- TWILIO post request webhook must have temp, phone defined as form-url-encoded http parameters
*/
router.post('/updateTemp', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone;
    const temp = req.body.temp;
    try {
        const time = moment().format('MMMM Do YYYY, h:mm:ss a');
        // create temperature record
        const tempRecord = {
            time,
            temp
        }
        await client.db(process.env.DB).collection(process.env.USER_COLLECTION).updateOne({phone}, {$push: {temperatureRecords: tempRecord}})
        res.send('Updated user record.');
    } catch (e) {
        console.error("Error -> mongo/updateTemp: ", e, " for ", phone);
        next(e);
    }
});

/*
Exposed to Twilio
- TWILIO post request webhook must have hasThermo and phone defined as form-url-encoded http params
*/
router.post('/firstCallNoThermo', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    const thermoString = req.body.hasThermo
    var hasThermo = false;
    if (thermoString === "true") {
        hasThermo = true;
    }
    try {
        await insertSingleUser(client, process.env.DB, "User",
        {
                "phone": phone,
                "hasThermo": hasThermo
            }
        );
    } catch (e) {
        console.error("Error -> mongo/firstCallNoThermo: ", e, " for ", phone);
        next(e)
    }
    res.send('User Answered Call')
});

router.post('/firstCallAnswered', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    const thermoString = req.body.hasThermo
    var hasThermo = false;
    if (thermoString === "true") {
        hasThermo = true;
    }
    const reminders = req.body.reminders
    var prefersCall = false;
    if (reminders === "call") {
        prefersCall = true;
    }
    try {
        await insertSingleUser(client, process.env.DB, "User",
            {
                "phone": phone,
                "hasThermo": hasThermo,
                "prefersCall": prefersCall
            }
        );
        res.send('User Answered Call');
    } catch (e) {
        console.error("Error -> mongo/firstCallAnswered: ", e, " for ", phone);
        next(e);
    }
});

// The next 2 methods are exposed to Twilio FirstCall flow, for people that
// need to be contacted by humans
router.post('/firstCallNoAnswer', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    try {
        await insertSingleUser(client, process.env.DB, "noResponse",
            {
                "phone": phone
            }
        );
        res.send('User did not answer call');
    } catch (e) {
        console.error("Error -> mongo/firstCallNoAnswer: ", e, " for ", phone);
        next(e);
    }
});

router.post('/moreInfo', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    try {
        await insertSingleUser(client, process.env.DB, "moreInfo",
            {
                "phone": phone
            }
        );
        res.send('Received more info');
    } catch (e) {
        console.error("Error -> mongo/moreInfo: ", e, " for ", phone);
        next(e)
    }
});

// Mongo integration test function
router.get('/inputOne', async (req, res, next) => {
    client = req.client;
    try {
        await insertSingleUser(client, process.env.DB, process.env.INGEST_COLLECTION,
            {
                "phone_num": "1111111111",
                "name": "Test_one"
            }
        );
        res.send('MongoDB Post Made')
    } catch (e) {
        console.error("Error -> mongo/inputOne: ", e);
        next(e);
    }
});

router.post('/test/upsertUser', async (req, res, next) => {
    try {
        const phone = req.body.phone;
        const hasThermo = req.body.hasThermo;
        const prefersCall = req.body.prefersCall;
        const client = req.client;
        const result = await client.db(process.env.DB).collection(process.env.USER_COLLECTION).update({phone}, {phone, hasThermo, prefersCall}, { upsert: true});
        res.send(result);
    } catch (e) {
        console.error("Error -> mongo//test/upsertUser: ", e);
        next(e);
    }
});

//Hardcoded Demo Function: Inserts one user into the Mongo Database
async function insertSingleUser(client, database, collection, post) {
    try {
        const result = await client.db(database).collection(collection).insertOne(post);
    } catch (e) {
        console.error(e)
    }
}
module.exports = router;