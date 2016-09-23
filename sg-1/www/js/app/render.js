define(function (require) {
  var dom              = require('./dom');
  var map              = require('./map');
  var debug            = require('./debug');
  var events           = require('./events');
  var map_box          = dom.getElementById('map-box');
  var map_description  = dom.getElementById('map-description');
  var dialogue_line    = dom.getElementById('dialogue-line');
  var dialogue_speaker = dom.getElementById('dialogue-speaker');
  var map_elements     = dom.getElementsByClassName( map_box, 'map-element' );
  var map_back         = dom.getElementById('map-back');

  dom.forEach( map_elements, function( element, ndx ) {
    dom.addClickListenerPreventDefault( element, function() {
      var href = dom.getAttribute( element, 'href' );
      var name = dom.getInnerText( element );
      debug.log('map element click \"' + name + '\" ' + href );
      events.trigger('open-map-element', [ href, name ] );
    });
  });

  dom.addClickListenerPreventDefault( map_back, function() {
    events.trigger('map-back');
  });

  var previous = {
  };

  return {
    update: function() {
      debug.log('render update');

      var map_title = map.title();
      if ( map_title != previous.map_title ) {
        dom.setChildHtml( map_description, '<span>' + map_title  + '</span>' );
        previous.map_title = map_title;
      }
 
      var map_sub_folders = map.subFolders();
      var max_sub_folders = map.maxSubFolders();
 
      for (var i=0;i<max_sub_folders;i++) {
        var sub_folder = map_sub_folders[i];
        if ( sub_folder == null ) {
          dom.hide( map_elements[i] );
        } else {
          var sub_folder_target = sub_folder[0];
          var sub_folder_name   = sub_folder[1];

          dom.setChildHtml( map_elements[i], sub_folder_name );
          dom.setAttribute( map_elements[i], 'href', sub_folder_target );
          dom.show( map_elements[i] );
        }
      }

      var map_dirs = map.dirs();
      if (map_dirs.length == 0) {
        dom.hide( map_back );
      } else {
        dom.show( map_back );
      }

      var line = map.getBlind('Line');
      if ( line == null ) {
        dom.empty( dialogue_line );
        dom.empty( dialogue_speaker );
      } else {
        dom.setChildHtml( dialogue_speaker, line[0] );
        dom.setChildHtml( dialogue_line, line[1] );
      } 
    },
  }
});
