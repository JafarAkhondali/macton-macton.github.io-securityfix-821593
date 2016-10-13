//
// Instructions:
//
// - Describe <text>
// - Think <person> <text>
// - Speak <person> <text>
// - AddToMap <description> <path>

define(function (require) {
  var path = require('path');
  var debug = require('./debug');
  var script;

  var yield_instructions = [ 'Think', 'Speak', 'Read', 'Time' ];
      
  function nodeFromPath( script_path ) {
    var node       = script;       
    var path_split = script_path.split(path.sep);

    for (var i=0;i<path_split.length;i++) {
      var sub_dir = path_split[i];
      if ( sub_dir.length ) {
        if (!node.child.hasOwnProperty( sub_dir )) {
          return null;
        }
        node = node.child[ sub_dir ];
      }
    }
    return node;
  }

  return {
    setScript: function( script_obj ) {
      script = script_obj;
    },
    variationCount: function( script_path ) {
      var node = nodeFromPath( script_path );
      if (!node) {
        return 0;
      }
      return node.text.length;
    },
    instructionCount: function( script_path, variation_ndx ) {
      var node = nodeFromPath( script_path );
      if (!node) {
        return 0;
      }
      return (node.text.length > variation_ndx) ? node.text[variation_ndx].length : 0;
    },
    instructions: function( script_path, variation_ndx ) {
      var node = nodeFromPath( script_path );
      if (!node) {
        return [];
      }
      return node.text[ variation_ndx ];
    },
    isYieldInstruction: function( instruction ) {
      return (yield_instructions.indexOf(instruction[0]) > -1);
    },
    config: function( script_path ) {
      var node = nodeFromPath( script_path );
      if (!node) {
        return {};
      }
      return node.config;
    },
  };

});
