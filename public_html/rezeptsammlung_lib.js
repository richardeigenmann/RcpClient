/* Global variables about the recipe collection */
var serverRoot = "@serverRoot@";  /* gets replaced by the ant build.xml when pushing to a server */
var enumerationUrl = "@enumerationUrl@";
var recipesRoot = "@recipesRoot@";

var LIMIT_THUMBS = 90; /* number of thumbs to show initially */
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
            request.open( "GET", enumerationUrl + "?startfrom=" + lastFetch );
            request.onload = function() {
                if ( request.status == 200 ) {
                    //console.log( "Response: " + request.responseText );
                    if ( request.responseText != "null" ) {
                        logStatus( "New recipes found. Wiping local store..." );
                        // removeItem is better because otherwise we remove all data for the domain name
                        localStorage.removeItem( "rcpLastFetch" );
                        localStorage.removeItem( "rcpArray" );
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
        targetElement.appendChild( categoryHyperlink );
        var br = document.createElement( 'br' );
        targetElement.appendChild( br );
    }
}


/**
 * This method handles the user's click on a category and shows the associated thums.
 * @returns {undefined}
 */
function showCategoryThumbs( categoryType, category ) {
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
    recipeBox.setAttribute( "onmouseover", "doRcpPopup(event, this);" );
    recipeBox.setAttribute( "data-recipe", recipe.filename );

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

//Display a named menu, at the position of another object
function doRcpPopup( e, parent ) {
    var dataRecipe = parent.getAttribute( "data-recipe" );
    var recipe = rcpArray[dataRecipe];
    //console.log( "mouseover on: " + recipe.name );

    var menu_element = document.getElementById( 'rcpPopupMenu' );
    //override the 'display:none;' style attribute
    menu_element.style.display = "";
    //get the placement of the element that invoked the menu...
    //var placement = findPos( parent );
    //...and put the menu there
//	menu_element.style.left = placement[0] + 50 + "px";
//	menu_element.style.top = placement[1] + 50 + "px";
    menu_element.style.left = e.pageX + "px";
    menu_element.style.top = e.pageY + "px";
    
    var rcpPopupMenuTitle = document.getElementById("rcpPopupMenuTitle");
    rcpPopupMenuTitle.innerHTML = recipe.name;
    
    var rcpPopupMenuOpen = document.getElementById("rcpPopupMenuOpen");
    rcpPopupMenuOpen.onclick = function() {window.open(recipesRoot + "/" + recipe.filename); };
            //"window.open(\"" + recipesRoot + "/" + recipe.filename + "\")";
}



//Hide a named menu
function hide_menu( named )
{
    //get the named menu
    var menu_element = document.getElementById( named );
    //hide it with a style attribute
    menu_element.style.display = "none";
}