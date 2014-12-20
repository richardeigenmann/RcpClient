angular.module('drawStars', [])
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


            function drawStars(stars, maxStars, onColor, offColor, ctx) {
                ctx.fillStyle = offColor;

                for (i = maxStars; i > 0; i--) {
                    if (stars >= i) {
                        ctx.fillStyle = onColor;
                    }
                    drawStar(ctx, (i-1) * 20 + 11, 11);
                }
            }

            return {
                restrict: "E",
                scope: {
                    stars: '=stars',
                    maxstars: '=maxstars',
                },
                template: "<canvas height='21'></canvas>",
                link: function (scope, element) {
                    var canvas = element.find('canvas')[0];
                    var ctx = canvas.getContext('2d');
                    
                    // default to 4 stars if nothing is defined
                    var maximumStars;
                    if (! scope.maxstars ) {
                        maximumStars = 4;
                    } else {
                        maximumStars = parseInt(scope.maxstars);
                    }
                    
                    canvas.width =  maximumStars * 20 + 2;
                    var offColor = "gold";
                    var onColor = "red";
                    drawStars(parseInt(scope.stars), maximumStars, onColor, offColor, ctx);
                }
            };
        })

        ;


