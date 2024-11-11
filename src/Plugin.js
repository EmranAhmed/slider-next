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
		containerElement: '.storepress-slider-container',
		sliderElement: '.storepress-slider',
		sliderDotsTitle: 'Goto Slider',
		defaultItemClassName: 'active',
	};

	const PRIVATE = {
		slidesToScrollCSSProperty: '--slides-to-scroll',
		slidesToShowCSSProperty: '--slides-to-show',
		isInfiniteCSSProperty: '--infinite',
		showDotsCSSProperty: '--show-pagination',
		showArrowCSSProperty: '--show-navigation',
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

	const CLASSES = {
		itemClassName: 'storepress-slider-item',
		itemVisibleClassName: 'visible',
		itemCurrentClassName: 'current',
		itemCloneClassName: 'clone',

		elementClassName: '',
		elementVerticalClassName: 'is-vertical',
		elementHorizontalClassName: 'is-horizontal',
		elementCenterClassName: 'is-active-center',
		elementInfiniteClassName: 'has-infinite',

		sliderContainerClassName: '',
		sliderContainerPositionStartClassName: 'position-start',
		sliderContainerPositionMiddleClassName: 'position-middle',
		sliderContainerPositionEndClassName: 'position-end',

		sliderClassName: '',
		sliderAnimatingClassName: 'animating',

		dotClassName: 'dot',
		dotCurrentClassName: 'current',
	};

	// Do what you need and return expose fn.
	const init = () => {
		this.$element = element; // slider-wrapper
		this.settings = {
			...DEFAULTS,
			...options,
			...getOptionsFromAttribute(this.$element, ATTRIBUTE),
			...PRIVATE,
		};

		this.slidesToShow = 1;
		this.slidesToScroll = 1;
		this.isInfinite = true;
		this.$container = this.$element.querySelector(
			this.settings.containerElement
		);
		this.$slider = this.$element.querySelector(this.settings.sliderElement);
		this.$items = this.$slider.querySelectorAll(':scope > *'); // Select direct children
		this.sliderWidth = 0;
		this.sliderHeight = 0;
		this.totalItems = this.$items.length;
		this.initialSlide = 0;
		this.currentIndex = 0;
		this.currentDot = 0;
		this.totalDots = 0;
		this.itemGap = 0;
		this.centerItem = 0;
		this.isCenter = false;
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

		const computedStyle = window.getComputedStyle(this.$element);

		// Infinite
		const infiniteString = computedStyle
			.getPropertyValue(this.settings.isInfiniteCSSProperty)
			.toLowerCase();

		this.isInfinite = cssVariableIsTrue(infiniteString);

		// Add Item Index
		let activeClassAdded = false;
		this.$items.forEach(($item, index) => {
			$item.classList.add(CLASSES.itemClassName);
			$item.setAttribute('aria-hidden', 'true');
			$item.dataset.index = this.isInfinite ? index + 1 : index;

			// Disable Image dragging
			$item.querySelectorAll('img').forEach(($img) => {
				$img.setAttribute('draggable', false);
			});

			if (
				!activeClassAdded &&
				$item.classList.contains(this.settings.defaultItemClassName)
			) {
				activeClassAdded = true;
				this.initialSlide = parseInt($item.dataset.index, 10);
				$item.classList.add(CLASSES.itemCurrentClassName);
				$item.classList.remove(this.settings.defaultItemClassName);
			}
		});

		if (!activeClassAdded) {
			this.$items[0].classList.add(CLASSES.itemCurrentClassName);
			this.initialSlide = 1;
		}

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
				this.settings.slidesToShowCSSProperty
			),
			10
		);

		this.slidesToScroll = parseInt(
			computedStyle.getPropertyValue(
				this.settings.slidesToScrollCSSProperty
			),
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

		this.validCenter =
			this.slidesToShow > 2 &&
			this.slidesToShow % 2 === 1 &&
			this.isCenter;

		if (!this.validCenter) {
			this.isCenter = false;
		}

		if (this.isCenter) {
			this.$element.classList.add(CLASSES.elementCenterClassName);
			this.slidesToScroll = 1;
			this.centerItem = (this.slidesToShow - this.slidesToScroll) / 2;
		}

		// Control from CSS
		this.$element.classList.remove(CLASSES.elementVerticalClassName);
		this.$element.classList.remove(CLASSES.elementHorizontalClassName);
		this.$element.classList.remove(CLASSES.elementCenterClassName);

		if (this.isInfinite) {
			this.$element.classList.add(CLASSES.elementInfiniteClassName);
		}

		if (this.isHorizontal) {
			this.$element.classList.add(CLASSES.elementHorizontalClassName);
		} else {
			this.$element.classList.add(CLASSES.elementVerticalClassName);
		}

		this.totalDots = getTotalDots();
		this.dotsData = createDotsObject();
		this.itemsData = createItemObject();

		/*console.log(this.totalDots);
		console.log(this.dotsData);
		console.log(this.itemsData);*/

		const initialIndex = getBalancedIndex(this.initialSlide);
		const initialDot = getDotIndexByItemIndex(initialIndex);
		setCurrentIndex(initialIndex);
		setCurrentDot(initialDot);

		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;
	};

	const initialPaging = () => {
		const $button = this.$element.querySelector(
			this.settings.sliderPagination
		);

		$button.style.display = 'none';

		const $parent = $button.parentElement;

		for (let i = 1; i <= this.totalDots; i++) {
			const $cloned = $button.cloneNode(true);
			$cloned.classList.remove(CLASSES.dotCurrentClassName);
			$cloned.removeAttribute('aria-current');
			$cloned.removeAttribute('aria-hidden');
			$cloned.style.removeProperty('display');

			const itemIndex = getItemIndexByDotIndex(i);

			$cloned.classList.add(CLASSES.dotClassName);

			if (this.currentDot === i) {
				$cloned.setAttribute('aria-current', 'true');
				$cloned.classList.add(CLASSES.dotCurrentClassName);
			}

			$cloned.setAttribute(
				'aria-label',
				`${this.settings.sliderDotsTitle} ${itemIndex}`
			);

			$cloned.dataset.targetSlide = itemIndex;
			$cloned.dataset.dotIndex = i.toString();

			$cloned.innerText = itemIndex;

			$cloned.addEventListener('click', handleDot);

			$parent.append($cloned);
		}
	};

	const updatePaging = (currentDot) => {
		const $buttons = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		// Next Reset
		if (this.currentDot > this.totalDots) {
			currentDot = 1;
		}

		// Prev Reset
		if (this.currentDot < 1) {
			currentDot = this.totalDots;
		}

		$buttons.forEach(($button, index) => {
			$button.removeAttribute('aria-current', 'true');
			$button.classList.remove(CLASSES.dotCurrentClassName);

			if (currentDot === index) {
				$button.setAttribute('aria-current', 'true');
				$button.classList.add(CLASSES.dotCurrentClassName);
			}
		});
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

		if (dotIndex === this.currentDot) {
			removeAnimatingClass();
		}

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

	const getTotalDots = () => {
		if (this.isInfinite) {
			return Math.ceil(this.totalItems / this.slidesToScroll);
		}

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
		// const endIndex = this.totalDots + this.slidesToShow;

		for (let index = 2; index <= this.totalDots; index++) {
			const ci = currentIndex + this.slidesToScroll;

			dotsData[index] = ci;

			currentIndex = ci;
		}

		if (this.isInfinite) {
			dotsData[0] = this.slidesToShow - 1;
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

		if (this.currentDot === 1) {
			// start
			this.$container.classList.remove(
				CLASSES.sliderContainerPositionEndClassName,
				CLASSES.sliderContainerPositionMiddleClassName
			);
			this.$container.classList.add(
				CLASSES.sliderContainerPositionStartClassName
			);
		}

		if (this.currentDot > 1 && this.currentDot < this.totalDots) {
			// middle
			this.$container.classList.remove(
				CLASSES.sliderContainerPositionStartClassName,
				CLASSES.sliderContainerPositionEndClassName
			);
			this.$container.classList.add(
				CLASSES.sliderContainerPositionMiddleClassName
			);
		}

		if (this.currentDot === this.totalDots) {
			// end
			this.$container.classList.remove(
				CLASSES.sliderContainerPositionStartClassName,
				CLASSES.sliderContainerPositionMiddleClassName
			);

			this.$container.classList.add(
				CLASSES.sliderContainerPositionEndClassName
			);
		}

		// Infinite
		if (!this.isInfinite) {
			//return;
		}
		if (this.currentDot < 1) {
			// Infinite End
			this.$container.classList.remove(
				CLASSES.sliderContainerPositionStartClassName,
				CLASSES.sliderContainerPositionMiddleClassName
			);
			this.$container.classList.add(
				CLASSES.sliderContainerPositionEndClassName
			);
		}

		if (this.currentDot > this.totalDots) {
			// Infinite Start
			this.$container.classList.remove(
				CLASSES.sliderContainerPositionEndClassName,
				CLASSES.sliderContainerPositionMiddleClassName
			);
			this.$container.classList.add(
				CLASSES.sliderContainerPositionStartClassName
			);
		}
	};

	const cloneItems = () => {
		if (!this.isInfinite) {
			return;
		}

		const lastItemsIndex = this.totalItems - 1;

		// const itemsToClone = this.slidesToShow + this.centerItem;
		const itemsToClone = this.slidesToShow;

		for (let index = 0; index < itemsToClone; index++) {
			const nodeForAppend = this.$items[index].cloneNode(true);
			const nodeForPrepend =
				this.$items[lastItemsIndex - index].cloneNode(true);

			// Append
			nodeForAppend.classList.remove(
				CLASSES.itemCurrentClassName,
				CLASSES.itemVisibleClassName
			);
			nodeForAppend.classList.add(CLASSES.itemCloneClassName);

			// Prepend
			nodeForPrepend.classList.remove(
				CLASSES.itemCurrentClassName,
				CLASSES.itemVisibleClassName
			);
			nodeForPrepend.classList.add(CLASSES.itemCloneClassName);

			// Append First Items
			this.$slider.append(nodeForAppend);

			// Prepend Last Items
			this.$slider.prepend(nodeForPrepend);
		}
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll(':scope > *');

		$items[this.currentIndex].setAttribute('aria-hidden', 'false');
		$items[this.currentIndex].classList.add(CLASSES.itemCurrentClassName);

		if (this.isCenter) {
			const start = this.currentIndex - this.centerItem;
			const end = this.currentIndex + this.centerItem;

			for (let i = start; i <= end; i++) {
				//$items[i].setAttribute('aria-hidden', 'false');
				//$items[i].classList.add(CLASSES.itemVisibleClassName);
			}
		} else {
			for (let i = 0; i < this.slidesToShow; i++) {
				const key = i + this.currentIndex;
				$items[key].setAttribute('aria-hidden', 'false');
				$items[key].classList.add(CLASSES.itemVisibleClassName);
			}
		}
	};

	const isAnimating = () => {
		return this.$slider.classList.contains(
			CLASSES.sliderAnimatingClassName
		);
	};

	const addAnimatingClass = () => {
		this.$slider.classList.add(CLASSES.sliderAnimatingClassName);
	};

	const removeAnimatingClass = () => {
		this.$slider.classList.remove(CLASSES.sliderAnimatingClassName);
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
		const $items = this.$slider.querySelectorAll(':scope > *');
		$items.forEach(($item) => {
			$item.setAttribute('aria-hidden', 'true');
			$item.classList.remove(CLASSES.itemCurrentClassName);
			$item.classList.remove(CLASSES.itemVisibleClassName);
		});
	};

	const beforeSlide = () => {
		removeClasses();
		triggerEvent(this.$element, 'beforeSlide', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
		});
	};

	const afterSlide = () => {
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

		triggerEvent(this.$element, 'afterSlide', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
		});
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

		const horizontalValue = Math.ceil(currentWidth + gapValue - x) * -1;
		const verticalValue = Math.ceil(currentHeight + gapValue - y) * -1;
		// Disable over swipe
		if (!this.isInfinite) {
			if (this.currentDot === this.totalDots && x < 0) {
				return;
			}

			if (this.currentDot === 1 && x > 0) {
				return;
			}
		}

		if (moving) {
			this.$slider.style.setProperty(
				'--_horizontal-value',
				`${horizontalValue}px`
			);

			this.$slider.style.setProperty(
				'--_vertical-value',
				`${verticalValue}px`
			);
		}

		if (done) {
			addAnimatingClass();
			this.$slider.style.removeProperty('--_horizontal-value');
			this.$slider.style.removeProperty('--_vertical-value');
		}

		if (done && (left || top)) {
			slideNext();
		}

		if (done && (right || bottom)) {
			slidePrev();
		}
	};

	const removeEvents = () => {
		const $dots = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		$dots.forEach(($dot) => {
			$dot.removeEventListener('click', handleDot);

			if ($dot.classList.contains(CLASSES.dotClassName)) {
				$dot.remove();
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

		const cloneSelector = `:scope > .${CLASSES.itemCloneClassName}`;

		this.$slider.querySelectorAll(cloneSelector).forEach(($cloned) => {
			$cloned.remove();
		});

		setCurrentIndex(0);
		setCurrentDot(0);
		removeClasses();

		this.$slider
			.querySelectorAll(':scope > *')
			[
				this.initialSlide
			].classList.add(this.settings.defaultItemClassName);

		this.$element.classList.remove(
			CLASSES.elementInfiniteClassName,
			CLASSES.elementHorizontalClassName,
			CLASSES.elementVerticalClassName,
			CLASSES.elementCenterClassName
		);
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
