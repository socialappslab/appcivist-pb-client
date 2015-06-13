/**
 * AppCivist Graphical Directives
 *
 * Directives related with graphical drawing
 */

appCivistApp.directive('bubbleChart', function () {
    return {
        restrict: 'C',
        replace: true,
        controller: ['$scope', '$filter', function ($scope, $filter) {
            var bubbleChart = new d3.svg.BubbleChart({
                supportResponsive: true,
                //container: => use @default
                size: 115,
                //viewBoxSize: => use @default
                innerRadius: 100 / 3.5,
                //outerRadius: => use @default
                radiusMin: 20,
                //radiusMax: use @default
                //intersectDelta: use @default
                //intersectInc: use @default
                //circleColor: use @default
                data: {
                    items: [
                        {text: "Qs", count: $scope.questions},
                        {text: "Comments", count: $scope.comments},
                        {text: "Ideas", count: $scope.ideas},
                        {text: "Issues", count: $scope.issues}
                    ],
                    eval: function (item) {return item.count;},
                    classed: function (item) {return item.text.split(" ").join("");}
                },
                plugins: [
                    {
                        name: "lines",
                        options: {
                            format: [
                                {// Line #0
                                    textField: "count",
                                    classed: {count: true},
                                    style: {
                                        "font-size": "8px",
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
                                        "font-size": "6px",
                                        "font-family": "Source Sans Pro, sans-serif",
                                        "text-anchor": "middle",
                                        fill: "white"
                                    },
                                    attr: {
                                        dy: "10px",
                                        x: function (d) {return d.cx;},
                                        y: function (d) {return d.cy;}
                                    }
                                }
                            ],
                            centralFormat: [
                                {// Line #0
                                    style: {"font-size": "10px"},
                                    attr: {}
                                },
                                {// Line #1
                                    style: {"font-size": "8px"},
                                    attr: {dy: "10px"}
                                }
                            ]
                        }
                    }]
            });
        }]
    }
});

appCivistApp.directive('phase', function(){
    /*
    var random = Math.floor((Math.random() * 10000) +1)
    var listPhases = [
        {brainstorming:[{start:'stop-color:#408499;stop-opacity:1;'},{end:'stop-color:#408499;stop-opacity:0;'}]},
        {proposalMaking:[{start:'stop-color:#8f578a;stop-opacity:1;'},{end:'stop-color:#8f578a;stop-opacity:0;'}]},
        {deliberation:[{start:'stop-color:#f3882d;stop-opacity:1;'},{end:'stop-color:#f3882d;stop-opacity:0;'}]},
        {voting:[{start:'stop-color:#3cb566;stop-opacity:1;'},{end:'stop-color:#3cb566;stop-opacity:0;'}]}];

    var template = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="42.830368mm" height="12.175874mm" viewBox="0 0 151.76115 43.142859" id="svg1">' +
                        '<defs id="defs1">' +
                            '<linearGradient inkscape:collect="always" id="linearGradient">' +
                                '<stop style="stop-color:#408499;stop-opacity:1;" offset="0" id="stop" />' +
                                '<stop style="stop-color:#408499;stop-opacity:0;" offset="1" id="stop" />' +
                            '</linearGradient>' +
                            '<linearGradient inkscape:collect="always" xlink:href="#linearGradient" id="linearGradient4217" x1="355" y1="282.36221" x2="354.28574" y2="2.3622026" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0.80035079,0,0,0.90963856,-259.04444,-738.49144)" />' +
                        '</defs>' +
                        '<sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="5.6" inkscape:cx="67.004489" inkscape:cy="11.093026" inkscape:document-units="px" inkscape:current-layer="svg1" showgrid="false" inkscape:window-width="1680" inkscape:window-height="939" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="1" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0" />' +
                            '<g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="matrix(0.34410558,0,0,0.3140965,62.778274,194.14006)">' +
                                '<path style="fill:url(#linearGradient4217);fill-opacity:1" d="m -182.43899,-618.09047 0,137.35542 377.83123,0 0.0484,0 0,-0.0533 63.15112,-68.62441 -63.15112,-68.62442 0,-0.0533 -0.0484,0 -377.83123,0 z" id="rect4194" inkscape:connector-curvature="0" />' +
                                '<flowRoot xml:space="preserve" id="flowRoot4219" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">' +
                                    '<flowRegion id="flowRegion4221">' +
                                        '<rect id="rect4223" width="375" height="49.285713" x="139.28572" y="182.3622" />' +
                                    '</flowRegion>' +
                                    '<flowPara id="flowPara4225">' + '</flowPara>' +
                                '</flowRoot>' +
                                '<text xml:space="preserve" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x="167.14285" y="206.64792" id="text4227" sodipodi:linespacing="125%">' +
                                    '<tspan sodipodi:role="line" id="tspan4229" x="167.14285" y="206.64792" />'+
                                '</text>' +
                                '<flowRoot xml:space="preserve" id="flowRoot4231" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1">' +
                                    '<flowRegion id="flowRegion4233">' +
                                        '<rect id="rect4235" width="403.57141" height="42.142857" x="115" y="165.93364" />' +
                                    '</flowRegion>' +
                                    '<flowPara id="flowPara4237">PBb</flowPara>' +
                                '</flowRoot>' +
                                '<text xml:space="preserve" style="font-style:normal;font-weight:normal;font-size:40px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x="-153.15384" y="-535.77191" id="text4243" sodipodi:linespacing="125%">' +
                                    '<tspan sodipodi:role="line" id="tspan4245" x="-153.15384" y="-535.77191">Brainstorming</tspan>' +
                                '</text>' +
                            '</g>' +
                    '</svg>';
                    */
    return {
        replace: true,
        templateUrl : 'app/partials/phase.html',
        controller: ['$scope', '$filter', function ($scope, $filter) {

        }]
    }
});