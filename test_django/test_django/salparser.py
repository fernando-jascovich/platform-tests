# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
from phpserialize import unserialize
import re


class SalParser:

    def __init__(self, db):
        self.db = db
        self.cdn = 'http://sal-assets.s3.amazonaws.com/wp-content/uploads'

    def get_main_query(self, limit, start):
        limit = limit if limit is not None else 1
        start = start if start is not None else 0

        query_select = [
            "P.id as PostId",
            "P.post_modified_gmt",
            "P.post_title",
            "P.post_content",
            "P.post_name",
            "P.post_excerpt",
            "P.post_status",
            "P.post_type"]

        query_from = ["wp_posts as P"]

        query_where = [
            "P.post_type = 'place'",
            "P.post_status = 'publish'"
        ]

        query_limit = [str(start), str(limit)]

        query_str = "SELECT %s FROM %s WHERE %s LIMIT %s" % (
            ", ".join(query_select),
            " ".join(query_from),
            " AND ".join(query_where),
            ", ".join(query_limit))

        return query_str

    def get_restaurants(self, rows, url):
        self.url = url
        returnVal = []
        for single in rows:
            returnVal.append(self.parse_restaurant(single))

        return returnVal

    def parse_restaurant(self, item):
        returnRest = {}
        returnRest['id'] = item['PostId']
        returnRest['title'] = item['post_title']
        returnRest['content'] = item['post_content']
        returnRest['excerpt'] = ''.join(BeautifulSoup(
            item['post_excerpt']).findAll(text=True))
        returnRest['type'] = item['post_type']
        returnRest['comments_streamId'] = 'comments-' + str(item['PostId'])
        returnRest['rtgAmbience_streamId'] = 'ambiente-' + str(item['PostId'])
        returnRest['rtgService_streamId'] = 'servicio-' + str(item['PostId'])
        returnRest['rtgComida_streamId'] = 'comida-' + str(item['PostId'])
        returnRest['post_modified'] = str(item['post_modified_gmt'])

        returnRest['foodType'] = self.get_rest_food_type(item['PostId'])
        returnRest['tags'] = self.get_rest_tags(item['PostId'])
        returnRest['featuredImage'] = self.get_rest_featured_img(
            item['PostId'])

        gallery = self.get_rest_gallery_img(item['PostId'])
        returnRest['galleryImages_L'] = gallery[0]
        returnRest['galleryImages_M'] = gallery[1]

        urlMatch = re.search('^https*://.[^/]*', self.url)
        returnRest['url_post'] = '%s/%s/%s/' % (
            urlMatch.group(),
            item['post_type'],
            item['post_name'])

        returnRest['precio'] = self.get_rest_meta(item['PostId'], 'precio')
        returnRest['myseat_id'] = self.get_rest_meta(
            item['PostId'], 'myseat_id')
        returnRest['telefono_sal_reserva'] = self.get_rest_meta(
            item['PostId'], 'telefono_sal_reserva')
        returnRest['special_offers'] = self.get_rest_meta(
            item['PostId'], 'proprty_feature')
        returnRest['is_salawards_finalist'] = self.get_rest_meta(
            item['PostId'], 'is_salawards_finalist')
        returnRest['keywords'] = self.get_rest_meta(item['PostId'], 'kw_tags')
        returnRest['lunch_special'] = self.get_rest_meta(
            item['PostId'], 'lunch_special')
        returnRest['menu'] = self.get_rest_meta(item['PostId'], 'Menu')
        returnRest['address'] = self.get_rest_meta(
            item['PostId'], 'geo_address')
        returnRest['ambience'] = self.get_rest_meta(
            item['PostId'], 'ambiente_place')
        returnRest['website'] = self.get_rest_meta(item['PostId'], 'website')
        returnRest['featured_type'] = self.get_rest_meta(
            item['PostId'], 'featured_type')
        returnRest['video'] = self.get_rest_meta(item['PostId'], 'bumpia')
        returnRest['is_featured'] = self.get_rest_meta(
            item['PostId'], 'is_featured')
        returnRest['city_id'] = self.get_rest_meta(
            item['PostId'], 'post_city_id')
        returnRest['phone'] = self.get_rest_meta(item['PostId'], 'contact')
        returnRest['timing'] = self.get_rest_meta(item['PostId'], 'timing')
        returnRest['longitude'] = self.get_rest_meta(
            item['PostId'], 'geo_longitude')
        returnRest['latitude'] = self.get_rest_meta(
            item['PostId'], 'geo_latitude')
        returnRest['local_elements'] = self.get_rest_meta(
            item['PostId'], 'elementos_de_su_local')
        returnRest['rating_average'] = self.get_rest_meta(
            item['PostId'], 'rating_average')

        if(returnRest['rating_average'].strip() == ''):
            returnRest['rating_average'] = '0'

        return returnRest

    def get_rest_food_type(self, id):
        returnVal = []
        query = """SELECT wp_terms.name FROM wp_terms
            LEFT JOIN wp_term_taxonomy AS wtt
                ON wtt.term_id = wp_terms.term_id
                AND wtt.parent <> 0
                AND wtt.parent <> 12
            LEFT JOIN wp_term_relationships AS wtr
                ON wtt.term_taxonomy_id = wtr.term_taxonomy_id
            WHERE wtr.object_id = '%s'""" % id

        cursor = self.db.cursor()
        cursor.execute(query)
        results = self.dictfetchall(cursor)

        for single in results:
            returnVal.append(single['name'])

        return returnVal

    def get_rest_tags(self, id):
        returnVal = []
        query = """SELECT wp_terms.name FROM wp_terms
            LEFT JOIN wp_term_taxonomy AS wtt
                ON wtt.term_id = wp_terms.term_id
                AND wtt.taxonomy = 'placetags'
            LEFT JOIN wp_term_relationships AS wtr
                ON wtt.term_taxonomy_id = wtr.term_taxonomy_id
            WHERE wtr.object_id = '%s'""" % id

        cursor = self.db.cursor()
        cursor.execute(query)
        results = self.dictfetchall(cursor)

        for single in results:
            returnVal.append(single['name'])

        return returnVal

    def get_rest_featured_img(self, id):
        query = """SELECT m2.meta_value
            FROM wp_postmeta AS m1
            LEFT JOIN wp_postmeta AS m2
            ON m2.post_id = m1.meta_value
            AND m2.meta_key = '_wp_attachment_metadata'
            WHERE m1.post_id = %d
            AND m1.meta_key = '_thumbnail_id'
            LIMIT 0,1""" % int(id)

        cursor = self.db.cursor()
        cursor.execute(query)
        result = self.dictfetchall(cursor)

        img = []
        try:
            meta = unserialize(result[0]['meta_value'])
            path = re.sub(r'.[^\/]*$', '', meta['file'])
            s = "%s/%s/%s" % (self.cdn, path, meta['sizes']['S']['file'])
            l = "%s/%s/%s" % (self.cdn, path, meta['sizes']['L']['file'])
            img.append(s)
            img.append(l)
        except:
            pass

        return img

    def get_rest_gallery_img(self, id):
        query = """SELECT m1.meta_value
            FROM wp_posts AS p
            LEFT JOIN wp_postmeta AS m1
                ON m1.post_id = p.ID
                AND m1.meta_key = '_wp_attachment_metadata'
            WHERE p.post_type ='attachment'
            AND p.post_mime_type LIKE '%%%%image%%%%'
            AND p.post_parent = %d""" % int(id)

        cursor = self.db.cursor()
        cursor.execute(query)
        result = self.dictfetchall(cursor)

        img_l = []
        img_m = []
        for img in result:
            condition = (img['meta_value'] is not None and
                         img['meta_value'].strip() is not '')
            if(condition):
                try:
                    meta = unserialize(img['meta_value'])
                    path = re.sub(r'.[^\/]*$', '', meta['file'])
                    m = "%s/%s/%s" % (
                        self.cdn, path, meta['sizes']['M']['file'])
                    l = "%s/%s/%s" % (
                        self.cdn, path, meta['sizes']['L']['file'])
                    img_l.append(l)
                    img_m.append(m)
                except ValueError:
                    pass

        return [img_m, img_l]

    def get_rest_meta(self, id, key):
        query = """SELECT m.meta_value
            FROM wp_postmeta AS m
            WHERE m.post_id = %d
            AND m.meta_key = '%s'""" % (int(id), key)

        cursor = self.db.cursor()
        cursor.execute(query)
        result = self.dictfetchall(cursor)

        meta_value = ''
        try:
            condition = (result[0]['meta_value'] is not None and
                         result[0]['meta_value'].strip() is not '')
            if(condition):
                meta_value = result[0]['meta_value']
                try:
                    meta_value = unserialize(meta_value)
                    meta_value = meta_value[0]
                except ValueError:
                    pass
        except IndexError:
            pass

        return meta_value

    def dictfetchall(self, cursor):
        desc = cursor.description
        return [
            dict(zip([col[0] for col in desc], row))
            for row in cursor.fetchall()
        ]
