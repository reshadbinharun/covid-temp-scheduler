var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const cors = require('cors');
const cron = require("node-cron");
var test = require('./cronHelpers').test;

var twilioRouter = require('./routes/twilio');
var indexRouter = require('./routes/index');
require('dotenv').config();

var app = express();
// perform actions on the collection object
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb://${process.env.DBUSER}:${process.env.DBPASSWORD}@${process.env.DBHOST}/${process.env.DB}`;
const client = new MongoClient(uri);

let corsRegexString = process.env.CORS_REGEX || 'localhost';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsRegexString)
  next();
})

let corsRegex = new RegExp(`.*${corsRegexString}.*`);

let corsOptions = {
  origin: corsRegex,
  credentials: true,
}
app.use(cors(corsOptions));

async function main() {
  try {
    await client.connect();
    const db = client.db(process.env.DB);
    
    // TODO: use cron if needed
    const cronSchedule = '* * * * * *'
    if (process.env.ACTIVATE_CRON) {
      cron.schedule(cronSchedule, () => {
        test('Print this');
      });
    }

    app.use('/', indexRouter);

    app.use('/twilio/', (req, res, next) => {
      req.db = db;
      next();
    }, twilioRouter);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function(err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.json({error : err});
    });
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.err);


module.exports = app;
