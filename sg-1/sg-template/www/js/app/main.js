define(function (require) {

  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var FPSMeter          = require('fpsmeter');
  var dom               = require('./dom');
  var log               = require('./log');
  var profile           = dom.getElementById('profile');
  var meter;
  var prev_time;

  meter = new FPSMeter(document.getElementById('profile'));

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

    // update

    meter.tick();

    prev_time = start_time;
  }

  prev_time = performance.now();
  main( performance.now() ); 
});
