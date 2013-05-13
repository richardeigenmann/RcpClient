<?php
// script to extract the relevant information from the recipies for the Offline Recipe Manager
// Call: newrecipestats.php?startfrom=2011-01-01+00%3A00%3A00
// http://richieigenmann.users.sourceforge.net/newrecipestats.php?startfrom=2000-01-01+00%3A00%3A00


$startFrom = $_GET['startfrom'];
$startFromTime = strtotime( $startFrom );

$myDirectory = opendir(".");
$recipeFilenamePattern = "/^Rcp\d{3}\.htm$/";
$totalRecipes = 0;
$newRecipes = 0;
while($entryName = readdir($myDirectory)) {

	if ( preg_match ( $recipeFilenamePattern, $entryName ) > 0 ) {
		$totalRecipes++;
		if ( filemtime( $entryName ) > $startFromTime ) {
			$newRecipes++;
		}
	}
}
closedir($myDirectory);

header('Cache-Control: no-cache, must-revalidate');
header('Expires: Wed, 8 May 2013 00:00:00 GMT');
header('Content-type: application/json');
echo $newRecipes . "/" . $totalRecipes;

?>
