<?php

//  This script sends a json array of Recipe classes of the recipes that are newer than the parameter date
//  If no parameter is passed a start date before any of the recipe files was created is chosen so all 
//  recipes are returned.

//  http://richieigenmann.users.sourceforge.net/recipeinfo.php?startfrom=2000-01-01+00%3A00%3A00
//  http://localhost/Homepage/recipeinfo.php?startfrom=2000-01-01+00%3A00%3A00
//  Bash:  php-cgi recipeinfo.php startfrom=2010-01-01+00%3A00%3A00

$dir = "@recipeDirectory@";

class Recipe {

    public $filename;
    public $name;
    public $imageFilename;
    public $width;
    public $height;
    public $categories;

}

// Script to enumerate the directory of recipes
if ( isset ( $_GET[ 'startfrom' ] ) ) {
    $startFrom = $_GET[ 'startfrom' ];
} else {
    $startFrom = '2000-01-01 00:00:00';
}
$startFromTime = strtotime ( $startFrom );

//echo "startFrom parameter: " . $startFrom;
//echo "<br>";
//echo "Linux startFromTime: " . $startFromTime;
//echo "<br>";
//echo "Local directory: " . $dir;

$recipeFilenamePattern = "/^Rcp\d{3}\.htm$/";
$myDirectory = opendir ( $dir );
while ( $entryName = readdir ( $myDirectory ) ) {
    if ( ( filemtime ( $dir . $entryName ) > $startFromTime ) and ( preg_match ( $recipeFilenamePattern, $entryName ) > 0 ) ) {
        $dirArray[ ] = $entryName;
    }
}
closedir ( $myDirectory );

sort ( $dirArray );

// parse the recipes into an array of Recipe objects
$dataPattern = "/<meta.*RCP-|<title>|<img/i";
$titlePattern = "/<title>(?P<title>.*)<\/title>.*/i";
$imgPattern = "/<img src=\"(?P<img>.*)\".*alt=.* width=\"(?P<width>[0-9]+)\".* height=\"(?P<height>[0-9]+)\".*>/i";
$metaPattern = "/<META.*name=\"RCP-(?P<name>.*)\".*content=\"(?P<content>.*)\"/i";
foreach ( $dirArray as $filename ) {
    //echo "File: " . $dir . $filename . "<br>";
    $recipe = new Recipe();
    $recipe->filename = $filename;

    $matches = preg_grep ( $dataPattern, file ( $dir . $filename ) );
    foreach ( $matches as $match ) {
        if ( preg_match ( $titlePattern, $match, $titleMatchArray ) > 0 ) {
            $recipe->name = $titleMatchArray[ 1 ];
        } elseif ( preg_match ( $metaPattern, $match, $metaMatchArray ) > 0 ) {
            if ( !isset ( $recipe->categories[ $metaMatchArray[ 1 ] ] ) ) {
                $recipe->categories[ $metaMatchArray[ 1 ] ] = array( );
            }
            array_push ( $recipe->categories[ $metaMatchArray[ 1 ] ], $metaMatchArray[ 2 ] );
        } elseif ( preg_match ( $imgPattern, $match, $imgMatchArray ) > 0 ) {
            $recipe->imageFilename = $imgMatchArray[ 1 ];
            $recipe->width = $imgMatchArray[ 2 ];
            $recipe->height = $imgMatchArray[ 3 ];
        }
    }
    $recipes[ $recipe->filename ] = $recipe;
}
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Wed, 8 May 2013 00:00:00 GMT');
header('Content-type: application/json');
echo json_encode ( $recipes );
?>
