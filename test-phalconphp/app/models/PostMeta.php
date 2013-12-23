<?php

    class PostMeta extends Phalcon\Mvc\Model
    {
        const TABLE_NAME = 'wp_postmeta';

        private $meta_id;
        private $meta_key;
        private $post_id;

        public $meta_value;

        public function getSource()
        {
            return self::TABLE_NAME;
        }

        public function initialize()
        {
            $this->setSource(self::TABLE_NAME);
        }

    }