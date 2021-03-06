(function () {
    'use strict';

    /**
     * @name consent-modal
     * @memberof components
     *
     * @description
     *  Component that dispaly consent information.
     *
     * @example
     *
     *  <consent-modal></consent-modal>
     */
    appCivistApp
      .component('consentModal', {
        selector: 'consentModal',
        controller: ConsentModalCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/components/consent-modal/consent-modal.html',
        bindings: {
          campaign: '<',
          config: '<',
          assembly: '=',
          user: '<'
        }
      });

      ConsentModalCtrl.$inject = [
        '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', 'Space', '$state', '$stateParams',
        'LocaleService', '$rootScope', 'Assemblies', '$window', 'Utils', 'Memberships', '$timeout', 'Campaigns', '$sce',
        '$translate'
    ];

    function ConsentModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, Space, $state,
                              $stateParams, LocaleService, $rootScope, Assemblies, $window, Utils, Memberships,
                              $timeout, Campaigns, $sce, $translate) {

      let self = this;

      this.$postLink = () => {
          /*$timeout(() => {
            this.getCampaignParticipation();
          }, 5000);*/
      }

      this.$onInit = () => {
        this.showModal = false;
        this.consentText = null;
        this.userParticipation = null;
        this.agreeText = null;
        this.disagreeText = null;
        this.notificationText = null;

        $timeout(() => {
          this.getCampaignParticipation();
        }, 6000);
      }

      this.getConsentText = () => {
        return $sce.trustAsHtml(this.config ? this.config['appcivist.campaign.research-consent-text'] : null);
      }
      this.getAgreeText = () => {
        $translate("campaign.research-consent-approve").then(
          translation => {
            let customTranslation = self.config ? self.config['appcivist.campaign.research-consent-text-approve'] : null;
            self.agreeText = customTranslation ? customTranslation : translation;
          }
        );
      }
      this.getDisagreeText = () => {
        $translate("campaign.research-consent-reject").then(
          translation => {
            let customTranslation = self.config ? self.config['appcivist.campaign.research-consent-text-reject'] : null;
            self.disagreeText = customTranslation ? customTranslation : translation;
          }
        );
      }
      this.getNotificationText = () => {
        $translate("campaign.research-consent-notification").then(
          translation => {
            self.notificationText = translation;
          }
        );
      }

      this.getCampaignParticipation = () => {
        this.getAgreeText();
        this.getDisagreeText();
        this.getNotificationText();
        this.consentText = this.getConsentText();
        let assembly = this.assembly;
        let campaignId = this.campaign ? this.campaign.campaignId : $stateParams.cid;
        if (assembly && campaignId) {
          let rsp = Campaigns.consent(assembly, campaignId).get().$promise;
          rsp.then(
            consent => {
              self.userParticipation = consent;
              self.showModal = self.config && self.config['appcivist.campaign.research-consent-text'] && (self.userParticipation.userProvidedConsent == null || self.userParticipation.userProvidedConsent == false) ? true : false;
              if (self.showModal) {
                angular.element('#consentModal').modal({show: true, keyboard: false, backdrop: 'static'});
              } else {
                $rootScope.$broadcast('emailUpdate:check');
              }
            },
            error => {
              Notify.show(error.statusMessage, 'error');
            }
          );
        }
      }

      this.updateConsent = (consentText) => {
        this.userParticipation.userConsent = consentText == 'true' ? true : consentText  == true ? true : false;
        this.userParticipation.userProvidedConsent = true;
        let rsp = Campaigns.consent(this.assembly, this.campaign.campaignId, this.user.userId, consentText).update().$promise;
        rsp.then (
          consent => {
            Notify.show(self.notificationText, 'success')
            angular.element('#consentModal').modal('hide');
            $rootScope.broadcast('emailUpdate:check');
          },
          error => {
            Notify.show(error.statusMessage, 'error');
          }
        )
      }
    }
  }());
