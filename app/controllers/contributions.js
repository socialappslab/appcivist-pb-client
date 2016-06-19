/**
 * The NewContributionCtrl controls how to display and create new contributions to
 * AppCivist's backend. Contributions can be created in the following spaces:
 * - On the assembly forum space (type = FORUM_POST)
 * - On the assembly resources space (type = DISCUSSION)
 * - On a campaign resources space (type = DISCUSSION)
 * - On a component (i.e., phase) that is part of a campaign (type = PROPOSAL, BRAINSTORMING
 * - On a contribution resources space (type = COMMENT)
 */

var postingContributionFlag = false;

appCivistApp.controller('NewContributionCtrl',
        function ($rootScope, $scope, $http, $routeParams, localStorageService, Contributions, $translate, logService,
                  usSpinnerService, ContributionDirectiveBroadcast, FlashService) {
            init();

            function init() {
                $scope.user = localStorageService.get("user");
                if ($scope.user && $scope.user.language)
                    $translate.use($scope.user.language);
                $scope.userIsAuthor = true;
                $scope.postingContribution = postingContributionFlag;
                $scope.newContribution = Contributions.defaultContributionAttachment();
                $scope.userWorkingGroups = localStorageService.get("workingGroups");
                if (!$scope.userWorkingGroups) {
                    $scope.userWorkingGroups = [];
                }
                $scope.createNewGroup = false;

                if($scope.newContribution.type === "PROPOSAL") {
                    if ($scope.userWorkingGroups && $scope.userWorkingGroups.length > 0) {
                        $scope.newContribution.workingGroupAuthor = $scope.userWorkingGroups[0];
                        $scope.newContribution.workingGroupAuthors[0] = $scope.userWorkingGroups[0];
                    }
                }

                $scope.clearContribution = function () {
                    clearNewContributionObject($scope, Contributions);
                    if($scope.replyParent) {
                        $scope.replyParent.boxIsOpen = false;
                    }
                };

                $scope.postContribution = function () {
                    if (!$scope.newContribution.type) {
                        $scope.newContribution.type = $scope.contributionType;
                    }
                    $scope.response = {};
                    $scope.modalInstance = undefined;
                    createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
                };

                $scope.broadcastUpdateContributions = function (msg) {
                    ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
                };

                $scope.$on(ContributionDirectiveBroadcast.CONTRIBUTION_CREATE_ERROR, function() {
                    $rootScope.showError($rootScope.flash.message, "CONTRIBUTION", null);
                });
            }
        });

appCivistApp.controller('NewContributionModalCtrl',
		function ($rootScope, $scope, $uibModalInstance, Upload, FileUploader, $timeout, $http,
                  assembly, campaign, contributions, themes, newContribution, newContributionResponse,
                  cType, localStorageService, Contributions, Memberships, $translate, $location,
                  logService, usSpinnerService, ContributionDirectiveBroadcast, FlashService) {
			init();

			function init() {
                initScopeContent();
                initScopeFunctions();
			}

            /**
             * Init scope variables
             */
            function initScopeContent () {
                $scope.user = localStorageService.get("user");
                if ($scope.user && $scope.user.language)
                    $translate.use($scope.user.language);

                $scope.userIsAuthor = true;
                $scope.assembly = assembly;
                $scope.assemblyID = assembly.assemblyId;
                $scope.campaign = campaign;
                $scope.campaignID = campaign.campaignId;
                $scope.contributions = contributions;
                $scope.themes = themes;
                $scope.newContribution = newContribution;
                $scope.newContribution.parentThemes = $scope.themes;
                $scope.newContributionResponse = newContributionResponse;
                $scope.postingContribution = postingContributionFlag;
                $scope.cType = cType;
                $scope.newContribution.type = cType;
                $scope.newAttachment = Contributions.defaultContributionAttachment();
                $scope.userWorkingGroups = localStorageService.get("workingGroups");
                if (!$scope.userWorkingGroups) { $scope.userWorkingGroups = []; }
                $scope.userWorkingGroups.unshift({groupId: "NOID", name:"Create a new group..."});
                $scope.createNewGroup = false; // TODO: where is used?
                $scope.newWorkingGroupName = "";
                $scope.newWorkingGroupByName = false;
                $scope.groupSelected = false;
            }

            /**
             * Init scope functions
             */
            function initScopeFunctions () {
                $scope.clearContribution = function () {
                    clearNewContributionObject($scope.newContribution, Contributions);
                };
                $scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
                    $scope.postingContributionFlag = true;
                    $scope.newContribution = newContribution;
                    $scope.targetSpaceId = targetSpaceId;
                    $scope.targetSpace = targetSpace;
                    $scope.response = {};
                    $scope.modalInstance = undefined;
                    createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
                };

                // Post contributions from Modal Window
                $scope.postContributionFromModal = function () {
                    $scope.postingContributionFlag = true;
                    $scope.targetSpaceId = $scope.campaign.resourceSpaceId;
                    $scope.targetSpace = $scope.contributions;
                    $scope.response = $scope.newContributionResponse;
                    $scope.modalInstance = $uibModalInstance;
                    createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
                };

                $scope.cancel = function () {
                    $scope.newContribution = Contributions.defaultNewContribution();
                    $uibModalInstance.dismiss('cancel');
                };

                $scope.changeWorkingGroupAuthor = function (workingAuthor) {
                    if (workingAuthor === "NOID") {
                        $scope.newContribution.workingGroupAuthors[0] = {name: $scope.newWorkingGroupName};
                        $scope.newWorkingGroupByName = true;
                        $scope.groupSelected = true;
                    } else {
                        $scope.newContribution.workingGroupAuthors[0] = {groupId: workingAuthor};
                        $scope.newWorkingGroupByName = false;
                        $scope.groupSelected = true;
                    }
                }

                $scope.broadcastUpdateContributions = function (msg) {
                    ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
                };
            }

		});

appCivistApp.controller('ContributionDirectiveCtrl', function($rootScope, $scope, $routeParams, $uibModal, $location,
                                                              localStorageService, Etherpad, Contributions, $translate,
                                                              logService, usSpinnerService, FlashService,
                                                              ContributionDirectiveBroadcast) {

    init();

    function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        if(!$scope.contribution.comments) {
            $scope.contribution.comments = [];
        }

        $scope.contributionID = $scope.contribution.contributionId;

        verifyAuthorship($scope, localStorageService, Contributions);

        $scope.selectContribution = function(contribution){
            $scope.$root.$emit('contribution:selected', contribution);
        }

        $scope.openContributionModal = function(contribution,size) {
            if(!$scope.inModal) {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/partials/contributions/contribution/contributionView.html',
                    controller: 'ContributionModalCtrl',
                    size: 'lg',
                    resolve: {
                        contribution: function () {
                            return $scope.contribution;
                        },
                        assemblyID: function () {
                            return $scope.assemblyID;
                        },
                        campaignID: function () {
                            return $scope.campaignID;
                        },
                        componentID: function () {
                            return $scope.componentID;
                        },
                        container: function () {
                            return $scope.container;
                        },
                        containerID: function () {
                            return $scope.containerID;
                        },
                        containerIndex: function () {
                            return $scope.containerIndex;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    console.log('Closed contribution modal');
                }, function () {
                    console.log('Modal dismissed at: ' + new Date());
                });

                if($scope.contribution.type==="PROPOSAL") {
                  logService.logAction("READ_PROPOSAL");
                }
                if($scope.contribution.type==="BRAINSTORMING"){
                  logService.logAction("READ_CONTRIBUTION");
                }
                if($scope.contribution.type==="NOTE"){
                    logService.logAction("READ_NOTE");
                }
            }
        };

        $scope.clearContribution = function () {
            clearNewContributionObject($scope.newContribution, Contributions);
        };

        $scope.delete = function () {
            if($scope.contribution.type == "PROPOSAL") {
              logService.logAction("DELETE_PROPOSAL");
            }
            if($scope.contribution.type == "BRAINSTORMING") {
              logService.logAction("DELETE_CONTRIBUTION");
            }
            deleteContribution($scope,localStorageService, Contributions, logService, $rootScope, FlashService);
            $uibModalInstance.dismiss('cancel');

        };

        $scope.getEtherpadReadOnlyUrl = Etherpad.getEtherpadReadOnlyUrl;

        $scope.openContributionPage = function(cID, edit)  {
            if ($scope.campaignID === null || $scope.campaignID === undefined ) {
                if ($scope.contribution && $scope.contribution.campaignIds && $scope.contribution.campaignIds.length > 0) {
                    $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.contribution.campaignIds[0]+"/contribution/"+cID+"?edit="+edit);
                }
            } else {
                $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/contribution/"+cID+"?edit="+edit);
            }

            if (edit) {
              if ($scope.contribution.type=="PROPOSAL") {
                logService.logAction("OPEN_EDIT_PROPOSAL");
              }
              if ($scope.contribution.type=="BRAINSTORMING") {
                logService.logAction("OPEN_EDIT_CONTRIBUTION");
              }
            }
        };

        $scope.getBoxHeight = function () {
            return $scope.contribution.type === 'BRAINSTORMING' ? "'300px;'" : "''";
        }

        $scope.broadcastUpdateContributions = function () {
            ContributionDirectiveBroadcast.prepForUpdateContributions();
        };

        if($scope.contribution.extendedTextPad) {
            $scope.etherpadReadOnlyUrl = Etherpad.embedUrl($scope.contribution.extendedTextPad.readOnlyPadId);
            var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID,$scope.contributionID).get();
            etherpadRes.$promise.then(function(pad){
                $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
            });
        }
    }

});

appCivistApp.controller('ContributionModalCtrl',
    function ($rootScope, $scope, $uibModalInstance, $location, Upload, FileUploader, $timeout,
              contribution, assemblyID, campaignID, componentID, container, containerID, containerIndex,
              localStorageService, Contributions, Etherpad, $translate, logService, ContributionDirectiveBroadcast,
              FlashService) {
        init();
        verifyAuthorship($scope, localStorageService, Contributions);
        function init() {
            $rootScope.startSpinner();
            $scope.user = localStorageService.get("user");
            if ($scope.user && $scope.user.language)
                $translate.use($scope.user.language);
            $scope.contribution = contribution;
            $scope.assemblyID = assemblyID;
            $scope.campaignID = campaignID;
            $scope.componentID = componentID;
            $scope.newAttachment = Contributions.defaultContributionAttachment();
            $scope.container = container;
            $scope.containerID = containerID;
            $scope.containerIndex = containerIndex;
            $scope.doNotSummarizeText = true;
            $scope.userWorkingGroups = localStorageService.get("workingGroups");
            if (!$scope.userWorkingGroups) $scope.userWorkingGroups = [];
            $scope.userWorkingGroups.unshift({groupId: "NOID", name:"Create a new group..."});
            $scope.newContribution = Contributions.defaultNewContribution();
            $scope.newWorkingGroupName = "";
            $scope.newWorkingGroupByName = false;
            $scope.groupSelected = false;
            $scope.contributionID = $scope.contribution.contributionId;

            if (!$scope.contribution.comments || $scope.contribution.comments.length === 0) {
                var getComments = Contributions.getContributionComments($scope.assemblyID, $scope.contribution.contributionId).query();
                getComments.$promise.then(
                    function (data) {
                        $scope.contribution.comments = data;
                    },
                    function (error) {
                        $scope.contribution.comments = [];
                    }
                )
            }

            $scope.clearContribution = function () {
                clearNewContributionObject($scope.newContribution, Contributions);
            };

            $scope.delete = function () {
                if($scope.contribution.type == "PROPOSAL") {
                  logService.logAction("DELETE_PROPOSAL");
                }
                if($scope.contribution.type == "BRAINSTORMING") {
                  logService.logAction("DELETE_CONTRIBUTION");
                }
                deleteContribution($scope,localStorageService, Contributions, logService, $rootScope, FlashService);
                $uibModalInstance.dismiss('cancel');
            };

            $scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
                $scope.newContribution = newContribution;
                $scope.targetSpaceId = targetSpaceId;
                $scope.targetSpace = targetSpace;
                $scope.response = {};
                $scope.modalInstance = undefined;
                createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
            };

            $scope.postContributionFromModal = function () {
                $scope.targetSpaceId = $scope.component.resourceSpaceId;
                $scope.targetSpace = $scope.contributions;
                $scope.response = $scope.newContributionResponse;
                $scope.modalInstance = $uibModalInstance;
                createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
            };

            $scope.changeWorkingGroupAuthor = function (workingAuthor) {
                if (workingAuthor === "NOID") {
                    $scope.newContribution.workingGroupAuthors[0] = {name: $scope.newWorkingGroupName};
                    $scope.newWorkingGroupByName = true;
                    $scope.groupSelected = true;
                } else {
                    $scope.newContribution.workingGroupAuthors[0] = {groupId: workingAuthor};
                    $scope.newWorkingGroupByName = false;
                    $scope.groupSelected = true;
                }
            }

            $scope.brainstormingToProposalEnable = function () {
                $scope.turnIntoProposal = true;
            }

            $scope.brainstormingToProposalDisable= function () {
                $scope.turnIntoProposal = false;
            }

            $scope.brainstormingToProposal = function () {
                $scope.newContribution.type = 'PROPOSAL';
                $scope.newContribution.title = $scope.contribution.title;
                $scope.newContribution.text = $scope.contribution.text;
                $scope.newContribution.inspirations = [
                    $scope.contribution
                ];
                $scope.targetSpaceId = $scope.containerID;
                $scope.targetSpace = $scope.container;
                $scope.response = {};
                $scope.modalInstance = $uibModalInstance;
                // TODO: add invitations to commenters for the new group that will be created
                createNewContribution($scope, Contributions, logService, $rootScope, FlashService);
            };

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.getEtherpadReadOnlyUrl = Etherpad.getEtherpadReadOnlyUrl;

            $scope.openContributionPage = function(cID, edit)  {
                if ($scope.campaignID === null || $scope.campaignID === undefined) {
                    if ($scope.contribution && $scope.contribution.campaignIds && $scope.contribution.campaignIds.length > 0) {
                        $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.contribution.campaignIds[0]+"/contribution/"+cID+"?edit="+edit);
                    }
                } else {
                    $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/contribution/"+cID+"?edit="+edit);
                }
                $uibModalInstance.dismiss('cancel');
            };

            if($scope.contribution.extendedTextPad) {
                $scope.etherpadReadOnlyUrl = Etherpad.embedUrl($scope.contribution.extendedTextPad.readOnlyPadId);
                var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID,$scope.contributionID).get();
                etherpadRes.$promise.then(
                    function(pad) {
                        $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
                        $rootScope.stopSpinner();
                    }, function (error) {
                        $rootScope.stopSpinner();
                        $rootScope.showError(error.data);
                    });
            } else {
                $rootScope.stopSpinner();
            }

            $scope.broadcastUpdateContributions = function (msg) {
                ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
            };
        }
    });

appCivistApp.controller('ContributionCtrl', function($rootScope, $scope, $http, $routeParams, localStorageService,
													 FileUploader, Contributions, $translate, Etherpad,
                                                     usSpinnerService, ContributionDirectiveBroadcast, FlashService) {

	init();
	verifyAuthorship($scope, localStorageService, Contributions);

	function init() {
        $rootScope.startSpinner();
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        if(!$scope.newContribution) {
			$scope.newContribution = Contributions.defaultNewContribution();
		} else {
            $scope.contributionID = $scope.contribution.contributionId;
        }
		if(!$scope.contribution) {
			$scope.contribution = $scope.newContribution;
		}
        if(!$scope.newAttachment) {
			$scope.newAttachment = Contributions.defaultContributionAttachment();
		}

		if(!$scope.attachments) {
            $scope.attachments = [];
		}

		$scope.contribution.assemblyId = $scope.assemblyID;

		$scope.clearContribution = function () {
			clearNewContributionObject($scope.newContribution, Contributions);
		};

		$scope.addNewAttachment = function() {
			addNewAttachmentToContribution($scope.contribution, $scope.newAttachment, Contributions);
			$scope.f = {};
		};

		$scope.cancelNewAttachment = function () {
			clearNewAttachment($scope.newAttachment, Contributions);
		};

		$scope.uploadFiles = function(file, errFiles) {
			$scope.f = file;
			$scope.errFile = errFiles && errFiles[0];
			FileUploader.uploadFileAndAddToResource(file, $scope.newAttachment);
		};

		$scope.$root.$on('contribution:selected', function (event, data) {
			$scope.contribution = data;
		});

        if($scope.contribution.extendedTextPad && $scope.contributionID != null && $scope.contributionID != undefined) {
            $scope.etherpadReadOnlyUrl = Etherpad.embedUrl($scope.contribution.extendedTextPad.readOnlyPadId);
            var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID,$scope.contributionID).get();
            etherpadRes.$promise.then(
                function(pad) {
                    $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
                    $rootScope.stopSpinner();
                }, function (error) {
                    $rootScope.stopSpinner();
                    $rootScope.showError(error.data);
            });
        } else {
            $rootScope.stopSpinner();
        }

        $scope.broadcastUpdateContributions = function (msg) {
            ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
        };
	}
});

appCivistApp.controller('ContributionPageCtrl', function($rootScope, $scope, $http, $routeParams, localStorageService,
                                                         Contributions, Campaigns, Assemblies, Etherpad,WorkingGroups,
                                                         $translate, logService, usSpinnerService, $location,
                                                         ContributionDirectiveBroadcast, FlashService) {
    init();

    // TODO: improve efficiency by using angularjs filters instead of iterating through arrays
    setCurrentAssembly($scope, localStorageService);
    setCurrentCampaign($scope, localStorageService);

    function init() {
        $rootScope.startSpinner();
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        // 1. Setting up scope ID values
        $scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
        $scope.campaignID = ($routeParams.cid) ? parseInt($routeParams.cid) : 0;
        $scope.contributionID = ($routeParams.coid) ? parseInt($routeParams.coid) : 0;
        $scope.editContribution = ($routeParams.edit) ? ($routeParams.edit === "true") ? true : false : false;
        $scope.serverBaseUrl = localStorageService.get("serverBaseUrl");
        $scope.etherpadServer = localStorageService.get("etherpadServer");

        if(!$scope.newAttachment) {
            $scope.newAttachment = Contributions.defaultContributionAttachment();
        }
        if($scope.contribution && !$scope.contribution.attachments) {
            $scope.contribution.attachments = [];
        }

        $scope.update = function () {
            updateContribution($scope,Contributions, logService, $rootScope, FlashService);
        }

        $scope.delete = function () {
            if($scope.contribution.type == "PROPOSAL") {
                logService.logAction("DELETE_PROPOSAL");
            }
            if($scope.contribution.type == "BRAINSTORMING") {
                logService.logAction("DELETE_CONTRIBUTION");
            }
            deleteContribution($scope,localStorageService, Contributions, logService, $rootScope, FlashService);
        };

        $scope.$on(ContributionDirectiveBroadcast.CONTRIBUTION_DELETED, function() {
            $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID);
        });

        $scope.$on(ContributionDirectiveBroadcast.CONTRIBUTION_DELETE_ERROR, function() {
            $rootScope.showError($rootScope.flash.message,"CONTRIBUTION", $scope.contributionID);
        });

        $scope.$on(ContributionDirectiveBroadcast.CONTRIBUTION_UPDATE_ERROR, function() {
            $rootScope.showError($rootScope.flash.message,"CONTRIBUTION", $scope.contributionID);
        });

        $scope.broadcastUpdateContributions = function (msg) {
            ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
        };
    }

    /**
     * Returns the current assembly in local storage if its ID matches with the requested ID on the route
     * If the route ID is different, updates the current assembly in local storage
     * @param aID id of requested assembly in route
     * @param assemblies list of assemblies that belong to the user
     * @param localStorageService service to access the local web storage
     * @returns assembly
     */
    function setCurrentAssembly($scope, localStorageService) {
        $scope.assembly = localStorageService.get('currentAssembly');
        if($scope.assembly === null || $scope.assembly.assemblyId != $scope.assemblyID) {
            var res = Assemblies.assembly($scope.assemblyID).get();
            res.$promise.then(function(data) {
                $scope.assembly = data;
                localStorageService.set("currentAssembly", $scope.assembly);
            });
        } else {
            console.log("Route assembly ID is the same as the current assembly in local storage: "+$scope.assembly.assemblyId);
        }
    }

    /**
     * Returns the current campaign in local storage if its ID matches with the requested ID on the route
     * If the route ID is different, updates the current campaign in local storage
     * @param cID id of requested campaigns in route
     * @param campaign list of campaigns that belong to assemblies of the user
     * @param localStorageService service to access the local web storage
     * @returns assembly
     */
    function setCurrentCampaign($scope, localStorageService) {
        $scope.campaign = localStorageService.get('currentCampaign');
        if($scope.campaign === null || $scope.campaign.campaignId != $scope.campaignID) {
            var res = Campaigns.campaign($scope.assemblyID, $scope.campaignID).get();
            res.$promise.then(function(data) {
                $scope.campaign = data;
                localStorageService.set("currentCampaign", $scope.campaign);
                setCurrentComponent($scope,localStorageService);
                setCurrentMilestone($scope,localStorageService);
                setContributionAndGroup($scope,localStorageService);
                //setupDaysToDeadline();
            });
        } else {
            console.log("Route campaign ID is the same as the current campaign in local storage: "+$scope.campaign.campaignId);
            setContributionAndGroup($scope,localStorageService);
            //setupDaysToDeadline();
        }
    }

    function setContributionAndGroup($scope, localStorageService) {
        var res = Contributions.contribution($scope.assemblyID, $scope.contributionID).get();
        res.$promise.then(
            function(data) {
                $scope.contribution = data;
                localStorageService.set("currentContribution", $scope.contribution);
                $scope.themes = $scope.contribution.themes;
                $scope.comments = $scope.contribution.comments;

                if (!$scope.contribution.comments || $scope.contribution.comments.length === 0) {
                    var getComments = Contributions.getContributionComments($scope.assemblyID, $scope.contribution.contributionId).query();
                    getComments.$promise.then(
                        function (data) {
                            $scope.contribution.comments = data;
                        },
                        function (error) {
                            $scope.contribution.comments = [];
                        }
                    )
                }

                $scope.stats = $scope.contribution.stats;
                $scope.workingGroup = {};
                if(!$scope.contribution.attachments) {
                    $scope.contribution.attachments = [];
                }

                verifyAuthorship($scope, localStorageService, Contributions);

                if($scope.workingGroup.groupId) {
                    var membersRes = WorkingGroups.workingGroupMembers($scope.assemblyID, $scope.workingGroup.groupId, "ALL").query();
                    membersRes.$promise.then(
                            function (data) {
                                $scope.workingGroupMembers = data;
                            },
                            function (error) {
                                console.log("Error getting working group members")
                            }
                    );
                }

                if($scope.contribution.extendedTextPad) {
                    $scope.etherpadReadOnlyUrl = Etherpad.embedUrl($scope.contribution.extendedTextPad.readOnlyPadId);
                    var etherpadRes = Etherpad.getReadWriteUrl($scope.assemblyID,$scope.contributionID).get();
                    etherpadRes.$promise.then(function(pad){
                        $scope.etherpadReadWriteUrl = Etherpad.embedUrl(pad.padId);
                    });
                }
                console.log("Loading {assembly,campaign,contribution}: "
                    +$scope.assembly.assemblyId+", "
                    +$scope.campaign.campaignId+", "
                    +$scope.contribution.contributionId
                );
                $scope.stopSpinner();
            },
            function (error) {
                $scope.stopSpinner();
                var errorMsg = error.data ? error.data.statusMessage : "Server is offline";
                var errorStatus = error.data ? error.data.responseStatus : "OFFLINE";
                FlashService.ErrorWithModal(errorMsg, "CONTRIBUTION", $scope.contributionID, errorStatus, false);
                console.log("There was an error loading the contribution: "+error);
            }
        );
    }
});

appCivistApp.controller('CommentsController', function($rootScope, $scope, $http, $routeParams, localStorageService,
													   Contributions, $translate, logService,
                                                       usSpinnerService, ContributionDirectiveBroadcast) {
	init();
	initializeNewReplyModel();

	function init() {
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.orderProperty = 'creation';
		$scope.orderReverse = true;
		// TODO: read replies enabled from configurations
		$scope.reply = {};
		$scope.reply.enabled = true;
		$scope.reply.boxIsOpen = false;

		if($scope.comment) {
			$scope.contribution = $scope.comment;
			if(!$scope.comment.comments) {
				$scope.comment.comments = [];
			}
			$scope.comments = $scope.comment.comments;
			verifyAuthorship($scope,localStorageService,Contributions);
            $scope.targetSpaceId = $scope.comment.resourceSpaceId;
            $scope.targetSpace = $scope.comment.comments;
            $scope.themes = $scope.comment.themes;
		}

		$scope.forumPostObj = {
			targetSpaceId : $scope.targetSpaceId,
			targetSpace: $scope.targetSpace,
			themes: $scope.themes,
			ctype: "COMMENT",
			replyParent: $scope.reply
		};

		// Scope Functions
		$scope.orderComments = function (property) {
			if($scope.orderProperty = property) {
				$scope.orderReverse = !$scope.orderReverse;
			}
		}

		$scope.random = function() {
			return 0.5 - Math.random();
		}

		$scope.openReplyBox = function () {
			$scope.reply.boxIsOpen = true;
		}

		$scope.closeReplyBox = function () {
			$scope.reply.boxIsOpen = false;
		}

        $scope.delete = function () {
			deleteContribution($scope, localStorageService, Contributions, logService, $rootScope, FlashService);
		};

        $scope.broadcastUpdateContributions = function (msg) {
            ContributionDirectiveBroadcast.prepForUpdateContributions(msg);
        };
	}

	function initializeNewReplyModel() {
		$scope.newReply = Contributions.defaultNewContribution();
		$scope.newReply.type = "COMMENT";
	}
});


appCivistApp.controller('ContributionFeedbackCtrl', function($rootScope, $scope, $http, $routeParams, localStorageService,
                                                          Contributions, $translate, MakeVote, Ballot, BallotPaper,
                                                          VotesByUser, $rootScope) {

    init();

    function init () {
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        // Set contribution stats
        $scope.assemblyID = ($routeParams.aid) ? parseInt($routeParams.aid) : 0;
        $scope.contributionID = $scope.contribution.contributionId;

        // Read user contribution feedback
        $scope.userFeedback = $scope.userFeedback != null ?
            $scope.userFeedback : {"up":false, "down":false, "fav": false, "flag": false};

        var feedback = Contributions.userFeedback($scope.assemblyID, $scope.contributionID).get();
        feedback.$promise.then(
            function (feedback) {
                $scope.userFeedback = feedback;
            },
            function (error) {
                console.log(error);
            }
        );

        // Feedback update
        $scope.updateFeedback = function (value) {
            if (value === "up") {
                $scope.userFeedback.up = true;
                $scope.userFeedback.down = false;

            } else if (value === "down") {
                $scope.userFeedback.up = false;
                $scope.userFeedback.down = true;
            } else if (value === "fav") {
                $scope.userFeedback.fav = true;
            } else if (value === "flag") {
                $scope.userFeedback.flag = true;
            }

            // TODO send feedback update

            //var stats = $scope.contribution.stats;
            var feedback = Contributions.userFeedback($scope.assemblyID, $scope.contributionID).update($scope.userFeedback);
            feedback.$promise.then(
                function (newStats) {
                    $scope.contribution.stats = newStats;
                },
                function (error) {
                    console.log("Error when updating user feedback");
                }
            );
        };
    }
});

appCivistApp.controller('ContributionVotesCtrl', function($rootScope, $scope, $http, $routeParams, localStorageService,
														  Contributions, $translate, MakeVote, Ballot, BallotPaper,
                                                          VotesByUser, $rootScope) {
    /**
     * Directive Scope
     * contribution: '=',
     * bindingResults: '=bindingresults',
     * consultiveResults: '=consultiveresults',
     * ballotPaper: "=ballotpaper",
     * consultiveBallotPaper: "=cballotpaper",
     * bindingBallotId: "=bballot",
     * consultiveBallotId: "=cballot"
     */
	init();

	function init() {
        $scope.user = localStorageService.get('user');
        $scope.currentCampaign = localStorageService.get('currentCampaign');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.clearToggle = function () {
            $scope.yesToggle = $scope.noToggle = $scope.abstainToggle = $scope.blockToggle = "";
        };

        $scope.setToggle = function (choice) {
            $scope.clearToggle();
            if (choice == "YES") {
                $scope.yesToggle = "btn-success";
            } else if (choice == "NO") {
                $scope.noToggle = "btn-danger";
            } else if (choice == "ABSTAIN") {
                $scope.abstainToggle = "btn-info";
            } else if (choice == "BLOCK") {
                $scope.blockToggle = "btn-warning";
            }
        };

        // Cast vote on a single contribution
        $scope.contributionVote = function (c, type) {
            var userId = $scope.user ? $scope.user.uuid : localStorageService.get("voteSignature");
            var ballotId = type=="BINDING" ? $scope.bindingBallotId : $scope.consultiveBallotId;
            var ballotPaper = type=="BINDING" ? $scope.ballotPaper : $scope.consultiveBallotPaper;
            var choice = c;
            var contributionId = $scope.contribution.uuidAsString;
            updateUserContributionVote(ballotId, ballotPaper, userId, choice, contributionId, type);
            console.log(type, ballotId, userId, choice, contributionId);
        };

        if ($scope.contribution.type === 'PROPOSAL') initUserBindingVotes();
        if ($scope.contribution.type === 'PROPOSAL') initBindingResults();
    }

    function initUserBindingVotes() {
        // Make sure the Binding Votes of the user are available in the scope
        $scope.listOfVotesByUser = $scope.ballotPaper ? $scope.ballotPaper.vote ? $scope.ballotPaper.vote.votes : null : null;
        $scope.candidatesIndex = $scope.ballotPaper ? $scope.ballotPaper.ballot ? $scope.ballotPaper.ballot.candidatesIndex : null : null;
        $scope.votesIndex = $scope.ballotPaper ? $scope.ballotPaper.vote ? $scope.ballotPaper.vote.votesIndex : null : null;
        if (!$scope.listOfVotesByUser && !$scope.candidatesIndex)
            readBallotPaper($scope.bindingBallotId, "BINDING");

        if ($scope.listOfVotesByUser && $scope.candidatesIndex && $scope.votesIndex && $scope.contribution) {
            var candidateIndex = $scope.candidatesIndex[$scope.contribution.uuidAsString];
            if (candidateIndex != null && candidateIndex != undefined) {
                var candidateId = $scope.ballotPaper.ballot.candidates[candidateIndex].id;
                var voteIndex = $scope.votesIndex[candidateId];
                if (voteIndex != null && voteIndex != undefined) {
                    var vote = $scope.listOfVotesByUser[voteIndex];
                    if (vote != null && vote != undefined) {
                        $scope.setToggle(vote.value);
                    }
                }
            }
        }
    }

    // Read the BallotPaper
    // - If already in scope, use existing, otherwise, read from server
    function readBallotPaper(ballotId, type) {
        var bp = BallotPaper.read({uuid: ballotId, signature: $scope.user.uuid});
        bp.$promise.then(
            function (data) {
                // Update the BallotPaper in the scope
                if (type==="BINDING") {
                    $scope.ballotPaper = data;
                    initUserBindingVotes();
                } else {
                    $scope.consultiveBallotPaper = data;
                    initUserConsultiveVotes();
                }
            },
            function(error){
                // BallotPaper creation when reading fails is limited to the campaignComponentCtrl (to avoid multiple creations)
                console.log("BallotPaper is not available yet for this user. Reload the Campaign page to ensure its creation");
            }
        );
    }

    function initBindingResults () {
        var cUUID = $scope.contribution.uuidAsString;

        if ($scope.bindingResults && $scope.bindingResults.index) {
            var resultIndex = $scope.bindingResults.index[cUUID];
            if (resultIndex) {
                $scope.bindingVoteScore = resultIndex.vote.score;
            } else {
                $scope.bindingVoteScore = "";
            }
        } else {
            readBallotResults($scope.bindingBallotId, "BINDING");
        }
    }

    function readBallotResults (ballotId, type) {
        var ballotResults = Ballot.results({uuid: ballotId});
        ballotResults.$promise.then(
            function (data) {
                if(type==="BINDING") $scope.bindingResults = data;
                else $scope.consultiveResults = data;
            },
            function (error) {
                console.log("Error reading the ballot results");
                if(type==="BINDING") $scope.bindingResults = null;
                else $scope.consultiveResults = null;
            }
        );
    }

    function updateUserContributionVote (ballotId, ballotPaper, userId, choice, contributionId, type) {
        var ballot = ballotPaper.ballot;
        var userVotes = ballotPaper.vote;

        // Find the ID of the candidate in the ballot associated to the contribution
        var candidateIndex = ballot.candidatesIndex[contributionId];
        var candidateId = null;
        if (candidateIndex != null && candidateIndex !=undefined && candidateIndex > -1) {
            candidateId = ballot.candidates[candidateIndex].id;
        } else {
            console.log("Error: there is no candidate associated to contribution: "+contributionId);
            return;
        }

        // Find the current vote of the user for that candidate
        var voteIndex = userVotes.votesIndex ? userVotes.votesIndex[candidateId] : null;
        var vote = null;
        var voteIsNew = false;
        if(voteIndex != null && voteIndex !=undefined && voteIndex > -1) { // If the vote is there, update it
            vote = userVotes.votes[voteIndex];
        } else { // If the vote is not there, it means it has to be added
            vote = {
                "candidate_id" : candidateId,
                "value" : choice
            };
            voteIsNew = true;
        }

        // Update the single vote
        var sign = $scope.user ? $scope.user.uuid : localStorageService.get('voteSignature');
        var singleVote = BallotPaper.single({uuid: ballotId, signature: sign},{"candidate_id":candidateId, "value": choice});
        singleVote.$promise.then(
            function (data) {
                // Vote updated in the server with success
                vote.value = choice;
                if (voteIsNew) { // If vote is new, add it to the votes array in the ballot paper and to the votesIndex
                    var index = userVotes.votes.push(vote) - 1;
                    if (userVotes.votesIndex) {
                        userVotes.votesIndex[candidateId] = index;
                    } else {
                        userVotes.votesIndex = {};
                        userVotes.votesIndex[candidateId] = index;
                    }
                }
                if (type==="BINDING") {
                    //$scope.ballotPaper = data;
                    initUserBindingVotes();
                } else {
                    //$scope.consultiveBallotPaper = data;
                    initUserConsultiveVotes();
                }
            },
            function (error) {
                console.log("Update single vote failed: "+JSON.stringify(error));
            }
        );
    }

    function userAlreadyVotedInContribution() {
        if ($scope.contribution.type === 'PROPOSAL') userAlreadyVotedBinding();
    }

    function userAlreadyVotedBinding() {
        var contributionId = $scope.contribution.uuidAsString;
        if ($scope.ballotPaper) {
            var ballot = $scope.ballotPaper.ballot;
            var userVotes = $scope.ballotPaper.vote;

            // Find the ID of the candidate in the ballot associated to the contribution
            var candidateIndex = ballot.candidatesIndex[contributionId];
            var candidateId = null;
            if (candidateIndex != null && candidateIndex !=undefined && candidateIndex > -1) {
                candidateId = ballot.candidates[candidateIndex].id;
            } else {
                console.log("Error: there is no candidate associated to contribution: "+contributionId);
                return;
            }

            // Find the current vote of the user for that candidate
            var voteIndex = userVotes.votesIndex ? userVotes.votesIndex[candidateId] : null;
            var vote = null;
            if(voteIndex != null && voteIndex !=undefined && voteIndex > -1) { // If the vote is there, update it
                vote = userVotes.votes.votesIndex[voteIndex];
            } else { // If the vote is not there, it means it has to be added
                console.log("Error: there is no candidate associated to contribution: "+contributionId);
                return;
            }

            $scope.bindingVote = vote;
            $scope.setToggle(vote.value);
        }
    }
});

appCivistApp.controller('AddAttachmentCtrl', function($rootScope, $scope, $http, $routeParams, localStorageService,
                                                      FileUploader, Contributions, $translate) {

    init();
    verifyAuthorship($scope, localStorageService, Contributions);

    function init() {
        $scope.user = localStorageService.get('user');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        if(!$scope.newContribution) {
            $scope.newContribution = Contributions.defaultNewContribution();
        }
        if(!$scope.newAttachment) {
            $scope.newAttachment = Contributions.defaultContributionAttachment();
        }

        $scope.clearContribution = function () {
            clearNewContributionObject($scope.newContribution, Contributions);
        };

        $scope.addNewAttachment = function() {
            addNewAttachmentToContribution($scope.contribution, $scope.newAttachment, Contributions);
            $scope.f = {};
        };

        $scope.cancelNewAttachment = function () {
            clearNewAttachment($scope.newAttachment, Contributions);
        };

        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            FileUploader.uploadFileAndAddToResource(file, $scope.newAttachment);
        };
    }
});

/**
 * Functions common to all Contribution Controllers
 */
function createNewContribution (scope, Contributions, logService, rootScope, FlashService) {
	scope.postingContributionFlag  = postingContributionFlag = true;
    if(rootScope.startSpinner) rootScope.startSpinner();
    if (!scope.newContribution.title || !scope.newContribution.title === "") {
		var maxlength = 250;
		var trimlength = maxlength;
		if(scope.newContribution.text.length < maxlength) {
			trimlength = scope.newContribution.text.length;
		}
		scope.newContribution.title = scope.newContribution.text.substring(0, trimlength);
	}

	// If the target space is undefined, it means it was empty an this contribution is the first
	if (!scope.targetSpace) {
		scope.targetSpace = [];
	}

	scope.newContribution.existingThemes = [];
	scope.newContribution.themes = [];
	addSelectedThemes(scope.newContribution.parentThemes, scope.newContribution.existingThemes);

    var type = scope.newContribution.type;
	var newContributionRes = Contributions.contributionInResourceSpace(scope.targetSpaceId).save(scope.newContribution);
	newContributionRes.$promise.then(
			function (data) {
				scope.newContribution = Contributions.defaultNewContribution();
				scope.targetSpace.unshift(data);
				scope.response.hasErrors = false;
				scope.response.touched = !scope.response.touched;
				if(scope.modalInstance)
					scope.modalInstance.close(scope.newContribution);
				if(scope.replyParent) {
					scope.replyParent.boxIsOpen = false;
				}
                scope.postingContributionFlag = postingContributionFlag = false;
                FlashService.Success("Contribution created!",false);
                // Logging Usage
                var resourceId = data.uuid;
                var action = type == 'PROPOSAL' ?
                    'CREATE_PROPOSAL' : type == 'BRAINSTORMING' ?
                    'CREATE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                    'CREATE_COMMENT' : 'CREATE_CONTRIBUTION';
                logService.logAction(action, "CONTRIBUTION", resourceId);
                if(rootScope.stopSpinner) rootScope.stopSpinner();
                if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionCreated");
			},
			function (error) {
				console.log("Error creating the contribution: " + angular.toJson(error.statusText));
				scope.response.hasErrors = true;
				scope.response.errors = error;
				scope.response.touched = !scope.response.touched;
                scope.postingContributionFlag = postingContributionFlag = false;
                if(rootScope.stopSpinner) rootScope.stopSpinner();

                var errorMsg = error.data ? error.data.statusMessage : "Server is offline";
                var errorStatus = error.data ? error.data.responseStatus : "OFFLINE";
                FlashService.Error(errorMsg, false, errorStatus);
                // Logging Usage
                var action = type == 'PROPOSAL' ?
                    'CREATE_PROPOSAL' : type == 'BRAINSTORMING' ?
                    'CREATE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                    'CREATE_COMMENT' : 'CREATE_CONTRIBUTION';
                logService.logAction(action, "CONTRIBUTION", null);
                if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionCreateError");
			}
	);
}

function updateContribution(scope, Contributions, logService, rootScope, FlashService) {
    if(rootScope.startSpinner) rootScope.startSpinner();
    if(scope.userIsAuthor) {
        var updateRes = Contributions.contribution(scope.assemblyID, scope.contribution.contributionId)
            .update(scope.contribution);

        updateRes.$promise.then(
            function (response) {
                scope.contribution = response;
                if(scope.contribution.type == "PROPOSAL") {
                    logService.logAction("UPDATE_PROPOSAL", "PROPOSAL", scope.contribution.uuid, scope.user.email);
                }
                if(scope.contribution.type == "BRAINSTORMING") {
                    logService.logAction("UPDATE_CONTRIBUTION", "CONTRIBUTION", scope.contribution.uuid, scope.user.email);
                }
                if(scope.contribution.type == "COMMENT") {
                    logService.logAction("UPDATE_COMMENT", "COMMENT",  scope.contribution.uuid, scope.user.email);
                }
                FlashService.Success("Contribution updated!", false);
                if(rootScope.startSpinner) rootScope.stopSpinner();
                if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionUpdated");
            },
            function (error) {
                console.log("Error in update");
                if(scope.contribution.type == "PROPOSAL") {
                    logService.logAction("UPDATE_PROPOSAL", "PROPOSAL", null, scope.user.email);
                }
                if(scope.contribution.type == "BRAINSTORMING") {
                    logService.logAction("UPDATE_CONTRIBUTION", "CONTRIBUTION", null, scope.user.email);
                }
                if(scope.contribution.type == "COMMENT") {
                    logService.logAction("UPDATE_COMMENT", "COMMENT", null, scope.user.email);
                }
                var errorMsg = error.data ? error.data.statusMessage : "Server is offline";
                var errorStatus = error.data ? error.data.responseStatus : "OFFLINE";
                FlashService.Error(errorMsg, false, errorStatus);
                if(rootScope.startSpinner) rootScope.stopSpinner();
                if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionUpdateError");
            }
        );
    }
}

function clearNewContributionObject (scope, Contributions){
	var cType = scope.newContribution.type;
    scope.newContribution = Contributions.defaultNewContribution();
	scope.newContribution.type = cType;
}

function addAttachmentToContribution (newContribution, attachment) {
	// POST attachment to IMGUR
	// ADD to attachments array in Contributions
	newContribution.attachments.push(attachment);
}

function addSelectedThemes (parentThemes, contributionThemes) {
	if(parentThemes) {
		for (var i = 0; i < parentThemes.length; i+=1) {
			if(parentThemes[i].selected) {
				contributionThemes.push(parentThemes[i])
			}
		}
	}
}

function addNewAttachmentToContribution (contribution, newAttachment, Contributions) {
   var att = Contributions.newAttachmentObject(newAttachment);
	if(!contribution.attachments) {
		contribution.attachments = [];
	}

	// If contribution has a contributionId, then we must UPDATE The contribution
	if (contribution.contributionId) {
		var assemblyId = contribution.assemblyId;
		delete contribution.assemblyId;
		delete contribution.firstAuthor;
		delete contribution.firstAuthorName;
		var updateRes = Contributions.contributionAttachment(assemblyId, contribution.contributionId).save(newAttachment);
		updateRes.$promise.then(
				function (response) {
					att.resourceId=response.resourceId;
					contribution.assemblyId = assemblyId;
					contribution.attachments.unshift(att);
					Contributions.copyAttachmentObject(newAttachment, Contributions.defaultContributionAttachment());
				},
				function(error) {
					console.log("There was an error with the Update");
					contribution.assemblyId = assemblyId;
					Contributions.copyAttachmentObject(newAttachment, Contributions.defaultContributionAttachment());
				}
		);
	} else {
		contribution.attachments.unshift(att);
		Contributions.copyAttachmentObject(newAttachment, Contributions.defaultContributionAttachment());
	}
};

function clearNewAttachment (newAttachment, Contributions) {
	Contributions.copyAttachmentObject(newAttachment, Contributions.defaultContributionAttachment());
};

function verifyAuthorship (scope, localStorageService, Contributions) {
	// Check if contribution has already an ID, otherwise is new
	if (scope.contribution.contributionId) {
		if (!scope.user) {
			scope.user = localStorageService.get("user");
		}

		if(scope.contribution.workingGroupAuthors && scope.contribution.workingGroupAuthors.length > 0) {
			scope.workingGroup = scope.contribution.workingGroupAuthors[0];
		}

		// Check Authorship
		// 1. Check if user is in the list of authors
		scope.userIsAuthor = Contributions.verifyAuthorship(scope.user, scope.contribution);

		// 2. If is not in the list of authorships, check if the user is member of one of the responsible groups
		if(!scope.userIsAuthor && scope.workingGroup && scope.workingGroup.groupId) {
			var authorship = Contributions.verifyGroupAuthorship(scope.user, scope.contribution, scope.workingGroup).get();
			authorship.$promise.then(function(response){
				if (response.responseStatus === "OK") {
					scope.userIsAuthor  = true;
				} else {
					scope.userIsAuthor = false;
				}
			});
		}
	} else {
		// Contribution is new
		scope.userIsAuthor = true;
	}
}

function deleteContribution (scope, localStorageService, Contributions, logService, rootScope, FlashService) {
	var confirmed = confirm("Are you sure you want to delete this contribution?");
    if(scope.userIsAuthor && confirmed) {
        if(rootScope.startSpinner) rootScope.startSpinner();
		var deleteRes = Contributions.contributionSoftRemoval(scope.assemblyID, scope.contribution.contributionId).update();
        var type = scope.contribution.type;
        var resourceId = scope.contribution.uuid;
        var localScope = scope;
		deleteRes.$promise.then(
				function (response) {
                    if (localScope.container) localScope.container.splice(localScope.containerIndex,1);
					console.log("Contribution deleted");
                    FlashService.Success("Contribution Deleted!",false);
                    // Log Actions
                    var action = type == 'PROPOSAL' ?
                        'DELETE_PROPOSAL' : type == 'BRAINSTORMING' ?
                        'DELETE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                        'DELETE_COMMENT' : 'DELETE_CONTRIBUTION';

                    logService.logAction(action, "CONTRIBUTION", resourceId);
                    if(rootScope.startSpinner) rootScope.stopSpinner();
                    if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionDeleted");
                },
				function (error) {
					console.log("Contribution cannot be deleted: "+error.statusMessage);
                    // Log Actions
                    var action = type == 'PROPOSAL' ?
                        'DELETE_PROPOSAL' : type == 'BRAINSTORMING' ?
                        'DELETE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                        'DELETE_COMMENT' : 'DELETE_CONTRIBUTION';

                    var errorMsg = error.data ? error.data.statusMessage : "Server is offline";
                    var errorStatus = error.data ? error.data.responseStatus : "OFFLINE";
                    FlashService.Error(errorMsg, false, errorStatus);
                    logService.logAction(action, "CONTRIBUTION", null);
                    if(rootScope.startSpinner) rootScope.stopSpinner();
                    if(scope.broadcastUpdateContributions) scope.broadcastUpdateContributions("contributionDeleteError");
				}
		);
	}
}