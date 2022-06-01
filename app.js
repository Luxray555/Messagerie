//require
let express = require('express');
const session = require('express-session');
const url = require('url');
const cookieParser = require("cookie-parser");
let mysql = require('mysql');
const EventEmitter = require('events');

//Create web app
let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setup Session
app.use(session({
  
    // It holds the secret key for session
    secret: 'jhzrfjhrsedg',
    
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
io.setMaxListeners(0);
let userList = {};
let groupeList;



//Connection bdd
let bdd = mysql.createConnection({
    database: "messagerie",
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

bdd.query('SELECT * FROM groupes',(err, result) => {
    if (err) throw err;
    for(i=0;i<result.length;i++){
        if(userList.hasOwnProperty(result[i]['idGroupe'])){
            result[i]['nom'] = result[i]['nom']+" ("+Object.keys(userList[result[i]['idGroupe']]).length+")";
        }else{
            result[i]['nom'] = result[i]['nom']+" ("+0+")";
        }
    }
    groupeList = result;
})
setInterval(() => {
    bdd.query('SELECT * FROM groupes',(err, result) => {
        if (err) throw err;
        for(i=0;i<result.length;i++){
            if(userList.hasOwnProperty(result[i]['idGroupe'])){
                result[i]['nom'] = result[i]['nom']+" ("+Object.keys(userList[result[i]['idGroupe']]).length+")";
            }else{
                result[i]['nom'] = result[i]['nom']+" ("+0+")";
            }
        }
        groupeList = result;
    })
}, 1000);

//Plus(++)
const { listen } = require('express/lib/application');
const { clear } = require('console');

//Setup static and views
app.use(express.static('public'));

//Groupe get/post
app.get('/Groupe',(req,res) => {
    io.on('connection',(socket) => {
        socket.emit('sessionPseudo',req.session.pseudo);
        socket.emit('listGroupeInformation', groupeList);
        setInterval(() => {
            socket.emit('listGroupeInformation', groupeList);
        },5000)
    })
    if(!req.session.authenticated){
        req.session.pseudo = undefined;
        req.session.mdp = undefined;
        res.redirect('/login');
    }else{
        res.sendFile(__dirname+'/groupe.html');
    }
})

app.post('/Groupe',(req, res) => {
    const pseudo = req.body.pseudo;
    const mdp = req.body.pass;
    if(req.session.authenticated == false || req.session.authenticated == undefined){
        bdd.query("SELECT mdp FROM users WHERE pseudo=?", [pseudo], function (err, result) {
            if (err) throw err;
            if(result.length != 0){
                if(mdp == result[0]['mdp']){
                    req.session.authenticated = true;
                    req.session.pseudo = pseudo;
                    req.session.mdp = mdp;
                    res.sendFile(__dirname+'/groupe.html')
                }else{
                    res.redirect('/login');
                }
            }else{
                bdd.query("INSERT INTO users(pseudo, mdp) VALUES (?, ?)", [pseudo, mdp], function (err) {
                    if (err) throw err;
                    req.session.authenticated = true;
                    req.session.pseudo = pseudo;
                    req.session.mdp = mdp;
                });
                res.sendFile(__dirname+'/groupe.html');
            }
        });
    }else{
        res.sendFile(__dirname+'/groupe.html');
    }
    io.on('connection',(socket) => {
        socket.emit('sessionPseudo',req.session.pseudo);
        socket.emit('listGroupeInformation', groupeList);
        setInterval(() => {
            socket.emit('listGroupeInformation', groupeList);
        },1000)
    });
})



//Login get
app.get('/login',(req, res) => {
    req.session.pseudo = undefined;
    req.session.mdp = undefined;
    res.sendFile(__dirname+'/login.html');
})



//Index get
app.get('/', (req, res) => {
    if(url.parse(req.url, true).query['groupe'] != undefined){
        if(req.session.authenticated){
            const pseudo = req.session.pseudo;
            let grp = url.parse(req.url, true).query['groupe'];
            bdd.query('SELECT * FROM groupes WHERE idGroupe=?', [grp], (err, result) => {
                if (err) throw err;
                if(result.length == 0){
                 res.redirect('/Groupe');
                }else{
                    res.sendFile(__dirname+'/index.html');
                }
            })
            io.once('connection', (socket) => {
                if(userList[grp] == undefined){
                    let sck = socket.id
                    userList[grp] = {};
                    userList[grp][sck] = pseudo;
                    delete sck;
                }else{
                    userList[grp][socket.id] = pseudo;
                }
                socket.join('groupe: '+grp);
                io.to('groupe: '+grp).emit('userInteraction',userList[grp]);
                bdd.query("SELECT * FROM messages WHERE idGroupe=?", [grp], function (err, result) {
                    if (err) throw err;
                    socket.emit('last messages',result);
                });
                socket.on('disconnect', () => {
                    delete userList[grp][socket.id];
                    io.to('groupe: '+grp).emit('userInteraction',userList[grp]);
                })
                socket.on('chat message', (msg) => {
                    if(msg != ""){
                        bdd.query("INSERT INTO messages(message, idGroupe, pseudoUser) VALUES (?, ?, ?)", [msg, grp, userList[grp][socket.id]], function (err, result) {
                            if (err) throw err;
                            socket.emit('last messages',result);
                        });
                    }
                    console.log('message reçus:'+msg);
                    io.to('groupe: '+grp).emit('chat message', userList[grp][socket.id]+" : "+msg);
                })
                socket.on('focusUser', (sck) => {
                    io.to('groupe: '+grp).emit('sFocusUser',sck);
                })
                socket.on('blurUser', (sck) => {
                    io.to('groupe: '+grp).emit('sBlurUser',sck);
                })
            })
        }else{
            req.session.destroy();
            res.redirect('/login');
        }
    }else{
        res.redirect('/Groupe');
    }
})

app.post('/CreateGroupe', (req, res) => {
    bdd.query('SELECT * FROM groupes WHERE nom=?', [req.body.nomGroupe], (err, result) => {
        if (err) throw err;
        if(result.length==0){
            bdd.query('INSERT INTO groupes(nom) VALUES (?)', [req.body.nomGroupe], (err2) => {
                if (err2) throw err2;
            })
            bdd.query('SELECT idGroupe FROM groupes WHERE nom=?', [req.body.nomGroupe], (err2, result2) => {
                if (err2) throw err2;
                res.redirect('/?groupe='+result2[0]['idGroupe']);
            })
        }else{
            //res.redirect('/Groupe');
        }
    })
})

io.on('connection', (socket) => {
    
});

//server port
http.listen(3000, () => {
    console.log('listening on :3000');
});