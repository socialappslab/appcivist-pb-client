/**
 * Created by cdparra on 11/18/15.
 * Based on http://cdn.rawgit.com/cornflourblue/angular-registration-login-example/master/app-services/flash.service.js
 */

appCivistApp.factory('FlashService', FlashService);

FlashService.$inject = ['$rootScope'];

function FlashService($rootScope) {
    var service = {};

    service.Success = Success;
    service.Error = Error;
    service.ErrorWithModal = ErrorWithModal;
    service.SuccessWithModal = SuccessWithModal;

    initService();

    return service;

    function initService() {
        $rootScope.$on('$locationChangeStart', function () {
            clearFlashMessage();
        });

        function clearFlashMessage() {
            var flash = $rootScope.flash;
            if (flash) {
                if (!flash.keepAfterLocationChange) {
                    delete $rootScope.flash;
                } else {
                    // only keep for a single location change
                    flash.keepAfterLocationChange = false;
                }
            }
        }
    }

    function Success(message, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'success',
            keepAfterLocationChange: keepAfterLocationChange
        };
    }

    function Error(message, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'error',
            keepAfterLocationChange: keepAfterLocationChange
        };
    }

    function SuccessWithModal(title, message, messageExtra, allowCancelOption, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'success',
            keepAfterLocationChange: keepAfterLocationChange
        };
        $rootScope.showAlert(title, message, messageExtra, allowCancelOption);
    }

    function ErrorWithModal(message, resourceType, resourceId, statusCode, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'error',
            keepAfterLocationChange: keepAfterLocationChange
        };
        var error = {responseStatus: statusCode, statusMessage: message};
        $rootScope.showError(error, resourceType, resourceId);
    }
}