define(function (require) {

  var path    = require('path');
  var fs      = require('./fs');
  var scripts = require('./scripts');
  var scene   = require('./scene');
  var env     = require('./env');
  var log     = require('./log');
  var Parser  = require('termlib_parser');
  var parser  = new Parser();

  function sceneUpdate() {
    sceneUpdateFolders();
  }
   
  function sceneUpdateFolders() {
    scene.isFoldersDirty = true;
    scene.folders        = fs.ls( env.cwd ).map( function( child_name ) {
      return {
        name: child_name,
        link: path.resolve( env.cwd, child_name )
      };
    });
  }

  function sceneUpdateTitleCard( text ) {
    scene.isTitleCardDirty = true;
    scene.titleCard = text;
  }
 
  function sceneEnableTitleCard() {
    scene.isTitleCardDirty = true;
    scene.isTitleCardEnabled = true;
  }

  function sceneDisableTitleCard() {
    scene.isTitleCardDirty = true;
    scene.isTitleCardEnabled = false;
  }
  
  function sceneUpdateLine( speaker, line ) {
    scene.speaker     = speaker;
    scene.line        = line;
    scene.isLineDirty = true;
  }

  function resolveTargetPath( target_path ) {
    if ( target_path ) { 
      return path.resolve( env.cwd, target_path );
    } 
    return env.cwd;
  }

  // cmd_handler Checklist:
  //   1. Verify arguments
  //     a. Put all paths in absolute form
  //   2. Return pending object if incomplete; null if complete

  var cmd_handler = {
    'cd' : function( argv ) {
      var target_path = resolveTargetPath( argv[1] );
      working_dir.cd( target_path );
      sceneUpdate();
      return null;
    },
    'mkdir' : function( argv ) {
      var target_path = resolveTargetPath( argv[1] );
      working_dir.mkdir( target_path );
      sceneUpdateFolders();
      return null;
    },
    'pwd' : function( argv ) {
      log.out( env.cwd );
      return null;
    },
    'ls' : function( argv ) {
      var target_path = resolveTargetPath( argv[1] );
      var children    = fs.ls( target_path );
       
      log.out('total ' + children.length);
      children.forEach( function( child_name ) {
        log.out( child_name );
      });
      return null;
    },
    'title-card' : function( argv, dt ) {
      var text         = argv[1].replace('%n','\n');
      var text_len     = text.length;
      var text_dt      = 0;
      var text_step_ms = 1000/10;
      var text_hold_ms = 1000/2;
      var text_end_ms  = ( text_len * text_step_ms ) + text_hold_ms;

      sceneEnableTitleCard();

      function step_text() {
        text_dt += dt;
        var text_ndx = parseInt(text_dt / text_step_ms);
        var next     = step_text;

        if ( text_ndx > text_len ) {
          text_ndx = text_len;

          if ( text_dt > text_end_ms ) {
            next     = null;
            sceneDisableTitleCard();
          }
        }

        var html = text.substr(0,text_ndx).replace('\n','<br>');
        sceneUpdateTitleCard( html );
     
        return next;
      };

      return step_text();
    },
    'line' : function( argv, dt ) {
      var speaker      = argv[1];
      var text         = argv[2].replace('%n','\n');
      var text_len     = text.length;
      var text_dt      = 0;
      var text_step_ms = 1000/20;
      var text_hold_ms = 1000/2;
      var text_end_ms  = ( text_len * text_step_ms ) + text_hold_ms;

      function step_text() {
        text_dt += dt;
        var text_ndx = parseInt(text_dt / text_step_ms);
        var next     = step_text;

        if ( text_ndx > text_len ) {
          text_ndx = text_len;

          if ( text_dt > text_end_ms ) {
            next     = null;
          }
        }

        var html = text.substr(0,text_ndx).replace('\n','<br>');
        sceneUpdateLine( speaker, html );
     
        return next;
      };

      return step_text();
    },
  };

  var working_dir = {
    mkdir: function( target_path ) {
      fs.mkdir( target_path );
      fs.setMeta( target_path, 'activeScripts', [ path.resolve( target_path, '.shell' ) ]  );
    },
    cd: function( target_path ) {
      if (!fs.exists( target_path) ) {
        log.err('can\'t cd into directory (does not exist) \"' + target_path + '"');
        return;
      }
      env.cwd = target_path;
    },
    update: function( dt ) {
      var cwd             = env.cwd;
      var active_scripts  = fs.getMeta( cwd, 'activeScripts' );
      var pending_updates = fs.getMeta( cwd, 'pendingUpdate' );
      var pc              = fs.getMeta( cwd, 'pc' );

      if (active_scripts == null) {
        return;
      }

      active_scripts.forEach( function( script_path ) {
        if ( pending_updates && pending_updates[ script_path ] ) {
          pending_updates[ script_path ] = pending_updates[ script_path ]();
          fs.setMeta( cwd, 'pendingUpdate', pending_updates );
          return;
        }

        var script = scripts.get( script_path );
        if ( script == null ) {
          return;
        }

        if (pc == null) {
          pc = {};
        }
        if (pc[script_path] == null) {
          pc[script_path] = 0;
        }

        // do until something becomes pending or eof
        while (pc[script_path] < script.length)
        {
          var lineObj = { lineBuffer: script[ pc[script_path] ] };

          parser.parseLine( lineObj );

          if ( lineObj.argv[0] in cmd_handler ) {
            var cmd     = cmd_handler[ lineObj.argv[0] ];
            var pending = cmd( lineObj.argv, dt );
            if ( pending ) {
              if ( pending_updates == null ) {
                pending_updates = {};
              }
              pc[script_path]++;
              pending_updates[ script_path ] = pending;
              break;
            }
          } else if (lineObj.lineBuffer != '') {
            log.err('Unknown command: "'+lineObj.lineBuffer+'"');
          }
   
          pc[script_path]++;
        }

        fs.setMeta( cwd, 'pendingUpdate', pending_updates );
        fs.setMeta( cwd, 'pc', pc );
      });
    },
  };

  working_dir.mkdir('/Home');
  working_dir.cd('/Home');

  return working_dir;
});

