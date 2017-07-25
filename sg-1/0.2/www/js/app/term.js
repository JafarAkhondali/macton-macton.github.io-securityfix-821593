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
        '%c(@yellowgreen)**** SG-1 DEBUG TERMINAL ****',
        'Type "help" for list of commands',
      ]
    );
    this.textColor = '#009900';
    term.prompt();
  }

  var is_pending_script = false;

  function handler() {
    scripts.append( '/.shell', this.lineBuffer );
    is_pending_script = true;
  }

  var term = new Terminal( {
    cols:        120,
    termDiv:     'term',
    bgColor:     '#232e45',
    initHandler: initHandler,
    handler:     handler,
    exitHandler: exitHandler,
    fontClass:   'term-font'
  });

  return {
    update: function( dt ) {

      var log_raw        = log.get();
      var is_pending_log = log_raw.length > 0;
      var is_tty_out     = is_pending_script || is_pending_log;

      if ( is_pending_script ) {
        term.newLine();
      }

      if ( is_pending_log ) {
        var log_pending = [];
        log_raw.forEach( function( line ) {
          var split_line = line.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
          split_line.forEach( function( line ) {
            log_pending.push( line );
          });
        });

        term.write( log_pending, ( log_pending.length > 20 )?true:null );
        log.empty();
        term.newLine();
      }

      if ( is_tty_out ) {
        term.prompt();
        is_pending_script = false; 
      }
    },
    show: function() {
      term.open();
    },
    hide: function() {
      term.close();
    }
  };
});
