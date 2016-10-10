define(function (require) {

  // #TODO Lex/Parse commands to server better
 
  var scripts = require('./scripts');
  var log     = require('./log');
  var socket  = new WebSocket("ws://" + location.host );

  socket.onmessage = function(event) {
    var msg           = JSON.parse( event.data );
    var cmd           = msg.cmd;

    if (cmd == 'LOAD') {
      var script_path   = decodeURIComponent( msg.path );
      var script_source = decodeURIComponent( msg.text );
      if ( script_path.indexOf('/.shell') == -1 ) {
        scripts.setFromText( script_path, script_source );
        console.log( 'LOAD ' + script_path );
      } 
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
    rmScript: function( script_path ) {
      socket.send( "RM" + "|" + encodeURIComponent(script_path) + '|' );
      console.log( 'RM ' + script_path );
    },
    archiveAll: function() {
      socket.send( 'ARCHIVE|' );
      console.log( 'ARCHIVE ALL' );
    },
    saveAll: function() {
      var scripts_all = scripts.getAll();
      Object.keys(scripts_all).forEach( function( script_path ) {
        // don't save shell scripts
        if ( script_path.indexOf('/.shell') == -1 ) {
          var script_source = scripts_all[ script_path ];
          if (script_source) {
            socket.send( "SAVE" + "|" + encodeURIComponent(script_path) + "|" + encodeURIComponent(script_source.join('\n')) );
            console.log( 'SAVE ' + script_path );
          }
        }
      });
    },
  };

  return archive;
});
