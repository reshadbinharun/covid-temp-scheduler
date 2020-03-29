require('dotenv').config();
const accountSid = process.env.TWILIO_AC;
const authToken = process.env.TWILIO_AUTH;
const twilioClient = require('twilio')(accountSid, authToken);
const moment = require('moment');

const test = (message) => {
    console.log("Hey I am running because I have been scheduled! \n", message)
}

/*
User collection anticipated shape
- phone: string
- hasThermometer: string
*/
async function getUsers(dbClient) {
    const users = await dbClient.db("testdata").collection("User").find({}, {phone: true}).toArray();
    return users;
}

async function sendTemperatureCheckin(twilioClient, userPhone) {
    const flow = process.env.TWILIO_FLOW;
    const timeNow = moment().format('MMMM Do YYYY, h:mm:ss a');
    await twilioClient.studio.v1.flows(flow)
        .executions
        .create(
            { 
                to: userPhone,
                from: process.env.TWILIO_FROM,
                parameters: JSON.stringify({time: timeNow})
            }
        ).then(execution => 
            {
                console.log(`Successfully sent temperature check for ${userPhone}! using ${execution.sid}`);
            }
        ).catch (e => {
            console.log(`Error sending temperature check for ${userPhone}! using ${execution.sid}`);
        })
}

/*
App should have mongo router attached
*/
const checkIn = async (dbClient) => {
    try {
        const users = await getUsers(dbClient);
        await Promise.all(users.map(async (user) => {
            await sendTemperatureCheckin(twilioClient, user.phone);
        }));
    } catch (e) {
        console.error(e);
    }
}

exports.test = test
exports.checkIn = checkIn 