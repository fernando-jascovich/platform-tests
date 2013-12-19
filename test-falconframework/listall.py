# -*- coding: utf-8 -*-

import json
import logging
from wsgiref import simple_server
import falcon
import database
import salparser


class ListAllResource:

    def __init__(self, db, parser):
        self.db = db
        self.parser = parser
        self.logger = logging.getLogger('listallapp.' + __name__)
        self.logger.setLevel(logging.DEBUG)
        fh = logging.FileHandler('loggger.log')
        fh.setLevel(logging.DEBUG)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        self.logger.addHandler(fh)

    def on_get(self, req, resp):
        query = self.parser.get_main_query(
            req.get_param('limit'),
            req.get_param('start'))
        dbResults = self.db.simple_query(query)
        result = self.parser.get_restaurants(dbResults, req.url)
        """try:
            query = self.parser.get_main_query(
                req.get_param('limit'),
                req.get_param('start'))
            dbResults = self.db.simple_query(query)
            result = self.parser.get_restaurants(dbResults, req.url)
        except Exception as ex:
            self.logger.error(ex)

            description = ('Error.')

            raise falcon.HTTPServiceUnavailable(
                'error',
                description,
                30)"""

        resp.status = falcon.HTTP_200
        resp.body = json.dumps(result)

# Configure your WSGI server to load "listall.app" (app is a WSGI callable)
app = falcon.API()
db = database.StorageEngine()
parser = salparser.SalParser(db)
listall = ListAllResource(db, parser)
app.add_route('/listall', listall)

# Useful for debugging problems in your API; works with pdb.set_trace()
if __name__ == '__main__':
    httpd = simple_server.make_server('127.0.0.1', 8000, app)
    httpd.serve_forever()
