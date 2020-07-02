# Covid Temperature Monitoring App
App to ingest temperature data, and send scheduled checkins for temperature self-reporting

## Purpose:
This app provides a server with simple endpoints that allow for:
* Importing participant details from a csv file (id and phone number)
* Making an initial call to imported participants to determine whether or not they will take part in the monitoring
* Making scheduled calls to monitoring participants to get their temperature

TODO:
* Exporting data from a mongo database to a csv file
* Symptom tracking (eg coughing, stomach aches)/ Generic how do you feel 1-5

## Usage Guide:
1. Download POSTman (https://www.postman.com/)

2. Use POSTman to send a POST request to SERVER_LINK/ingest/csvFile. Have the body contain one field, a file with key "file"
The file needs to be a .csv file, with headers "id" and "phone number" or similar. 
Your CSV should look like this:
![CSV](https://i.imgur.com/zi8kig2.png)

and your POST request like this: 
![POSTman ](https://i.imgur.com/Dn0hnGC.png)

3. Hit send. This should display text starting with "data".

4. Hit the `/twilio/firstCall` GET end-point 

5. Use `/mongo/users` GET end-point to check what users have been registered onto the system. You may use this API to periodically track updates in temperatures


## APIs exposed:

* POST: `/ingest/csvFile` {File: .csv} -> uploads user records from .csv data (should have phone header included). Key must be named "file" and set body type to be "form-data"


* GET: `/mongo/users` -> returns all users currently in database
* GET: `/mongo/twilioTest` -> kicks off the Twilio interaction for temperature check-in
* POST: `/mongo/updateTemp` {phone: string, temp: string} -> adds a new temperatureRecord for user by provided phone number
* POST: `mongo/test/upsertUser` {phone: string, hasThermo: boolean, prefersCall: boolean} -> adds or updates(by phone) a user record
* POST: `mongo/firstCallNoThermo` -> {phone: string, hasThermo: bool} -> adds user to the Users collection with hasThermo set to false
* POST: `mongo/firstCallAnswered` -> {phone: string, hasThermo: bool, prefersCall, bool} -> adds a user to the Users collection on the firstcall
* POST: `mongo/firstCallNoAnswer` {phone: string} -> adds a user to the no answer collection if they do not answer the first call
* POST: `mongo/moreInfo` {phone: string} -> adds a user to the moreInfo collection in the database if they request more information during the first call
* GET: `mongo/inputOne` -> adds a predefined user to the testnums collection

* GET: `/twilio/checkIn/morning` -> kicks off morning checkIn job for all users in database
* GET: `/twilio/checkIn/evening` -> kicks off evening checkIn job for all users in database
* GET: `/twilio/test/tempCheck/:textOrPhone/:period/:phone` -> sends a text or call based (:textOrPhone should be "text" for text based), temperature check-in for the given  period (evening/morning) and phone number
* GET: `/twilio/firstCall` -> makes firstCall to all users from the ingested collection
