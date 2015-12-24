appCivistApp.factory('GetRegistrationForm', function($http, $resource, localStorageService) { 
	var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }
 	
    var returned = {
    "votingBallotRegistrationFormId":"1",
    "fields": [
        {
        "votingBallotRegistrationFieldId":2,
        "fieldName":"Zip",
        "fieldDescription":"This is the zip"
        },
        {"votingBallotRegistrationFieldId":1,
        "fieldName":"Name",
        "fieldDescription":"This is the name"
        }
    ]
    };
 	return {
        form: function(uuid) {
            // return $resource(serverBaseUrl + '/ballot/'+uuid+'/registration');
            return returned;
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

    var votingBallotDB = {
        "ballot":{
            "votingBallotId" : 1,
            "uuid":1,
            "instructions":"All assembly members may vote.",
            "notes":"There will be offline voting happening in the following places: Houghton Park Community Center, 6301 Myrtle Avenue; Light & Life Church, 5951 Downey Avenue; Council District 9 Field Office, 6509 Gundry Avenue. Come vote and enjoy free food, music and activities for kids! For technical issues, contact Cristhian at +1 999 999 9999.",
            "systemType":"range",
            "starts":"2015-12-01 20:27",
            "ends": "2015-12-31 20:27",
            "candidates": [
                {
                  "targetUuid": 0,
                },
                {
                  "targetUuid": 1, 
                },{
                  "targetUuid": 2, 
                },
                {
                  "targetUuid": 3, 
                }
            ],
            "registrationForm": {
                "votingBallotRegistrationFormId":"1",
                "fields": [
                    {
                    "votingBallotRegistrationFieldId":2,
                    "fieldName":"Zip",
                    "fieldDescription":"This is the zip"
                    },
                    {"votingBallotRegistrationFieldId":1,
                    "fieldName":"Name",
                    "fieldDescription":"This is the name"
                    }
                ]
            },
            "configs":[
                {
                    "key": "minimum score assigned",
                    "value": 0
                },{
                    "key": "maximum score assigned",
                    "value": 100
                },{
                    "key":"number of winners",
                    "value":3
                }
            ]
        },
        "vote":{
            "votingBallotVote":1,
            "uuid":1,
            "signature":"1",
            "status":"DRAFT",
            "voteValues":[
                {
                    "votingCandidateVoteId":1,
                    "uuid":1,
                    "selectedCandidate":{
                        "targetUuid":0,
                        "uuid":1
                    },
                    "voteValue":"80/100",
                    "voteValueType":"RANGE"
                },{
                    "votingCandidateVoteId":2,
                    "uuid":2,
                    "selectedCandidate":{
                        "targetUuid":1,
                        "uuid":2
                    },
                    "voteValue":"67/100",
                    "voteValueType":"RANGE"
                },{
                    "votingCandidateVoteId":2,
                    "uuid":3,
                    "selectedCandidate":{
                        "targetUuid":2,
                        "uuid":3
                    },
                    "voteValue":"40/100",
                    "voteValueType":"RANGE"
                },{
                    "votingCandidateVoteId":3,
                    "uuid":4,
                    "selectedCandidate":{
                        "targetUuid":3,
                        "uuid":4
                    },
                    "voteValue":"96/100",
                    "voteValueType":"RANGE"
                }
            ]
        }
    };

    var candidateExamples = [
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
        signature:function(uuid){
            /*uncomment when backend is ready; delete the "return 1" line*/
            // return $resource(serverBaseUrl+'/ballot/'+uuid+'/vote/signature');
            return 1;
        },
        ballot: function(uuid, signature) {
            /*uncomment when back end is ready; delete the votingBallotDB line*/
            // return $resource(serverBaseUrl + '/ballot/'+uuid+'/'+signature);
            return votingBallotDB;
        },
        fill: function(uuid) {
            return $resource(serverBaseUrl + '/ballot/'+uuid+'/vote', {put:{method:'PUT', params:{object:{}}}});
        },
        getCandidate:function(uuid){
            // return $resource(serverBaseUrl+'/contribution/'+uuid);
            return candidateExamples[uuid];
        }
    }
});

appCivistApp.factory('VotingTally', function($http, $resource, localStorageService) {
    var serverBaseUrl =localStorageService.get('serverBaseUrl');
    if (serverBaseUrl == undefined || serverBaseUrl == null) {
        serverBaseUrl = appCivistCoreBaseURL;
        localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
        console.log("Setting API Server in appCivistService to: "+appCivistCoreBaseURL);
    } else {
        console.log("Using API Server in loginServer: "+serverBaseUrl);
    }

    var tallyExample = {
        "votingBallotTallyId":1,
        "uuid":1,
        "status":"FINISHED",
        "talliedResults":[
            {
                "votingCandidateResultId":1,
                "uuid":1,
                "selectedCandidate":{
                    "targetUuid":0,
                    "uuid":1
                },
                "voteValue":"96/100",
                "voteValueType":"RANGE"
            },{
                "votingCandidateResultId":2,
                "uuid":2,
                "selectedCandidate":{
                    "targetUuid":1,
                    "uuid":2
                },
                "voteValue":"80/100",
                "voteValueType":"RANGE"
            },{
                "votingCandidateResultId":2,
                "uuid":3,
                "selectedCandidate":{
                    "targetUuid":2,
                    "uuid":3
                },
                "voteValue":"67/100",
                "voteValueType":"RANGE"
            },{
                "votingCandidateResultId":3,
                "uuid":4,
                "selectedCandidate":{
                    "targetUuid":3,
                    "uuid":4
            },
                "voteValue":"40/100",
                "voteValueType":"RANGE"
            }
        ],
        "ballot":{
            "votingBallotId" : 1,
            "uuid":1,
            "instructions":"All assembly members may vote.",
            "notes":"There will be offline voting happening in the following places: Houghton Park Community Center, 6301 Myrtle Avenue; Light & Life Church, 5951 Downey Avenue; Council District 9 Field Office, 6509 Gundry Avenue. Come vote and enjoy free food, music and activities for kids! For technical issues, contact Cristhian at +1 999 999 9999.",
            "systemType":"range",
            "starts":"2015-12-01 20:27",
            "ends": "2015-12-31 20:27",
            "candidates": [
                {
                  "targetUuid": 0,
                },
                {
                  "targetUuid": 1, 
                },{
                  "targetUuid": 2, 
                },
                {
                  "targetUuid": 3, 
                }
            ],
            "registrationForm": {
                "votingBallotRegistrationFormId":"1",
                "fields": [
                    {
                    "votingBallotRegistrationFieldId":2,
                    "fieldName":"Zip",
                    "fieldDescription":"This is the zip"
                    },
                    {"votingBallotRegistrationFieldId":1,
                    "fieldName":"Name",
                    "fieldDescription":"This is the name"
                    }
                ]
            },
            "configs":[
                {
                    "key": "minimum score assigned",
                    "value": 0
                },{
                    "key": "maximum score assigned",
                    "value": 100
                },{
                    "key":"number of winners",
                    "value":3
                }
            ]
        }
    }

    return{
        tally: function(uuid, signature) {
            /*replace this with the $resouce object with the corresponding url*/
            return tallyExample;
        }
    }
});
