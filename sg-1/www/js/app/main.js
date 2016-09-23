define(function (require) {

  var session = require("./session");
  var debug   = require("./debug");
  var dom     = require("./dom");
  var day_2   = require("json!../../data/day_2.json");

  function main() {
    session.setScript( day_2 );
    session.cdMap( '/day_2/1300/donut_shop', "Donut Shop" );
    session.next();
  }

  dom.onReady( main );
});
