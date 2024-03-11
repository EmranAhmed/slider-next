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

		reInit( options ) {
			this.destroy();
			this.init( options );
		},

		reInitWith( el, options ) {
			this.destroyWith( el );
			this.initWith( el, options );
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
			for ( const { destroy, reset } of this.getInstance( el ) ) {
				reset();
				destroy();
			}
		},

		destroy() {
			for ( const { destroy, reset } of this.getInstance(
				'.slider-wrapper'
			) ) {
				reset();
				destroy();
			}
		},

		nextWith( el, ev ) {
			for ( const { handleNext } of this.getInstance( el ) ) {
				handleNext( ev );
			}
		},

		prevWith( el, ev ) {
			for ( const { handlePrev } of this.getInstance( el ) ) {
				handlePrev( ev );
			}
		},

		gotoWith( el, index ) {
			for ( const { to } of this.getInstance( el ) ) {
				to( index );
			}
		},
	};

	// Slider ReInit.
	document.addEventListener( 'slider_re_init', ( event ) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		Slider.reInitWith( element, settings );
	} );

	// Slider Init.
	document.addEventListener( 'slider_init', ( event ) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		Slider.initWith( element, settings );
	} );

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

	// Goto
	document.addEventListener( 'slider_goto', ( event ) => {
		const element = event.detail?.element;
		const index = event.detail?.index;
		Slider.gotoWith( element, index );
	} );

	// Destroy
	document.addEventListener( 'slider_destroy', ( event ) => {
		const element = event.detail?.element;

		Slider.destroyWith( element );
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
} );
