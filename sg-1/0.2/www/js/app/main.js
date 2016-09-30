define(function (require) {

  // http://darsa.in/fpsmeter/
  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var workingDir = require('./workingDir');
  var render      = require('./render');
  var term        = require('./term');
  var dom         = require('./dom');
  var scripts     = require('./scripts');
  var prev_time   = performance.now();
  var profile     = dom.getElementById('profile');
  var FPSMeter    = require('fpsmeter');
  var meter       = new FPSMeter(document.getElementById('profile'));

  require(['json!./data/manifest.json'], function( manifest ) {
    manifest.forEach( function( source_script ) {
      var target_path = source_script[0];
      var source_path = source_script[1];
      require(['text!./data/' + source_path], function( source_data ) {
        console.log('import script "' + source_path + '" to "' + target_path + '"');
        scripts.setFromText( target_path, source_data );
      });
    });
  });

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

  dom.onReady( function() { main( performance.now() ); } );
});
