define(function (require) {
  var $ = require('jquery');
  $(function() {
    var shirt = require("./shirt");
    var logger = require("./logger");
    var day_2  = require("json!../../data/day_2.json");

    $('#debug-box').append("<tt>Shirt color is: " + shirt.color + '</tt>');
    logger.logTheShirt();
    console.log( day_2 );
  });
});
