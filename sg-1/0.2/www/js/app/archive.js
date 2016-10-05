define(function (require) {

  var scripts = require('./scripts');
  var log     = require('./log');
  var socket  = new WebSocket("ws://" + location.host );

  socket.onmessage = function(event) {
    var msg           = JSON.parse( event.data );
    var cmd           = msg.cmd;

    if (cmd == 'LOAD') {
      var script_path   = decodeURIComponent( msg.path );
      var script_source = decodeURIComponent( msg.text );
      scripts.setFromText( script_path, script_source );
      console.log( 'LOAD ' + script_path );
    } else {
      log.err('Unknown cmd from server');
      console.log(event.data);
    }
  }

  socket.onopen = function() {
    socket.send('JOIN|');
  };

  var archive = {
    saveScript: function( script_path, script_source ) {
      socket.send( "SAVE" + "|" + encodeURIComponent(script_path) + "|" + encodeURIComponent(script_source) );
      console.log( 'SAVE ' + script_path );
    },
  };

  return archive;
});
