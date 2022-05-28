//require
let express = require('express');
const session = require('express-session');
const cookieParser = require("cookie-parser");
let mysql = require('mysql');

//Create web app
let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setup Session
app.use(session({
  
    // It holds the secret key for session
    secret: 'some secret',
    
    //Set options cookies
    cookie: { maxAge: 86400000 },

    resave: false,
  
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true,
}))

//Create Server socket.io
const http = require('http').Server(app);
const io = require("socket.io")(http);
io.socketsJoin("general");
let userList = {};

//Connection bdd
let bdd = mysql.createConnection({
    database: "messagerietest",
    host: "localhost",
    user: "root",
    password: "",
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci"
});

bdd.connect(function(err) {
    if (err) throw err;
    console.log("Connected bdd!");
});

//Plus(++)
const { listen } = require('express/lib/application');
const { clear } = require('console');

//Setup static and views
app.use(express.static('public'));

//Show index
app.get('/',(req,res) => {
    if(req.session.authenticated){
        let snn = req.session.user;
        res.sendFile(__dirname+'/index.html');
    }else{
        req.session.destroy();
        res.redirect('/login');
    }
})

app.post('/',(req, res) => {
    const pseudo = req.body.pseudo;
    req.session.authenticated = true;
    req.session.user = { pseudo };
    io.on('connection',(socket) => {
        userList[socket.id] = req.session.user;
        io.emit('userInteraction',userList);
    })
    res.sendFile(__dirname+'/index.html')
})

app.get('/login',(req, res) => {
    if(req.session.authenticated){
        console.log(req.session);
        req.session.destroy();
    }
    res.sendFile(__dirname+'/login.html');
})

io.on('connection', (socket) => {
    console.log('a user is connected:'+socket.id);
    bdd.query("SELECT * FROM messages", function (err, result) {
        if (err) throw err;
        socket.emit('last messages',result);
    });
    socket.on('disconnect', () => {
        console.log('a user is disconnect:'+socket.id);
        delete userList[socket.id];
        io.emit('userInteraction',userList);
    })
    socket.on('chat message', (msg) => {
        if(msg != ""){
            bdd.query("INSERT INTO messages(user, message) VALUES (?, ?)", [userList[socket.id]['pseudo'], msg], function (err, result) {
                if (err) throw err;
                socket.emit('last messages',result);
            });
        }
        console.log('message reçus:'+msg);
        io.emit('chat message', userList[socket.id]['pseudo']+" : "+msg);
    })
    socket.on('focusUser', (sck) => {
        io.emit('sFocusUser',sck);
    })
    socket.on('blurUser', (sck) => {
        io.emit('sBlurUser',sck);
    })
});

//server port
http.listen(3000, () => {
    console.log('listening on :3000');
});