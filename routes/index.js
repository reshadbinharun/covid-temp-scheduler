var express = require('express');
var router = express.Router();

const multer = require('multer');
const csv = require('fast-csv');
const fs = require('fs');
// handler to work with multi-part form data i.e. files
const upload = multer({ dest: 'tmp/csv/' });

router.get('/', function(req, res, next) {
  res.send("This is the index page!");
});

router.post('/ingest/csvFile', upload.single('file'), async (req, res, next) => {
    const filePath = req.file.path;
    let results = [];
    fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
      results.push(row)
    })
    .on('end', async rowCount => {
      console.log(`Parsed ${rowCount} rows`);
      // delete temporary file stored in tmp/csv
      fs.unlinkSync(filePath);
      await req.client.db(process.env.DB).collection(process.env.INGEST_COLLECTION).insertMany(results);
      res.send({data: results});
    });
});

router.get('/ingest', async (req, res, next) => {
    try {
      const ingestedUsers = await req.client.db(process.env.DB).collection(process.env.INGEST_COLLECTION).find().toArray();
      res.send({ingestedUsers});
    } catch (e) {
      console.log("Error -> /ingest:", e);
      next(e);
    }
});

router.get('/ingest/clear', async (req, res, next) => {
  try {
    await req.client.db(process.env.DB).collection(process.env.INGEST_COLLECTION).remove({});
    res.send("Deleted all records ingested.");
  } catch (e) {
    console.log("Error -> /ingest/clear:", e);
    next(e);
  }
});

module.exports = router;