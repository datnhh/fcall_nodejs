var app = angular.module("FCall", ['ngRoute', 'ngCookies', 'ng.deviceDetector', 'ab-base64']);

app.config(function ($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/app/views/call.html',
            controller: 'CallController'
        }).
        when('/share', {
            templateUrl: '/app/views/sharescreen.html',
            controller: 'ShareScreenController'
        }).
        when('/call', {
            templateUrl: '/app/views/call.html',
            controller: 'CallController'
        });
})