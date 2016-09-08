// Handles all changes to storage and messaging.
//

function doUpdates() { // add dummy entry that waits 1 hour so that if user adds new fast updated entry he doesn't have to restart.
	var keys = Object.keys( result )
	keys.splice( keys.indexOf( "options" ) , 1 );
	var next = Math.min( ...keys.map( k => result[k].update) );
	var key = keys.filter( k => next == result[k].update)[0];
	console.log(next - Date.now() + " --- " + key)
	setTimeout( function( key ) { 
		console.log("checking listing of " + key )
		chrome.tabs.create( { active:false , url:key } , function( tab ) { tabIds.push( tab.id ); });
		result[key].update = Date.now() + result.options.update ;
		setTimeout( doUpdates , result.options.updateMin );
	} , next - Date.now() , key );
}
function connected( p ) {
	if ( p.name == "content_page" ) { portCP = p }
	if ( p.name == "options" ) { portOptions = p }
	p.postMessage( result );
	p.onMessage.addListener( function( message ) {
		var key = message.key;
		// from Content page.
		if ( message.removeEntry ) {
			delete result[key];
			chrome.storage.local.remove( key );
			return;
		}
		if ( message.removeTag ) {
			result[key].tags = result[key].tags.filter( v => v != message.removeTag );
		}
		if ( message.addTag ) {
			result[key].tags.push( message.addTag );
		}
		if ( message.dark != undefined ) {
			result[key].dark = message.dark;
		}

		// from Content script.
		if ( message.updateListing ) {
			result[key] = message.updateListing;
			if ( portCP ) { portCP.postMessage( { [key] : result[key] } ) }
		}
		if ( message.updateUnread ) {
			result[key].unread = message.updateUnread;
			if ( portCP ) { portCP.postMessage( { [key] : result[key] } ) }
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
			if ( portCP ) { portCP.postMessage( { [key] : result[key] } ) }
		}
		if ( message.rule ) {
			console.log(message.rule);
			result.options.rules.splice( ...message.rule )
		}
		chrome.storage.local.set( { [key] : result[key] } );
		if ( tabIds.includes( p.sender.tab.id ) ) {
			chrome.tabs.remove( p.sender.tab.id )
		}
	});
}

			// chrome.storage.local.remove( "options" );
			// chrome.storage.local.clear();

function setDefaultOptions() {
	if ( !result.options ) {
		result.options = { "update":"7 days" , "updateMin":"5 seconds" , "sorting":"name" , "rules":[] , "dark":false }
	}
}
var portCP , portOptions , result , tabIds = [];
chrome.storage.local.get( null , function( r ) {
	result = r;
	// result.options = false;
	setDefaultOptions() //Only does shit on first run.
	// result.options.rules[0].tags = ["manga" , "kissmanga"]
	// chrome.storage.local.set( { "options" : result.options } );
	// console.log(result)
	doUpdates();
	chrome.runtime.onConnect.addListener( connected );
	chrome.tabs.create( { url : chrome.runtime.getURL( "content_page/content_page.html" ) } );
});




// {"match":"*://kissmanga.com/Manga/*","matchExcludes":"*://kissmanga.com/Manga/*/*","selector":".listing" ,"tags":["manga","kissmanga"]}


