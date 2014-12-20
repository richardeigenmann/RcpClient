var SERVER_LAST_MODIFIED_URL = 'lastRecipeModified.json';
var SERVER_RECIPES_URL = 'recipes.json';


angular.module('recipeApp', ['ngSanitize', 'ngRoute','drawStars'])
        .factory('applicationDataFactory', [function applicationDataFactory() {
                var allRecipes = {"RcpAbpout.htm": {"filename": "RcpAbpout.htm",
                        "name": "Richard Eigenmann Rezeptsammlung",
                        "imageFilename": "Rcp120.jpg",
                        "width": "400", "height": "368",
                        "stars": "4",
                        "categories": {"Bewertung": ["4 Sterne"],
                            "Quelle": ["Richard Eigenmann"]}}};
                var selectedRecipes = allRecipes;
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

                function unfilter() {
                    selectedRecipes =
                            $.map(allRecipes, function (value, index) {
                                return [value];
                            }).sort(recipeCompare);
                }

                function filter(category, type) {
                    //console.log("Filter on: " + category + " " + type);
                    var categoryObject = index[category];
                    if (typeof categoryObject === 'undefined') {
                        console.log("index[" + category + "] still no good. Kill it...");
                        return;
                    }
                    var recipeNameArray = categoryObject[type];
                    var recipesArray = [];
                    for (var i = 0, len = recipeNameArray.length; i < len; i++) {
                        recipesArray.push(allRecipes[recipeNameArray[i]]);
                    }
                    selectedRecipes = recipesArray.sort(recipeCompare);
                }

                /**
                 * Returns the input String in lowercase with umlauts transformed to non umlaut characters
                 * so that the strings can be compared
                 * @param {type} inputString
                 * @returns {unresolved}
                 */
                function cleanString(inputString) {
                    var lc = inputString.toLowerCase();
                    var amp1 = lc.replace(/&auml;/g, 'a');
                    var amp2 = amp1.replace(/&ouml;/g, 'o');
                    var amp3 = amp2.replace(/&uuml;/g, 'u');
                    var u1 = amp3.replace(/ü/g, 'u');
                    var u2 = u1.replace(/ä/g, 'a');
                    var u3 = u2.replace(/ö/g, 'o');
                    return u3;
                }

                /**
                 * Function to be used in array.sort( recipeCompare ) to sort arrays of recipes
                 * alphabeticalls
                 * @param {type} a
                 * @param {type} b
                 * @returns {Number}
                 */
                function recipeCompare(a, b) {
                    var a1 = decodeUmlauts(a.name);
                    var b1 = decodeUmlauts(b.name);
                    if (a1 < b1)
                        return -1;
                    if (a1 > b1)
                        return 1;
                    return 0;
                }

                /**
                 * Returns String with the Umlauts replaced as normal characters
                 * @param {type} inputString
                 * @returns {unresolved}
                 */
                function decodeUmlauts(inputString) {
                    var s1 = inputString.replace(/&auml;/g, 'ae');
                    var s2 = s1.replace(/&ouml;/g, 'oe');
                    var s3 = s2.replace(/&uuml;/g, 'ue');
                    var s4 = s3.replace(/&Auml;/g, 'Ae');
                    var s5 = s4.replace(/&Ouml;/g, 'Oe');
                    var s6 = s5.replace(/&Uuml;/g, 'Ue');
                    return s6;
                }

                function searchFor(searchString) {
                    console.log("Search for: " + searchString);

                    var cleanSearchString = cleanString(searchString);
                    var searchResults = [];
                    // Search in Recipe Name
                    for (var key in allRecipes) {
                        var recipe = allRecipes[key];
                        if (cleanString(recipe.name).match(cleanSearchString)) {
                            searchResults.push(recipe);
                        }
                    }
                    // Search for Category Members
                    var alsoFoundText = '';
                    for (var key in index) {
                        for (var subkey in index[key]) {
                            if (cleanString(subkey).match(cleanSearchString)) {
                                // copy over all the recipes belonging to this category member
                                var len = index[key][subkey].length;
                                alsoFoundText += key + "/" + subkey + " (" + len + ") ";
                                for (var i = 0; i < len; i++) {
                                    rcpId = allRecipes[ index[key][subkey][i] ];
                                    searchResults.push(allRecipes[ index[key][subkey][i] ]);
                                }
                            }
                        }
                    }

                    // See http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
                    var uniqSortedSearchResults = searchResults.filter(function (elem, pos) {
                        return searchResults.indexOf(elem) == pos;
                    }).sort(recipeCompare);

                    console.log("Found: " + uniqSortedSearchResults.length + " " + alsoFoundText);
                    selectedRecipes = uniqSortedSearchResults;

                }

                return {
                    getAllRecipes: function () {
                        return allRecipes;
                    },
                    setAllRecipes: function (newAllRecipes) {
                        allRecipes = newAllRecipes;
                        buildCategories();
                        unfilter(); // Should this be the responsibility of a setter? But it belongs even less to the loader.
                    },
                    getIndex: function () {
                        return index;
                    },
                    getSelectedRecipes: function () {
                        return selectedRecipes;
                    },
                    filterRecipes: function (category, type) {
                        filter(category, type);

                    },
                    unfilterRecipes: function () {
                        unfilter();
                    },
                    searchFor: function (searchString) {
                        searchFor(searchString);
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
        .factory('recipeLoaderFactory', ['$http', 'applicationDataFactory', '$q',
            function lastDateFactory($http, applicationDataFactory, $q) {
                var loaderStatus = "Loader starting up...";
                var deferred = $q.defer();
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
                            deferred.resolve("Done");
                        }, function (err) {
                            loaderStatus = "Error downloading: " + err;
                            console.log('ERR', err);
                            alert(err);
                            deferred.reject(loaderStatus);

                        });

                    } else {
                        loaderStatus = "Loading from browser localStorage...";
                        var parsedRecipes = JSON.parse(localStorage.getItem("recipes"));
                        applicationDataFactory.setAllRecipes(parsedRecipes);
                        loaderStatus = "Loaded from browser localStorage";
                        deferred.resolve("Done");
                    }
                }, function (err) {
                    loaderStatus = "Error checking: " + err;
                    console.log('ERR', err);
                    alert(err);
                    deferred.reject(loaderStatus);

                });

                return {
                    getLoaderStatus: function () {
                        return loaderStatus;
                    },
                    getResolved: function () {
                        return deferred.promise;
                    }
                };
            }
        ])
        .controller('RouteController', ['$scope', '$route', '$routeParams', 'applicationDataFactory', function ($scope, $route, $routeParams, applicationDataFactory) {
                this.category = $routeParams.category;
                $scope.category = $routeParams.category;
                this.type = $routeParams.type;
                $scope.type = $routeParams.type;
                applicationDataFactory.filterRecipes(this.category, this.type);
            }]
                )
        .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.when('/', {
                    template: '<h5>/ route</h5>',
                    controller: ['$routeParams', 'applicationDataFactory', function ($routeParams, applicationDataFactory) {
                            applicationDataFactory.unfilterRecipes();
                        }],
                    controllerAs: 'RouteController'

                })
                        .when('/category/:category/:type', {
                            template: '<h5>We are on a route: /{{category}}/{{type}}</h5>',
                            controller: 'RouteController',
                            controllerAs: 'RouteController',
                            resolve: {
                                message: function (recipeLoaderFactory) {
                                    return recipeLoaderFactory.getResolved();
                                }
                            },
                        })

                        .otherwise({redirectTo: '/'});
            }])
        .controller('RecipeController', ['applicationDataFactory', 'recipeLoaderFactory', '$scope',
            function RecipeController(applicationDataFactory, recipeLoaderFactory, $scope) {
                var self = this;
                self.results = 0;

                $scope.$watch(function () {
                    return applicationDataFactory.getSelectedRecipes()
                }, function (newVal, oldVal) {
                    if (typeof newVal !== 'undefined') {
                        self.recipes = applicationDataFactory.getSelectedRecipes();
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

                $scope.mySearch = function () {
                    applicationDataFactory.searchFor(self.searchString);
                };

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

        ;


