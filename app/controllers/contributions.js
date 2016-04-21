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
        function ($scope, $http, $routeParams, localStorageService, Contributions, $translate, logService) {
            init();

            function init() {
                $scope.user = localStorageService.get("user");
                if ($scope.user && $scope.user.language)
                    $translate.use($scope.user.language);
                $scope.userIsAuthor = true;
                $scope.postingContribution = postingContributionFlag;
                $scope.newContribution = Contributions.defaultContributionAttachment();
                $scope.userWorkingGroups = localStorageService.get("workingGroups");
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
                    createNewContribution($scope, Contributions, logService);
                };
            }
        });

appCivistApp.controller('NewContributionModalCtrl',
		function ($scope, $uibModalInstance, Upload, FileUploader, $timeout, $http,
				   assembly, campaign, contributions, themes, newContribution,
				   newContributionResponse, cType, localStorageService, Contributions, Memberships,
                   $translate, $location, logService) {
			init();

			function init() {
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
                $scope.createNewGroup = false;
                if($scope.newContribution.type === "PROPOSAL") {
                    if ($scope.userWorkingGroups && $scope.userWorkingGroups.length > 0 ) {
                        $scope.newContribution.workingGroupAuthors[0] = {groupId : $scope.userWorkingGroups[0].groupId};
                    }
                }

				$scope.clearContribution = function () {
					clearNewContributionObject($scope.newContribution, Contributions);
				};

                $scope.redirectToNewGroupForm = function () {
                    $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/wgroup/create");
                    console.log("redirecting to a new working group form")
                    $uibModalInstance.dismiss('cancel');
                };

				$scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
					$scope.newContribution = newContribution;
					$scope.targetSpaceId = targetSpaceId;
					$scope.targetSpace = targetSpace;
					$scope.response = {};
					$scope.modalInstance = undefined;
					createNewContribution($scope, Contributions, logService);
				};

                $scope.postContributionFromModal = function () {
                    $scope.targetSpaceId = $scope.campaign.resourceSpaceId;
                    $scope.targetSpace = $scope.contributions;
                    $scope.response = $scope.newContributionResponse;
                    $scope.modalInstance = $uibModalInstance;
                    createNewContribution($scope, Contributions, logService);
                };

				$scope.cancel = function () {
					$scope.newContribution = Contributions.defaultNewContribution();
					$uibModalInstance.dismiss('cancel');
				};

                $scope.changeWorkingGroupAuthor = function (workingAuthor) {
                    $scope.newContribution.workingGroupAuthors[0] = {groupId: workingAuthor};
                }
			}
		});

appCivistApp.controller('ContributionDirectiveCtrl', function($scope, $routeParams, $uibModal, $location,
                                                              localStorageService, Etherpad, Contributions, $translate,
                                                              logService) {

    init();

    function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        if(!$scope.contribution.comments) {
            $scope.contribution.comments = [];
        }

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

                if($scope.contribution.type=="PROPOSAL") {
                  logService.logAction("READ_PROPOSAL");
                }
                if($scope.contribution.type=="BRAINSTORMING"){
                  logService.logAction("READ_CONTRIBUTION");
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
            deleteContribution($scope,localStorageService, Contributions, logService);
            $uibModalInstance.dismiss('cancel');

        };

        $scope.getEtherpadReadOnlyUrl = Etherpad.getEtherpadReadOnlyUrl;

        $scope.openContributionPage = function(cID, edit)  {
            $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/contribution/"+cID+"?edit="+edit);
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

    }

});

appCivistApp.controller('ContributionModalCtrl',
    function ($scope, $uibModalInstance, $location, Upload, FileUploader, $timeout,
              contribution, assemblyID, campaignID, componentID, container, containerID, containerIndex,
              localStorageService, Contributions, Etherpad, $translate, logService) {
        init();
        verifyAuthorship($scope, localStorageService, Contributions);
        function init() {
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
                deleteContribution($scope,localStorageService, Contributions, logService);
                $uibModalInstance.dismiss('cancel');
            };

            $scope.postContribution = function (newContribution, targetSpaceId, targetSpace) {
                $scope.newContribution = newContribution;
                $scope.targetSpaceId = targetSpaceId;
                $scope.targetSpace = targetSpace;
                $scope.response = {};
                $scope.modalInstance = undefined;
                createNewContribution($scope, Contributions, logService);
            };

            $scope.postContributionFromModal = function () {
                $scope.targetSpaceId = $scope.component.resourceSpaceId;
                $scope.targetSpace = $scope.contributions;
                $scope.response = $scope.newContributionResponse;
                $scope.modalInstance = $uibModalInstance;
                createNewContribution($scope, Contributions, logService);
            };

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.getEtherpadReadOnlyUrl = Etherpad.getEtherpadReadOnlyUrl;

            $scope.openContributionPage = function(cID, edit)  {
                $location.url("/assembly/"+$scope.assemblyID+"/campaign/"+$scope.campaignID+"/contribution/"+cID+"?edit="+edit);
                $uibModalInstance.dismiss('cancel');
            };
        }
    });

appCivistApp.controller('ContributionCtrl', function($scope, $http, $routeParams, localStorageService,
													 FileUploader, Contributions, $translate) {

	init();
	verifyAuthorship($scope, localStorageService, Contributions);

	function init() {
        $scope.user = localStorageService.get("user");
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        if(!$scope.newContribution) {
			$scope.newContribution = Contributions.defaultNewContribution();
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
	}
});

appCivistApp.controller('ContributionPageCtrl', function($scope, $http, $routeParams, localStorageService,
                                                             Contributions, Campaigns, Assemblies, Etherpad,
                                                             WorkingGroups, $translate, logService) {
    init();

    // TODO: improve efficiency by using angularjs filters instead of iterating through arrays
    setCurrentAssembly($scope, localStorageService);
    setCurrentCampaign($scope, localStorageService);

    function init() {
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
            updateContribution($scope,Contributions, logService);
        }
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
        res.$promise.then(function(data) {
            $scope.contribution = data;
            localStorageService.set("currentContribution", $scope.contribution);
            $scope.themes = $scope.contribution.themes;
            $scope.comments = $scope.contribution.comments;
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
        });
    }
});

appCivistApp.controller('CommentsController', function($scope, $http, $routeParams, localStorageService,
													   Contributions, $translate, logService) {
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
			deleteContribution($scope, localStorageService, Contributions, logService);
		};
	}

	function initializeNewReplyModel() {
		$scope.newReply = Contributions.defaultNewContribution();
		$scope.newReply.type = "COMMENT";
	}
});

appCivistApp.controller('ContributionVotesCtrl', function($scope, $http, $routeParams, localStorageService,
														  Contributions, $translate, MakeVote, Ballot, VotesByUser, $rootScope) {
	init();

	function init() {

        $scope.user = localStorageService.get('user');
        $scope.currentCampaign = localStorageService.get('currentCampaign');
        if ($scope.user && $scope.user.language)
            $translate.use($scope.user.language);

        $scope.votes = $scope.contribution.stats.points;

        $scope.clearToggle = function () {
            $scope.yesToggle = $scope.noToggle = $scope.abstainToggle = $scope.blockToggle = "";
        }

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
        }

        $scope.listOfVotesByUser = $scope.ballotPaper ? $scope.ballotPaper.vote.votes : undefined;
        $scope.candidatesIndex = $scope.ballotPaper ? $scope.ballotPaper.ballot.candidatesIndex : undefined;

        if ($scope.listOfVotesByUser && $scope.candidatesIndex && $scope.contribution) {
            if ($scope.listOfVotesByUser[$scope.candidatesIndex[$scope.contribution.uuidAsString]]) {
                $scope.setToggle($scope.listOfVotesByUser[$scope.candidatesIndex[$scope.contribution.uuidAsString]].value);
            }
        }

        userAlreadyVotedInContribution();

        $scope.upVote = function () {
            if (!$scope.userAlreadyUpVoted) {
                if ($scope.userAlreadyDownVoted) {
                    $scope.contribution.stats.downs -= 1;
                } else {
                    $scope.contribution.stats.ups += 1;
                }

                var stats = $scope.contribution.stats;
                var voteRes = Contributions.updateStats(stats.contributionStatisticsId).update(stats);
                voteRes.$promise.then(
                    function (newStats) {
                        $scope.contribution.stats = newStats;
                        $scope.votes = $scope.contribution.stats.points;
                        if ($scope.userAlreadyDownVoted) {
                            saveUserVote(0);
                        } else {
                            saveUserVote(1);
                        }
                    },
                    function (error) {
                        $scope.contribution.stats.ups -= 1;
                    }
                );
            }
        };
        $scope.downVote = function () {
            if (!$scope.userAlreadyDownVoted) {
                if ($scope.userAlreadyUpVoted) {
                    $scope.contribution.stats.ups -= 1;
                } else {
                    $scope.contribution.stats.downs += 1;
                }
                var stats = $scope.contribution.stats;
                var voteRes = Contributions.updateStats(stats.contributionStatisticsId).update(stats);
                voteRes.$promise.then(
                    function (newStats) {
                        $scope.contribution.stats = newStats;
                        $scope.votes = $scope.contribution.stats.points;
                        if ($scope.userAlreadyUpVoted) {
                            saveUserVote(0);
                        } else {
                            saveUserVote(-1);
                        }
                    },
                    function (error) {
                        $scope.contribution.stats.downs -= 1;
                    }
                );
            }
        };

        $scope.contributionVote = function (c, type) {
            var userId = $scope.user.uuid;
            var ballotId = type=="BINDING" ? $scope.currentCampaign.bindingBallot : $scope.currentCampaign.consultiveBallot;
            var choice = c;
            var contributionId = $scope.contribution.uuidAsString;
            $scope.setToggle(choice);

            $scope.ballotResults = Ballot.results({uuid: $scope.currentCampaign.bindingBallot}).$promise;
            console.log(userId, type, ballotId, choice, contributionId);
            $scope.ballotResults.then(function (data) {
                var candidateId = data.index[contributionId].vote.candidate_id;

                var newVote = MakeVote.newVote(ballotId, userId).save({
                    vote: {
                        votes: [
                            {candidate_id: candidateId, value: choice}
                        ]
                    }
                }).$promise;
            }, function(error){
            });
        }
    }

    function userAlreadyVotedInContribution() {
        $scope.userVotes = localStorageService.get("userVotes");
        $scope.userAlreadyUpVoted = $scope.userVotes[$scope.contribution.contributionId] === 1;
        $scope.userAlreadyDownVoted = $scope.userVotes[$scope.contribution.contributionId] === -1;
    }

    function saveUserVote(vote) {
        $scope.userVotes[$scope.contribution.contributionId] = vote;
        localStorageService.set("userVotes", $scope.userVotes);
        userAlreadyVotedInContribution();
    }
});

appCivistApp.controller('AddAttachmentCtrl', function($scope, $http, $routeParams, localStorageService,
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
 *
 */

function createNewContribution (scope, Contributions, logService) {
	postingContributionFlag = true;
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
				postingContributionFlag = false;

                // Logging Usage
                var resourceId = data.uuid;
                var action = type == 'PROPOSAL' ?
                    'CREATE_PROPOSAL' : type == 'BRAINSTORMING' ?
                    'CREATE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                    'CREATE_COMMENT' : 'CREATE_CONTRIBUTION';
                logService.logAction(action, "CONTRIBUTION", resourceId);
			},
			function (error) {
				console.log("Error creating the contribution: " + angular.toJson(error.statusText));
				scope.response.hasErrors = true;
				scope.response.errors = error;
				scope.response.touched = !scope.response.touched;
				postingContributionFlag = false;
                // Logging Usage
                var action = type == 'PROPOSAL' ?
                    'CREATE_PROPOSAL' : type == 'BRAINSTORMING' ?
                    'CREATE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                    'CREATE_COMMENT' : 'CREATE_CONTRIBUTION';
                logService.logAction(action, "CONTRIBUTION", null);
			}
	);
}

function updateContribution(scope, Contributions, logService) {
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

function deleteContribution (scope, localStorageService, Contributions, logService) {
	var confirmed = confirm("Are you sure you want to delete this contribution?");
    if(scope.userIsAuthor && confirmed) {
		var deleteRes = Contributions.contributionSoftRemoval(scope.assemblyID, scope.contribution.contributionId).update();
        var type = scope.contribution.type;
        var resourceId = scope.contribution.uuid;
        var localScope = scope;
		deleteRes.$promise.then(
				function (response) {
                    localScope.container.splice(localScope.containerIndex,1);
					console.log("Contribution deleted");
                    // Log Actions
                    var action = type == 'PROPOSAL' ?
                        'DELETE_PROPOSAL' : type == 'BRAINSTORMING' ?
                        'DELETE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                        'DELETE_COMMENT' : 'DELETE_CONTRIBUTION';

                    logService.logAction(action, "CONTRIBUTION", resourceId);
                },
				function (error) {
					console.log("Contribution cannot be deleted: "+error.statusMessage);
                    // Log Actions
                    var action = type == 'PROPOSAL' ?
                        'DELETE_PROPOSAL' : type == 'BRAINSTORMING' ?
                        'DELETE_BRAINSTORMING_CONTRIBUTION' : type == 'COMMENT' ?
                        'DELETE_COMMENT' : 'DELETE_CONTRIBUTION';

                    logService.logAction(action, "CONTRIBUTION", null);
				}
		);
	}
}
