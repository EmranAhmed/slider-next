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
			const instance = this.getPluginInstance(el);

			for (const { destroy, element, reset } of instance) {
				destroy();
				element.removeEventListener('destroy', reset);
			}
		},

		nextWith(el, ev) {
			for (const { handleNext } of this.getPluginInstance(el)) {
				handleNext(ev);
			}
		},

		prevWith(el, ev) {
			for (const { handlePrev } of this.getPluginInstance(el)) {
				handlePrev(ev);
			}
		},

		gotoSlideWith(el, index) {
			for (const { goToSlide } of this.getPluginInstance(el)) {
				goToSlide(index);
			}
		},

		gotoDotWith(el, index) {
			for (const { goToDot } of this.getPluginInstance(el)) {
				goToDot(index);
			}
		},
	};

	// Slider ReInit.
	document.addEventListener(
		'storepress_slider_re_init',
		(event) => {
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
		},
		{ passive: true }
	);

	// Slider Init.
	document.addEventListener(
		'storepress_slider_init',
		(event) => {
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
		},
		{ passive: true }
	);

	// Next Slide
	document.addEventListener(
		'storepress_slider_next',
		(event) => {
			const element = event.detail?.element;

			if (Array.isArray(element)) {
				for (const el of element) {
					Slider.nextWith(el, event);
				}
			} else {
				Slider.nextWith(element, event);
			}
		},
		{ passive: true }
	);

	// Prev Slide
	document.addEventListener(
		'storepress_slider_prev',
		(event) => {
			const element = event.detail?.element;

			if (Array.isArray(element)) {
				for (const el of element) {
					Slider.prevWith(el, event);
				}
			} else {
				Slider.prevWith(element, event);
			}
		},
		{ passive: true }
	);

	// Goto Slide
	document.addEventListener(
		'storepress_slider_goto_slider',
		(event) => {
			const element = event.detail?.element;
			const index = event.detail?.index;

			if (Array.isArray(element)) {
				for (const el of element) {
					Slider.gotoSlideWith(el, index);
				}
			} else {
				Slider.gotoSlideWith(element, index);
			}
		},
		{ passive: true }
	);

	// Goto Dot
	document.addEventListener(
		'storepress_slider_goto_dot',
		(event) => {
			const element = event.detail?.element;
			const index = event.detail?.index;

			if (Array.isArray(element)) {
				for (const el of element) {
					Slider.gotoDotWith(el, index);
				}
			} else {
				Slider.gotoDotWith(element, index);
			}
		},
		{ passive: true }
	);

	// Destroy
	document.addEventListener(
		'storepress_slider_destroy',
		(event) => {
			const element = event.detail?.element;

			if (Array.isArray(element)) {
				for (const el of element) {
					Slider.destroyWith(el);
				}
			} else {
				Slider.destroyWith(element);
			}
		},
		{ passive: true }
	);

	return Slider;
}

document.addEventListener('DOMContentLoaded', () => {
	StorePressSlider();
	// Dispatch / trigger Events:

	triggerEvent(document, 'storepress_slider_init', {
		element: ['[data-slider-settings]'],
		settings: {},
	});

	let timeOutId;

	window.addEventListener('resize', () => {
		clearTimeout(timeOutId);

		timeOutId = setTimeout(() => {
			triggerEvent(document, 'storepress_slider_re_init', {
				element: ['[data-slider-settings]'],
				settings: {},
			});
		}, 300);
	});
});

export default StorePressSlider;
