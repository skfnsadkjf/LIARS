// Handles all changes to storage and messaging.

function doUpdates() {
	console.log("attempting updates")
	for ( key in result.entries ) {
		if ( key != "options" && result.entries[key].update - Date.now() < 0 ) {
			console.log("UPDATING SOMETHING")
			result.entries[key].update = Date.now() + parseInt( result.options.update );
			browser.tabs.create( { active : false , url : key } );
			result.updating.push( key );
			return;
		}
	}
}
function neverUpdateCheck( key , tag ) {
	if ( tag == "complete" || tag == "oneshot" ) {
		result.entries[key]["tags"].includes( "complete" ) || result.entries[key]["tags"].includes( "oneshot" )
		? result.entries[key].update = Infinity
		: result.entries[key].update = Date.now() + parseInt( result.entries.options.update );
	}
}

function connected( p ) {
	if ( p.name == "content_page" ) { portCP = p }
	p.postMessage( result );
	p.onMessage.addListener( function( message , sender ) {
		var key = message.key;
		// from Content page.
		if ( message.removeEntry ) {
			delete result.entries[key];
			if ( portCP ) portCP.postMessage( { "entries" : result.entries } );
		}
		if ( message.removeTag ) {
			result.entries[key].tags = result.entries[key].tags.filter( v => v != message.removeTag );
			neverUpdateCheck( key , message.removeTag );
			if ( portCP ) portCP.postMessage( { "entries" : result.entries } );
		}
		if ( message.addTag ) {
			result.entries[key].tags.push( message.addTag );
			result.entries[key].tags.sort( ( a , b ) => a > b );
			neverUpdateCheck( key , message.addTag );
			if ( portCP ) portCP.postMessage( { "entries" : result.entries } );
		}
		// from Content script.
		if ( message.updateListing ) {
			console.log( "heard from content scrpt" );
			if ( result.updating.includes( key ) ) {
				result.updating = result.updating.filter( v => !key );
				browser.tabs.remove( sender.sender.tab.id );
				console.log( "heard from content scrpt - should close this tab" );
			}
			result.entries[key] = message.updateListing;
			if ( portCP ) portCP.postMessage( { "entries" : result.entries } );
			// if ( portCP ) portCP.postMessage( { [key] : result.entries[key] , "updateDone" : key } );
		}
		if ( message.updateUnread ) {
			result.entries[key].unread = message.updateUnread;
			if ( portCP ) portCP.postMessage( { "entries" : result.entries } );
		}
		// from Options page.
		if ( message.update ) {
			result.options.update = message.update;
		}
		if ( message.updateMin ) {
			result.options.updateMin = message.updateMin;
		}
		if ( message.sorting ) {
			result.options.sorting = message.sorting;
			if ( portCP ) portCP.postMessage( { "options" : result.options } );
		}
		if ( message.rule ) {
			result.options.rules.splice( ...message.rule )
		}
		browser.storage.local.set( result );
	});
}
var portCP , result;
browser.browserAction.onClicked.addListener( () => browser.tabs.create( { url : browser.runtime.getURL( "content_page.html" ) } ) );
browser.storage.local.get( null , function( r ) {
	result = r;
	result.updating = [];
	if ( !result.options ) result.options = { "update":"604800000" , "updateMin":"30000" , "sorting":"name" , "rules":[]};
	if ( !result.entries ) result.entries = {};
	setInterval( doUpdates , result.options.updateMin );
	browser.runtime.onConnect.addListener( connected );
});

// {"match":".+:\/\/kissmanga.com\/Manga\/.+","matchExcludes":".+:\/\/kissmanga.com\/Manga\/.+\/.+","selector":".listing" ,"tags":["kissmanga","manga"]}


// I don't think (line 78) 'result.updating' needs to be part of result. Could just be 'var updating = []' on (line 74).
