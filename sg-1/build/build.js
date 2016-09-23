var dir  = require('recursive-readdir');
var path = require('path');
var fs   = require('fs');

var root = {
  config: { },
  child: { }
};

function add_source( source_dir ) {
  var source_path = source_dir.split('/');  
  var build_node  = root;
  source_path.forEach( function( sub_dir ) {
    if ( !build_node.child.hasOwnProperty( sub_dir ) ) {
      build_node.child[ sub_dir ] = { 
        config: { },
        child: { }
      }
    }
    build_node = build_node.child[ sub_dir ];
  });
  return build_node;
}

dir('day_2',function( err, files ) {
  files.forEach( function( file ) {
    console.log( file + '...' );
    var dir         = path.dirname( file );
    var base        = path.basename( file );
    var build_node  = add_source( dir );
    var source_text = fs.readFileSync( file, 'utf8' );
    var source_obj  = JSON.parse( source_text );

    if ( base == 'config.json' ) {
      build_node.config = source_obj;
    } else {
      if ( build_node.text === undefined ) {
        build_node.text = [];
      }
      build_node.text.push( source_obj ); 
    }
  });

  fs.writeFileSync( '../www/data/day_2.json', JSON.stringify( root, null, 2 ), 'utf8' );
});


