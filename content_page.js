function getKey( elem ){
	return elem.parentElement.id == "entries" ? elem.id : getKey( elem.parentElement );
}
function addTag( e ) {
	if ( e.which !== 13 || e.target.value == "" ) return;
	port.postMessage( { "key" : getKey( e.target ) , "addTag": e.target.value } );
}
function removeTag( e ) {
	if ( e.target.style.border != "2px solid red" ) { e.target.style.border = "2px solid red"; return }
	port.postMessage( { "key" : getKey( e.target ) , "removeTag": e.target.innerText } );
}
function removeEntry( e ) {
	if ( e.target.style.border != "2px solid red" ) { e.target.style.border = "2px solid red"; return }
	port.postMessage( { "key" : getKey( e.target ) , "removeEntry": getKey( e.target ) } );
}
function makePopout( entryElem , key ) {
	var entry = entries[key];
	var t = document.importNode( document.getElementById( "popout_template" ) , true );
	t.content.querySelector( ".remove_entry" ).onclick = removeEntry
	t.content.querySelector( ".tags input" ).onkeypress = addTag;
	for ( var i in entry.tags ) {
		var tag = document.createElement( "span" )
		tag.innerText = entry.tags[i];
		tag.onclick = removeTag;
		t.content.querySelector( ".tags" ).appendChild( tag );
	}
	for ( var i = 0 ; i < entry.all.length ; i++ ) {
		var a = document.createElement( "a" );
		a.href = entry.all[i];
		a.innerText = entry.all[i];
		a.target = "_blank";
		if ( i < entry.unread.length ) { a.style["font-weight"] = "bold" }
		t.content.querySelector( ".popout" ).appendChild( a );
	}
	entryElem.appendChild(t.content)
}
function popout( e ) {
	var key = e.target.firstChild.href;
	if ( popped.includes( key ) ) {
		e.target.nextSibling.remove();
		popped = popped.filter( ( v ) => v != key );
		return;
	}
	popped.push( key );
	makePopout( e.target.parentElement , key );
}
function make( key , entry ){
	var t = document.importNode( document.getElementById( "entry_template" ) , true );
	t.content.querySelector( "h2 a" ).href = key;
	t.content.querySelector( "h2 a" ).innerText = key.substring(key.lastIndexOf( "/" ) + 1 );
	t.content.firstChild.id = key;
	t.content.firstChild.style["background-color"] = entry.unread.length ? "#250d0d" : "#000000";
	t.content.querySelector( "h2 span" ).innerText = entry.unread.length;
	t.content.querySelector( "h2" ).onclick = popout
	if ( popped.includes(key) ) makePopout( t.content.firstChild , key );
	return t.content;
}
function makeAll() {
	var entriesElem = document.createElement( "div" );
	entriesElem.id = "entries";
	var arr = Object.keys( entries );
	for ( var x in sorting ) {
		if      (sorting[x]== "name"    )arr.sort((a,b)=>{return a > b})
		else if (sorting[x]=="!name"    )arr.sort((a,b)=>{return a < b})
		else if (sorting[x]== "unread>0")arr.sort((a,b)=>{return (entries[a].unread.length>0) < (entries[b].unread.length>0)})
		else if (sorting[x]=="!unread>0")arr.sort((a,b)=>{return (entries[a].unread.length>0) > (entries[b].unread.length>0)})
		else if (sorting[x]== "started" )arr.sort((a,b)=>{return (entries[a].all.length==entries[a].unread.length) > (entries[b].all.length==entries[b].unread.length)})
		else if (sorting[x]=="!started" )arr.sort((a,b)=>{return (entries[a].all.length==entries[a].unread.length) < (entries[b].all.length==entries[b].unread.length)})
		else if (sorting[x][0]=="!"     )arr.sort((a,b)=>{return entries[a].tags.includes(sorting[x].substr(1)) > entries[b].tags.includes(sorting[x].substr(1))})
		else if (sorting[x][0]!="!"     )arr.sort((a,b)=>{return entries[a].tags.includes(sorting[x]) < entries[b].tags.includes(sorting[x])})
	}
	arr.forEach( key => { entriesElem.appendChild( make( key , entries[key] ) ) } )
	document.getElementById( "entries" ).replaceWith( entriesElem );
}
function doSort( sortingType , changeSorting = true ) {
	var last = sorting[sorting.length-1] == sortingType;
	if ( last ) sorting[sorting.length-1] = "!"+sorting[sorting.length-1];
	if ( !last ) sorting.push( sortingType );
	if ( sortingType == "default" ) sorting = options.sorting.split( " " );
	makeAll();
}
var port , options , entries , sorting = [] , popped = [];
window.onload = function() {
	port = browser.runtime.connect( { name : "content_page" } );
	port.onMessage.addListener( function( message ) {
		if ( message.options ) {
			options = message.options
			sorting = options.sorting.split(" ");
		}
		if ( message.entries ) {
			entries = message.entries
			makeAll();
		}
		// if ( !document.hidden ) for ( var x in sorting ) doSort( sorting[x] , false );
	});
	// window.onfocus = ( e => { for ( var x in sorting ) doSort( sorting[x] , false ); console.log("focused") } );
	document.getElementById( "sortByDefault" ).onclick = () => doSort( "default" , false );
	document.getElementById( "sortByName" ).onclick = () => doSort( "name" );
	document.getElementById( "sortByUnread" ).onclick = () => doSort( "unread>0" );
	document.getElementById( "sortByStarted" ).onclick = () => doSort( "started" );
	document.getElementById( "sortByTag" ).onsubmit = ( e ) => { e.preventDefault(); doSort( e.explicitOriginalTarget.value ); }
}




// // // // used for updating in an iframe in this page instead of as a new tab.
// function updateTest( start , name ){
// 	if ( start == "updateNow" ) {
// 		var iframe = document.createElement( "iframe" );
// 		iframe.setAttribute( "src" , name );
// 		document.body.appendChild( iframe );
// 	} else {
// 		var exists = document.querySelector( 'iframe[src="'+name+'"]' );
// 		if ( exists ) exists.remove();
// 	}
// }
			// this goes in doUpdates in background script
			// if ( portCP ) portCP.postMessage( { ["updateNow"] : key } );






