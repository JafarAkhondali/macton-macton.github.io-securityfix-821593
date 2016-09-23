define(function (require) {

  var shirt   = require("./shirt");
  var logger  = require("./logger");
  var session = require("./session");
  var debug   = require("./debug");
  var dom     = require("./dom");
  var day_2   = require("json!../../data/day_2.json");

  function main() {

    debug.log( "Shirt color is: " + shirt.color );
   
    session.setScript( day_2 );
    session.cdMap( '/day_2/1300/donut_shop' );
    session.next();
  }

  dom.onReady( main );
});
