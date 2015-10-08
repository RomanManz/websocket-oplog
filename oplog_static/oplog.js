'use strict';
angular.module('oplogApp', ['ngRoute', 'ngResource', 'ngWebSocket'])
.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
		when('/items', {
			templateUrl: 'templates/items.html',
			controller: 'ItemsCtrl'
		}).
		otherwise({
			redirectTo: '/items'
		})
	}
]);
