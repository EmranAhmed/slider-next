document.addEventListener( 'DOMContentLoaded', function () {
	document.dispatchEvent(
		new CustomEvent( 'slider_init', {
			detail: {
				element: '.two',
				settings: {},
			},
		} )
	);

	let timer;
	window.addEventListener( 'resize', ( event ) => {
		clearTimeout( timer );

		timer = setTimeout( () => {
			document.dispatchEvent(
				new CustomEvent( 'slider_re_init', {
					detail: {
						element: '.two',
						settings: {},
					},
				} )
			);
		}, 200 );
	} );

	document
		.getElementById( 'next2' )
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
		.getElementById( 'prev2' )
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
		.getElementById( 'goto-one-4' )
		.addEventListener( 'click', function ( event ) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent( 'slider_goto', {
					detail: {
						element: '.one',
						index: 3,
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
						index: 4,
					},
				} )
			);
		} );

	document
		.getElementById( 'next1' )
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
		.getElementById( 'prev1' )
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
