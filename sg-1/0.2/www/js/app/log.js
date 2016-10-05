define(function (require) {

  var queued = [];

  var log = {
    out: function( text ) {
      queued.push( '%c(@yellowgreen)' + text  );
    },
    err: function( text ) {
      console.log( 'ERROR ' + text );
      queued.push( 'ERROR: %c(@red)' + text + '\n' );
    },
    warn: function( text ) {
      console.log( 'WARNING' + text );
      queued.push( 'WARNING %c(@orange)' + text + '\n' );
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
