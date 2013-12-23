<?php

class ListAllController extends \Phalcon\Mvc\Controller
{
    const CDN = 'http://sal-assets.s3.amazonaws.com/wp-content/uploads';

    private $restaurants;

    public function indexAction()
    {
        $start = (isset($_GET['start'])) ? intval($_GET['start']) : 0;
        $limit = (isset($_GET['limit'])) ? intval($_GET['limit']) : 1;

        $restaurants = Posts::query()
            ->where("post_type = 'place'")
            ->andWhere("post_status = 'publish'")
            ->order("ID")
            ->limit($limit, $start)
            ->execute();

        foreach ($restaurants as $single) 
        {
            $this->restaurants[] = $this->parseRestaurant($single);
        }

        $content = json_encode($this->restaurants);
        ob_end_clean();
        header('Content-Type: application/json');
        header('Content-lenght: ' . strlen($content));
        echo $content;
        exit();
    }


    private function parseRestaurant($item)
    {
        $returnItem = new stdClass();
        $returnItem->id = $item->ID;
        $returnItem->title = (isset($item->post_title)) ? $item->post_title : '';
        $returnItem->content = (isset($item->post_content)) ? $item->post_content : '';
        $returnItem->excerpt = (isset($item->excerpt)) ? strip_tags($item->excerpt) : '';
        $returnItem->type = $item->post_type;
        $returnItem->comments_streamId = 'comments-' . $item->ID;
        $returnItem->rtgAmbience_streamId = 'ambiente-' . $item->ID;
        $returnItem->rtgService_streamId = 'servicio-' . $item->ID;
        $returnItem->rtgComida_streamId = 'comida-' . $item->ID;
        $returnItem->post_modified = $item->post_modified_gmt;
        $returnItem->foodType = $this->getFoodType($item->ID);
        $returnItem->tags = $this->getTags($item->ID);
        $returnItem->featuredImage = $this->getFeaturedImage($item->ID);

        $gallery = $this->getGalleryImgs($item->ID);
        $returnItem->galleryImages_L = $gallery['L'];
        $returnItem->galleryImages_M = $gallery['M'];

        $host = $_SERVER['HTTP_HOST'];
        if(!preg_match('/\/$/', $host))
            $host .= '/';
        $protocol = (preg_match('/https/', $_SERVER['SERVER_PROTOCOL'])) ? 'https' : 'http';
        $returnItem->url_post = $protocol . '://' . $host . $item->post_type . '/' . $item->post_name;

        $returnItem->precio = $this->get_rest_meta($item->ID, 'precio');
        $returnItem->myseat_id = $this->get_rest_meta($item->ID, 'myseat_id');
        $returnItem->telefono_sal_reserva = $this->get_rest_meta($item->ID, 'telefono_sal_reserva');
        $returnItem->special_offers = $this->get_rest_meta($item->ID, 'proprty_feature');
        $returnItem->is_salawards_finalist = $this->get_rest_meta($item->ID, 'is_salawards_finalist');
        $returnItem->keywords = $this->get_rest_meta($item->ID, 'kw_tags');
        $returnItem->lunch_special = $this->get_rest_meta($item->ID, 'lunch_special');
        $returnItem->menu = $this->get_rest_meta($item->ID, 'Menu');
        $returnItem->address = $this->get_rest_meta($item->ID, 'geo_address');
        $returnItem->ambience = $this->get_rest_meta($item->ID, 'ambiente_place');
        $returnItem->website = $this->get_rest_meta($item->ID, 'website');
        $returnItem->featured_type = $this->get_rest_meta($item->ID, 'featured_type');
        $returnItem->video = $this->get_rest_meta($item->ID, 'bumpia');
        $returnItem->is_featured = $this->get_rest_meta($item->ID, 'is_featured');
        $returnItem->city_id = $this->get_rest_meta($item->ID, 'post_city_id');
        $returnItem->phone = $this->get_rest_meta($item->ID, 'contact');
        $returnItem->timing = $this->get_rest_meta($item->ID, 'timing');
        $returnItem->longitude = $this->get_rest_meta($item->ID, 'geo_longitude');
        $returnItem->latitude = $this->get_rest_meta($item->ID, 'geo_latitude');
        $returnItem->local_elements = $this->get_rest_meta($item->ID, 'elementos_de_su_local');
        $returnItem->rating_average = $this->get_rest_meta($item->ID, 'rating_average');
        $returnItem->rating_average = (trim($returnItem->rating_average) == '') ? '0' : $returnItem->rating_average;

        return $returnItem;
    }


    private function getFoodType($id)
    {
        $returnVal = array();
        try {
            $base = "SELECT t.name FROM Terms AS t
                LEFT JOIN TermTaxonomy AS wtt
                    ON wtt.term_id = t.term_id
                    AND wtt.parent <> 0
                    AND wtt.parent <> 12
                LEFT JOIN TermRelationships AS wtr
                    ON wtt.term_taxonomy_id = wtr.term_taxonomy_id
                WHERE wtr.object_id = '%s'";

            $query = $this->modelsManager->createQuery(sprintf($base, $id));
            $results = $query->execute();
            foreach ($results as $single) 
            {
                $returnVal[] = $single->name;
            }
        } catch (Phalcon\Db\Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }

        return $returnVal;
    }


    private function getTags($id)
    {
        $returnVal = array();
        try {
            $base = "SELECT t.name FROM Terms AS t
                        LEFT JOIN TermTaxonomy AS wtt
                            ON wtt.term_id = t.term_id
                            AND wtt.taxonomy = 'placetags'
                        LEFT JOIN TermRelationships AS wtr
                            ON wtt.term_taxonomy_id = wtr.term_taxonomy_id
                        WHERE wtr.object_id = '%s'";

            $query = $this->modelsManager->createQuery(sprintf($base, $id));
            $results = $query->execute();
            foreach ($results as $single) 
            {
                $returnVal[] = $single->name;
            }
        } catch (Phalcon\Db\Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }

        return $returnVal;
    }


    private function getFeaturedImage($id)
    {
        $returnVal = array();
        try {
            $base = "SELECT m2.meta_value
                    FROM PostMeta AS m1
                    LEFT JOIN PostMeta AS m2
                        ON m2.post_id = m1.meta_value
                        AND m2.meta_key = '_wp_attachment_metadata'
                    WHERE m1.post_id = %d
                    AND m1.meta_key = '_thumbnail_id'
                    LIMIT 0,1";

            $query = $this->modelsManager->createQuery(sprintf($base, $id));
            $results = $query->execute();
            $meta = unserialize(utf8_encode($results[0]->meta_value));

            $path = preg_replace('/.[^\/]*$/', '', $meta['file']);
            $returnVal[] = self::CDN . "/" . $path . "/" . $meta['sizes']['S']['file'];
            $returnVal[] = self::CDN . "/" . $path . "/" . $meta['sizes']['L']['file'];
        } catch (Phalcon\Db\Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }

        return $returnVal;
    }


    private function getGalleryImgs($id)
    {
        $returnVal = array(
            'M' => array(),
            'L' => array()
            );

        try {
            $base = "SELECT m1.meta_value
                    FROM Posts AS p
                    LEFT JOIN PostMeta AS m1
                        ON m1.post_id = p.ID
                        AND m1.meta_key = '_wp_attachment_metadata'
                    WHERE p.post_type ='attachment'
                    AND p.post_mime_type LIKE '%%image%%'
                    AND p.post_parent = %d";

            $query = $this->modelsManager->createQuery(sprintf($base, $id));
            $results = $query->execute();

            foreach ($results as $single)
            {
                $meta = unserialize(utf8_encode($single->meta_value));
                $path = preg_replace('/.[^\/]*$/', '', $meta['file']);
                $returnVal['M'] = self::CDN . "/" . $path . "/" . $meta['sizes']['M']['file'];
                $returnVal['L'] = self::CDN . "/" . $path . "/" . $meta['sizes']['L']['file'];
            }        
        } catch (Phalcon\Db\Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }

        return $returnVal;
    }


    private function get_rest_meta($id, $key, $single = true)
    {
        $value = '';
        try {
            $meta = PostMeta::query()
                ->where(sprintf("post_id = %d", $id))
                ->andWhere(sprintf("meta_key = '%s'", $key))
                ->execute();

            if(sizeof($meta) > 0 && trim($meta[0]->meta_value) != '')
            {
                $val_utf = utf8_encode($meta[0]->meta_value);
                $value = (@unserialize($val_utf)) ? unserialize($val_utf) : $val_utf;
                $value = ($single && is_array($value)) ? implode(', ', $value) : $value;
            }
        } catch (Phalcon\Db\Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }
        return $value;
    }


    

}