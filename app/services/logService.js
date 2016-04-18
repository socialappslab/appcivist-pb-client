appCivistApp.service('logService', function($resource, $rootScope, $http, $location, localStorageService, $uibModal, AppCivistAuth,
											  FlashService) {

  this.logAction = function(action) {
    if ($rootScope.logActions){
      var url = (localStorageService.get('sessionKey') ? localStorageService.get("serverBaseUrl") + '/log' : localStorageService.get("serverBaseUrl") + '/log/public');
      var data = {
        "time": moment().format('YYYY-MM-DD HH:mm:ss'),
        "user": (localStorageService.get('sessionKey') ? localStorageService.get("user").email : null),
        "path": $location.url(),
        "action": action,
        "resourceType": "",
        "resourceUuid": ""
      }
      
      $http.post(url, data).then(function(){
        console.log(action + " Logged");
      });
    }
  }
});
