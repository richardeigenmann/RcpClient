var SERVER_LAST_MODIFIED_URL = 'lastRecipeModified.json';
var SERVER_RECIPES_URL = 'recipes.json';


angular.module('recipeApp', ['ngSanitize'])
        .factory('applicationDataFactory', [function applicationDataFactory() {
                var allRecipes = {"Rcp001.htm": {"filename": "Rcp001.htm", "name": "Beeren-Tiramisu", "imageFilename": "Rcp001.jpg", "width": "400", "height": "294", "categories": {"Speise-Kategorie": ["Desserts", "Vegetarisch"], "Zutat": ["L&ouml;ffelbisquits", "QimiQ", "Milch", "Mascarpone", "Zitronen", "Vollrahm", "Zucker", "Mandelsplitter"], "Bewertung": ["4 Sterne"], "Quelle": ["Lilian Stross"]}}};
                var index = {};

                function buildCategories() {
                    for (var key in allRecipes) {
                        var recipe = allRecipes[key];
                        for (var category in recipe.categories) {
                            if (index[category] == null) {
                                index[category] = {};
                            }
                            for (var i = 0, len = recipe.categories[category].length; i < len; i++) {
                                var member = recipe.categories[category][i];
                                if (index[category][member] == null) {
                                    index[category][member] = [];
                                }
                                index[category][member].push(key);
                            }
                        }
                    }
                }

                return {
                    getAllRecipes: function () {
                        return allRecipes;
                    },
                    setAllRecipes: function (newAllRecipes) {
                        allRecipes = newAllRecipes;
                        buildCategories();
                    },
                    getIndex: function () {
                        return index;
                    }
                }
            }
        ])
        /**
         * Responsible for loading the recipe metadata to the applicationDataFactory and
         * maintains a string "loaderStatus" that reports where it is in the process.
         * The recipes will be saved in the localStorage of the webbrowser and will 
         * be loaded from there unless changes were made to the recipes on the server.
         */
        .factory('recipeLoaderFactory', ['$http', 'applicationDataFactory',
            function lastDateFactory($http, applicationDataFactory) {
                var loaderStatus = "Loader starting up...";
                //localStorage.removeItem("lastModifiedDate");
                //localStorage.removeItem("recipes");

                $http.get(SERVER_LAST_MODIFIED_URL).then(function (response) {
                    var serverLastModified = new Date(Date.parse(response.data.lastRecipeModified));
                    var localStorageLastModified = new Date(localStorage.getItem("lastModifiedDate"));
                    if (serverLastModified > localStorageLastModified) {
                        loaderStatus = "Downloading recipes from server...";
                        $http.get(SERVER_RECIPES_URL).then(function (response2) {
                            localStorage.setItem("lastModifiedDate", serverLastModified);
                            var recipes = response2.data;
                            applicationDataFactory.setAllRecipes(recipes);
                            loaderStatus = "Downloaded from server";
                            localStorage.setItem("recipes", JSON.stringify(recipes));
                        }, function (err) {
                            loaderStatus = "Error downloading: " + err;
                            console.log('ERR', err);
                            alert(err);

                        });

                    } else {
                        loaderStatus = "Loading from browser localStorage...";
                        var parsedRecipes = JSON.parse(localStorage.getItem("recipes"));
                        applicationDataFactory.setAllRecipes(parsedRecipes);
                        loaderStatus = "Loaded from browser localStorage";
                    }
                }, function (err) {
                    loaderStatus = "Error checking: " + err;
                    console.log('ERR', err);
                    alert(err);

                });

                return {
                    getLoaderStatus: function () {
                        return loaderStatus;
                    }
                };
            }
        ])
        .controller('recipeController', ['applicationDataFactory', 'recipeLoaderFactory', '$scope',
            function recipeController(applicationDataFactory, recipeLoaderFactory, $scope) {
                var self = this;
                self.results = 0;

                $scope.$watch(function () {
                    return applicationDataFactory.getAllRecipes()
                }, function (newVal, oldVal) {
                    if (typeof newVal !== 'undefined') {
                        self.recipes = applicationDataFactory.getAllRecipes();
                        self.results = Object.keys(self.recipes).length;
                    }
                });

                $scope.$watch(function () {
                    return applicationDataFactory.getIndex()
                }, function (newVal, oldVal) {
                    if (typeof newVal !== 'undefined') {
                        self.index = applicationDataFactory.getIndex();
                    }
                });

                $scope.$watch(function () {
                    return recipeLoaderFactory.getLoaderStatus()
                }, function (newVal, oldVal) {
                    if (typeof newVal !== 'undefined') {
                        self.loaderStatus = recipeLoaderFactory.getLoaderStatus();
                    }
                });

            }
        ])
        .directive('recipeWidget', [function () {
                return {
                    templateUrl: 'RecipeWidget.html',
                    restrict: 'E',
                    scope: {
                        recipe: '=',
                    }
                };
            }
        ])
        .directive("drawstars", function () {

            /**
             * Originally found this page: http://programmingthomas.wordpress.com/2012/05/16/drawing-stars-with-html5-canvas/
             * This draws a star using parametrised radius and spike length. I fear that doing all those floating point 
             * calculations could be really slow so I have "pre-rendered" the calculations into this function for a small star.
             * @param {type} ctx
             * @param {type} x
             * @param {type} y
             * @returns {undefined}
             */
            function drawStar(ctx, x, y) {
                ctx.save();
                ctx.beginPath();
                ctx.translate(x, y);
                ctx.moveTo(0, -10);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -4.5);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -10);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -4.5);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -10);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -4.5);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -10);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -4.5);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -10);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -4.5);
                ctx.rotate(0.6283185307179586);
                ctx.lineTo(0, -10);
                ctx.fill();
                ctx.restore();
            }


            function drawStars(starsString, ctx) {
                ctx.fillStyle = "gold";
                if (starsString === "4 Sterne") {
                    ctx.fillStyle = "red";
                }
                drawStar(ctx, 71, 11);
                if (starsString === "3 Sterne") {
                    ctx.fillStyle = "red";
                }
                drawStar(ctx, 51, 11);
                if (starsString === "2 Sterne") {
                    ctx.fillStyle = "red";
                }
                drawStar(ctx, 31, 11);
                if (starsString === "1 Stern") {
                    ctx.fillStyle = "red";
                }
                drawStar(ctx, 11, 11);
            }

            return {
                restrict: "A",
                scope: {
                    // the recipe is inherited from the parent scope so I
                    // could leave it off but I am trying to make things explicit
                    recipe: '=drawstars',
                },
                link: function (scope, element) {
                    var ctx = element[0].getContext('2d');
                    drawStars(scope.recipe.categories.Bewertung[0], ctx);
                }
            };
        })

        ;


