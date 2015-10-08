'use strict';

angular.module('oplogApp')
.controller('ItemsCtrl', [ '$scope', 'ItemsSvc', 'WSSvc', function($scope, ItemsSvc, WSSvc) {
 $scope.items = ItemsSvc.get_items();
 $scope.flags = {};
 $scope.data = {};
 $scope.events = WSSvc.events;
 $scope.add_item = function() {
  ItemsSvc.create_item($scope.data);
  $scope.data = {};
  $scope.flags.new_item = false;
 };
 $scope.delete_item = function(item) {
  ItemsSvc.delete_from_list(item._id);
  item.$delete();
 }
}]);
