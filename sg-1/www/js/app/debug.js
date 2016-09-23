define(function (require) {
  var dom       = require("./dom");
  var debug_box = dom.getElementById('debug-box');

  return {
    log: function( text ) {
      dom.appendChildHtml( debug_box, '<div><tt>' + text + '</tt><br></div>' );
    },
  }
});
