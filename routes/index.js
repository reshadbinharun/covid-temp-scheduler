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
    .pipe(csv.parse({ headers: ['id', 'phone'], renameHeaders: true}))
    .on('error', error => console.error(error))
    .on('data', row => {
      if(row.id !== '' && row.phone !== '') {
        row.phone = '+1' + row.phone.replace(/[^\d+]|_|(\+1)/g, "")
        results.push(row)
      }
    })
    .on('end', async rowCount => {
      console.log(`Parsed ${rowCount} rows`);
      // delete temporary file stored in tmp/csv
      fs.unlinkSync(filePath);
      for (let user of results) {
        let phone = user.phone
        let id = user.id
        let duplicate = await req.client.db(process.env.DB).collection(process.env.INGEST_COLLECTION)
                                .findOne({'phone': phone})
        if (duplicate) {
          req.client.db(process.env.DB).collection(process.env.DUPLICATE_COLLECTION)
            .insertOne(duplicate)
        }
        const result = await req.client.db(process.env.DB).collection(process.env.INGEST_COLLECTION)
                                       .updateOne({'phone': phone}, 
                                                  {$set: {'phone': phone, 'id': id}}, 
                                                  {upsert: true});
      }
      res.send({data: results});
    });
});

module.exports = router;
