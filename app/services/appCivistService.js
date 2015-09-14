// This handles retrieving data and is used by controllers. 
// 3 options (server, factory, provider) with 
// each doing the same thing just structuring the functions/data differently.
appCivistApp.service('Assemblies', function ($resource, localStorageService) {

    //var Assemblies = $resource('https://appcivist-pb.herokuapp.com/api/assembly');
	var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }

    return $resource(serverBaseUrl + '/assembly/:assemblyId');
    //var Assembly = $resource(serverBaseUrl + '/assembly/:assemblyId', {assemblyId: '@assemblyId'});


    // REVIEW EVERYTHING FROM HERE
    //var assemblies = [];
    //var assembly = {};
    //
    //this.getAssemblies = function () {
		//assemblies = Assemblies.get();
    //    return assemblies;
    //};
    //
    //// For getting the data from a SERVER, add Ajax Calls to the functions below
    //this.insertAssembly = function (title, description, city) {
    //    var topID = assemblies.length + 1;
    //    assemblies.push({
    //        id: topID,
    //        title: title,
    //        description: description,
    //        city: city
    //    });
    //};
    //
    //this.deleteAssembly = function (id) {
    //    for (var i = assemblies.length - 1; i >= 0; i--) {
    //        if (assemblies[i].id === id) {
    //            assemblies.splice(i, 1);
    //            break;
    //        }
    //    }
    //};
    //
    //this.getAssembly = function (id) {
    //    assemblies = localStorageService.get("assemblies");
    //    for (var i = 0; i < assemblies.length; i++) {
    //        if (assemblies[i].assemblyId === id) {
    //            return asemblies[i];
    //        }
    //    }
    //
    //    assembly = Assembly.get({assemblyId:id}, function() {
    //        if (assembly != undefined && assembly.assemblyId> 0 ) {
    //            localStorageService.set('currentAssembly',assembly);
    //        }
    //    });
    //
    //    return assembly;
    //};
    //
    //return Assemblies;
});

appCivistApp.service('Campaigns', function ($resource, localStorageService) {

    //var Campaigns = $resource('https://appcivist-pb.herokuapp.com/api/user/:uuid/campaign');
    var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }

    return $resource(serverBaseUrl + '/user/'+localStorageService.get('user').uuid+'/campaign');

});

appCivistApp.service('Memberships', function ($resource, localStorageService) {

    //var Membership = $resource('https://appcivist-pb.herokuapp.com/api/membership/user/:uuid');
    var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }

    return $resource(serverBaseUrl + '/membership/user/'+localStorageService.get('user').uuid);

});

appCivistApp.service('Notifications', function ($resource, localStorageService) {

    //var Notification = $resource('https://appcivist-pb.herokuapp.com/api/notification/user/:uuid');
    var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }

    return $resource(serverBaseUrl + '/notification/user/'+localStorageService.get('user').uuid);

});

