define(function (require) {

  var dom        = require('./dom');
  var ace        = require('ace/ace');
  var term       = require('./term');
  var editor     = ace.edit('editor');
  var archive    = require('./archive');
  var path       = require('path');
  var workingDir = require('./workingDir');
  var env        = require('./env');
  var scripts    = require('./scripts');
  var is_debug   = dom.getQueryVariable('debug');

  var debug = {
    init: function() {
    },
    update: function() {
    },
  };

  if (is_debug) {
    debug.init = function() {
      var app_container     = dom.getElementById('app-container');
      var editor_container  = dom.getElementById('editor-container');
      var app_toolbar       = dom.getElementById('app-toolbar');
      var script_title      = dom.getElementById('script-title');
      var edit_title        = dom.getElementById('edit-title');
      var script_edit       = dom.getElementById('script-edit');
      var script_save       = dom.getElementById('script-save');
      var script_cancel     = dom.getElementById('script-cancel');
      var editor_help_text  = dom.getElementById('editor-help-text');
      var script_title_path = env.cwd;
  
      dom.show( app_toolbar );
      term.show();
  
      dom.setChildHtml( script_title, '<span>' + script_title_path + '</span>' );
      dom.setChildHtml( edit_title, '<span>' + script_title_path + '</span>' );
      updateScriptPath();
  
      function updateScriptPath() {
        window.requestAnimationFrame( updateScriptPath );
        var cwd = env.cwd;
        if ( cwd != script_title_path ) {
          script_title_path = cwd;
          dom.setChildHtml( script_title, '<span>' + script_title_path + '</span>' );
          dom.setChildHtml( edit_title, '<span>' + script_title_path + '</span>' );
        }
      }
  
      dom.addClickListenerPreventDefault( script_edit, function() {
        window.requestAnimationFrame( function() {
          dom.hide( app_container );
          dom.show( editor_container );
          dom.setChildHtml( editor_help_text, workingDir.cmdHelpHtml() );
  
          var cwd           = env.cwd;
          var script_path   = path.resolve( cwd, '.on_enter' );
          var script_source = scripts.get( script_path );
          if ( script_source == null ) {
            script_source = '';
          } else {
            script_source = script_source.join('\n');
          }
    
          editor.setValue( script_source, -1 );
          term.hide();
        });
      });
  
      dom.addClickListenerPreventDefault( script_save, function() {
        window.requestAnimationFrame( function() {
          var cwd           = env.cwd;
          var script_path   = path.resolve( cwd, '.on_enter' );
          var script_source = editor.getValue();
  
          console.log('save ' + script_path );
    
          scripts.setFromText( script_path, script_source );
  
          workingDir.reset( cwd );
          workingDir.cd( cwd );
    
          archive.saveScript( script_path, script_source );
  
          dom.show( app_container );
          dom.hide( editor_container );
          term.show();
        });
      });
  
      dom.addClickListenerPreventDefault( script_cancel, function() {
        dom.show( app_container );
        dom.hide( editor_container );
        term.show();
      });
    };

    debug.update = function(dt) {
      term.update(dt);
    };
  }

  return debug;
});
