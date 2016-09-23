define(function (require) {
  var map         = require('./map');
  var script      = require('./script');
  var path        = require('path');
  var pc          = {};
  var end         = {};

  return {
    incToYield: function() {
      var working_dir       = map.cwd();

      if ( !pc.hasOwnProperty( working_dir ) ) {
        pc[ working_dir ]  = [ 0, 0 ];
        end[ working_dir ] = [ script.variationCount( working_dir ), script.instructionCount( working_dir, 0 ) ];
      }

      var variation_ndx     = pc[ working_dir ][0];
      var instruction_ndx   = pc[ working_dir ][1];
      var variation_end     = end[ working_dir ][0];
      var instruction_end   = end[ working_dir ][1];
      var instructions      = script.instructions( working_dir, variation_ndx );
      var next_instructions = [];

      for (var i=instruction_ndx;i<instructions.length;i++) {
        next_instructions.push( instructions[i] );
        if ( script.isYieldInstruction( instructions[ i ] ) ) {
          break;
        }
      }

      instruction_ndx += next_instructions.length;
      if ( instruction_ndx >= instruction_end ) {
        if ( variation_ndx < variation_ndx ) {
          variation_ndx++;
          instruction_ndx = 0;
          instruction_end = script.instructionCount( working_dir, variation_ndx );
        }
      }

      pc[ working_dir ]  = [ instruction_ndx, variation_ndx ];
      end[ working_dir ] = [ instruction_end, variation_end ];
      
      return next_instructions;
    },
  };
});
