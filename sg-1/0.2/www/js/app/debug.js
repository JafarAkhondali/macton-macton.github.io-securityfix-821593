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
  var fs         = require('./fs');
  var Parser     = require('termlib_parser');
  var parser     = new Parser();
  var is_debug   = dom.getQueryVariable('debug');

  var debug = {
    init: function() {
    },
    update: function() {
    },
    isDebug: function() {
      return is_debug;
    },
  };

  if (is_debug) {
    debug.init = function() {
      var app_container     = dom.getElementById('app-container');
      var editor_container  = dom.getElementById('editor-container');
      var tool_container    = dom.getElementById('tool-container');
      var app_toolbar       = dom.getElementById('app-toolbar');
      var script_title      = dom.getElementById('script-title');
      var editor_toolbar    = dom.getElementById('editor-toolbar');
      var export_toolbar    = dom.getElementById('export-toolbar');
      var edit_title        = dom.getElementById('edit-title');
      var script_edit       = dom.getElementById('script-edit');
      var script_save       = dom.getElementById('script-save');
      var script_cancel     = dom.getElementById('script-cancel');
      var export_save       = dom.getElementById('export-save');
      var export_cancel     = dom.getElementById('export-cancel');
      var editor_help_text  = dom.getElementById('editor-help-text');
      var scripts_export    = dom.getElementById('scripts-export');
      var scripts_export_children = dom.getElementById('scripts-export-children');
      var script_title_path = env.cwd;
      var script_child_path;
  
      dom.show( app_toolbar );
      term.show();
  
      dom.setChildHtml( script_title, '<span>' + script_title_path + '</span>' );
      dom.setChildHtml( edit_title, '<span>' + script_title_path + '</span>' );
      updateScriptPath();
  
      function updateScriptPath() {
        window.requestAnimationFrame( updateScriptPath );
        var cwd          = env.cwd;
        var script_path  = fs.getMeta( cwd, '.activeScript' );
        if ( script_path != script_title_path ) {
          script_title_path = script_path;
          dom.setChildHtml( script_title, '<span>' + script_title_path + '</span>' );
          dom.setChildHtml( edit_title, '<span>' + script_title_path + '</span>' );
        }
      }
  
      function scriptEdit() {
        window.requestAnimationFrame( function() {
          dom.hide( app_container );
          dom.hide( tool_container );
          dom.hide( export_toolbar );
          dom.show( editor_container );
          dom.show( editor_toolbar );
          dom.setChildHtml( editor_help_text, workingDir.cmdHelpHtml() );
  
          var cwd            = env.cwd;
          var script_path    = fs.getMeta( cwd, '.activeScript' );
          var script_source  = scripts.get( script_path );
          if ( script_source == null ) {
            script_source = '';
          } else {
            script_source = script_source.join('\n');
          }
    
          editor.setValue( script_source, -1 );
          term.hide();
        });
      }

      function scriptsExport( child_path ) {
        script_child_path = child_path;
        window.requestAnimationFrame( function() {
          dom.hide( app_container );
          dom.hide( tool_container );
          dom.hide( editor_toolbar );
          dom.show( editor_container );
          dom.show( export_toolbar );
          dom.setChildHtml( editor_help_text, workingDir.cmdHelpHtml() );

          var scripts_all  = scripts.getAll();
          var unity_source = ''
          Object.keys(scripts_all).sort().forEach( function( script_path ) {
            // don't export any shell scripts
            if ( script_path.indexOf('/.shell') != -1 ) {
              return;
            }
            if ( script_path.indexOf(child_path) == -1 ) {
              return;
            }
            var script_source = scripts_all[ script_path ];
            if (script_source) {
              unity_source += '#script-begin "' + script_path + '"\n';
              unity_source += script_source.join('\n').trim();
              unity_source += '\n\n';
            }
          });
  
          editor.setValue( unity_source, -1 );
          term.hide();
        });
      }

      function scriptSave() {
        window.requestAnimationFrame( function() {
          var cwd           = env.cwd;
          var script_path   = fs.getMeta( cwd, '.activeScript' );
          var script_source = editor.getValue();
  
          console.log('save ' + script_path );
    
          scripts.setFromText( script_path, script_source );
  
          workingDir.reset( cwd );
          workingDir.cd( cwd );
    
          archive.saveScript( script_path, script_source );
  
          dom.show( app_container );
          dom.hide( editor_container );
          dom.hide( tool_container );
          term.show();
        });
      }

      function scriptCancel() {
        window.requestAnimationFrame( function() {
          dom.show( app_container );
          dom.hide( editor_container );
          dom.hide( tool_container );
          term.show();
        });
      }

      function exportSave() {
        var unity_source    = editor.getValue();
        var unity_lines     = unity_source.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
        var scripts_content = {};
        var current_script  = null;

        unity_lines.forEach( function( line ) {
          var line_obj = { lineBuffer: line };
          parser.parseLine( line_obj );

          if ( line_obj.argv[0] == '#script-begin' ) {
            current_script = line_obj.argv[1];
            scripts_content[ line_obj.argv[1] ] = [];
          } else if ( current_script != null ) {
            scripts_content[ current_script ].push( line );
          }
        });

        scripts.emptyAll(script_child_path);
        Object.keys(scripts_content).forEach( function( script_path ) {
          console.log( 'Save ' + script_path );
          scripts.setFromText( script_path, scripts_content[ script_path ].join('\n').trim() );
        });
        archive.rebuildSaveAll();

        scriptEdit();
      }
  
      dom.addClickListenerPreventDefault( script_edit, scriptEdit );
      dom.addClickListenerPreventDefault( scripts_export, function() { scriptsExport('/SG-1'); } );
      dom.addClickListenerPreventDefault( scripts_export_children, function() { scriptsExport( env.cwd ); } );
      dom.addClickListenerPreventDefault( script_save, scriptSave );
      dom.addClickListenerPreventDefault( script_cancel, scriptCancel );
      dom.addClickListenerPreventDefault( export_cancel, scriptEdit );
      dom.addClickListenerPreventDefault( export_save, exportSave );
    };

    debug.update = function(dt) {
      term.update(dt);
    };
  }

  return debug;
});
