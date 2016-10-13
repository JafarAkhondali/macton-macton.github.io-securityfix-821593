define(function (require) {
  var script      = require('./script');
  var debug       = require('./debug');
  var path        = require('path');
  var working_dir = '/';
  var title       = '/';
  var description = '';
  var max_slots   = 12;

  var sub_folders = {};
  var dir_stack   = [];
  var blind       = {};
  var current_time = '';

  var map = {
    setTime: function( text ) {
      current_time = text;
    },
    getTime: function() {
      return current_time;
    },
    cd: function( sub_dir, initial_title ) {
      working_dir = path.resolve( working_dir, sub_dir );
      if ( initial_title == null ) {
        initial_title = '';
      }
      if (!sub_folders.hasOwnProperty(working_dir)) {
        sub_folders[working_dir] = [];
      }

      title       = initial_title;
      description = '';
      blind       = {};

      debug.log('map cd ' + working_dir + ' \"' + title + '\"' );
    },
    pushd: function( sub_dir, initial_title ) {
      debug.log('map pushd ' + working_dir );
      dir_stack.push( [ working_dir, title ] );
      map.cd( sub_dir, initial_title );
    },
    popd: function() {
      debug.log('map popd');
      var dir = dir_stack.pop();
      map.cd( dir[0], dir[1] ); 
    },
    dirs: function() {
      return dir_stack;
    }, 
    cwd: function() {
      return working_dir;
    },
    rm: function( dir ) {
      var dirname  = path.dirname( dir );
      var basename = path.basename( dir );
      debug.log('rm ' + dir );
      for (var i=0;i<max_slots;i++) {
        if ( sub_folders[dirname][i] && ( sub_folders[dirname][i][0] == dir ) ) {
          sub_folders[dirname][i] = null;
          return;
        }
      }
    },
    unlink: function( dir ) {
      var dirname  = path.dirname( dir );
      var basename = path.basename( dir );
      debug.log('unlink ' + dir );
      for (var i=0;i<max_slots;i++) {
        if ( sub_folders[dirname][i] && ( sub_folders[dirname][i][0] == dir ) ) {
          sub_folders[dirname][i][0] = null;
          return;
        }
      }
    },
    title: function() {
      if (description && (description.length > 0)) {
        return description;
      }
      return title;
    },
    setTitle: function( new_title ) {
      description = new_title;
    },
    add: function( sub_dir, sub_title ) {
      for (var i=0;i<max_slots;i++) {
        if ( sub_folders[working_dir][i] == null ) {
          sub_folders[working_dir][i] = [ path.resolve( working_dir, sub_dir ), sub_title ];
          return;
        }
      }
      debug.err('no slots left in map (cwd=' + working_dir + ', sub_dir=' + sub_dir + ', sub_title=' + sub_title + ')');
    },
    maxSubFolders: function() {
      return max_slots;
    },
    subFolders: function() {
      return sub_folders[working_dir];
    },
    rmSubFolders: function() {
      sub_folders[working_dir] = [];
    },
    setBlind: function( key, value ) {
      blind[key] = value;
    },
    getBlind: function( key ) {
      return blind[key];
    },
    subFolderCount: function() {
      var count = 0;
      for (var i=0;i<max_slots;i++) {
        if ( sub_folders[working_dir][i] ) {
          if ( sub_folders[working_dir][i][0] ) {
            count++;
          }
        }
      }
      return count;
    },
  };

  return map;
});
