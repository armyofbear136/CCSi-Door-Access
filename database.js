var mysql = require('mysql');
var conn = mysql.createConnection({
	host: 'localhost',
	user: 'testuser',
	password: 'CCSi60047#',
	database: 'synergy',
	dateStrings: 'date'
});
conn.connect(function(err) {
	if (err) throw err;
	console.log('Database is connected successfully!');
});
module.exports = conn;
