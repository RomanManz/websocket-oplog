'use strict';

var mongoose = require('mongoose'),
	co = require('co'),
	latest = null,
	callbacks = [],
	connection = mongoose.createConnection('mongodb://localhost:27017/local');

function get_latest(db) {
	return new Promise(function(resolve, reject) {
		db.find({}, { sort: { $natural: -1 } }).toArray(function(err, docs) {
			if( err ) return reject(err);
			if( ! docs.length ) return reject(new Error('no oplog docs returned!'));
			resolve(docs[0].ts);
		});
	});
}

function get_next(db) {
	console.log('starting...');
	// awaiData is just to delay the notification to notify in chunks rather than individually
	var cursor = db.find({ ts: { $gt: latest }, op: { $ne: 'n' } }, { tailable: true, noTimeout: true }).stream();
	// var cursor = db.find({ ts: { $gt: latest } }, { tailable: true, noTimeout: true }).stream();
	cursor.on('data', function(doc) {
		console.log('received oplog' + JSON.stringify(doc) + '...');
		notify(doc);
		latest = doc.ts;
	}).on('error', function(err) {
		console.error('cursor error: ' + err + '\n' + err.stack);
		cursor.destroy();
		// leave the 're-connect' to the on.('connect') event
		/*
		setTimeout(function() {
			get_next(db);
		}, 1000);
		*/
	}).on('close', function() {
		console.error('cursor closed.');
	});
}

function start(db) {
	co(function*() {
		try {
			// on('connected') is also fired during reconnect so check for latest and not blindly ask for a new one
			if( ! latest ) latest = yield get_latest(db);
			console.log('latest: ' + latest);
			get_next(db);
		} catch( err ) {
			console.log('error: ' + err + '\n' + err.stack);
		}
	});
}

function notify(doc) {
  co(function*() {
		try {
			var ns = doc.ns.split('.'),
				obj = null;
			for( var i = 0, cb = null; cb = callbacks[i]; i++, obj = null ) {
				if( cb.db !== ns[0] || cb.col !== ns[1] ) continue;
				switch(doc.op) {
					case 'd':
						obj = doc.o;
						break;
					case 'i':
						obj = doc.o;
						break;
					case 'u':
						obj = yield new Promise(function(resolve, reject) {
							cb.model.findOne(doc.o2, function(err, doc) {
								if( err ) return reject(err);
								resolve(doc);
							});
						});
						break;
					default:
						console.error('Oops, received unknown oplog entry! ' + JSON.stringify(doc, true, ' '));
				}
				if( obj ) cb.callback(doc.op, obj);
			}
		} catch( err ) {
			logger.error('oplog notification error: ' + err + '\n' + err.stack);
		}
  });
}

connection.on('connected', function() {
	var coll = connection.collection('oplog.$main');
	console.log('connected!');
	start(coll);
}).on('error', function(err) {
	console.error('error: ' + err);
});

exports.subscribe = function(db, col, model, cb) {
	console.log('adding subscriber ' + db + '/' + col + '...');
	callbacks.push({
		db: db,
		col: col,
		model: model,
		callback: cb
	});
};
