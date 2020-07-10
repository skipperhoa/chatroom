const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const md5 = require('md5');
const sqlite3 = require('sqlite3').verbose();
// Setup the database connection
let conn = new sqlite3.Database("./data.db", err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the in-memory SQLite database.");
  });
// Read the SQL file
const session = require('express-session');
var moment = require('moment');
const { count } = require('console');
const { emit, cwd } = require('process');
const httpPort = 8000;
const httpsPort = 8001;
var app = express()
app.set('view engine', 'ejs');
app.set("views", "./views");
app.use(express.static('public'))
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'skipperhoa',
    cookie: {maxAge: 900000}
}));

/**connect mysql**/
/*var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatgroup"
});
conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected database!!!")
});*/

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var jsonParser = bodyParser.json();
/* Init config */
var arrayColors =['#C0392B','#7DCEA0','#138D75','#F1C40F','#7D3C98','#A04000','#186A3B','#E371C4','#08E3CF','#AEE308'];
var dataResults = [];
/*luu session */
/**set router */
/*GET*/
getLoadMoreCommnet = function(start,limit){
    conn.query("select comments.bodyCmt,comments.dateCmt,users.Email,users.FullName from users, comments where users.idUser=comments.idUser  order by idCmt desc limit "+start+","+limit+"", function (error, results, fields) {
        if (error) {
            console.log("Error mysql")
        } else {
            console.log(results)
            dataResults.push(results);
        }
    });
}

app.get('/', (req, res) => {
    if (!req.session.User) {
        return res.redirect("/dang-nhap");
    }
    var dataUser = req.session.User;
    //console.log(dataSession)
    var sql = "select comments.bodyCmt,comments.dateCmt,users.Email,users.FullName,users.Color from users, comments where users.idUser=comments.idUser order by idCmt desc limit 0,5";
    conn.all(sql, function (error, results) {
        if (error) {
            throw error;
        } else {
              /* set number For  nếu = 0 thì thêm vô chỉ 1 lần */
           // if(numberFor<1){
               // dataResults.push(results[0]);
               // numberFor++;
           // }
         
          // if(!connect){
            updateState(1,dataUser.Timestamp,dataUser.idUser);
          // }
            var  paginations =""
            if(results.length>0){
                paginations = "<li id='afterComment'><button  id='LoadMore' style='width:100px;margin:0 auto;display:block;' data-page='2' data-limit='5'>Load more</button></li>";
          
            }
            results = results.reverse();
            return res.render('index', { dataUser, results, moment,paginations});
        }
    });
});

app.get('/dang-nhap', (req, res) => {
    if (req.session.User) {
        return res.redirect('/');
    }
    res.render('login', { dataUser: false })
});

/* đăng nhập */
app.post('/dang-nhap', urlencodedParser, function (req, res) {
    var email = req.body.email;
    var pass = md5(req.body.password);
    var sql = "select idUser,FullName,Color,count(*) as Total from users where Email='" + email + "' and Password='" + pass + "'";
    conn.all(sql, function (error, results) {
        if (error) {
            res.redirect('/dang-nhap');
        } else {
            if (results[0].Total > 0) {

                /*set session user*/
                var fullname = results[0].FullName;
                var arrayName = fullname.split(" ");
                var KyTuName = arrayName[arrayName.length - 1].substring(0, 1);
                var Timestamp = Date.now().toString();
                req.session.User = {
                    website: 'hoanguyenit.com',
                    fullname: fullname,
                    userEmail: email,
                    idUser: results[0].idUser,
                    KyTuName: KyTuName,
                    Timestamp:Timestamp,
                    State:1,
                    Color: results[0].Color
                }
                updateState(1,Timestamp,results[0].idUser);
                return res.redirect("/");
            }
            res.redirect('/dang-nhap');
        }

    });
});

/*Update trạng thái và thời gian online*/
updateState = function(State,Timestamp,idUser){
     conn.all("Update users Set `State`='"+State+"',`Timestamp`='"+Timestamp+"' Where idUser='"+idUser+"'",function(err,res,fields){
        if(err) throw err
        console.log("update state='"+State+"',Timestamp:"+Timestamp) 
     });
}

/*đăng ký*/
app.get('/dang-ky', (req, res) => {
    if (req.session.User) {
        return res.redirect('/');
    }
    res.render('register', { dataUser: false })
});
app.post('/dang-ky', urlencodedParser, function (req, res) {
    var email = req.body.email;
    var pass = md5(req.body.password);
    var fullname = req.body.fullname;
    var NumberColor = Math.floor(Math.random() * Math.floor(arrayColors.length));
    var Color = arrayColors[NumberColor];
    var sql = "INSERT INTO users(FullName,Email,Password,Avatar,Lever,Color) values('" + fullname + "','" + email + "','" + pass + "','',1,'"+Color+"')";
    conn.all(sql, function (error) {
        if (error) {
            res.redirect('/dang-ky');
        } else {

            res.redirect('/dang-nhap');
        }

    });
});

/* đăng xuất */
app.get('/dang-xuat', (req, res) => {
    var Timestamp = Date.now().toString();
    var dataOut = req.session.User;
    updateState(0,Timestamp,dataOut.idUser);
    req.session.destroy(function (err) {
        return res.redirect('/dang-nhap');
    })
});

/**set server */
var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app);
var io = require('socket.io')(httpServer);
var ArraySocketID = []
var connect = false;
io.on('connection', (socket) => {
    //var req = socket.request;
    //console.log(req)
    connect = true;
    console.log("socket mới:"+socket.id)
    var page = 1;
    var start = 0;
    var limit = 5;

    socket.on("checkUserOnline",function(msg){
        var str = "<li data-id='"+msg.idUser+"'><i class='online"+msg.State+"' data-state='"+msg.State+"'>"+msg.KyTuName+"</i><span>"+msg.fullname+"<label>(Đang online)"+"</label></span></li>";
        var _check = {
            "str" : str,
            "data":msg
        }
        socket.broadcast.emit("checkUserOnline",_check)
    });
    socket.on("listUser",function(msg){
        ArraySocketID.push({
            "SocketID":socket.id,
            "data":msg
        })
        conn.all("select * from users where idUser not in('"+msg.idUser+"')", function (error, results, fields) {
            if (error) {
                console.log("Thêm không thành công");
            }
            else {
                
                var str="";
                results.forEach(function(rows){
                    FullName = rows.FullName.split(" ");
                    KyTuName = FullName[FullName.length-1].substring(0,1);
                    var _state = "Đang online";
                    if(rows.State==0){
                        _state = getTimeOnline(rows.Timestamp);
                    }
                    str += "<li data-id='"+rows.idUser+"'><i class='online"+rows.State+"' data-state='"+rows.State+"'>"+KyTuName+"</i><span>"+rows.FullName+"<label>("+_state+")"+"</label></span></li>";
                   
                });
                var data = {
                    "str":str,
                    "idUser":msg.idUser,
                    "State":msg.State,
                    "socketId":socket.id
                }
              
               io.to(socket.id).emit('listUser', data);
               
            }
        });
    });
    socket.on('chatgroup', (msg) => {
        
        let date_ob = new Date();
    
        // adjust 0 before single digit date
        let date = ("0" + date_ob.getDate()).slice(-2);
    
        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    
        // current year
        let year = date_ob.getFullYear();
    
        // current hours
        let hours = date_ob.getHours();
    
        // current minutes
        let minutes = date_ob.getMinutes();
    
        // current seconds
        let seconds = date_ob.getSeconds();
        var dateCmt = year + "-" + month + "-" + date + " " + hours + ":" + minutes;
        var dataCmt = {
            "email": msg.data.userEmail,
            "fullname": msg.data.fullname,
            "bodyCmt": msg.bodyCmt,
            "idUser": msg.data.idUser,
            "dateCmt": dateCmt,
            "KyTuName": msg.data.KyTuName,
            "Color":msg.data.Color
        };
      // console.log(dataCmt)
        var sql = "insert into comments(bodyCmt,dateCmt,idUser) values('" + msg.bodyCmt + "','" + dateCmt + "'," + msg.data.idUser + ")";
      //  console.log(sql)
        conn.all(sql, function (error, results, fields) {
            if (error) {
                console.log("Thêm không thành công");
            }
            else {
                io.emit('chatgroup', dataCmt);
    
            }
    
        });
    
    });
    socket.on("SearchChat",function(msg){
        console.log(msg)
        var sql = "select comments.bodyCmt,comments.dateCmt,users.Email,users.FullName,users.Color from users, comments where users.idUser=comments.idUser And bodyCmt like '%"+msg.TextSearch+"%' order by idCmt desc";
        conn.all(sql,function(error,results,fields){
            if(error) throw error;
            dataSearch = {
                "TextSearch":msg.TextSearch,
                "dataResults":results.reverse()
            }
            console.log(results)
            io.to(msg.socketId).emit("SearchChat",dataSearch);
           
        });
      
    });
    socket.on("LoadMore",function(msg){
        if(msg.page>0){
            page = msg.page; 
        }
        else{
            page = 1;
        }
        start = (page-1)* msg.limit;
        limit = msg.limit;
        var sql = "select comments.bodyCmt,comments.dateCmt,users.Email,users.FullName,users.Color from users, comments where users.idUser=comments.idUser order by dateCmt desc limit "+start+","+limit;
       // console.log(sql)
        //  getLoadMoreCommnet(start,limit);
        conn.all(sql,function (error, results, fields) {
            if (error) {
                throw error;
            } else {
               
                dataResults.push(results.reverse());
                var dataPaginations = {
                    "start":start,
                    "page":page,
                    "limit":limit,
                    "dataResults":dataResults
                }
                
                dataResults=[]
                io.to(msg.socketId).emit('dataPaginations', dataPaginations);
            }
        });
       
    });
    socket.on('disconnect', function(msg) {
        var socketID_old = socket.id; 
        console.log("socket cu:"+socket.id) 
        connect=false;
        setTimeout(function(){
            if(!connect){
                ArraySocketID.filter(function(value){
                    if(value.SocketID==socketID_old){
                         console.log("đã đóng xong")
                        var Timestamp = Date.now().toString();
                        _time = getTimeOnline(Timestamp);
                        updateState(0,Timestamp,value.data.idUser);
                        socket.broadcast.emit("UseClose",{idUser:value.data.idUser,State:0,_time:_time})
                        connect=true;
                        ArraySocketID = ArraySocketID.filter(function(item){
                            return item.SocketID!=socketID_old
                        });
                    }
                }) 
            }else{
                console.log("đã xóa socket củ:"+socketID_old)
                ArraySocketID = ArraySocketID.filter(function(value){
                    return value.SocketID!=socketID_old
                });
                console.log(ArraySocketID)
            }
        },1000);
    });

});
getTimeOnline = function (_timestamp) {
    var _state = "";
    var _dateNow = Date.now();
    seconds = Math.floor((_dateNow - (_timestamp)) / 1000);
    minutes = Math.floor(seconds / 60);
    hours = Math.floor(minutes / 60);
    days = Math.floor(hours / 24);
    hours = hours - (days * 24);
    minutes = minutes - (days * 24 * 60) - (hours * 60);
    seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
    if (days > 0) {
        _state = "Hoạt động " + days + " ngày trước ";
    } else {
        if (hours > 0) {
            _state = "Hoạt động " + hours + " giờ ";
            if (minutes > 0) {
                _state += minutes + " phút";
            }
        } else if (minutes > 0) {
            _state = "Hoạt động " + minutes + " phút" + seconds + " giây trước ";
        } else {
            _state = "Hoạt động " + seconds + " giây ";
        }
    }
    return _state;
}
httpServer.listen(process.env.PORT || httpPort, () => {
    console.log("Http server listing on port : " + httpPort)
});

/*
httpsServer.listen(httpsPort, () => {
  console.log("Https server listing on port : " + httpsPort)
});*/
;

