/**
 * External dependencies
 */

import { createPluginInstance } from '@storepress/utils';

/**
 * Internal dependencies
 */
import { Plugin } from './Plugin';

document.addEventListener( 'DOMContentLoaded', () => {
	const Slider = {
		getInstance( element, options ) {
			return createPluginInstance( element, options, Plugin );
		},

		initWith( el, options ) {
			const instance = this.getInstance( el, options );

			for ( const { element, removeEvents } of instance ) {
				element.addEventListener( 'destroy', removeEvents );
			}

			return instance;
		},

		init( options ) {
			const instance = this.getInstance( '.slider-wrapper', options );
			for ( const { element, removeEvents } of instance ) {
				element.addEventListener( 'destroy', removeEvents );
			}
			return instance;
		},

		destroyWith( el ) {
			for ( const { destroy } of this.getInstance( el ) ) {
				destroy();
			}
		},

		destroy() {
			for ( const { destroy } of this.getInstance( '.slider-wrapper' ) ) {
				destroy();
			}
		},

		nextWith( el, ev ) {
			for ( const { slideNext } of this.getInstance( el ) ) {
				slideNext( ev );
			}
		},

		prevWith( el, ev ) {
			for ( const { slidePrev } of this.getInstance( el ) ) {
				slidePrev( ev );
			}
		},
	};

	// Add event like this:
	document.addEventListener( 'slider_init', ( event ) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		console.log( element );

		Slider.initWith( element, settings );
	} );

	// Dispatch / trigger Events:

	document.dispatchEvent(
		new CustomEvent( 'slider_init', {
			detail: {
				element: '.one',
				settings: {},
			},
		} )
	);

	// Next Slide
	document.addEventListener( 'slider_next', ( event ) => {
		const element = event.detail?.element;

		Slider.nextWith( element, event );
	} );

	// Prev Slide
	document.addEventListener( 'slider_prev', ( event ) => {
		const element = event.detail?.element;

		Slider.prevWith( element, event );
	} );

	////
} );
