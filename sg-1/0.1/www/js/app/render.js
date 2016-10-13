define(function (require) {
  var dom                = require('./dom');
  var map                = require('./map');
  var debug              = require('./debug');
  var instruction_stream = require('./instruction_stream');
  var events             = require('./events');
  var map_box            = dom.getElementById('map-box');
  var map_description    = dom.getElementById('map-description');
  var dialogue_line      = dom.getElementById('dialogue-line');
  var dialogue_speaker   = dom.getElementById('dialogue-speaker');
  var map_elements       = dom.getElementsByClassName( map_box, 'map-element' );
  var map_back           = dom.getElementById('map-back');
  var next_line          = dom.getElementById('next-line');
  var big_time           = dom.getElementById('big-time');
  var current_time       = '';

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

  dom.addClickListenerPreventDefault( next_line, function() {
    events.trigger('next-line');
  });

  var previous = {
  };

  return {
    update: function() {
      window.requestAnimationFrame( function() {
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

            if (instruction_stream.eof()) {
              if (sub_folder_target == null ) {
                dom.removeAttribute( map_elements[i], 'href' );
                dom.addClass( map_elements[i], 'border-gray' );
                dom.addClass( map_elements[i], 'strikethrough' );
              } else {
                dom.setAttribute( map_elements[i], 'href', sub_folder_target );
                dom.removeClass( map_elements[i], 'border-gray' );
                dom.removeClass( map_elements[i], 'strikethrough' );
              }
            } else {
              dom.removeAttribute( map_elements[i], 'href' );
              dom.addClass( map_elements[i], 'border-gray' );
              dom.removeClass( map_elements[i], 'strikethrough' );
            }

            dom.show( map_elements[i] );
          }
        }
  
        dom.hide( map_back );

        var showBack = function() {
          var map_dirs = map.dirs();
          if (map_dirs.length > 0) {
            if (instruction_stream.eof()) {
              dom.show( map_back );
            }
          }
        };
  
        var line = map.getBlind('Line');
        if ( line == null ) {
          dom.empty( dialogue_line );
          dom.empty( dialogue_speaker );
          showBack();
        } else {
          var line_speaker  = line[0];
          var line_text     = line[1];
          var line_class    = line[2];
          var line_text_ndx = 0;
          var line_text_len = line_text.length;
  
          dom.setChildHtml( dialogue_speaker, line_speaker );

          var typeLine = function() {
            window.requestAnimationFrame( function() {
              dom.setChildHtml( dialogue_line, '<span class="' + line_class + '">' + line_text.substr(0,line_text_ndx++) + '</span>' );
              if (line_text_ndx < line_text_len+1) {
                setTimeout( typeLine, 30 );
              } else {
                if (!instruction_stream.eof()) {
                  dom.show( next_line );
                } else {
                  showBack();
                }
              }
            });
          }

          
          typeLine();
        } 

          var map_time      = map.getTime();
          var time_text_ndx = 0;
          var time_text_len = map_time.length;

          var typeTime = function() {
              debug.log('time ' + map_time );
              current_time = map_time;
              dom.empty( big_time );
              dom.show( big_time );
              window.requestAnimationFrame( function() {
                dom.setChildHtml( big_time, '<span>' + current_time.substr(0,time_text_ndx++) + '</span>' );
                if (time_text_ndx < time_text_len+1) {
                  setTimeout( typeTime, 30 );
                } else {
                  setTimeout( function() {
                    dom.hide( big_time );
                    events.trigger('next-line');
                  }, 2000 );
                }
              });
          }
          if ( current_time != map_time ) {
            typeTime();
          } 
  
        dom.hide( next_line );
      });
    },
  }
});
