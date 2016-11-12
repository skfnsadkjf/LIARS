// Handles all changes to storage and messaging.
//

function doUpdates() {
	Object.keys( result ).forEach( function( key ) {
		if ( key != "options" && result[key].update - Date.now() < 0 ) {
			result[key].update = Date.now() + result.options.update;
			chrome.tabs.create( { active:false , url:key } , function( tab ) { tabIds.push( tab.id ) } );
			return;
		}
	});
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
		if ( tabIds.includes( p.sender.tab.id ) ) {
			chrome.tabs.remove( p.sender.tab.id )
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
	});
}

			// chrome.storage.local.remove( "options" );
			// chrome.storage.local.clear();

function setDefaultOptions() {
	if ( !result.options ) {
		result.options = { "update":"604800000" , "updateMin":"60000" , "sorting":"name" , "rules":[] , "dark":false }
	}
}
function browser_action() {
	chrome.tabs.create( { url : chrome.runtime.getURL( "content_page/content_page.html" ) } );
}
// // ADD THIS TO HOPEFULLY MAKE IT NOT BORKED WHEN STARTING UP.
// chrome.runtime.onStartup.addListener()
var portCP , portOptions , result , tabIds = [];
browser.browserAction.onClicked.addListener( browser_action );
chrome.storage.local.get( null , function( r ) {
	result = r;
	// result.options = false;
	setDefaultOptions() //Only does shit on first run.
	// result.options.rules[0].tags = ["manga" , "kissmanga"]
	// chrome.storage.local.set( { "options" : result.options } );
	// console.log(result)
	setInterval( doUpdates , result.options.updateMin );
	chrome.runtime.onConnect.addListener( connected );
	// chrome.tabs.create( { url : chrome.runtime.getURL( "content_page/content_page.html" ) } );
});




// {"match":"*://kissmanga.com/Manga/*","matchExcludes":"*://kissmanga.com/Manga/*/*","selector":".listing" ,"tags":["manga","kissmanga"]}


