/**
 * External dependencies
 */
import {
	getOptionsFromAttribute,
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
		sliderCurrentIndexCSSProperty: '--_current-slider-index',
		slidesToScrollCSSProperty: '--slides-to-scroll',
		slidesToShowCSSProperty: '--slides-to-show',
		isInfiniteCSSProperty: '--infinite-slides',
		showDotsCSSProperty: '--show-pagination',
		showArrowCSSProperty: '--show-navigation',
		isHorizontalCSSProperty: '--is-horizontal',
		isAlwaysCenterCSSProperty: '--is-always-center',
		isActiveSelectCSSProperty: '--is-active-select',
		itemGapCSSProperty: '--slider-item-gap',
		slidesAutoPlayCSSProperty: '--slides-autoplay',
		slidesAutoPlayTimeoutCSSProperty: '--slides-autoplay-timeout',
		slidesShowControlPaginationCSSProperty: '--show-control-pagination',
		slidesShowControlNavigationCSSProperty: '--show-control-navigation',
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
		this.isAutoPlay = false;
		this.autoPlayTimeout = 0;
		this.autoPlayId = null;
		this.cleanupSwipe = noop();
		this.itemsToClone = 0;
		this.startIndex = 0;
		this.endIndex = 0;
		this.startDot = 0;
		this.endDot = 0;

		initial();

		initialPaging();

		cloneItems();

		addClasses();

		addEvents();

		startAutoPlay();

		return expose();
	};

	const noop = () => () => {};

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

		// AutoPlay
		const autoplayString = getElementComputedStyle(
			this.settings.slidesAutoPlayCSSProperty
		).toLowerCase();

		this.isAutoPlay = cssVariableIsTrue(autoplayString);

		this.autoPlayTimeout = parseInt(
			getElementComputedStyle(
				this.settings.slidesAutoPlayTimeoutCSSProperty
			),
			10
		);

		// Add Item Index
		let activeClassAdded = false;
		this.$items.forEach(($item, index) => {
			$item.classList.add(CLASSES.itemClassName);
			$item.setAttribute('aria-hidden', 'true');
			$item.dataset.index = index + 1;
			// $item.dataset.index = index;

			// Disable Image dragging
			$item.querySelectorAll('img').forEach(($img) => {
				$img.setAttribute('draggable', false);
			});

			if (
				!activeClassAdded &&
				$item.classList.contains(this.settings.defaultItemClassName)
			) {
				activeClassAdded = true;
				this.initialSlide = parseInt(index, 10);
				$item.classList.add(CLASSES.itemCurrentClassName);
				$item.classList.remove(this.settings.defaultItemClassName);
			}
		});

		if (!activeClassAdded) {
			this.$items[0].classList.add(CLASSES.itemCurrentClassName);
			this.initialSlide = 0;
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
			// this.isCenter = false;
		}

		// Control from CSS
		this.$element.classList.remove(
			CLASSES.elementVerticalClassName,
			CLASSES.elementHorizontalClassName,
			CLASSES.elementCenterClassName
		);

		if (this.isCenter) {
			this.$element.classList.add(CLASSES.elementCenterClassName);
			this.slidesToScroll = 1;
			this.centerItem = (this.slidesToShow - this.slidesToScroll) / 2;
			// this.isActiveOnSelect = true;
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

		this.itemsToClone = this.isInfinite
			? this.slidesToShow + this.slidesToScroll
			: 0;

		this.totalDots = getTotalDots();

		this.data = this.isInfinite
			? getDataForInfinite()
			: getDataForNonInfinite();

		this.startIndex = this.data.itemStartIndex;
		this.endIndex = this.data.itemEndIndex;
		this.startDot = this.data.dotStart;
		this.endDot = this.data.dotEnd;

		this.dotsData = this.data.dotToItem;
		this.itemsData = this.data.itemToDot; // get dot from item index

		const initialIndex = getBalancedIndex(
			this.isInfinite
				? this.initialSlide + this.itemsToClone
				: this.initialSlide
		);
		const initialDot = getDotIndexByItemIndex(initialIndex);

		setCurrentIndex(initialIndex);
		setCurrentDot(initialDot);

		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;

		// Pagination
		const showPagination = getElementComputedStyle(
			this.settings.slidesShowControlPaginationCSSProperty
		).toLowerCase();

		this.hasPagination = cssVariableIsTrue(showPagination);

		if (this.hasPagination) {
			this.$element.classList.add(CLASSES.elementHasDotClassName);
		}

		// Navigation
		const showNavigation = getElementComputedStyle(
			this.settings.slidesShowControlNavigationCSSProperty
		).toLowerCase();

		this.hasNavigation = cssVariableIsTrue(showNavigation);

		if (this.hasNavigation) {
			this.$element.classList.add(CLASSES.elementHasArrowClassName);
		}

		triggerEvent(this.$element, 'afterInit', {
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
			totalDots: this.totalDots,
		});
	};

	const cloneItems = () => {
		if (!this.isInfinite) {
			return;
		}

		const lastItemsIndex = this.totalItems - 1;

		for (let index = 0; index < this.itemsToClone; index++) {
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

		const $items = this.$slider.querySelectorAll(':scope > *');

		$items.forEach(($item, index) => {
			// $item.dataset.index = index + 1 - this.itemsToClone;
			// $item.dataset.index = index;

			if (index < this.startIndex) {
				//$item.dataset.index = index - this.startIndex;
				//$item.dataset.index = index * -1;
				$item.dataset.index = index * -1;
			}

			if (index > this.endIndex) {
				//$item.dataset.index = this.endIndex - index + 1;
				//$item.dataset.index = (index + 1 - this.itemsToClone) * -1;
				$item.dataset.index = index * -1;
			}
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
		/*if (currentDot < 0) {
			return;
		}*/

		const $buttons = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		let dot = currentDot;

		// Next Reset
		if (currentDot > this.totalDots) {
			dot = 1;
		}

		// Prev Reset
		if (currentDot < 1) {
			dot = this.totalDots;
		}

		$buttons.forEach(($button, index) => {
			$button.removeAttribute('aria-current', 'true');
			$button.classList.remove(CLASSES.dotCurrentClassName);

			if (dot === index) {
				$button.setAttribute('aria-current', 'true');
				$button.classList.add(CLASSES.dotCurrentClassName);
			}
		});
	};

	const handleDot = (event) => {
		const index = parseInt(event.target.dataset.dotIndex, 10);

		goToDot(index);
	};

	const resetClonedIndex = () => {
		const currentIndex = getCurrentIndex();

		if (currentIndex < this.startIndex || currentIndex > this.endIndex) {
			const prevIndex = currentIndex + this.totalItems;
			const nextIndex = currentIndex - this.totalItems;

			const ci = currentIndex < this.startIndex ? prevIndex : nextIndex;

			setCurrentIndex(ci);
		}
	};

	const goToClonedSlide = (index) => {
		const i = parseInt(index, 10);
		const pindex = i * -1;

		const prevIndex = pindex + this.totalItems;
		const nextIndex = pindex - this.totalItems;

		const ci = pindex < this.startIndex ? prevIndex : nextIndex;

		const dot = getDotIndexByItemIndex(ci);

		addAnimatingClass();
		setCurrentIndex(pindex);
		setCurrentDot(dot);
		updatePaging(dot);
	};

	const handleItem = (event) => {
		if (this.isSwiping) {
			return false;
		}

		const index = parseInt(event.currentTarget.dataset.index, 10);

		if (index > 0) {
			goToSlide(index);
		} else {
			goToClonedSlide(index);
		}
	};

	const goToDot = (dotIndex) => {
		if ((dotIndex < 1 || dotIndex > this.totalDots) && !this.isCenter) {
			throw new RangeError(
				`Dot index ${dotIndex} is not available. Available range ${1} - ${this.totalDots}`
			);
		}

		if (dotIndex === this.currentDot) {
			removeAnimatingClass();
			return;
		}

		addAnimatingClass();

		const currentDot = dotIndex;

		const index = getItemIndexByDotIndex(currentDot);
		setCurrentIndex(index);
		setCurrentDot(currentDot);

		/*if (currentDot < 0 || currentDot > this.totalDots + 1) {
			const dot =
				currentDot < 0
					? this.totalDots + currentDot
					: currentDot - this.totalDots;
			updatePaging(dot);
		} else {*/
		updatePaging(currentDot);
		//}

		restartAutoPlay();

		triggerEvent(this.$element, 'afterGotoDot', {
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
		});
	};

	const goToSlide = (slideIndex) => {
		const index = slideIndex - 1; // we start slide index from 1
		let getIndex = this.isInfinite ? index + this.itemsToClone : index;

		if (slideIndex < 1 || slideIndex > this.totalItems) {
			throw new RangeError(
				`Item index ${slideIndex} is not available. Available range ${1} - ${this.totalItems}`
			);
		}

		const limit = this.endIndex;

		if (!this.isInfinite && getIndex > limit) {
			getIndex = limit;
		}

		if (getIndex === getCurrentIndex()) {
			removeAnimatingClass();
			return;
		}
		addAnimatingClass();
		const dotIndex = getDotIndexByItemIndex(getIndex);

		setCurrentDot(dotIndex);
		updatePaging(dotIndex);
		setCurrentIndex(getIndex);
		restartAutoPlay();
		triggerEvent(this.$element, 'afterGotoSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
		});
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

	const getDataForInfinite = () => {
		const data = [];
		const dotToItem = {};
		const itemToDot = {};

		const startIndex = this.itemsToClone;
		const endIndex = this.totalItems + this.itemsToClone - 1;

		let current = startIndex;

		for (let i = 0; i < this.totalDots; i++) {
			const groupArray = [];

			// For all groups except the last one
			if (i < this.totalDots - 1) {
				for (
					let j = 0;
					j < this.slidesToScroll && current <= endIndex;
					j++
				) {
					groupArray.push(current);
					current++;
				}
			} else {
				// For the last group, add all remaining items
				while (current <= endIndex) {
					groupArray.push(current);
					current++;
				}
			}

			data.push(groupArray);
		}

		const start = this.itemsToClone - 1;
		const end = endIndex + 1;

		data.unshift([start]);
		data.push([end]);

		// Dot To Item
		for (let index = 0; index < data.length; index++) {
			// dotToItem.push(data[index].at(0));
			dotToItem[index] = data[index].at(0);
		}

		const dotStart = 1;
		const dotEnd = this.totalDots;

		for (let i = dotStart; i <= dotEnd; i++) {
			for (let j = 0; j < data[i].length; j++) {
				itemToDot[data[i][j]] = i;
			}
		}

		const itemStartIndex = this.itemsToClone;
		const itemEndIndex = this.totalItems + this.itemsToClone - 1;

		// console.log(dotToItem);

		// @TODO: Add dynamically
		/*dotToItem[-2] = 2;
		dotToItem[-1] = 3;
		dotToItem[9] = 13;
		dotToItem[10] = 14;*/

		return {
			data,
			dotToItem,
			itemToDot,
			itemStartIndex,
			itemEndIndex,
			dotStart,
			dotEnd,
		};
	};

	const getDataForNonInfinite = () => {
		const data = [];
		const dotToItem = {};
		const itemToDot = {};

		const startIndex = 0;
		const endIndex = this.totalItems - 1;

		let current = startIndex;

		for (let i = 0; i < this.totalDots; i++) {
			const groupArray = [];

			// For all groups except the last one
			if (i < this.totalDots - 1) {
				for (
					let j = 0;
					j < this.slidesToScroll && current <= endIndex;
					j++
				) {
					groupArray.push(current);
					current++;
				}
			} else {
				// For the last group, add all remaining items
				while (current <= endIndex) {
					groupArray.push(current);
					current++;
				}
			}

			data.push(groupArray);
		}

		const start = 0;
		const end = data.at(-1).at(0);

		data.unshift([start]);
		data.push([end]);

		// Dot To Item
		for (let index = 0; index < data.length; index++) {
			// dotToItem.push(data[index].at(0));
			dotToItem[index] = data[index].at(0);
		}

		const dotStart = 1;
		const dotEnd = this.totalDots;

		for (let i = dotStart; i <= dotEnd; i++) {
			for (let j = 0; j < data[i].length; j++) {
				itemToDot[data[i][j]] = i;
			}
		}

		const itemStartIndex = 0;
		const itemEndIndex = this.isCenter
			? this.totalItems - 1
			: this.totalItems - this.slidesToShow;

		return {
			data,
			dotToItem,
			itemToDot,
			itemStartIndex,
			itemEndIndex,
			dotStart,
			dotEnd,
		};
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

		this.$element.style.setProperty(
			this.settings.sliderCurrentIndexCSSProperty,
			this.currentIndex
		);

		setPositionClass();
	};

	const getCurrentIndex = () => {
		return this.currentIndex;
	};

	const setPositionClass = () => {
		this.$container.classList.remove(
			CLASSES.sliderContainerPositionStartClassName,
			CLASSES.sliderContainerPositionMiddleClassName,
			CLASSES.sliderContainerPositionEndClassName
		);

		if (getCurrentIndex() === this.startIndex) {
			this.$container.classList.add(
				CLASSES.sliderContainerPositionStartClassName
			);
		}

		if (
			getCurrentIndex() > this.startIndex &&
			getCurrentIndex() < this.endIndex
		) {
			this.$container.classList.add(
				CLASSES.sliderContainerPositionMiddleClassName
			);
		}

		if (getCurrentIndex() === this.endIndex) {
			this.$container.classList.add(
				CLASSES.sliderContainerPositionEndClassName
			);
		}
	};

	const setCurrentDot = (index) => {
		this.currentDot = parseInt(index, 10);
	};

	const getCurrentDot = () => {
		return this.currentDot;
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

	const removeClasses = () => {
		const $items = this.$slider.querySelectorAll(':scope > *');
		$items.forEach(($item) => {
			$item.setAttribute('aria-hidden', 'true');
			$item.classList.remove(CLASSES.itemCurrentClassName);
			$item.classList.remove(CLASSES.itemVisibleClassName);
		});
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

		if (this.isActiveOnSelect) {
			$items.forEach(($item) => {
				$item.addEventListener('pointerup', handleItem, {
					// useCapture: true,
				});
			});
		}

		this.$container.addEventListener('pointerenter', stopAutoPlay);

		this.$container.addEventListener('pointerleave', startAutoPlay);
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

		this.$container.removeEventListener('pointerenter', stopAutoPlay);

		this.$container.removeEventListener('pointerleave', startAutoPlay);

		this.cleanupSwipe();

		// this.$container.removeEventListener( 'swipe', handleSwipe );
	};

	const startAutoPlay = () => {
		if (!this.isAutoPlay) {
			return noop();
		}

		stopAutoPlay();

		this.autoPlayId = setInterval(slideNext, this.autoPlayTimeout);
	};

	const stopAutoPlay = () => {
		clearInterval(this.autoPlayId);
	};

	const restartAutoPlay = () => {
		stopAutoPlay();
		startAutoPlay();
	};

	const beforeSlide = () => {
		removeClasses();
		triggerEvent(this.$element, 'beforeSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
		});
	};

	const afterSlide = () => {
		removeAnimatingClass();

		resetClonedIndex();

		// Reset Next
		if (getCurrentDot() > this.totalDots) {
			setCurrentDot(1);
			const index = getItemIndexByDotIndex(1);
			setCurrentIndex(index);
		}

		// Reset Prev
		if (getCurrentDot() < 1) {
			setCurrentDot(this.totalDots);
			const index = getItemIndexByDotIndex(this.totalDots);
			setCurrentIndex(index);
		}

		addClasses();

		triggerEvent(this.$element, 'afterSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
		});
	};

	const handleNext = (event) => {
		event.preventDefault();
		if (isAnimating()) {
			return;
		}

		slideNext();
		restartAutoPlay();
	};

	const handlePrev = (event) => {
		event.preventDefault();
		if (isAnimating()) {
			return;
		}

		slidePrev();
		restartAutoPlay();
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
			currentIndex: getCurrentIndex(),
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
			currentIndex: getCurrentIndex(),
			currentDot: this.currentDot,
		});
	};

	const handleSwipe = (event) => {
		if (isAnimating()) {
			return;
		}

		stopAutoPlay();

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
			startAutoPlay();
		}

		if (done && (left || top)) {
			slideNext();
		}

		if (done && (right || bottom)) {
			slidePrev();
		}
	};

	const reset = () => {
		removeEvents();
		stopAutoPlay();

		const cloneSelector = `:scope > .${CLASSES.itemCloneClassName}`;

		this.$slider.querySelectorAll(cloneSelector).forEach(($cloned) => {
			$cloned.remove();
		});

		this.isInfinite = false;
		setCurrentIndex(0);
		setCurrentDot(0);

		this.$slider.querySelectorAll(':scope > *').forEach(($item, index) => {
			$item.classList.remove(
				CLASSES.itemClassName,
				CLASSES.itemCurrentClassName,
				CLASSES.itemVisibleClassName
			);

			$item.removeAttribute('aria-hidden');
			$item.removeAttribute('data-index');

			if (index === this.initialSlide - 1) {
				$item.classList.add(this.settings.defaultItemClassName);
			}
		});

		this.$element.classList.remove(
			CLASSES.elementHasInfiniteClassName,
			CLASSES.elementHorizontalClassName,
			CLASSES.elementVerticalClassName,
			CLASSES.elementCenterClassName,
			CLASSES.elementHasArrowClassName,
			CLASSES.elementHasDotClassName
		);

		this.$container.classList.remove(
			CLASSES.sliderContainerPositionStartClassName,
			CLASSES.sliderContainerPositionMiddleClassName,
			CLASSES.sliderContainerPositionEndClassName
		);

		const $button = this.$element.querySelector(
			this.settings.sliderPagination
		);

		$button.style.removeProperty('display');
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
