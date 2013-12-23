<?php

    class Posts extends Phalcon\Mvc\Model
    {
        const TABLE_NAME = 'wp_posts';

        public $ID;
        public $post_modified_gmt;
        public $post_title;
        public $post_content;
        public $post_name;
        public $post_excerpt;
        public $post_status;
        public $post_type;

        protected $post_author;
        protected $post_date;
        protected $post_date_gmt;
        protected $comment_status;
        protected $ping_status;
        protected $post_password;
        protected $to_ping;
        protected $pinged;
        protected $post_modified;
        protected $post_content_filtered;
        protected $post_parent;
        protected $guid;
        protected $menu_order;
        protected $post_mime_type;
        protected $comment_count;

        
        public function getSource()
        {
            return self::TABLE_NAME;
        }

        public function initialize()
        {
            $this->setSource(self::TABLE_NAME);
        }

    }