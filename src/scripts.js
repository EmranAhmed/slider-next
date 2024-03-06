/**
 * External dependencies
 */

import { createPluginInstance } from '@storepress/utils';

/**
 * Internal dependencies
 */
import { Plugin } from './Plugin';

document.addEventListener( 'DOMContentLoaded', ( event ) => {
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

		next( ev ) {
			for ( const { slideNext } of this.getInstance(
				'.slider-wrapper'
			) ) {
				slideNext( ev );
			}
		},
	};

	window.Slider = Slider;

	document.addEventListener( 'slider_init', ( event ) => {
		Slider.init( {} );
	} );

	// Dispatch / Trigger Events:

	document.dispatchEvent( new Event( 'slider_init' ) );

	/*	document.getElementById( 'next' ).addEventListener( 'click', ( event ) => {
		event.preventDefault();
		const fn = window.Slider.init( '.slider-wrapper', {} );

		fn.map( ( { slideNext } ) => {
			slideNext( event );
		} );
	} );*/
} );
