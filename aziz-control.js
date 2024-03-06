document.addEventListener( 'DOMContentLoaded', function () {
	document.dispatchEvent(
		new CustomEvent( 'slider_init', {
			detail: {
				element: '.two',
				settings: {},
			},
		} )
	);

	document
		.getElementById( 'aziz-next1' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_next', {
					detail: {
						element: '.two',
					},
				} )
			);
		} );

	document
		.getElementById( 'aziz-prev1' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_prev', {
					detail: {
						element: '.two',
					},
				} )
			);
		} );

	document
		.getElementById( 'goto-one-5' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_goto', {
					detail: {
						element: '.one',
						index: 5,
					},
				} )
			);

			/*document.dispatchEvent(
				new CustomEvent( 'slider_destroy', {
					detail: {
						element: '.one',
					},
				} )
			);*/
		} );

	document
		.getElementById( 'aziz-next' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_next', {
					detail: {
						element: '.one',
					},
				} )
			);
		} );

	document
		.getElementById( 'aziz-prev' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_prev', {
					detail: {
						element: '.one',
					},
				} )
			);
		} );
} );
