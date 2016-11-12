function matchTest( url , pattern ) {
	var arr = pattern.split("*");
	var str = arr.reduce( ( sum , v ) => sum + url.substring(sum.length).split( v , 1 )[0] + v );
	return url.startsWith(str) && ( arr[arr.length-1] == "" ? str != "" : url.endsWith(str) );
}
function updateListing( rule , result , key ) {
	var listing = [...document.querySelector( rule.selector ).getElementsByTagName( "a" )].map( v => v.href );
	if ( !result[key] ) {
		result[key] = { "all" : listing , "unread" : Array( ...listing ) , "tags" : rule.tags , "update" : Date.now() + result.options.update };
	}
	var notInOld = listing.filter( v => !result[key].all.includes(v) );
	result[key].all.unshift( ...notInOld );
	result[key].unread.unshift( ...notInOld );
	port.postMessage( { "key" : key , "updateListing": result[key] } );
}
function updateUnread( url , result ) {
	for ( var key in result ) {
		if ( key != "options" && result[key].unread.includes( url ) ) {
			result[key].unread.splice( result[key].unread.indexOf( url ) );
			port.postMessage( { "key" : key , "updateUnread": result[key].unread } );
		}
	}
}
var port = chrome.runtime.connect( { name : "content_script" } );
port.onMessage.addListener( function( message ) {
	var rules = message.options.rules
	rules = rules.filter( v => matchTest( window.location.href , v.match ) );
	rules = rules.filter( v => !matchTest( window.location.href , v.matchExcludes ) );
	rules.forEach( rule => updateListing( rule , message , window.location.href ) );

	updateUnread( window.location.href , message )
});
