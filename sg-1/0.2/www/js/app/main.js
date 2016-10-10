define(function (require) {

  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var workingDir        = require('./workingDir');
  var render            = require('./render');
  var dom               = require('./dom');
  var log               = require('./log');
  var debug             = require('./debug');
  var FPSMeter          = require('fpsmeter');
  var profile           = dom.getElementById('profile');
  var meter             = new FPSMeter(document.getElementById('profile'));
  var prev_time;

  function main( now ) {
    window.requestAnimationFrame( main );

    var start_time = now;
    var dt         = (start_time - prev_time);
    if ( dt < 0 ) { 
      return;
    }

    if ( dt < 16 ) {
      console.log('dt = ' + dt);
    }
    if ( dt > 500 ) {
      console.log('dt = ' + dt);
    }

    meter.tickStart();
    workingDir.update(dt);
    debug.update(dt);
    render.update(dt);
    meter.tick();

    prev_time = start_time;
  }

  debug.init();

  prev_time = performance.now();
  workingDir.cd('/SG-1');
  main( performance.now() ); 
});
