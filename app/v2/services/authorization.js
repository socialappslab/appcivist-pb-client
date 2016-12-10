(function () {
  'use strict';
  /**
   * wrapper for Authorization.
   */
  appCivistApp
    .factory('Authorization', Authorization);

  Authorization.$inject = ['localStorageService'];

  function Authorization(localStorageService) {

    return {
      authorize: authorize,
      enums: {
        LOGIN_REQUIRED: 'loginRequired',
        NOT_AUTHORIZED: 'notAuthorized',
        AUTHORIZED: 'authorized'
      }
    };

    /**
     * Helper method that determines whether the current user is
     * authorized based on the loginRequired parameter.
     *
     * @param {boolean} loginRequired
     */
    function authorize(loginRequired) {
      var user = localStorageService.get('user');

      if (loginRequired === true) {
        if (!user) {
          return this.enums.LOGIN_REQUIRED;
        }
        return this.enums.AUTHORIZED;
      } else {
        return this.enums.NOT_AUTHORIZED;
      }
    };
  }
} ());
