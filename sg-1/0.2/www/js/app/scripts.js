define(function (require) {

  var script_table = {
  };

  var scripts = {
    link: function( source_path, target_path ) {
      script_table[ source_path ] = { link: target_path };
    },
    append: function( source_path, line ) {
      if ( script_table[ source_path ] == null ) {
        script_table[ source_path ] = { content: [] };
      }
      script_table[ source_path ].content.push( line );
    },
    emptyAll: function() {
      script_table = {};
    },
    empty: function( source_path ) {
      if ( source_path == null ) {
        console.log('ERROR: Tried to scripts.empty without source_path '); 
        return;
      }
      script_table[ source_path ] = null;
    },
    setFromText: function( source_path, text ) {
      var lines = text.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
      if ( script_table[ source_path ] == null ) {
        script_table[ source_path ] = {};
      }
      script_table[ source_path ].content = lines;
    },
    setContent: function( source_path, lines ) {
      if ( script_table[ source_path ] == null ) {
        script_table[ source_path ] = {};
      }
      script_table[ source_path ].content = lines;
    },
    get: function( source_path ) {
      if ( script_table[ source_path ] == null ) {
        return null;
      }

      if ( script_table[ source_path ].link ) {
        return scripts.get( script_table[ source_path ].link );
      }

      return script_table[ source_path ].content;
    },
    getAll: function() {
      var result = {};
      Object.keys(script_table).forEach( function( script_path ) {
        result[script_path] = scripts.get( script_path );
      });
      return result;
    },
    mv: function( src, dst ) {
      Object.keys(script_table).forEach( function( script_path ) {
        if ( script_path.indexOf(src) !== -1 ) {
          var script_data     = script_table[ script_path ];
          var new_script_path = script_path.replace( src, dst );
          script_table[new_script_path] = script_data;
          delete script_table[ script_path ];
        }
      });
    },
  };

  return scripts;
});
