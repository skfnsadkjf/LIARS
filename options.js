var times = { "day" : 86400000 , "hour" : 3600000 , "minute" : 60000 , "second" : 1000 }
function timeStrToInt( str ) {
	return str.split( " " ).reduce( ( a , b ) => parseInt(a) * times[b.replace(/s$/,'')] );
}
function timeIntToStr( x ) {
	for ( t in times ) { x = x % times[t] == 0 ? x / times[t] + " " + t : x }
	return x.startsWith( "1 " ) ? x : x + "s";
}
function sorting( e ) {
	port.postMessage( { "key" : "options" , "sorting" : e.target.value } )
}
function refreshFrequency( e ) {
	var time = timeStrToInt( e.target.value );
	e.target.style.border = "";
	if ( typeof time !== "number" || isNaN(time) ) e.target.style.border = "2px solid red";
	else port.postMessage( { "key" : "options" , [e.target.id] : time } );
}
function updateRules( e ) {
	var index = Array.from(e.target.parentNode.children).indexOf(e.target);
	e.target.style.border = ""
	if ( e.target.value == "" ) {
		if ( e.target.parentNode.lastChild != e.target ) e.target.remove();
		port.postMessage( { "key" : "options" , "rule" : [index , 1] } );
	}
	else {
		try {
			var rule = JSON.parse( e.target.value )
			if ( !("match" in rule) || !("selector" in rule) ) throw 0;
			if ( e.target.parentNode.lastChild == e.target ) makeRule( "" );
			port.postMessage( { "key" : "options" , "rule" : [index , 1 , rule] } )
		}
		catch ( err ) { e.target.style.border = "2px solid red" }
	}
}
function makeRule( rule ) {
	var t = document.createElement( "input" );
	t.value = rule;
	t.onblur = updateRules;
	t.onkeypress = ( e => { if ( e.which === 13 ) updateRules( e ) } );
	document.querySelector( "#rules" ).appendChild( t );
}
function make( options ){
	// ( e => { if ( e.which === 13 ) sorting( e ) } ) --- tests if enter was pressed
	document.getElementById( "sorting" ).value = options.sorting;
	document.getElementById( "sorting" ).onblur = sorting;
	document.getElementById( "sorting" ).onkeypress = ( e => { if ( e.which === 13 ) sorting( e ) } );
	document.getElementById( "update" ).value = timeIntToStr( options.update );
	document.getElementById( "update" ).onblur = refreshFrequency;
	document.getElementById( "update" ).onkeypress = ( e => { if ( e.which === 13 ) refreshFrequency( e ) } );
	document.getElementById( "updateMin" ).value = timeIntToStr( options.updateMin );
	document.getElementById( "updateMin" ).onkeypress = ( e => { if ( e.which === 13 ) refreshFrequency( e ) } );
	document.getElementById( "updateMin" ).onblur = refreshFrequency;
	for ( i in options.rules ) { makeRule( JSON.stringify( options.rules[i] ) ) }
	makeRule( "" )
}
var port;
window.onload = function() {
	port = chrome.runtime.connect( { name : "options" } );
	port.onMessage.addListener( message => make( message.options ) );
}


// function border( elem , red ) { red ? elem.style.border = "2px solid red" : elem.style.border = "" }
// function showError( elem ) { elem.style.border = "2px solid red" }
// function hideError( elem ) { elem.style.border = "" }