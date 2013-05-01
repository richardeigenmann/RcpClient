/**
 * Main entry point
 */
window.onload = function() {
    var zoomSlider = document.getElementById( "zoomSlider" );
    defaultZoom = zoomSlider.value;
    
    /* prevent the search from submitting */
    var form = document.getElementById( 'searchForm' );
    if ( form.attachEvent ) {
        form.attachEvent( "submit", processForm );
    } else {
        form.addEventListener( "submit", processForm );
    }

    fetchData();
};

/**
 *  function to stop the search form submitting and do a search instead
 */
function processForm( e ) {
    if ( e.preventDefault )
        e.preventDefault();
    doSearch();
    return false;
}

/**
 * Callback from RcpClient.js when the recipes have finished loading. 
 */
function loadHandler() {
    var panel = document.getElementById( "indexPanel" );
    renderList( panel );

    var rightPanel = document.getElementById( "rightPanel" );
    renderThumbs( rcpArray, rightPanel );

    $( ".imgLiquidFill" ).imgLiquid( {
        fill: true,
        fadeInTime: 200,
        horizontalAlign: "center",
        verticalAlign: "middle"} );
}

