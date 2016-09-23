define(function (require) {
  var script      = require('./script');
  var debug       = require('./debug');
  var path        = require('path');
  var working_dir = '/';
  var title       = '/';
  var max_slots   = 16;

  var sub_folders = {};

  return {
    cd: function( sub_dir, initial_title ) {
      working_dir = path.resolve( working_dir, sub_dir );
      if ( !initial_title ) {
        title = '';
      }
      if (!sub_folders.hasOwnProperty(working_dir)) {
        sub_folders[working_dir] = [];
      }
      debug.log('map cd ' + working_dir );
    },
    cwd: function() {
      return working_dir;
    },
    title: function() {
      return title;
    },
    setTitle: function( new_title ) {
      var old_title = title;
      title = new_title;
      return old_title;
    },
    add: function( sub_dir, sub_title ) {
      for (var i=0;i<max_slots;i++) {
        if ( sub_folders[working_dir][i] == null ) {
          sub_folders[working_dir][i] = [ sub_dir, sub_title ];
          return;
        }
      }
      debug.log('ERROR: no slots left in map (cwd=' + working_dir + ', sub_dir=' + sub_dir + ', sub_title=' + sub_title + ')');
    },
  };
});
