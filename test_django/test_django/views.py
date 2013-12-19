# -*- coding: utf-8 -*-

from django.http import HttpResponse
from django.db import connection
import salparser
import json


def listall(request):
    parser = salparser.SalParser(connection)
    limit = request.GET.get('limit', 1)
    start = request.GET.get('start', 0)
    query = parser.get_main_query(limit, start)
    cursor = connection.cursor()
    cursor.execute(query)
    rows = parser.dictfetchall(cursor)

    restaurants = parser.get_restaurants(
        rows=rows, url=request.build_absolute_uri())

    return HttpResponse(
        json.dumps(restaurants), content_type="application/json")
