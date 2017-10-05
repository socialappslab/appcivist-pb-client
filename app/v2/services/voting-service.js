function getVotingApiBaseUrl(localStorageService) {
  var serverBaseUrl = localStorageService.get('votingApiUrl');
  if (serverBaseUrl === undefined || serverBaseUrl === null) {
    serverBaseUrl = "https://platform.appcivist.org/voting/api/v0";
    if (serverBaseUrl) localStorageService.set("votingApiUrl", serverBaseUrl);
    console.log("Setting Voting API Server to: " + serverBaseUrl);
  }
  return serverBaseUrl;
}


appCivistApp.factory('Voting', function ($resource, localStorageService) {
  return {
    /**
     * Returns the total number of notifications for the given user.
     *
     * @method services.Notifications#userStats
     * @param {Number} userId - User's ID
     * @returns {$resource}
     */
    ballot(uuid) {
      return $resource(getVotingApiBaseUrl(localStorageService) + '/ballot/:uuid', { uuid: uuid});
    },

    /**
     * Returns the notifications for the given user.
     *
     * @method services.Notifications#userNotifications
     * @param {Number} userId
     * @param {Number} page
     * @returns {$resource}
     */
    ballotPaper(uuid, sign) {
      return $resource(getVotingApiBaseUrl(localStorageService) + '/ballot/:uuid/vote/:signature', { uuid: uuid, signature: sign},
        {
          read: { "method": "GET" },
          update: { method: "PUT" },
          create: {
            method: "POST",
            url: getVotingApiBaseUrl(localStorageService) + "/ballot/:uuid/vote"
          },
          complete: {
            method: "PUT",
            url: getVotingApiBaseUrl(localStorageService) + "/ballot/:uuid/vote/:signature/complete"
          },
          single: {
            method: "PUT",
            url: getVotingApiBaseUrl(localStorageService) + "/ballot/:uuid/vote/:signature/single"
          }
        }
      );
    },

    ballotResults(uuid) {
      return $resource(getVotingApiBaseUrl(localStorageService) + '/ballot/:uuid/results', {uuid: uuid});
    }
  };
});

// TODO: Other voting api endpoints
// '/ballot/:uuid/registration', { "uuid": uuid }, {
//
//         }
//       );
//     };
//
//     let ballotPaper = function(uuid, signature) {
//       var url = getVotingApiURL(localStorageService);
//       return $resource(url + '/ballot/:uuid/vote/:signature', { "uuid": uuid, "signature": signature },
