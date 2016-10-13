define(function (require) {
  var map         = require('./map');
  var script      = require('./script');
  var debug       = require('./debug');
  var path        = require('path');
  var pc          = {};
  var end         = {};

  return {
    reset: function() {
      var working_dir       = map.cwd();
      debug.log('reset instructions ' + working_dir );

      pc[ working_dir ][0] = end[ working_dir ][0]-1;
      pc[ working_dir ][1] = 0;
    },
    incToYield: function() {
      var working_dir       = map.cwd();
      debug.log('inc instructions ' + working_dir );

      if ( !pc.hasOwnProperty( working_dir ) ) {
        pc[ working_dir ]  = [ 0, 0 ];
        end[ working_dir ] = [ script.variationCount( working_dir ), script.instructionCount( working_dir, 0 ) ];
      }

      var variation_ndx     = pc[ working_dir ][0];
      var instruction_ndx   = pc[ working_dir ][1];
      var variation_end     = end[ working_dir ][0];
      var instruction_end   = end[ working_dir ][1];

      // start next variation
      if ( instruction_ndx >= instruction_end ) {
        if ( variation_ndx < (variation_end-1) ) {
          variation_ndx++;
          instruction_ndx = 0;
          instruction_end = script.instructionCount( working_dir, variation_ndx );
        }
      }

      var instructions      = script.instructions( working_dir, variation_ndx );
      var next_instructions = [];

      for (var i=instruction_ndx;i<instructions.length;i++) {
        next_instructions.push( instructions[i] );
        if ( script.isYieldInstruction( instructions[ i ] ) ) {
          break;
        }
      }

      instruction_ndx += next_instructions.length;

      pc[ working_dir ]  = [ variation_ndx, instruction_ndx ];
      end[ working_dir ] = [ variation_end, instruction_end ];
      
      return next_instructions;
    },
    eof: function() {
      var working_dir       = map.cwd();
      var instruction_ndx   = pc[ working_dir ][1];
      var instruction_end   = end[ working_dir ][1];

      return ( instruction_ndx >= instruction_end );
    },
    endOfStream: function() {
      var working_dir         = map.cwd();
      var variation_ndx       = pc[ working_dir ][0];
      var instruction_ndx     = pc[ working_dir ][1];
      var variation_end       = end[ working_dir ][0];
      var instruction_end     = end[ working_dir ][1];
      var is_variation_remain = ( variation_ndx < (variation_end-1) );
      var is_variation_done   = ( instruction_ndx >= instruction_end );
      return ((!is_variation_remain) && is_variation_done);
    },
  };
});
