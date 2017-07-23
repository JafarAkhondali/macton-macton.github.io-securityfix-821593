define(function (require) {

  // #todo show last item for empty nodes
  // #todo show empty nodes in gray instead of delete
  // #todo fit to screen ios
  // #todo standalone page on website
  // #todo choices background on webpage 
  // #todo end: play again
  // #todo end: share (twitter, tumblr, facebook)
  // #todo end: hungry for more - bot link
  // #todo end: read your story
  // #todo wordpress plugin merch store
  // #todo save timestamps

  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var FPSMeter      = require('fpsmeter');
  var yaml          = require('js-yaml');
  var path          = require('path');
  var dom           = require('./dom');
  var log           = require('./log');
  var script_yaml   = require('text!../../data/side-story.yml');

  var profile                      = dom.getElementById('profile');
  var map_box                      = dom.getElementById('map-box');
  var app_container                = dom.getElementById('app-container');
  var story_container              = dom.getElementById('story-container');
  var map_container                = dom.getElementById('map-element-container');
  var dialogue_line_div            = dom.getElementById('dialogue-line');
  var dialogue_line_container_div  = dom.getElementById('dialogue-line-container');
  var next_line_div                = dom.getElementById('next-line');
  var map_description_div          = dom.getElementById('map-description');
  var map_back_div                 = dom.getElementById('map-back');
  var map_choices_container        = dom.getElementById('map-choices-container');
  var map_dialogue_container       = dom.getElementById('map-dialogue-container'); 

  var story_book                     = '<div><h1>Bullet Decision: Hopeless Start</h1>';
  var story_book_last_actor_name     = '';
  var story_book_last_location_name  = '';

  var map_back_callback;
  var app_click_count                = 0;
  var dialogue_cps                   = 30;
  var dialogue_cps_fast              = 120;
  var wait_dot_cps                   = 3;

  var script;
  var meter;
  var prev_time;

  var pending_dialogue = { };
  // [event][location][stage-state][lines that haven't been queued]

  var offstage_dialogue = { };
  // [event][location][stage-state][lines that are lookup by id]
  
  var queued_dialogue = { };
  // pending -> queued (if pass filter)
  // [event][location][stage-state][lines that haven't been used]

  var stage_states = [ 'return', 'empty', 'enter' ];

  var location_children = { };
  
  var context_stack = [];
  // {
  //   next: function to call next tick
  //   cur_location: reference to current location
  //   event_name: name of active event
  // }

  // Get document, or throw exception on error
  try {
    script = yaml.safeLoad( script_yaml );
    console.log(script);
    init_dialogue();
    update_queued_dialogue();
  } catch (e) {
    console.log(e);
  }

  dom.addClickListener( app_container, function() {
    app_click_count++;
  });

  dom.addClickListenerPreventDefault( map_back_div, function() {
    if (map_back_callback) {
      map_back_callback();
    }
  });

  // meter = new FPSMeter(document.getElementById('profile'));

  context_stack.push({
    next: start,
    event_name: 'main'
  });

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

    if (meter) {
      meter.tickStart();
    }

    if ( context_stack.length > 0 )
    {
      var context = context_stack.pop();

      if ( context ) {
        context = context.next( context, dt );
        if ( context ) {
          context_stack.push( context );
        }
      }
    }

    if (meter) {
      meter.tick();
    }

    prev_time = start_time;
  }

  function fatal_error( error ) {
    var error_container = dom.getElementById('error-container');

    dom.appendChildHtml( error_container, '<div>' + error + '</div>' );
    return null;
  }

  function init_dialogue() {
    var events         = script.events;
    if (!events) {
      events = [];
    }
    events.push({ name: 'main' });

    var location_paths = Object.keys(script.locations);

    events.forEach( function( ev ) {
      var event_name = ev.name;

      pending_dialogue[ event_name ]   = { };
      offstage_dialogue[ event_name ] = { };
      queued_dialogue[ event_name ]    = { };

      location_paths.forEach( function( location_path ) {

        pending_dialogue[ event_name ][ location_path ]   = { };
        queued_dialogue[ event_name ][ location_path ]    = { };
        offstage_dialogue[ event_name ][ location_path ] = [ ];

        stage_states.forEach( function( stage_state ) {

          pending_dialogue[ event_name ][ location_path ][ stage_state ]   = [];
          queued_dialogue[ event_name ][ location_path ][ stage_state ]    = [];

          var source_location = script.locations[ location_path ];
          if (!source_location) {
            return;
          }

          var dialogue_nodes = source_location.dialogue;
          if (!dialogue_nodes) {
            return;
          }

          if (!Array.isArray(dialogue_nodes)) {
            fatal_error( 'dialogue is not array in "' + location_path + '" stage: "' + stage_state + '"' );
            return;
          }

          dialogue_nodes.forEach( function( dialogue_node ) {
            if ( dialogue_node.hasOwnProperty( 'id' ) ) {
              offstage_dialogue[ event_name ][ location_path ].push( dialogue_node );
            }

            if (!dialogue_node.hasOwnProperty('event')) {
              dialogue_node.event = 'main';
            }
            if (!dialogue_node.hasOwnProperty('stage')) {
              dialogue_node.event = 'enter';
            }

            if ( dialogue_node.event != event_name ) {
              return;
            } 
            if ( dialogue_node.stage != stage_state ) { 
              return;
            }
            pending_dialogue[ event_name ][ location_path ][ stage_state ].push( dialogue_node );
          });
        });
      });
    });

    location_paths.forEach( function( location_path ) {
      var parent_path = path.dirname( location_path );
      if ( !location_children.hasOwnProperty( parent_path ) ) {
        location_children[ parent_path ] = [];
      }
      location_children[ parent_path ].push( location_path );
    });
    console.log('location_children');
    console.log(location_children);
  }

  // something can affect filters and queued dialogue needs to be updated.
  function update_queued_dialogue() {
    var events         = script.events;
    var location_paths = Object.keys(script.locations);

    events.forEach( function( ev ) {
      var event_name = ev.name;
      var pending_event = pending_dialogue[ event_name ];
      if (!pending_event) {
        return;
      }

      location_paths.forEach( function( location_path ) {

        stage_states.forEach( function( stage_state ) {

          var pending_location = pending_event[ location_path ];
          if (!pending_location) {
            return;
          }

          var pending_stage = pending_location[ stage_state ];
          if (!pending_stage) {
            return;
          }

          if (pending_stage.length == 0) {
            return;
          }

          var pending_node      = pending_stage.shift();
          var pending_remaining = [];
          while (pending_node) {

            if ( pending_node.hasOwnProperty( 'filter' ) ) {
              // #todo does pass filter?
              pending_remaining.push( pending_node );
            } else {
              queued_dialogue[ event_name ][ location_path ][ stage_state ].push( pending_node );
            }

            pending_node = pending_stage.shift();
          }
          pending_dialogue[ event_name ][ location_path ][ stage_state ] = pending_remaining;

        });
      });
    });

    console.log('queued_dialogue:');
    console.log(queued_dialogue);
  }

  function get_location( location_path ) {
    var loc = script.locations[ location_path ];
    return loc;
  }

  function get_location_name( location_path ) {
    var loc = script.locations[ location_path ];
    if ( !loc ) {
      return path.basename( location_path );
    }
    if ( loc.hasOwnProperty('name') )  {
      return loc.name;
    }
    return path.basename( location_path );
  }

  function get_location_background_image( location_path ) {
    if ( location_path == '/' ) {
      return null;
    }

    var loc = script.locations[ location_path ];
    if ( (!loc) || (!loc.hasOwnProperty('background-image')) ) {
      return get_location_background_image( path.dirname( location_path ) );
    }
    return loc['background-image'];
  }

  function get_actor_dialogue_image( actor_name ) {
    if (!actor_name) {
      return null;
    }
    var actors = script.actors
    var i;
    for (i=0;i<actors.length;i++) {
      if ( actors[i].name == actor_name ) {
        return actors[i]['dialogue-image'];
      }
    }
    return null;
  }

  function get_checkpoint( checkpoint_name ) {
    var checkpoint = script.checkpoints[ checkpoint_name ];
    return checkpoint;
  }

  function get_next_dialogue_node( event_name, location_path, stage_state ) {
    var queued_dialogue_events = queued_dialogue[ event_name ];
    if ( !queued_dialogue_events ) {
      return null;
    }

    var queued_dialogue_location = queued_dialogue_events[ location_path ];
    if (!queued_dialogue_location ) {
      return null;
    }

    var queued_dialogue_stage = queued_dialogue_location[ stage_state ];
    if (!queued_dialogue_stage) {
      return null;
    }

    var dialogue_node = queued_dialogue_stage.shift();
    return dialogue_node;
  }
 
  function has_queued_location_children( event_name, location_path, stage_state ) {
    if ( queued_dialogue[ event_name ][ location_path ][ stage_state ].length > 0 ) {
      return true;
    }
    if ( location_children.hasOwnProperty( location_path ) ) { 
      var child_count = location_children[ location_path ].length;
      for (var i=0;i<child_count;i++) {
        var child_path = location_children[ location_path ][i];
        if ( queued_dialogue[ event_name ][ child_path ][ stage_state ].length > 0 ) {
          return true;
        }
      }
    }
    if ( location_children.hasOwnProperty( location_path ) ) { 
      var child_count = location_children[ location_path ].length;
      for (var i=0;i<child_count;i++) {
        var child_path = location_children[ location_path ][i];
        if ( has_queued_location_children( event_name, child_path, stage_state ) ) {
          return true;
        }
      }
    }

    return false;
  }

  function get_queued_location_children( event_name, location_path, stage_state ) {
    var available_paths = [];
    if ( location_children.hasOwnProperty( location_path ) ) { 
      location_children[location_path].forEach( function( child_path ) {
        if ( has_queued_location_children( event_name, child_path, stage_state ) ) {
          available_paths.push( path.basename( child_path ) );
        }
      });
    }
    return available_paths;
  }

  function push_offstage_dialogue( event_name, location_path, stage_state, dialogue_id )  {
    var i;
    var offstage_count = offstage_dialogue[ event_name ][ location_path ].length;
    var dialogue_node;
    for (i=0;i<offstage_count;i++) {
      if ( offstage_dialogue[ event_name ][ location_path ][ i ].id == dialogue_id ) {
        dialogue_node = offstage_dialogue[ event_name ][ location_path ].splice(i,1)[0];
        queued_dialogue[ event_name ][ location_path ][ stage_state ].unshift( dialogue_node );
        return;
      }
    }
  }

  function start( context, dt ) {
    var debug_start = dom.getParameterByName('debug-start');
    if ( debug_start ) {
      return jmp_loc( debug_start, context, dt ); 
    }

    var checkpoint = get_checkpoint( 'start' );
    if ( checkpoint == undefined ) {
      return fatal_error( 'No start checkpoint' );
    }

    return jmp_loc( checkpoint, context, dt ); 
  }
  
  function clear_dialogue() {
    dom.setBackgroundImage( map_dialogue_container, 'data/blank.png' );
    dom.empty( dialogue_line_div );
  }

  function jmp_loc( location_path, context, dt ) {
    var loc = get_location( location_path );

    if ( loc == undefined ) {
      return fatal_error( 'Location not found "' + location_path + '"' );
    }

    context.location_path = location_path;
    return stage_enter( context, dt );
  }

  function stage_enter( context, dt ) {
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'enter' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'enter';

    var background_image = get_location_background_image( context.location_path );
    if ( background_image ) {
      dom.setBackgroundImage( map_container, 'data/' + background_image );
    } else {
      dom.clearBackgroundImage( map_container );
    }
    dom.removeClass( map_box );
    dom.addClass( map_box, 'location' + context.location_path.replace(/\/|\s/g, '-') );
    dom.show( map_box );

    return play_dialogue( context, dt );
  }

  function stage_empty( context, dt ) {
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'empty' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'empty';
    return play_dialogue( context, dt );
  }

  function stage_return( context, dt ) {
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'return' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'return';

    var background_image = get_location_background_image( context.location_path );
    if ( background_image ) {
      dom.setBackgroundImage( map_container, 'data/' + background_image );
    } else {
      dom.clearBackgroundImage( map_container );
    }
    dom.removeClass( map_box );
    dom.addClass( map_box, 'location' + context.location_path.replace(/\/|\s/g, '-') );

    return play_dialogue( context, dt );
  }


  function play_dialogue( context, dt ) {

    var dialogue_node = context.dialogue_node;
    var location_path = context.location_path;
    var event_name    = context.event_name;
    var stage_state   = context.stage_state;
    var location_name = get_location_name( location_path );

    if ( story_book_last_location_name != location_name ) {
      story_book += '<div class="story-location-name">' + location_name + '</div>';
      story_book_last_location_name = location_name;
    }

    if ( dialogue_node ) {
      // get next line
      var lines = dialogue_node.lines;
      if ( lines && ( lines.length > 0 ) ) {
        var next_line = lines.shift();
        context.next          = play_dialogue;
        context_stack.push( context );

        context = {
          dialogue_line: next_line,
          next: play_line
        };
        return play_line( context, dt );
      }
      
      // start-event
      var start_event   = dialogue_node['start-event'];
      if (start_event) {
        console.log('start-event "' + start_event + '"' );
        context.next          = play_dialogue;
        context_stack.push( context );

        context = {
          next: stage_enter,
          event_name: start_event[0], 
          location_path: start_event[1]
        };

        return stage_enter( context, dt );
      }

      // get options
      var options = dialogue_node['options'];
      if (options) {
        return give_options( context, dt );
      }

      // next
      var next = dialogue_node['next'];
      if (next) {
        push_offstage_dialogue( event_name, location_path, stage_state, dialogue_node.next );
        return stage_enter( context, dt );
      }

      // jump
      var jump_location_path = dialogue_node['jump'];
      if (jump_location_path) {
        clear_dialogue();
        return jmp_loc( jump_location_path, context, dt );
      }

      // end-game
      var end_game = dialogue_node['end-game'];
      if (end_game) {
        context.next          = wait_end_game;
        context_stack.push( context );

        context = {
          dialogue_line: { description: end_game },
          next: play_line
        };
        return play_line( context, dt );
      }

      // #todo set
    }

    // has anything
    var available_paths = get_queued_location_children( event_name, location_path, 'enter' ); // goint to children is always enter

    console.log( 'available_paths' );
    console.log( available_paths );

    if ( available_paths.length > 0 ) {
      context.next = wait_next_location_click;

      var is_back_root = path.dirname( location_path ) == '/';
      if (!is_back_root) {
        if ( event_name == 'main' ) {
          dom.show( map_back_div );
        }
      }

      map_back_callback = function() {
        context.next_path_name = path.dirname( location_path );
      };
  
      dom.empty( map_choices_container );

      available_paths.forEach( function( next_path_name ) {
        var path_button = dom.htmlToElement( '<a href="#" class="map-element">' + next_path_name + '</a>' );
        dom.appendChild( map_choices_container, path_button );
        dom.addClickListenerPreventDefault( path_button, function() {
          context.next_path_name = location_path + '/' + next_path_name;
        });
      });
      return context;
    }

    if ( stage_state != 'empty' ) {
      // paths are empty, handle any empty case
      return stage_empty( context, dt );
    } else {
      // paths are empty, auto-back up tree
      update_queued_dialogue();
      var parent_path = path.dirname( location_path );
      context.location_path = parent_path;
      dom.empty( map_choices_container );
      clear_dialogue();
      return stage_return( context, dt );
    }
  }

  function wait_end_game( context, dt ) {
    dom.hide( app_container );
    story_book += '</div>';
    dom.setChildHtml( story_container, story_book );
    context.next = done_game;
    return context;
  }

  function done_game( context, dt ) {
    return context;
  }

  function give_options( context, dt ) {
    var dialogue_node = context.dialogue_node;
    var options       = dialogue_node['options'];

    context.next = wait_option_click;

    dom.empty( map_choices_container );

    options.forEach( function( option ) {
      var option_name   = option[0];
      var option_id     = option[1];
      var option_button = dom.htmlToElement( '<div class="choice-element" tabindex="1">' + option_name + '</div>' );

      dom.appendChild( map_choices_container, option_button );
      dom.addClickListenerPreventDefault( option_button , function() {
        context.option_id = option_id;
      });
    });
    return context;
  }

  function wait_option_click( context, dt ) {
    var location_path  = context.location_path;
    var event_name     = context.event_name;
    var stage_state    = context.stage_state;

    if ( context.hasOwnProperty( 'option_id' ) ) {
      push_offstage_dialogue( event_name, location_path, stage_state, context.option_id );
      dom.empty( map_choices_container );
      clear_dialogue();
      delete context.option_id;
      return stage_enter( context, dt );
    }
    return context;
  }

  function wait_next_location_click( context, dt ) {
    if ( context.hasOwnProperty( 'next_path_name' ) ) {
      dom.hide( map_back_div );
      console.log( context.next_path_name );
      context.location_path = context.next_path_name;
      dom.empty( map_choices_container );
      clear_dialogue();
      delete context.next_path_name;
      return stage_enter( context, dt );
    }
    return context;
  }

  function play_line( context, dt ) {
    var dialogue_line = context.dialogue_line;
    if ( dialogue_line.hasOwnProperty('think')) {
      context.next = play_line_think;
      return play_line_think( context, dt );
    }
    if ( dialogue_line.hasOwnProperty('say')) {
      context.next = play_line_say;
      return play_line_say( context, dt );
    }
    if ( dialogue_line.hasOwnProperty('description')) {
      context.next = play_line_description;
      return play_line_description( context, dt );
    }
    return fatal_error( 'Don\'t know how to handle dialogue line: ' + JSON.stringify( dialogue_line, null, 2 ) );
  }

  function play_line_say( context, dt ) {
    var dialogue_line = context.dialogue_line;

    // add context
    context.play_line_say = {
      actor_name      : dialogue_line.say[0],
      line_text       : '"' + dialogue_line.say[1] + '"',
      line_char_count : dialogue_line.say[1].length + 2,
      dt              : 0,
      start_app_click_count : app_click_count
    };

    var dialogue_image = get_actor_dialogue_image( context.play_line_say.actor_name );
    if ( dialogue_image ) {
      dom.setBackgroundImage( map_dialogue_container, 'data/' + dialogue_image );
    }

    console.log( context.play_line_say.actor + ': ' + context.play_line_say.line_text );
    if ( story_book_last_actor_name != context.play_line_say.actor_name ) {
      story_book += '<div class="story-actor-name">' + context.play_line_say.actor_name + '</div>';
      story_book_last_actor_name = context.play_line_say.actor_name;
    }
    story_book += '<div class="story-line-say">' + context.play_line_say.line_text + '</div>';

    dom.empty( dialogue_line_div );
    context.next = function( context, dt ) {
      var dialogue_line = context.dialogue_line;
      var start_app_click_count = context.play_line_say.start_app_click_count;

      context.play_line_say.dt += dt;

      // double the speed if clicked
      var cps = dialogue_cps;
      if ( app_click_count > start_app_click_count ) {
        cps = dialogue_cps_fast;
      }

      var line_text        = context.play_line_say.line_text;
      var line_time        = context.play_line_say.dt / 1000.0;
      var line_char_count  = context.play_line_say.line_char_count;
      var frame_char_count = line_time * cps;
      var frame_str;

      if ( frame_char_count > line_char_count ) {
        frame_char_count = line_char_count;

        // clear context
        delete context.play_line_say;

        // next...
        context.next = wait_line_continue;
      }

      frame_str = line_text.substr(0,frame_char_count);
      var frame_line_span = dom.htmlToElement( '<span class="line-say">' + frame_str + '</span>' );
      dom.setChild( dialogue_line_div, frame_line_span );

      return context;
    };

    return context;
  }

  function play_line_think( context, dt ) {
    var dialogue_line = context.dialogue_line;

    // add context
    context.play_line_think = {
      actor_name      : dialogue_line.think[0],
      line_text       : dialogue_line.think[1],
      line_char_count : dialogue_line.think[1].length,
      dt              : 0,
      start_app_click_count : app_click_count
    };

    var dialogue_image = get_actor_dialogue_image( context.play_line_think.actor_name );
    if ( dialogue_image ) {
      dom.setBackgroundImage( map_dialogue_container, 'data/' + dialogue_image );
    }

    console.log( context.play_line_think.actor + ': ' + context.play_line_think.line_text );
    if ( story_book_last_actor_name != context.play_line_think.actor_name ) {
      story_book += '<div class="story-actor-name">' + context.play_line_think.actor_name + '</div>';
      story_book_last_actor_name = context.play_line_think.actor_name;
    }
    story_book += '<div class="story-line-think">' + context.play_line_think.line_text + '</div>';

    dom.empty( dialogue_line_div );
    context.next = function( context, dt ) {
      var dialogue_line = context.dialogue_line;
      var start_app_click_count = context.play_line_think.start_app_click_count;

      context.play_line_think.dt += dt;

      // double the speed if clicked
      var cps = dialogue_cps;
      if ( app_click_count > start_app_click_count ) {
        cps = dialogue_cps_fast;
      }

      var line_text        = context.play_line_think.line_text;
      var line_time        = context.play_line_think.dt / 1000.0;
      var line_char_count  = context.play_line_think.line_char_count;
      var frame_char_count = line_time * cps;
      var frame_str;

      if ( frame_char_count > line_char_count ) {
        frame_char_count = line_char_count;

        // clear context
        delete context.play_line_think;

        // next...
        context.next = wait_line_continue;
      }

      frame_str = line_text.substr(0,frame_char_count);
      var frame_line_span = dom.htmlToElement( '<span class="line-think">' + frame_str + '</span>' );
      dom.setChild( dialogue_line_div, frame_line_span );

      return context;
    };

    return context;
  }

  function play_line_description( context, dt ) {
    var dialogue_line = context.dialogue_line;
    var description   = dialogue_line.description;

    // add context
    context.play_line_description = {
      line_text       : description,
      line_char_count : description.length,
      dt              : 0,
      start_app_click_count : app_click_count
    };

    var dialogue_image = get_actor_dialogue_image( 'Narrator' );
    if ( dialogue_image ) {
      dom.setBackgroundImage( map_dialogue_container, 'data/' + dialogue_image );
    }

    console.log( context.play_line_description.line_text );
    story_book += '<div class="story-description">' + context.play_line_description.line_text  + '</div>';
    story_book_last_actor_name = '';

    dom.empty( dialogue_line_div );
    context.next = function( context, dt ) {
      var start_app_click_count = context.play_line_description.start_app_click_count;

      context.play_line_description.dt += dt;

      // double the speed if clicked
      var cps = dialogue_cps;
      if ( app_click_count > start_app_click_count ) {
        cps = dialogue_cps_fast;
      }

      var line_text        = context.play_line_description.line_text;
      var line_time        = context.play_line_description.dt / 1000.0;
      var line_char_count  = context.play_line_description.line_char_count;
      var frame_char_count = line_time * cps;
      var frame_str;

      if ( frame_char_count > line_char_count ) {
        frame_char_count = line_char_count;

        // next...
        if ( dialogue_line.hasOwnProperty('shake') ) {
           context.play_line_description.shake_end_dt = dt + parseInt(dialogue_line.shake);
           dom.addClass(dialogue_line_container_div,'shake');
           context.next = function( context, dt ) {
             context.play_line_description.dt += dt;
             if ( context.play_line_description.dt > context.play_line_description.shake_end_dt ) {
               dom.removeClass(dialogue_line_container_div,'shake');
               // clear context
               delete context.play_line_description;
               context.next = wait_line_continue;
             }
             return context; 
           }
        } else {
           // clear context
           delete context.play_line_description;
           context.next = wait_line_continue;
        }
      }

      frame_str = line_text.substr(0,frame_char_count);
      var frame_line_span = dom.htmlToElement( '<span class="line-description">' + frame_str + '</span>' );
      dom.setChild( dialogue_line_div, frame_line_span );

      return context;
    };

    return context;
  }

  function wait_line_continue( context, dt )  {

    context.wait_line_continue = {
      start_app_click_count : app_click_count
    };

    dom.show( next_line_div );

    context.next = function( context, dt ) {
      if ( app_click_count > context.wait_line_continue.start_app_click_count ) {
        dom.hide( next_line_div );
        delete context.wait_line_continue;
        return null;
      }
      return context;
    };
  
    return context;
  }
  
  prev_time = performance.now();
  main( performance.now() ); 
});

