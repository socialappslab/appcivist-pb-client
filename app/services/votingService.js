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
    url + '/ballot/:uuid/registration',
    {"uuid": "@id"},
    {
      "results": {
        method: "GET",
        url: url + '/ballot/:uuid/results'
      }
    }
  );
});

appCivistApp.factory('BallotPaper', function($http, $resource, localStorageService) {
  var url = getVotingApiURL(localStorageService);
  return $resource(
    url + '/ballot/:uuid/vote/:signature',
    { "uuid": "@id", "signature": "@id" },
    {
      "update": {method: "PUT"},
      "complete": {
        method: "PUT",
        url: url + "/ballot/:uuid/vote/:signature/complete"
      }
    }
  );
});

appCivistApp.factory('VotesByUser', function($http, $resource, localStorageService){
  var url = getVotingApiURL(localStorageService);
  return $resource(
    url + '/ballot/:uuid/vote/:signature',
    { "uuid": "@id", "signature": "@id"},
    {
      "results": {
        method: "GET",
        url: url + '/ballot/:uuid/vote/:signature'
      }
    }
  );
});

appCivistApp.factory('NewBallotPaper', function($http, $resource, localStorageService){
  var url = getVotingApiURL(localStorageService);
  return {
    ballot: function(id) {
      return $resource(url + '/ballot/:uuid/vote',
          {
            uuid: id
          },
          {
            "save": { method: "POST" }
          }
      );
    }
  }
});

appCivistApp.factory('MakeVote', function($http, $resource, localStorageService){
  var url = getVotingApiURL(localStorageService);
  return {
    newVote: function(id, sign) {
      return $resource(url + '/ballot/:uuid/vote/:signature',
        {
          uuid: id,
          signature: sign
        },
        {
          "save": {method: "PUT"}
        }
      );
    }
  }
});

appCivistApp.factory("Candidate", function($http, $resource, localStorageService) {
  var mockCandidates = [
    {
      "uuid":1,
      "title":"Appcivist Voting Service",
      "text":"Appcivist will provide activists users with a voting service that implements multiple voting systems and enables voting visualization.",
      "budget":"5000",
      "authors":["Cristhian Parra"],
      "workingGroupAuthors":["Voting Section Team"],
      "themes":["Computer Science", "Urban Infrastructure"],
      "attachments":[],
      "comments":["This is a very well made website.", "Except for a lot of issues in CSS"],
      "assessmentSummary":"This project seems feasible, if all of the team members have professional knowledge of Angular JS, Bootstrap and web development in general.",
      "assessments":[]
    },
    {
      "uuid":2,
      "title":"Playground in Square Marcel Mouioudji",
      "text":"Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this.",
      "budget":"25000",
      "authors":["Passionés du Parc de Belleville"],
      "workingGroupAuthors":["Playground team"],
      "themes":["Urban Infrastructure","Streets and Transportation"],
      "attachments":[],
      "comments":["The playground will be very attractive to children living in the neighborhood.", "There may be some safety concerns for the address of the playground."],
      "assessmentSummary":"This project seems pratical.",
      "assessments":[]
    },
    {
      "uuid":3,
      "title":"Organic Garden in Parc de Belleville",
      "text":"Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this.",
      "budget":"40000",
      "authors":["Passionés du Parc de Belleville"],
      "workingGroupAuthors":["Organic Garden team"],
      "themes":["Urban Infrastructure"],
      "attachments":[],
      "comments":["The playground will be very attractive to children living in the neighborhood.", "There may be some safety concerns for the address of the playground."],
      "assessmentSummary":"This project seems pratical.",
      "assessments":[]
    },
    {
      "uuid":4,
      "title":"Smart Traffic lights on Rue de Ménilmontant",
      "text":"Random description goes here as an example. I do not have anything particular in mind, so I am just going to say something like this.",
      "budget":"100000",
      "authors":["Conseil Belleville"],
      "workingGroupAuthors":["Smart Traffic Light team"],
      "themes":["Streets and Transportation"],
      "attachments":[],
      "comments":["The playground will be very attractive to children living in the neighborhood.", "There may be some safety concerns for the address of the playground."],
      "assessmentSummary":"This project seems pratical.",
      "assessments":[]
    }
  ]

  return {
    get: function(params) {
      var match = mockCandidates.filter(function(el) { return el.uuid == params.uuid; })[0];

      if (params.value)
        match.value = parseInt(params.value);
      if (params.score)
        match.score = parseInt(params.score);
      return match;
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
