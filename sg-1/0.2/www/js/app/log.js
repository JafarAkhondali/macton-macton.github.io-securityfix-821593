define(function (require) {

  var queued = [];

  var log = {
    out: function( text ) {
      queued.push( '%c(@yellowgreen)' + text  );
    },
    err: function( text ) {
      queued.push( '%c(@red)' + text );
    },
    warn: function( text ) {
      queued.push( '%c(@orange)' + text );
    },
    get: function() {
      return queued;
    }, 
    empty: function() {  
      queued = [];
    }
  };

  return log;
});
