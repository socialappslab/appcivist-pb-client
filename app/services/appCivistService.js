/**
 * Reads AppCivist API Base URL from local storage and returns it
 * If the base url is not yet stored in the local storage, saves it.
 *
 * @param {Object} localStorageService
 * @returns {string} serverBaseUrl
 */
function getServerBaseUrl(localStorageService) {
  var serverBaseUrl = localStorageService.get('serverBaseUrl');
  if (serverBaseUrl === undefined || serverBaseUrl === null) {
    serverBaseUrl = appCivistCoreBaseURL;
    if (serverBaseUrl) localStorageService.set("serverBaseUrl", appCivistCoreBaseURL);
    console.log("Setting API Server in appCivistService to: " + appCivistCoreBaseURL);
  }
  return serverBaseUrl;
}

/**
 * Assemblies factory.
 *
 * @class Assemblies
 * @memberof services
 */
appCivistApp.factory('Assemblies', function ($resource, localStorageService, $injector) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);

  return {
    /**
     * Returns an $resource to interact with /assembly endpoint.
     *
     * @method services.Assemblies#assemblies
     *
     * @returns {object} - [$resource]{@link https://code.angularjs.org/1.5.11/docs/api/ngResource/service/$resource}
     */
    assemblies: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly');
    },

    /**
     * Returns an $resource to interact with /assembly endpoint.
     *
     * @method services.Assemblies#id
     *
     * @returns {object} - [$resource]{@link https://code.angularjs.org/1.5.11/docs/api/ngResource/service/$resource}
     */
    id: function (aid, type, uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/id', {aid: aid, type: type, uuid: uuid});
    },

    /**
     * Returns an $resource to interact with /assembly/:aid endpoint.
     *
     * @method services.Assemblies#assembly
     *
     * @returns {object} - [$resource]{@link https://code.angularjs.org/1.5.11/docs/api/ngResource/service/$resource}
     */
    assembly: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid', { aid: assemblyId }, { 'update': { method: 'PUT' } });
    },
    uploadMembers: function (assemblyId, send, payload) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/member?send_invitations=:send', {
        aid: assemblyId,
        send: send
      }).save(payload).$promise;
    },
    assemblyInAssembly: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/assembly', { aid: assemblyId }, { 'update': { method: 'PUT' } });
    },
    assemblyByShortName: function (shortName) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/assembly/name/:shortname', { shortname: shortName });
    },
    assemblyPublicProfile: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/public', { aid: assemblyId });
    },
    assembliesWithoutLogin: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/listed');
    },
    assembliesByQuery: function (q) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly', { query: q });
    },
    assemblyMembers: function (assemblyId, ldap = false, query = '') {
      var ldap = ldap || false;
      var query = query || '';
      if (ldap) {
        if (query == '') {
          return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/membership/ALL?ldap=true', { aid: assemblyId });
        } else {
          return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/membership/ALL?ldap=true&ldapsearch=:query', { aid: assemblyId, query: query });
        }
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/membership/ALL', { aid: assemblyId });
      }
    },
    linkedAssemblies: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/linked', { aid: assemblyId });
    },
    featuredAssemblies: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly', { filter: "featured" });
    },
    verifyMembership: function (assemblyId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/user/:uid', {
        aid: assemblyId,
        uid: userId
      });
    },
    defaultNewAssembly: function () {
      return {
        "listed": true, // TODO: ADD TO FORM
        "profile": {
          "targetAudience": "RESIDENTS",
          "membership": "REGISTRATION",
          "registration": {
            "invitation": true,
            "request": true
          },
          "moderators": false,
          "coordinators": false,
          "icon": "https://pb.appcivist.org/public/images/barefootdoctor-140.png",
          "primaryContactName": "",
          "primaryContactPhone": "",
          "primaryContactEmail": ""
        },
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
        "invitations": [],
        "linkedAssemblies": []
      };
    },

    assemblyByUUID(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/assembly/:uuid', { uuid });
    },

    /**
     * Updates current assembly information based on the given assembly:
     *   - updates assemblyMembershipsHash
     *   - updates myWorkingGroups
     *   - updates groupMembershipsHash
     *   - updates ongoingCampaigns
     *   - updates currentAssembly
     *
     * If a domain is specified, then pick that for currentAssembly. Otherwise the first
     * element of available assemblies will be picked it up.
     *
     * @param {number} newAssemblyId - The ID of the assembly we want to set as currentAssembly
     */
    setCurrentAssembly: function (newAssemblyId) {
      const Notify = $injector.get('Notify');
      var rsp = this.assembly(newAssemblyId).get().$promise;
      return rsp.then(assemblyLoaded, serverError);

      // 1) set currentAssembly, load ongoing campaigns and load membership information.
      function assemblyLoaded(assembly) {
        localStorageService.set('currentAssembly', assembly);
        return fetchOngoingCampaigns(assembly);
      }

      // 2) load ongoing campaigns list.
      function fetchOngoingCampaigns(assembly) {
        var Campaigns = $injector.get('Campaigns');
        var user = localStorageService.get('user');
        var assembly = localStorageService.get('currentAssembly');
        var rsp = Campaigns.campaigns(user.uuid, 'ongoing', assembly.assemblyId).query().$promise;

        return rsp.then(
          function (ongoingCampaigns) {

            if (ongoingCampaigns) {
              ongoingCampaigns = ongoingCampaigns.filter(function (campaign) {
                return campaign.assemblies[0] === newAssemblyId;
              });
            }
            localStorageService.set('ongoingCampaigns', ongoingCampaigns);
            return fetchMembershipInformation(user);
          },
          function () {
            Notify.show('Error while trying to get ongoing campaigns from server', 'error');
          }
        )
      }

      // 3) fetch membership information
      function fetchMembershipInformation(user) {
        var Memberships = $injector.get('Memberships');
        var rsp = Memberships.memberships(user.userId).query().$promise;
        return rsp.then(memberSuccess, serverError);
      }

      // 4) process user memberships, working groups and assemblies information.
      function memberSuccess(data) {
        var $filter = $injector.get('$filter');
        var membershipsInGroups = $filter('filter')(data, { status: 'ACCEPTED', membershipType: 'GROUP' });
        var membershipsInAssemblies = $filter('filter')(data, { status: 'ACCEPTED', membershipType: 'ASSEMBLY' });
        var groupMembershipsHash = {};
        var assemblyMembershipsHash = {};

        var myWorkingGroups = membershipsInGroups.map(function (membership) {
          groupMembershipsHash[membership.workingGroup.groupId] = membership.roles;
          return membership.workingGroup;
        });

        var myAssemblies = membershipsInAssemblies.map(function (membership) {
          assemblyMembershipsHash[membership.assembly.assemblyId] = membership.roles;
          return membership.assembly;
        });
        localStorageService.set('myWorkingGroups', myWorkingGroups);
        localStorageService.set('assemblies', myAssemblies);
        localStorageService.set('groupMembershipsHash', groupMembershipsHash);
        localStorageService.set('assemblyMembershipsHash', assemblyMembershipsHash);
        localStorageService.set('membershipsInGroups', membershipsInGroups);
        localStorageService.set('membershipsInAssemblies', membershipsInAssemblies);
        return data;
      }


      function serverError(error) {
        Notify.show('Error while trying to communicate with the server', 'error');
      }
    }
  };
});

appCivistApp.factory('Campaigns', function ($resource, $sce, localStorageService, Notify) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    campaigns: function (userUUID, state, aid) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:uuid/campaign', { uuid: userUUID, filter: state, assembly: aid });
    },
    campaign: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid', { aid: assemblyId, cid: campaignId }, { 'update': { method: 'PUT' } });
    },
    campaignsInAssembly: function (assemblyId, f) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign?filter=:filter',
        { aid: assemblyId, filter: f ? f : 'all' });
    },
    campaignsInAssemblyByUUID: function (u, f) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/assembly/:uuid/campaign?filter=:filter',
        { uuid: u, filter: f ? f : 'all' });
    },
    campaignByUUID: function (campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/' + campaignUUID);
    },
    newCampaign: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign', {
        aid: assemblyId
      });
    },
    templates: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/campaign/template');
    },
    defaultNewCampaign: function () {
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
    getCurrentComponent: function (components) {
      var current;
      var startComponent = components[0];
      var campaignStartDate = moment(startComponent.startDate, 'YYYY-MM-DD HH:mm').local();
      var campaignEndDate = moment(startComponent.endDate, 'YYYY-MM-DD HH:mm').local();
      campaignStartDate.hour(0);
      campaignStartDate.minute(0);
      campaignEndDate.hour(0);
      campaignEndDate.minute(0);
      if (moment().local().isBefore(campaignStartDate) || moment().local().isBetween(campaignStartDate, campaignEndDate)) {
        current = startComponent;
      }

      // TODO: iterate starting in second
      if (!current) {
        angular.forEach(components, function (c) {
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
          var endComponent = components[components.length - 1];
          current = endComponent;
        }
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
    resources: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/resources', { aid: assemblyId, cid: campaignId });
    },
    publicResources: function (campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:cuuid/resources', { cuuid: campaignUUID });
    },
    timeline: function (assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

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
        function (data) {
          return data;
        },
        function (error) {
          Notify.show('Error loading campaign timeline: '+ error.statusMessage ? error.statusMessage : '', 'error');
        }
      );
      return rsp.$promise;

    },
    timelineByCampaignId: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/timeline', { aid: assemblyId, cid: campaignId });
    },
    timelineByCampaignUUID: function (campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:uuid/timeline', { uuid: campaignUUID });
    },

    components: function (assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

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
        function (data) {
          return data;
        },
        function (error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
      return rsp.$promise;

    },
    componentsByCampaignId: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/components', { aid: assemblyId, cid: campaignId });
    },
    componentsByCampaignUUID: function (campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:uuid/components', { uuid: campaignUUID });
    },

    themes: function (assemblyId, campaignId, isAnonymous, campaignUUID, filters) {

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
        function (data) {
          return data;
        },
        function (error) {
          Notify.show('Error loading contributions from server', 'error');
        }
      );
      return rsp.$promise;

    },
    themesByCampaignId: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/themes', { aid: assemblyId, cid: campaignId });
    },
    themesByCampaignUUID: function (campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:uuid/themes', { uuid: campaignUUID });
    },
    getConfiguration: function (spaceId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/config', { sid: spaceId });
    },
    getConfigurationPublic: function (spaceUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/config', { uuid: spaceUUID });
    },
    isContributionTypeSupported: function (type, scope) {
      var campaignConfigs = scope.campaignConfigs ? scope.campaignConfigs['appcivist.campaign.contribution-types'] : null;
      if (campaignConfigs) {
        return campaignConfigs.includes(type);
      } else {
        return true; // if the configuration is not defined, all contribution types are supported
      }
    },
    showAssemblyLogo: function (scope) {
      var showAssemblyLogo = scope.campaignConfigs ? scope.campaignConfigs['appcivist.campaign.show-assembly-logo'] : false;
      return showAssemblyLogo;
    },
    getPublicBriefByCampaignUUID: function(campaignUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:uuid/brief', { uuid: campaignUUID });
    },
    consent: function(assemblyId, campaignId, userId = null, answer = null) {
      let baseUrl = '/assembly/:aid/campaign/:cid/consent';
      if (userId == null && answer == null) {
        return $resource(getServerBaseUrl(localStorageService) + baseUrl, { aid: assemblyId, cid: campaignId })
      } else {
        return $resource(getServerBaseUrl(localStorageService) + baseUrl + '/user/:uid/:answer', { aid: assemblyId, cid: campaignId, uid: userId, answer: answer }, {
          'update': { method: 'PUT' }
        })
      }
    }
  };

});

appCivistApp.factory('Memberships', function ($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    membership: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/membership', {}, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    membershipRequest: function (targetCollection, targetId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/:target/:id/request', {
        target: targetCollection,
        id: targetId
      });
    },
    memberships: function (userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId });
    },
    membershipsUnderAssembly: function (userId, assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid?by_assembly=:aid',
        { uid: userId, aid: assemblyId });
    },
    membershipConfigs: function (userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid/config', { uid: userId });
    },
    assemblies: function (userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId, type: 'assembly' });
    },
    workingGroups: function (userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/user/:uid', { uid: userId, type: 'group' });
    },
    membershipInAssembly: function (assemblyId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/assembly/:aid/user/:uid', { aid: assemblyId, uid: userId });
    },
    membershipInGroup: function (groupId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/group/:gid/user/:uid', { gid: groupId, uid: userId });
    },
    updateStatus: function (membershipId, newStatus) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/:mid/:status', { mid: membershipId, status: newStatus }, {
        'update': { method: 'PUT' }
      });
    },
    reSendInvitation: function (invitationId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:iid/email', { iid: invitationId });
    },

    hasRol: function (rols, rolName) {
      if (!rols) {
        return false;
      }
      var rol;

      for (var i = 0; i < rols.length; i++) {
        rol = rols[i];

        if (rol.name === rolName) {
          return true;
        }
      }
      return false;
    },

    assemblyRols: function (aid) {
      var assemblyMembershipsHash = localStorageService.get('assemblyMembershipsHash');
      return assemblyMembershipsHash ? assemblyMembershipsHash[aid] : null;
    },

    groupRols: function (gid) {
      var groupMembershipsHash = localStorageService.get('groupMembershipsHash');
      return groupMembershipsHash ? groupMembershipsHash[gid] : null;
    },

    /**
     * Checks if current user has the given rol.
     *
     * @param {string} target - assembly | group
     * @param {number} id - target ID
     * @param {string} rol - the rol to check
     */
    rolIn: function (target, id, rol) {
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
    isAssemblyCoordinator: function (aid) {
      return this.rolIn('assembly', aid, 'COORDINATOR');
    },

    /**
     * Check if current user is coordinator of the given working group.
     *
     * @param {number} wgid - Working Group ID.
     */
    isWorkingGroupCoordinator: function (wgid) {
      return this.rolIn('group', wgid, 'COORDINATOR');
    },

    /**
     * Check if current user is member of the given assembly.
     *
     * @param {string} target - group | assembly
     * @param {number} id - Assembly ID.
     */
    isMember: function (target, id) {
      return this.rolIn(target, id, 'MEMBER');
    },

    /**
     * Check if current user has the general role ADMIN
     * @returns {boolean}
     */
    userIsAdmin: function () {
      let user = localStorageService.get("user");
      let roles = user ? user.roles : null;
      let adminRole = roles ? roles.filter(r => r.name==="ADMIN") : null;
      return !adminRole || adminRole.length===0 ? false : true;
    }
  };
});

/**
 * Notifications factory.
 *
 * @class Notifications
 * @memberof services
 */
appCivistApp.factory('Notifications', function ($resource, localStorageService) {
  return {
    userNotificationsByUUID(userUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/notification/user/:uuid', { uuid: userUUID });
    },

    subscribe(spaceId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/subscription', {sid: spaceId});
    },

    unsubscribe: function(spaceId, subId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/subscription/:subid', { sid: spaceId, subid: subId }, {
        'delete': { method: 'delete' }
      }).delete().$promise;
    },

    getSubscriptions: function(spaceId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/subscription', { sid: spaceId });
    },

    subscriptionsBySpace(userId, spaceId, subType) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:id/space/:sid/subscription', { id: userId, sid: spaceId, type: subType });
    },

    /**
     * Returns the total number of notifications for the given user.
     *
     * @method services.Notifications#userStats
     * @param {Number} userId - User's ID
     * @returns {$resource}
     */
    userStats(userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:userId/notifications/stats', { userId: userId});
    },

    /**
     * Returns the notifications for the given user.
     *
     * @method services.Notifications#userNotifications
     * @param {Number} userId
     * @param {Number} page
     * @param {Number} pageSize
     * @returns {$resource}
     */
    userNotifications(userId, page, pageSize) {
      let size = pageSize || 5;
      return $resource(getServerBaseUrl(localStorageService) + '/user/:userId/notifications', { userId, page, size });
    },

    /**
     * Marks the given notification as read.
     *
     * @method services.Notifications#read
     * @param {Number} userId
     * @param {Number} notificationId
     */
    read(userId, notificationId) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:userId/notifications/:notificationId/read', { userId, notificationId },
        {
          update: { method: 'PUT' }
        });
    },

    /**
    * Marks all notifications as read.
    *
    * @method services.Notifications#readAll
    * @param {Number} userId
    */
    readAll(userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/:userId/notifications/read', { userId },
        {
          update: { method: 'PUT', isArray: true }
        });
    }
  };

});

/**
 * Contributions factory.
 *
 * @class Contributions
 * @memberof services
 */
appCivistApp.factory('Contributions', function ($resource, localStorageService, WorkingGroups) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    contributions: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/' + assemblyId + '/contribution?space=forum');
    },
    contribution: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid', { aid: assemblyId, coid: contributionId }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    contributionSoftRemoval: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/softremoval', { aid: assemblyId, coid: contributionId }, {
        'update': { method: 'PUT' }
      });
    },
    updateStatus: function (assemblyId, contributionId, status) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/status/:status', { aid: assemblyId, coid: contributionId, status: status }, {
        'update': { method: 'PUT' }
      });
    },
    publishContribution: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/status/:status', { aid: assemblyId, coid: contributionId, status: 'PUBLISHED' }, {
        'update': { method: 'PUT' }
      });
    },
    /**
     * sets a new revision for the public etherpad
     */
    publishProposal: function (assemblyId, groupId, proposalId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/proposals/:pid/publish', { aid: assemblyId, pid: proposalId, gid: groupId }, {
        'update': { method: 'PUT' }
      });
    },
    excludeContribution: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/status/:status', { aid: assemblyId, coid: contributionId, status: 'EXCLUDED' }, {
        'update': { method: 'PUT' }
      });
    },
    contributionAttachment: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/attachment', { aid: assemblyId, coid: contributionId });
    },
    groupContribution: function (assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contribution', { aid: assemblyId, gid: groupId });
    },
    verifyAuthorship: function (user, c) {
      if (user != null && user != undefined && c != null && c != undefined) {
        var authorList = c.authors;
        // Check if author is in authorList (if author list is defined)
        if (authorList != null && authorList != undefined && authorList.length > 0) {
          if (authorList.filter(function (author) { return author.userId === user.userId; }).length > 0) {
            return true;
          } else {
            return false;
          }
        }
      }
    },
    verifyGroupAuthorship: function (user, c, group) {
      var assemblyId = group.assemblies ? group.assemblies[0] : 0;
      var groupId = group.groupId;
      var status = 'ACCEPTED';
      return WorkingGroups.verifyMembership(assemblyId, groupId, user.userId);
    },
    defaultNewContribution: function () {
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
    contributionInResourceSpace: function (spaceId, pageC, pageSizeC) {
      if (pageC && pageSizeC) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution?page=:page&pageSize=:pageSize', { sid: spaceId, page: pageC - 1, pageSize: pageSizeC });
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution', { sid: spaceId });
      }
    },
    flatContributionInResourceSpace: function (spaceId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution/:cid?flat=true', { sid: spaceId, cid: contributionId });
    },
    contributionInResourceSpaceByUUID: function (spaceUUId, pageC, pageSizeC) {
      if (pageC && pageSizeC) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/contribution?page=:page&pageSize=:pageSize', { uuid: spaceUUId, page: pageC - 1, pageSize: pageSizeC });
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/contribution', { uuid: spaceUUId });
      }
    },
    pinnedContributionInResourceSpace: function (spaceId) {
      return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/contribution/pinned', { sid: spaceId });
    },
    pinnedContributionInResourceSpaceByUUID: function (spaceUUId) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/contribution/public', { uuid: spaceUUId });
    },
    contributionInResouceSpaceExport: function (spaceId, contributionId, format, fields, customFields, selectedContributions, includeDoc, docExportFormat, pub) {
      if (contributionId) {
          return $resource(
            getServerBaseUrl(localStorageService) + (pub ? '/public' : '') + '/space/:sid/contribution/:coid',
            {
              sid: spaceId, format: format, fields: fields, customFields: customFields, coid: contributionId, includeDoc: includeDoc,
              docExportFormat: docExportFormat, includedExtendedText: includeDoc, extendedTextFormat: docExportFormat
            },
            {
              'getText': {
                transformResponse: function(data, headersGetter, status) { return { content: data } }
              }
            }
          )
      } else {
        return $resource(
          getServerBaseUrl(localStorageService) + (pub ? '/public' : '') + '/space/:sid/contribution',
          {
            sid: spaceId, format: format, selectedContributions: selectedContributions, fields: fields,
            customFields: customFields, includeDoc: includeDoc, docExportFormat: docExportFormat,
            includedExtendedText: includeDoc, extendedTextFormat: docExportFormat
          },
          {
            'getText': {
              transformResponse: function(data, headersGetter, status) { return { content: data } }
            }
          }
        )
      }
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
    createAnomymousContribution: function (endpoint, spaceUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/:endpoint/:uuid/contribution', { endpoint: endpoint, uuid: spaceUUID });
    },

    contributionsInCampaignComponent: function (assemblyID, campaignID, componentID) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/component/:ciid/contribution', {
        aid: assemblyID,
        cid: campaignID,
        ciid: componentID
      });
    },

    authUserFeedback: function (assemblyId, campaignId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/contribution/:coid/userfeedback',
        { aid: assemblyId, cid: campaignId, coid: contributionId });
    },

    getUserFeedback: function (assemblyId, campaignId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/contribution/:coid/feedback', { aid: assemblyId, cid: campaignId, coid: contributionId });
    },

    userFeedback: function (assemblyId, campaignId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/contribution/:coid/feedback', { aid: assemblyId, cid: campaignId, coid: contributionId }, { 'update': { method: 'PUT' } });
    },

    userFeedbackNoCampaignId: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:coid/feedback', { aid: assemblyId, coid: contributionId });
    },

    userFeedbackAnonymous: function (campaignUUID, contributionUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:cuuid/contribution/:couuid/feedback', { cuuid: campaignUUID, couuid: contributionUUID }, { 'update': { method: 'PUT' } });
    },

    userFeedbackWithGroupId: function (assemblyId, groupId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contribution/:coid/feedback', { aid: assemblyId, gid: groupId, coid: contributionId }, { 'update': { method: 'PUT' } });
    },

    publicFeedbacks: function (contributionUuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/contribution/:couuid/feedback', { couuid: contributionUuid });
    },

    getContributionComments: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/comment', { aid: assemblyId, cid: contributionId });
    },

    getContributionByUUID: function (uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/contribution/:uuid', { uuid: uuid });
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
        resourceType: newAttachment.resourceType,
        title: newAttachment.title || "",
        description: newAttachment.description || "",
        isTemplate: newAttachment.isTemplate || false
      }
    },
    copyAttachmentObject: function (oldAtt, newAtt) {
      oldAtt.name = newAtt.name;
      oldAtt.url = newAtt.url;
      oldAtt.resourceType = newAtt.resourceType;
      oldAtt.showForm = newAtt.showForm;
      oldAtt.title = newAtt.title;
      oldAtt.description = newAtt.description;
    },
    copyContributionObject: function (oldC, newC) {
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
    getInformalScore: function (contribution) {
      var stats = contribution.stats;
      var score = 0;

      if (stats) {
        score = stats.ups - stats.downs;
      } else if (contribution.popularity != null) {
        score = contribution.popularity;
      }
      return score;
    },

    contributionHistory: function (assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/history', { aid: assemblyId, cid: contributionId });
    },

    /**
     * Soft deletes a contribution.
     *
     * @param {number} aid - assembly ID.
     * @param {object} contribution - Contribution to delete, it should have the property moderationComment.
     * @returns {object} Promise
     */
    moderate: function (aid, contribution) {
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
    contributionHistoryByUUID: function (uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/contribution/:uuid/history', { uuid: uuid }).query().$promise;
    },

    /**
     * Adds the given theme to the contribution.
     *
     * @method services.Contributions#addTheme
     * @param {string} uuid - The contribution UUID.
     * @param {Object} theme - The theme to add.
     * @returns {object} - Promise
     */
    addTheme(uuid, theme) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/themes', { uuid: uuid }, {
        save: {
          isArray: true,
          method: 'POST'
        }
      }).save(theme).$promise;
    },

    /**
     * Deletes the given theme from the contribution.
     *
     * @method services.Contributions#deleteTheme
     * @param {string} uuid - The contribution UUID.
     * @param {Object} tid - The theme's ID.
     * @returns {object} - Promise
     */
    deleteTheme(uuid, tid) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/themes/:tid', { uuid, tid }).delete().$promise;
    },

    /**
     * Adds the given author from the contribution.
     *
     * @method services.Contributions#addAuthor
     * @param {string} uuid - The contribution UUID.
     * @param {Object} author - The author to add.
     * @returns {object} - Promise
     */
    addAuthor(uuid, author) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/authors', { uuid: uuid }).save(author).$promise;
    },

    addNonMemberAuthor(uuid, author) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/nonmemberauthors', { uuid: uuid }).save(author).$promise;
    },

    /**
     * Deletes the given author to the contribution.
     *
     * @method services.Contributions#deleteAuthor
     * @param {string} uuid - The contribution UUID.
     * @param {Object} auuid - The author's uuid.
     * @returns {object} - Promise
     */
    deleteAuthor(uuid, auuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/authors/:auuid', { uuid, auuid }).delete().$promise;
    },

    deleteNonMemberAuthor(uuid, nmaid) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:uuid/nonmemberauthors/:nmaid', { uuid, nmaid }).delete().$promise;
    }
  };
});


/**
 * WorkingGroups factory.
 *
 * @description
 *
 * Defines methods for working group related endpoints.
 *
 * @class WorkingGroups
 * @memberof services
 */
appCivistApp.factory('WorkingGroups', function ($resource, $translate, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    workingGroup: function (assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid', { aid: assemblyId, gid: groupId }, { 'update': { method: 'PUT' } });
    },

    workingGroupInCampaign: function (assemblyId, campaignId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/group/:gid', { aid: assemblyId, cid: campaignId, gid: groupId });
    },

    workingGroups: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group', { aid: assemblyId }, { 'update': { method: 'PUT' }, 'delete': { method: 'DELETE' } });
    },

    workingGroupsInCampaign: function (assemblyId, campaignId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/group', { aid: assemblyId, cid: campaignId });
    },

    /**
     * Returns a $resource for the endpoint /public/api/campaign/:uuid/groups
     *
     * @method services.WorkingGroups#workingGroupsInCampaignByUUID
     * @param {string} uuid - The campaign's UUID
     */
    workingGroupsInCampaignByUUID(uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/campaign/:uuid/groups', { uuid });
    },

    workingGroupMembers: function (assemblyId, groupId, stat) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/membership/:status', {
        aid: assemblyId,
        gid: groupId,
        status: stat
      });
    },
    workingGroupProposals: function (assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/proposals', {
        aid: assemblyId,
        gid: groupId
      });
    },
    workingGroupContributions: function (assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/contributions', {
        aid: assemblyId,
        gid: groupId
      });
    },
    verifyMembership: function (assemblyId, groupId, userId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/group/:gid/user/:uid', {
        aid: assemblyId,
        gid: groupId,
        uid: userId
      });
    },
    workingGroupPublicProfile: function (assemblyId, groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/assembly/:aid/group/:gid', { aid: assemblyId, gid: groupId });
    },
    defaultNewWorkingGroup: function () {
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
          "moderators": false,
          "coordinators": false,
          "icon": "https://pb.appcivist.org/public/images/barefootdoctor-140.png"
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
        function (text) {
          newWGroup.invitationEmail = text;
        }
      );

      return newWGroup;
    },

    workingGroupByUUID: function (uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/public/group/:uuid', { uuid: uuid });
    }
  };
});

/**
 * Etherpad factory.
 *
 * @description
 *
 * Defines methods to interact with etherpad.
 *
 * @class Etherdpad
 * @memberof services
 */
appCivistApp.factory('Etherpad', function ($resource, localStorageService, LocaleService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  var etherpadServer = localStorageService.get("etherpadServer");
  const localesMap = {
    'en-US': 'en',
    'de-DE': 'de',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'it-IT': 'it',
    'es': 'es',
    'en': 'en',
    'de': 'de',
    'it': 'it',
    'fr': 'fr'
  };

  return {
    embedUrl(id, revision, resourceUrl, writeEmbed) {
      var url = etherpadServer + "p/" + id;
      if (/p\/r\./.test(resourceUrl)) {
        if (/etherpad\.appcivist\.org/.test(resourceUrl)) {
          resourceUrl = resourceUrl.replace("http://","https://");
        }
        if (writeEmbed) {
          resourceUrl = resourceUrl.split("/p")[0]+"/p/"+id;
        }
        url = resourceUrl;
      }
      if (revision !== undefined && revision !== null) {
        url += '/timeslider#' + revision;
      }
      url += '?showChat=true&showLineNumbers=true&useMonospaceFont=false';
      return url;
    },

    getReadWriteUrl(assemblyId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/padid', {
        aid: assemblyId,
        cid: contributionId
      });
    },

    getEtherpadReadOnlyUrl(readOnlyPadId, revision, resourceUrl) {
      var url = localStorageService.get("etherpadServer") + "p/" + readOnlyPadId;
      if (/p\/r\./.test(resourceUrl)) {
        url = resourceUrl;
      }
      if (revision !== undefined) {
        url += 'timeslider#' + revision;
      }
      return url + "?showControls=false&showChat=true&showLineNumbers=true&useMonospaceFont=false";
    },

    /**
     * Maps the current locale code to the etherpad supported lang code.
     * http://joker-x.github.com/languages4translatewiki/test/
     *
     * @method services.Etherdpad#getLocale
     * @returns {string}
     */
    getLocale() {
      const user = localStorageService.get('user');
      const locale = user && user.language ? user.language : LocaleService.getLocale();
      return localesMap[locale] || 'en';
    },

    getReadOnlyHtml(assemblyId, campaignId, contributionId) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/contribution/:coid/body?format=:format&rev=:rev',
        {
          aid: assemblyId,
          cid: campaignId,
          coid: contributionId,
          format: "HTML",
          rev: 0
        }
      );
    },

    embedDocument(assemblyId, campaignId, contributionId, format, payload) {
      return $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/contribution/:coid/document', {
        aid: assemblyId,
        cid: campaignId,
        coid: contributionId,
        typeDocument: format
      }).save(payload).$promise
    },

    getReadOnlyHtmlPublic(contributionUUID) {
      return $resource(getServerBaseUrl(localStorageService) + '/contribution/:couuid/body?format=:format&rev=:rev',
        {
          couuid: contributionUUID,
          format: "HTML",
          rev: 0
        }
      );
    }

  };
});

/**
 * Defines methods to interact with the spaces endpoint.
 *
 * @class Space
 * @memberof services
 */
appCivistApp.factory('Space', ['$resource', 'localStorageService', 'Contributions', 'Notify', '$http',
  function ($resource, localStorageService, Contributions, Notify, $http) {
    return {
      getSpace: function (spaceId) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid', { sid: spaceId });
      },

      getSpaceByUUID: function (spaceUUID) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:uuid/public', { uuid: spaceUUID });
      },

      /**
       * Get contributions from server.
       *
       * @method services.Space#getContributions
       * @param {object} target -  target must have rsID (resource space ID) or rsUUID (resource space UUID)
       * @param {string} type - forum_post | comment | idea | question | issue |  proposal | note
       * @param {boolean} isAnonymous
       * @param {object} filters - filters to apply
       * @return {object} promise
       **/

      getContributions: function (target, type, isAnonymous, filters) {
        // Get list of contributions from server
        var rsp;
        var query = filters || {};
        query.type = type;
        query.pageSize = query.pageSize ? query.pageSize : 16;
        if (isAnonymous) {
          // if the space is of type working group, then only published contributions are returned
          if (type === 'DISCUSSION') {
            rsp = Contributions.contributionInResourceSpaceByUUID(target.frsUUID).get(query);
          } else {
            rsp = Contributions.contributionInResourceSpaceByUUID(target.rsUUID).get(query);
          }
        } else {
          rsp = Contributions.contributionInResourceSpace(target.rsID).get(query);
        }
        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error loading contributions from server', 'error')
        );
      },

      getCommentCount: function (sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/commentcount', { sid: sid });
      },

      getCommentCountPublic: function (uuid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/commentcount', { uuid: uuid });
      },

      getPinnedContributions: function (target, type, isAnonymous) {
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
          function (data) {
            return data;
          },
          function (error) {
            Notify.show('Error loading contributions from server', 'error');
          }
        );
        return rsp.$promise;
      },

      /**
       * Basic search handler.
       *
       *  @method services.Space#doSearch
       *  @param {object} target -  campaign | working group.
       *  @param {boolean} isAnonymous
       *  @param {object} filters - filters definition
       */
      doSearch: function (target, isAnonymous, filters) {
        if (!target || !filters) {
          return;
        }
        var type = filters.mode;
        var pageNumber = filters.page ? filters.page : null;
        var pageSize = filters.pageSize ? filters.pageSize : null;
        var params = {
          by_text: filters.searchText
        };

        if (pageNumber) {
          params.page = pageNumber;
        }

        if (pageSize) {
          params.pageSize = pageSize;
        }

        if (filters.by_author) {
          params.by_author = filters.by_author;
        }
        params.sorting = filters.sorting;
        params.themes = _.flatMap(filters.themes, function (e) {
          return e.themeId;
        });
        params.groups = _.flatMap(filters.groups, function (e) {
          return e.groupId;
        });

        if (filters.status)
          params.status = filters.status;

        if (type === 'myProposals') {
          type='proposal';
          params.by_author=filters.by_author;
        } else if (type === 'myIdeas') {
          type='idea';
          params.by_author=filters.by_author;
        } else if (type==='idea' || type==='proposal') {
          delete params.by_author;
        } else if (type === 'sharedProposals') {
          type = 'proposal';
          params.by_author = filters.by_author;
          params.excludeCreatedByUser = filters.excludeCreated;
        } else if (type === 'sharedIdeas') {
          type = 'idea';
          params.by_author = filters.by_author;
          params.excludeCreatedByUser = filters.excludeCreated;
        }
        return this.getContributions(target, type, isAnonymous, params);
      },

      /**
       * Returns a $resource to interact with the organizations endpoint.
       *
       * @method services.Space#organizations
       * @param {number} sid - The space id.
       */
      organizations(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/organization', { sid });
      },

      /**
       * Returns a $resource to interact with the public organizations endpoint.
       *
       * @method services.Space#organizationsByUUID
       * @param {number} uuid - The space uuid.
       */
      organizationsByUUID(uuid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/organization', { uuid });
      },

      /**
       * Returns a $resource to interact with the resources endpoint.
       *
       * @method services.Space#resources
       * @param {number} sid - The space id.
       */
      resources(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/resource', { sid }, {
          save: {
            method: 'POST'
          }
        });
      },

      /**
       * Returns a $resource to interact with the resources public endpoint.
       *
       * @method services.Space#resourcesByUUID
       * @param {number} uuid - The space uuid.
       */
      resourcesByUUID(uuid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/resource', { uuid });
      },

      /**
       * Returns a $resource to interact with the configurations endpoint.
       *
       * @method services.Space#configs
       * @param {number} sid - The space id
       */
      configs(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/config', { sid }, {
          update: {
            method: 'PUT',
            isArray: false
          },
          save: {
            method: 'POST',
            isArray: false
          }
        });
      },

      /**
       * Returns a $resource to interact with the configurations public endpoint.
       *
       * @method services.Space#configsByUUID
       * @param {string} uuid - The space uuid
       */
      configsByUUID(uuid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/config', { uuid });
      },

      /**
       * Returns a $resource to interact with the custom fields endpoint.
       *
       * @method services.Space#fields
       * @param {number} sid - The space id
       */
      fields(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/field', { sid });
      },

      /**
       * Returns a $resource to interact with the custom fields endpoint.
       *
       * @method services.Space#fields
       * @param {number} sid - The space id
       */
      fieldsPublic(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/field', { uuid: sid });
      },

      /**
       * Returns a $resource to interact with the custom fields values endpoint.
       *
       * @method services.Space#fieldValue
       * @param {number} sid - The space id
       */
      fieldValue(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/fieldvalue', { sid }, {
          save: {
            method: 'POST'
          }
        });
      },

      /**
       * Returns a $resource to interact with the custom fields values endpoint.
       *
       * @method services.Space#fieldValue
       * @param {number} sid - The space id
       */
      fieldValueResource(sid, cfid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/fieldvalue/:cfid', { sid: sid, cfid: cfid }, {
          update: {
            method: 'PUT'
          },
          delete: {
            method: 'DELETE',
            isArray: true
          }
        });
      },

      /**
       * Returns a $resource to interact with the custom fields values public endpoint.
       *
       * @method services.Space#fieldValue
       * @param {string} uuid - The space UUID
       */
      fieldValuePublic(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/fieldvalue', { uuid: sid }, {
          save: {
            method: 'POST'
          }
        });
      },

      /**
       * Returns a $resource to interact with the custom fields values endpoint.
       *
       * @method services.Space#fieldsValues
       * @param {number} sid - The space id
       */
      fieldsValues(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/fieldvalues', { sid }, {
          update: {
            method: 'PUT',
            isArray: true
          },

          save: {
            method: 'POST',
            isArray: true
          }
        });
      },


      /**
       * Returns a $resource to interact with the custom fields values endpoint.
       *
       * @method services.Space#fieldsValues
       * @param {number} sid - The space id
       */
      fieldsValuesPublic(sid) {
        return $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/fieldvalues', { uuid: sid }, {
          save: {
            method: 'POST',
            isArray: true
          }
        });
      },

      /**
       * Returns a promise to interact with <em>DELETE /space/:sid/resource/:rsid</em> endpoint
       * to delete a resource from a resource space.
       *
       * @method services.Space#deleteResource
       * @param {number} sid - The resource space ID.
       * @param {number} rsid - The resource ID.
       */
      deleteResource(sid, rsid) {
        return $resource(getServerBaseUrl(localStorageService) + '/space/:sid/resource/:rsid', { sid: sid, rsid: rsid },
          { 'delete': { method: 'DELETE' } }).delete().$promise;
      },

      /**
       * Returns a promise to interact with <em>GET /space/:sid/authors?format=CSV</em> endpoint to
       * retrieve non-member authors information associated with the given campaign resource space.
       *
       * @method services.Space#getNonMemberAuthors
       * @param {number} sid - The campaign resource space ID.
       */
      getNonMemberAuthors(sid) {
        return $http({
          url: getServerBaseUrl(localStorageService) + '/space/' + sid + '/authors?format=CSV',
          method: 'get',
          responseType: 'text',
          // so that CSV do not get deserialized using angular.fromJSON
          transformResponse: [],
          headers: {
            'Content-Type': 'text/csv'
          }
        });
      },

      /**
       * Returns a promise to interact with <em>GET /space/:uuid/analytis</em> endpoint to
       * retrieve statistics about a Resource Space
       *
       * @method services.Space#getSpaceBasicAnalytics
       * @param {String} uuid- The campaign resource space UUID.
       */
      getSpaceBasicAnalytics(uuid) {
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/public/space/:uuid/analytics', { uuid: uuid }).get();

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error loading contributions from server', 'error')
        )
      },

      addContributionToResourceSpace(aid, cid, sid, contribution) {
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/space/:sid',
          {aid: aid, cid: cid, sid: sid}).save(contribution);

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error adding contribution to resource space', 'error')
        )
      },
      addThemeToResourceSpace(sid, theme) {
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/space/:sid/theme',
          {sid: sid}).save(theme);

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error adding theme to resource space: '+error.statusMessage ? error.statusMessage : '', 'error')
        )
      },
      addListOfThemesToResourceSpace(sid, themes) {
        /*
        {
          "themes": {...}
        }
        */
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/space/:sid/themes',
          {sid: sid}).save(themes);

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error adding theme to resource space: '+error.statusMessage ? error.statusMessage : '', 'error')
        )
      },
      assignContributionToGroupResourceSpace(aid, cid, gid, contributions) {
        // /api/assembly/:aid/campaign/:cid/group/:gid/assignments
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/campaign/:cid/group/:gid/assignments',
          {aid: aid, cid: cid, gid: gid}).save(contributions);

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error adding contribution to resource space', 'error')
        )
      },
      removeContributionFromResourceSpace(aid, cid, sid) {
        var rsp;
        rsp = $resource(getServerBaseUrl(localStorageService) + '/assembly/:aid/contribution/:cid/space/:sid',
          {aid: aid, cid: cid, sid: sid}).delete();

        return rsp.$promise.then(
          data => data,
          error => Notify.show('Error adding contribution to resource space', 'error')
        )
      }
    };
  }
]);

appCivistApp.factory('Components', function ($resource, $sce, localStorageService, $translate, $filter, moment) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);

  return {
    defaultProposalComponents: function () {
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
        dependsOfValue: optionsDict['component.voting.system'][3].value
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
    defaultSupportingComponents: function () {
      return [
        { name: 'Working Groups', alias: 'workingGroups' },
        { name: 'Visualization', alias: 'visualization' },
        { name: 'Mapping', alias: 'mapping' },
        { name: 'Mobilization', alias: 'mobilization' },
        { name: 'Reporting', alias: 'reporting' },
        { name: 'Implementation', alias: 'implementation' }
      ];
    },
    defaultProposalComponentMilestones: function () {
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
    },

    defaultComponents: function () {
      return [
        {
          "title": "Ideas",
          "type": "IDEAS",
          "key": "ideas_1",
          "description": "The 'Ideas' phase is about raising issues and brainstorming ideas",
          "position": 1,
          "timeline": 1,
          "linked": false,
          "configs": [
            {
              "key": "component.ideas.enable-multiple-authors",
              "value": "true",
              "definition": {
                "description": "Enable support for multiple authors per idea",
                "valueType": "Boolean",
                "defaultValue": "false",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.ideas.enable-attachments",
              "value": "false",
              "definition": {
                "description": "Enable support for attachments on ideas",
                "valueType": "Boolean",
                "defaultValue": "false",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.ideas.contribution-limit",
              "value": "0",
              "definition": {
                "description": "Limit of the number of contributions that users can create in this phase",
                "valueType": "Integer",
                "defaultValue": "0",
                "configTarget": "COMPONENT"
              }
            }
          ],
          "milestones": [
            {
              "title": "Beginning",
              "key": "ideas_milestone_1",
              "position": 1,
              "description": "Idea collection begins on this day",
              "date": moment().local().format("YYYY-MM-DD hh:mm:ss"),
              "type": "START"
            },
            {
              "title": "End",
              "key": "ideas_milestone_2",
              "position": 2,
              "description": "Idea collection ends on this day",
              "date": moment().local().add(30, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "END"
            }
          ]
        },
        {
          "title": "Proposals",
          "type": "PROPOSALS",
          "key": "proposals_1",
          "description": "The Proposal phase is about forming working groups, analyzing ideas, and developing proposals",
          "position": 2,
          "timeline": 1,
          "linked": false,
          "configs": [
            {
              "key": "component.proposals.disable-collaborative-editor",
              "value": false,
              "definition": {
                "description": "Disable collaborative editing of proposals",
                "valueType": "Boolean",
                "defaultValue": "false",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.proposals.enable-multiple-authors",
              "value": "true",
              "definition": {
                "description": "Enable support for multiple authors per proposal",
                "valueType": "Boolean",
                "defaultValue": "false",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.ideas.enable-attachments",
              "value": "true",
              "definition": {
                "description": "Enable support for attachments on proposals",
                "valueType": "Boolean",
                "defaultValue": "true",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.ideas.contribution-limit",
              "value": "0",
              "definition": {
                "description": "Limit of the number of contributions that users can create in this phase",
                "valueType": "Integer",
                "defaultValue": "0",
                "configTarget": "COMPONENT"
              }
            }
          ],
          "milestones": [
            {
              "title": "Beginning",
              "key": "proposals_milestone_1",
              "position": 1,
              "description": "Proposal development begins on this day",
              "date": moment().local().add(31, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "START"
            },
            {
              "title": "End",
              "key": "proposals_milestone_2",
              "position": 2,
              "description": "Proposal development ends on this day",
              "date": moment().local().add(60, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "END"
            }
          ]
        },
        {
          "title": "Deliberation",
          "type": "DELIBERATION",
          "key": "deliberation_1",
          "description": "Deliberation is the careful consideration of proposals through comments and evidence. In this phase, proposals can only be discussed, praised or criticized, but not edited.",
          "position": 3,
          "timeline": 1,
          "linked": false,
          "configs": [
            {
              "key": "component.deliberation.enable-technical-assessment",
              "value": "true",
              "definition": {
                "description": "Enable technical assessment of proposals",
                "valueType": "Boolean",
                "defaultValue": "true",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.deliberation.who-deliberates",
              "value": "ASSEMBLY",
              "definition": {
                "description": "Who deliberates?",
                "valueType": "String",
                "defaultValue": "ASSEMBLY",
                "configTarget": "COMPONENT",
                "uiType": "select",
                "options": [
                  {
                    "name": "All assembly members",
                    "value": "ASSEMBLY",
                    "selected": true
                  },
                  {
                    "name": "Only Working Groups of this Campaign",
                    "value": "CAMPAIGN_WORKING_GROUPS",
                    "selected": false
                  },
                  {
                    "name": "Randomly selected jury",
                    "value": "JURY",
                    "selected": false
                  }
                ],
                "optionValue": {
                  "name": "All assembly members",
                  "value": "ASSEMBLY",
                  "selected": true
                }
              }
            },
            {
              "key": "component.deliberation.who-deliberates-jury",
              "value": "ASSEMBLY",
              "dependsOf": 1,
              "dependsOfValue": "JURY",
              "definition": {
                "description": "From where are members of the jury randomly selected?",
                "valueType": "String",
                "defaultValue": "ASSEMBLY",
                "configTarget": "COMPONENT",
                "uiType": "select",
                "options": [
                  {
                    "name": "From all assembly members",
                    "value": "ASSEMBLY",
                    "selected": true
                  },
                  {
                    "name": "From Working Groups of this Campaign",
                    "value": "CAMPAIGN_WORKING_GROUPS",
                    "selected": false
                  }
                ],
                "optionValue": {
                  "name": "From all assembly members",
                  "value": "ASSEMBLY",
                  "selected": true
                }
              }
            },
            {
              "key": "component.deliberation.who-deliberates-jury-percentage",
              "value": 0.1,
              "dependsOf": 1,
              "dependsOfValue": "JURY",
              "definition": {
                "description": "What percentage of people should be on the Jury?",
                "valueType": "Percentage",
                "defaultValue": "0.1",
                "configTarget": "COMPONENT"
              }
            }
          ],
          "milestones": [
            {
              "title": "Beginning",
              "key": "deliberation_milestone_1",
              "position": 1,
              "description": "Proposal development begins on this day",
              "date": moment().local().add(61, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "START"
            },
            {
              "title": "End",
              "key": "deliberation_milestone_2",
              "position": 2,
              "description": "Proposal development ends on this day",
              "date": moment().local().add(90, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "END"
            }
          ]
        },
        {
          "title": "Voting",
          "key": "voting_1",
          "position": 4,
          "timeline": 1,
          "linked": false,
          "configs": [
            {
              "key": "component.voting.ballot.password",
              "value": "123456",
              "definition": {
                "description": "Ballot Password",
                "valueType": "String",
                "defaultValue": "12345",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.voting.system",
              "value": "RANGE",
              "definition": {
                "description": "Select the voting system",
                "valueType": "String",
                "defaultValue": "RANGE",
                "configTarget": "COMPONENT",
                "uiType": "select",
                "options": [
                  {
                    "name": "Range",
                    "value": "RANGE",
                    "selected": true
                  },
                  {
                    "name": "Ranked",
                    "value": "RANKED",
                    "selected": false
                  },
                  {
                    "name": "Distribution",
                    "value": "DISTRIBUTION",
                    "selected": false
                  },
                  {
                    "name": "Plurality",
                    "value": "PLURALITY",
                    "selected": false
                  }
                ],
                "optionValue": {
                  "name": "Range",
                  "value": "RANGE",
                  "selected": true
                }
              }
            },
            {
              "key": "component.voting.system-range-min-score",
              "value": "0",
              "dependsOf": 1,
              "dependsOfValue": "RANGE",
              "definition": {
                "description": "Minimum score for range voting",
                "valueType": "Integer",
                "defaultValue": "0",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.voting.system-range-max-score",
              "value": "100",
              "dependsOf": 1,
              "dependsOfValue": "RANGE",
              "definition": {
                "description": "Maximum score for range voting",
                "valueType": "Integer",
                "defaultValue": "100",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.voting.system-ranked-number-proposals",
              "value": "5",
              "dependsOf": 1,
              "dependsOfValue": "RANKED",
              "definition": {
                "description": "How many proposals can a voter select?",
                "valueType": "Integer",
                "defaultValue": "5",
                "configTarget": "COMPONENT"
              }
            },
            {
              "key": "component.voting.system-distributed-points",
              "value": "30",
              "dependsOf": 1,
              "dependsOfValue": "DISTRIBUTED",
              "definition": {
                "description": "How many points can a voter distribute?",
                "valueType": "Integer",
                "defaultValue": "30",
                "configTarget": "COMPONENT"
              }
            }
          ],
          "milestones": [
            {
              "title": "Beginning",
              "key": "voting_milestone_1",
              "position": 1,
              "description": "Voting begins on this day",
              "date": moment().local().add(91, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "START"
            },
            {
              "title": "End",
              "key": "voting_milestone_2",
              "position": 2,
              "description": "Voting ends on this day",
              "date": moment().local().add(120, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "END"
            }
          ]
        },
        {
          "title": "Implementation",
          "type": "IMPLEMENTATION",
          "key": "implementation_1",
          "position": 5,
          "timeline": 1,
          "linked": false,
          "configs": [],
          "milestones": [
            {
              "title": "Beginning",
              "key": "implementation_milestone_1",
              "position": 1,
              "description": "Implemenation begins on this day",
              "date": moment().local().add(121, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "START"
            },
            {
              "title": "End",
              "key": "implementation_milestone_2",
              "position": 2,
              "description": "Voting ends on this day",
              "date": moment().local().add(365, 'days').format("YYYY-MM-DD hh:mm:ss"),
              "type": "END"
            }
          ]
        }
      ];
    }
  };
});

/**
 * Defines methods to interact with the authentication endpoints.
 *
 * @class AppCivistAuth
 * @memberof services
 */
appCivistApp.factory('AppCivistAuth', function ($resource, localStorageService) {
  return {
    signIn: function (provider = null, assembly = null) {
      if (provider == null && assembly == null) {
        return $resource(getServerBaseUrl(localStorageService) + '/user/login');
      } else {
        return $resource(getServerBaseUrl(localStorageService) + '/user/login?provider=:provider&assembly=:assembly', {
          provider: provider,
          assembly: assembly
        });
      }
    },
    signOut: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/user/logout');
    },
    signUp: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/user/signup');
    },

    /**
     * calls the endpoint POST /user/password/forgot.
     *
     *  @method services.AppCivistAuth#forgot
     *  @param {string} email -  user email
     */
    forgot(email) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/password/forgot').save({ "email": email, "configUrl": localStorageService.get('forgotFormUrl') }).$promise;
    },

    /**
     * calls the endpoint POST /user/password/forgot/change.
     *
     *  @method services.AppCivistAuth#reset
     *  @param {Object} payload -  {token: '...', password: '...', repeatPassword: '...'}
     */
    reset(payload) {
      return $resource(getServerBaseUrl(localStorageService) + '/user/password/forgot/change').save(payload).$promise;
    },
    /**
     * Converts IDs to UUIDs
     *
     * @method services.AppCivistAuth#getUUID
     * @param {string} type
     * @param {string} id
     */
    getUUID(type, id) {
      return $resource(getServerBaseUrl(localStorageService) + '/uuid?type=:type&id=:id', { type: type, id: id });
    },
    /**
     * Converts UUIDs to IDs
     *
     * @method services.AppCivistAuth#getID
     * @param {string} type
     * @param {string} uuid
     */
    getID(type, uuid) {
      return $resource(getServerBaseUrl(localStorageService) + '/id?type=:type&uuid=:uuid', { type: type, uuid: uuid });
    },
  };
});

appCivistApp.factory('FileUploader', function ($resource, localStorageService, Upload, $timeout) {
  return {
    upload: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/upload');
    },
    list: function () {
      return $resource(getServerBaseUrl(localStorageService) + '/files');
    },
    uploadEndpoint: function () {
      return getServerBaseUrl(localStorageService) + '/upload';
    },
    uploadFileAndAddToResource: function (file, resource) {
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

appCivistApp.factory('Invitations', function ($resource, localStorageService) {
  var serverBaseUrl = getServerBaseUrl(localStorageService);
  return {
    assemblyInvitation: function (assemblyId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/assembly/:aid', { aid: assemblyId });
    },
    groupInvitation: function (groupId) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/group/:gid', { gid: groupId });
    },
    invitations: function (targetType, target, status) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:tt/:t/:s', {tt: targetType, t: target, s: status });
    },
    invitation: function (token) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:t', { t: token }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    invitationResponse: function (token, response) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:t/:r', { t: token, r: response }, {
        'update': { method: 'PUT' },
        'delete': { method: 'DELETE' }
      });
    },
    defaultInvitation: function (target, type, defaultEmail) {
      var newInvitation = {
        email: "",
        moderator: true,
        coordinator: true,
        targetId: target,
        targetType: type,
        invitationEmail: defaultEmail
      }
      return newInvitation;
    },
    resendInvitation: function (iid) {
      return $resource(getServerBaseUrl(localStorageService) + '/membership/invitation/:iid/email', { iid: iid }).save().$promise;
    }
  }
});

appCivistApp.factory('BallotCampaign', function ($http, $resource, localStorageService) {
  var url = getServerBaseUrl(localStorageService);
  return $resource(
    url + '/ballot/:uuid/campaign', { "uuid": "@id" }
  );
});

appCivistApp.factory('ContributionDirectiveBroadcast', function ($rootScope) {
  var contributionDirective = {};
  contributionDirective.CONTRIBUTION_CREATED = 'contributionCreated';
  contributionDirective.CONTRIBUTION_UPDATED = 'contributionUpdated';
  contributionDirective.CONTRIBUTION_DELETED = 'contributionDeleted';
  contributionDirective.PROPOSAL_CREATED = 'proposalCreated';
  contributionDirective.CONTRIBUTION_CREATE_ERROR = 'contributionCreateError';
  contributionDirective.CONTRIBUTION_UPDATE_ERROR = 'contributionUpdateError';
  contributionDirective.CONTRIBUTION_DELETE_ERROR = 'contributionDeleteError';
  contributionDirective.prepForUpdateContributions = function (msg) {
    var message = msg ? msg : contributionDirective.CONTRIBUTION_UPDATED;
    this.broadcastUpdateContributions(message);
  };

  contributionDirective.broadcastUpdateContributions = function (msg) {
    $rootScope.$broadcast(msg);
  };

  return contributionDirective;
});


appCivistApp.factory('Captcha', ['$resource', 'localStorageService',
  function ($resource, localStorageService) {
    var url = getServerBaseUrl(localStorageService);

    return {
      /**
       * Method that validate user's response.
       *
       * @param {string} toValidate - recaptcha hashed response
       */
      verify: function (toValidate) {
        return $resource(url + '/site/verify', { k: toValidate }).save().$promise;
      }
    }
  }
]);

/**
 * Editor factory.
 *
 * @description
 *
 * Defines helpers for tinymce editor.
 *
 * @class Editor
 * @memberof services
 */
appCivistApp.factory('Editor', ['$resource', 'localStorageService', 'FileUploader',
  function ($resource, localStorageService, FileUploader) {
    var url = getServerBaseUrl(localStorageService);

    return {
      /**
       * Returns default configuration options for tinymce.
       *
       * @method services.Editor#getEditorOptions
       * @param {Object} target - The scope where the tinymce editor will be.
       */
      getOptions(target) {

        return {
          height: 400,
          plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table contextmenu paste imagetools'
          ],
          toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
          images_upload_credentials: true,
          image_advtab: true,
          image_title: true,
          statusbar: false,
          automatic_uploads: true,
          file_picker_types: 'image',
          imagetools_cors_hosts: ['s3-us-west-1.amazonaws.com'],
          images_upload_handler: function (blobInfo, success, failure) {
            var xhr, formData;
            xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open('POST', FileUploader.uploadEndpoint());
            xhr.onload = function () {
              var json;

              if (xhr.status != 200) {
                failure('HTTP Error: ' + xhr.status);
                return;
              }
              json = JSON.parse(xhr.responseText);

              if (!json || typeof json.url != 'string') {
                failure('Invalid JSON: ' + xhr.responseText);
                return;
              }
              success(json.url);
            };
            formData = new FormData();
            formData.append('file', blobInfo.blob());
            xhr.send(formData);
          },
          file_picker_callback: function (cb, value, meta) {
            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            $(input).bind('change', function () {
              var file = this.files[0];
              var id = 'blobid' + (new Date()).getTime();
              var blobCache = tinymce.activeEditor.editorUpload.blobCache;
              var blobInfo = blobCache.create(id, file);
              blobCache.add(blobInfo);
              cb(blobInfo.blobUri(), { title: file.name });
            });
            input.click();
            target.$on('$destroy', function () {
              $(input).unbind('change');
            });
          }
        };
      }
    }
  }
]);

/**
 * Defines utility methods.
 *
 * @class Utils
 * @memberof services
 */
appCivistApp.factory('Utils', [
  function () {

    return {
      /**
       * Parses the given date to local time.
       *
       * @method services.Utils#parseDateToLocal
       * @param {string} dateStr - The date to parse. Expected format example: 2016-12-12 13:05 PM GMT
       */
      parseDateToLocal(dateStr) {
        if (!dateStr) {
          return;
        }
        dateStr = dateStr.replace('PM GMT', '').replace('AM GMT', '').trim();
        dateStr.replace(' ', 'T');
        return moment.utc(dateStr).local().toDate();
      },

      /**
       * Determines if given string is an UUID
       *
       * @method services.Utils#isUUID
       * @param {string} uuid
       */
      isUUID(uuid) {
        var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return pattern.test(uuid);
      }
    }
  }
]);
