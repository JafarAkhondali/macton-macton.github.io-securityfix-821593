<?php
/*
Plugin Name: Examples of the use of wp_enqueue_script()
Plugin URI:
Description: Shows some examples of the use of the wp_enqueue_script() function.
Version: 0
Author: Jérémy Heleine
Author URI: http://jeremyheleine.me
License: MIT
*/

function enqueue_my_scripts() {
	wp_enqueue_script('test', plugin_dir_url(__FILE__) . 'test.js', array('mylib'));

	// This line is useless. But it's cool to see that it's useless!
	wp_enqueue_script('test2', plugin_dir_url(__FILE__) . 'test.js');
}

// Chose a better action!
add_action('plugins_loaded', 'enqueue_my_scripts');

// Registers the library
wp_register_script('mylib', plugin_dir_url(__FILE__) . 'lib.js', array(), '0.5', false);

// A useless shortcode using a useless script
function replace_my_useless_shortcode() {
	wp_enqueue_script('myshortcode', plugin_dir_url(__FILE__) . 'shortcode.js');
	return '';
}
add_shortcode('myshortcode', 'replace_my_useless_shortcode');
?>
