define(function (require) {

  var path       = require('path');
  var fs         = require('./fs');
  var scripts    = require('./scripts');
  var env        = require('./env');
  var log        = require('./log');
  var sceneWrite = require('./sceneWrite');
  var Parser     = require('termlib_parser');
  var parser     = new Parser();

  var config = {
    titleCardTextStepMs: 50,
    lineTextStepMs:      20,
  };

  function resolveTargetPath( target_path ) {
    if ( target_path == '~' ) {
      return '/Home';
    } else if ( target_path ) { 
      return path.resolve( env.cwd, target_path );
    } 
    return env.cwd;
  }

  // cmd_handler Checklist:
  //   1. Verify arguments
  //     a. Put all paths in absolute form
  //   2. Return pending object if incomplete; null if complete

  var cmd_help    = "Commands\n"
                  + "  cd <path>                    | change directory to <path> (relative or absolute)\n"
                  + "  mkdir <path>                 | make directory <path> (relative or absolute)\n"
                  + "  ls <path>                    | list directory (optional: <path> (relative or absolute))\n"
                  + "  pwd                          | print working directory to tty\n"
                  + "  enable <element>             | enable events for UI element\n"
                  + "  disable <element>            | disable events for UI element\n"
                  + "      ... folders              | enable/disable folders actions\n"
                  + "  show <element>               | display UI element\n"
                  + "  hide <element>               | do not display UI element\n"
                  + "      ... back                 | enable/disable back button action\n"
                  + "      ... next-line            | enable/disable next-line button action\n"
                  + "  tab <element>                | select among mutually exclusive main UI elements\n"
                  + "      ... folders              | display folders\n"
                  + "      ... title-card           | display title-card\n"
                  + "  title-card <text>            | print <text> on title card. Note: %%n is newline.\n"
                  + "  title <text>                 | set <text> as title.\n"
                  + "  line <speaker> <text>        | print <text> for <speaker> on dialogue line. Note: %%n is newline.\n"
                  + "  wait <element>               | wait for <element> before continuing.\n"
                  + "      ... next-line            | wait for next-line button to be clicked.\n"
                  + "      ... <ms>                 | wait for time <ms> in milliseconds\n"
                  + "  chmod <mode> <path>          | change <mode> on directory <path>\n"
                  + "      ... +rwx                 | <mode> enable read, write or executable flags (any can be specified)\n"
                  + "      ... -rwx                 | <mode> disable read, write or executable flags (any can be specified)\n"
                  + "  set <key_path> <value>       | set <value> on <key_path> (relative or absolute)\n"
                  + "      ...                      | if <value> is unspecified, print value of <key> to tty\n"
                  + "      ...                      | if <key> and <value> are unspecified, print values of all <key> to tty\n"
                  + "  inc <key_path> <value>       | increment <value> on <key_path> (relative or absolute)\n"
                  + "  dec <key_path> <value>       | decrement <value> on <key_path> (relative or absolute)\n"
                  + "  if <key_path> <op> <value>   | if <key_path> not <op> to <value>, ignore until next endif\n"
                  + "      ...                      | <op> can be one of '==', '<', '<=', '>', '>=', '!='\n"
                  + "  endif                        | decrement <value> on <key> local to <path> (relative or absolute)\n"
                  + "  end                          | stop evaluating script\n";

  var cmd_handler = {
    'help' : function() {
      log.out( cmd_help );
      console.log( cmd_help );
      return null;
    },
    'cd' : function( argv ) {
      return workingDir.cd( argv[1] );
    },
    'mkdir' : function( argv ) {
      return workingDir.mkdir( argv[1] );
    },
    'pwd' : function( argv ) {
      log.out( env.cwd );
      return null;
    },
    'ls' : function( argv ) {
      var target_path = resolveTargetPath( argv[1] );
      var children    = fs.ls( target_path );
       
      log.out( '"' + target_path +'"' + ' total ' + children.length);
      children.forEach( function( child_name ) {
        var permissions = fs.getPermissions( path.resolve( env.cwd, child_name ) ).split('').sort().join('');
        var line        = ("    " + permissions).slice(-4) + ' "' + child_name + '"';
        
        log.out( line );
      });
      return null;
    },
    'tab': function( argv, dt ) {
      var tab = argv[1];
      if ( tab == 'folders' ) {
        sceneWrite.showFolders();
        sceneWrite.hideTitleCard();
      } else if ( tab == 'title-card' ) {
        sceneWrite.hideFolders();
        sceneWrite.showTitleCard();
      }
    },
    'title-card' : function( argv, dt ) {
      var text         = argv[1].replace('%n','\n');
      var text_len     = text.length;
      var text_dt      = 0;
      var text_step_ms = config.titleCardTextStepMs;

      function step_text() {
        text_dt += dt;
        var text_ndx = parseInt(text_dt / text_step_ms);
        var next     = step_text;

        if ( text_ndx > text_len ) {
          text_ndx = text_len;
          next     = null;
        }

        var html = text.substr(0,text_ndx).replace('\n','<br>');
        sceneWrite.updateTitleCard( html );
     
        return next;
      };

      return step_text();
    },
    'line' : function( argv, dt ) {
      var speaker      = argv[1];
      var text         = argv[2].replace('%n','\n');
      var text_class   = argv[3];
      var text_len     = text.length;
      var text_dt      = 0;
      var text_step_ms = config.lineTextStepMs;

      sceneWrite.disableFolders();

      function step_text() {
        text_dt += dt;
        var text_ndx = parseInt(text_dt / text_step_ms);
        var next     = step_text;

        if ( text_ndx > text_len ) {
          text_ndx = text_len;
          next     = null;
          sceneWrite.enableFolders();
        }

        var html = text.substr(0,text_ndx).replace('\n','<br>');
        sceneWrite.updateLine( speaker, html, text_class );
     
        return next;
      };

      return step_text();
    },
    'wait': function( argv, dt ) {
      if ( argv[1] == 'next-line' ) {
        env[ env.cwd ]['wait-next-line'] = true;
        sceneWrite.showNextLine();
        function waitNextLine() {
          if ( !env[ env.cwd ]['wait-next-line'] ) {
            sceneWrite.hideNextLine();
            return null;
          } else {
            return waitNextLine;
          }
        }
        return waitNextLine();
      } else if (parseFloat( argv[1] ) > 0) {
        var wait_dt = 0;
        function waitTime() {
          wait_dt += dt;
          if ( wait_dt > parseFloat( argv[1] ) ) {
            return null;
          }
          return waitTime;
        }
        return waitTime();
      } else {
        log.err('unknown wait statement');
        return null;
      }
    },
    'title': function( argv, dt ) {
      sceneWrite.updateTitle( argv[1] );
      return null;
    },
    'enable': function( argv, dt ) {
      if ( argv[1] == 'folders' ) {
        sceneWrite.enableFolders();
      }
    },
    'disable': function( argv, dt ) {
      if ( argv[1] == 'folders' ) {
        sceneWrite.disableFolders();
      }
    },
    'set': function( argv, dt ) {
      var target_path = resolveTargetPath( argv[1] );
      var key_path    = path.dirname( target_path ); 
      var key         = path.basename( target_path );
      var value       = argv[2];
 
      if (( key == null ) && ( value == null )) {
        value = fs.getMeta( key_path );

        Object.keys(value).filter( function( key ) {
          return (key.charAt(0) != '.');
        }).forEach( function( key ) {
          log.out( ("                    " + key).slice(-20) + ' "' + value[key] + '"' );
        });
      } else if ( value == null ) {
        value = fs.getMeta( key_path, key );
        log.out( ("                    " + key).slice(-20) + ' "' + value + '"' );;
      } else {
        fs.setMeta( key_path, key, value );
      }
      return null;
    },

    'inc': function( argv, dt ) {
      var target_path = resolveTargetPath( argv[1] );
      var key_path    = path.dirname( target_path ); 
      var key         = path.basename( target_path );

      if ( key == null ) {
        log.err('inc key not specified');
        return null;
      }

      var value = fs.getMeta( key_path, key );
      if ( value == null ) {
        value = 0;
      }
      value++;
      fs.setMeta( key_path, key, value );
      return null;
    },
    'dec': function( argv, dt ) {
      var target_path = resolveTargetPath( argv[1] );
      var key_path    = path.dirname( target_path ); 
      var key         = path.basename( target_path );

      if ( key == null ) {
        log.err('inc key not specified');
        return null;
      }

      var value = fs.getMeta( key_path, key );
      if ( value == null ) {
        value = 0;
      }
      value--;
      fs.setMeta( key_path, key, value );
      return null;
    },
    'if': function( argv, dt ) {
      var target_path = resolveTargetPath( argv[1] );
      var key_path    = path.dirname( target_path ); 
      var key         = path.basename( target_path );
      var op          = argv[2];
      var test_value  = argv[3];

      if ( key == null ) {
        log.err('if <key> not specified');
        return null;
      }
      if ( test_value == null ) {
        log.err('if <value> not specified');
        return null;
      }

      var value = fs.getMeta( key_path, key );
      if ( value == null ) {
        value = 0;
      }

      var if_stack = fs.getMeta( env.cwd, '.if_stack' );
      if (if_stack == null) {
        if_stack = [];
      }
      var is_ignored = if_stack && (if_stack.length > 0) && (if_stack[ if_stack.length-1 ] == false);

      var op_test = {
        '==': function(a,b) {
          return a == b;
        },
        '<=': function(a,b) {
          return a <= b;
        },
        '<': function(a,b) {
          return a < b;
        },
        '>=': function(a,b) {
          return a >= b;
        },
        '>': function(a,b) {
          return a > b;
        },
        '!=': function(a,b) {
          return a != b;
        }
      };

      if (!(op in op_test)) {
        log.err('if unrecognized <op>');
        if_stack.push( false );
      } else {
        if_stack.push( (!is_ignored) && op_test[op](value,test_value) );
      }

      fs.setMeta( env.cwd, '.if_stack', if_stack );
      return null;
    },
    'endif': function( argv, dt ) {
      var if_stack    = fs.getMeta( env.cwd, '.if_stack' );
      if ((if_stack == null) || (if_stack.length == 0)) {
        log.err('if stack empty');
        return null
      }
      if_stack.pop();
      fs.setMeta( env.cwd, '.if_stack', if_stack );
      return null;
    },
    'chmod': function( argv, dt ) {
      var mode        = argv[1];
      var target_path = resolveTargetPath( argv[2] );
      var permissions = mode.slice(1);
      var mode_func;

      if (mode.charAt(0) == '+') {
        fs.setPermissions( target_path, permissions );
      } else if (mode.charAt(0) == '-') {
        fs.clearPermissions( target_path, permissions );
      } else {
        log.err('Unknown mode');
      }
      sceneWrite.updateFolders();
      return null;
    },
    'show': function( argv, dt ) {
      if ( argv[1] == 'back' ) {
        sceneWrite.showBack();
      } else if ( argv[1] == 'next-line' ) {
        sceneWrite.showNextLine();
      } else {
        log.err('Unknown element "' + argv[1] + '"' );
      }
      return null;
    },
    'hide': function( argv, dt ) {
      if ( argv[1] == 'back' ) {
        sceneWrite.hideBack();
      } else if ( argv[1] == 'next-line' ) {
        sceneWrite.hideNextLine();
      } else {
        log.err('Unknown element "' + argv[1] + '"' );
      }
      return null;
    },
    'tab': function( argv, dt ) {
      if ( argv[1] == 'title-card' ) {
        sceneWrite.showTitleCard();
        sceneWrite.hideFolders();
      } else if ( argv[1] == 'folders' ) {
        sceneWrite.hideTitleCard();
        sceneWrite.showFolders();
      } else {
        log.err('Unknown element "' + argv[1] + '"' );
      }
      return null;
    },
    'end': function() {
      return null;
    },
  };

  var workingDir = {

    // for convenience mkdir implementation is here:
    mkdir: function( target_path ) {
      target_path = resolveTargetPath( target_path );

      var parent_path = path.dirname( target_path );
      if ( !fs.exists(parent_path) ) {
        workingDir.mkdir( parent_path );
      }

      fs.mkdir( target_path );
      fs.setMeta( target_path, '.activeScripts', [ path.resolve( target_path, '.shell' ), path.resolve( target_path, '.on_enter' ) ]  );
      sceneWrite.updateFolders();
      return null;
    },

    // for convenience cd implementation is here:
    cd: function( target_path ) {
      target_path = resolveTargetPath( target_path );
      if (!fs.exists( target_path) ) {
        log.err('can\'t cd into directory (does not exist) \"' + target_path + '"');
        return;
      }

      // set cwd
      env.cwd = target_path;

      // clear temporary variables
      env[ target_path ] = { };

      // clear the scene
      sceneWrite.clear();

      // reset .on_enter script pc on entry
      var pc          = fs.getMeta( target_path, '.pc' );
      var script_path = path.resolve( target_path, '.on_enter' );
      if (pc == null) {
        pc = {};
      }
      // peek: is script on 'end' (don't reset)
      function peekScriptAtEnd( script_path ) {
        if ( pc[script_path] == null ) {
          return false;
        }

        var script = scripts.get( script_path );
        if ( script == null ) {
          return false;
        }

        if (pc[script_path] >= script.length) {
          return false;
        }

        var lineObj = { lineBuffer: script[ pc[script_path] ] };
        parser.parseLine( lineObj );

        return lineObj.argv[0] == 'end';
      }
 
      if (!peekScriptAtEnd( script_path)) {
        pc[script_path] = 0;
        fs.setMeta( target_path, '.pc', pc );
      }

      return null;
    },

    update: function( dt ) {
      do 
      {
        var cwd             = env.cwd;
        var active_scripts  = fs.getMeta( cwd, '.activeScripts' );
        var pending_updates = fs.getMeta( cwd, '.pendingUpdate' );
        var pc              = fs.getMeta( cwd, '.pc' );
  
        if (active_scripts == null) {
          return;
        }
  
        active_scripts.forEach( function( script_path ) {
          if ( pending_updates && pending_updates[ script_path ] ) {
            pending_updates[ script_path ] = pending_updates[ script_path ]();
            fs.setMeta( cwd, '.pendingUpdate', pending_updates );
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
              var cmd        = cmd_handler[ lineObj.argv[0] ];
              var if_stack   = fs.getMeta( cwd, '.if_stack' );
              var is_ignored = if_stack && (if_stack.length > 0) && (if_stack[ if_stack.length-1 ] == false);
  
              // peek: if stack commands not ignored
              if ( lineObj.argv[0] == 'if' ) {
                is_ignored = false;
              } else if ( lineObj.argv[0] == 'endif' ) {
                is_ignored = false;
              }
  
              // peek: end means stop completely (don't increment pc)
              if ( lineObj.argv[0] == 'end' ) {
                break;
              }
  
              if (!is_ignored) {
                console.log( script_path + ':' + pc[script_path] + '  ' + lineObj.lineBuffer );
                var pending = cmd( lineObj.argv, dt );
                if ( pending ) {
                  if ( pending_updates == null ) {
                    pending_updates = {};
                  }
                  pc[script_path]++;
                  pending_updates[ script_path ] = pending;
                  break;
                }
              }
            } else if (lineObj.lineBuffer != '') {
              log.err('Unknown command: "'+lineObj.lineBuffer+'"');
            }
     
            pc[script_path]++;
          }
  
          fs.setMeta( cwd, '.pendingUpdate', pending_updates );
          fs.setMeta( cwd, '.pc', pc );
        });
      } while ( env.cwd != cwd ); // if cwd changed, continue script there (don't draw one frame before updating script)
    },
  };

  workingDir.mkdir('/Home');
  workingDir.cd('/Home');

  return workingDir;
});

