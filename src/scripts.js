/**
 * WordPress dependencies
 */

import { createPluginInstance, getPluginInstance, triggerEvent } from '@storepress/utils';

/**
 * Internal dependencies
 */
import { Plugin } from './Plugin';
import './style.scss';

document.addEventListener( 'DOMContentLoaded', () => {


	const Slider = {
		getInstance( element, options ) {
			return createPluginInstance( element, options, Plugin );
		},

		getPluginInstance( element ) {
			return getPluginInstance( element );
		},

		reInitWith( el, options ) {
			this.destroyWith( el );
			this.initWith( el, options );
		},

		initWith( el, options ) {
			const instance = this.getInstance( el, options );

			for ( const { element, reset } of instance ) {
				element.addEventListener( 'destroy', reset );
			}

			return instance;
		},

		destroyWith( el ) {
			for ( const { destroy } of this.getInstance( el ) ) {
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

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.reInitWith( el, settings );
			}
		} else {
			Slider.reInitWith( element, settings );
		}
	} );

	// Slider Init.
	document.addEventListener( 'slider_init', ( event ) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.initWith( el, settings );
			}
		} else {
			Slider.initWith( element, settings );
		}
	} );

	// Next Slide
	document.addEventListener( 'slider_next', ( event ) => {
		const element = event.detail?.element;

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.nextWith( el, event );
			}
		} else {
			Slider.nextWith( element, event );
		}
	} );

	// Prev Slide
	document.addEventListener( 'slider_prev', ( event ) => {
		const element = event.detail?.element;

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.prevWith( el, event );
			}
		} else {
			Slider.prevWith( element, event );
		}
	} );

	// Goto
	document.addEventListener( 'slider_goto', ( event ) => {
		const element = event.detail?.element;
		const index = event.detail?.index;

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.gotoWith( el, index );
			}
		} else {
			Slider.gotoWith( element, index );
		}
	} );

	// Destroy
	document.addEventListener( 'slider_destroy', ( event ) => {
		const element = event.detail?.element;

		if ( Array.isArray( element ) ) {
			for ( const el of element ) {
				Slider.destroyWith( el );
			}
		} else {
			Slider.destroyWith( element );
		}
	} );

	// Dispatch / trigger Events:

	triggerEvent( document, 'slider_init', {
		element: [ '.one', '.base' ],
		settings: {},
	} );

	/*	triggerEvent( document, 'slider_init', {
		element: '.base',
		settings: {},
	} );*/

} );
