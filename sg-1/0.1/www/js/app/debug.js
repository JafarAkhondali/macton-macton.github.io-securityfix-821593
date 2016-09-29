define(function (require) {
  var dom       = require("./dom");
  var debug_box = dom.getElementById('debug-box');

  return {
    log: function( text ) {
      dom.appendChildHtml( debug_box, '<div><tt>' + text + '</tt><br></div>' );
    },
    warn: function( text ) {
      dom.appendChildHtml( debug_box, '<div><tt class="warning-text">WARNING:' + text + '</tt><br></div>' );
    },
    err: function( text ) {
      dom.appendChildHtml( debug_box, '<div><tt class="error-text">ERROR:' + text + '</tt><br></div>' );
    },
  }
});
