(function () {
  'use strict';

  /**
   * @name topbar-notifications
   * @memberof components
   *
   * @description
   *  Component that renders the notifications widget inside topbar.
   *
   * @example
   *
   *  <topbar-notifactions user="currentUser"></topbar-notifications>
   */
  appCivistApp
    .component('topbarNotifications', {
      selector: 'topbarNotifications',
      bindings: {
        /**
         * The current logged in user.
         * @type {Object}
         */
        user: '<'
      },
      controller: Ctrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/components/core/topbar-notifications/topbar-notifications.html'
    });

  Ctrl.$inject = [
    'Notifications', '$scope', 'Notify', '$timeout', '$http'
  ];

  function Ctrl(Notifications, $scope, Notify, $timeout, $http) {
    this.getUserStats = getUserStats.bind(this);
    this.getNotifications = getNotifications.bind(this);
    this.formatDate = formatDate.bind(this);
    this.readNotification = readNotification.bind(this);
    this.readAll = readAll.bind(this);
    this.currentPage = 0;
    this.notifications = [];
    this.pushQueue = [];
    this.stats = null;

    let pollTime = 60000;
    let errorCount = 0;
    let pollPromise = null;

    let self = this;

    /**
     * Initialization method.
     */
    this.$onInit = () => {
      $scope.$watch('vm.user', user => {
        if (!user) {
          return;
        }
        // this.getUserStats(user);
        pollData();
      });
    };

    /**
     * Destroy method
     */
    this.$onDestroy = () => {
      cancelNextPoll();
    }


    /**
     * Get users notifications stats.
     * @param {Object} user 
     */
    function getUserStats(user) {
      let rsp = Notifications.userStats(user.userId).get().$promise;
      rsp.then(
        stats => {
          self.stats = stats;
          self.getNotifications();
        },
        error => Notify.show('Error while trying to load user\'s notifications from the server', 'error')
      );
    }

    /**
     * Load notifications.
     */
    function getNotifications() {
      if (!this.stats || this.stats.pages === 0 || this.loading) {
        return;
      }
      this.loading = true;

      if (this.currentPage < this.stats.pages) {
        this.currentPage += 1;
        let rsp = Notifications.userNotifications(this.user.userId, this.currentPage).get().$promise;
        rsp.then(
          data => {
            self.notifications = self.notifications.concat(data.list);
            self.pushQueue = data.list.reverse();
            self.loading = false;
          },
          error => {
            self.loading = false;
            Notify.show('Error while trying to load user\'s notifications from the server', 'error');
          }
        );
      }
    }

    /**
     * Marks the notification as read.
     * 
     * @param {Object} notification 
     */
    function readNotification(notification, event) {
      event.preventDefault();
      event.stopPropagation();
      let rsp = Notifications.read(this.user.userId, notification.signal.id).update().$promise;
      rsp.then(
        response => {
          notification.read = true;
          self.getUserStats(self.user);
        },
        error => Notify.show('Error while trying to mark notification as read', 'error')
      );
    }

    /**
     * Marks all notifications as read.
     */
    function readAll() {
      event.preventDefault();
      event.stopPropagation();
      let rsp = Notifications.readAll(this.user.userId).update().$promise;
      rsp.then(
        response => {
          self.getUserStats(self.user);
          self.notifications.forEach(n => n.read = true);
        },
        error => Notify.show('Error while trying to mark notification as read', 'error')
      );
    }

    /**
     * Formats the given date to display in notifications dropdown.
     * 
     * @param {String} date 
     */
    function formatDate(date) {
      return moment(date, 'yyyy-MM-DD').format('YYYY-MM-DD');
    }

    /**
     * Poll the notifications data from server
     */
    function pollData() {
      getUserStats(self.user);
      nextLoad();
    }
    
    /**
     * Create timeout for poll
     */
    function nextLoad(time) {
      time = time || pollTime;
      cancelNextPoll();
      pollPromise = $timeout(pollData, time);
      self.repeats += 1;
    }

    /**
     * Destroy poll promise
     */
    function cancelNextPoll() {
      $timeout.cancel(pollPromise);
    }
  }
}());
