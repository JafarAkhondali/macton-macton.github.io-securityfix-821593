define(function (require) {
  var path  = require('path');
  var log   = require('./log');

  var files = [
    { children: [], meta: {}, permissions: "rwx" }
  ];

  var file_ids = {
    '/' :     0,
  };

  var next_file_id = 1;

  var fs = {
    mkdir: function( child_path ) {
      var parent_path = path.dirname( child_path );
      var child_name  = path.basename( child_path );

      if ( !(parent_path in file_ids) ) {
        fs.mkdir( parent_path );
      }

      var parent_id   = file_ids[ parent_path ];
      var parent_file = files[ parent_id ];
      var child_id    = next_file_id;
  
      if ( parent_file.children.indexOf( child_name ) > -1 ) {
        log.err( 'file exists "' + child_name + '"' );
        return;
      }
  
      parent_file.children.push( child_name );
  
      file_ids[ child_path ] = child_id;
      files[ child_id ]      = {
        children: [],
        meta: {},
        permissions: "rwx"
      };
  
      next_file_id++;
    },
    ls: function( target_path ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      return files[ target_id ].children;
    },
    setMeta: function( target_path, key, value ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      files[ target_id ].meta[key] = value;
    },
    getMeta: function( target_path, key ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      if ( key == null ) {
        return files[ target_id ].meta;
      } else {
        return files[ target_id ].meta[key];
      }
    },
    getPermissions: function( target_path ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      return files[ target_id ].permissions;
    },
    setPermissions: function( target_path, permissions ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      var result    = files[ target_id ].permissions;

      for ( var i=0;i<permissions.length;i++) {
        if ( result.indexOf( permissions[i] ) == -1 ) {
          result += permissions[i];
        }
      }

      files[ target_id ].permissions = result;
    },
    clearPermissions: function( target_path, permissions ) {
      if ( !(target_path in file_ids) ) {
        log.err('file not found "' + target_path + '"' );
         return [];
      }

      var target_id = file_ids[ target_path ];
      var result    = '';

      for ( var i=0;i<files[target_id].permissions.length;i++) {
        if ( permissions.indexOf( files[target_id].permissions[i] ) == -1 ) {
          result += files[target_id].permissions[i];
        }
      }

      files[ target_id ].permissions = result;
    },
    exists: function( target_path ) {
      return (target_path in file_ids);
    },
  };
  return fs;
});
