<?php

    class Terms extends Phalcon\Mvc\Model
    {
        const TABLE_NAME = 'wp_terms';

        public function getSource()
        {
            return self::TABLE_NAME;
        }

        public function initialize()
        {
            $this->setSource(self::TABLE_NAME);
        }

    }