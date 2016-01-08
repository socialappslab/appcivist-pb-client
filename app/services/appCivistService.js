﻿/**
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
    }
    return serverBaseUrl;
}

appCivistApp.factory('Assemblies', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        assemblies: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly');
        },
        assembly: function(assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid', {aid: assemblyId});
        },
        assembliesWithoutLogin: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/listed');
        },
        assembliesByQuery: function(q) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly', {query: q});
        },
        assemblyMembers: function(assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/membership/ALL', {aid: assemblyId});
        },
        linkedAssemblies: function(assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/linked', {aid: assemblyId});
        },
        featuredAssemblies: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly', {filter:"featured"});
        },
        verifyMembership: function(assemblyId, userId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/user/:uid',
                {
                    aid: assemblyId,
                    uid: userId
                });
        },
        defaultNewAssembly: function() {
           return {
                //"name": "Assemblée Belleville",
                //"shortname": "assemblee-belleville",
                //"description": "This assembly organizes citizens of Belleville, to come up with interesting and feasible proposals to be voted on and later implemented during the PB process of 2015",
                "listed": true, // TODO: ADD TO FORM
                "profile": {
                    "targetAudience": "RESIDENTS",
                    "membership": "REGISTRATION",
                    "registration" : {
                        "invitation" : true,
                        "request" : true
                    },
                    "moderators":"two",
                    "coordinators":"two",
                    "icon": "https://appcivist.littlemacondo.com/public/images/barefootdoctor-140.png",
                    "primaryContactName": "",
                    "primaryContactPhone": "",
                    "primaryContactEmail": ""
                },
                //"location": {
                //	"placeName": "Belleville, Paris, France"
                //},
                "themes": [{
                    "title": "Housing"
                }
                ],
                "existingThemes": [],
                "config" : {
                    "facetoface":true,
                    "messaging":true
                },
                "configs": [
                    {
                        "key": "assembly.face-to-face.scheduling",
                        "value": "true"
                    },
                    {
                        "key": "assembly.enable.messaging",
                        "value": "false"
                    }
                ],
                "lang": "en", // TODO: ADD TO FORM
                //"invitationEmail"
                "invitations" : [ ], // { "email": "abc1@example.com", "moderator": true, "coordinator": false }, ... ],
                "linkedAssemblies" : [ ] // [ { "assemblyId": "2" }, { "assemblyId": "3" }, ... ]
            };
        }
    }
});

appCivistApp.factory('Campaigns', function ($resource, $sce, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        campaigns: function(state) {
            return $resource(getServerBaseUrl(localStorageService) + '/user/'+localStorageService.get('user').uuid+'/campaign?status='+state+'');
        },
        campaign: function(assemblyId, campaignId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/'+assemblyId+'/campaign/'+campaignId);
        },
        newCampaign: function(assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign',
                {
                    aid: assemblyId
                }
            );
        },
        templates: function() {
            return $resource(getServerBaseUrl(localStorageService)+'/campaign/template');
        },
        defaultNewCampaign: function() {
            var campaign = {
                // title : "PB Belleville 2016",
                // shortname : "pb-belleville-2016
                // goal: "Develop proposals for Belleville 2016"
                // url:
                listed : true,
                config: {
                    discussionReplyTo: true,
                    upDownVoting: true,
                    budget: 50000,
                    budgetCurrency: "$"
                },
                configs : [
                    {
                        key: "campaign.pb.budget",
                        value: "50.000"
                    },
                    {
                        key: "campaign.pb.budget.currency",
                        value: "$"
                    },
                    {
                        key: "campaign.discussions.reply.to.comments",
                        value: true
                    },
                    {
                        key: "campaign.up-down-voting",
                        value: true
                    }
                ],
                themes: [], // [ {theme:""}, ... ]
                existingThemes: [], // [ 1, 89, ... ]
                components: [], // [{...}]
                existingComponents: [],
                useLinkedCampaign: true,
                milestones: [
                    {
                        date: today().toDate(),
                        value: 1,
                        title: "Brainstorming",
                        description: "Identify problems and make suggestions for proposals.",
                        component: "Proposal Making",
                        symbol: $sce.trustAsHtml("1"),
                        opened:true,
                        componentIndex: 0,
                        position: 1,
                        mainContributionType: "BRAINSTORMING"
                    },
                    {
                        date: today().add(15, 'days').toDate(),
                        value: 15,
                        title: "Working groups formation",
                        description: "Join or create a group to develop proposals.",
                        component: "Proposal Making",
                        componentKey: "Proposalmaking",
                        symbol: $sce.trustAsHtml("2"),
                        opened:true,
                        componentIndex: 0,
                        position: 2,
                        mainContributionType: "BRAINSTORMING"
                    },
                    {
                        date: today().add(20, 'days').toDate(),
                        value: 20,
                        title: "Proposal drafting",
                        description: "Explore existing proposals or start one with your working group.",
                        component: "Proposal Making",
                        componentKey: "Proposalmaking",
                        symbol: $sce.trustAsHtml("3"),
                        opened:true,
                        componentIndex: 0,
                        position: 3,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(30, 'days').toDate(),
                        value: 30,
                        title: "Proposal editing",
                        description: "Versioning of existing proposals.",
                        component: "Versioning",
                        componentKey: "Versioning",
                        symbol: $sce.trustAsHtml("4"),
                        opened:true,
                        componentIndex: 1,
                        position: 4,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(45, 'days').toDate(),
                        value: 45,
                        title: "Proposal selection",
                        description: "Versioning period over. Working Groups must now select the proposals they want to put forward to the Assembly for deliberation and voting. While this process is ongoing, proposals will be available in read only mode, open to comments from the Assembly.",
                        component: "Versioning",
                        componentKey: "Versioning",
                        symbol: $sce.trustAsHtml("5"),
                        opened:true,
                        componentIndex: 1,
                        position: 5,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(60, 'days').toDate(),
                        value: 60,
                        title: "Discussion of proposals",
                        description: "Explore and discuss published proposals for deliberation.",
                        component: "Deliberation",
                        symbol: $sce.trustAsHtml("6"),
                        opened:true,
                        componentIndex: 2,
                        position: 6,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(90, 'days').toDate(),
                        value: 90, title: "Technical assessment",
                        description: "Published proposals for deliberation are now being technically evaluated by volunteers, to assess feasibility and provide expert feedback. You can still freely explore and discuss published proposals. When evaluations are ready, they will appear above of each proposal.",
                        component: "Deliberation",
                        symbol: $sce.trustAsHtml("7"),
                        opened:true,
                        componentIndex: 2,
                        position: 7,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(120, 'days').toDate(),
                        value: 120, title: "Voting on proposals",
                        description: "Explore and evaluate published proposals. When you are ready, open the voting ballot and cast your vote. You will be provided with a secret code to recover your voting ballot and update it anytime until the voting period is over.",
                        component: "Voting",
                        symbol: $sce.trustAsHtml("8"),
                        opened:true,
                        componentIndex: 3,
                        position: 8,
                        mainContributionType: "PROPOSAL"
                    },
                    {
                        date: today().add(130, 'days').toDate(),
                        value: 130, title: "Voting period ending",
                        description: "Explore and evaluate published proposals. When you are ready, open the voting ballot and cast your vote. You will be provided with a secret code to recover your voting ballot and update it anytime until the voting period is over.",
                        component: "Voting",
                        symbol: $sce.trustAsHtml("8"),
                        opened:true,
                        componentIndex: 3,
                        position: 9,
                        mainContributionType: "PROPOSAL"
                    }
                ]
            };
            return campaign;
        }
    };

});

appCivistApp.factory('Memberships', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        memberships: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/membership/user/'+localStorageService.get('user').uuid);
        },
        assemblies: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/membership/user/'+localStorageService.get('user').uuid+'?type=assembly');
        },
        workingGroups: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/membership/user/'+localStorageService.get('user').uuid+'?type=group');
        }
    };
});

appCivistApp.factory('Notifications', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return $resource(getServerBaseUrl(localStorageService) + '/notification/user/'+localStorageService.get('user').uuid);

});

appCivistApp.factory('Contributions', function ($resource, localStorageService, WorkingGroups) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        contributions: function (assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/'+assemblyId+'/contribution?space=forum');
        },
        contribution: function (assemblyId, contributionId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid',
                {aid: assemblyId, coid: contributionId},
                {
                    'update' : {method:'PUT'},
                    'delete' : {method: 'DELETE'}
                });
        },
        contributionAttachment: function (assemblyId, contributionId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/attachment',
                {aid: assemblyId, coid: contributionId});
        },
        groupContribution: function (assemblyId, groupId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contribution',
                {aid: assemblyId, gid: groupId});
        },
        verifyAuthorship: function (user, c) {
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
        verifyGroupAuthorship: function (user, c, group) {
            var assemblyId = group.assemblies[0];
            var groupId = group.groupId;
            var status = 'ACCEPTED';
            return WorkingGroups.verifyMembership(assemblyId, groupId, user.userId);
        },
        defaultNewContribution: function () {
            var newC = {
                "title" : "",
                "text" : "",
                "type" : "",
                "location" : {
                    "placeName" : "",
                    "city" : "",
                    "state" : ""
                },
                "themesHash" : [],
                "workingGroupAuthors" : [],
                "themes": [],
                "existingThemes" : [],
                "parentThemes" : [],
                "hashtags": [],
                "attachments": [],
                "associatedMilestones": []
            };
            return newC;
        },
        contributionInResourceSpace: function (spaceId) {
            return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution',
                {sid: spaceId});
        },
        contributionsInCampaignComponent: function (assemblyID, campaignID, componentID) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/component/:ciid/contribution',
                {
                    aid: assemblyID,
                    cid: campaignID,
                    ciid: componentID
                })
        },
        updateStats: function (statsId) {
            return $resource(getServerBaseUrl(localStorageService) + '/stats/:stid',
                {stid: statsId},
                {'update': {method:'PUT'}}
            );
        },
        defaultContributionAttachment: function () {
            var att = {
                name: "",
                resourceType: "",
                url: "",
                showForm: false
            };
            return att;
        },
        newAttachmentObject: function (newAttachment) {
            if(!newAttachment.resourceType) {
                newAttachment.resourceType = "WEBPAGE";
                if (newAttachment.url.endsWith(".jpg")
                    || newAttachment.url.toLowerCase().endsWith(".png")
                    || newAttachment.url.toLowerCase().endsWith(".jpeg")
                    || newAttachment.url.toLowerCase().endsWith(".gif")
                    || newAttachment.url.toLowerCase().endsWith(".tiff")) {
                    newAttachment.resourceType = "PICTURE";
                } else if (newAttachment.url.toLowerCase().endsWith(".pdf")
                    || newAttachment.url.toLowerCase().endsWith(".doc")
                    || newAttachment.url.toLowerCase().endsWith(".docx")
                    || newAttachment.url.toLowerCase().endsWith(".xsl")
                    || newAttachment.url.toLowerCase().endsWith(".xslx")) {
                    newAttachment.resourceType = "FILE";
                } else if (newAttachment.url.toLowerCase().endsWith(".mp3")
                    || newAttachment.url.toLowerCase().endsWith(".ogg")
                    || newAttachment.url.toLowerCase().endsWith(".acc")) {
                    newAttachment.resourceType = "AUDIO";
                } else if (newAttachment.url.toLowerCase().endsWith(".mp4")
                    || newAttachment.url.toLowerCase().endsWith(".mov")
                    || newAttachment.url.toLowerCase().endsWith(".avi")) {
                    newAttachment.resourceType = "VIDEO";
                } else {
                    newAttachment.resourceType = "WEBPAGE";
                }
            }
            return {
                name : newAttachment.name,
                url : newAttachment.url,
                resourceType : newAttachment.resourceType
            }
        },
        copyAttachmentObject: function (oldAtt, newAtt) {
            oldAtt.name = newAtt.name;
            oldAtt.url = newAtt.url;
            oldAtt.resourceType = newAtt.resourceType;
            oldAtt.showForm = newAtt.showForm;
        },
        copyContributionObject: function (oldC, newC) {
            if(newC.contributionId) {
                oldC.contributionId = newC.contributionId;
            } else {
                delete oldC.contributionId;
            }
            oldC.title = newC.title;
            oldC.text = newC.text;
            oldC.type = newC.type;
            oldC.location = newC.location
            oldC.themesHash = newC.themesHash;
            oldC.themes = newC.themes;
            oldC.hashtags = newC.hashtags;
            oldC.attachments = newC.attachments;
            oldC.associatedMilestones = newC.associatedMilestones;
        }
    };
});

appCivistApp.factory('WorkingGroups', function ($resource, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        workingGroup: function(assemblyId, groupId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid', {aid: assemblyId, gid: groupId});
        },
        workingGroups: function(assemblyId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group', {aid: assemblyId});
        },
        workingGroupMembers: function(assemblyId, groupId, stat) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/membership/:status',
                {
                    aid: assemblyId,
                    gid: groupId,
                    status: stat
                });
        },
        workingGroupProposals: function(assemblyId, groupId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/proposals',
                {
                    aid: assemblyId,
                    gid: groupId
                });
        },
        verifyMembership: function(assemblyId, groupId, userId) {
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/user/:uid',
                {
                    aid: assemblyId,
                    gid: groupId,
                    uid: userId
                });
        },
        defaultNewWorkingGroup: function() {
            return {
                //"name": "Assemblée Belleville",
                //"text": "This assembly organizes citizens of Belleville, to come up with interesting and feasible proposals to be voted on and later implemented during the PB process of 2015",
                "listed": true, // TODO: ADD TO FORM
                "profile": {
                    "targetAudience": "RESIDENTS",
                    "membership": "REGISTRATION",
                    "registration" : {
                        "invitation" : true,
                        "request" : true
                    },
                    "moderators":"two",
                    "coordinators":"two",
                    "icon": "https://appcivist.littlemacondo.com/public/images/barefootdoctor-140.png"
                },
                //"location": {
                //	"placeName": "Belleville, Paris, France"
                //},
                "themes": [],
                "existingThemes": [],
                "config" : {
                    "majority":"66%",
                    "blocking":false
                },
                "configs": [
                    {
                        "key": "group.consensus.majority",
                        "value": "66%"
                    },
                    {
                        "key": "group.consensus.blocking",
                        "value": "false"
                    }
                ],
                "lang": "en", // TODO: ADD TO FORM
                //"invitationEmail"
                "invitations" : [ ] // { "email": "abc1@example.com", "moderator": true, "coordinator": false }, ... ],
            };
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
            return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/padid',
                {
                    aid: assemblyId,
                    cid: contributionId
                });
        },
        getEtherpadReadOnlyUrl : function (readOnlyPadId) {
            return localStorageService.get("etherpadServer")+"p/"+readOnlyPadId+"?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
        }
    };
});

appCivistApp.factory('Components', function ($resource, $sce, localStorageService) {
    var serverBaseUrl = getServerBaseUrl(localStorageService);
    return {
        defaultProposalComponents: function() {
            // Options Dictionary
            var optionsDict = {};
            optionsDict['component.deliberation.who-deliberates'] = [
                    {
                        name: "All assembly members",
                        value: "ASSEMBLY",
                        selected: true
                    },
                    {
                        name: "Only Working Groups of this Campaign",
                        value: "CAMPAIGN_WORKING_GROUPS",
                        selected: false
                    },
                    {
                        name: "Randomly selected jury",
                        value: "JURY",
                        selected: false
                    }
                ];
            optionsDict['component.deliberation.who-deliberates.jury'] = [
                {
                    name: "From all assembly members",
                    value: "ASSEMBLY",
                    selected: true
                },
                {
                    name: "From Working Groups of this Campaign",
                    value: "CAMPAIGN_WORKING_GROUPS",
                    selected: false
                }
            ];
            optionsDict['component.voting.system'] = [
                {
                    name: "Range",
                    value: "RANGE",
                    selected: true
                },
                {
                    name: "Ranked",
                    value: "RANKED",
                    selected: false
                },
                {
                    name: "Distribution",
                    value: "DISTRIBUTION",
                    selected: false
                },
                {
                    name: "Plurality",
                    value: "PLURALITY",
                    selected: false
                }
            ];
            optionsDict['component.voting.system.plurality.type'] = [
                {
                    name: "Only YES votes",
                    value: "YES",
                    selected: true
                },
                {
                    name: "YES and NO votes",
                    value: "YES/NO",
                    selected: true
                },
                {
                    name: "YES, NO, and Abstain votes",
                    value: "YES/NO/ABSTAIN",
                    selected: true
                },
                {
                    name: "YES, NO, Abstain and Block votes",
                    value: "YES/NO/ABSTAIN/BLOCK",
                    selected: true
                }
            ];
            optionsDict['component.voting.system.winners'] = [
                {
                    name: "Fixed regardless of budget",
                    value: "FIXED",
                    selected: true
                },
                {
                    name: "Dynamic 1: first N-ranked proposals that can be fully funded by available budget (may result in unspent funds)",
                    value: "DYNAMIC1",
                    selected: false
                },
                {
                    name: "Dynamic 2: first N-ranked proposals that can be fully funded by available budget, allocating all the funds (may result in 'leapfrogging')",
                    value: "DYNAMIC2",
                    selected: false
                }
            ];

            // Config Dictionary
            var configDict = {};
            configDict['Proposalmaking'] = [];
            configDict['Versioning'] =  [
                {
                    key: "component.versioning.enable.proposal.merge-split",
                    description: "Enable proposal merge/split (if enabled, multiple proposals can be combined or a single proposal can be split into several)",
                    type: "checkbox",
                    tooltipKey: "versioningMergeSplitTooltip",
                    value: false

                },
                {
                    key: "component.versioning.enable.working-groups.comments.external",
                    description: "Enable comments in proposals by members of non-authoring Working Groups",
                    type: "checkbox",
                    tooltipKey: "versioningCommentsByExtGroupsTooltip",
                    value: true
                }
            ];
            configDict['Deliberation'] =  [
                {
                    position: 1,
                    key: "component.deliberation.enable.technical-assesment",
                    description: "Enable technical assessment of proposals",
                    type: "checkbox",
                    tooltipKey: "deliberationTechnicalAssessmentTooltip",
                    value: true
                },
                {
                    position: 2,
                    key: "component.deliberation.disable.additional.versioning-deliberation",
                    description: "Disable additional rounds of versioning and deliberation",
                    type: "checkbox",
                    tooltipKey: "deliberationAdditionalVersioningTooltip",
                    value: false
                },
                {
                    position: 3,
                    key: "component.deliberation.who-deliberates",
                    description: "Who deliberates?",
                    type: "select",
                    tooltipKey: "versioningWhoDeliberates",
                    options: optionsDict['component.deliberation.who-deliberates'],
                    optionValue: optionsDict['component.deliberation.who-deliberates'][0],
                    value: optionsDict['component.deliberation.who-deliberates'][0].value
                },
                {
                    position: 4,
                    key: "component.deliberation.who-deliberates.jury",
                    description: "From where are members of the jury randomly selected?",
                    type: "select",
                    options: optionsDict['component.deliberation.who-deliberates.jury'],
                    optionValue: optionsDict['component.deliberation.who-deliberates.jury'][0],
                    value: optionsDict['component.deliberation.who-deliberates.jury'][0].value,
                    dependsOf: 3,
                    dependsOfValue: "JURY"
                },
                {
                    position: 5,
                    key: "component.deliberation.who-deliberates.jury.percentage",
                    description: "What percentage of people should be on the Jury?",
                    type: "input",
                    inputType: "percentage",
                    value: 0.1,
                    dependsOf: 3,
                    dependsOfValue: "JURY"
                }
            ];
            configDict['Voting'] = [
                {
                    position: 1,
                    key: "component.voting.system",
                    description: "Select the voting system",
                    type: "select",
                    tooltipKey: "votingSystemTooltip",
                    options: optionsDict['component.voting.system'],
                    optionValue: optionsDict['component.voting.system'][0],
                    value: optionsDict['component.voting.system'][0].value
                },
                {
                    position: 2,
                    key: "component.voting.system.range.min-score",
                    description: "Minimum score for range voting",
                    type: "input",
                    inputType: "number",
                    value: 0,
                    dependsOf: 1,
                    dependsOfValue: optionsDict['component.voting.system'][0].value
                },
                {
                    position: 3,
                    key: "component.voting.system.range.max-score",
                    description: "Maximum score for range voting",
                    type: "input",
                    inputType: "number",
                    value: 100,
                    dependsOf: 1,
                    dependsOfValue: optionsDict['component.voting.system'][0].value
                },
                {
                    position: 4,
                    key: "component.voting.system.ranked.number-proposals",
                    description: "How many proposals can a voter select?",
                    type: "input",
                    inputType: "number",
                    value: 5,
                    dependsOf: 1,
                    dependsOfValue: optionsDict['component.voting.system'][1].value
                },
                {
                    position: 5,
                    key: "component.voting.system.distributed.points",
                    description: "How many points can a voter distribute?",
                    type: "input",
                    inputType: "number",
                    value: 30,
                    dependsOf: 1,
                    dependsOfValue: optionsDict['component.voting.system'][2].value
                },
                {
                    position: 6,
                    key: "component.voting.system.plurality.type",
                    description: "Select the type of plurality voting",
                    type: "select",
                    options: optionsDict['component.voting.system.plurality.type'],
                    optionValue: optionsDict['component.voting.system.plurality.type'][0],
                    value: optionsDict['component.voting.system.plurality.type'][0].value,
                    dependsOf: 1,
                    dependsOfValue: optionsDict['component.voting.system'][2].value
                },
                {
                    position: 7,
                    key: "component.voting.system.plurality.block.threshold",
                    description: "Block percentage threshold",
                    type: "input",
                    inputType: "percentage",
                    value: 0.1,
                    dependsOf: 6,
                    dependsOfValue: optionsDict['component.voting.system.plurality.type'][3].value
                },
                {
                    position: 8,
                    key: "component.voting.system.winners",
                    description: "Configure number of winners",
                    type: "radio",
                    options: optionsDict['component.voting.system.winners'],
                    optionValue: optionsDict['component.voting.system.winners'][0],
                    value: optionsDict['component.voting.system.winners'][0].value
                },
                {
                    position: 9,
                    key: "component.voting.system.winners.fixed.number",
                    description: "Number of Winners",
                    type: "input",
                    inputType: "number",
                    value: 3,
                    dependsOf: 8,
                    dependsOfValue: optionsDict['component.voting.system.winners'][0].value
                },
                {
                    position: 10,
                    key: "component.voting.system.quorum.enable",
                    description: "Enable Quorum threshold",
                    type: "checkbox",
                    value: true
                },
                {
                    position: 11,
                    key: "component.voting.system.quorum",
                    description: "Quorum percentage",
                    type: "input",
                    inputType: "percentage",
                    value: 0.6,
                    dependsOf: 10,
                    dependsOfValue: true
                }
            ];

            // TODO: get component definitions from server
            return [
                {
                    position: 1,
                    timeline: 1,
                    name: 'Proposal making',
                    title: 'Proposal making',
                    key: "Proposalmaking",
                    enabled: true,
                    active: true,
                    state: "",
                    linked: false,
                    template: "/app/partials/campaign/creation/components/proposal.html",
                    descriptionTemplate: "/app/partials/campaign/creation/components/proposalDescription.html",
                    // TODO: transform the contribution template into just another config
                    contributionTemplate:[
                        {
                            title: "Title",
                            description: "A sentence that describes the proposal's main idea",
                            length: 30,
                            position: 1,
                            defaultSection: true
                        },
                        {
                            title: "Theme/s",
                            description: "The list of themes that apply to this proposal",
                            position: 2,
                            defaultSection: true
                        },
                        {
                            title: "Summary ",
                            description: "A short summary that explains the proposal's key idea in less than 250 words",
                            length: 250,
                            position: 3,
                            defaultSection: true
                        },
                        {
                            title: "Location",
                            description: "If applies, the name of a location or zone where the proposal will be realized",
                            position: 4,
                            defaultSection: true
                        },
                        {
                            title: "Attachments",
                            description: "A list of additional resources that give support to the proposal (images, files, datasets, websites, etc.)",
                            position: 5,
                            defaultSection: true
                        }
                    ],
                    component: {
                        componentId:23
                    },
                    milestones: []
                },
                {
                    position: 2,
                    timeline: 1,
                    name: 'Versioning',
                    title: 'Versioning',
                    key: "Versioning",
                    enabled: true,
                    active: true,
                    state: "",
                    linked: false,
                    configs: configDict['Versioning'],
                    template: "/app/partials/campaign/creation/components/versioning.html",
                    descriptionTemplate: "/app/partials/campaign/creation/components/versioningDescription.html",
                    component: {
                        componentId:24
                    },
                    milestones: []
                },
                {
                    position: 3,
                    timeline: 1,
                    name: 'Deliberation',
                    title: 'Deliberation',
                    key: "Deliberation",
                    enabled: true,
                    active: false,
                    state: "",
                    linked: false,
                    configs: configDict['Deliberation'],
                    template: "/app/partials/campaign/creation/components/deliberation.html",
                    descriptionTemplate: "/app/partials/campaign/creation/components/deliberationDescription.html",
                    component: {
                        componentId:25
                    },
                    milestones: []
                },
                {
                    position: 4,
                    timeline: 1,
                    name: 'Voting',
                    title: 'Voting',
                    key: "Voting",
                    enabled: true,
                    active: false,
                    state: "",
                    linked: false,
                    configs: configDict['Voting'],
                    template: "/app/partials/campaign/creation/components/voting.html",
                    descriptionTemplate: "/app/partials/campaign/creation/components/votingDescription.html",
                    component: {
                        componentId:26
                    },
                    milestones: []
                },
                {
                    position: 5,
                    timeline: 1,
                    name: 'Deliberation',
                    title: 'Deliberation',
                    key: "DeliberationLinked",
                    enabled: true,
                    active: false,
                    state: "",
                    linked: true,
                    component: {
                        componentId:25
                    },
                    milestones: []
                },
                {
                    position: 1,
                    timeline: 1,
                    name: 'Voting',
                    title: 'Voting',
                    key: "VotingLinked",
                    enabled: true,
                    active: false,
                    state: "",
                    linked: true,
                    component: {
                        componentId:26
                    },
                    milestones: []
                }
            ];
        },
        defaultSupportingComponents: function() {
            return [
                {name: 'Working Groups', alias: 'workingGroups'},
                {name: 'Visualization', alias: 'visualization'},
                {name: 'Mapping', alias:'mapping'},
                {name: 'Mobilization', alias:'mobilization'},
                {name: 'Reporting', alias:'reporting'},
                {name: 'Implementation', alias:'implementation'}
            ];
        }

    };
});

appCivistApp.factory('AppCivistAuth', function ($resource, localStorageService) {
    return {
        signIn: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/user/login');
        },
        signOut: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/user/logout');
        },
        signUp: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/user/signup');
        }
    };
});

appCivistApp.factory('FileUploader', function ($resource, localStorageService, Upload, $timeout) {
    return {
        upload: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/upload');
        },
        list: function() {
            return $resource(getServerBaseUrl(localStorageService) + '/files');
        },
        uploadEndpoint: function() {
            return getServerBaseUrl(localStorageService) + '/upload';
        },
        uploadFileAndAddToResource: function(file, resource) {
            if (file) {
                var type = "FILE";
                if (file.type.startsWith("image")) {
                    type = "PICTURE"
                } else if (file.type.startsWith("audio")) {
                    type = "AUDIO"
                } else if (file.type.startsWith("video")) {
                    type = "VIDEO"
                }

                resource.resourceType = type;
                file.upload = Upload.upload({
                    url: getServerBaseUrl(localStorageService) + '/upload',
                    data: {file: file}
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        resource.name = response.data.name;
                        resource.url = response.data.url;
                    });
                }, function (response) {
                    if (response.status > 0)
                        file.errorMsg = response.status + ': ' + response.data;
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                    console.log('progress: ' + file.progress + '% ');
                });
            }
        }

    };
});