define(function (require) {
  var dom                   = require('./dom');
  var scene                 = require('./scene');
  var scripts               = require('./scripts');
  var env                   = require('./env');
  var path                  = require('path');
  var map_box               = dom.getElementById('map-box');
  var map_description       = dom.getElementById('map-description');
  var map_element_container = dom.getElementById('map-element-container');
  var dialogue_line         = dom.getElementById('dialogue-line');
  var dialogue_speaker      = dom.getElementById('dialogue-speaker');
  var map_back              = dom.getElementById('map-back');
  var next_line             = dom.getElementById('next-line');
  var title_card_container  = dom.getElementById('title-card-container');

  function renderFolders() {
    dom.empty( map_element_container );
    scene.folders.forEach( function( folder ) {
      var map_element = dom.htmlToElement( '<a class="map-element" href="' + folder.link + '">' + folder.name + '</a>' );
      dom.addClickListenerPreventDefault( map_element, function() {
        scripts.append( path.resolve( env.cwd, '.shell' ), 'cd ' + folder.link );
      });
      dom.appendChild( map_element_container, map_element );
    });
  }

  var render = {
    update: function( dt ) {
      
      if ( scene.isFoldersDirty ) {
        renderFolders();
        scene.isFoldersDirty = false;
      }

      if ( scene.isTitleCardDirty ) {
        if ( scene.isTitleCardEnabled ) {
          dom.hide( map_element_container );
          dom.show( title_card_container );
          dom.setChildHtml( title_card_container, '<span class="title-card">' + scene.titleCard + '</span>' );
        } else {
          dom.empty( title_card_container );
          dom.hide( title_card_container );
          dom.show( map_element_container );
        }
        scene.isTitleCardDirty = false;
      }

      if ( scene.isLineDirty ) {
        dom.setChildHtml( dialogue_speaker, '<span>' + scene.speaker + '</span>' );
        dom.setChildHtml( dialogue_line, '<span>' + scene.line + '</span>' );
        scene.isLineDirty = false;
      }
    },
  };

  return render;
});
