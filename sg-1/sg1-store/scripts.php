<?php
/*
Plugin Name: SG1-Store
Plugin URI:
Description: Store for SG1
Version: 0.1
Author: Mike Acton
Author URI: http://bulletdecision.com
License: MIT
*/

function sg1_store() { 
?>
  <script type='text/javascript' src='<?php echo plugin_dir_url(__FILE__) . 'external_portfolio.js';?>'></script>
  <script id="rb-xzfcxvzx" type="text/javascript">new RBExternalPortfolio('www.redbubble.com', 'spilledgames', 3, 2).renderIframe();</script>
<?php
}

add_shortcode('sg1-store', 'sg1_store');
?>
