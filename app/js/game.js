/**
 * Black Jack
 * Copyright © 2015 Sam Grundman
 *
 * This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License
 * http://creativecommons.org/licenses/by-nc-sa/4.0/
 */
window.onReady(function() {
game = Z.extend(game, {
	v:'0.1.0-beta+20150808',
	load: function() {
		if (window.localStorage.game) {
			var savedGame = JSON.parse(window.localStorage.game)
			// Merge Data
			game = Z.extend(
				true, // Merge Recursively
				game, // Game object
				savedGame, // Saved Data
				{
					// Necessary Updated Game Data
					v:game.v
				}
			)
			if (!game.animals) game.animals = { rabbits: 0 }
			// Update Save File
			if (!game.animals.rabbits) game.animals.rabbits = 0
			game.save()
			$(document).trigger('gameLoaded')
		}
	},
	save: function() {
		// Copy Game Data
		var g = Z.extend(true, {}, game)
		// Delete unchanged data
		Z.each(g, function(i) {
			if (Z.inArray(i, [
				'achievements',
				'v',
			]) > -1) return 1
			delete g[i]
		})
		// Save
		window.localStorage.game = JSON.stringify(g)
	}
})

// Close the Game Menu
game.closeMenu = function(e,t) {
	if (Z('body > nav').css('display') != 'block') return
	t=t?t:400
	Z('body > nav').css({
		left:0
	}).animate({
		left:'-' + Z('body > nav').width() + 'px'
	}, t, function() {
		Z('body > nav').hide()
	})
	var l = Z('#main').css('left')
	Z('#main, main > header').css({
		left:(l && l != 'auto' ? l : '0px')
	}).animate({
		left:0
	}, t)
}
// Open the Game Menu
game.openMenu = function(e) {
	if (Z('body > nav').css('display') != 'block') {
		var t=400
		game.hideModals()
		Z('body > nav').show().css({
			left: '-' + Z('body > nav').width() + 'px'
		}).animate({
			left:'0px'
		}, t)
		var l = Z('#main').css('left')
		Z('#main, main > header').css({
			left:(l && l != 'auto' ? l : '0px')
		}).animate({
			left:Z('body > nav').width() + 'px'
		}, t)
	} else game.closeMenu()
	return false
}

// Show Modal Background Screen
game.showModalBG = function(t) {
	t = t?t:400
	Z('main').css({
		'-webkit-filter':'blur(0)',
		filter:'blur(0)'
	}).animate({
		'-webkit-filter':'blur(2px)',
		filter:'blur(2px)'
	}, t*2)
	Z('#modal-bg').show().css({
		opacity:0
	}).animate({
		opacity:0.4
	}, t)
}
// Hide Modal Background Screen
game.hideModalBG = function(t,cb) {
	if (Z('#modal-bg').css('display') != 'block') {
		if (Z.isFunction(cb)) cb()
		return
	}
	t = t?t:400
	Z('main').css({
		'-webkit-filter':'blur(2px)',
		filter:'blur(2px)'
	}).animate({
		'-webkit-filter':'blur(0)',
		filter:'blur(0)'
	}, t*2)
	Z('#modal-bg').css({
		opacity:0.4
	}).animate({
		opacity:0
	}, t, function() {
		Z(this).hide()
		if (Z.isFunction(cb)) cb()
	})
}

// Open About Screen
game.openAbout = function(e) {
	var t = 400
	game.showModalBG(t)
	game.closeMenu(e,t/2)
	Z('#about').show()
	setTimeout(function(){
		Z('#about').trigger('reveal').addClass('revealed')
	}, 1)
}
// Close About Screen
game.closeAbout = function(e) {
	var t = 200
	game.hideModalBG(t)
	Z('#about').removeClass('revealed')
	setTimeout(function(){
		Z('#about').trigger('hide').hide()
	}, t + 1)
}

// Hide Modals
game.hideModals = function(e) {
	if (Z('#about').css('display') == 'block')
		game.closeAbout(e)
}
game.closeAll = function(e) {
	game.closeMenu()
	game.hideModals()
	return false
}

var evtClick = 'tap click'
// Register Correct Tap on Android Devices
if (platform.indexOf('Android') != -1 && device.version) (function(v){
	v = Number.parseFloat(v)
	if (isFinite(v)) evtClick = (v >= 4.4) ? 'tap longTap' : 'singleTap'
})(device.version);

// User Interaction Events
Z(document).on(evtClick, 'body > nav a[href="#main"]', game.closeMenu)
Z(document).on(evtClick, '#about a[href="#main"]', game.closeAbout)
Z(document).on(evtClick, 'a[href="#about"]', game.openAbout)
Z(document).on(evtClick, 'a[href="#menu"]', game.openMenu)
Z(document).on(evtClick, '#modal-bg', game.hideModals)

// Pause/Resume Game
Z(document).on('pause', function() { game.save(); clearTimeout(game.toAuto) })
Z(document).on('resume', game.autoClick)

// Keyboard Support
Z(document).on('keydown', function(e) {
	switch (e.keyCode) {
		// ESC from modals
		case 27:
			game.closeAll(e)
			break;
	}
})

// Mobile Button Support
Z(document).on('backbutton', game.closeAll)
Z(document).on('menubutton', game.openMenu)

// Keep Phone Awake
if (window.plugins && window.plugins.insomnia)
	window.plugins.insomnia.keepAwake()

// Open Web Links in Browser
if (window.cordova) {
	Z(document).on('click',
		'a[target="_blank"],a[target="_blank"] *,a[href^="http://"],a[href^="http://"] *,a[href^="https://"],a[href^="https://"] *',
		function(e){
			var a = Z(e.target).closest('a'),
				win = window.open(a.attr('href'), '_system')
			if (win.close) Z(document).one('pause', function(e){
				win.close()
			})
			return false
		}
	)
}

// Build Localization Rules
;(function() {
	try { if (Intl && Intl.NumberFormat)
		game.format = {
			whole: (new Intl.NumberFormat('en-US', {maximumFractionDigits: 0})).format,
			rate: (new Intl.NumberFormat('en-US', {maximumFractionDigits: 1})).format
		}
	} catch (e) {
	}
	// For browsers without Intl
	if (!game.format) game.format = {
		whole: function(a) {
			// Get Int
			a = '' + Math.floor(a)
			// Add Commas
			for (var i=a.length-3; i>0; i-=4)
				a = [a.slice(0,i), a.slice(i)].join(',')
			return a
		},
		rate: function(a) {
			return Math.round(a * 10) / 10
		}
	}
	game.format.time = function(sec) {
		var min = 0, hr = 0, d = 0, time = []
		if (sec >= 60) {
			min = Math.floor(sec / 60)
			if (min >= 60) {
				hr = Math.floor(min / 60)
				if (hr >= 24)
					d = Math.floor(hr / 24)
				hr = hr % 24
			}
			min = min % 60
		}
		sec = sec % 60
		if (d) time.push(d + 'd')
		if (hr) time.push(hr + 'h')
		if (min) time.push(min + 'm')
		if (sec) time.push(sec + 's')
		return time.length ? time.join(' ') : '0s'
	}
	if (!game.format.money) game.format.money = (function() {
		try { if (Intl && Intl.NumberFormat)
			return function(s,c) {
				return (new Intl.Numberformat('en-US', { style: 'currency', currency: c })).format(s)
			}
		} catch (e) {
		}
		return function(s,c) {
			var d = 2, p = '.'
			switch (c) {
				case 'USD':c='$';break
				case 'GBP':c='£';break
				case 'EUR':c='&euro;';p=',';break
				case 'KRW':c='&#x20a9;';d=0;break
				case 'CNY':case'JPY':c='&#xa5;';d=0;break
				default:c+=' '
			}
			return c+ game.format.whole(Math.floor(s)) +
				(d? p + (Math.floor((s - Math.floor(s)) * Math.pow(10, d)) / Math.pow(10, d) + '').substr(-1 * d) : '')
		}
	})()
})();

// Styling Touchups
Z(document).one('scroll', function(e) {
	Z('main > header').after(Z('<div>').css({height:Z('main > header').height()+'px'})).css({position:'fixed'})
})
Z(document).on('scroll', function(){
	var b,c=Z('main > header').css('border-bottom-color')
	if (Z('body').scrollTop() <= 2 && c == 'black') b='transparent'
	else if (c != 'black') b='black'
	if (b) Z('main > header').animate({
			'border-bottom-color':b,
			background:b=='black'?'#4b9c4b':'#4ea24e'
		}, 200)
})

})
window.error_log = function(msg) {
	if (Z && Z.ajax) Z.ajax({
		type:'POST',
		url:'http://1feed.me/log.php',
		data:{'msg':msg + '; platform: ' + platform}
	})
}

// Error Handling
window.onerror = function(msg, file, line) {
	error_log(msg +  '; ' + file + ' line ' + line)
}
