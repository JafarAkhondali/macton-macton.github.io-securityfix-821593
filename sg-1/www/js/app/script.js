//
// Instructions:
//
// - Describe <text>
// - Think <person> <text>
// - Speak <person> <text>
// - AddToMap <description> <path>

define(function (require) {
  var path = require('path');
  var script;

  function nodeFromPath( script_path ) {
    var node = script;       
    var path_split = script_path.split(path.sep);
    script_path.split(path.sep).forEach( function( sub_dir ) {
      if (!node.child.hasOwnProperty( sub_dir )) {
        return null;
      }
      if (sub_dir.length) {
        node = node.child[ sub_dir ];
      }
    });
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
      if ( instruction[0] == 'Think' ) {
        return true;
      }
      if ( instruction[0] == 'Speak' ) {
        return true;
      }
      return false;
    },
  };

});
