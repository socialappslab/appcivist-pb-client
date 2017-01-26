angular.module('ErrorCatcher', [])
  .factory('errorHttpInterceptor', function($exceptionHandler, $q, localStorageService, $injector) {
    return {
      responseError: function responseError(rejection) {
        var serverBaseUrl = localStorageService.get('serverBaseUrl');
        if (serverBaseUrl === undefined || serverBaseUrl === null) {
          serverBaseUrl = appCivistCoreBaseURL;
        }

        if (rejection.data && rejection.data.responseStatus === 'SERVERERROR') {
          var $resource = $injector.get('$resource');
          var logError = {};
          logError.user = localStorageService.get('user').username;
          logError.path = rejection.config.url;
          logError.message = rejection.data.statusMessage;
          $resource(serverBaseUrl + '/log/front').save(logError);
        }

        return $q.reject(rejection);
      }
    };
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('errorHttpInterceptor');
  });