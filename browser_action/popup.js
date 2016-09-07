document.addEventListener("click", function(e) {
	if ( e.target.id == "open_page" ) {
		chrome.tabs.query( { title:"grim" } , function( tabs ) {
			if ( tabs.length > 0 ) {
				chrome.tabs.update( tabs[0].id , { active : true } );
			} else {
				chrome.tabs.create( { url : chrome.runtime.getURL( "content_page/content_page.html" )} );
			}
		});
	}
});
