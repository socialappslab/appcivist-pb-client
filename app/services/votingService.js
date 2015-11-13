appCivistApp.factory('GetRegistrationForm', function($http, $resource, localStorageService) { 
	var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }
 	
 	return {
        form: function(uuid) {
            return $resource(serverBaseUrl + '/ballot/'+uuid+'/registration');
        }
    }
});

appCivistApp.factory('VotingBallot', function($http, $resource, localStorageService) { 
    var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }
    
    return {
        ballot: function(uuid) {
            return $resource(serverBaseUrl + '/ballot/'+uuid+'');
        },
        filled: function(uuid) {
            return $resource(serverBaseUrl + '/ballot/'+uuid+'/vote');
        }
    }
});