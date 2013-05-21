$(window).load(function() {
	config.init();
	game.init();
});

var entity_ice;
var entity_platform;
var entity_tnt;

var mouseClick = false;

var scale = 30;

var config = {
	init: function(){

		config.canvas = document.getElementById('gameCanvas');
		config.onResizeCalled();
		window.addEventListener("resize", config.onResizeCalled, false);

		
	},

	onResizeCalled: function(){
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;

		var scaleToFitX = windowWidth / 640;
		var scaleToFitY = windowHeight / 420;

		var currentScreenRatio = windowWidth / windowHeight;

		config.optimalRatio = Math.min(scaleToFitX, scaleToFitY);

		if(config.optimalRatio >= 1){
			config.optimalRatio = 1;
		}

		config.canvas.style.width = 640 * config.optimalRatio + "px";
		config.canvas.style.height = 420 * config.optimalRatio + "px";

		config.resizeButtons();	
	},

	resizeButtons: function(){

		var buttonWidth = 240 * config.optimalRatio;
		var buttonHeight = 55 * config.optimalRatio;

		var buttonTop = 200 * config.optimalRatio;
		var buttonLeft = 200 * config.optimalRatio;

		var buttonFontSize = 30 * config.optimalRatio;

		$('.button').css("width", buttonWidth+"px");
		$('.button').css("height", buttonHeight+"px");

		$('.button').css("top", buttonTop+"px");
		$('.button').css("left", buttonLeft+"px");

		$('.button').css("font-size", buttonFontSize+"px");

		$('.button').each(function(index) {
			if($(this).hasClass('not-centered')){
				var buttonTop = $(this).attr("title") * config.optimalRatio;
				$(this).css("top",buttonTop)
			}
		});

		//	Resize/reposition Joined DIV and adjust fonts
		$('div.joined').css("top", (172*config.optimalRatio)+"px").css("font-size",(30*config.optimalRatio)+"px");

		//	Resize/reposition GAME INFO - levels
		$('div.game-info').css("top", (40*config.optimalRatio)+"px").css("left", (40*config.optimalRatio)+"px").css("font-size",(22*config.optimalRatio)+"px");

	}

}

var game = {

	init: function(){
		mouse.init();
		entityTypes.load();

		console.log("hello");

		game.canvas = document.getElementById('gameCanvas');
		game.context = game.canvas.getContext('2d');

		game.backgroundImage = loader.loadImage("images/bg.png");

		game.status = "welcome-screen";

		game.listenToClicks();

	},

	listenToClicks: function(){
		console.log('listen to button clicks');

		$('input.button.welcome-screen').click(function(){
			$('.welcome-screen').hide();
			$('.instructions').show();
		});

		$('input.button.instructions').click(function(){
			$('.instructions').hide();
			$('.lobby').show();
		});

		$('input.button.join').click(function(){
			if(!$(this).hasClass('locked')){
				$(this).val("Spēlēt");
				$(this).addClass("locked");
				socket.emit("join",true);
			}
			
		});

		$('input.button.play').click(function(){
			$(this).val("Gaida draugu");
			socket.emit("play",true);
		});

		$('input.button.winner').click(function(){
			$(this).val("Gaida draugu");
			socket.emit("play",true);
			$('.winner').hide();
			$('.welcome-screen').show();
		});

	},

	updateLobby: function(playingATM){
		console.log(playingATM);
		$('.lobby .joined .now').html(playingATM.joinedNow);
		$('.lobby .joined .limit').html(playingATM.total);
		if(playingATM.joinedNow == playingATM.total){
			$('.joined').removeClass("not-enough");
			$('.joined').addClass("enough");
			$('input.button.join').addClass("locked");
		}else{
			$('.joined').removeClass("enough");
			$('.joined').addClass("not-enough");
			$('input.button.join').removeClass("locked");
		}
	},

	readyToPlay: function(){
		console.log("ready to play!!");
		$('input.button.join').hide();
		$('input.button.play').show();
	},

	gameOn: function(){
		//	Reset lobby buttons
		$('input.button.join').removeClass('locked').val("Pievienoties").show();
		$('input.button.play').val("Spēlēt").hide();

		$('.lobby').hide();
		$('.game').show();
	},

	playerDisconnected: function(){
		$('.game').hide();
		$('.lobby').show();
	},

	processLevelData: function(data){
		console.log(data);
		if(data.currentLevel == data.totalLevels){
			$('.game').hide();
			$('.winner').show();
			$('.game-info .numbers').html("");
		}else{
			$('.game-info .numbers').html(data.currentLevel + "  /  " + data.totalLevels);
		}
		
	}

}

var loader = {
	loaded:true,
	loadedCount:0, // Assets that have been loaded so far
	totalCount:0, // Total number of assets that need to be loaded
	
	loadImage:function(url){
		this.totalCount++;
		this.loaded = false;
		$('#loadingscreen').show();
		var image = new Image();
		image.src = url;
		image.onload = loader.itemLoaded;
		return image;
	},
	//..
	itemLoaded:function(){
		loader.loadedCount++;
		$('#loadingmessage').html('Loaded '+loader.loadedCount+' of '+loader.totalCount);
		if (loader.loadedCount === loader.totalCount){
			loader.loaded = true;
			$('#loadingscreen').hide();
			if(loader.onload){
				loader.onload();
				loader.onload = undefined;
			}
		}
	}
}

var processGameData = {

	process: function(data){

		processGameData.drawBg();

		for(var i=0;i<data.length;i++){
			var entity = data[i];
			processGameData.draw(entity);
		}
	},

	drawBg: function(){
		game.context.drawImage(game.backgroundImage,0,0);
	},

	draw: function(entity){

		game.context.translate(entity.x,entity.y);
		game.context.rotate(entity.angle);
		switch (entity.name){
			case "ice":
				game.context.drawImage(entity_ice.sprite,0,0,entity_ice.width,entity_ice.height,-entity_ice.width/2-1,-entity_ice.height/2-1,entity_ice.width+2,entity_ice.height+2);
				break;
			case "tnt":
				game.context.drawImage(entity_tnt.sprite,0,0,entity_tnt.width,entity_tnt.height,-entity_tnt.width/2-1,-entity_tnt.height/2-1,entity_tnt.width+2,entity_tnt.height+2);
				break;
			case "platform":
				game.context.drawImage(entity_platform.sprite,0,0,entity_platform.width,entity_platform.height,-entity_platform.width/2-1,-entity_platform.height/2-1,entity_platform.width+2,entity_platform.height+2);
				break;
				
			default:
		
		}

		game.context.rotate(-entity.angle);
		game.context.translate(-entity.x,-entity.y);

	}
	
}

var entityTypes = {

	load: function(){
		var entity_ice_sprite = loader.loadImage("images/ice.png");
		var entity_platform_sprite = loader.loadImage("images/platform.png");
		var entity_tnt_sprite = loader.loadImage("images/tnt.png");
		entity_ice = {
			width: 40,
			height: 40,
			sprite: entity_ice_sprite,
		}
		entity_platform = {
			width: 240,
			height: 25,
			sprite: entity_platform_sprite,
		}
		entity_tnt = {
			width: 60,
			height: 60,
			sprite: entity_tnt_sprite,
		}

	}

}

var mouse = {
	x:0,
	y:0,
	down:false,
	init:function(){
		$('#gameCanvas').mousemove(mouse.mousemovehandler);
		$('#gameCanvas').mousedown(mouse.mousedownhandler);
		$('#gameCanvas').mouseup(mouse.mouseuphandler);
		$('#gameCanvas').mouseout(mouse.mouseuphandler);
	},
	mousemovehandler:function(ev){
		var offset = $('#gameCanvas').offset();
		
		mouse.x = ev.pageX - offset.left;
		mouse.y = ev.pageY - offset.top;
		
		if (mouse.down) {
			mouse.dragging = true;
		}
	},
	mousedownhandler:function(ev){
		mouse.down = true;
		mouse.downX = mouse.x;
		mouse.downY = mouse.y;
		ev.originalEvent.preventDefault();
		console.log("Mouse: x = " + mouse.downX + ", y = " + mouse.downY);
		mousePosX = mouse.downX/scale/config.optimalRatio;
		mousePosY = mouse.downY/scale/config.optimalRatio;
		socket.emit("click",{x:mousePosX,y:mousePosY});
		//game.checkCollision(mouse.downX,mouse.downY);
		
	},
	mouseuphandler:function(ev){
		mouse.down = false;
		mouse.dragging = false;
	}
}

/*
 *	Initialize Socket.io
 */
var socket = io.connect("http://localhost:3000");

socket.on("gameData", function (data) {
  //console.log(data);
  processGameData.process(data);

});

socket.on("playingATM", function (data) {
  console.log("playing atm = " + data);
  game.updateLobby(data);

});

socket.on("readyToPlay", function (data) {
	game.readyToPlay();
});

socket.on("gameOn", function (data) {
	game.gameOn();
});

socket.on("playerDisconnected", function (data) {
	game.playerDisconnected();
});

socket.on("levelInfo", function (data) {
	game.processLevelData(data);
});

/*
 *	
 */
