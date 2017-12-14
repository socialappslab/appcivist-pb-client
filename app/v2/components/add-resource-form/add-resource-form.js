'use strict';

(function () {
  'use strict';

  /**
   * @name associatedContributions
   * @memberof components
   *
   * @description
   *  Component that renders allows to search for ideas and associate them to a resource space.
   *
   * @example
   *
   *  <associated-ideas></associated-ideas>
   */

  appCivistApp.component('addResourceForm', {
    selector: 'addResourceForm',
    bindings: {
      resources: '=',
      spaceId: '=',
      includeAddButtons: '='
    },
    controller: addResourceFormCtrl,
    controllerAs: 'vm',
    templateUrl: '/app/v2/components/add-resource-form/add-resource-form.html'
  });

  addResourceFormCtrl.$inject = ['$scope','Space', 'usSpinnerService', 'Contributions', 'Notify', '$http', 'FileUploader'];

  function addResourceFormCtrl($scope, Space, usSpinnerService, Contributions, Notify, $http, FileUploader) {
    this.activate = activate.bind(this);

    /**
     * Initialization method.
     */
    this.$onInit = () => {
      $scope.$watch('vm.spaceId', spaceId => {
        if (!spaceId ) {
          return;
        }
        this.activate();
      });
    };

    function activate() {
      this.startSpinner = startSpinner.bind(this);
      this.stopSpinner = stopSpinner.bind(this);
      this.submitAttachment = submitAttachment.bind(this);
      this.submitAttachmentByUrl = submitAttachmentByUrl.bind(this);
      this.sanitizeVideoResourceUrl = sanitizeVideoResourceUrl.bind(this);
      this.createAttachmentResource = createAttachmentResource.bind(this);
      this.toggleOpenAddAttachment = toggleOpenAddAttachment.bind(this);
      this.toggleOpenAddAttachmentByUrl = toggleOpenAddAttachmentByUrl.bind(this);
      this.addedResourceToSpaceSuccess = addedResourceToSpaceSuccess.bind(this);
      this.addedResourceToSpaceError = addedResourceToSpaceError.bind(this);
      this.fileUploadedSuccess = fileUploadedSuccess.bind(this);

      this.spinnerOptions = {
        radius:10,
        width:4,
        length: 10,
        top: '75%',
        left: '50%',
        zIndex: 1
      };
        $scope.$on('AddResourceForm:ToggleOpenAddAttachment',
        (event) => {
          this.toggleOpenAddAttachment();
        }
      );
      $scope.$on('AddResourceForm:ToggleOpenAddAttachmentByUrl',
        (event) => {
          this.toggleOpenAddAttachmentByUrl();
        }
      );
    }

    function startSpinner () {
      this.spinnerActive = true;
      usSpinnerService.spin('add-resource-form');
    }

    function stopSpinner () {
      usSpinnerService.stop('add-resource-form');
      this.spinnerActive = false;
    }

    /**
     * Upload the given file to the server. Also, attachs it to
     * the current contribution.
     */
    function submitAttachment() {
      this.startSpinner();
      var fd = new FormData();
      fd.append('file', this.newAttachment.file);
      $http.post(FileUploader.uploadEndpoint(), fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
      }).then(this.fileUploadedSuccess, function (error) {
        Notify.show('Error while uploading file to the server', 'error');
      });
    }

    function fileUploadedSuccess(response) {
      let resource = {
        name: response.data.name,
        url: response.data.url,
        description: this.newAttachment.description,
        title: this.newAttachment.title
      }
      this.createAttachmentResource(resource, true);
    }

    /**
     * Upload the given file to the server. Also, attachs it to
     * the current contribution.
     */
    function submitAttachmentByUrl() {
      this.startSpinner();
      let resource = {
        name: this.newAttachment.title,
        title: this.newAttachment.title,
        description: this.newAttachment.description,
        url: this.newAttachment.url,
        isTemplate: this.newAttachment.isTemplate
      };
      this.createAttachmentResource(resource, false);
    }

    function sanitizeVideoResourceUrl(url) {
      let ytRegex = (/(http|https):\/\/(youtube\.com|www\.youtube\.com|youtu\.be)/);
      let vimeoRegex = (/(http|https):\/\/(vimeo\.com|www\.vimeo\.com)/);
      let vimeoEmbedRegex = (/(http|https):\/\/(player\.vimeo\.com)/);

      if (ytRegex.test(url)) {
        return url.replace('watch?v=', 'embed/');
      } else if (vimeoRegex.test(url) && !vimeoEmbedRegex.test(url)) {
        return url.replace('vimeo.com','player.vimeo.com/video');
      } else {
        return url;
      }
    }

    /**
     * After the file has been uploaded, we should relate it with the contribution.
     *
     * @param {string} url - The uploaded file's url.
     */
    function createAttachmentResource(resource, isNewUploadedFile) {
      this.attachmentFlags = {
        isPicture: false,
        isVideo: false,
        isNewUploadedFile: isNewUploadedFile
      }

      let pictureRegex = (/(gif|jpg|jpeg|tiff|png)$/i);
      let videoRegex = (/(gif|jpg|jpeg|tiff|png)$/i);
      let onlineVideoRegex = (/(http|https):\/\/(youtube\.com|www\.youtube\.com|youtu\.be|vimeo\.com|www\.vimeo\.com)/);

      let fileTypeContainingString = resource.name; // If
      let resourceName = resource.name;
      let resourceUrl = resource.url;
      let resourceTitle = resource.title;
      let resourceDescription = resource.description;
      let resourceIsTemplate = resource.isTemplate;

      let isPicture = false;
      let isVideo = false;
      let rType = "FILE";

      if (isNewUploadedFile) {
        fileTypeContainingString = this.newAttachment.file.type;
        resourceName = this.newAttachment.name;
        isPicture = pictureRegex.test(fileTypeContainingString);
        if (!isPicture)
          isVideo = videoRegex.test(fileTypeContainingString);
      } else {
        // If is not a new attachment and the resource is added by URL
        // see if it is not a youtube or vimeo video
        isVideo = onlineVideoRegex.test(resourceUrl);
        if (!isVideo)
          isPicture = pictureRegex.test(fileTypeContainingString);
        if (!isPicture && !isVideo)
          isVideo = videoRegex.test(fileTypeContainingString);
      }

      rType = isPicture ? "PICTURE" : isVideo ? "VIDEO" : "FILE";

      this.attachmentFlags = {
        isPicture: isPicture,
        isVideo: isVideo,
        isNewUploadedFile: isNewUploadedFile
      }
      var attachment = Contributions.newAttachmentObject({
        url: resourceUrl,
        name: resourceName,
        resourceType: rType,
        title: resourceTitle,
        description: resourceDescription,
        isTemplate: resourceIsTemplate
      });
      var rsp = Space.resources(this.spaceId).save(attachment).$promise;

      rsp.then(this.addedResourceToSpaceSuccess, this.addedResourceToSpaceError);
    }

    function addedResourceToSpaceSuccess(response) {
      var type = "Attachments";
      if (!this.attachmentFlags.isPicture && !this.attachmentFlags.isVideo) {
        // if (!this.resources.documents)
        //   this.resources.documents = [];
        // this.resources.documents.push(response);
        this.openAddAttachment = false;
      } else {
        // if (!this.resources.media)
        //   this.resources.media = [];
        // this.resources.media.push(response);
        type = "Media";
        // if (this.attachmentFlags.isPicture) {
          // if (!this.resources.pictures)
          //   this.resources.pictures = [];
          // this.resources.pictures.push(response);
        // }
      }
      this.resources.push(response);

      if (this.attachmentFlags.isNewUploadedFile) {
        this.openAddAttachment = false;
      } else {
        this.openAddAttachmentByUrl = false;
      }

      Notify.show('Attachment saved!. You can see it under "'+type+'"', 'success');
      this.stopSpinner();
      $scope.$emit('FromAddResourceForm:AddedResourceSuccess');
    }

    function addedResourceToSpaceError(error) {
      Notify.show('Error while uploading file to the server: '+JSON.stringify(error), 'error');
      this.stopSpinner();
      $scope.$emit('FromAddResourceForm:AddedResourceError');
    }

    function toggleOpenAddAttachment () {
      this.openAddAttachment = !this.openAddAttachment;
      $scope.$emit('FromAddResourceForm:ToggleOpenAddAttachment');

    }

    function toggleOpenAddAttachmentByUrl () {
      this.openAddAttachment = !this.openAddAttachment;
      this.openAddAttachmentByUrl = !this.openAddAttachmentByUrl;
      $scope.$emit('FromAddResourceForm:ToggleOpenAddAttachmentByUrl');
    }
  }
})();
