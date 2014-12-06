<?php
  /**
    * Plugin Name: Taxonomical Relationships
    * Plugin URI: http://URI_Of_Page_Describing_Plugin_and_Updates
    * Description: Relationships between taxonomy terms
    * Version: 0.1
    * Author: OO
    * Author URI: http://URI_Of_The_Plugin_Author
    * License: GPL2
    */

  defined('ABSPATH') or die("No script kiddies please!");
  
  class TaxRel {
  
	  static $add_script;

	  static function init() {
		  add_shortcode('taxrel', array(__CLASS__, 'handle_shortcode'));
		  add_action('init', array(__CLASS__, 'register_script'));
		  add_action('wp_footer', array(__CLASS__, 'print_script'));
	  }
	  
	  static function handle_shortcode($atts) {
		  self::$add_script = true;
      echo "<div id='taxrel'><span id='jswarning'>JavaScript wordt geladen..</span></div>";
      
      /*
		  
      // define categories and put in array
      $cat_exclude = array('exclude' => get_cat_ID('overige').','.get_cat_ID('over de site').','.get_cat_ID('de Aard der Dingen').','.get_cat_ID('documentaire v/d week').','.get_cat_ID('Blijvend Relevant').','.get_cat_ID('bronnen').','.get_cat_ID('Vrije Wereld Ops'));
      $categories = get_categories($cat_exclude);
      $categories2 = $categories;
      $nodes = array();
      $i = 0;
      foreach ($categories as $category) {
        $nodes[$i] = array("label"=>$category->name,"id"=>$i,"group"=>"categories");
        $i++;
      }

      // then define tags and put those in array
      $tag_exclude = array('exclude' => get_term_by('slug', 'pdf', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'documentaire', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'lezing', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'interview', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'video', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'presentatie', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'boek', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'audioboek', 'post_tag')->term_id
                                    .','.get_term_by('slug', 'Nederlandstalig', 'post_tag')->term_id
                                    .','.get_term_by('slug', '2014', 'post_tag')->term_id
                                    .','.get_term_by('slug', '2013', 'post_tag')->term_id
                                    .','.get_term_by('slug', '2012', 'post_tag')->term_id);
      function trimTags($var)
      {
        return($var->count > 1);
      }
      $tags = get_tags($tag_exclude);
      $tags = array_filter($tags, "trimTags");
      foreach ($tags as $tag) {
        $nodes[$i] = array("label"=>$tag->name,"id"=>$i,"group"=>"tags");
        $i++;
      }
      
      // generate links, first between categories
      $links = array();
      $q = 0;
      $i = 0;      
      foreach ($categories as $category) {
        $j = 0;
        foreach ($categories2 as $category2) {
          $t = new WP_Query( array( 'category__and' => array( $category->term_id, $category2->term_id ) ) );
          if ($t->found_posts > $q) $q = $t->found_posts;
          if ($t->found_posts > 5 && $i != $j) {
            $link = array(
              'source' => $i,
              'target' => $j,
              'weight' => $t->found_posts / 86
            );
            $duplicate = array(
              'source' => $j,
              'target' => $i,
              'weight' => $t->found_posts / 86
            );
            if(!array_search($duplicate, $links)) {
              array_push($links, $link);
            }
          }
          $j++;
        }
        // then between categories and tags
        $k = 0;
        foreach ($tags as $tag) {
          $t = new WP_Query( array( 'category__and' => $category->term_id , 'tag__and' => $tag->term_id));
          if ($t->found_posts > 0) {
            $link = array(
              'source' => $i,
              'target' => $k + $j,
              'weight' => $t->found_posts / 100
            );
            array_push($links, $link);
          }
          $k++;
        }
        $i++;
      }
      
      file_put_contents(dirname(__FILE__). '/js/nodes.json', json_encode($nodes));
      file_put_contents(dirname(__FILE__). '/js/links.json', json_encode($links));
      
      //echo "<script type='text/javascript'>alert('$q');</script>";

      */
      
      $nodes = json_decode(file_get_contents(dirname(__FILE__). '/js/nodes.json'));
      $links = json_decode(file_get_contents(dirname(__FILE__). '/js/links.json'));
      
      wp_localize_script('taxrel-draw','php_nodes',$nodes); 
      wp_localize_script('taxrel-draw','php_links',$links); 
      wp_localize_script('taxrel-draw','plugin_dir',plugin_dir_url(__FILE__));
      
      wp_enqueue_style( 'taxrel', plugin_dir_url(__FILE__) . 'css/taxrel.css');
      wp_enqueue_script( 'd3', 'http://d3js.org/d3.v3.js');
      wp_enqueue_script( 'd3-queue', 'http://d3js.org/queue.v1.min.js');
      wp_enqueue_script('taxrel-draw');
	  }

	  static function register_script() {
		  wp_register_script('taxrel-draw', plugins_url('js/draw.js', __FILE__), array('jquery'), '1.0', 'true');
	  }
	  
	  static function print_script() {
		  if ( ! self::$add_script )
			  return;

		  wp_print_scripts('taxrel-draw');
	  }
	  
  }

  TaxRel::init();
?>
