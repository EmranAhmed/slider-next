document.addEventListener( 'DOMContentLoaded', function () {
	document
		.getElementById( 'aziz-next' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			window.Slider.next( event );
		} );
} );
