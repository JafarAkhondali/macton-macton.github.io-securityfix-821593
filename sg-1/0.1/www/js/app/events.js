define(function (require) {
  var debug = require("./debug");
  var callbacks = {};

  return {
    trigger: function( type, args ) {
      var func = callbacks[type];
      if (func) {
        func.apply( null, args );
      } else {
        debug.warn('No handler for event \"' + type + '\" [' + args + ']' );
      }
    },
    on: function( type, func ) {
      callbacks[type] = func;
    },
  }
});
