#!/usr/bin/env node

'use strict';

var mongoose = require('mongoose'),
 co = require('co'),
 schema = new mongoose.Schema({ name: String, extra: String }),
 model = mongoose.model('item', schema),
 oplog = require('./oplog_tailer'),
 express = require('express'),
 app = express(),
 server = require('http').createServer(app),
 expressWs = require('express-ws')(app, server),
 wss = expressWs.getWss(),
 body_parser = require('body-parser');

mongoose.set('debug', true);
mongoose.connect('mongodb://127.0.0.1:27017/mtest');

oplog.subscribe('mtest', 'items', model, function(op, doc) {
 console.log('oplog ' + op + ' notification received:\n' + JSON.stringify(doc, true, ' '));
 wss.clients.forEach(function each(client) {
  client.send(JSON.stringify({ op: op, doc: doc }));
 });
});

function create_item(body) {
 return new Promise(function(resolve, reject) {
  co(function*() {
 	 try {
    var inst = new model(body);
    var doc = yield new Promise(function(resolve, reject) {
	   inst.save(function(err, doc) {
	    if( err ) return reject(err);
		  resolve(doc);
	   });
	  });
	  resolve(doc);
   } catch( err ) {
	  reject(err);
	 }
  });
 });
}

function update_item(id, body) {
 return new Promise(function(resolve, reject) {
   model.findOneAndUpdate({ _id: id }, body, function(err, doc) {
    if( err ) return reject(err);
		if( ! doc ) return reject(new Error('not found'));
	  resolve(doc);
   });
  });
}

function delete_item(id, body) {
 return new Promise(function(resolve, reject) {
   model.findOneAndRemove({ _id: id }, body, function(err) {
    if( err ) return reject(err);
	  resolve();
   });
  });
}

function get_items() {
	return new Promise(function(resolve, reject) {
		model.find({}, function(err, data) {
			if( err ) return reject(err);
			resolve(data);
		});
	});
}

mongoose.connection.on('connected', function() { 
 console.log('connected!');
 app.use(body_parser.json({limit: '50mb'}));
 app.use(express.static('oplog_static'));
 app.route('/api/items').post(function(req, res, next) {
  create_item(req.body).then(function(doc) {
   res.json(doc);
  }).catch(function(err) {
   console.error('Error: ' + err);
	 res.send(500, err);
  });
 }).get(function(req, res, next) {
 	get_items().then(function(docs) {
		res.json(docs);
	}).catch(function(err) {
		console.error('GET error: ' + err);
		res.send(500, err);
	});
 });
 app.route('/api/items/:id').put(function(req, res, next) {
 	update_item(req.params.id, req.body).then(function(doc) {
		res.json(doc);
	}).catch(function(err) {
		console.error('Error: ' + err);
		res.send(500, err);
	});
 }).delete(function(req, res, next) {
 	delete_item(req.params.id, req.body).then(function() {
		res.json({ deleted: 'success' });
	}).catch(function(err) {
		console.error('Error: ' + err);
		res.send(500, err);
	});
 });
 app.ws('/ws/events', function(ws, req) {
 	logger.info('new ws client connected');
        ws.on('message', function(msg) {
         console.log('somebody sent a message: ' + msg);
        });
 });
 app.use(function(err, req, res, next) {
	 console.err('error: ' + err + '\n' + err.stack);
	 res.status(500).send(err);
 });
 server.listen(4000);
});
