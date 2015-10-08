# websocket-oplog
A sample Express application to push MongoDB oplog events via Websockets to an Angular page.

version: 0.0.1

## Introduction
This is a demo of using Mongo's oplog to notify web clients via Websockets about changes in the database.

## Installation
1. You need node and bower and mongo installed (see versions below), jade is optional.
2. Clone the repository.
2. Run 'npm install'.
3. Run 'cd oplog_static && bower install'.
 
## Mongo oplog activation
If you run a local Mongo database you can activate the oplog by adding a 'master = true' line to /etc/mongodb.conf (or wherever the file is stored in your case) and probably restart the database (mongod).

## Startup
Run 'npm start'.

## Connect your browser
If you run it locally and you use the default port (4000), then use http://localhost:4000.

## Tested versions
- Node: v0.11.13 (see issues below)
- MongoDB: 2.6.10

## Environment
Both the database connect string and the express port are hardcoded in oplog.js and can be changed as needed. As well as the collection name and schema (mongoose is used) which can also be changed as required, but beware that the Angular page only knows about the sample schema (name and extra).

## Jade
I have included the .html files so you don't have to generate them. Of course if you change the .jade files you have to have  jade installed to generate the .html files again.

## Issues/Todo
- I started with Node v4.0.0 but then stumbled upon this issue: https://github.com/Automattic/mongoose/issues/3109. That's why I used the other version I have installed, v0.11.13.
- CSS positioning and the #events height (and everything else).
- Integration with some scripting tool like grunt or gulp(?).
- Much more...
