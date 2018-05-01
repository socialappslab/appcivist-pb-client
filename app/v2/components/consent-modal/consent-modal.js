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
        '$scope', 'loginService', 'AppCivistAuth', 'Notify', 'localStorageService', 'Space', '$state', '$stateParams', 'LocaleService', '$rootScope', 'Assemblies', '$window', 'Utils', 'Memberships', '$timeout', 'Campaigns', '$sce', '$translate'
    ];
  
    function ConsentModalCtrl($scope, loginService, AppCivistAuth, Notify, localStorageService, Space, $state, $stateParams, LocaleService, $rootScope, Assemblies, $window, Utils, Memberships, $timeout, Campaigns, $sce, $translate) {

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
        }, 5000);
      }

      this.getConsentText = () => {
        return $sce.trustAsHtml(this.config['appcivist.campaign.research-consent-text']);
      }
      this.getAgreeText = () => {
        $translate("campaign.research-consent-approve").then(
          translation => {
            let customTranslation = self.config['appcivist.campaign.research-consent-text-approve'];
            self.agreeText = customTranslation ? customTranslation : translation;
          }
        );
      }
      this.getDisagreeText = () => {
        $translate("campaign.research-consent-reject").then(
          translation => {
            let customTranslation = self.config['appcivist.campaign.research-consent-text-reject'];
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
        let rsp = Campaigns.consent(this.assembly, this.campaign.campaignId).get().$promise;
        rsp.then(
          consent => {
            self.userParticipation = consent;
            self.showModal = self.config['appcivist.campaign.research-consent-text'] && (self.userParticipation.userProvidedConsent == null || self.userParticipation.userProvidedConsent == false) ? true : false;
            if (self.showModal) {
              angular.element('#consentModal').modal({show:true, keyboard:false, backdrop:'static'});
            }
          },
          error => {
            Notify.show(error.statusMessage, 'error');
          }
        )
      }

      this.updateConsent = (consentText) => {
        let rsp = Campaigns.consent(this.assembly, this.campaign.campaignId, this.user.userId, consentText).update().$promise;
        rsp.then (
          consent => {
            Notify.show(self.notificationText, 'success')
            angular.element('#consentModal').modal('hide');
          },
          error => {
            Notify.show(error.statusMessage, 'error');
          }
        )
      }
    }
  }());
  