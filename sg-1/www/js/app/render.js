define(function (require) {
  var dom              = require('./dom');
  var map              = require('./map');
  var map_box          = dom.getElementById('map-box');
  var map_description  = dom.getElementById('map-description');
  var dialogue_box     = dom.getElementById('dialogue-box');
  var dialogue_line    = dom.getElementById('dialogue-line');
  var dialogue_speaker = dom.getElementById('dialogue-speaker');

  var previous = {
  };

  return {
    update: function() {
      var map_title = map.title();
      if ( map_title != previous.map_title ) {
        dom.empty( map_description );
        dom.appendChildHtml( map_description, '<span>' + map_title  + '</span>' );
        previous.map_title = map_title;
      }

    },
  }
});
