/**
 * Created by cdparra on 11/11/15.
 */


'use strict';

appCivistApp.directive('multiSliderDates', function ($compile, $timeout) {
    var events = {
        mouse: {
            start: 'mousedown',
            move: 'mousemove',
            end: 'mouseup'
        },
        touch: {
            start: 'touchstart',
            move: 'touchmove',
            end: 'touchend'
        }
    };

    function roundStep(value, precision, step, floor) {
        var remainder = (value - floor) % step;
        var steppedValue = remainder > (step / 2) ? value + step - remainder : value - remainder;
        var decimals = Math.pow(10, precision);
        var roundedValue = steppedValue * decimals / decimals;
        return parseFloat(roundedValue.toFixed(precision));
    }

    function offset(element, position) {
        return element.css({
            left: position
        });
    }

    function pixelize(position) {
        return parseInt(position) + "px";
    }

    function contain(value) {
        if (isNaN(value)) return value;
        return Math.min(Math.max(0, value), 100);
    }

    return {
        restrict: 'EA',
        require: '?ngModel',
        scope: {
            floor: '@',
            floorDate: '@',
            floorDateMoment: '@',
            ceiling: '@',
            ceilingDate: '@',
            ceilingDateMoment: '@',
            step: '@',
            precision: '@',
            bubbles: '@',
            sliders: '=ngModel',
            update: '=',
            overlapping: '@'
        },
        //templateUrl : "/app/partials/directives/angular-multi-slider-dates/multiSliderBar.html",
        template: '<div class="bar"></div>' +
            //'<div class="limit floor">{{ moment(floorDate).format("YYYY-MM-DD") }}</div>' +
            //'<div class="limit ceiling">{{ moment(ceilingDate).format("YYYY-MM-DD") }}</div>',
        '<div class="limit floor">{{floorDateMoment.format("YYYY-MM-DD")}}</div>' +
        '<div class="limit floor">{{ceilingDateMoment.format("YYYY-MM-DD")}}</div>',


        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) return; // do nothing if no ng-model

            //base copy to see if sliders returned to original
            var original;

            ngModel.$render = function () {
                original = angular.copy(scope.sliders);
            };

            element.addClass('angular-multi-slider');

            // DOM Components
            var sliderStr = '';
            angular.forEach(scope.sliders, function (slider, key) {
                sliderStr += ('<div class="handle"><strong>' + (key + 1) + '</strong></div><div class="bubble">{{ sliders[' + key.toString() + '].title}}: {{sliders[' + key.toString() + '].date}} </div>');
            });
            var sliderControls = angular.element(sliderStr);
            element.append(sliderControls);
            $compile(sliderControls)(scope);


            var children = element.children();
            var bar = angular.element(children[0]),
                ngDocument = angular.element(document),
                floorBubble = angular.element(children[1]),
                ceilBubble = angular.element(children[2]),
                bubbles = [],
                handles = [];

            //var sliderChildren = sliderControls.children();
            angular.forEach(scope.sliders, function (slider, key) {
                handles.push(angular.element(children[(key * 2) + 3]));
                bubbles.push(angular.element(children[(key * 2) + 4]));
            });

            // Control Dimensions Used for Calculations
            var handleHalfWidth = 0,
                barWidth = 0,
                minOffset = 0,
                maxOffset = 0,
                minValue = 0,
                maxValue = 0,
                valueRange = 0,
                offsetRange = 0;

            if (scope.step === undefined) scope.step = 1;
            if (scope.floor === undefined) scope.floor = 0;
            if (scope.ceiling === undefined) scope.ceiling = 500;
            if (scope.precision === undefined) scope.precision = 0;
            if (scope.bubbles === undefined) scope.bubbles = false;
            if (scope.overlapping === undefined) scope.overlapping = true;
            if (scope.floorDate === undefined) scope.floorDate = moment().add(scope.floor, 'd').toDate();
            if (scope.ceilingDate === undefined) scope.ceilingDate = moment(scope.floorDate).add(scope.ceiling, 'd').toDate();

            scope.floorDateMoment = moment(scope.floorDate);
            scope.ceilingDateMoment = moment(scope.ceilingDate);
            var bindingsSet = false;

            var updateCalculations = function () {
                scope.floor = roundStep(parseFloat(scope.floor), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                scope.ceiling = roundStep(parseFloat(scope.ceiling), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                scope.floorDate = moment().add(scope.floor, 'd').toDate();
                scope.ceilingDate = moment(scope.floorDate).add(scope.ceiling, 'd').toDate();
                scope.floorDateMoment = moment(scope.floorDate);
                scope.ceilingDateMoment = moment(scope.ceilingDate);

                angular.forEach(scope.sliders, function (slider) {
                    // prevent handles to have a value bigger than the next in the array
                    slider.value = roundStep(parseFloat(slider.value), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                    slider.date = moment(slider.floorDate).add(slider.value, 'd').toDate();
                    slider.dateMoment = moment(slider.date);
                });

                handleHalfWidth = handles[0][0].offsetWidth / 2;
                barWidth = bar[0].offsetWidth;
                minOffset = 0;
                maxOffset = barWidth - handles[0][0].offsetWidth;
                minValue = parseFloat(scope.floor);
                maxValue = parseFloat(scope.ceiling);
                valueRange = maxValue - minValue;
                offsetRange = maxOffset - minOffset;
            };

            var updateDOM = function () {
                updateCalculations();

                var percentOffset = function (offset) {
                    return contain(((offset - minOffset) / offsetRange) * 100);
                };

                var percentValue = function (value) {
                    return contain(((value - minValue) / valueRange) * 100);
                };

                var pixelsToOffset = function (percent) {
                    return pixelize(percent * offsetRange / 100);
                };

                var setHandles = function () {
                    offset(ceilBubble, pixelize(barWidth - ceilBubble[0].offsetWidth));
                    angular.forEach(scope.sliders, function (slider, key) {
                        if (slider.color) {
                            handles[key].css({"background-color": slider.color});
                        }

                        offset(handles[key], pixelsToOffset(percentValue(slider.value)));
                        offset(bubbles[key], pixelize(handles[key][0].offsetLeft - (bubbles[key][0].offsetWidth / 2) + handleHalfWidth));
                    });
                };

                var bind = function (handle, bubble, currentRef, events) {
                    var onEnd = function () {
                        handle.removeClass('grab');
                        bubble.removeClass('grab');
                        if (!('' + scope.bubbles === 'true')) {
                            bubble.removeClass('active');
                        }

                        ngDocument.unbind(events.move);
                        ngDocument.unbind(events.end);

                        if (angular.equals(scope.sliders, original)) {
                            ngModel.$setPristine();
                        }

                        scope.$apply();
                    };

                    var onMove = function (event) {
                        // Suss out which event type we are capturing and get the x value
                        var eventX = 0;
                        if (event.clientX !== undefined) {
                            eventX = event.clientX;
                        }
                        else if (event.touches !== undefined && event.touches.length) {
                            eventX = event.touches[0].clientX;
                        }
                        else if (event.originalEvent !== undefined &&
                            event.originalEvent.changedTouches !== undefined &&
                            event.originalEvent.changedTouches.length) {
                            eventX = event.originalEvent.changedTouches[0].clientX;
                        }

                        var newOffset = Math.max(Math.min((eventX - element[0].getBoundingClientRect().left - handleHalfWidth), maxOffset), minOffset),
                            newPercent = percentOffset(newOffset),
                            newValue = minValue + (valueRange * newPercent / 100.0);

                        newValue = roundStep(newValue, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));

                        // make sure handles never go beyond the next or the previous if overlapping is not true
                        if (scope.overlapping === 'false') {
                            if (currentRef === (scope.sliders.length - 1)) {
                                if (newValue > scope.ceiling) {
                                    newValue = scope.ceiling;
                                } else if (newValue < scope.sliders[currentRef - 1].value) {
                                    newValue = scope.sliders[currentRef - 1].value + 1;
                                }
                            } else if (currentRef === 0) {
                                if (newValue < scope.floor) {
                                    newValue = scope.floor;
                                } else if (newValue > scope.sliders[currentRef + 1].value) {
                                    newValue = scope.sliders[currentRef + 1].value - 1;
                                }
                            } else {
                                if (newValue >= scope.sliders[currentRef + 1].value) {
                                    newValue = scope.sliders[currentRef + 1].value - 1;
                                } else if (newValue < scope.sliders[currentRef - 1].value) {
                                    newValue = scope.sliders[currentRef - 1].value + 1;
                                }
                            }
                        }

                        scope.sliders[currentRef].value = newValue;
                        scope.sliders[currentRef].date = moment(scope.floorDate).add(newValue, 'd').toDate();
                        setHandles();
                        ngModel.$setDirty();
                        scope.$apply();
                    };

                    var onStart = function (event) {
                        updateCalculations();
                        bubble.addClass('active grab');
                        handle.addClass('active grab');
                        setHandles();
                        event.stopPropagation();
                        event.preventDefault();
                        ngDocument.bind(events.move, onMove);
                        return ngDocument.bind(events.end, onEnd);
                    };

                    handle.bind(events.start, onStart);
                };

                var setBindings = function () {
                    var method, i;
                    var inputTypes = ['touch', 'mouse'];
                    for (i = 0; i < inputTypes.length; i++) {
                        method = inputTypes[i];
                        angular.forEach(scope.sliders, function (slider, key) {
                            bind(handles[key], bubbles[key], key, events[method]);
                        });
                    }

                    bindingsSet = true;
                };

                if (scope.update === true || scope.update === "true") {
                    scope.update = false;
                    bindingsSet = false;
                }

                if (!bindingsSet) {
                    setBindings();

                    // Timeout needed because bubbles offsetWidth is incorrect during initial rendering of html elements
                    setTimeout(function () {
                        if ('' + scope.bubbles === 'true') {
                            angular.forEach(bubbles, function (bubble) {
                                bubble.addClass('active');
                            });
                        }
                        //added this for tab 1...
                        updateCalculations();
                        setHandles();
                    }, 1);
                }

            };

            // Watch Models based on mode
            scope.$watch('sliders', updateDOM);
            scope.$watch(function () {
                return scope.update
            }, updateDOM, true);
            //scope.$watch('ceiling', updateDOM, true);

            // Update on Window resize
            window.addEventListener('resize', updateDOM);
        }
    }
});