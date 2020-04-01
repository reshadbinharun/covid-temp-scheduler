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
      await req.client.db(process.env.DB).collection("User").insertMany(results);
      res.send({data: results});
    });
});

module.exports = router;