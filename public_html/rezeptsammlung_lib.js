/* Global variables about the recipe collection */
/**
 * The root address of the Server
 * @constant
 * @type {string}
 */
var SERVER_ROOT = "@serverRoot@";  // gets replaced by the ant build.xml when pushing to a server

/**
 * The enumberation URL to hit to find out if there are new recipes
 * @constant
 * @type String
 */
var ENUMERATION_URL = "@enumerationUrl@";

/**
 * The root URL of where the recipes are stored
 * @constant
 * @type String
 */
var RECIPES_ROOT = "@recipesRoot@";

var LIMIT_THUMBS = 90; /* number of thumbs to show initially */
var defaultZoom = 100;  /* gets set from the html page on startup */
var maxThumbnailWidth = 400;
var maxThumbnailHeight = 300;


function logStatus( message ) {
    console.log( message );
}

/**
 * Static global variable where we store all recipes
 * @type @exp;JSON@call;parse|@exp;JSON@call;parse
 */
var rcpArray;
function fetchData() {
    var lastFetch = localStorage.getItem( "rcpLastFetch" );
    if ( lastFetch == null ) {
        fullFetch();
    } else {
        var rcpData = localStorage.getItem( "rcpArray" );
        if ( rcpData == null ) {
            fullFetch();  // because we don't have any data
        } else {
            // check if there is anything new
            logStatus( "We have the recpies cached, but checking if there are any new ones..." );
            var url = ENUMERATION_URL + "?startfrom=" + lastFetch;
            logStatus( "Connecting to: " + url );
            document.getElementById( "serverdetails" );
            serverdetails.innerHTML = url;
            var request = new XMLHttpRequest();
            request.open( "GET", ENUMERATION_URL + "?startfrom=" + lastFetch );
            request.onload = function() {
                if ( request.status == 200 ) {
                    //console.log( "Response: " + request.responseText );
                    if ( request.responseText != "null" ) {
                        logStatus( "New recipes found. Wiping local store..." );
                        // removeItem is better because otherwise we remove all data for the domain name
                        localStorage.removeItem( "rcpLastFetch" );
                        localStorage.removeItem( "rcpArray" );
                        fullFetch();
                    } else {
                        // our last data fetch was current enough; we have everything
                        rcpArray = JSON.parse( rcpData );
                        buildIndex();
                        loadHandler();  // in the page specific js file
                    }
                }
            };
            request.send( null );
        }
    }
}

function fullFetch() {
    logStatus( "Full Download. Connecting to: " + ENUMERATION_URL );

    var request = new XMLHttpRequest();
    request.open( "GET", ENUMERATION_URL );
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

/**
 * Callback from RcpClient.js when the recipes have finished loading. 
 */
function loadHandler() {
    var panel = document.getElementById( "indexPanel" );
    renderIndex( panel );

    var rightPanel = document.getElementById( "rightPanel" );
    clearThumbnailPanel();
    renderThumbs( rcpArray, rightPanel );

    $( ".imgLiquidFill" ).imgLiquid( {
        fill: true,
        fadeInTime: 200,
        horizontalAlign: "center",
        verticalAlign: "middle"} );
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
function renderIndex( targetDiv ) {
    var categoryType = "Bewertung";
    var valuationTitle = document.createElement( "h3" );
    valuationTitle.appendChild( document.createTextNode( categoryType ) );
    targetDiv.appendChild( valuationTitle );
    var sortedCategories = getCategories( categoryType );
    addCategoriesAsHyperlinks( categoryType, sortedCategories, targetDiv );

    var br = document.createElement( 'br' );
    targetDiv.appendChild( br );

    categoryType = "Speise-Kategorie";
    var categoriesTitle = document.createElement( "h3" );
    categoriesTitle.appendChild( document.createTextNode( categoryType ) );
    targetDiv.appendChild( categoriesTitle );
    sortedCategories = getCategories( categoryType );
    addCategoriesAsHyperlinks( categoryType, sortedCategories, targetDiv );

    var br = document.createElement( 'br' );
    targetDiv.appendChild( br );

    categoryType = "Region";
    var categoriesTitle = document.createElement( "h3" );
    categoriesTitle.appendChild( document.createTextNode( categoryType ) );
    targetDiv.appendChild( categoriesTitle );
    sortedCategories = getCategories( categoryType );
    addCategoriesAsHyperlinks( categoryType, sortedCategories, targetDiv );

    var br = document.createElement( 'br' );
    targetDiv.appendChild( br );

    categoryType = "Quelle";
    var categoriesTitle = document.createElement( "h3" );
    categoriesTitle.appendChild( document.createTextNode( categoryType ) );
    targetDiv.appendChild( categoriesTitle );
    sortedCategories = getCategories( categoryType );
    addCategoriesAsHyperlinks( categoryType, sortedCategories, targetDiv );
}

/**
 * Returns a sorted Array of the categories belonging to a category type.
 * I.e. for Speise-Kategorie it returns the categories "Hautgerichte", "Desserts" etc.
 * @param {type} categoryType
 * @returns {undefined}
 */
function getCategories( categoryType ) {
    var categories = [];
    for ( var key in index[categoryType] ) {
        categories.push( key );
    }
    categories.sort();
    return categories;
}

/**
 * Adds the categories in the array as hyperlinks ith the approriate target Element
 * @param {type} sortedCategories
 * @param {type} quickIndex
 * @returns {unresolved}
 */
function addCategoriesAsHyperlinks( categoryType, sortedCategories, targetElement ) {
    for ( var i = 0, len = sortedCategories.length; i < len; i++ ) {
        var category = sortedCategories[i];
        var escapedCategory = escape( category );
        var categoryHyperlink = document.createElement( "a" );
        categoryHyperlink.setAttribute( "href", "#" );
        categoryHyperlink.setAttribute( "class", "categoryLink" );
        categoryHyperlink.setAttribute( "data-categorytype", categoryType );
        categoryHyperlink.setAttribute( "data-category", escapedCategory );
        categoryHyperlink.innerHTML = category;
        categoryHyperlink.onclick = function() {
            doCategoryClick( unescape( this.getAttribute( 'data-categorytype' ) ), unescape( this.getAttribute( 'data-category' ) ) );
            return false;
        }
        targetElement.appendChild( categoryHyperlink );
        var br = document.createElement( 'br' );
        targetElement.appendChild( br );
    }
}


/**
 * This method handles the user's click on a category and shows the associated thums.
 * @returns {undefined}
 */
function doCategoryClick( categoryType, category ) {
    var categoryRecipes = index[categoryType];
    var recipeNameArray = categoryRecipes[category];  // returns an array of strings i.e. "Rcp001.htm", "Rcp002.htm"
    var recipesArray = [];
    for ( var i = 0, len = recipeNameArray.length; i < len; i++ ) {
        recipesArray.push( rcpArray[recipeNameArray[i]] );
    }
    recipesArray.sort( recipeCompare );
    clearThumbnailPanel();
    scrollThumbsToTop();
    renderThumbsArray( recipesArray, document.getElementById( "rightPanel" ) );
}

/**
 *  Scrolls to the top of the page
 * @returns {undefined}
 */
function scrollThumbsToTop() {
    window.scrollTo( 0, 0 );
}


/**
 * Function to be used in array.sort( recipeCompare ) to sort arrays of recipes
 * alphabeticalls
 * @param {type} a
 * @param {type} b
 * @returns {Number}
 */
function recipeCompare( a, b ) {
    var a1 = decodeUmlauts( a.name );
    var b1 = decodeUmlauts( b.name );
    if ( a1 < b1 )
        return -1;
    if ( a1 > b1 )
        return 1;
    return 0;
}

/**
 * Returns String with the Umlauts replaced as normal characters
 * @param {type} inputString
 * @returns {unresolved}
 */
function decodeUmlauts( inputString ) {
    var s1 = inputString.replace( /&auml;/g, 'ae' );
    var s2 = s1.replace( /&ouml;/g, 'oe' );
    var s3 = s2.replace( /&uuml;/g, 'ue' );
    var s4 = s3.replace( /&Auml;/g, 'Ae' );
    var s5 = s4.replace( /&Ouml;/g, 'Oe' );
    var s6 = s5.replace( /&Uuml;/g, 'Ue' );
    return s6;
}

/**
 * Returns String with the Umlauts replaced as normal characters  &auml; --> ä
 * @param {type} inputString
 * @returns {unresolved}
 */
function decodeUmlautCharacters( inputString ) {
    var s1 = inputString.replace( /&auml;/g, 'ä' );
    var s2 = s1.replace( /&ouml;/g, 'ö' );
    var s3 = s2.replace( /&uuml;/g, 'ü' );
    var s4 = s3.replace( /&Auml;/g, 'Ä' );
    var s5 = s4.replace( /&Ouml;/g, 'Ö' );
    var s6 = s5.replace( /&Uuml;/g, 'Ü' );
    return s6;
}

/**
 * Removes all thumbnails from the thumbnail panel
 * @returns {undefined}
 */
function clearThumbnailPanel() {
    var rightPanel = document.getElementById( "rightPanel" );
    rightPanel.innerHTML = '';
}




/**
 *  This function takes the supplied object of recipe objects and appends 
 *  them to the indicated dom object
 * @param {type} recipeCollection  The array of recipies to be added
 * @param {type} container the dom object to which the recpies are to be added
 * @returns {undefined} nothing.
 */
function renderThumbs( recipeCollection, container ) {
    var recipeArray = [];
    if ( recipeCollection != null ) {
        for ( var key in recipeCollection ) {
            var recipe = recipeCollection[key];
            recipeArray.push( recipe );
        }
        recipeArray.sort( recipeCompare )
        renderThumbsArray( recipeArray, container );
    }
}


/**
 * Array holding the recipes that are being shown
 * @type Array
 */
var showingArray = [];

/**
 *  This function takes the supplied array of recipes and appends 
 *  them to the indicated dom object
 * @param {type} recipeArray
 * @param {type} container
 * @returns {undefined}
 */
function renderThumbsArray( recipeArray, container ) {
    showingArray = recipeArray;
    for ( var i = 0, len = Math.min( recipeArray.length, LIMIT_THUMBS ); i < len; i++ ) {
        var recipe = recipeArray[i];
        container.appendChild( formatRecipe( recipe ) );
        if ( i == LIMIT_THUMBS - 1 ) {
            container.appendChild( makeMoreBox( i + 2 ) );
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
    recipeBox.setAttribute( "data-recipe", recipe.filename );
    recipeBox.onclick = function() {
        doRecipePopup( event, this );
        return false;
    }

    //var recipeHyperlink = document.createElement( "a" );
    //recipeHyperlink.setAttribute( 'href', RECIPES_ROOT + "/" + recipe.filename );
    //recipeBox.appendChild( recipeHyperlink );

    var thumbnailBox = document.createElement( "div" );
    recipeBox.appendChild( thumbnailBox );

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
    //thumbnailBox.appendChild( starsImg );

    var starsCanvas = document.createElement( "canvas" );
    starsCanvas.className = "stars";
    var ctx = starsCanvas.getContext( "2d" );
    ctx.fillStyle = "gold";
    if ( starsString === "4 Sterne" ) {
        ctx.fillStyle = "red";
    }
    drawStar( ctx, 71, 11 );
    if ( starsString === "3 Sterne" ) {
        ctx.fillStyle = "red";
    }
    drawStar( ctx, 51, 11 );
    if ( starsString === "2 Sterne" ) {
        ctx.fillStyle = "red";
    }
    drawStar( ctx, 31, 11 );
    if ( starsString === "1 Stern" ) {
        ctx.fillStyle = "red";
    }
    drawStar( ctx, 11, 11 );
    thumbnailBox.appendChild( starsCanvas );

    var thumbnailDiv = document.createElement( "div" );
    thumbnailDiv.className = "imgLiquidFill imgLiquid";
    thumbnailDiv.setAttribute( "style", "width:" + maxWidth + "px; height: " + maxHeight + "px;" );
    thumbnailBox.appendChild( thumbnailDiv );

    var thumbnailImg = document.createElement( "img" );
    thumbnailImg.className = "RecipeThumbnail";
    thumbnailImg.setAttribute( "src", RECIPES_ROOT + "/" + recipe.imageFilename );
    thumbnailImg.setAttribute( "alt", recipe.name );
    thumbnailDiv.appendChild( thumbnailImg );

    var captionDiv = document.createElement( "div" );
    captionDiv.className = "normaltext";
    captionDiv.innerHTML = recipe.name;
    //recipeHyperlink.appendChild( captionDiv );
    recipeBox.appendChild( captionDiv );

    return recipeBox;
}

/**
 * Reformats the supplied date as yyyy-mm-dd
 * @param {type} date
 * @returns {undefined}
 */
function formatDate( date ) {
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January is 0!

    var yyyy = date.getFullYear();
    if ( dd < 10 ) {
        dd = '0' + dd
    }
    if ( mm < 10 ) {
        mm = '0' + mm
    }
    formattedDate = yyyy + "-" + mm + "-" + dd;
    return formattedDate;
}

/**
 * Returns the weekday as a German string
 * @param {type} date
 * @returns {undefined}
 */
function formatWeekdayGerman( date ) {
    /*var weekday = new Array( 7 );
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";*/
    var weekday = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    var index = date.getDay();
    return weekday[date.getDay()];
}


/**
 * Originally found this page: http://programmingthomas.wordpress.com/2012/05/16/drawing-stars-with-html5-canvas/
 * This draws a star using parametrised radius and spike length. I fear that doing all those floating point 
 * calculations could be really slow so I have "pre-rendered" the calculations into this function for a small star.
 * @param {type} ctx
 * @param {type} x
 * @param {type} y
 * @returns {undefined}
 */
function drawStar( ctx, x, y ) {
    ctx.save();
    ctx.beginPath();
    ctx.translate( x, y );
    ctx.moveTo( 0, -10 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -4.5 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -10 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -4.5 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -10 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -4.5 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -10 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -4.5 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -10 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -4.5 );
    ctx.rotate( 0.6283185307179586 );
    ctx.lineTo( 0, -10 );
    ctx.fill();
    ctx.restore();
}


/**
 * Returns a more button
 * @returns the element for the more button
 */
function makeMoreBox( startIndex ) {

    var buttonnode = document.createElement( 'input' );
    buttonnode.setAttribute( 'type', 'button' );
    buttonnode.setAttribute( 'name', 'more' );
    buttonnode.setAttribute( 'value', 'mehr sehen' );
    buttonnode.setAttribute( 'class', 'moreButton' );
    buttonnode.setAttribute( 'data-startindex', startIndex );

    buttonnode.onclick = function() {
        rawMoreButtonClick( this );
        return false;
    };
    return buttonnode;
}


function rawMoreButtonClick( button ) {
    button.parentNode.removeChild( button );
    moreButtonClick( parseInt( button.getAttribute( 'data-startindex' ) ) );
}

function moreButtonClick( startIndex ) {
    //alert( "type: " + moreType + " startIndex: " + startIndex );
    var container = document.getElementById( "rightPanel" );

    for ( var i = startIndex, len = Math.min( showingArray.length, startIndex + LIMIT_THUMBS ); i < len; i++ ) {
        var recipe = showingArray[i];
        container.appendChild( formatRecipe( recipe ) );
        if ( i == startIndex + LIMIT_THUMBS - 1 ) {
            container.appendChild( makeMoreBox( i + 2 ) );
        }
    }

    $( ".imgLiquidFill" ).imgLiquid( {
        fill: true,
        fadeInTime: 200,
        horizontalAlign: "center",
        verticalAlign: "center"} );

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

    clearThumbnailPanel();
    scrollThumbsToTop();
    renderThumbsArray( uniqSortedSearchResults, document.getElementById( "rightPanel" ) );
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
 * Returns the input String in lowercase with all vowels removed so that search 
 * is more lenient
 * @param {type} inputString  the string to transform
 * @returns {unresolved} the transformed string
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

function auth() {
    console.log( 'firing auth' );
    var config = {
        'client_id': '727840828834.apps.googleusercontent.com',
        'scope': 'https://www.googleapis.com/auth/urlshortener'
    };
    gapi.auth.authorize( config, function() {
        console.log( 'login complete' );
        console.log( gapi.auth.getToken() );
    } );
}

function googleinit() {
    gapi.client.setApiKey( 'AIzaSyC-REjbFztx8AQ9j6WCrN1CWTRSlQ95aUE' );
    gapi.client.load( 'urlshortener', 'v1', makeRequest );
}

function appendResults( text ) {
    var results = document.getElementById( 'results' );
    results.appendChild( document.createElement( 'P' ) );
    results.appendChild( document.createTextNode( text ) );
}

function makeRequest() {
    var request = gapi.client.urlshortener.url.insert( {
        'longUrl': 'http://www.nzz.ch'
    } );
    request.execute( function( response ) {
        appendResults( response.shortUrl );
    } );
}


/**
 * From http://www.daniweb.com/web-development/javascript-dhtml-ajax/threads/76965/creating-a-popup-menu-on-mouse-over#
 * findPos function is from http://www.quirksmode.org/js/findpos.html;
 *  where its workings are explained in more detail.
 */
function findPos( obj ) {
    var curleft = curtop = 0;
    if ( obj.offsetParent ) {
        curleft = obj.offsetLeft
        curtop = obj.offsetTop
        while ( obj = obj.offsetParent ) {
            curleft += obj.offsetLeft
            curtop += obj.offsetTop
        }
    }
    return [curleft, curtop];
}


/**
 * This variable holds the reference to the recipe which caused the pop-up so that it can later
 * be added to the Google calendar.
 * @type type
 */
var popupRecipe = null;

/**
 * show the recipe popup menu
 * @param {type} e
 * @param {type} parent
 * @returns {undefined}
 */
function doRecipePopup( e, parent ) {
    var dataRecipe = parent.getAttribute( "data-recipe" );
    popupRecipe = rcpArray[dataRecipe];

    var rcpPopupMenu = document.getElementById( 'rcpPopupMenu' );
    //override the 'display:none;' style attribute
    rcpPopupMenu.style.display = "";
    rcpPopupMenu.style.left = e.pageX + "px";
    rcpPopupMenu.style.top = e.pageY + "px";

    var rcpPopupMenuOpen = document.getElementById( "rcpPopupMenuOpen" );
    rcpPopupMenuOpen.onclick = function() {
        doOpenNewTab( RECIPES_ROOT + "/" + popupRecipe.filename );
        handleEscKeyup();
    };

    var rcpPopupMenuPick = document.getElementById( "rcpPopupMenuPick" );
    rcpPopupMenuPick.onclick = function() {
        doCalendarPopup( event, this );
    };

    var rcpPopupMenuAdd = document.getElementById( "rcpPopupMenuAdd" );
    rcpPopupMenuAdd.onclick = function() {
        doDatePopup( event, this );
    };

    var rcpPopupCalendarGo = document.getElementById( "rcpPopupCalendarGo" );
    rcpPopupCalendarGo.onclick = function() {
        doOpenNewTab( "https://www.google.com/calendar/render" );
        handleEscKeyup();
    };
    
}

/**
 * Hides the rcpPopupMenu
 * @param {type} named
 * @returns {undefined}
 */
function hideRcpPopupMenu() {
    var menu = document.getElementById( "rcpPopupMenu" );
    menu.style.display = "none";
}


/**
 * Opens the specified filename in a new tab. The RECIPES_ROOT it prepended to the filename.
 * @param {type} filename
 * @returns {undefined}
 */
function doOpenNewTab( url ) {
    window.open( url );
}


/**
 * show the calendar popup menu
 * @param {type} e
 * @param {type} parent
 * @returns {undefined}
 */
function doCalendarPopup( e, parent ) {
    var calendarPopupMenu = document.getElementById( 'calendarPopupMenu' );
    //override the 'display:none;' style attribute
    calendarPopupMenu.style.display = "";
    calendarPopupMenu.style.left = e.pageX + "px";
    calendarPopupMenu.style.top = e.pageY + "px";
    hideDatePopupMenu();
}


/**
 * Hides the calendarPopupMenu
 * @param {type} named
 * @returns {undefined}
 */
function hideCalendarPopupMenu() {
    var menu = document.getElementById( "calendarPopupMenu" );
    menu.style.display = "none";
}


/**
 * show the date popup menu
 * @param {type} e
 * @param {type} parent
 * @returns {undefined}
 */
function doDatePopup( e, parent ) {
    var datePopupMenu = document.getElementById( 'datePopupMenu' );
    //override the 'display:none;' style attribute
    datePopupMenu.style.display = "";
    datePopupMenu.style.left = e.pageX + "px";
    datePopupMenu.style.top = e.pageY + "px";
    hideCalendarPopupMenu();
}


/**
 * Hides the datePopupMenu
 * @param {type} named
 * @returns {undefined}
 */
function hideDatePopupMenu() {
    var menu = document.getElementById( "datePopupMenu" );
    menu.style.display = "none";
}



/**
 * Handles an Esc keyup event and closes all popup windows
 * @returns {undefined}
 */
function handleEscKeyup() {
    hideRcpPopupMenu();
    hideCalendarPopupMenu();
    hideDatePopupMenu();
}


/**
 * The clientId obtained from the Google API console
 * @constant
 * @type String
 */
var clientId = '727840828834.apps.googleusercontent.com';

/**
 * The apiKey obtained from the Google API console
 * @constant
 * @type String
 */
var apiKey = 'AIzaSyC-REjbFztx8AQ9j6WCrN1CWTRSlQ95aUE';

/**
 * The scopes required from the Google API
 * @constant
 * @type String
 */
var scopes = 'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar';

/**
 * This is where the callback lands when the google client code has finished loading.
 * I call checkAuth and set a timer so that checkAuth is called every 55 minutes. This
 * is so that we keep getting a refresh token and the session doesn't expire.
 * @returns {undefined}
 */
function googleApiInit() {
    gapi.client.setApiKey( apiKey );

    // wire up the login and logout handlers
    var signInButton = document.getElementById( "signInButton" );
    signInButton.onclick = handleAuthClick;
    var googlePicture = document.getElementById( "googlePicture" );
    googlePicture.onclick = handleLogoutClick;

    // set timeout to the checkAuth methos so that we get a refreshed token every 55 minutes
    window.setTimeout( checkAuth, 55 * 60 * 1000 );
    checkAuth();
}

/**
 * Connects to Google and tells them what we want.
 * @returns {undefined}
 */
function checkAuth() {
    console.log( 'checkAuth: scopes: ' + scopes );
    gapi.auth.authorize( {client_id: clientId, scope: scopes, immediate: true}, handleAuthResult );
}


/**
 * This is where we land when checkAuth has finished.
 * Here we make the appropriate widgets visibe or not.
 * @param {type} authResult
 * @returns {undefined}
 */
function handleAuthResult( authResult ) {
    var authorizeButton = document.getElementById( 'authorize-button' );
    var logoutButton = document.getElementById( 'logoutButton' );
    if ( authResult && !authResult.error ) {
        updateLoginState( true );
        fetchGoogleData();
    } else {
        updateLoginState( false );
    }
}

/**
 * This method updates the UI elements according to the Google 
 * API log in state.
 * @param {type} state Send true if logged in, false if logged out.
 * @returns {undefined}
 */
function updateLoginState( state ) {
    var rcpPopulMenuLogon = document.getElementById( "rcpPopulMenuLogon" );
    var rcpPopupMenuPick = document.getElementById( "rcpPopupMenuPick" );
    var rcpPopupMenuAdd = document.getElementById( "rcpPopupMenuAdd" );
    var rcpPopupCalendarGo = document.getElementById( "rcpPopupCalendarGo" );
    var signInButton = document.getElementById( "signInButton" );
    if ( state ) {
        console.log( "We are logged in to Google" );
        rcpPopulMenuLogon.style.display = "none";
        rcpPopupMenuPick.style.display = ""; // i.e. show it
        rcpPopupMenuAdd.style.display = ""; // i.e. show it
        rcpPopupCalendarGo.style.display = ""; // i.e. show it
        signInButton.style.display = "none";
        
    } else {
        console.log( "We are not logged in to Google" );
        rcpPopulMenuLogon.style.display = ""; // i.e. show it
        rcpPopulMenuLogon.onclick = handleAuthClick;
        rcpPopupMenuPick.style.display = "none";
        rcpPopupMenuAdd.style.display = "none";
        rcpPopupCalendarGo.style.display = "none";
        signInButton.style.display = "";
        var googlePicture = document.getElementById( "googlePicture" );
        googlePicture.style.display = "none";
    }
}

/**
 * Bring up the google login dialog. Then calls handleAuthResult which 
 * then calls updateLoginState that does the UI stuff
 * @param {type} event
 * @returns {Boolean}
 */
function handleAuthClick( event ) {
    gapi.auth.authorize( {client_id: clientId, scope: scopes, immediate: false}, handleAuthResult );
    return false;
}

/**
 * Logs us out from the recipe page
 * @param {type} event
 * @returns {Boolean}
 */
function handleLogoutClick( event ) {
    var logoutFrame = document.createElement( "iframe" );
    logoutFrame.src = "https://accounts.google.com/logout";
    logoutFrame.setAttribute( "style", "display: none" );
    document.body.appendChild( logoutFrame );
    updateLoginState( false );
    return false;
}

/**
 * Makes Google API requests to retrieve the image of the user
 * and the names of his calendars.
 * @returns {undefined}
 */
function fetchGoogleData() {
    gapi.client.load( 'plus', 'v1', function() {
        var request = gapi.client.plus.people.get( {
            'userId': 'me'
        } );
        request.execute( function( resp ) {
            var googlePicture = document.getElementById( "googlePicture" );
            googlePicture.src = resp.image.url;
            googlePicture.style.display = "";
        } );
    } );

    gapi.client.load( 'calendar', 'v3', function() {
        var request = gapi.client.calendar.calendarList.list( {
        } );
        request.execute( function( resp ) {
            var calendarPopupMenu = document.getElementById( 'calendarPopupMenu' );
            calendarPopupMenu.innerHTML = "";
            var ul = document.createElement( "ul" );
            calendarPopupMenu.appendChild( ul );

            var items = resp.items;
            for ( var i = 0, len = items.length; i < len; i++ ) {
                var li = document.createElement( "li" );
                li.setAttribute( "id", items[i].id );
                li.appendChild( document.createTextNode( items[i].summary ) );
                ul.appendChild( li );

                li.onclick = function() {
                    clickCalendar( this.id );
                    return false;
                };
            }
            highlightCalendarInPopup();
        } );
    } );
}


function clickCalendar( id ) {
    console.log( "clicked on calendar: " + id );
    localStorage.setItem( "googleCalendarId", id );
    highlightCalendarInPopup();
    handleEscKeyup();
}

/**
 * This method identifies the entry in the calendar popup menu and gives it a different class
 * @returns {undefined}
 */
function highlightCalendarInPopup() {
    var googleCalendarId = localStorage.getItem( "googleCalendarId" );
    var calendarPopupMenu = document.getElementById( 'calendarPopupMenu' ).children[0];
    for ( var i = 0, len = calendarPopupMenu.children.length; i < len; i++ ) {
        var li = calendarPopupMenu.children[i];
        if ( li.id === googleCalendarId ) {
            li.setAttribute( "class", "selected" );
        } else {
            li.setAttribute( "class", "" );
        }
    }
}


function createCalendarEntry( clickedDateElement ) {
    var calendarId = localStorage.getItem( "googleCalendarId" );
    console.log( "Going to create entry on calendar: " + calendarId );
    
    var theDate = clickedDateElement.getAttribute("data-date");

    gapi.client.load( 'calendar', 'v3', function() {
        var request = gapi.client.calendar.events.insert( {
            'calendarId': calendarId,
            'resource': {
                "start": {"date": theDate },
                "end": {"date": theDate},
                "summary": decodeUmlautCharacters(popupRecipe.name),
                "location": RECIPES_ROOT + "/" + popupRecipe.filename
            }
        } );
        request.execute( function( resp ) {
            if ( resp.id ) {
                handleEscKeyup();
            } else {
                alert( "Rezept nicht in den Kalender eingef&uuml;gt: " + resp  );
            }
        } );
    } );
}

