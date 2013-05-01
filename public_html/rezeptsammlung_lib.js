/* Global variables about the recipe collection */
var serverRoot = "@serverRoot@";  /* gets replaced by the ant build.xml when pushing to a server */
var enumerationUrl = "@enumerationUrl@";
var recipesRoot = "@recipesRoot@";

var defaultZoom = 100;  /* gets set from the html page on startup */
var maxThumbnailWidth = 400;
var maxThumbnailHeight = 300;


function logStatus( message ) {
    console.log( message );
}

var rcpArray;
function fetchData() {
    var lastFetch = localStorage.getItem( "rcpLastFetch" );
    if ( lastFetch == null ) {
        fullFetch();
    } else {
        var rcpData = localStorage.getItem( "rcpArray" );
        if ( rcpData == null ) {
            fullFetch();
        } else {
            rcpArray = JSON.parse( rcpData );
            buildIndex();
            loadHandler();  // in the page specific js file

            // check if there is anything new
            logStatus( "We have the recpies cached, but checking if there are any new ones..." );
            logStatus( "Connecting to: " + enumerationUrl + "?startfrom=" + lastFetch );
            var request = new XMLHttpRequest();
            request.open( "GET", enumerationUrl +"?startfrom=" + lastFetch );
            request.onload = function() {
                if ( request.status == 200 ) {
                    //console.log( "Response: " + request.responseText );
                    if ( request.responseText != "null" ) {
                        logStatus( "New recipes found. Wiping local store..." );
                        // removeItem is better because otherwise we remove all data for the domain name
                        localStorage.removeItem("rcpLastFetch");
                        localStorage.removeItem("rcpArray");
                        fullFetch();
                    }
                }
            };
            request.send( null );
        }
    }
}

function fullFetch() {
    logStatus( "Full Download. Connecting to: " + enumerationUrl );

    var request = new XMLHttpRequest();
    request.open( "GET", enumerationUrl );
    request.onload = function() {
        if ( request.status == 200 ) {
            localStorage.setItem( "rcpArray", request.responseText );
            localStorage.setItem( "rcpLastFetch", getNow() );
            rcpArray = JSON.parse( request.responseText );
            window.status = "Finished parsing response.";
            buildIndex();
            loadHandler();  // in the page specific js file
        } else {
            logStatus( "Request failed with response: " + request.status );
        }
    };
    request.send( null );
}

var index = {};
/**
 * Builds the index object
 * @returns {unresolved}
 */
function buildIndex() {
    if ( rcpArray == null ) {
        logStatus( "The recipe Array is null!" );
        return;
    }

    index = {};
    for ( var key in rcpArray ) {
        var recipe = rcpArray[key];
        for ( var category in recipe.categories ) {
            if ( index[category] == null ) {
                index[category] = {};
            }
            for ( var i = 0, len = recipe.categories[category].length; i < len; i++ ) {
                var member = recipe.categories[category][i];
                if ( index[category][member] == null ) {
                    index[category][member] = [];
                }
                index[category][member].push( key );
            }
        }
    }
}


/**
 * Render the rcpArray as a table
 * @param {type} targetDiv the div element ot which the list should be added
 * @returns {unresolved}
 */
function renderDebug( targetDiv ) {
    if ( rcpArray == null ) {
        logStatus( "The recipe Array is null!" );
        return;
    }

    var table = "<table id=\"debugTable\">";
    table += "<th>Id:</th>";
    table += "<th>Filename:</th>";
    table += "<th>Name:</th>";
    table += "<th>ImageFilename<br>width height:</th>";
    table += "<th>Categories:</th>";

    for ( var key in rcpArray ) {
        var recipe = rcpArray[key];
        table += "<tr>";
        table += "<td>" + key + "</td>";
        table += "<td>" + recipe.filename + "</td>";
        table += "<td>" + recipe.name + "</td>";
        table += "<td>" + recipe.imageFilename + "<br>w: " + recipe.width + " h:" + recipe.height + "</td>";

        var subtable = "<td><table>";
        for ( var category in recipe.categories ) {
            subtable += "<tr>";
            subtable += "<td>" + category + "</td>";
            subtable += "<td>";
            for ( var i = 0, len = recipe.categories[category].length; i < len; i++ ) {
                subtable += recipe.categories[category][i] + "<br>";
            }
            subtable += "</td>";
            subtable += "</tr>";
        }
        subtable += "</table></td>";
        table += subtable;


        table += "</tr>";
    }
    table += "</table>";
    targetDiv.innerHTML = table;
}




/**
 * Render the rcpArray as a table ordered by the Speise-Kategorie
 * @param {type} targetDiv the div element ot which the list should be added
 * @returns {unresolved}
 */
function renderList( targetDiv ) {
    var sortedCategories = [];
    var category = "Speise-Kategorie";
    for ( var key in index[category] ) {
        sortedCategories.push( key );
    }
    sortedCategories.sort();

    var quickIndex = "";
    for ( var i = 0, len = sortedCategories.length; i < len; i++ ) {
        var category = sortedCategories[i];
        var escapedCategory = escape( category );
        quickIndex += "<a href=\"#" + escapedCategory + "\">" + category + "</a><br>";
    }


    var list = quickIndex + "<p>";
    for ( var i = 0, len = sortedCategories.length; i < len; i++ ) {
        var escapedCategory = escape( sortedCategories[i] );
        list += "<h3 id=\"" + escapedCategory + "\">" + sortedCategories[i] + "</h3>";

        var sortedRecipes = [];
        for ( var j = 0, lenj = index["Speise-Kategorie"][sortedCategories[i]].length; j < lenj; j++ ) {
            var rcpKey = index["Speise-Kategorie"][sortedCategories[i]][j];
            recipe = rcpArray[rcpKey];
            sortedRecipes.push( recipe );
        }
        sortedRecipes.sort( recipeCompare );

        for ( var k = 0, lenk = sortedRecipes.length; k < lenj; k++ ) {
            list += "<a href=\"" + recipesRoot + sortedRecipes[k].filename + "\">" + sortedRecipes[k].name + "</a><br>";
        }

    }
    targetDiv.innerHTML = list;

}



function recipeCompare( a, b ) {
    if ( a.name < b.name )
        return -1;
    if ( a.name > b.name )
        return 1;
    return 0;
}



function renderThumbs( thumbDiv ) {
    if ( rcpArray != null ) {
        for ( var key in rcpArray ) {
            var recipe = rcpArray[key];
            thumbDiv.appendChild( formatRecipe( recipe ) );
        }
    }
    $( ".imgLiquidFill" ).imgLiquid( {
        fill: true,
        fadeInTime: 200,
        horizontalAlign: "center",
        verticalAlign: "center"} );
}

/**
 * Returns a recipeBox element for a recipe
 * @param {type} recipe
 * @returns {unresolved}  the recipeBox element
 */
function formatRecipe( recipe ) {
    var recipeBox = document.createElement( "div" );
    recipeBox.className = "RecipeBox";
    recipeBox.id = recipe.filename;
    var maxWidth = maxThumbnailWidth * defaultZoom / 100;
    var maxHeight = maxThumbnailHeight * defaultZoom / 100;
    recipeBox.setAttribute( "style", "width: " + maxWidth + "px" );

    var recipeHyperlink = document.createElement( "a" );
    recipeHyperlink.setAttribute( 'href', recipesRoot + "/" + recipe.filename );
    recipeBox.appendChild( recipeHyperlink );

    var thumbnailBox = document.createElement( "div" );
    recipeHyperlink.appendChild( thumbnailBox );

    var starsImg = document.createElement( "img" );
    starsImg.className = "stars";
    var starsString = recipe.categories["Bewertung"][0];
    var starsUrl = "stars0.gif";
    switch ( starsString ) {
        case "1 Stern":
            starsUrl = 'stars1.gif';
            break;
        case "2 Sterne":
            starsUrl = "stars2.gif";
            break;
        case "3 Sterne":
            starsUrl = "stars3.gif";
            break;
        case "4 Sterne":
            starsUrl = "stars4.gif";
            break;
    }
    starsImg.setAttribute( "src", "http://richieigenmann.users.sourceforge.net/" + starsUrl );
    thumbnailBox.appendChild( starsImg );

    var thumbnailDiv = document.createElement( "div" );
    thumbnailDiv.className = "imgLiquidFill imgLiquid";
    thumbnailDiv.setAttribute( "style", "width:" + maxWidth + "px; height: " + maxHeight + "px;" );
    thumbnailBox.appendChild( thumbnailDiv );

    var thumbnailImg = document.createElement( "img" );
    thumbnailImg.className = "RecipeThumbnail";
    thumbnailImg.setAttribute( "src", recipesRoot + "/" + recipe.imageFilename );
    thumbnailImg.setAttribute( "alt", recipe.name );
    thumbnailDiv.appendChild( thumbnailImg );

    var captionDiv = document.createElement( "div" );
    captionDiv.className = "normaltext";
    captionDiv.innerHTML = recipe.name;
    recipeHyperlink.appendChild( captionDiv );

    return recipeBox;
}

/**
 * Call this function with percentage (in int) that you want to zoom the thumbnails to.
 * @param {type} slideAmount The percentage e.g.10 or 50 or 100
 */
function updateSlider( slideAmount ) {
    defaultZoom = slideAmount;
    var maxWidth = maxThumbnailWidth * defaultZoom / 100;
    var maxHeight = maxThumbnailHeight * defaultZoom / 100;

    var figureElements = document.getElementsByClassName( "RecipeBox" );
    for ( var i = 0, len = figureElements.length; i < len; i++ ) {
        figureElements[i].setAttribute( "style", "width: " + maxWidth + "px" );
        var thumbnailBox = figureElements[i].getElementsByClassName( "imgLiquidFill" );
        thumbnailBox[0].setAttribute( "style", "width:" + maxWidth + "px; height: " + maxHeight + "px;" );
        /* correct the font size */
        if ( slideAmount < 45 ) {
            var largeTextElements = figureElements[i].getElementsByClassName( "normaltext" );
            for ( var j = 0, lenj = largeTextElements.length; j < lenj; j++ ) {
                largeTextElements[j].className = "smalltext";
            }
        } else {
            var smallTextElements = figureElements[i].getElementsByClassName( "smalltext" );
            for ( var j = 0, lenj = smallTextElements.length; j < lenj; j++ ) {
                smallTextElements[j].className = "normaltext";
            }

        }
    }
}

function getScaledLength( originalLength, ratio ) {
    return (originalLength / ratio);
}

function getScalingRatio( width, height, maxWidth, maxHeight ) {
// Scale so that the entire picture fits in the component.
    var hightratio = height / maxHeight;
    var widthratio = width / maxWidth;
    var ratio;
    if ( hightratio > widthratio ) {
// Vertical scaling
        ratio = hightratio;
    } else {
// Horizontal scaling
        ratio = widthratio;
    }
    return ratio;
}


function doSearch() {
    var inputField = document.getElementById( "searchStringBox" );
    var searchString = inputField.value;
    if ( searchString == "" ) {
        logStatus( "Please enter a search string" );
    } else {
        logStatus( "Searching for: " + searchString );
    }

    var cleanSearchString = rabidCleanString( searchString );
    var searchResults = [];
    // Search in Recipe Name
    for ( var key in rcpArray ) {
        var recipe = rcpArray[key];
        if ( rabidCleanString( recipe.name ).match( cleanSearchString ) ) {
            searchResults.push( recipe );
        }
    }
    // Search for Category Members
    var alsoFoundText = '';
    for ( var key in index ) {
        for ( var subkey in index[key] ) {
            if ( rabidCleanString( subkey ).match( cleanSearchString ) ) {
                // copy over all the recipes belonging to this category member
                var len = index[key][subkey].length;
                alsoFoundText += key + "/" + subkey + " (" + len + ") ";
                for ( var i = 0; i < len; i++ ) {
                    rcpId = rcpArray[ index[key][subkey][i] ];
                    searchResults.push( rcpArray[ index[key][subkey][i] ] );
                }
            }
        }
    }

    // See http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
    var uniqSortedSearchResults = searchResults.filter( function( elem, pos ) {
        return searchResults.indexOf( elem ) == pos;
    } ).sort( recipeCompare );
    ;

    logStatus( "Found: " + uniqSortedSearchResults.length + " " + alsoFoundText );

    var bigPanel = document.getElementById( "rightPanel" );
    bigPanel.innerHTML = '';


    for ( var i = 0, len = uniqSortedSearchResults.length; i < len; i++ ) {
        var recipe = uniqSortedSearchResults[i];
        bigPanel.appendChild( formatRecipe( recipe ) );
    }

    $( ".imgLiquidFill" ).imgLiquid( {
        fill: true,
        fadeInTime: 200,
        horizontalAlign: "center",
        verticalAlign: "center"} );

}


/**
 * Returns the input String in lowercase with umlauts transformed to non umlaut characters
 * so that the strings can be compared
 * @param {type} inputString
 * @returns {unresolved}
 */
function cleanString( inputString ) {
    var lc = inputString.toLowerCase();
    var amp1 = lc.replace( /&auml;/g, 'a' );
    var amp2 = amp1.replace( /&ouml;/g, 'o' );
    var amp3 = amp2.replace( /&uuml;/g, 'u' );
    var u1 = amp3.replace( /ü/g, 'u' );
    var u2 = u1.replace( /ä/g, 'a' );
    var u3 = u2.replace( /ö/g, 'o' );
    return u3;
}

/**
 * Returns the input String in lowercase with umlauts transformed to non umlaut characters
 * and all vowels removed so that search is more lenient
 * @param {type} inputString
 * @returns {unresolved}
 */
function rabidCleanString( inputString ) {
    var lc = inputString.toLowerCase();
    var amp1 = lc.replace( /&auml;/g, '' );
    var amp2 = amp1.replace( /&ouml;/g, '' );
    var amp3 = amp2.replace( /&uuml;/g, '' );
    var u1 = amp3.replace( /[äöüaeiou]/g, '' );
    return u1;
}

/**
 * Taken from http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
 * @param {type} arr
 * @returns {@exp;arr@call;filter}
 */
function getDistinctArray( arr ) {
    var dups = {};
    return arr.filter( function( el ) {
        var hash = el.valueOf();
        var isDup = dups[hash];
        dups[hash] = true;
        return !isDup;
    } );
}


/**
 * Returns the current date formatted for URL friendlyness
 * @returns {String}
 */
function getNow() {
    var currentdate = new Date();
    var datetime = currentdate.getFullYear() + "-"
            + leftPad( (currentdate.getMonth() + 1) ) + "-"
            + leftPad( currentdate.getUTCDate() ) + "+"
            + leftPad( currentdate.getUTCHours() ) + "%3A"
            + leftPad( currentdate.getUTCMinutes() ) + "%3A"
            + leftPad( currentdate.getUTCSeconds() );
    return datetime;
}

/**
 * Left pads a single digit number to 0n
 * @param {type} num
 * @returns {String}
 */
function leftPad( num ) {
    if ( num < 10 ) {
        return "0" + num;
    } else {
        return num;
    }
}
