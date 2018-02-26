(function () {
    'use strict';
  
    /**
     * @name motivationalMessages
     * @memberof components
     *
     * @description
     *  Component that renders main motivational messages.
     *
     * @example
     *
     *  <motivational></motivational>
     */
    appCivistApp
      .component('motivational', {
        selector: 'motivational',
        bindings: {
            // values = { 'commentbox', 'attachments', 'contributing', 'follow' }
            page: '@',
            resource: '='
        },
        controller: MotivationalCtrl,
        controllerAs: 'vm',
        templateUrl: '/app/v2/components/motivational-messages/motivational-messages.html'
      });
  
      MotivationalCtrl.$inject = [
        '$scope', '$translate', 'localStorageService', 'LocaleService', 'Notify'
    ];
  
    function MotivationalCtrl($scope, $translate, localStorageService, LocaleService, Notify) {

        let commentBoxMessages = ['motivational.commentbox.message1', 'motivational.commentbox.message2', 'motivational.commentbox.message3', 'motivational.commentbox.message4', 'motivational.commentbox.message5', 'motivational.commentbox.message6'];
        let contributingMessages = ['motivational.contributing.message1', 'motivational.contributing.message2', 'motivational.contributing.message3'];
        let attachmentsMessages = ['motivational.attachments.message1', 'motivational.attachments.message2', 'motivational.attachments.message3', 'motivational.attachments.message4'];
        let followMessages = ['motivational.follow.message1', 'motivational.follow.message2', 'motivational.follow.message3'];
        // campaign => 1. comentarios, 2. subscribe, 3. contributions (if editing enabled, current component es proposals o ideas)
        // working group => igual que campaign + 4. invite members
        // contribution => 1. comentarios, 2. attachments, 3. authors, 4. contributing, 5. follow, 6. si es proposal y no tiene doc, add doc

        this.$onInit = () => {
            setTimeout(() => {
                switch (this.page) {
                    case 'campaign':
                        break;
                    case 'wg':
                        break;
                    case 'contribution':
                        break;
                }
                $scope.message = _.sample(commentBoxMessages);
                document.getElementsByTagName('motivational')[0].classList.add('show');
            }, 10000)
        }

        this.hideMessage = () => {
            document.getElementsByTagName('motivational')[0].classList.remove('show');
        }

        this.turnOff = () => {
            let turnoff = confirm('Are you sure you don\'t want to receive this suggestions anymore?');
            if (turnoff) {
                // TODO: turn off in profile
                this.hideMessage();
                Notify.show('You won\'t see more suggestions', 'success');
            }
        }
    }
  
  }());
  