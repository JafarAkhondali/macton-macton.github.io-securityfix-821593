define(function (require) {

  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var workingDir        = require('./workingDir');
  var render            = require('./render');
  var dom               = require('./dom');
  var scripts           = require('./scripts');
  var env               = require('./env');
  var log               = require('./log');
  var term              = require('./term');
  var archive           = require('./archive');
  var path              = require('path');
  var FPSMeter          = require('fpsmeter');
  var ace               = require('ace/ace');
  var prev_time         = performance.now();
  var profile           = dom.getElementById('profile');
  var is_debug          = dom.getQueryVariable('debug');
  var meter             = new FPSMeter(document.getElementById('profile'));
  var app_container     = dom.getElementById('app-container');
  var editor_container  = dom.getElementById('editor-container');

  if (is_debug) {
    var app_toolbar       = dom.getElementById('app-toolbar');
    var script_title      = dom.getElementById('script-title');
    var edit_title        = dom.getElementById('edit-title');
    var script_edit       = dom.getElementById('script-edit');
    var script_save       = dom.getElementById('script-save');
    var script_cancel     = dom.getElementById('script-cancel');
    var editor_help_text  = dom.getElementById('editor-help-text');
    var editor            = ace.edit('editor');
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
        var script_source = scripts.get( script_path ).join('\n');
  
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
  }

  function main( now ) {
    window.requestAnimationFrame( main );

    var start_time = now;
    var dt         = (start_time - prev_time);

    meter.tickStart();
    workingDir.update(dt);
    term.update(dt);
    render.update(dt);
    meter.tick();

    prev_time = start_time;
  }

  dom.onReady( function() { 
    workingDir.cd('/SG-1');
    main( performance.now() ); 
  });

});
