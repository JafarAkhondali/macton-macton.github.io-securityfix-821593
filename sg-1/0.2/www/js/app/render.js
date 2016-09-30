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

  dom.addClickListenerPreventDefault( next_line, function() {
    env[ env.cwd ]['wait-next-line'] = false;
  });

  dom.addClickListenerPreventDefault( map_back, function() {
    scripts.append( path.resolve( env.cwd, '.shell' ), 'cd ..' );
  });

  function renderFolders() {
    if ( scene.isFoldersVisible ) {
      dom.show( map_element_container );
      dom.empty( map_element_container );
      scene.folders.forEach( function( folder ) {
        var is_gray          = (!scene.isFoldersEnabled) || (folder.permissions.indexOf('r') == -1);
        var is_strikethrough = (folder.permissions.indexOf('x') == -1);
  
        if ( is_strikethrough ) {
          var map_element = dom.htmlToElement( '<a class="map-element border-gray strikethrough">' + folder.name + '</a>' );
        } else if (is_gray) {
          var map_element = dom.htmlToElement( '<a class="map-element border-gray">' + folder.name + '</a>' );
        } else {
          var map_element = dom.htmlToElement( '<a class="map-element" href="' + folder.link + '">' + folder.name + '</a>' );
          dom.addClickListenerPreventDefault( map_element, function() {
            scripts.append( path.resolve( env.cwd, '.shell' ), 'cd "' + folder.link + '"' );
          });
        }
  
        dom.appendChild( map_element_container, map_element );
      });
    } else {
      dom.hide( map_element_container );
    }
  }

  function renderTitleCard() {
    if ( scene.isTitleCardVisible ) {
      var text = scene.titleCard;
      dom.show( title_card_container );
      if ( text != null ) {
        dom.setChildHtml( title_card_container, '<span class="title-card">' + text + '</span>' );
      }
    } else {
      dom.hide( title_card_container );
    }
  }

  function renderLine() {
    var speaker_element = dom.htmlToElement( '<span>' + scene.speaker + '</span>' );
    var line_element    = dom.htmlToElement( '<span>' + scene.line + '</span>' );

    if ( scene.lineClass) {
      if ( scene.lineClass.search('think') > -1 ) {
        dom.addClass( line_element, 'line-think' );
      }
      if ( scene.lineClass.search('read') > -1 ) {
        dom.addClass( line_element, 'line-read' );
      }
    }

    dom.setChild( dialogue_speaker, speaker_element );
    dom.setChild( dialogue_line, line_element );
  }

  function renderNextLine() {
    if ( scene.isNextLineVisible ) {
      dom.show( next_line );
    } else { 
      dom.hide( next_line );
    }
  }

  function renderBack() {
    if ( scene.isBackVisible ) {
      dom.show( map_back ); 
    } else {
      dom.hide( map_back ); 
    }
  }

  function renderTitle() {
    dom.setChildHtml( map_description, '<span>' + scene.title + '</span>' );
  }

  var renderCalls = {
    isFoldersDirty:   renderFolders,
    isTitleCardDirty: renderTitleCard,
    isLineDirty:      renderLine,
    isNextLineDirty:  renderNextLine,
    isBackDirty:      renderBack,
    isTitleDirty:     renderTitle,
  };
  var render = {
    update: function( dt ) {

      Object.keys( renderCalls ).forEach( function( dirtyFlag ) {
        if ( scene[dirtyFlag] ) {
          renderCalls[dirtyFlag]();
          scene[dirtyFlag] = false;
        }
      });
    },
  };

  // #todo
  // - strikethrough unlinked folders

  return render;
});
