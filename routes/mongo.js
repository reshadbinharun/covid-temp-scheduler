require('dotenv').config();
var express = require('express');
var router = express.Router();
const moment = require('moment');
const { checkIn } = require('../cronHelpers');

router.get('/inputOne', async (req, res, next) => {
    client = req.client;
    try {
        await insertSingleUser(client,
            {
                "phone_num": "1111111111",
                "name": "Test_one"
              }
            );
    } catch (e) {
        next(e);
    }
    res.send('MongoDB Post Made')
});

router.get('/twilioTest', async (req, res, next) => {
    await checkIn(req.client);
    res.send('Hit twilio endpoint');
});

router.get('/noReply', async (req, res, next) => {
    res.send('No reply');
});

router.post('/updateTemp', async (req, res) => {
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
        await client.db("testdata").collection("User").updateOne({phone}, {$push: {temperatureRecords: tempRecord}})
        console.log("just updated temp record!");
    } catch (e) {
        next(e);
    }
    res.send('Updated user record.');
});

//Hardcoded Demo Function: Inserts one user into the Mongo Database
async function insertSingleUser(client, post) {
    try{
        const result = await client.db("testdata").collection("test_nums").insertOne(post);
        console.log(result.insertedIds);
    } catch (e) {
        console.error(e)
    }
}
module.exports = router;