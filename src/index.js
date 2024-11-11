/**
 * External dependencies
 */

import {
	createPluginInstance,
	getPluginInstance,
	triggerEvent,
} from '@storepress/utils';

/**
 * Internal dependencies
 */
import { Plugin } from './Plugin';

function StorePressSlider() {
	const Slider = {
		getInstance(element, options) {
			return createPluginInstance(element, options, Plugin);
		},

		getPluginInstance(element) {
			return getPluginInstance(element);
		},

		reInitWith(el, options) {
			this.destroyWith(el);
			this.initWith(el, options);
		},

		initWith(el, options) {
			const instance = this.getInstance(el, options);

			for (const { element, reset } of instance) {
				element.addEventListener('destroy', reset);
			}

			return instance;
		},

		destroyWith(el) {
			for (const { destroy } of this.getInstance(el)) {
				destroy();
			}
		},

		nextWith(el, ev) {
			for (const { handleNext } of this.getInstance(el)) {
				handleNext(ev);
			}
		},

		prevWith(el, ev) {
			for (const { handlePrev } of this.getInstance(el)) {
				handlePrev(ev);
			}
		},

		gotoSlideWith(el, index) {
			for (const { goToSlide } of this.getInstance(el)) {
				goToSlide(index);
			}
		},

		gotoDotWith(el, index) {
			for (const { goToDot } of this.getInstance(el)) {
				goToDot(index);
			}
		},
	};

	// Slider ReInit.
	document.addEventListener('slider_re_init', (event) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.reInitWith(el, settings);
			}
		} else {
			Slider.reInitWith(element, settings);
		}
	});

	// Slider Init.
	document.addEventListener('slider_init', (event) => {
		const defaultSettings = {};
		const settings = { ...defaultSettings, ...event.detail?.settings };
		const element = event.detail?.element;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.initWith(el, settings);
			}
		} else {
			Slider.initWith(element, settings);
		}
	});

	// Next Slide
	document.addEventListener('slider_next', (event) => {
		const element = event.detail?.element;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.nextWith(el, event);
			}
		} else {
			Slider.nextWith(element, event);
		}
	});

	// Prev Slide
	document.addEventListener('slider_prev', (event) => {
		const element = event.detail?.element;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.prevWith(el, event);
			}
		} else {
			Slider.prevWith(element, event);
		}
	});

	// Goto Slide
	document.addEventListener('slider_goto_slider', (event) => {
		const element = event.detail?.element;
		const index = event.detail?.index;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.gotoSlideWith(el, index);
			}
		} else {
			Slider.gotoSlideWith(element, index);
		}
	});

	// Goto Dot
	document.addEventListener('slider_goto_dot', (event) => {
		const element = event.detail?.element;
		const index = event.detail?.index;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.gotoDotWith(el, index);
			}
		} else {
			Slider.gotoDotWith(element, index);
		}
	});

	// Destroy
	document.addEventListener('slider_destroy', (event) => {
		const element = event.detail?.element;

		if (Array.isArray(element)) {
			for (const el of element) {
				Slider.destroyWith(el);
			}
		} else {
			Slider.destroyWith(element);
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	StorePressSlider();
	// Dispatch / trigger Events:

	triggerEvent(document, 'slider_init', {
		element: ['[data-slider-settings]'],
		settings: {},
	});
});

export default StorePressSlider;
