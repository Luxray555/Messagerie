let express = require('express');

let app = express();

app.set('views', 'views/pages');

app.set('view engine','pug');

app.get('/', (request,response) => {
    response.render('index');
})

app.listen(8080);