var mysql = require('mysql');

var pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'db',
    connectionLimit: 1,
    supportBigNumbers: true
});


exports.simpleQuery = function(query, callback) {
    pool.getConnection(function(err, connection) {
        connection.query(query, function(err, rows, fields) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }
            callback(false, rows, fields); 
        });
    });
}


exports.metaQuery = function(query, id, metaKey, callback) {
    pool.getConnection(function(err, connection) {
        connection.query(query, function(err, rows, fields) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }
            callback(false, id, metaKey, rows, fields); 
        });
    });
}