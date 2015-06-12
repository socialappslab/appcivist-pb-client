/**
 * AppCivist Graphical Directives
 *
 * Directives related with graphical drawing
 */

appCivistApp.directive('bubbles', function () {
    return {
        //restrict: 'A',  // This means that it will be used as an attribute and NOT as an element.
        // I don't like creating custom HTML elements
        replace: true,
        //templateUrl: "/app/partials/footer.html",
        controller: ['$scope', '$filter', function ($scope, $filter) {
            var bubbleChart = new d3.svg.BubbleChart({
                supportResponsive: true,
                //container: => use @default
                size: 600,
                //viewBoxSize: => use @default
                innerRadius: 600 / 3.5,
                //outerRadius: => use @default
                radiusMin: 50,
                //radiusMax: use @default
                //intersectDelta: use @default
                //intersectInc: use @default
                //circleColor: use @default
                data: {
                    items: [
                        {text: "Java", count: "236"},
                        {text: ".Net", count: "382"},
                        {text: "Php", count: "170"},
                        {text: "Ruby", count: "123"},
                        {text: "D", count: "12"},
                        {text: "Python", count: "170"},
                        {text: "C/C++", count: "382"},
                        {text: "Pascal", count: "10"},
                        {text: "Something", count: "170"},
                    ],
                    eval: function (item) {return item.count;},
                    classed: function (item) {return item.text.split(" ").join("");}
                },
                plugins: [
                    {
                        name: "central-click",
                        options: {
                            text: "(See more detail)",
                            style: {
                                "font-size": "12px",
                                "font-style": "italic",
                                "font-family": "Source Sans Pro, sans-serif",
                                //"font-weight": "700",
                                "text-anchor": "middle",
                                "fill": "white"
                            },
                            attr: {dy: "65px"},
                            centralClick: function() {
                                alert("Here is more details!!");
                            }
                        }
                    },
                    {
                        name: "lines",
                        options: {
                            format: [
                                {// Line #0
                                    textField: "count",
                                    classed: {count: true},
                                    style: {
                                        "font-size": "28px",
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "white"
                                    },
                                    attr: {
                                        dy: "0px",
                                        x: function (d) {return d.cx;},
                                        y: function (d) {return d.cy;}
                                    }
                                },
                                {// Line #1
                                    textField: "text",
                                    classed: {text: true},
                                    style: {
                                        "font-size": "14px",
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "white"
                                    },
                                    attr: {
                                        dy: "20px",
                                        x: function (d) {return d.cx;},
                                        y: function (d) {return d.cy;}
                                    }
                                }
                            ],
                            centralFormat: [
                                {// Line #0
                                    style: {"font-size": "50px"},
                                    attr: {}
                                },
                                {// Line #1
                                    style: {"font-size": "30px"},
                                    attr: {dy: "40px"}
                                }
                            ]
                        }
                    }]
            });
        }]
    }
});