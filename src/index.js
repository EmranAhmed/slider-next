/**
 * External dependencies
 */
import { createStorePressPlugin } from '@storepress/utils';

/**
 * Internal dependencies
 */
import { Plugin } from './Plugin';

const StorePressSlider = createStorePressPlugin( {
	selector: '[data-storepress-slider]',
	plugin: Plugin,
	namespace: 'slider',
	callback: {
		onSetup() {
			let timeOutId;

			window.addEventListener(
				'resize',
				() => {
					clearTimeout( timeOutId );

					timeOutId = setTimeout( () => {
						this.reload();
					}, 300 );
				},
				{ passive: true, signal: this.controller.signal }
			);
		},
	},
} );

StorePressSlider.setup();

export default StorePressSlider;
