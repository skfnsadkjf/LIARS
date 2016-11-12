function getKey( elem ){
	return elem.parentElement.id == "entries" ? elem.id : getKey( elem.parentElement );
}
function sortBy( arr ) {
	var entries = [...document.querySelectorAll( "#entries > *" )];
	entries.sort( function( a , b ) { return arr[entries.indexOf(a)] > arr[entries.indexOf(b)] });
	// if trying to sort to current arrangement, sort with reversed order. I.E. for name if a-z do z-a.
	if ( [...document.querySelectorAll( "#entries > *" )].every( (v,i) => v == entries[i] ) ) {
		entries.sort( function( a , b ) { return arr[entries.indexOf(a)] < arr[entries.indexOf(b)] });
	}
	entries.forEach( v => document.querySelector( "#entries" ).appendChild( v ) );
}
function sortByName() {
	sortBy( [...document.querySelectorAll( "h2 a" )].map( v => v.innerHTML ) );
}
function sortByUnread() {
	sortBy( [...document.querySelectorAll( "h2 span" )].map( v => v.innerHTML == "0" ) );
}
function sortByStarted() {
	sortBy( [...document.querySelectorAll( "#entries > *" )].map( v =>
		(v.querySelectorAll( ".popout a" ).length == v.querySelector( "h2 span" ).innerHTML) ? 1 : 0
	));
}
function sortByTag( tag ) {
	sortBy( [...document.querySelectorAll( "#entries > *" )].map( v =>
		v.querySelector( "#" + tag ) ? 0 : 1
	));
}
function sortByTagInput( e ) {
	e.preventDefault(); // stops page refreshing on form submit
	sortByTag( e.explicitOriginalTarget.value );
}
function sortByDefault(){ // THIS DOESN'T WORK CORRERTLY WHEN ALREADY SORTED BY THE FIRST SORT TYPE. IT REVERSES.
	var arr = options.sorting.split( " " );
	arr.map( ( v , i ) => v.startsWith("!") ? arr.splice( i+1 , 0 , v.substring( 1 ) ) : 0 )
	arr = arr.map( v => v.startsWith("!") ? v.substring( 1 ) : v )
	arr.map( v => {
		if ( v == "name" ) { sortByName() }
		else if ( v == "unread>0" ) { sortByUnread() }
		else if ( v == "started" ) { sortByStarted() }
		else { sortByTag( v ) }
	});
}
function addTag( e ) {
	if ( e.explicitOriginalTarget.value == "" ) { return }
	e.preventDefault(); // stops page refreshing on form submit
	port.postMessage( { "key" : getKey( e.target ) , "addTag": e.explicitOriginalTarget.value } );
	makeTag( e.explicitOriginalTarget.value , e.target.parentElement );
}
function removeTag( e ) {
	port.postMessage( { "key" : getKey( e.target ) , "removeTag": e.target.id } );
	e.target.remove();
}
function popout( e ) {
	var c = e.target.nextSibling.style;
	c.display == "none" ? c.display = "block" : c.display = "none"
}
function removeEntry( e ) {
	var key = getKey( e.target );
	port.postMessage( { "key" : key , "removeEntry": key } );
	document.getElementById( key ).remove();
}
function updateEntry( key , result ){
	var keyElem = document.getElementById( key );
	if ( keyElem ) {
		var newElem = make( key , result );
		var popped = newElem.querySelector( ".popout" ).style;
		popped.display = keyElem.querySelector( ".popout" ).style.display;
		keyElem.parentElement.replaceChild( newElem , keyElem );
	} else {
		document.querySelector( "#entries" ).appendChild( make( key , result ) );
	}
}
function makeTag( name , parent ) {
	var tag = document.createElement( "span" )
	tag.innerHTML = name;
	tag.id = name;
	tag.onclick = removeTag;
	var arr = [...parent.children , tag].splice(1);
	arr.sort( ( a , b ) => a.innerHTML > b.innerHTML );
	arr.forEach( v => parent.appendChild( v ) );
}
function make( key , result ){
	var t = document.importNode( document.getElementById( "entry_template" ) , true );
	t.content.querySelector( "h2 a" ).href = key;
	t.content.querySelector( "h2 a" ).innerHTML = key.substring(key.lastIndexOf( "/" ) + 1 );
	t.content.firstChild.id = key;
	t.content.firstChild.style["background-color"] = result.unread.length ? "#E0F2F2" : "#ffffff";
	t.content.querySelector( "h2 span" ).innerHTML = result.unread.length;
	t.content.querySelector( "h2" ).onclick = popout
	t.content.querySelector( ".remove_entry" ).onclick = removeEntry
	t.content.querySelector( ".tags form" ).onsubmit = addTag
	for ( var i = 0 ; i < result.tags.length ; i++ ) {
		makeTag( result.tags[i] , t.content.querySelector( ".tags" ) );
	}
	for ( var i = 0 ; i < result.all.length ; i++ ) {
		var a = document.createElement( "a" );
		a.href = result.all[i];
		a.innerHTML = result.all[i];
		a.target = "_blank";
		if ( i < result.unread.length ) { a.style["font-weight"] = "bold" }
		t.content.querySelector( ".popout" ).appendChild( a );
	}
	return t.content;
}
function darkMode( e ) {
	if ( e ) { options.dark = !options.dark }
	document.body.style.filter = options.dark ? "invert(100%)" : "invert(0%)";
	document.body.style["background-color"] = options.dark ? "#333333" : "#ffffff";
	port.postMessage( { "key" : "options" , "dark": options.dark } );
}
function setUp( o ) {
	options = o
	darkMode()
}
var port , options;
window.onload = function() {
	port = chrome.runtime.connect( { name : "content_page" } );
	port.onMessage.addListener( function( result ) {
		Object.keys( result ).forEach( function( key ) {
			( key != "options" ) ? updateEntry( key , result[key] ) : setUp( result[key] );
		});
		sortByDefault() // shouldn't be here. Should sort only when completed adding entries.
	});
	document.getElementById( "sortByDefault" ).onclick = sortByDefault;
	document.getElementById( "sortByName" ).onclick = sortByName;
	document.getElementById( "sortByUnread" ).onclick = sortByUnread;
	document.getElementById( "sortByStarted" ).onclick = sortByStarted;
	document.getElementById( "sortByTag" ).onsubmit = sortByTagInput;
	document.getElementById( "dark" ).onclick = darkMode;
}























