(function () {
  'use strict';

  /** 
   * @name custom-field
   * @memberof directives
   * 
   * @description
   *  Component that renders an input/select element based on CustomFieldDefinition
   * 
   * @example
   * 
   *  <custom-field definition="vm.field" value="vm.fieldValue"></custom-field>
   */
  appCivistApp
    .component('customField', {
      selector: 'customField',
      bindings: {
        /**
         * CustomFieldDefinition object
         */
        definition: '<',

        /**
         * CustomFieldValue object
         */
        value: '=',

        /**
         * determines if custom field should be render in readonly mode or edition mode.
         * Values: readonly | edition. Defaults: edition.
         */
        renderer: '@'
      },
      controller: CustomFieldCtrl,
      controllerAs: 'vm',
      templateUrl: '/app/v2/partials/directives/custom-field.html'
    });

  CustomFieldCtrl.$inject = [
    'Notify', '$http', 'FileUploader', '$scope'
  ];

  function CustomFieldCtrl(Notify, $http, FileUploader, $scope) {
    let vm = this;
    this.checkType = checkType.bind(this);
    this.getFieldName = getFieldName.bind(this);
    this.uploadFiles = uploadFiles.bind(this);
    this.updateModel = updateModel.bind(this);
    this.isImage = isImage.bind(this);
    this.sync = sync.bind(this);
    this.initValueObject = initValueObject.bind(this);
    this.selectMultipleChoiceOption = selectMultipleChoiceOption.bind(this);

    this.$onInit = () => {
      this.imageExtensions = ['png', 'jpeg', 'jpg', 'gif', 'tiff'];
      this.checkType();

      // watcher for updating internal model.
      $scope.$watchCollection('vm.value', value => {
        if (!value) {
          return;
        }
        this.isUpdatingModel = true;
        this.updateModel(value);
        this.isUpdatingModel = false;
      });

      // watcher for updating custom-field value.
      $scope.$watchCollection('vm.model', value => {
        if (this.isUpdatingModel || !value) {
          return;
        }
        this.sync(value);
      });

      if (this.renderer) {
        this.isReadonly = this.renderer === 'readonly';
        this.isEdition = this.renderer === 'edition';
      } else {
        this.isEdition = true;
      }
    };

    function checkType() {
      const type = this.definition.fieldType;

      if (type === 'TEXT') {
        this.isText = true;
        this.isTextArea = parseInt(this.definition.limit) >= 200 || this.definition.limitType === 'WORDS';
      } else if (type === 'NUMBER') {
        this.isNumber = true;
      } else if (type === 'FILE') {
        this.isFile = true;
      } else if (type == 'MULTIPLE_CHOICE') {

        if (this.definition.limit === '1') {
          this.isSingleChoice = true;
        } else if (this.definition.limit === 'MULTIPLE') {
          this.isMultipleChoice = true;
          this.model = {};
        }
        // check for STRING_OPEN options
        angular.forEach(this.definition.customFieldValueOptions, option => option.isStringOpen = option.valueType === 'STRING_OPEN');
      }
    }


    function getFieldName(definition) {
      return `${definition.name}-${definition.customFieldDefinitionId}`;
    }


    /**
     * Uploads the selected file to the server
     * 
     * @param {Object} file - The file to upload
     */
    function uploadFiles(file) {
      Pace.start();
      var fd = new FormData();
      fd.append('file', file);
      $http.post(FileUploader.uploadEndpoint(), fd, {
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
      }).then(response => {
        this.model = { name: response.data.name, url: response.data.url };
        this.fileLoaded = true;
        this.fileIsImage = this.isImage(this.model.url);
        Pace.stop();
      }, error => {
        Notify.show('Error while uploading file to the server', 'error');
        Pace.stop();
      });
    }

    /**
     * Updates the custom-field component's internal model property.
     * 
     * @param {object} fieldValue - CustomFieldValue 
     */
    function updateModel(fieldValue) {
      let value = fieldValue.value;

      if (this.isFile) {
        const parts = value.split('/');
        this.model = { url: value, name: parts[parts.length - 1] };
        this.fileLoaded = true;
        this.fileIsImage = this.isImage(this.model.url);
      } else if (this.isText) {
        this.model = value;
      } else if (this.isNumber) {
        this.model = parseInt(value);
      }
    }

    /**
     * Determines if given URL is an image file.
     * 
     * @param {string} url 
     */
    function isImage(url) {
      const parts = url.split('.');
      let ext = parts[parts.length - 1];
      return this.imageExtensions.includes(ext.trim().toLowerCase());
    }

    /**
     * Updates the custom-field value property.
     * 
     * @param {string} value - internal model value 
     */
    function sync(value) {
      if (!this.value) {
        this.value = this.initValueObject(this.definition);
      }

      if (this.isFile) {
        this.value.value = value.url;
      } else if (this.isSingleChoice) {
        this.value.value = _.find(this.definition.customFieldValueOptions, { customFieldValueOptionId: parseInt(value) });
      } else if (this.isMultipleChoice) {
        this.value.value = _.filter(this.definition.customFieldValueOptions, option => this.model[option.customFieldValueOptionId]);
      } else {
        this.value.value = value;
      }
    }


    function initValueObject(definition) {
      return {
        customFieldDefinition: definition,
        value: ''
      };
    }

    /**
     * This callback gets called when the user clicks on a multiple choice option.
     * 
     * @param {Object[]} options
     * @param {Object} selectedOption 
     */
    function selectMultipleChoiceOption(options, selectedOption) {
      options.forEach(option => option.showInputText = false);
      selectedOption.showInputText = selectedOption.valueType === 'STRING_OPEN';
    }
  }
}())