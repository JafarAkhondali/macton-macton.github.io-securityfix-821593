define(function (require) {
  var script             = require('./script');
  var map                = require('./map');
  var instruction_stream = require('./instruction_stream');
  var debug              = require('./debug');
  var render             = require('./render');
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
  }

  function execute_instruction( instruction ) {
    var instruction_args = instruction.slice();
    var instruction_cmd  = instruction_args.shift();

    if ( !instruction_map.hasOwnProperty( instruction_cmd ) ) {
      console.log( 'ERROR: bad instruction name (' + instruction + ')' ); 
      return;
    }

    instruction_map[ instruction_cmd ].apply( self, instruction_args );
  }

  return {
    setScript: function( script_obj ) {
      script.setScript( script_obj );
    },
    cdMap: function( dir ) {
      map.cd( dir );
    },
    next: function() {
      var next_instructions = instruction_stream.incToYield();

      next_instructions.forEach( execute_instruction );
      render.update();
    }
  };
});
