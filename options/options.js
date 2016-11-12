var times = { "day" : 86400000 , "hour" : 3600000 , "minute" : 60000 , "second" : 1000 }
function timeStrToInt( str ) {
	return str.split( " " ).reduce( ( a , b ) => parseInt(a) * times[b.replace(/s$/,'')] );
}
function timeIntToStr( x ) {
	for ( t in times ) { x = x % times[t] == 0 ? x / times[t] + " " + t : x }
	return x.startsWith( "1 " ) ? x : x + "s";
}
function formSubmit( e ) {
	e.preventDefault();
	e.target.firstChild.dispatchEvent( new Event( "blur" ) );
}
function sorting( e ) {
	var arr = e.target.value;
	port.postMessage( { "key" : "options" , "sorting" : arr } );
}
function refreshFrequency( e ) {
	var time = timeStrToInt( e.target.value );
	if ( typeof time !== "number" || isNaN(time) ) {
		e.target.style.border = "2px solid red";
	}
	else {
		e.target.style.border = "";
		port.postMessage( { "key" : "options" , [e.target.id] : time } );
	}
}
function ruleSuccess( elem , rule ) {
	elem.style.border = "";
	var inputs = [...document.querySelectorAll( "#rules input" )];
	inputs.forEach( function( v ) { if ( v.value == "" ) { v.parentNode.parentNode.removeChild( v.parentNode ) } });
	makeRule( "" , inputs.length );
	var ruleArr = rule ? [inputs.indexOf( elem ) , 1 , rule] : [inputs.indexOf( elem ) , 1]
	port.postMessage( { "key" : "options" , "rule" : ruleArr } )
}
function updateRules( e ) {
	if ( e.target.value == "" ) { ruleSuccess( e.target ) }
	else {
		try{ var rule = JSON.parse( e.target.value ); }
		catch ( err ) {	e.target.style.border = "2px solid red" }
		if ( "match" in rule && "selector" in rule ) { ruleSuccess( e.target , rule ) }
		else { e.target.style.border = "2px solid red" }
	}
}
function makeRule( rule , id ) {
	var t = document.importNode( document.getElementById( "form_template" ) , true );
	t.content.querySelector( "form" ).onsubmit = formSubmit;
	t.content.querySelector( "input" ).value = rule;
	t.content.querySelector( "input" ).onblur = updateRules;
	t.content.querySelector( "input" ).id = id;
	document.querySelector( "#rules" ).appendChild( t.content );
}
function make( options ){
	document.querySelector( "#sorting" ).value = options.sorting;
	document.querySelector( "#update" ).value = timeIntToStr( options.update );
	document.querySelector( "#updateMin" ).value = timeIntToStr( options.updateMin );
	for ( var i = 0 ; i <= options.rules.length ; i++ ) {
		if ( i == options.rules.length ) { makeRule( "" , i ) }
		else { makeRule( JSON.stringify( options.rules[i] ) , i ) }
	}
}
var port;
window.onload = function() {
	[...document.querySelectorAll( "form" )].forEach( v => v.onsubmit = formSubmit );
	document.getElementById( "sorting" ).onblur  = sorting;
	document.getElementById( "update" ).onblur  = refreshFrequency;
	document.getElementById( "updateMin" ).onblur  = refreshFrequency;
	port = chrome.runtime.connect( { name : "options" } );
	port.onMessage.addListener( function( message ) {
		make( message.options )
		console.log(message.options.rules)
	});
}














// function showError( elem ) { elem.style.border = "2px solid red" }
// function hideError( elem ) { elem.style.border = "" }