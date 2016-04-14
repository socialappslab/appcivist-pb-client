appCivistApp.factory('pushLog', function($http, $resource, localStorageService){
  var url = getServerBaseURL(localStorageService);
  return {
    logAction: function() {
      var sessionKey = localStorageService.get('sessionKey');
      if (sessionKey) {
        return $resource(url + '/log',
            {

            },
            {
              "save": { method: "POST" }
            }
        );
      } else {
        return $resource(url + '/log/public', {}, { "save": { method: "POST" }});
      }
    }
  }
});
