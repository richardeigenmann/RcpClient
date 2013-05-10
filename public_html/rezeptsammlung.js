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

    // set up an escape key handler
    $( document ).keyup( function( e ) {
        if ( e.keyCode == 27 ) {
            handleEscKeyup();
        }
    } );


    var datePopupMenu = document.getElementById( 'datePopupMenu' );
    var ul = datePopupMenu.children[0];
    var today = new Date();
    ul.children[0].setAttribute( "data-date", formatDate( today ) );
    var tomorrow = new Date( today.getTime() + 24 * 60 * 60 * 1000 );
    ul.children[1].setAttribute( "data-date", formatDate( tomorrow ) );
    var twodays = new Date( today.getTime() + 2 * 24 * 60 * 60 * 1000 );
    ul.children[2].setAttribute( "data-date", formatDate( twodays ) );
    var threedays = new Date( today.getTime() + 3 * 24 * 60 * 60 * 1000 );
    ul.children[3].setAttribute( "data-date", formatDate( threedays ) );
    ul.children[3].innerHTML = formatWeekdayGerman( threedays );
    var fouredays = new Date( today.getTime() + 4 * 24 * 60 * 60 * 1000 );
    ul.children[4].setAttribute( "data-date", formatDate( fouredays ) );
    ul.children[4].innerHTML = formatWeekdayGerman( fouredays );
    var fivedays = new Date( today.getTime() + 5 * 24 * 60 * 60 * 1000 );
    ul.children[5].setAttribute( "data-date", formatDate( fivedays ) );
    ul.children[5].innerHTML = formatWeekdayGerman( fivedays );
    var sixdays = new Date( today.getTime() + 6 * 24 * 60 * 60 * 1000 );
    ul.children[6].setAttribute( "data-date", formatDate( sixdays ) );
    ul.children[6].innerHTML = formatWeekdayGerman( sixdays );
    var sevendays = new Date( today.getTime() + 7 * 24 * 60 * 60 * 1000 );
    ul.children[7].setAttribute( "data-date", formatDate( sevendays ) );
    ul.children[7].innerHTML = formatWeekdayGerman( sevendays );
    var eightdays = new Date( today.getTime() + 8 * 24 * 60 * 60 * 1000 );
    ul.children[8].setAttribute( "data-date", formatDate( eightdays ) );
    ul.children[8].innerHTML = formatWeekdayGerman( eightdays );
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


