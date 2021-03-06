var express = require('express');
var mysql = require('mysql');
var iniparser = require('iniparser');
require('datejs');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mysqlCreds = iniparser.parseSync(process.env.MYSQL_CREDS_PATH);
var sql = "SELECT DATE(rev_timestamp) AS date, count(*) as count " +
          "FROM revision_userindex JOIN page ON page.page_id = revision_userindex.rev_page " +
          "WHERE rev_timestamp > ? AND rev_user_text = ? AND page_namespace = 0 " +
          "GROUP BY DATE(rev_timestamp)";

function makeConnection(dbname) {
    return mysql.createConnection({
        host: dbname + '.labsdb',
        user: mysqlCreds.client.user,
        password: mysqlCreds.client.password,
        database: dbname + '_p',
    });
}


router.get('/:wiki/:username', function(req, res) {
    var conn = makeConnection(req.params.wiki);
    var limitDate = Date.today().addYears(-1);

    conn.query({
        sql: sql,
        values: [limitDate.toString('yyyyMMdd000000'), req.params.username],
    }, function(err, rows) {
        console.error("hi");
        if (err) {
            console.error(err);
        }

        var editsData = {};
        rows.forEach(function(entry) {
            editsData[entry.date.getTime()] = entry.count;
        });

        res.send({
            username: req.params.username,
            wiki: req.params.wiki,
            edits: editsData
        });
    });
});
module.exports = router;
