define(function (require) {

  // http://darsa.in/fpsmeter/
  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var working_dir = require('./working_dir');
  var render      = require('./render');
  var term        = require('./term');
  var dom         = require('./dom');
  var prev_time   = performance.now();
  var profile     = dom.getElementById('profile');
  var FPSMeter    = require('fpsmeter');

  var meter = new FPSMeter(document.getElementById('profile'));

  function main( now ) {
    window.requestAnimationFrame( main );

    var start_time = now;
    var dt         = (start_time - prev_time);

    meter.tickStart();
    working_dir.update(dt);
    term.update(dt);
    render.update(dt);
    meter.tick();

    prev_time = start_time;
  }

  dom.onReady( function() { main( performance.now() ); } );
});
