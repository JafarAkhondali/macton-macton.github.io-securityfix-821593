define(function (require) {
  var $ = require('jquery');
  $(function() {
    var shirt = require("./shirt");
    var logger = require("./logger");

    $('#debug-box').append("<tt>Shirt color is: " + shirt.color + '</tt>');
    logger.logTheShirt();

  });
});
