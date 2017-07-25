define(function (require) {
 
  // #todo show last item for empty nodes
  // #todo show empty nodes in gray instead of delete

  // https://developer.mozilla.org/en-US/docs/Games/Anatomy

  var FPSMeter             = require('fpsmeter');
  var yaml                 = require('js-yaml');
  var path                 = require('path');
  var dom                  = require('./dom');
  var log                  = require('./log');
  var script_yaml          = require('text!../../data/side-story.yml');

  var profile              = dom.getElementById('profile');
  var map_box              = dom.getElementById('map-box');
  var map_background       = dom.getElementById('map-background');
  var app_container        = dom.getElementById('app-container');
  var map_container        = dom.getElementById('map-element-container');
  var dialogue_speaker_div = dom.getElementById('dialogue-speaker');
  var dialogue_line_div    = dom.getElementById('dialogue-line');
  var next_line_div        = dom.getElementById('next-line');
  var map_description_div  = dom.getElementById('map-description');
  var map_back_div         = dom.getElementById('map-back');
  var map_back_callback;

  var app_click_count      = 0;
  var dialogue_cps         = 30;
  var dialogue_cps_fast    = 90;
  var wait_dot_cps         = 3;

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

  var stage_states = [ 'stage-return', 'stage-empty', 'stage-enter' ];

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

  meter = new FPSMeter(document.getElementById('profile'));

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

    meter.tickStart();

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

    meter.tick();

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
        offstage_dialogue[ event_name ][ location_path ] = { };
        queued_dialogue[ event_name ][ location_path ]    = { };

        stage_states.forEach( function( stage_state ) {

          pending_dialogue[ event_name ][ location_path ][ stage_state ]   = [];
          offstage_dialogue[ event_name ][ location_path ][ stage_state ] = [];
          queued_dialogue[ event_name ][ location_path ][ stage_state ]    = [];

          var source_location = script.locations[ location_path ];
          if (!source_location) {
            return;
          }

          var source_event    = source_location[ event_name ];
          if (!source_event) {
            return;
          }

          var source_stage = source_event[ stage_state ];
          if (!source_stage) {
            return;
          }

          source_stage.forEach( function( dialogue_node ) {
            if ( dialogue_node.hasOwnProperty( 'id' ) ) {
              offstage_dialogue[ event_name ][ location_path ][ stage_state ].push( dialogue_node );
            } else {
              pending_dialogue[ event_name ][ location_path ][ stage_state ].push( dialogue_node );
            }
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
    var offstage_count = offstage_dialogue[ event_name ][ location_path ][ stage_state ].length;
    var dialogue_node;
    for (i=0;i<offstage_count;i++) {
      if ( offstage_dialogue[ event_name ][ location_path ][ stage_state ][ i ].id == dialogue_id ) {
        dialogue_node = offstage_dialogue[ event_name ][ location_path ][ stage_state ].splice(i,1)[0];
        queued_dialogue[ event_name ][ location_path ][ stage_state ].unshift( dialogue_node );
        return;
      }
    }
  }

  function start( context, dt ) {
    var checkpoint = get_checkpoint( 'START' );
    if ( checkpoint == undefined ) {
      return fatal_error( 'No START checkpoint' );
    }

    return jmp_loc( checkpoint, context, dt ); 
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
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'stage-enter' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'stage-enter';

/*
    var background_image = get_location_background_image( context.location_path );
    if ( background_image ) {
      dom.setAttribute( map_background, 'src', 'data/' + background_image );
      dom.show( map_background );
    } else {
      dom.hide( map_background );
    }
*/

    return play_dialogue( context, dt );
  }

  function stage_empty( context, dt ) {
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'stage-empty' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'stage-empty';
    return play_dialogue( context, dt );
  }

  function stage_return( context, dt ) {
    var dialogue_node = get_next_dialogue_node( context.event_name, context.location_path, 'stage-return' );
    var location_name = get_location_name( context.location_path );
    dom.setChildHtml( map_description_div, '<span>' + location_name + '</span>' );
    context.dialogue_node = dialogue_node;
    context.stage_state  = 'stage-return';

/*
    var background_image = get_location_background_image( context.location_path );
    if ( background_image ) {
      dom.setAttribute( map_background, 'src', 'data/' + background_image );
      dom.show( map_background );
    } else {
      dom.hide( map_background );
    }
*/

    return play_dialogue( context, dt );
  }

  function play_dialogue( context, dt ) {
    var dialogue_node = context.dialogue_node;
    var location_path = context.location_path;
    var event_name    = context.event_name;
    var stage_state   = context.stage_state;

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
        return jmp_loc( jump_location_path, context, dt );
      }

      // #todo end-game
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
    var available_paths = get_queued_location_children( event_name, location_path, 'stage-enter' ); // goint to children is always stage-enter

    console.log( 'available_paths' );
    console.log( available_paths );

    if ( available_paths.length > 0 ) {
      context.next = wait_child_location_click;

      var is_back_root = path.dirname( location_path ) == '/';
      if (!is_back_root) {
        if ( event_name == 'main' ) {
          dom.show( map_back_div );
        }
      }

      map_back_callback = function() {
        context.child_path_name = path.dirname( location_path );
      };
  
      dom.empty( map_container );
      available_paths.forEach( function( child_path_name ) {
        var path_button = dom.htmlToElement( '<a href="#" class="map-element">' + child_path_name + '</a>' );
        dom.appendChild( map_container, path_button );
        dom.addClickListenerPreventDefault( path_button, function() {
          context.child_path_name = location_path + '/' + child_path_name;
        });
      });
      return context;
    }

    if ( stage_state != 'stage-empty' ) {
      // paths are empty, handle any stage-empty case
      return stage_empty( context, dt );
    } else {
      // paths are empty, auto-back up tree
      update_queued_dialogue();
      var parent_path = path.dirname( location_path );
      context.location_path = parent_path;
      dom.empty( map_container );
      return stage_return( context, dt );
    }
  }

  function wait_end_game( context, dt ) {
    return context;
  }

  function give_options( context, dt ) {
    var dialogue_node = context.dialogue_node;
    var options       = dialogue_node['options'];

    context.next = wait_option_click;

    dom.empty( map_container );

    options.forEach( function( option ) {
      var option_name   = option[0];
      var option_id     = option[1];
      var option_button = dom.htmlToElement( '<a href="#" class="map-element">' + option_name + '</a>' );
      dom.appendChild( map_container, option_button );
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
      dom.empty( map_container );
      delete context.option_id;
      return stage_enter( context, dt );
    }
    return context;
  }

  function wait_child_location_click( context, dt ) {
    if ( context.hasOwnProperty( 'child_path_name' ) ) {
      dom.hide( map_back_div );
      console.log( context.child_path_name );
      context.location_path = context.child_path_name;
      dom.empty( map_container );
      delete context.child_path_name;
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
      line_text       : dialogue_line.say[1],
      line_char_count : dialogue_line.say[1].length,
      dt              : 0,
      start_app_click_count : app_click_count
    };

    var actor_name_span = dom.htmlToElement( '<span>' + context.play_line_say.actor_name + '</span>' );
    dom.setChild( dialogue_speaker_div, actor_name_span );

    console.log( context.play_line_say.actor + ': ' + context.play_line_say.line_text );

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

    var actor_name_span = dom.htmlToElement( '<span>' + context.play_line_think.actor_name + '</span>' );
    dom.setChild( dialogue_speaker_div, actor_name_span );

    console.log( context.play_line_think.actor + ': ' + context.play_line_think.line_text );

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

    // add context
    context.play_line_description = {
      line_text       : dialogue_line.description,
      line_char_count : dialogue_line.description.length,
      dt              : 0,
      start_app_click_count : app_click_count
    };

    console.log( context.play_line_description.line_text );

    context.next = function( context, dt ) {
      var dialogue_line = context.dialogue_line;
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

        // clear context
        delete context.play_line_description;

        // next...
        context.next = wait_line_continue;
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
      dot_spans       : [],
      dt              : 0,
      start_app_click_count : app_click_count
    };

    context.wait_line_continue.dot_spans[0] = dom.htmlToElement( '<span>.</span>' );
    context.wait_line_continue.dot_spans[1] = dom.htmlToElement( '<span>.</span>' );
    context.wait_line_continue.dot_spans[2] = dom.htmlToElement( '<span>.</span>' );

    dom.hide( context.wait_line_continue.dot_spans[0] );
    dom.hide( context.wait_line_continue.dot_spans[1] );
    dom.hide( context.wait_line_continue.dot_spans[2] );

    dom.empty( next_line_div );
    dom.appendChild( next_line_div, context.wait_line_continue.dot_spans[0] );
    dom.appendChild( next_line_div, context.wait_line_continue.dot_spans[1] );
    dom.appendChild( next_line_div, context.wait_line_continue.dot_spans[2] );

    context.next = function( context, dt ) {
      context.wait_line_continue.dt += dt;

      var dot_time  = context.wait_line_continue.dt / 1000;
      var dot_count = ((dot_time * wait_dot_cps) % 4)|0;

      dom.hide( context.wait_line_continue.dot_spans[0] );
      dom.hide( context.wait_line_continue.dot_spans[1] );
      dom.hide( context.wait_line_continue.dot_spans[2] );
      for (var i=1;i<=dot_count;i++) {
        dom.show( context.wait_line_continue.dot_spans[i-1] );
      }

      if ( app_click_count > context.wait_line_continue.start_app_click_count ) {
        dom.empty( next_line_div );
        dom.empty( dialogue_line_div );
        dom.empty( dialogue_speaker_div );
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

