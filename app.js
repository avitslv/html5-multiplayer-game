/*
 *  Require external node.js modules
 */
var express = require('express'), 
	http = require('http'), 
	Buffer = require('buffer').Buffer;

/*
 *  Random name generator library
 */
var Moniker = require('moniker');

/*
 *  Define express framework settings
 */
var app = express();
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 *  Serve views/index.ejs when requesting domain
 */
app.get('/', function(req, res){
    res.render('index');
});

/*
 *  Start Webserver
 */
var server = http.createServer(app).listen(3000);
console.log("Izveidots http serveris, listening on port 3000");

/*
 *  Start Socket.io
 */
var io = require('socket.io').listen(server);


/*
 *  Include jQuery Extend
 *  Include Box2D library
 */
var Box2D = require('./public/javascripts/box2d.js');

/*
 *  Declare all the commonly used objects as variables for convenience
 */
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

var game = {
  // Start initializing objects, preloading assets and display start screen
  init: function(){
    levels.load(0);
    
    game.timeStep = 1/60;
    game.activeAnimation = false;

    game.status = "intro";

    //  DEBUG VARIABLES
    game.sentStuff = false;

    //  ALLOWED USERS
    game.totalUsers = 2;
  },

  checkCollision: function(posX,posY){
    var mousePositionVec = new b2Vec2(posX,posY);

    function clickedOn(fixture) {
      var b = fixture.GetBody();
      var entity = b.GetUserData();
      if(entity.name == 'ice'){
        box2d.world.DestroyBody(b);
      }
      return true;
    }

    box2d.world.QueryPoint(clickedOn, mousePositionVec);

  },

  checkSuccess: function(){
    var levelComplete = true;
    for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
      var entity = body.GetUserData();
      if(entity){
        if(entity.name == 'ice'){
          levelComplete = false;

        }
      }
    }

    if(levelComplete){
      game.nextLevel();
    }

  },

  nextLevel: function(){

    if(game.currentLevel < levels.data.length-1){
      levels.load(game.currentLevel + 1);
      io.sockets.in('istaba').emit('levelInfo', {currentLevel:game.currentLevel,totalLevels:levels.data.length});
    }else{
      io.sockets.in('istaba').emit('levelInfo', {currentLevel:(game.currentLevel+1),totalLevels:levels.data.length});
      game.status = "intro";
      processUsers.kickEverybody();
      game.activeAnimation = false;
      levels.load(0);
    }
    
    
  },

  restartLevel: function(){
    //console.log("restart lvl");
    io.sockets.in('istaba').emit('levelInfo', {currentLevel:game.currentLevel,totalLevels:levels.data.length});
    levels.load(game.currentLevel);
  },

  prepareGameData: function(){
    var dataToSend = Array();

    for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
      var entity = body.GetUserData();
      if(entity){
        if(entity.type == "block"){

          var bodyPosition = body.GetPosition();
          var elX = bodyPosition.x*30;
          var elY = bodyPosition.y*30;
          var elAngle = body.GetAngle();
          var elName = entity.name;
          var elType = entity.type;

          var elementInfo = {
            x: elX,
            y: elY,
            angle: elAngle,
            name: elName,
            type: elType,
          };

          dataToSend.push(elementInfo);

        }
          
      }
    }

    return dataToSend;
  }

}

var levels = {
  // Level data
  data:[
    {
      background:'bg',
      entities:[
        {type:"ground", name:"ground", x:320,y:408,width:640,height:25,isStatic:true},//Ground
        {type:"ground", name:"ground", x:12,y:210,width:25,height:600,isStatic:true},// Left side
        {type:"ground", name:"ground", x:628,y:210,width:25,height:600,isStatic:true},// Right side

        {type:"block", name:"ice", x:240,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:240,y:334,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:240,y:294,angle:0,width:40,height:40},

        {type:"block", name:"ice", x:400,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:400,y:334,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:400,y:294,angle:0,width:40,height:40},

        {type:"block", name:"platform", x:320,y:261,angle:0,width:240,height:25},

        {type:"block", name:"tnt", x:320,y:218,angle:0,width:60,height:60},

      ]
    },
    {
      background:'bg',
      entities:[
        {type:"ground", name:"ground", x:320,y:408,width:640,height:25,isStatic:true},//Ground
        {type:"ground", name:"ground", x:12,y:210,width:25,height:600,isStatic:true},// Left side
        {type:"ground", name:"ground", x:628,y:210,width:25,height:600,isStatic:true},// Right side

        {type:"block", name:"ice", x:200,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:240,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:220,y:334,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:235,y:294,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:250,y:254,angle:0,width:40,height:40},

        {type:"block", name:"ice", x:440,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:400,y:374,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:420,y:334,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:405,y:294,angle:0,width:40,height:40},
        {type:"block", name:"ice", x:390,y:254,angle:0,width:40,height:40},

        {type:"block", name:"platform", x:320,y:221,angle:0,width:240,height:25},

        {type:"block", name:"tnt", x:320,y:178,angle:0,width:60,height:60},

      ]
    },


  ],

  load:function(number){
    console.log("levels.load");
    box2d.init();
    game.currentLevel = number;

    var level = levels.data[number];

    // Load all the entities
    for (var i = level.entities.length - 1; i >= 0; i--){ 
      var entity = level.entities[i];
      entities.create(entity);      
    };

  },

}

var entities = {
  definitions:{
    "tnt":{
      density:0.2,
      friction:0.1,
      restitution:0.4,
    },
    "ice":{
      density:0.3,
      friction:0.4,
      restitution:0.4,
    },
    "platform":{
      density:0.2,
      friction:0.4,
      restitution:0.4,
    },
    "ground":{
      density:0.7,
      friction:0.4,
      restitution:0.4,
    },


  },

  create:function(entity){
    var definition = entities.definitions[entity.name]; 
    switch(entity.type){
      case 'ground':
        entity.shape = "rectangle";
        box2d.createRectangle(entity,definition); 
        break;
      case 'block':
      case 'tnt':
        entity.shape = "rectangle";
        box2d.createRectangle(entity,definition);       
        break;
      default:
    }

  },


}

var box2d = {
  scale:30,
  init:function(){
    console.log("box2d.init");
    var gravity = new b2Vec2(0,9.8); //declare gravity as 9.8 m/s^2 downwards
    var allowSleep = true; //Allow objects that are at rest to fall asleep and be excluded from calculations
    box2d.world = new b2World(gravity,allowSleep);

    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.PostSolve = function(contact,impulse){
      var body1 = contact.GetFixtureA().GetBody();
      var body2 = contact.GetFixtureB().GetBody();
      var entity1 = body1.GetUserData();
      var entity2 = body2.GetUserData();

      //console.log("test");
      if(entity1.name == "tnt" && entity2.name != "platform"){
        game.restartLevel();
      }
    }
    box2d.world.SetContactListener(listener);

  },

  step:function(timeStep){
    // velocity iterations = 8
    // position iterations = 3
    
    box2d.world.Step(timeStep,8,3);
  },

  createRectangle:function(entity,definition){
      var bodyDef = new b2BodyDef;
      if(entity.isStatic){
        bodyDef.type = b2Body.b2_staticBody;
      } else {
        bodyDef.type = b2Body.b2_dynamicBody;
      }
      
      bodyDef.position.x = entity.x/box2d.scale;
      bodyDef.position.y = entity.y/box2d.scale;
      if (entity.angle) {
        bodyDef.angle = Math.PI*entity.angle/180;
      }
      
      var fixtureDef = new b2FixtureDef;
      fixtureDef.density = definition.density;
      fixtureDef.friction = definition.friction;
      fixtureDef.restitution = definition.restitution;

      fixtureDef.shape = new b2PolygonShape;
      fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale,entity.height/2/box2d.scale);
      
      var body = box2d.world.CreateBody(bodyDef); 
      body.SetUserData(entity);
      
      var fixture = body.CreateFixture(fixtureDef);
      return body;
  },

}

var animateGame = setInterval(function(){

  if(game.activeAnimation){
      
    box2d.step(1/30);

    game.checkSuccess();
    //  Send update to users
    var dataToSend = game.prepareGameData();
    io.sockets.in('istaba').emit('gameData', dataToSend);
  }

},1.0/60.0*1000);


var processUsers = {

  addUser: function(){
    var user = {
      name: Moniker.choose(),
      joined: false,
    }
    users.push(user);

    return user;
  },

  removeUser: function(user){
    for(var i=0; i<users.length; i++) {
      if(user.name === users[i].name) {
        users.splice(i, 1);
        return;
      }
    }
  },

  getJoinedCount: function(){
    var joinedCount = 0;
    for(var i=0; i<users.length; i++) {
      if(users[i].joined){
        joinedCount++;
      }
    }
    return joinedCount;
  },

  getPlayingCount: function(){
    var playingCount = 0;
    for(var i=0; i<users.length; i++) {
      if(users[i].playing){
        playingCount++;
      }
    }
    return playingCount;
  },

  sendJoinedCount: function(){
    io.sockets.emit("playingATM", { joinedNow: processUsers.getJoinedCount(), total: game.totalUsers});
    console.log(processUsers.getJoinedCount());
  },

  kickEverybody: function(){
    
    for(var i=0; i<users.length; i++) {
      users[i].playing = false;
      users[i].joined = false;
    }
    io.sockets.emit("playingATM", { joinedNow: processUsers.getJoinedCount(), total: game.totalUsers});
  },

}

/*
 *  Socket.io
 */
//  Reduce logging
io.set('log level', 1); // reduce logging

//
var users = [];

io.sockets.on('connection', function (socket) {
  //  Send joined player count on connection
  socket.emit("playingATM", { joinedNow: processUsers.getJoinedCount(), total: game.totalUsers});

  //  Define user
  var user = processUsers.addUser();

  socket.on('disconnect', function () {
    if(user.playing){
      game.status = "intro";
      game.activeAnimation = false;
      io.sockets.in('istaba').emit('playerDisconnected', true);
      processUsers.sendJoinedCount();
      levels.load(0);
    }
    processUsers.removeUser(user);
    processUsers.sendJoinedCount();
  });

  //  LOBBY - Listen to JOIN button
  socket.on("join", function(data) {
    console.log("Join - " + data);
    if(processUsers.getJoinedCount() < game.totalUsers && !user.joined){
      socket.join('istaba');
      user.joined = true;
    }
    processUsers.sendJoinedCount();
    //  Send info only to already joined folks
    if(processUsers.getJoinedCount() == game.totalUsers){
      io.sockets.in('istaba').emit('readyToPlay', true);
    }
  });

  //  LOBBY - Listen to PLAY button
  socket.on("play", function(data) {
    console.log("Play - " + data);
    if(processUsers.getJoinedCount() == game.totalUsers && game.status == "intro"){
      user.playing = true;
    }

    console.log("Playing skaits = " + processUsers.getPlayingCount());

    if(processUsers.getPlayingCount() == game.totalUsers && game.status == "intro"){
      console.log("spele sakas");
      game.activeAnimation = true;
      io.sockets.in('istaba').emit('gameOn', true);
      game.status = "game-on";
      io.sockets.in('istaba').emit('levelInfo', {currentLevel:game.currentLevel,totalLevels:levels.data.length});
    }

  });



  //  GAME - listen to user clicks in canvas
  socket.on("click", function(data) {
    //console.log(data);
    game.checkCollision(data.x,data.y);
  });

  

});

//  Start game..
game.init();






