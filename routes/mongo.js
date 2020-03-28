require('dotenv').config();
var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
//const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASSWORD}@${process.env.DBHOST}/${process.env.DB}`;
const uri = "URIstring"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

router.get('/inputOne', async (req, res) => {
    try {
        await client.connect();
        await insertSingleUser(client,
            {
                "phone_num": "1111111111",
                "name": "Test_one"
              }
            );
    } catch (e) {
        res.json({
            message: e
        });
    } finally {
        await client.close();
    }
    res.send('MongoDB Post Made')
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