require('dotenv').config();
var express = require('express');
var router = express.Router();
var assert = require('assert');
const moment = require('moment');
const { checkIn } = require('../cronHelpers');

router.get('/users', async (req, res, next) => {
    client = req.client;
    let users = [];
    try {
        users = await client.db(process.env.DB).collection("User").find().toArray();
    } catch (e) {
        next(e);
    }
    res.send(users);
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
router.post('/updateTemp', async (req, res) => {
    client = req.client;
    const phone = req.body.phone;
    let temp = parseFloat(req.body.temp);
    if (temp > 900) {
        temp /= 10;
    }
    try {
        if (temp === NaN) {
            throw 'Invalid temperature!';
        }
        const time = moment().format('MMMM Do YYYY, h:mm:ss a');
        
        const tempRecord = {
            phone,
            time,
            temp
        }
        await client.db(process.env.DB).collection("participant-data").insertOne(tempRecord)
        res.status(200).send('Updated user record.');
    } catch (e) {
        console.log(e)
        res.status(500).send({'message': e});
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
        await insertSingleUser(client, process.env.DB, "no-thermo",
        {
                "phone": phone,
                "hasThermo": hasThermo
            }
        );
    } catch (e) {
        next(e)
    }
    res.send('User Answered Call')
});

router.post('/firstCallAnswered', async (req, res, next) => {
    client = req.client;
    let phone = req.body.phone
    phone = '+1' + phone.replace(/[^\d+]|_|(\+1)/g, "")
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
        await insertSingleUser(client, process.env.DB, "participants",
        {
                "phone": phone,
                "hasThermo": hasThermo,
                "prefersCall": prefersCall
            }
        );
    } catch (e) {
        next(e)
    }
    res.send('User Answered Call')
});

// The next 2 methods are exposed to Twilio FirstCall flow, for people that
// need to be contacted by humans
router.post('/firstCallNoAnswer', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    try {
        await insertSingleUser(client, process.env.DB, "no-response",
        {
                "phone": phone
            }
        );
    } catch (e) {
        next(e)
    }
    res.send('User did not answer call')
});

router.post('/moreInfo', async (req, res, next) => {
    client = req.client;
    const phone = req.body.phone
    try {
        await insertSingleUser(client, process.env.DB, "more-info",
        {
                "phone": phone
            }
        );
    } catch (e) {
        next(e)
    }
    res.send('User did not answer call')
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
        next(e);
    }
});

//Hardcoded Demo Function: Inserts one user into the Mongo Database
async function insertSingleUser(client, database, collection, post) {
    try{
        const result = await client.db(database).collection(collection).insertOne(post);
        console.log(result.insertedIds);
    } catch (e) {
        console.error(e)
    }
}
module.exports = router;
