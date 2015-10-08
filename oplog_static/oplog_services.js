'use strict';

angular.module('oplogApp')
.factory('ItemsSvc', [ '$resource', function($resource) {
 var svc = $resource('/api/items/:id', { id: '@_id' }, {
  update: {
   method: 'PUT'
  }
 }, {}),
  items = [];
 function get_index(id) {
  for( var i = 0, item = null; item = items[i]; i++ ) {
   if( item._id === id ) break;
  }
  return i;
 }
 return {
  // the idea here is to extend the get_items function to be able to perform reloads, also partial ones, that's why items is not filled directly
  get_items: function() {
   // items = svc.query();
   // return items;
   svc.query().$promise.then(function(data) {
    console.log('received items');
    console.dir(data);
    data.forEach(function(item) {
     for( var i = 0, cur = null; cur = items[i]; i++ ) {
      if( cur._id === item._id ) {
       items[i] = cur;
       break;
      }
     }
     if( i === items.length ) items.push(item);
    });
    return items;
   }).catch(function(err) {
    console.error('Error in get_items: ' + err);
    throw(err);
   });
   return items;
  },
  delete_from_list: function(id) {
   var idx = get_index(id);
   items.splice(idx, 1);
  },
  update_in_list: function(id, doc) {
   var idx = get_index(id);
   items[idx] = new svc(doc);
  },
  add_to_list: function(doc) {
   items.push(new svc(doc)); // should we better double-check?
  },
  create_item: function(data) {
   svc.save(data);
  }
 };
}])
.factory('WSSvc', [ '$location', '$websocket', 'ItemsSvc', function($location, $websocket, ItemsSvc) {
 var host = $location.host(),
  port = $location.port(),
  socket = $websocket('ws://' + host + ':' + port + '/ws/events'),
  events = [];
 console.log('socket created...');
 socket.onMessage(function(message) {
  console.log('received msg: ' + message.data + '...');
  var json = JSON.parse(message.data);
  events.splice(0, 0, json);
  if( events.length > 20 ) events.splice(20, 1);
  if( json.op === 'd' ) {
   ItemsSvc.delete_from_list(json.doc._id);
  } else if( json.op === 'i' ) {
   ItemsSvc.add_to_list(json.doc);
  } else if( json.op === 'u' ) {
   ItemsSvc.update_in_list(json.doc._id, json.doc);
  } else {
   console.error('received unknown message: ' + message.data + '...');
  }
 });
 return {
  events: events
 };
}]);
