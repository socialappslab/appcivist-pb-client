appCivistApp.filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});


appCivistApp.filter("ContributionsByTheme", function ()
{
    return function (contributions, themeTitle)
    {
        if(themeTitle === "") {
            return contributions;
        }
        var result  = [];
        for(var i=0;i<contributions.length;i++){
            var c = contributions[i];
            var themes = contributions.themes;
            if (themes) {
                for (var j = 0; j < themes.length; j++) {
                    var t = theme[j];
                    if (t.title = themeTitle) {
                        result.push(contributions);
                        break;
                    }
                }
            }
        }
        return result;
    };
});