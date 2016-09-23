define(function (require) {
  var script             = require('./script');
  var map                = require('./map');
  var instruction_stream = require('./instruction_stream');
  var debug              = require('./debug');
  var render             = require('./render');
  var events             = require('./events');
  var self               = this;

  var instruction_map = {
    "Describe": function( text ) {
      debug.log("map title \"" + text + "\"" );
      map.setTitle( text );
    }, 
    "AddToMap": function( title, sub_dir ) {
      debug.log("map add \"" + title + "\" " + sub_dir );
      map.add( sub_dir, title );
    }, 
    "Think": function( speaker, line ) {
      debug.log("think [" + speaker + "] \"" + line + "\"" );
      map.setBlind( 'Line', [ speaker, line, 'dialogue-think' ] );
    }, 
    "Read": function( speaker, line ) {
      debug.log("read [" + speaker + "] \"" + line + "\"" );
      map.setBlind( 'Line', [ speaker, line, 'dialogue-read' ] );
    }, 
    "ClearLine": function( speaker, line ) {
      debug.log("clear_line");
      map.setBlind( 'Line', [ '', '', '' ] );
    }, 
  };

  events.on( 'open-map-element', function( dir, name ) {
    map.pushd( dir, name );
    session.next();
  });

  events.on( 'next-line', function() {
    session.next();
  });

  events.on( 'map-back', function() {
    var cwd = map.cwd();
    var config = script.config( cwd );

    if ( config.DeleteSelfWhenDone ) {
      if ( instruction_stream.eof() ) {
        map.rm( cwd );
      }
    }
    if ( config.DeleteSelfWhenEmpty ) {
      if ( map.subFolderCount() == 0 ) {
        map.rm( cwd );
      }
    }
    map.popd();
    session.next();
  });

  function execute_instruction( instruction ) {
    var instruction_args = instruction.slice();
    var instruction_cmd  = instruction_args.shift();

    if ( !instruction_map.hasOwnProperty( instruction_cmd ) ) {
      debug.err( 'bad instruction name \"' + instruction_cmd + '\" source = [' + instruction + ']' ); 
      return;
    }

    instruction_map[ instruction_cmd ].apply( self, instruction_args );
  }

  var session = {
    setScript: function( script_obj ) {
      script.setScript( script_obj );
    },
    cdMap: function( dir, title ) {
      map.cd( dir, title );
    },
    next: function() {
      var next_instructions = instruction_stream.incToYield();

      next_instructions.forEach( execute_instruction );
      render.update();
    }
  };

  return session;
});
