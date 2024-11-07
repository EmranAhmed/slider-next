/**
 * External dependencies
 */
import {
	getOptionsFromAttribute,
	getPluginInstance,
	swipeEvent,
	triggerEvent,
} from '@storepress/utils';

function Plugin(element, options) {
	// Default Settings
	const DEFAULTS = {
		syncWith: null,
		syncOnSlide: true,
		syncAfterSlide: false,
		visibleActiveSlideOnSync: false,
		containerElement: '.storepress-slider-container',
		sliderElement: '.storepress-slider',
		sliderDotsTitle: 'Goto Slider',
	};

	const PRIVATE = {
		moveItemsCSSProperty: '--slide-item',
		visibleItemsCSSProperty: '--show-item',
		isInfiniteCSSProperty: '--show-infinite',
		isHorizontalCSSProperty: '--is-horizontal',
		isAlwaysCenterCSSProperty: '--is-always-center',
		isActiveSelectCSSProperty: '--is-active-select',
		itemGapCSSProperty: '--item-gap',
		sliderItemClassName: 'storepress-slider-item',
		sliderNavigationPrevious: '.storepress-slider-navigation-previous',
		sliderNavigationNext: '.storepress-slider-navigation-next',
		sliderPagination: '.storepress-slider-pagination > button',
	};

	// Collecting settings from html attribute
	const ATTRIBUTE = 'slider-settings'; //

	// Do what you need and return expose fn.
	const init = () => {
		this.$element = element; // slider-wrapper
		this.settings = {
			...DEFAULTS,
			...options,
			...getOptionsFromAttribute(this.$element, ATTRIBUTE),
			...PRIVATE,
		};

		this.slidesToShow = 0;
		this.slidesToScroll = 0;
		this.isInfinite = true;
		this.$container = this.$element.querySelector(
			this.settings.containerElement
		);
		this.$slider = this.$element.querySelector(this.settings.sliderElement);
		this.$items = this.$slider.querySelectorAll(':scope > *'); // Select direct children
		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;
		this.totalItems = this.$items.length;
		this.initialSlide = 0;
		this.currentIndex = 0;
		this.currentDot = 0;
		this.totalDots = 0;
		this.itemGap = 0;
		this.dotsData = {};
		this.itemsData = {};

		initial();

		initialPaging();

		cloneItems();

		addClasses();

		addEvents();

		return expose();
	};

	const initial = () => {
		// Add Container A11y
		this.$container.setAttribute('aria-live', 'polite');

		// Add Item Index
		let activeClassAdded = false;
		this.$items.forEach(($item, index) => {
			$item.classList.add(this.settings.sliderItemClassName);
			$item.setAttribute('aria-hidden', 'true');
			$item.dataset.index = index + 1;

			$item.querySelectorAll('img').forEach(($img) => {
				$img.setAttribute('draggable', false);
			});

			if (!activeClassAdded) {
				if ($item.classList.contains('active')) {
					activeClassAdded = true;
					this.initialSlide = parseInt($item.dataset.index, 10);
				}
			}
		});

		if (!activeClassAdded) {
			this.$items[0].classList.add('active');
			this.initialSlide = 1;
		}

		const computedStyle = window.getComputedStyle(this.$element);

		// Infinite
		const infiniteString = computedStyle
			.getPropertyValue(this.settings.isInfiniteCSSProperty)
			.toLowerCase();

		this.isInfinite = cssVariableIsTrue(infiniteString);

		// Horizontal
		const horizontalString = computedStyle
			.getPropertyValue(this.settings.isHorizontalCSSProperty)
			.toLowerCase();

		this.isHorizontal = cssVariableIsTrue(horizontalString);

		// Always center
		const alwaysCenterString = computedStyle
			.getPropertyValue(this.settings.isAlwaysCenterCSSProperty)
			.toLowerCase();

		this.isCenter = cssVariableIsTrue(alwaysCenterString);

		// Goto Index on Click
		const activeOnSelect = computedStyle
			.getPropertyValue(this.settings.isActiveSelectCSSProperty)
			.toLowerCase();

		this.isActiveOnSelect = cssVariableIsTrue(activeOnSelect);

		// Slide To Show
		this.slidesToShow = parseInt(
			computedStyle.getPropertyValue(
				this.settings.visibleItemsCSSProperty
			),
			10
		);

		this.slidesToScroll = parseInt(
			computedStyle.getPropertyValue(this.settings.moveItemsCSSProperty),
			10
		);

		// Item GAP
		this.itemGap = parseInt(
			computedStyle.getPropertyValue(this.settings.itemGapCSSProperty),
			10
		);

		if (this.slidesToShow < this.slidesToScroll) {
			this.slidesToScroll = this.slidesToShow;
		}

		// Control from CSS
		this.$element.classList.remove('is-vertical');
		this.$element.classList.remove('is-horizontal');
		this.$element.classList.remove('is-active-center');

		if (this.isHorizontal) {
			this.$element.classList.add('is-horizontal');
		} else {
			this.$element.classList.add('is-vertical');
		}

		this.totalDots = getTotalDots();
		this.dotsData = createDotsObject();
		this.itemsData = createItemObject();

		// console.log(this.dotsData);

		const initialIndex = getBalancedIndex(this.initialSlide);
		const initialDot = getDotIndexByItemIndex(initialIndex);
		setCurrentIndex(initialIndex);
		setCurrentDot(initialDot);
	};

	const initialPaging = () => {
		const $button = this.$element.querySelector(
			this.settings.sliderPagination
		);

		$button.style.display = 'none';
		//$button.setAttribute('aria-hidden'); // removeProperty

		const $parent = $button.parentElement;

		for (let i = 1; i <= this.totalDots; i++) {
			const $cloned = $button.cloneNode(true);
			$cloned.classList.remove('current');
			$cloned.classList.remove('active');
			$cloned.removeAttribute('aria-current');
			$cloned.removeAttribute('aria-hidden');
			$cloned.style.removeProperty('display');

			const itemIndex = getItemIndexByDotIndex(i);

			$cloned.classList.add('dot');

			if (this.currentDot === i) {
				$cloned.setAttribute('aria-current', 'true');
				$cloned.classList.add('current');
			}

			$cloned.setAttribute(
				'aria-label',
				`${this.settings.sliderDotsTitle} ${itemIndex}`
			);

			$cloned.dataset.targetSlide = itemIndex;
			$cloned.dataset.dotIndex = i;

			$cloned.innerText = itemIndex;

			$cloned.addEventListener('click', handleDot);

			$parent.append($cloned);
		}
	};

	const handleDot = (event) => {
		const index = parseInt(event.target.dataset.dotIndex, 10);

		goToDot(index);
	};

	const goToDot = (dotIndex) => {
		if (dotIndex < 1 || dotIndex > this.totalDots) {
			console.warn(
				`Dot index ${dotIndex} is not available. Available range ${1} - ${this.totalDots}`
			);
			return;
		}

		addAnimatingClass();
		const currentDot = dotIndex;
		const index = getItemIndexByDotIndex(currentDot);
		setCurrentIndex(index);
		setCurrentDot(currentDot);
		updatePaging(dotIndex);
	};

	const goToSlide = (slideIndex) => {
		const index = this.isInfinite ? slideIndex : slideIndex - 1;

		if (slideIndex < 1 || slideIndex > this.totalItems) {
			console.warn(
				`Item index ${slideIndex} is not available. Available range ${1} - ${this.totalItems}`
			);
			return;
		}

		const dotIndex = getDotIndexByItemIndex(index);

		goToDot(dotIndex);
	};

	const updatePaging = (currentDot) => {
		const $buttons = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		// Next Reset
		if (this.currentDot > this.totalDots) {
			currentDot = 1;
		}

		if (this.currentDot < 1) {
			currentDot = this.totalDots;
		}

		// const currentDot = this.currentDot;
		$buttons.forEach(($button, index) => {
			$button.removeAttribute('aria-current', 'true');
			$button.classList.remove('current');

			if (currentDot === index) {
				$button.setAttribute('aria-current', 'true');
				$button.classList.add('current');
			}
		});
	};

	const getTotalDots = () => {
		return (
			Math.ceil(
				(this.totalItems - this.slidesToShow) / this.slidesToScroll
			) + 1
		);
	};

	const createDotsObject = () => {
		const dotsData = {};

		dotsData[1] = this.isInfinite ? this.slidesToShow : 0;
		let currentIndex = this.isInfinite ? this.slidesToShow : 0;

		for (let index = 2; index <= this.totalDots; index++) {
			let ci = currentIndex + this.slidesToScroll;

			if (this.isInfinite && this.totalItems <= ci) {
				ci = this.totalItems;
			}

			if (!this.isInfinite && this.totalItems - this.slidesToShow <= ci) {
				ci = this.totalItems - this.slidesToShow;
			}

			dotsData[index] = ci;

			currentIndex = ci;
		}

		if (this.isInfinite) {
			dotsData[0] = 0;
			dotsData[this.totalDots + 1] = this.totalItems + this.slidesToShow;
		}

		return dotsData;
	};

	const createItemArray = () => {
		return Array.from({ length: this.totalItems }, (_, index) =>
			this.isInfinite ? index + 1 : index
		);
	};

	const createItemGroup = () => {
		const result = [];
		const uniqueMap = new Map();
		const items = createItemArray();

		let index = 0;

		while (index + this.slidesToShow <= this.totalItems) {
			result.push(items.slice(index, index + this.slidesToShow));
			index += this.slidesToScroll;
		}

		// Add the last segment if needed to cover any trailing elements
		if (index < items.length) {
			result.push(items.slice(items.length - this.slidesToShow));
		}

		result.forEach((sub) => {
			const key = JSON.stringify(sub);
			if (!uniqueMap.has(key)) {
				uniqueMap.set(key, sub);
			}
		});

		return Array.from(uniqueMap.values());
	};

	const createItemObject = () => {
		const data = createItemGroup();
		const obj = {}; // 1: 1

		for (let i = 1; i <= data.length; i++) {
			const key = i - 1;
			for (const item of data[key]) {
				if (!Object.hasOwn(obj, item)) {
					obj[item] = i;
				}
			}
		}
		return obj;
	};

	const getDotIndexByItemIndex = (index) => {
		return this.itemsData[index];
	};

	const getItemIndexByDotIndex = (index) => {
		return this.dotsData[index];
	};

	const getBalancedIndex = (index) => {
		const dotIndex = this.itemsData[index];
		return this.dotsData[dotIndex];
	};

	const cssVariableIsTrue = (string) => {
		return string === 'true' || string === '1' || string === 'yes';
	};

	const setCurrentIndex = (index) => {
		this.currentIndex = parseInt(index, 10);
		this.$element.style.setProperty('--_current-index', this.currentIndex);
	};

	const setCurrentDot = (index) => {
		this.currentDot = parseInt(index, 10);
	};

	const cloneItems = () => {
		if (!this.isInfinite) {
			return;
		}

		const lastItemsIndex = this.totalItems - 1;

		const itemsToClone = this.slidesToShow;

		for (let index = 0; index < itemsToClone; index++) {
			const nodeForAppend = this.$items[index].cloneNode(true);
			const nodeForPrepend =
				this.$items[lastItemsIndex - index].cloneNode(true);

			nodeForAppend.classList.add('clone');
			nodeForAppend.classList.remove('current');
			nodeForAppend.classList.remove('active');

			nodeForPrepend.classList.add('clone');
			nodeForPrepend.classList.remove('active');
			nodeForPrepend.classList.remove('current');

			// Append First Items
			this.$slider.append(nodeForAppend);

			// Prepend Last Items
			this.$slider.prepend(nodeForPrepend);
		}
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll(':scope > *');

		$items[this.currentIndex].setAttribute('aria-hidden', 'false');
		$items[this.currentIndex].classList.add('current');

		for (let i = 0; i < this.slidesToShow; i++) {
			const key = i + this.currentIndex;
			$items[key].setAttribute('aria-hidden', 'false');
			$items[key].classList.add('active');
		}
	};

	const isAnimating = () => {
		return this.$slider.classList.contains('animating');
	};

	const addAnimatingClass = () => {
		this.$slider.classList.add('animating');
	};

	const removeAnimatingClass = () => {
		this.$slider.classList.remove('animating');
	};

	const addEvents = () => {
		this.$element
			.querySelector(this.settings.sliderNavigationPrevious)
			.addEventListener('click', handlePrev);

		this.$element
			.querySelector(this.settings.sliderNavigationNext)
			.addEventListener('click', handleNext);

		this.$slider.addEventListener('transitionstart', beforeSlide);
		this.$slider.addEventListener('transitionend', afterSlide);

		this.cleanupSwipe = swipeEvent(this.$container, handleSwipe, {
			offset: 50,
		});
		this.$container.addEventListener('swipe', handleSwipe);
	};

	const removeClasses = () => {
		//this.$slider.classList.remove( 'animating' );
		const $items = this.$slider.querySelectorAll(':scope > *');
		$items.forEach(($item) => {
			$item.setAttribute('aria-hidden', 'true');
			$item.classList.remove('active');
			$item.classList.remove('current');
		});
	};

	const beforeSlide = () => {
		removeClasses();
		// @TODO: trigger event for before slide
	};

	const afterSlide = () => {
		// @TODO: trigger event for before slide

		removeAnimatingClass();

		// Reset Next
		if (this.currentDot > this.totalDots) {
			setCurrentDot(1);
			const index = getItemIndexByDotIndex(1);
			setCurrentIndex(index);
		}

		// Reset Prev
		if (this.currentDot < 1) {
			setCurrentDot(this.totalDots);
			const index = getItemIndexByDotIndex(this.totalDots);
			setCurrentIndex(index);
		}

		addClasses();
	};

	const handleNext = (event) => {
		event.preventDefault();
		if (isAnimating()) {
			return;
		}
		slideNext();
	};

	const handlePrev = (event) => {
		event.preventDefault();
		if (isAnimating()) {
			return;
		}
		slidePrev();
	};

	const slidePrev = () => {
		const currentDot = this.currentDot - 1;

		if (!this.isInfinite && currentDot <= 0) {
			return;
		}

		addAnimatingClass();

		const index = getItemIndexByDotIndex(currentDot);
		setCurrentIndex(index);
		setCurrentDot(currentDot);
		updatePaging(currentDot);
	};

	const slideNext = () => {
		const currentDot = this.currentDot + 1;

		if (!this.isInfinite && currentDot > this.totalDots) {
			return;
		}

		addAnimatingClass();

		const index = getItemIndexByDotIndex(currentDot);
		setCurrentIndex(index);
		setCurrentDot(currentDot);
		updatePaging(currentDot);
	};

	const handleSwipe = (event) => {
		if (isAnimating()) {
			return;
		}

		const { x, y, left, right, top, bottom, moving, done } = event.detail;

		const gapValue = this.currentIndex * (this.itemGap / this.slidesToShow);

		const currentWidth =
			(this.currentIndex * this.sliderWidth) / this.slidesToShow;
		const currentHeight =
			(this.currentIndex * this.sliderHeight) / this.slidesToShow;

		const horizontalValue = Math.ceil(currentWidth + gapValue - x);
		const verticalValue = Math.ceil(currentHeight + gapValue - y);

		if (moving) {
			this.$slider.style.setProperty(
				'--_horizontal-value',
				`-${horizontalValue}px`
			);

			this.$slider.style.setProperty(
				'--_vertical-value',
				`-${verticalValue}px`
			);
		}

		if (done) {
			this.$slider.classList.add('animating');
			this.$slider.style.removeProperty('--_horizontal-value');
			this.$slider.style.removeProperty('--_vertical-value');
		}

		if (done && (left || top)) {
			slideNext();
			triggerEvent(this.$element, 'slide_next_swiped');
		}

		if (done && (right || bottom)) {
			slidePrev();
			triggerEvent(this.$element, 'slide_prev_swiped');
		}
	};

	const removeEvents = () => {
		const $buttons = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		$buttons.forEach(($button) => {
			$button.removeEventListener('click', handleDot);

			if ($button.classList.contains('current')) {
				$button.remove();
			}
		});

		this.$element
			.querySelector(this.settings.sliderNavigationPrevious)
			.removeEventListener('click', handlePrev);

		this.$element
			.querySelector(this.settings.sliderNavigationNext)
			.removeEventListener('click', handleNext);

		this.$slider.removeEventListener('transitionstart', beforeSlide);
		this.$slider.removeEventListener('transitionend', afterSlide);

		this.cleanupSwipe();
		// this.$container.removeEventListener( 'swipe', handleSwipe );
	};

	const reset = () => {
		removeEvents();

		this.$slider.querySelectorAll(':scope > .clone').forEach(($cloned) => {
			$cloned.remove();
		});

		setCurrentIndex(0);
		setCurrentDot(0);
		removeClasses();

		this.$slider
			.querySelectorAll(':scope > *')
			[this.initialSlide].classList.add('active');
		this.$element.classList.remove('is-horizontal');
		this.$element.classList.remove('is-horizontal');
		this.$element.classList.remove('is-active-center');
	};

	// Expose to public.
	const expose = () => ({
		handlePrev,
		handleNext,
		removeEvents,
		goToDot,
		goToSlide,
		reset,
	});

	return init();
}

export { Plugin };
