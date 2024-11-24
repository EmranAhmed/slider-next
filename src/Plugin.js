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
		isInfiniteCSSProperty: '--infinite-slides',
		showDotsCSSProperty: '--show-pagination',
		showArrowCSSProperty: '--show-navigation',
		isHorizontalCSSProperty: '--is-horizontal',
		isAlwaysCenterCSSProperty: '--is-always-center',
		isActiveSelectCSSProperty: '--is-active-select',
		itemGapCSSProperty: '--slider-item-gap',
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
		elementHasInfiniteClassName: 'has-infinite',
		elementHasDotClassName: 'has-dots',
		elementHasArrowClassName: 'has-arrow',

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
		this.isActiveOnSelect = false;
		this.dotsData = {};
		this.itemsData = {};
		this.isSwiping = false;
		this.data = {};

		initial();

		initialPaging();

		cloneItems();

		addClasses();

		addEvents();

		return expose();
	};

	const getData = () => {
		const show = this.slidesToShow;
		const move = this.slidesToScroll;
		const infinite = this.isInfinite;
		// const center = false;
		const totalItems = this.totalItems;
		// const clonedTotal = totalItems + ( infinite ? ((show * 2) - move) : 0)
		const startIndex = infinite ? show : 0;
		const endIndex = infinite ? totalItems + show - 1 : totalItems - show;

		let dotIndex = 1; // start  dot index from 1
		const data = {};
		const dots = [];
		const dotToIndexMap = {};
		const itemToIndexMap = {};
		const indexToDotMap = {};

		let lastIndex = 0;
		let item = 1;
		for (let index = startIndex; index <= endIndex; index += move) {
			data[dotIndex] = [];
			for (let x = index; x < index + move; x++) {
				if (!Object.hasOwn(dotToIndexMap, dotIndex)) {
					dotToIndexMap[dotIndex] = x;
				}

				if (endIndex >= x) {
					data[dotIndex].push(x);
					indexToDotMap[x] = dotIndex;
					lastIndex = x;
					itemToIndexMap[item] = x;
					item++;
				}
			}
			dots.push(dotIndex);
			dotIndex++;
		}

		const lastDotIndex = dots.at(-1);
		const firstDotIndex = dots.at(0);

		// for (let y = lastIndex + 1; y < clonedTotal; y++) {
		// data[lastDotIndex].push( y );
		// }

		for (let i = 1; i <= totalItems; i++) {
			if (!Object.hasOwn(itemToIndexMap, i)) {
				itemToIndexMap[i] = lastIndex;
			}
		}

		return {
			data,
			dots,
			dotToIndexMap,
			itemToIndexMap,
			indexToDotMap,
			firstDotIndex,
			lastDotIndex,
		};
	};

	const getElementComputedStyle = (cssProperty) => {
		return window
			.getComputedStyle(this.$element)
			.getPropertyValue(cssProperty);
	};

	const getSliderComputedStyle = (cssProperty) => {
		return window
			.getComputedStyle(this.$slider)
			.getPropertyValue(cssProperty);
	};

	const initial = () => {
		// Add Container A11y
		this.$container.setAttribute('aria-live', 'polite');

		// Infinite
		const infiniteString = getElementComputedStyle(
			this.settings.isInfiniteCSSProperty
		).toLowerCase();

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
		const horizontalString = getElementComputedStyle(
			this.settings.isHorizontalCSSProperty
		).toLowerCase();

		this.isHorizontal = cssVariableIsTrue(horizontalString);

		// Always center
		const alwaysCenterString = getElementComputedStyle(
			this.settings.isAlwaysCenterCSSProperty
		).toLowerCase();

		this.isCenter = cssVariableIsTrue(alwaysCenterString);

		// Goto Index on Click
		const activeOnSelect = getElementComputedStyle(
			this.settings.isActiveSelectCSSProperty
		).toLowerCase();

		this.isActiveOnSelect = cssVariableIsTrue(activeOnSelect);

		// Slide To Show
		this.slidesToShow = parseInt(
			getElementComputedStyle(this.settings.slidesToShowCSSProperty),
			10
		);

		this.slidesToScroll = parseInt(
			getElementComputedStyle(this.settings.slidesToScrollCSSProperty),
			10
		);

		// Item GAP
		this.itemGap = parseInt(getSliderComputedStyle('gap'), 10);

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

		// Control from CSS
		this.$element.classList.remove(CLASSES.elementVerticalClassName);
		this.$element.classList.remove(CLASSES.elementHorizontalClassName);
		this.$element.classList.remove(CLASSES.elementCenterClassName);

		if (this.isCenter) {
			this.$element.classList.add(CLASSES.elementCenterClassName);
			this.slidesToScroll = 1;
			this.centerItem = (this.slidesToShow - this.slidesToScroll) / 2;
			this.isActiveOnSelect = true;
			this.$element.style.setProperty(
				this.settings.slidesToScrollCSSProperty,
				this.slidesToScroll
			);
		}

		if (this.isInfinite) {
			this.$element.classList.add(CLASSES.elementHasInfiniteClassName);
		}

		if (this.isHorizontal) {
			this.$element.classList.add(CLASSES.elementHorizontalClassName);
		} else {
			this.$element.classList.add(CLASSES.elementVerticalClassName);
		}

		this.totalDots = getTotalDots();
		this.dotsData = createDotsObject();
		this.itemsData = createItemObject();
		this.data = getData();

		/*console.log('total dot', this.totalDots);
		console.log('dots data', this.dotsData);
		console.log('item', this.itemsData);*/
		// console.log(this.data);

		const initialIndex = getBalancedIndex(this.initialSlide);
		const initialDot = getDotIndexByItemIndex(initialIndex);
		setCurrentIndex(initialIndex);
		setCurrentDot(initialDot);

		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;

		triggerEvent(this.$element, 'afterInit', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
			totalDots: this.totalDots,
		});
	};

	const initialPaging = () => {
		const $button = this.$element.querySelector(
			this.settings.sliderPagination
		);

		if (null === $button) {
			return;
		}

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

	const handleItem = (event) => {
		if (this.isSwiping) {
			return false;
		}

		const index = parseInt(event.target.dataset.index, 10);

		goToSlide(index);
	};

	const goToDot = (dotIndex) => {
		if (dotIndex < 1 || dotIndex > this.totalDots) {
			throw new RangeError(
				`Dot index ${dotIndex} is not available. Available range ${1} - ${this.totalDots}`
			);
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

		triggerEvent(this.$element, 'afterGotoDot', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
		});
	};

	const goToSlide = (slideIndex) => {
		const index = this.isInfinite ? slideIndex : slideIndex - 1;

		if (slideIndex < 1 || slideIndex > this.totalItems) {
			throw new RangeError(
				`Item index ${slideIndex} is not available. Available range ${1} - ${this.totalItems}`
			);
		}

		const dotIndex = getDotIndexByItemIndex(index);

		const goto = this.slidesToScroll > 1 ? dotIndex : slideIndex;

		goToDot(goto);
	};

	const getTotalDots = () => {
		if (this.isCenter) {
			return this.totalItems;
		}

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

		let endIndex = this.isInfinite
			? this.totalItems - this.slidesToShow
			: this.totalItems - this.slidesToShow;

		if (this.isCenter && !this.isInfinite) {
			endIndex = this.totalItems - 1;
		}

		for (let index = 2; index <= this.totalDots; index++) {
			let ci = currentIndex + this.slidesToScroll;

			if (!this.isInfinite && endIndex < ci) {
				ci = endIndex;
			}

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

		const slidesToShow = this.slidesToShow;

		while (index + slidesToShow <= this.totalItems) {
			result.push(items.slice(index, index + slidesToShow));
			index += this.slidesToScroll;
		}

		// Add the last segment if needed to cover any trailing elements
		if (index < items.length) {
			result.push(items.slice(items.length - slidesToShow));
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
		const ci = this.isInfinite
			? parseInt(index, 10) + this.slidesToScroll
			: parseInt(index, 10);

		this.currentIndex = ci;
		this.$element.style.setProperty('--_current-slider-index', ci);
	};

	const getCurrentIndex = () => {
		return this.currentIndex;
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

		// console.log('cc', this.centerItem);

		// const itemsToClone = this.slidesToShow + this.centerItem;
		const itemsToClone = this.slidesToShow + this.slidesToScroll;

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

	const toggleClasses = (index) => {
		const $items = this.$slider.querySelectorAll(':scope > *');

		$items[index].setAttribute('aria-hidden', 'false');
		$items[index].classList.add(CLASSES.itemCurrentClassName);

		const start = index - this.centerItem;
		const end = start + this.slidesToShow;

		for (let i = start; i < end; i++) {
			if (!$items[i]) {
				continue;
			}

			$items[i].setAttribute('aria-hidden', 'false');
			$items[i].classList.add(CLASSES.itemVisibleClassName);
		}
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll(':scope > *');

		$items[this.currentIndex].setAttribute('aria-hidden', 'false');
		$items[this.currentIndex].classList.add(CLASSES.itemCurrentClassName);

		const start = this.currentIndex - this.centerItem;
		const end = start + this.slidesToShow;

		for (let i = start; i < end; i++) {
			if (!$items[i]) {
				continue;
			}

			$items[i].setAttribute('aria-hidden', 'false');
			$items[i].classList.add(CLASSES.itemVisibleClassName);
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
		const $prevButton = this.$element.querySelector(
			this.settings.sliderNavigationPrevious
		);

		const $nextButton = this.$element.querySelector(
			this.settings.sliderNavigationNext
		);

		const $items = this.$slider.querySelectorAll(':scope > *');

		if (null !== $prevButton) {
			$prevButton.addEventListener('click', handlePrev);
		}

		if (null !== $nextButton) {
			$nextButton.addEventListener('click', handleNext);
		}

		this.$slider.addEventListener('transitionstart', beforeSlide);
		this.$slider.addEventListener('transitionend', afterSlide);

		this.cleanupSwipe = swipeEvent(this.$container, handleSwipe, {
			offset: 50,
		});
		this.$container.addEventListener('swipe', handleSwipe);

		if (this.isCenter && this.isActiveOnSelect) {
			$items.forEach(($item) => {
				$item.addEventListener('pointerup', handleItem);
			});
		}
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

		triggerEvent(this.$element, 'afterPrev', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
		});
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

		triggerEvent(this.$element, 'afterNext', {
			currentIndex: this.currentIndex,
			currentDot: this.currentDot,
		});
	};

	const handleSwipe = (event) => {
		if (isAnimating()) {
			return;
		}

		const gapCount = this.slidesToShow - 1;
		const gapSize = this.isCenter
			? ((this.itemGap / this.slidesToShow) * gapCount) / 2
			: 0;

		const { x, y, left, right, top, bottom, moving, done } = event.detail;

		const gapValue = getCurrentIndex() * (this.itemGap / this.slidesToShow);

		const currentWidth =
			((getCurrentIndex() - this.centerItem) * this.sliderWidth) /
			this.slidesToShow;
		const currentHeight =
			((getCurrentIndex() - this.centerItem) * this.sliderHeight) /
			this.slidesToShow;

		const horizontalValue =
			Math.ceil(currentWidth - gapSize + gapValue - x) * -1;
		const verticalValue =
			Math.ceil(currentHeight - gapSize + gapValue - y) * -1;
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
			this.isSwiping = true;

			// console.log(left);

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
			this.isSwiping = false;
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

		const $items = this.$slider.querySelectorAll(':scope > *');

		$dots.forEach(($dot) => {
			$dot.removeEventListener('click', handleDot);

			if ($dot.classList.contains(CLASSES.dotClassName)) {
				$dot.remove();
			}
		});

		$items.forEach(($item) => {
			$item.removeEventListener('pointerup', handleItem);
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
			CLASSES.elementHasInfiniteClassName,
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
