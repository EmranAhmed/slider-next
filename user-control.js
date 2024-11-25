// import { triggerEvent, getPluginInstance } from '@storepress/utils';

document.addEventListener('DOMContentLoaded', function () {
	// Init

	/*
	document.dispatchEvent(
		new CustomEvent( 'slider_init', {
			detail: {
				element: '.two',
				settings: {
					syncWith: '.one',
				},
			},
		} )
	);
	 */

	/*triggerEvent( document, 'slider_init', {
		element: [ '.two' ],
		settings: {
			syncWith: '.one',
		},
	} );*/

	import('@storepress/utils').then(({ getPluginInstance, triggerEvent }) => {
		triggerEvent(document, 'slider_init', {
			element: ['.two'],
			settings: {
				syncWith: '.one',
			},
		});

		const $slider = getPluginInstance('.one');
		console.log('=>', $slider);
	});

	let timer;
	window.addEventListener('resize', () => {
		clearTimeout(timer);

		timer = setTimeout(() => {
			document.dispatchEvent(
				new CustomEvent('slider_re_init', {
					detail: {
						element: ['.one', '.two'],
						settings: {},
					},
				})
			);
		}, 300);
	});

	// Custom Next Prev Sync.
	document
		.getElementById('prev2')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_prev', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});

	document
		.getElementById('next2')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_next', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});

	// Sync Slide on swipe
	document.querySelectorAll('.one, .two').forEach((element) => {
		element.addEventListener('slide_prev_swiped', () => {
			document.dispatchEvent(
				new CustomEvent('slider_prev', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});

		element.addEventListener('slide_next_swiped', () => {
			document.dispatchEvent(
				new CustomEvent('slider_next', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});
	});

	document
		.getElementById('goto-one-1')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_goto', {
					detail: {
						element: ['.one', '.two'],
						index: 0,
					},
				})
			);
		});

	document
		.getElementById('goto-one-2')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_goto', {
					detail: {
						element: ['.one', '.two'],
						index: 1,
					},
				})
			);
		});

	document
		.getElementById('goto-one-3')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_goto', {
					detail: {
						element: ['.one', '.two'],
						index: 2,
					},
				})
			);
		});

	document
		.getElementById('goto-one-4')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_goto', {
					detail: {
						element: ['.one', '.two'],
						index: 3,
					},
				})
			);
		});

	document
		.getElementById('goto-one-5')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_goto', {
					detail: {
						element: ['.one', '.two'],
						index: 4,
					},
				})
			);
		});

	document
		.getElementById('next1')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_next', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});

	document
		.getElementById('prev1')
		.addEventListener('click', function (event) {
			event.preventDefault();

			document.dispatchEvent(
				new CustomEvent('slider_prev', {
					detail: {
						element: ['.one', '.two'],
					},
				})
			);
		});
});
