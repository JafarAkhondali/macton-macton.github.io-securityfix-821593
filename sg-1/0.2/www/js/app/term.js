define(function (require) {

  var Terminal          = require('termlib');
  var log               = require('./log');
  var env               = require('./env');
  var scripts           = require('./scripts');
  var path              = require('path');

  function exitHandler() {
  }

  function initHandler() {
    this.write(
      [
        '%c(@yellowgreen)**** SG-1 TERMINAL ****',
      ]
    );
    this.textColor = '#009900';
    term.prompt();
  }

  var is_pending_script = false;

  function handler() {
    this.newLine();
    scripts.append( path.resolve( env.cwd, '.shell' ), this.lineBuffer );
    is_pending_script = true;
  }

  var term = new Terminal( {
    cols:        180,
    termDiv:     'term',
    bgColor:     '#232e45',
    initHandler: initHandler,
    handler:     handler,
    exitHandler: exitHandler
  });

  term.open();

  return {
    update: function( dt ) {
      var log_pending = log.get();
      if ( log_pending.length > 0 ) {
        term.write( log_pending );
        log.empty();
      }
      if (is_pending_script) {
        term.prompt();
        is_pending_script = false; 
      }
    },
  };
});
