require('dotenv').config();
const accountSid = process.env.TWILIO_AC;
const authToken = process.env.TWILIO_AUTH;
const twilioClient = require('twilio')(accountSid, authToken);

const test = (message) => {
    console.log("Hey I am running because I have been scheduled! \n", message)
}

/*
User collection anticipated shape
- phone: string
- hasThermometer: string
*/
async function getUsers(dbClient) {
    const users = await dbClient.db(process.env.DB).collection("User").find({}, {phone: true}).toArray();
    let uniqueUsers = [];
    let phoneToCount = {};
    users.forEach(user => {
        if (!phoneToCount[user.phone]) {
            phoneToCount[user.phone] = 1;
            uniqueUsers.push(user);
        } else {
            phoneToCount[user.phone]++;
        }
    });
    return uniqueUsers;
}

async function sendTemperatureCheckin(twilioClient, user, nextCheckIn, period) {
    const flow = user.prefersCall ? process.env.TWILIO_PHONE_CHECKIN_FLOW : process.env.TWILIO_TEXT_CHECKIN_FLOW;
    await twilioClient.studio.v1.flows(flow)
        .executions
        .create(
            { 
                to: user.phone,
                from: process.env.TWILIO_FROM,
                parameters: JSON.stringify({nextCheckIn, period})
            }
        ).then(execution => 
            {
                console.log(`Successfully sent temperature check for ${user.phone}! using ${execution.sid}`);
            }
        ).catch (e => {
            console.log(`Error sending temperature check for ${user.phone}! using ${execution.sid}`);
        })
}

/*
App should have mongo router attached
*/
const checkIn = async (dbClient, nextCheckIn, period) => {
    try {
        const users = await getUsers(dbClient);
        await Promise.all(users.map(async (user) => {
            await sendTemperatureCheckin(twilioClient, user, nextCheckIn, period);
        }));
    } catch (e) {
        console.error(e);
    }
}

exports.test = test
exports.checkIn = checkIn 