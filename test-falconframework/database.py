# -*- coding: utf-8 -*-

import collections
import MySQLdb


class StorageEngine:

    def __init__(self):
        self.database = MySQLdb.connect(host="localhost",
                                        user="",
                                        passwd="",
                                        db="")

    def simple_query(self, query):
        c = self.database.cursor(MySQLdb.cursors.DictCursor)
        c.execute(query)

        rows = c.fetchall()
        objects_list = []

        for row in rows:
            d = collections.OrderedDict()
            for key in row:
                if(type(row[key]) == int):
                    d[key] = row[key]
                else:
                    d[key] = str(row[key]).decode('iso-8859-1').encode('utf8')

            objects_list.append(d)

        return objects_list
