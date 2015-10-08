'use strict';

angular.module('oplogApp')
.directive('tdMon', [ 'ItemsSvc', function(ItemsSvc) {
 function link(scope, element, attrs) {
  var mon = attrs['tdMon'];
  element.on('blur', function(event) {
   event.preventDefault();
   if( element.text() !== scope.item[mon] ) {
    scope.item[mon] = element.text();
    scope.item.$update();
   }
  });
 }
 return {
  link: link,
  restrict: 'A'
 };
}]);
