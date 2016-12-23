appCivistApp.filter('capitalize', function() {
    return function(input, all) {
        var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
        var result = (!!input) ? input.replace(reg, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
        return result;
    }
});

appCivistApp.filter("ContributionsByTheme", function () {
    return function (contributions, themeTitle) {
        if(themeTitle === "") {
            return contributions;
        }
        var result  = [];
        for(var i=0;i<contributions.length;i++){
            var c = contributions[i];
            var themes = c.themes;
            if (themes) {
                for (var j = 0; j < themes.length; j++) {
                    var t = themes[j];
                    if (t.title === themeTitle) {
                        result.push(contributions);
                        break;
                    }
                }
            }
        }
        return result;
    };
});

//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
appCivistApp.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

appCivistApp.filter('titlecase', function() {
    return function(s) {
        s = ( s === undefined || s === null ) ? '' : s;
        return s.toString().toLowerCase().replace( /\b([a-z])/g, function(ch) {
            return ch.toUpperCase();
        });
    };
});
