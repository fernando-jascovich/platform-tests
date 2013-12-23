<?php

    class TermRelationships extends Phalcon\Mvc\Model
    {
        const TABLE_NAME = 'wp_term_relationships';

        public $object_id;
        public $term_taxonomy_id;

        public function getSource()
        {
            return self::TABLE_NAME;
        }

        public function initialize()
        {
            $this->setSource(self::TABLE_NAME);
        }

    }