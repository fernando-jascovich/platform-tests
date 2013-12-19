
/*
 * GET restaurant listing
 */

var db = require('../database');
var cdn = "http://sal-assets.s3.amazonaws.com/wp-content/uploads";
var urlForImage = "http://sal-assets.s3.amazonaws.com/wp-content/uploads/bulk/";
var url = require('url');
var PHPUnserialize = require('php-unserialize');
var queryVars = {};
var dbRestaurants = [];
var restaurantsMetas = {};
var restaurantsCats = {};
var restaurantsTags = {};
var restaurantsFeaturedImages = {};
var restaurantsGalleryL = {};
var restaurantsGalleryM = {};
var restaurants = [];
var metas = ['precio', 'myseat_id', 'telefono_sal_reserva', 'proprty_feature', 'is_salawards_finalist', 'kw_tags', 'lunch_special', 'Menu', 'geo_address', 'ambiente_place', 'website', 'featured_type', 'bumpia', 'is_featured', 'post_city_id', 'contact', 'timing', 'geo_longitude', 'geo_latitude', 'elementos_de_su_local', 'rating_average'];
var metasParsed = 0;
var catsParsed = 0;
var tagsParsed = 0;
var featuredImageParsed = 0;
var galleryImagesParsed = 0;
var response;
var request;

function parseQueryVars(request) {
    var url_parts = url.parse(request.url, true);
    queryVars = url_parts.query;
}

function parseRestaurant(restaurant) {
    returnRest = {};
    returnRest.id = restaurant.PostId;
    returnRest.title = restaurant.post_title;
    returnRest.content = restaurant.post_content;
    returnRest.excerpt = strip_tags(restaurant.post_excerpt + '');
    returnRest.type = restaurant.post_type;
    returnRest.comments_streamId = 'comments-' + returnRest.id;
    returnRest.rtgAmbience_streamId = 'ambiente-' + returnRest.id;
    returnRest.rtgService_streamId = 'servicio-' + returnRest.id;
    returnRest.rtgComida_streamId = 'comida-' + returnRest.id;
    returnRest.post_modified = restaurant.post_modified_gmt;
    returnRest.foodType = restaurantsCats[returnRest.id];
    returnRest.tags = restaurantsTags[returnRest.id];
    returnRest.featuredImage = restaurantsFeaturedImages[returnRest.id];
    returnRest.galleryImages_L = restaurantsGalleryL[returnRest.id];
    returnRest.galleryImages_M = restaurantsGalleryM[returnRest.id];
    returnRest.url_post = request.protocol + "://" + request.get('host') + '/'
        + restaurant.post_type + '/' + restaurant.post_name;

    for(var i = 0; i < metas.length; i++) {
        var key = metas[i];
        switch(metas[i]) {
            case 'proprty_feature':
                key = 'special_offers';
                break;

            case 'kw_tags':
                key = 'keywords';
                break;

            case 'Menu':
                key = 'menu';
                break;

            case 'geo_address':
                key = 'address';
                break;

            case 'ambiente_place':
                key = 'ambience';
                break;

            case 'bumpia':
                key = 'video';
                break;

            case 'post_city_id':
                key = 'city_id';
                break;

            case 'contact':
                key = 'phone';
                break;

            case 'geo_longitude':
                key = 'longitude';
                break;

            case 'geo_latitude':
                key = 'latitude';
                break;

            case 'elementos_de_su_local':
                key = 'local_elements';
                break;

            case 'rating_average':
                value = restaurantsMetas[returnRest.id][metas[i]];
                if(value.trim() == '') {
                    restaurantsMetas[returnRest.id][metas[i]] = '0';
                }
                break;
        }

        returnRest[key] = restaurantsMetas[returnRest.id][metas[i]];
    }

    return returnRest;
}

function parseRestaurants(rows) {
    for(var i = 0; i < dbRestaurants.length; i++) {
        restaurants.push(parseRestaurant(dbRestaurants[i]));
    }
    response.send(restaurants);
}

function strip_tags (input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
}

function pathinfo(path, options) {
    var opt = '',
        optName = '',
        optTemp = 0,
        tmp_arr = {},
        cnt = 0,
        i = 0;
    var have_basename = false,
        have_extension = false,
        have_filename = false;

    // Input defaulting & sanitation
    if (!path) {
        return false;
    }
    if (!options) {
        options = 'PATHINFO_ALL';
    }

    // Initialize binary arguments. Both the string & integer (constant) input is
    // allowed
    var OPTS = {
        'PATHINFO_DIRNAME': 1,
        'PATHINFO_BASENAME': 2,
        'PATHINFO_EXTENSION': 4,
        'PATHINFO_FILENAME': 8,
        'PATHINFO_ALL': 0
    };
    // PATHINFO_ALL sums up all previously defined PATHINFOs (could just pre-calculate)
    for (optName in OPTS) {
        OPTS.PATHINFO_ALL = OPTS.PATHINFO_ALL | OPTS[optName];
    }
    if (typeof options !== 'number') { // Allow for a single string or an array of string flags
        options = [].concat(options);
        for (i = 0; i < options.length; i++) {
            // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
            if (OPTS[options[i]]) {
                optTemp = optTemp | OPTS[options[i]];
            }
        }
        options = optTemp;
    }

    // Internal Functions
    var __getExt = function (path) {
        var str = path + '';
        var dotP = str.lastIndexOf('.') + 1;
        return !dotP ? false : dotP !== str.length ? str.substr(dotP) : '';
    };


    // Gather path infos
    if (options & OPTS.PATHINFO_DIRNAME) {
        var dirname = this.dirname(path);
        tmp_arr.dirname = dirname === path ? '.' : dirname;
    }

    if (options & OPTS.PATHINFO_BASENAME) {
        if (false === have_basename) {
            have_basename = this.basename(path);
        }
        tmp_arr.basename = have_basename;
    }

    if (options & OPTS.PATHINFO_EXTENSION) {
        if (false === have_basename) {
            have_basename = this.basename(path);
        }
        if (false === have_extension) {
            have_extension = __getExt(have_basename);
        }
        if (false !== have_extension) {
            tmp_arr.extension = have_extension;
        }
    }

    if (options & OPTS.PATHINFO_FILENAME) {
        if (false === have_basename) {
            have_basename = this.basename(path);
        }
        if (false === have_extension) {
            have_extension = __getExt(have_basename);
        }
        if (false === have_filename) {
            have_filename = have_basename.slice(0, have_basename.length - (have_extension ? have_extension.length + 1 : have_extension === false ? 0 : 1));
        }

        tmp_arr.filename = have_filename;
    }


    // If array contains only 1 element: return string
    cnt = 0;
    for (opt in tmp_arr) {
        cnt++;
    }
    if (cnt == 1) {
        return tmp_arr[opt];
    }

    // Return full-blown array
    return tmp_arr;
}

function getRestaurantsMeta(rows) {
    dbRestaurants = rows;
    for(var index in dbRestaurants) {
        for(var i = 0; i < metas.length; i++) {
            var actualRestaurantObject = rows[index];
            var query = "SELECT meta_value, post_id FROM wp_postmeta "
                + "WHERE wp_postmeta.post_id = " + rows[index].PostId
                + " AND wp_postmeta.meta_key = '" + metas[i] + "'";

            db.metaQuery(query, rows[index].PostId, metas[i], function(err, id, metaKey, metaRows, fields) {
                var metaValue  = '';
                try {
                    metaValue = metaRows[0].meta_value;
                    if(metaValue != '') {
                        metaValue = PHPUnserialize.unserialize(metaValue);
                        metaValue = metaValue['0'];
                    }
                } catch(e) {
                         
                }

                if(typeof restaurantsMetas[id] == 'undefined') {
                    restaurantsMetas[id] = {};
                }
                restaurantsMetas[id][metaKey] = metaValue;

                metasParsed++;
                if(metasParsed == metas.length * dbRestaurants.length) {
                    metasParsed = 0;
                    getRestaurantsCats();
                }
            });
        }
    }    
}


function getRestaurantsCats() {
    var catsQuery = "SELECT wp_terms.name FROM wp_terms "
    + "LEFT JOIN wp_term_taxonomy on wp_term_taxonomy.term_id = wp_terms.term_id "
    + "LEFT JOIN wp_term_relationships "
    + "ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id "
    + "WHERE wp_term_relationships.object_id = '%s' "
    + "AND wp_term_taxonomy.parent <> 0 "
    + "AND wp_term_taxonomy.parent <> 12";

    for(var i = 0; i < dbRestaurants.length; i++) {
        db.metaQuery(
            catsQuery.replace('%s', dbRestaurants[i].PostId), 
            dbRestaurants[i].PostId, 
            'cats', 
            function(err, id, key, rows, fields) {
                var cats = [];
                try {
                    for(var a = 0; a < rows.length; a++) {
                        cats.push(rows[a].name);
                    }
                } catch(e) {
                         
                }

                if(typeof restaurantsCats[id] == 'undefined') {
                    restaurantsCats[id] = {};
                }
                restaurantsCats[id] = cats;

                catsParsed++;
                if(catsParsed == dbRestaurants.length) {
                    catsParsed = 0;
                    getRestaurantsTags();
                }                
            }
        );
    }
}

function getRestaurantsFeaturedImages() {
    var featuredQuery = "SELECT m2.meta_value "
    + "FROM wp_postmeta AS m1 "
    + "LEFT JOIN wp_postmeta AS m2 "
    + "ON m2.post_id = m1.meta_value "
    + "AND m2.meta_key = '_wp_attachment_metadata' "
    + "WHERE m1.post_id = %d "
    + "AND m1.meta_key = '_thumbnail_id' "
    + "LIMIT 0,1";

    for(var i = 0; i < dbRestaurants.length; i++) {
        db.metaQuery(
            featuredQuery.replace('%d', dbRestaurants[i].PostId), 
            dbRestaurants[i].PostId, 
            'featured', 
            function(err, id, key, rows, fields) {
                var featuredImage = [];
                try {
                    metaValue = rows[0].meta_value;
                    if(metaValue != '') {
                        metaValue = PHPUnserialize.unserialize(metaValue);
                        var path = metaValue.file.replace(/.[^\/]*$/, '');

                        var s = cdn + '/' + path + '/' + metaValue.sizes.S.file;
                        var l = cdn + '/' + path + '/' + metaValue.sizes.L.file;

                        featuredImage.push(s);
                        featuredImage.push(l);
                    }
                } catch(e) {
                         
                }

                restaurantsFeaturedImages[id] = {};
                restaurantsFeaturedImages[id] = featuredImage;

                featuredImageParsed++;
                if(featuredImageParsed == dbRestaurants.length) {
                    featuredImageParsed = 0;
                    getGalleryImages();
                }              
            }
        );
    }
}

function getGalleryImages() {
    var featuredQuery = "SELECT m1.meta_value "
    + "FROM wp_posts AS p "
    + "LEFT JOIN wp_postmeta AS m1 "
        + "ON m1.post_id = p.ID "
        + "AND m1.meta_key = '_wp_attachment_metadata' "
    + "WHERE p.post_type ='attachment' "
    + "AND p.post_mime_type LIKE '%image%' "
    + "AND p.post_parent = %d";

    for(var i = 0; i < dbRestaurants.length; i++) {
        db.metaQuery(
            featuredQuery.replace('%d', dbRestaurants[i].PostId), 
            dbRestaurants[i].PostId, 
            'featured', 
            function(err, id, key, rows, fields) {
                var galleryImagesL = [];
                var galleryImagesM = [];
                try {
                    for(var a = 0; a < rows.length; a++) {
                        metaValue = rows[a].meta_value;
                        if(metaValue != '') {
                            metaValue = PHPUnserialize.unserialize(metaValue);
                            var path = metaValue.file.replace(/.[^\/]*$/, '');

                            var m = cdn + '/' + path + '/' + metaValue.sizes.M.file;
                            var l = cdn + '/' + path + '/' + metaValue.sizes.L.file;

                            galleryImagesM.push(m);
                            galleryImagesL.push(l);
                        }
                    }
                } catch(e) {
                         
                }

                restaurantsGalleryL[id] = galleryImagesL;
                restaurantsGalleryM[id] = galleryImagesM;

                galleryImagesParsed++;
                if(galleryImagesParsed == dbRestaurants.length) {
                    galleryImagesParsed = 0;
                    parseRestaurants();
                }              
            }
        );
    }

}

function getRestaurantsTags() {
    var tagsQuery = "SELECT wp_terms.name FROM wp_terms "
    + "LEFT JOIN wp_term_taxonomy on wp_term_taxonomy.term_id = wp_terms.term_id "
    + "LEFT JOIN wp_term_relationships "
    + "ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id "
    + "AND wp_term_taxonomy.taxonomy = 'placetags'"
    + "WHERE wp_term_relationships.object_id = '%s' ";

    for(var i = 0; i < dbRestaurants.length; i++) {
        db.metaQuery(
            tagsQuery.replace('%s', dbRestaurants[i].PostId), 
            dbRestaurants[i].PostId, 
            'tags', 
            function(err, id, key, rows, fields) {
                var tags = [];
                try {
                    for(var a = 0; a < rows.length; a++) {
                        tags.push(rows[a].name);
                    }
                } catch(e) {
                         
                }

                if(typeof restaurantsTags[id] == 'undefined') {
                    restaurantsTags[id] = {};
                }
                restaurantsTags[id] = tags;

                tagsParsed++;
                if(tagsParsed == dbRestaurants.length) {
                    tagsParsed = 0;
                    getRestaurantsFeaturedImages();
                }                
            }
        );
    }
}


exports.listall =  function(req, res){
    parseQueryVars(req);

    var start = (typeof queryVars.start != 'undefined') ? queryVars.start : 0;
    var finish = (typeof queryVars.limit != 'undefined') ? queryVars.limit : 0;
    var modDate = (typeof queryVars.modDate != 'undefined') ? queryVars.modDate : false;

    var select = [
        "P.id as PostId",
        "P.post_modified_gmt",
        "P.post_title",
        "P.post_content",
        "P.post_name",
        "P.post_excerpt",
        "P.post_status",
        "P.post_type"];

    var from = ["wp_posts as P"];

    var where = [
        "P.post_type = 'place'",
        "P.post_status = 'publish'"
    ];

    if(modDate) {
        where.push("post_modified_gmt >= '" + modDate + "'");
    }

    var limit = [start, finish];

    var listallQuery = "SELECT " + select.join(",")
        + " FROM " + from.join(" ")
        + " WHERE " + where.join(" AND ")
        + " LIMIT " + limit.join(",");

    db.simpleQuery(listallQuery, function(err, rows, fields) {
        dbRestaurants.length = 0;
        restaurantsMetas.length = 0;
        dbRestaurants.length = 0;
        restaurants.length = 0;
        request = req;
        response = res;
        getRestaurantsMeta(rows);
    });
};

    
