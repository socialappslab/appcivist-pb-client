var getVotingApiURL = function(localStorageService) {
  var url = localStorageService.get('votingApiUrl');
  if (!url) {
    url = votingApiUrl;
    localStorageService.set("votingApiUrl", url);
  }
  return url;
}

appCivistApp.factory('Ballot', function($http, $resource, localStorageService) {
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
});

appCivistApp.factory('BallotPaper', function($http, $resource, localStorageService) {
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
});

appCivistApp.factory('VotesByUser', function($http, $resource, localStorageService) {
  var url = getVotingApiURL(localStorageService);
  return {
    getVotes: function(id, sign) {
      return $resource(url + '/ballot/:uuid/vote/:signature', {
        uuid: id,
        signature: sign
      }, {
        "votes": {
          method: "GET",
          url: url + '/ballot/:uuid/vote/:signature'
        }
      });
    }
  }
});

appCivistApp.factory('NewBallotPaper', function($http, $resource, localStorageService) {
  var url = getVotingApiURL(localStorageService);
  return {
    ballot: function(id) {
      return $resource(url + '/ballot/:uuid/vote', {
        uuid: id
      }, {
        "save": { method: "POST" }
      });
    }
  }
});

appCivistApp.factory('MakeVote', function($http, $resource, localStorageService) {
  var url = getVotingApiURL(localStorageService);
  return {
    newVote: function(id, sign) {
      return $resource(url + '/ballot/:uuid/vote/:signature', {
        uuid: id,
        signature: sign
      }, {
        "save": { method: "PUT" }
      });
    }
  }
});

appCivistApp.factory("Candidate", function($http, $resource, localStorageService, Contributions) {
    var currentCampaign = localStorageService.get("currentCampaign");
    var contributions = [];
    if (currentCampaign)
      contributions = currentCampaign.contributions;

    if (!contributions)
      contributions = [];

    var candidates = []

    for (var i = 0; i < contributions.length; i++) {
      if (contributions[i].type == "PROPOSAL") {
        candidate = {
          "uuid": contributions[i].contributionId,
          "text": contributions[i].text,
          "budget": "10000", //temporary
          "authors": contributions[i].authors,
          "workingGroupAuthors": contributions[i].workingGroupAuthors,
          "themes": contributions[i].themes,
          "attachments": contributions[i].attachments,
          "comments": [],
          "assessmentSummary": "",
          "assessments": []
        }
        candidates.push(candidate);
      }
    }

    console.log(candidates);



    return {
      get: function(params) {
        if (candidates.length > 0) {
          var match = candidates.filter(function(el) { return el.uuid == params.uuid; })[0];

          if (params.value)
            match.value = parseInt(params.value);
          if (params.score)
            match.score = parseInt(params.score);
          return match;
        }
      }
    }

  })
  //
  // appCivistApp.factory('VotingTally', function($http, $resource, localStorageService) {
  //     var url = getVotingApiURL(localStorageService);
  //
  //     var tallyExample = {
  //         "votingBallotTallyId":1,
  //         "uuid":1,
  //         "status":"FINISHED",
  //         "talliedResults":[
  //             {
  //                 "votingCandidateResultId":1,
  //                 "uuid":1,
  //                 "selectedCandidate":{
  //                     "targetUuid":0,
  //                     "uuid":1
  //                 },
  //                 "voteValue":"96/100",
  //                 "voteValueType":"RANGE"
  //             },{
  //                 "votingCandidateResultId":2,
  //                 "uuid":2,
  //                 "selectedCandidate":{
  //                     "targetUuid":1,
  //                     "uuid":2
  //                 },
  //                 "voteValue":"80/100",
  //                 "voteValueType":"RANGE"
  //             },{
  //                 "votingCandidateResultId":2,
  //                 "uuid":3,
  //                 "selectedCandidate":{
  //                     "targetUuid":2,
  //                     "uuid":3
  //                 },
  //                 "voteValue":"67/100",
  //                 "voteValueType":"RANGE"
  //             },{
  //                 "votingCandidateResultId":3,
  //                 "uuid":4,
  //                 "selectedCandidate":{
  //                     "targetUuid":3,
  //                     "uuid":4
  //             },
  //                 "voteValue":"40/100",
  //                 "voteValueType":"RANGE"
  //             }
  //         ],
  //         "ballot":{
  //             "votingBallotId" : 1,
  //             "uuid":1,
  //             "instructions":"All assembly members may vote.",
  //             "notes":"There will be offline voting happening in the following places: Houghton Park Community Center, 6301 Myrtle Avenue; Light & Life Church, 5951 Downey Avenue; Council District 9 Field Office, 6509 Gundry Avenue. Come vote and enjoy free food, music and activities for kids! For technical issues, contact Cristhian at +1 999 999 9999.",
  //             "systemType":"range",
  //             "starts":"2015-12-01 20:27",
  //             "ends": "2015-12-31 20:27",
  //             "candidates": [
  //                 {
  //                   "targetUuid": 0,
  //                 },
  //                 {
  //                   "targetUuid": 1,
  //                 },{
  //                   "targetUuid": 2,
  //                 },
  //                 {
  //                   "targetUuid": 3,
  //                 }
  //             ],
  //             "registrationForm": {
  //                 "votingBallotRegistrationFormId":"1",
  //                 "fields": [
  //                     {
  //                     "votingBallotRegistrationFieldId":2,
  //                     "fieldName":"Zip",
  //                     "fieldDescription":"This is the zip"
  //                     },
  //                     {"votingBallotRegistrationFieldId":1,
  //                     "fieldName":"Name",
  //                     "fieldDescription":"This is the name"
  //                     }
  //                 ]
  //             },
  //             "configs":[
  //                 {
  //                     "key": "minimum score assigned",
  //                     "value": 0
  //                 },{
  //                     "key": "maximum score assigned",
  //                     "value": 100
  //                 },{
  //                     "key":"number of winners",
  //                     "value":3
  //                 }
  //             ]
  //         }
  //     }
  //
  //     return{
  //         tally: function(uuid, signature) {
  //             /*replace this with the $resouce object with the corresponding url*/
  //             return tallyExample;
  //         }
  //     }
  // });