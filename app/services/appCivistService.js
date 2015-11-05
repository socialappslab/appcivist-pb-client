/**
 * AppCivist Service Factories
 * Each factory returns ngResources connected to AppCivist API
 */

/**
 * Reads AppCivist API Base URL from local storage and returns it
 * If the base url is not yet stored in the local storage, saves it
 * @param localStorageService
 * @returns serverBaseUrl
 */
function getServerBaseUrl(localStorageService) {
    var serverBaseUrl = localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }
    return serverBaseUrl;
}

appCivistApp.factory('Assemblies', function ($resource, localStorageService) {

    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        assemblies: function() {
            return $resource(serverBaseUrl + '/assembly');
        },
        assembly: function(assemblyId) {
            return $resource(serverBaseUrl + '/assembly/:aid', {aid: assemblyId});
        },
        assembliesWithoutLogin: function() {
            return $resource(serverBaseUrl + '/assembly/listed');
        },
        assembliesByQuery: function(q) {
            return $resource(serverBaseUrl + '/assembly', {query: q});
        },
        assemblyMembers: function(assemblyId) {
            return $resource(serverBaseUrl + '/assembly/:aid/membership/ACCEPTED', {aid: assemblyId});
        },
        linkedAssemblies: function(assemblyId) {
            return $resource(serverBaseUrl + '/assembly/:aid/linked', {aid: assemblyId});
        },
        featuredAssemblies: function() {
            return $resource(serverBaseUrl + '/assembly', {filter:"featured"});
        },
        verifyMembership: function(assemblyId, userId) {
            return $resource(serverBaseUrl + '/assembly/:aid/user/:uid',
                {
                    aid: assemblyId,
                    uid: userId
                });
        }
    }
});

appCivistApp.factory('Campaigns', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        campaigns: function(state) {
            return $resource(serverBaseUrl + '/user/'+localStorageService.get('user').uuid+'/campaign?status='+state+'');
        },
        campaign: function(assemblyId, campaignId) {
            return $resource(serverBaseUrl + '/assembly/'+assemblyId+'/campaign/'+campaignId);
        },
        templates: function() {
            return $resource(serverBaseUrl+'/campaign/template');
        }
    };

});

appCivistApp.factory('Memberships', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        memberships: function() {
            return $resource(serverBaseUrl + '/membership/user/'+localStorageService.get('user').uuid);
        },
        assemblies: function() {
            return $resource(serverBaseUrl + '/membership/user/'+localStorageService.get('user').uuid+'?type=assembly');
        },
        workingGroups: function() {
            return $resource(serverBaseUrl + '/membership/user/'+localStorageService.get('user').uuid+'?type=campaign?status=ongoing');
        }
    };
});

appCivistApp.factory('Notifications', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return $resource(serverBaseUrl + '/notification/user/'+localStorageService.get('user').uuid);

});

appCivistApp.factory('Contributions', function ($resource, localStorageService, WorkingGroups) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        contributions: function(assemblyId) {
            return $resource(serverBaseUrl + '/assembly/'+assemblyId+'/contribution?space=forum');
        },
        contribution: function(assemblyId, contributionId) {
            return $resource(serverBaseUrl + '/assembly/:aid/contribution/:coid',
                {aid: assemblyId, coid: contributionId});
        },
        verifyAuthorship: function(user, c) {
            if(user!=null && user != undefined && c!=null && c!=undefined) {
                var authorList = c.authors;
                // Check if author is in authorList (if author list is defined)
                if (authorList != null && authorList != undefined && authorList.length > 0) {
                    if (authorList.filter(function(author) { return author.userId === user.userId; }).length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        verifyGroupAuthorship: function(user, c, group) {
            var assemblyId = group.assemblies[0];
            var groupId = group.groupId;
            var status = 'ACCEPTED';
            return WorkingGroups.verifyMembership(assemblyId, groupId, user.userId);
        }
    };
});

appCivistApp.factory('WorkingGroups', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        workingGroup: function(assemblyId, groupId) {
            return $resource(serverBaseUrl + '/assembly/:aid/group/:gid', {aid: assemblyId, gid: groupId});
        },
        workingGroups: function(assemblyId) {
            return $resource(serverBaseUrl + '/assembly/:aid/group', {aid: assemblyId});
        },
        workingGroupMembers: function(assemblyId, groupId, stat) {
            return $resource(serverBaseUrl + '/assembly/:aid/group/:gid/membership/:status',
                {
                    aid: assemblyId,
                    gid: groupId,
                    status: stat
                });
        },
        verifyMembership: function(assemblyId, groupId, userId) {
            return $resource(serverBaseUrl + '/assembly/:aid/group/:gid/user/:uid',
                {
                    aid: assemblyId,
                    gid: groupId,
                    uid: userId
                });
        }
    };
});

appCivistApp.factory('Etherpad', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    var etherpadServer = localStorageService.get("etherpadServer");
    return {
        embedUrl: function(id) {
            var url = etherpadServer+"p/"+id+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
            console.log("Contribution Read Only Etherpad URL: "+url);
            return url;
        },
        getReadWriteUrl : function(assemblyId, contributionId) {
            return $resource(serverBaseUrl + '/assembly/:aid/contribution/:cid/padid',
                {
                    aid: assemblyId,
                    cid: contributionId
                });
        }
    };
});
