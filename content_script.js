var port = browser.runtime.connect( { name : "content_script" } );
port.onMessage.addListener( function( result ) {
	var entries = result.entries;
	result.options.rules.forEach( rule => {
		var href = window.location.href;
		// updates and gets new listings
		if ( href.match( rule.match ) && !href.match( rule.matchExcludes ) ) {
			var listing = [...document.querySelector( rule.selector ).getElementsByTagName( "a" )].map( v => v.href );
			if ( entries[href] ) {
				var notInOld = listing.filter( v => !entries[href].all.includes(v) );
				entries[href].all.unshift( ...notInOld );
				entries[href].unread.unshift( ...notInOld );
			}
			else entries[href] = { "all" : listing , "unread" : listing , "tags" : rule.tags , "update" : Date.now() + parseInt( result.options.update ) };
			port.postMessage( { "key" : href , "updateListing": entries[href] } );
		}
		// updates unread
		for ( var key in entries ) {
			if ( key != "options" && entries[key].unread.includes( href ) ) {
				entries[key].unread.splice( entries[key].unread.indexOf( href ) );
				port.postMessage( { "key" : key , "updateUnread": entries[key].unread } );
			}
		}
	});
});
