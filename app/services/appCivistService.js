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
  if (serverBaseUrl === undefined || serverBaseUrl === null) {
    serverBaseUrl = appCivistCoreBaseURL;
    localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
    console.log("Setting API Server in appCivistService to: " + appCivistCoreBaseURL);
  }
  return serverBaseUrl;
}

appCivistApp.factory('Assemblies', function($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    assemblies: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly');
    },
    assembly: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid', { aid: assemblyId });
    },
    assemblyByShortName: function(shortName) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:shortname', { shortname: shortName });
    },
    assemblyPublicProfile: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/public', { aid: assemblyId });
    },
    assembliesWithoutLogin: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/listed');
    },
    assembliesByQuery: function(q) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly', { query: q });
    },
    assemblyMembers: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/membership/ALL', { aid: assemblyId });
    },
    linkedAssemblies: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/linked', { aid: assemblyId });
    },
    featuredAssemblies: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly', { filter: "featured" });
    },
    verifyMembership: function(assemblyId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/user/:uid', {
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
          "registration": {
            "invitation": true,
            "request": true
          },
          "moderators": "two",
          "coordinators": "two",
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
        }],
        "existingThemes": [],
        "config": {
          "facetoface": true,
          "messaging": true
        },
        "configs": [{
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
        "invitations": [], // { "email": "abc1@example.com", "moderator": true, "coordinator": false }, ... ],
        "linkedAssemblies": [] // [ { "assemblyId": "2" }, { "assemblyId": "3" }, ... ]
      };
    },

    assemblyByUUID: function(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:uuid', { uuid: uuid });
    }
  };
});

appCivistApp.factory('Campaigns', function($resource, $sce, localStorageService, Notify) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    campaigns: function(userUUID, state) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:uuid/campaign', { uuid: userUUID, filter: state });
    },
    campaign: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/' + assemblyId + '/campaign/' + campaignId);
    },
    campaignByUUID: function(campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/' + campaignUUID);
    },
    newCampaign: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign', {
        aid: assemblyId
      });
    },
    templates: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/template');
    },
    defaultNewCampaign: function() {
      var campaign = {
        // title : "PB Belleville 2016",
        // shortname : "pb-belleville-2016
        // goal: "Develop proposals for Belleville 2016"
        // url:
        listed: true,
        config: {
          discussionReplyTo: true,
          upDownVoting: true,
          budget: 50000,
          budgetCurrency: "$"
        },
        configs: [{
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
        useLinkedCampaign: false,
        milestones: []
      };
      return campaign;
    },

    /**
     * Helper method for finding out the current component in the
     * campaign timeline.
     *
     * @param components {Array}: the list of components of the campaign
     */
    getCurrentComponent: function(components) {
      var current;

      angular.forEach(components, function(c) {
        var startMoment = moment(c.startDate, 'YYYY-MM-DD HH:mm').local();
        startMoment.hour(0);
        startMoment.minute(0);
        var endMoment = moment(c.endDate, 'YYYY-MM-DD HH:mm').local();
        endMoment.hour(0);
        endMoment.minute(0);

        if (moment().local().isBetween(startMoment, endMoment)) {
          current = c;
        }

      });

      if (!current && components && components.length) {
        current = components[components.length - 1];
      }
      return current;
    },

    /**
     * Returns and $resource to interact with /assembly/:aid/campaign/:cid/resource endpoint.
     *
     * @param assemblyId {number} Assembly ID
     * @param campaignId {number} Campaign ID
     * @return {Array} List of resources associated with the given campaign
     */
    resources: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/resources', { aid: assemblyId, cid: campaignId });
    },

    timeline: function(assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

      // Get timeline of the campaign
      var rsp;
      var query = filters || {};
      query.all = true;

      if (!isAnonymous) {
        rsp = this.timelineByCampaignId(assemblyId, campaignId).query(query);
      } else {
        rsp = this.timelineByCampaignUUID(campaignUUID).query(query);
      }
      rsp.$promise.then(
        function(data) {
          return data;
        },
        function(error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
      return rsp.$promise;

    },
    timelineByCampaignId: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/timeline', { aid: assemblyId, cid: campaignId });
    },
    timelineByCampaignUUID: function(campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/:uuid/timeline', { uuid: campaignUUID });
    },

    components: function(assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

      // Get components of the campaign
      var rsp;
      var query = filters || {};
      query.all = true;

      if (!isAnonymous) {
        rsp = this.componentsByCampaignId(assemblyId, campaignId).query(query);
      } else {
        rsp = this.componentsByCampaignUUID(campaignUUID).query(query);
      }
      rsp.$promise.then(
        function(data) {
          return data;
        },
        function(error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
      return rsp.$promise;

    },
    componentsByCampaignId: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/components', { aid: assemblyId, cid: campaignId });
    },
    componentsByCampaignUUID: function(campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/:uuid/components', { uuid: campaignUUID });
    },

    themes: function(assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

      // Get themes of the campaign
      var rsp;
      var query = filters || {};
      query.all = true;

      if (!isAnonymous) {
        rsp = this.themesByCampaignId(assemblyId, campaignId).query(query);
      } else {
        rsp = this.themesByCampaignUUID(campaignUUID).query(query);
      }
      rsp.$promise.then(
        function(data) {
          return data;
        },
        function(error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
      return rsp.$promise;

    },
    themesByCampaignId: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/themes', { aid: assemblyId, cid: campaignId });
    },
    themesByCampaignUUID: function(campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/:uuid/themes', { uuid: campaignUUID });
    }
  };

});

appCivistApp.factory('Memberships', function($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    membership: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/membership', {}, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    membershipRequest: function(targetCollection, targetId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/:target/:id/request', {
        target: targetCollection,
        id: targetId
      });
    },
    memberships: function(userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId });
    },
    assemblies: function(userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId, type: 'assembly' });
    },
    workingGroups: function(userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId, type: 'group' });
    },
    membershipInAssembly: function(assemblyId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/assembly/:aid/user/:uid', { aid: assemblyId, uid: userId });
    },
    membershipInGroup: function(groupId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/group/:gid/user/:uid', { gid: groupId, uid: userId });
    },
    updateStatus: function(membershipId, newStatus) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/:mid/:status', { mid: membershipId, status: newStatus }, {
        'update': { method: 'PUT' }
      });
    },
    reSendInvitation: function(invitationId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:iid/email', { iid: invitationId });
    },

    hasRol: function(rols, rolName) {
      var rol;
      for (var i = 0; i < rols.length; i++) {
        rol = rols[i];

        if (rol.name === rolName) {
          return true;
        }
      }
      return false;
    },

    assemblyRols: function(aid) {
      var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
      return assemblyMembershipsHash[aid];
    },

    groupRols: function(gid) {
      var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
      return groupMembershipsHash[gid];
    },

    /**
     * Checks if current user has the given rol.
     *
     * @param {string} target - assembly | group
     * @param {number} id - target ID
     * @param {string} rol - the rol to check
     */
    rolIn: function(target, id, rol) {
      switch (target) {
        case 'assembly':
          return this.hasRol(this.assemblyRols(id), rol);
        case 'group':
          return this.hasRol(this.groupRols(id), rol);
      }
    },

    /**
     * Check if current user is coordinator of the given assembly.
     *
     * @param {number} aid - Assembly ID.
     */
    isAssemblyCoordinator: function(aid) {
      return this.rolIn('assembly', aid, 'COORDINATOR');
    },

    /**
     * Check if current user is member of the given assembly.
     *
     * @param {string} target - group | assembly
     * @param {number} id - Assembly ID.
     */
    isMember: function(target, id) {
      return this.rolIn(target, id, 'MEMBER');
    }

  };
});

appCivistApp.factory('Notifications', function($resource, localStorageService) {
  return {
    userNotificationsByUUID: function(userUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/notification/user/:uuid', { uuid: userUUID })
    },
    subscribe: function() {
      return $resource(getServerBaseUrl(localStorageService) + '/notification/subscription');
    }
  };

});

appCivistApp.factory('Contributions', function($resource, localStorageService, WorkingGroups) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    contributions: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/' + assemblyId + '/contribution?space=forum');
    },
    contribution: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid', { aid: assemblyId, coid: contributionId }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    contributionSoftRemoval: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/softremoval', { aid: assemblyId, coid: contributionId }, {
        'update': { method: 'PUT' }
      });
    },
    publishContribution: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/:status', { aid: assemblyId, coid: contributionId, status: 'PUBLISHED' }, {
        'update': { method: 'PUT' }
      });
    },
    /**
     * sets a new revision for the public etherpad
     */
    publishProposal: function(assemblyId, groupId, proposalId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/proposals/:pid/publish', { aid: assemblyId, pid: proposalId, gid: groupId }, {
        'update': { method: 'PUT' }
      });
    },
    excludeContribution: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/:status', { aid: assemblyId, coid: contributionId, status: 'EXCLUDED' }, {
        'update': { method: 'PUT' }
      });
    },
    contributionAttachment: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/attachment', { aid: assemblyId, coid: contributionId });
    },
    groupContribution: function(assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contribution', { aid: assemblyId, gid: groupId });
    },
    verifyAuthorship: function(user, c) {
      if (user != null && user != undefined && c != null && c != undefined) {
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
      var assemblyId = group.assemblies ? group.assemblies[0] : 0;
      var groupId = group.groupId;
      var status = 'ACCEPTED';
      return WorkingGroups.verifyMembership(assemblyId, groupId, user.userId);
    },
    defaultNewContribution: function() {
      var newC = {
        "title": "",
        "text": "",
        "type": "",
        "location": {
          "placeName": "",
          "city": "",
          "state": ""
        },
        "themesHash": [],
        "workingGroupAuthors": [],
        "themes": [],
        "existingThemes": [],
        "parentThemes": [],
        "hashtags": [],
        "attachments": []
      };
      return newC;
    },
    contributionInResourceSpace: function(spaceId, pageC, pageSizeC) {
      if (pageC && pageSizeC) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution?page=:page&pageSize=:pageSize', { sid: spaceId, page: pageC - 1, pageSize: pageSizeC });
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution', { sid: spaceId });
      }
    },
    contributionInResourceSpaceByUUID: function(spaceUUId, pageC, pageSizeC) {
      if (pageC && pageSizeC) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:uuid/contribution/public?page=:page&pageSize=:pageSize', { uuid: spaceUUId, page: pageC - 1, pageSize: pageSizeC });
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:uuid/contribution/public', { uuid: spaceUUId });
      }
    },
    pinnedContributionInResourceSpace: function(spaceId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution/pinned', { sid: spaceId });
    },
    pinnedContributionInResourceSpaceByUUID: function(spaceUUId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:uuid/contribution/public/pinned', { uuid: spaceUUId });
    },
    /**
     * Returns a $resource to interact with the following endpoints:
     *  - POST  /campaign/:uuid/contribution
     *  - POST  /assembly/:uuid/contribution
     *  - POST  /group/:uuid/contribution
     *
     *  @param {string} endpoint - campaign | assembly | group
     *  @param {string} spaceUUID - space UUID
     *  @returns {object} $resource
     */
    createAnomymousContribution: function(endpoint, spaceUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/:endpoint/:uuid/contribution', { endpoint: endpoint, uuid: spaceUUID });
    },

    contributionsInCampaignComponent: function(assemblyID, campaignID, componentID) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/component/:ciid/contribution', {
        aid: assemblyID,
        cid: campaignID,
        ciid: componentID
      });
    },

    userFeedback: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/feedback', { aid: assemblyId, cid: contributionId }, { 'update': { method: 'PUT' } });
    },

    getContributionComments: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/comment', { aid: assemblyId, cid: contributionId });
    },

    getContributionByUUID: function(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid', { uuid: uuid });
    },

    defaultContributionAttachment: function() {
      var att = {
        name: "",
        resourceType: "",
        url: "",
        showForm: false
      };
      return att;
    },

    newAttachmentObject: function(newAttachment) {
      if (!newAttachment.resourceType) {
        newAttachment.resourceType = "WEBPAGE";
        if (newAttachment.url.endsWith(".jpg") ||
          newAttachment.url.toLowerCase().endsWith(".png") ||
          newAttachment.url.toLowerCase().endsWith(".jpeg") ||
          newAttachment.url.toLowerCase().endsWith(".gif") ||
          newAttachment.url.toLowerCase().endsWith(".tiff")) {
          newAttachment.resourceType = "PICTURE";
        } else if (newAttachment.url.toLowerCase().endsWith(".pdf") ||
          newAttachment.url.toLowerCase().endsWith(".doc") ||
          newAttachment.url.toLowerCase().endsWith(".docx") ||
          newAttachment.url.toLowerCase().endsWith(".xsl") ||
          newAttachment.url.toLowerCase().endsWith(".xslx")) {
          newAttachment.resourceType = "FILE";
        } else if (newAttachment.url.toLowerCase().endsWith(".mp3") ||
          newAttachment.url.toLowerCase().endsWith(".ogg") ||
          newAttachment.url.toLowerCase().endsWith(".acc")) {
          newAttachment.resourceType = "AUDIO";
        } else if (newAttachment.url.toLowerCase().endsWith(".mp4") ||
          newAttachment.url.toLowerCase().endsWith(".mov") ||
          newAttachment.url.toLowerCase().endsWith(".avi")) {
          newAttachment.resourceType = "VIDEO";
        } else {
          newAttachment.resourceType = "WEBPAGE";
        }
      }
      return {
        name: newAttachment.name,
        url: newAttachment.url,
        resourceType: newAttachment.resourceType
      }
    },
    copyAttachmentObject: function(oldAtt, newAtt) {
      oldAtt.name = newAtt.name;
      oldAtt.url = newAtt.url;
      oldAtt.resourceType = newAtt.resourceType;
      oldAtt.showForm = newAtt.showForm;
    },
    copyContributionObject: function(oldC, newC) {
      if (newC.contributionId) {
        oldC.contributionId = newC.contributionId;
      } else {
        delete oldC.contributionId;
      }
      oldC.title = newC.title;
      oldC.text = newC.text;
      oldC.type = newC.type;
      oldC.location = newC.location;
      oldC.themesHash = newC.themesHash;
      oldC.themes = newC.themes;
      oldC.hashtags = newC.hashtags;
      oldC.attachments = newC.attachments;
    },

    /**
     * Calculates informal score of the given contribution.
     *
     * @param {object} contribution
     * @returns {Number}
     */
    getInformalScore: function(contribution) {
      var stats = contribution.stats;
      var score = 0;

      if (stats) {
        score = stats.ups - stats.downs;
      } else if (contribution.popularity != null) {
        score = contribution.popularity;
      }
      return score;
    },

    contributionHistory: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/history', { aid: assemblyId, cid: contributionId });
    },

    /**
     * Soft deletes a contribution.
     *
     * @param {number} aid - assembly ID.
     * @param {object} contribution - Contribution to delete, it should have the property moderationComment.
     * @returns {object} Promise
     */
    moderate: function(aid, contribution) {
      var url = getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/moderate';
      var action = $resource(url, { aid: aid, coid: contribution.contributionId }, {
        moderate: { method: 'PUT' }
      });
      return action.moderate(contribution).$promise;
    },

    /**
     * Retrieves the contribution history by its UUID.
     * 
     * @param {string} uuid - Contribution's UUID.
     */
    contributionHistoryByUUID: function(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/history', { uuid: uuid }).query().$promise;
    },
  };
});

appCivistApp.factory('WorkingGroups', function($resource, $translate, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    workingGroup: function(assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid', { aid: assemblyId, gid: groupId });
    },
    workingGroupInCampaign: function(assemblyId, campaignId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/group/:gid', { aid: assemblyId, cid: campaignId, gid: groupId });
    },
    workingGroups: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group', { aid: assemblyId }, { 'update': { method: 'PUT' }, 'delete': { method: 'DELETE' } });
    },
    workingGroupsInCampaign: function(assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/group', { aid: assemblyId, cid: campaignId });
    },
    workingGroupMembers: function(assemblyId, groupId, stat) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/membership/:status', {
        aid: assemblyId,
        gid: groupId,
        status: stat
      });
    },
    workingGroupProposals: function(assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/proposals', {
        aid: assemblyId,
        gid: groupId
      });
    },
    workingGroupContributions: function(assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contributions', {
        aid: assemblyId,
        gid: groupId
      });
    },
    verifyMembership: function(assemblyId, groupId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/user/:uid', {
        aid: assemblyId,
        gid: groupId,
        uid: userId
      });
    },
    workingGroupPublicProfile: function(assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/public', { aid: assemblyId, gid: groupId });
    },
    defaultNewWorkingGroup: function() {
      var newWGroup = {
        //"name": "Assemblée Belleville",
        //"text": "This assembly organizes citizens of Belleville, to come up with interesting and feasible proposals to be voted on and later implemented during the PB process of 2015",
        "listed": true, // TODO: ADD TO FORM
        "profile": {
          "targetAudience": "RESIDENTS",
          "membership": "REGISTRATION",
          "registration": {
            "invitation": true,
            "request": true
          },
          "moderators": "two",
          "coordinators": "two",
          "icon": "https://appcivist.littlemacondo.com/public/images/barefootdoctor-140.png"
        },
        //"location": {
        //	"placeName": "Belleville, Paris, France"
        //},
        "themes": [],
        "existingThemes": [],
        "existingContributions": [],
        //"config" : {
        //    "majority":"66%",
        //    "blocking":false
        //},
        //"configs": [
        //    {
        //        "key": "group.consensus.majority",
        //        "value": "66%"
        //    },
        //    {
        //        "key": "group.consensus.blocking",
        //        "value": "false"
        //    }
        //],
        "lang": "en", // TODO: ADD TO FORM
        "invitationEmail": "",
        "invitations": [], // { "email": "abc1@example.com", "moderator": true, "coordinator": false }, ... ],
        "majorityThreshold": "simple",
        "blockMajority": false
      };

      var invitationEmail = $translate('wgroup.invitation.email.text', { group: "[Group's Name]" }).then(
        function(text) {
          newWGroup.invitationEmail = text;
        }
      );

      return newWGroup;
    },

    workingGroupByUUID: function(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/group/:uuid', { uuid: uuid });
    }
  };
});

appCivistApp.factory('Etherpad', function($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  var etherpadServer = localStorageService.get("etherpadServer");
  return {
    embedUrl: function(id, revision) {
      var url = etherpadServer + "p/" + id;
      if (revision !== undefined) {
        url += '/timeslider#' + revision;
      }
      url += '?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false';
      return url;
    },
    getReadWriteUrl: function(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/padid', {
        aid: assemblyId,
        cid: contributionId
      });
    },
    getEtherpadReadOnlyUrl: function(readOnlyPadId, revision) {
      var url = localStorageService.get("etherpadServer") + "p/" + readOnlyPadId;
      if (revision !== undefined) {
        url += 'timeslider#' + revision;
      }
      return url + "?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false";
    }
  };
});

appCivistApp.factory('Space', ['$resource', 'localStorageService', 'Contributions', 'Notify',
  function($resource, localStorageService, Contributions, Notify) {
    return {
      getSpace: function(spaceId) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid', { sid: spaceId });
      },

      getSpaceByUUID: function(spaceUUID) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:uuid/public', { uuid: spaceUUID });
      },

      /**
       * Get contributions from server.
       *
       * @param {object} target -  target must have rsID (resource space ID) or rsUUID (resource space UUID)
       * @param {string} type - forum_post | comment | idea | question | issue |  proposal | note
       * @param {boolean} isAnonymous
       * @param {object} filters - filters to apply
       * @return {object} promise
       **/
      getContributions: function(target, type, isAnonymous, filters) {
        // Get list of contributions from server
        var rsp;
        var query = filters || {};
        query.type = type;
        query.pageSize = 16;
        if (isAnonymous) {
          if (type === 'DISCUSSION') {
            rsp = Contributions.contributionInResourceSpaceByUUID(target.frsUUID).get(query);
          } else {
            rsp = Contributions.contributionInResourceSpaceByUUID(target.rsUUID).get(query);
          }
        } else {
          rsp = Contributions.contributionInResourceSpace(target.rsID).get(query);
        }
        rsp.$promise.then(
          function(data) {
            return data;
          },
          function(error) {
            Notify.show('Error loading contributions from server', 'error');
          }
        );
        return rsp.$promise;
      },

      getPinnedContributions: function(target, type, isAnonymous) {
        // Get list of contributions from server
        var rsp;
        var query = {};
        query.type = type;
        if (isAnonymous) {
          rsp = Contributions.pinnedContributionInResourceSpaceByUUID(target.rsUUID).query(query);
        } else {
          rsp = Contributions.pinnedContributionInResourceSpace(target.rsID).query(query);
        }
        rsp.$promise.then(
          function(data) {
            return data;
          },
          function(error) {
            Notify.show('Error loading contributions from server', 'error');
          }
        );
        return rsp.$promise;
      },
      /**
       * Basic search handler.
       *
       *  @param {object} target -  campaign | working group.
       *  @param {boolean} isAnonymous
       *  @param {object} filters - filters definition
       */
      doSearch: function(target, isAnonymous, filters) {
        if (!target || !filters) {
          return;
        }
        var type = filters.mode;
        var params = {
          by_text: filters.searchText
        };

        if (target) {
          params.sorting = filters.sorting;
          params.themes = _.flatMap(filters.themes, function(e) {
            return e.themeId;
          });
          params.groups = _.flatMap(filters.groups, function(e) {
            return e.groupId;
          });
          return this.getContributions(target, type, isAnonymous, params);
        }
      }
    };
  }
]);

appCivistApp.factory('Components', function($resource, $sce, localStorageService, $translate, $filter, moment) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);

  return {
    defaultProposalComponents: function() {
      // Options Dictionary
      var optionsDict = {};

      optionsDict['component.deliberation.who-deliberates'] = [{
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
      optionsDict['component.deliberation.who-deliberates.jury'] = [{
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
      optionsDict['component.voting.system'] = [{
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
      optionsDict['component.voting.system.plurality.type'] = [{
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
      optionsDict['component.voting.system.winners'] = [{
          name: "Fixed regardless of budget",
          value: "FIXED",
          selected: true
        },
        {
          name: "component.voting.system.winners.DYNAMIC1",
          value: "DYNAMIC1",
          selected: false
        },
        {
          name: "component.voting.system.winners.DYNAMIC2",
          value: "DYNAMIC2",
          selected: false
        }
      ];

      // Config Dictionary
      var configDict = {};
      configDict['Proposalmaking'] = [{
          key: "component.proposalmaking.enable.proposal.merge-split",
          description: "Proposalmaking.component.proposalmaking.enable.proposal.merge-split",
          type: "checkbox",
          tooltipKey: "versioningMergeSplitTooltip",
          value: false
        },
        {
          key: "component.proposalmaking.enable.working-groups.comments.external",
          description: "Enable comments in proposals by members of non-authoring Working Groups",
          type: "checkbox",
          tooltipKey: "versioningCommentsByExtGroupsTooltip",
          value: true
        }
      ];
      configDict['Deliberation'] = [{
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
      configDict['Voting'] = [{
          position: -1,
          key: "component.voting.ballot.password.title",
          description: "Choose a Password for the Ballot",
          type: "title"
        },
        {
          position: 0,
          key: "component.voting.ballot.password",
          description: "Ballot Password",
          type: "input",
          inputType: "text",
          value: "123456"
        },
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

      var proposalMaking = {
        position: 1,
        timeline: 1,
        name: 'Proposal making',
        title: 'Proposal making',
        key: "Proposalmaking",
        enabled: true,
        active: true,
        linked: false,
        configs: configDict['Proposalmaking'],
        template: "/app/partials/campaign/creation/components/proposal.html",
        descriptionTemplate: "/app/partials/campaign/creation/components/proposalDescription.html",
        // TODO: transform the contribution template into just another config
        contributionTemplate: [{
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
        definition: {
          componentDefId: 1,
          key: "Proposalmaking"
        },
        milestones: []
      };
      var deliberation = {
        position: 2,
        timeline: 1,
        name: 'Deliberation',
        title: 'Deliberation',
        key: "Deliberation",
        enabled: true,
        active: true,
        linked: false,
        state: "",
        configs: configDict['Deliberation'],
        template: "/app/partials/campaign/creation/components/deliberation.html",
        descriptionTemplate: "/app/partials/campaign/creation/components/deliberationDescription.html",
        definition: {
          componentDefId: 2,
          key: "Deliberation"
        },
        milestones: []
      };
      var voting = {
        position: 3,
        timeline: 1,
        name: 'Voting',
        title: 'Voting',
        key: "Voting",
        enabled: true,
        active: true,
        linked: false,
        state: "",
        configs: configDict['Voting'],
        template: "/app/partials/campaign/creation/components/voting.html",
        descriptionTemplate: "/app/partials/campaign/creation/components/votingDescription.html",
        definition: {
          componentDefId: 3,
          key: "Voting"
        },
        milestones: []
      };
      var implementation = {
        position: 4,
        timeline: 1,
        name: 'Implementation',
        title: 'Implementation',
        key: "Implementation",
        enabled: true,
        active: true,
        state: "",
        linked: false,
        configs: configDict['Implementation'],
        template: "/app/partials/campaign/creation/components/implementation.html",
        descriptionTemplate: "/app/partials/campaign/creation/components/implementationDescription.html",
        definition: {
          componentDefId: 4,
          key: "Implementation"
        },
        milestones: []
      };

      var linkedDeliberation = {
        position: 5,
        timeline: 1,
        name: 'Deliberation',
        title: 'Deliberation',
        key: "DeliberationLinked",
        enabled: false,
        active: false,
        linked: true,
        state: "",
        definition: {
          componentDefId: 2,
          key: "Deliberation"
        },
        milestones: []
      };
      var linkedVoting = {
        position: 6,
        timeline: 1,
        name: 'Voting',
        title: 'Voting',
        key: "VotingLinked",
        enabled: false,
        active: false,
        linked: true,
        state: "",
        definition: {
          componentDefId: 3,
          key: "Voting"
        },
        milestones: []
      };
      var linkedImplementation = {
        position: 7,
        timeline: 1,
        name: 'Implementation',
        title: 'Implementation',
        key: "Implementation",
        enabled: false,
        active: false,
        linked: true,
        state: "",
        configs: configDict['Implementation'],
        template: "/app/partials/campaign/creation/components/implementation.html",
        descriptionTemplate: "/app/partials/campaign/creation/components/implementationDescription.html",
        definition: {
          componentDefId: 4,
          key: "Implementation"
        },
        milestones: []
      };

      var componentList = [
        proposalMaking, deliberation, voting,
        linkedDeliberation, linkedVoting, linkedImplementation,
        implementation
      ];

      return componentList;
    },
    defaultSupportingComponents: function() {
      return [
        { name: 'Working Groups', alias: 'workingGroups' },
        { name: 'Visualization', alias: 'visualization' },
        { name: 'Mapping', alias: 'mapping' },
        { name: 'Mobilization', alias: 'mobilization' },
        { name: 'Reporting', alias: 'reporting' },
        { name: 'Implementation', alias: 'implementation' }
      ];
    },
    defaultProposalComponentMilestones: function() {
      return [{
          date: moment().local().toDate(),
          value: 1,
          title: "Proposal Making start date",
          description: "Begin brainstorming, creating working groups and proposals.",
          component: "Proposal Making",
          componentKey: "Proposalmaking",
          key: "start_proposalmaking",
          symbol: $sce.trustAsHtml("0"),
          opened: true,
          componentIndex: 0,
          position: 0,
          mainContributionType: "BRAINSTORMING",
          type: "START"
        },
        {
          date: moment().local().add(7, 'days').toDate(),
          value: 10,
          title: "Brainstorming end date",
          description: "Until this date, assembly members can identify problems and make suggestions for proposals.",
          component: "Proposal Making",
          componentKey: "Proposalmaking",
          key: "end_brainstorming",
          symbol: $sce.trustAsHtml("1"),
          opened: true,
          componentIndex: 0,
          position: 1,
          mainContributionType: "BRAINSTORMING",
          type: "END"
        },
        {
          date: moment().local().add(15, 'days').toDate(),
          value: 15,
          title: "Working Groups formation end date",
          description: "Until this date, assembly members can join or create a working group to develop proposals.",
          component: "Proposal Making",
          componentKey: "Proposalmaking",
          key: "end_wgroups_creation",
          symbol: $sce.trustAsHtml("2"),
          opened: true,
          componentIndex: 0,
          position: 2,
          mainContributionType: "BRAINSTORMING",
          type: "END"
        },
        {
          date: moment().local().add(15, 'days').toDate(),
          value: 30,
          title: "Proposal submission and editing due date",
          description: "Until this date, assembly members can start and develop proposals in working groups.",
          component: "Proposal Making",
          componentKey: "Proposalmaking",
          key: "end_proposals",
          symbol: $sce.trustAsHtml("3"),
          opened: true,
          componentIndex: 0,
          position: 3,
          mainContributionType: "PROPOSAL",
          type: "END"
        },
        {
          date: moment().local().add(21, 'days').toDate(),
          value: 45,
          title: "Proposals selection due date (within Working Groups)",
          description: "Until this date, working groups can select what proposals they want to put forward to the Assembly for deliberation and voting.",
          component: "Proposal Making",
          componentKey: "Proposalmaking",
          key: "end_internal_selection",
          symbol: $sce.trustAsHtml("4"),
          opened: true,
          componentIndex: 0,
          position: 4,
          mainContributionType: "PROPOSAL",
          type: "END"
        },
        {
          date: moment().local().add(21, 'days').toDate(),
          value: 60,
          title: "Proposal discussions closing date",
          description: "Until this date, assembly members can explore and discuss published proposals for deliberation.",
          component: "Deliberation",
          componentKey: "Deliberation",
          key: "end_discussion",
          symbol: $sce.trustAsHtml("5"),
          opened: true,
          componentIndex: 1,
          position: 5,
          mainContributionType: "PROPOSAL",
          type: "END"
        },
        {
          date: moment().local().add(21, 'days').toDate(),
          value: 90,
          title: "Technical assessments due date",
          description: "defaultProposalComponentMilestones.endAssessment.text1",
          component: "Deliberation",
          componentKey: "Deliberation",
          key: "end_assessment",
          symbol: $sce.trustAsHtml("6"),
          opened: true,
          componentIndex: 1,
          position: 6,
          mainContributionType: "PROPOSAL",
          startWithPrevious: true,
          type: "END"
        },
        {
          date: moment().local().add(22, 'days').toDate(),
          value: 120,
          title: "Voting period start date",
          description: "defaultProposalComponentMilestones.endAssessment.text2",
          component: "Voting",
          componentKey: "Voting",
          key: "start_voting",
          symbol: $sce.trustAsHtml("7"),
          opened: true,
          componentIndex: 2,
          position: 7,
          mainContributionType: "PROPOSAL",
          startWithPrevious: true,
          type: "START"
        },
        {
          date: moment().local().add(30, 'days').toDate(),
          value: 130,
          title: "Voting period end date",
          description: "defaultProposalComponentMilestones.endAssessment.text3",
          component: "Voting",
          componentKey: "Voting",
          key: "end_voting",
          symbol: $sce.trustAsHtml("8"),
          opened: true,
          componentIndex: 2,
          position: 8,
          mainContributionType: "PROPOSAL",
          type: "END"
        },
        {
          date: moment().local().add(31, 'days').toDate(),
          value: 250,
          title: "Implementation start date",
          description: "defaultProposalComponentMilestones.endAssessment.text4",
          component: "Implementation",
          componentKey: "Implementation",
          key: "start_implementation",
          symbol: $sce.trustAsHtml("8"),
          opened: true,
          componentIndex: 6,
          position: 9,
          mainContributionType: "PROPOSAL",
          type: "START"
        }
      ];
    }
  };
});

appCivistApp.factory('AppCivistAuth', function($resource, localStorageService) {
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

appCivistApp.factory('FileUploader', function($resource, localStorageService, Upload, $timeout) {
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
          data: { file: file }
        });

        file.upload.then(function(response) {
          $timeout(function() {
            file.result = response.data;
            resource.name = response.data.name;
            resource.url = response.data.url;
          });
        }, function(response) {
          if (response.status > 0)
            file.errorMsg = response.status + ': ' + response.data;
        }, function(evt) {
          file.progress = Math.min(100, parseInt(100.0 *
            evt.loaded / evt.total));
          console.log('progress: ' + file.progress + '% ');
        });
      }
    }

  };
});

appCivistApp.factory('Invitations', function($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    assemblyInvitation: function(assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/assembly/:aid', { aid: assemblyId });
    },
    groupInvitation: function(groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/group/:gid', { gid: groupId });
    },
    invitations: function(target, status) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:t/:s', { t: target, s: status });
    },
    invitation: function(token) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:t', { t: token }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    invitationResponse: function(token, response) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:t/:r', { t: token, r: response }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    defaultInvitation: function(target, type, defaultEmail) {
      var newInvitation = {
        email: "",
        moderator: true,
        coordinator: true,
        targetId: target,
        targetType: type,
        invitationEmail: defaultEmail
      }
      return newInvitation;
    }
  }
});

appCivistApp.factory('BallotCampaign', function($http, $resource, localStorageService) {
  var url = getServerBaseUrl(localStorageService);
  return $resource(
    url + '/ballot/:uuid/campaign', { "uuid": "@id" }
  );
});

appCivistApp.factory('ContributionDirectiveBroadcast', function($rootScope) {
  var contributionDirective = {};
  contributionDirective.CONTRIBUTION_CREATED = 'contributionCreated';
  contributionDirective.CONTRIBUTION_UPDATED = 'contributionUpdated';
  contributionDirective.CONTRIBUTION_DELETED = 'contributionDeleted';
  contributionDirective.PROPOSAL_CREATED = 'proposalCreated';
  contributionDirective.CONTRIBUTION_CREATE_ERROR = 'contributionCreateError';
  contributionDirective.CONTRIBUTION_UPDATE_ERROR = 'contributionUpdateError';
  contributionDirective.CONTRIBUTION_DELETE_ERROR = 'contributionDeleteError';
  contributionDirective.prepForUpdateContributions = function(msg) {
    var message = msg ? msg : contributionDirective.CONTRIBUTION_UPDATED;
    this.broadcastUpdateContributions(message);
  };

  contributionDirective.broadcastUpdateContributions = function(msg) {
    $rootScope.$broadcast(msg);
  };

  return contributionDirective;
});


appCivistApp.factory('Captcha', ['$resource', 'localStorageService',
  function($resource, localStorageService) {
    var url = getServerBaseUrl(localStorageService);

    return {
      /**
       * Method that validate user's response.
       *
       * @param {string} toValidate - recaptcha hashed response
       */
      verify: function(toValidate) {
        return $resource(url + '/site/verify', { k: toValidate }).save().$promise;
      }
    }
  }
]);