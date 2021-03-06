appCivistApp.service('logService', function($resource, $rootScope, $http, $location, localStorageService, $uibModal, AppCivistAuth,
											  FlashService, $window) {

  this.logAction = function(action, rType, rId, email) {
    if ($rootScope.logActions){
      var url = (localStorageService.get('sessionKey') ? localStorageService.get("serverBaseUrl") + '/log' : localStorageService.get("serverBaseUrl") + '/log/public');
      var data = {
        "time": moment().format('YYYY-MM-DD HH:mm:ss'),
        "user": (localStorageService.get('sessionKey') ? localStorageService.get("user").email : email),
        "path": $location.url(),
        "action": action,
        "resourceType": rType ? rType : "",
        "resourceUuid": rId ? rId : ""
      }

      $http.post(url, data).then(function(){
        console.log(action + " Logged");
				if (action == 'LOGOUT')
					$window.location = "/";
      });
    }
  }
});
