var express = require('express');

var app = express.createServer();
app.use(express.bodyParser());
app.use(express['static'](__dirname + '../../../'));


app.all('/', function(req, res) {

    var data = [
        {id: 0, text: 'ajax'},
        {id: 1, text: 'sim ajax'},
        {id: 2, text: 'a very long text so we can test the width property properly'},
        {id: 3, text: 'aaaaa'},
        {id: 4, text: 'aff'},
        {id: 5, text: 'alguma coisa'},
        {id: 6, text: 'something'},
        {id: 7, text: 'omg'},
        {id: 8, text: 'testing'},
        {id: 9, text: 'so what?'},
        {id: 10, text: 'other chars'},
        {id: 11, text: 'á latin é'},
        {id: 12, text: 'hmmm'},
        {id: 13, text: 'chars test > gg'},
        {id: 14, text: 'chars test < gg'},
        {id: 15, text: 'chars test & gg'},
        {id: 16, text: 'ok'},
        {id: 17, text: 'it\' fine'}
    ];

    res.header('Content-Type', 'application/json');

    var items, id, q;

    if (req.query.id !== undefined) {

        id = req.query.id;
        items = data.filter(function(item) {
            return item.id === id;
        });
        if (items.length === 1) {
            res.send(items);
        }

    } else if (req.query.q !== undefined) {

        q = req.query.q;
        if (q) {
            items = data.filter(function(item) {
                return item.text.indexOf(q) !== -1;
            });
        } else {
            items = data;
        }

        if (req.query.limit !== undefined) {
            item = items.slice(0, req.query.limit);
        }

        res.send(items);

    }
});

app.listen(3000);
console.log('Access http://localhost:3000/ to run specs');
