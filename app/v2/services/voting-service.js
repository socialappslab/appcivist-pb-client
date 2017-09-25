(function () {
  'use strict';
  /**
   * wrapper for Voting.
   */
  appCivistApp
    .factory('Voting', Voting);

  Voting.$inject = ['localStorageService'];

  function Voting(localStorageService) {

    return {
      ballot: ballot,
      ballotPaper: ballotPaper,
    };

    var getVotingApiURL = function(localStorageService) {
      var url = localStorageService.get('votingApiUrl');
      if (!url) {
        url = votingApiUrl;
        localStorageService.set("votingApiUrl", url);
      }
      return url;
    }

    var ballot = function($http, $resource, localStorageService) {
      var url = getVotingApiURL(localStorageService);
      return $resource(
        url + '/ballot/:uuid/registration', { "uuid": "@id" }, {
          results: {
            method: "GET",
            url: url + '/ballot/:uuid/results'
          },
    
          create: {
            method: 'POST',
            url: url + '/ballot'
          }
        }
      );
    };

    var ballotPaper = function($http, $resource, localStorageService) {
      var url = getVotingApiURL(localStorageService);
      return $resource(url + '/ballot/:uuid/vote/:signature', { "uuid": "@id", "signature": "@id" }, {
        "read": { "method": "GET" },
        "update": { method: "PUT" },
        "complete": {
          method: "PUT",
          url: url + "/ballot/:uuid/vote/:signature/complete"
        },
        "single": {
          method: "PUT",
          url: url + "/ballot/:uuid/vote/:signature/single"
        }
      });
    };

  }
} ());
