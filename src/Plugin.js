/**
 * External dependencies
 */
import {
	getOptionsFromAttribute,
	swipeEvent,
	triggerEvent,
} from '@storepress/utils';

function Plugin( element, options ) {
	// Default Settings
	const DEFAULTS = {
		containerElement: '.storepress-slider-container',
		sliderElement: '.storepress-slider',
		sliderDotsTitle: 'Goto Slider',
		defaultItemClassName: 'active',
	};

	const PRIVATE = {
		sliderCurrentIndexCSSProperty: '--_current-slider-index',
		sliderAdaptiveSizeCSSProperty: '--_slider-adaptive-size',
		isAdaptiveSizeCSSProperty: '--is-adaptive-size',
		slidesToScrollCSSProperty: '--slides-to-scroll',
		slidesToShowCSSProperty: '--slides-to-show',
		isInfiniteCSSProperty: '--infinite-slides',
		canSwipeCSSProperty: '--slider-can-swipe',
		initialItemCSSProperty: '--slider-initial-item',
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
	const ATTRIBUTE = 'storepress-slider'; // data-storepress-slider

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
			...getOptionsFromAttribute( this.$element, ATTRIBUTE ),
			...PRIVATE,
		};

		this.slidesToShow = 1;
		this.slidesToScroll = 1;
		this.isInfinite = true;
		this.$container = this.$element.querySelector(
			this.settings.containerElement
		);
		this.$slider = this.$element.querySelector(
			this.settings.sliderElement
		);
		this.$items = this.$slider.querySelectorAll( ':scope > *' ); // Select direct children
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
		this.enableSwipe = true;
		this.cleanupSwipe = noop();
		this.itemsToClone = 0;
		this.startIndex = 0;
		this.endIndex = 0;
		this.startDot = 0;
		this.endDot = 0;
		this.isAdaptiveSize = false;
		this.itemsSize = [];
		this.controller = new AbortController();

		// @TODO: hideControlOnEnd, adaptiveHeight
		// @TODO: we have to fix calculate 2,2 item 7 or 3,3 item 7 or 4,2 item 7 issue non infinite.

		initial();

		initialPaging();

		cloneItems();

		prepareAdaptiveSize();

		addClasses();

		addEvents();

		startAutoPlay();

		return expose();
	};

	const prepareAdaptiveSize = () => {
		setTimeout( () => {
			const $items = this.$slider.querySelectorAll( ':scope > *' );
			$items.forEach( ( $item, index ) => {
				const $itemInner = $item.querySelector( ':scope > *' );

				this.itemsSize[ index ] = {
					height: getComputedStyle( $itemInner, 'height' ),
					width: getComputedStyle( $itemInner, 'width' ),
				};
			} );

			setAdaptiveSize();
		}, 100 );
	};

	const noop = () => () => {};

	const getElementComputedStyle = ( cssProperty ) => {
		return window
			.getComputedStyle( this.$element )
			.getPropertyValue( cssProperty );
	};

	const getComputedStyle = ( $element, property ) => {
		return window.getComputedStyle( $element ).getPropertyValue( property );
	};

	const getSliderComputedStyle = ( cssProperty ) => {
		return window
			.getComputedStyle( this.$slider )
			.getPropertyValue( cssProperty );
	};

	const initial = () => {
		// Add Container A11y.
		this.$container.setAttribute( 'aria-live', 'polite' );

		// Slides To Show.
		this.slidesToShow = parseInt(
			getElementComputedStyle( this.settings.slidesToShowCSSProperty ),
			10
		);

		// Slides To Scroll.
		this.slidesToScroll = parseInt(
			getElementComputedStyle( this.settings.slidesToScrollCSSProperty ),
			10
		);

		// Initial Slide.
		this.initialSlide = parseInt(
			getElementComputedStyle( this.settings.initialItemCSSProperty ),
			10
		);

		// Swiping
		const swipeString = getElementComputedStyle(
			this.settings.canSwipeCSSProperty
		).toLowerCase();

		this.enableSwipe = cssVariableIsTrue( swipeString );

		// Adaptive Size
		const adaptiveSizeString = getElementComputedStyle(
			this.settings.isAdaptiveSizeCSSProperty
		).toLowerCase();

		this.isAdaptiveSize = cssVariableIsTrue( adaptiveSizeString );

		// scroll quantity should not max then visible quantity.
		if ( this.slidesToShow < this.slidesToScroll ) {
			this.slidesToScroll = this.slidesToShow;
			this.$element.style.setProperty(
				this.settings.slidesToScrollCSSProperty,
				this.slidesToScroll
			);
		}

		// Infinite
		const infiniteString = getElementComputedStyle(
			this.settings.isInfiniteCSSProperty
		).toLowerCase();

		this.isInfinite = cssVariableIsTrue( infiniteString );

		// Total items should more or equal to visible quantity.
		if ( this.slidesToShow >= this.totalItems ) {
			this.isInfinite = false;
			this.$element.style.setProperty(
				this.settings.isInfiniteCSSProperty,
				false
			);
			this.slidesToShow = this.totalItems;
			this.$element.style.setProperty(
				this.settings.slidesToShowCSSProperty,
				this.slidesToShow
			);
		}

		// Total items should more or equal to visible quantity and scroll quantity.
		if ( this.slidesToShow + this.slidesToScroll >= this.totalItems ) {
			this.slidesToScroll = 1;
			this.$element.style.setProperty(
				this.settings.slidesToScrollCSSProperty,
				this.slidesToScroll
			);
		}

		// AutoPlay
		const autoplayString = getElementComputedStyle(
			this.settings.slidesAutoPlayCSSProperty
		).toLowerCase();

		this.isAutoPlay = cssVariableIsTrue( autoplayString );

		this.autoPlayTimeout = parseInt(
			getElementComputedStyle(
				this.settings.slidesAutoPlayTimeoutCSSProperty
			),
			10
		);

		// Horizontal
		const horizontalString = getElementComputedStyle(
			this.settings.isHorizontalCSSProperty
		).toLowerCase();

		this.isHorizontal = cssVariableIsTrue( horizontalString );

		// Always center
		const alwaysCenterString = getElementComputedStyle(
			this.settings.isAlwaysCenterCSSProperty
		).toLowerCase();

		this.isCenter = cssVariableIsTrue( alwaysCenterString );

		// Goto Index on Item Click
		const activeOnSelect = getElementComputedStyle(
			this.settings.isActiveSelectCSSProperty
		).toLowerCase();

		this.isActiveOnSelect = cssVariableIsTrue( activeOnSelect );

		// Item GAP
		this.itemGap = parseInt( getSliderComputedStyle( 'gap' ), 10 );

		// Control from CSS
		this.$element.classList.remove(
			CLASSES.elementVerticalClassName,
			CLASSES.elementHorizontalClassName,
			CLASSES.elementCenterClassName
		);

		if ( this.isCenter ) {
			this.$element.classList.add( CLASSES.elementCenterClassName );
			this.slidesToScroll = 1;
			this.centerItem = ( this.slidesToShow - this.slidesToScroll ) / 2;
			this.$element.style.setProperty(
				this.settings.slidesToScrollCSSProperty,
				this.slidesToScroll
			);
		}

		if ( this.isInfinite ) {
			this.$element.classList.add( CLASSES.elementHasInfiniteClassName );
		}

		if ( this.isHorizontal ) {
			this.$element.classList.add( CLASSES.elementHorizontalClassName );
		} else {
			this.$element.classList.add( CLASSES.elementVerticalClassName );
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
		this.itemsData = this.data.itemToDot;

		const initialIndex = getBalancedIndex( getIndex( this.initialSlide ) );
		const initialDot = getDotIndexByItemIndex( initialIndex );

		// Add Item Index and Set Initial Slide.
		setInitialItem();

		setCurrentIndex( initialIndex, false );
		setCurrentDot( initialDot );

		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;

		// Pagination
		const showPagination = getElementComputedStyle(
			this.settings.slidesShowControlPaginationCSSProperty
		).toLowerCase();

		this.hasPagination = cssVariableIsTrue( showPagination );

		if ( this.hasPagination ) {
			this.$element.classList.add( CLASSES.elementHasDotClassName );
		}

		// Navigation
		const showNavigation = getElementComputedStyle(
			this.settings.slidesShowControlNavigationCSSProperty
		).toLowerCase();

		this.hasNavigation = cssVariableIsTrue( showNavigation );

		if ( this.hasNavigation ) {
			this.$element.classList.add( CLASSES.elementHasArrowClassName );
		}

		triggerEvent( this.$element, 'afterInit', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			totalDots: this.totalDots,
		} );
	};

	const setInitialItem = () => {
		this.itemsSize = [];

		this.$items.forEach( ( $item, index ) => {
			$item.classList.add( CLASSES.itemClassName );
			//$item.setAttribute('aria-hidden', 'true');
			$item.setAttribute( 'inert', true );
			$item.dataset.index = index + 1;

			// const $itemInner = $item.querySelector( ':scope > *' );

			/*this.itemsSize[ getIndex( index ) ] = {
				height: getComputedStyle( $itemInner, 'height' ),
				width: getComputedStyle( $itemInner, 'width' ),
			};*/

			/*this.itemsSize[ index ] = {
				height: getComputedStyle( $itemInner, 'height' ),
				width: getComputedStyle( $itemInner, 'width' ),
			};*/

			$item.setAttribute( 'inert', true );

			// Disable Image dragging
			$item.querySelectorAll( 'img' ).forEach( ( $img ) => {
				$img.setAttribute( 'draggable', false );
			} );
		} );

		this.$items[ this.initialSlide ].classList.add(
			CLASSES.itemCurrentClassName
		);
	};

	const getIndex = ( index ) => {
		return this.isInfinite ? index + this.itemsToClone : index;
	};

	const getCloneIndex = ( index ) => {
		const prevIndex = index + this.totalItems;
		const nextIndex = index - this.totalItems;

		return index < this.startIndex ? prevIndex : nextIndex;
	};

	const cloneItems = () => {
		if ( ! this.isInfinite ) {
			return;
		}

		const lastItemsIndex = this.totalItems - 1;

		for ( let index = 0; index < this.itemsToClone; index++ ) {
			const nodeForAppend = this.$items[ index ].cloneNode( true );
			const nodeForPrepend =
				this.$items[ lastItemsIndex - index ].cloneNode( true );

			// Append
			nodeForAppend.classList.remove(
				CLASSES.itemCurrentClassName,
				CLASSES.itemVisibleClassName
			);
			nodeForAppend.classList.add( CLASSES.itemCloneClassName );

			// Prepend
			nodeForPrepend.classList.remove(
				CLASSES.itemCurrentClassName,
				CLASSES.itemVisibleClassName
			);
			nodeForPrepend.classList.add( CLASSES.itemCloneClassName );

			// Append First Items
			this.$slider.append( nodeForAppend );

			// Prepend Last Items
			this.$slider.prepend( nodeForPrepend );
		}

		const $items = this.$slider.querySelectorAll( ':scope > *' );

		this.itemsSize = [];
		$items.forEach( ( $item, index ) => {
			// const $itemInner = $item.querySelector( ':scope > *' );

			/*this.itemsSize[ index ] = {
				height: getComputedStyle( $itemInner, 'height' ),
				width: getComputedStyle( $itemInner, 'width' ),
			};*/

			if ( index < this.startIndex || index > this.endIndex ) {
				$item.dataset.index = index * -1;
			}
		} );
	};

	const initialPaging = () => {
		const $buttons = this.$element.querySelector(
			this.settings.sliderPagination
		);

		if ( null === $buttons ) {
			return;
		}

		$buttons.style.display = 'none';

		const $parent = $buttons.parentElement;

		for ( let i = 1; i <= this.totalDots; i++ ) {
			const $button = $buttons.cloneNode( true );

			$button.classList.remove( CLASSES.dotCurrentClassName );

			$button.removeAttribute( 'aria-current' );
			$button.removeAttribute( 'aria-hidden' );
			$button.removeAttribute( 'aria-selected' );
			$button.style.removeProperty( 'display' );

			$button.setAttribute( 'role', 'tab' );
			$button.setAttribute( 'aria-setsize', this.totalDots );
			$button.setAttribute( 'aria-posinset', i );
			$button.setAttribute( 'aria-selected', 'false' );

			const itemIndex = getItemIndexByDotIndex( i );

			$button.classList.add( CLASSES.dotClassName );

			if ( this.currentDot === i ) {
				// $button.setAttribute('aria-current', 'true');
				$button.setAttribute( 'aria-selected', 'true' );
				$button.classList.add( CLASSES.dotCurrentClassName );
			}

			$button.setAttribute(
				'aria-label',
				`${ this.settings.sliderDotsTitle } ${ getDotLabelIndex(
					itemIndex
				) }`
			);

			// $cloned.dataset.targetSlide = itemIndex;
			$button.dataset.dotIndex = i.toString();

			$button.innerText = getDotLabelIndex( itemIndex );

			$button.addEventListener( 'click', handleDot, {
				passive: true,
				signal: this.controller.signal,
			} );

			$parent.append( $button );
		}
	};

	const updatePaging = ( currentDot ) => {
		const $buttons = this.$element.querySelectorAll(
			this.settings.sliderPagination
		);

		let dot = currentDot;

		// Next Reset
		if ( currentDot > this.endDot ) {
			dot = this.startDot;
		}

		// Prev Reset
		if ( currentDot < this.startDot ) {
			dot = this.endDot;
		}

		$buttons.forEach( ( $button, index ) => {
			//$button.removeAttribute('aria-current', 'true');
			$button.removeAttribute( 'aria-selected', 'true' );
			$button.classList.remove( CLASSES.dotCurrentClassName );

			if ( dot === index ) {
				// $button.setAttribute('aria-current', 'true');
				$button.setAttribute( 'aria-selected', 'true' );
				$button.classList.add( CLASSES.dotCurrentClassName );
			}
		} );
	};

	const handleDot = ( event ) => {
		const index = parseInt( event.target.dataset.dotIndex, 10 );

		goToDot( index );
	};

	const resetIndex = () => {
		if ( ! this.isInfinite ) {
			return;
		}

		const currentIndex = getCurrentIndex();

		if ( currentIndex < this.startIndex || currentIndex > this.endIndex ) {
			const ci = getCloneIndex( currentIndex );

			setCurrentIndex( ci, false );
		}
	};

	const resetDot = () => {
		// Reset Next
		if ( getCurrentDot() > this.totalDots ) {
			setCurrentDot( 1 );
			const index = getItemIndexByDotIndex( 1 );
			setCurrentIndex( index );
		}

		// Reset Prev
		if ( getCurrentDot() < 1 ) {
			setCurrentDot( this.totalDots );
			const index = getItemIndexByDotIndex( this.totalDots );

			setCurrentIndex( index );
		}
	};

	const handleItem = ( event ) => {
		if ( this.isSwiping ) {
			return false;
		}

		const index = parseInt( event.currentTarget.dataset.index, 10 );

		if ( index > 0 ) {
			goToSlide( index );
		} else {
			goToClonedSlide( index );
		}
	};

	const goToDot = ( dotIndex ) => {
		if ( isAnimating() ) {
			return;
		}

		const dot = parseInt( dotIndex, 10 );

		if ( dot < 1 || dot > this.totalDots ) {
			throw new RangeError(
				`Dot index ${ dotIndex } is not available. Available range ${ 1 } - ${
					this.totalDots
				}`
			);
		}

		if ( dot === this.currentDot ) {
			return;
		}

		addAnimatingClass();

		const currentDot = dot;

		const index = getItemIndexByDotIndex( currentDot );
		setCurrentIndex( index );
		setCurrentDot( currentDot );
		updatePaging( currentDot );

		restartAutoPlay();

		triggerEvent( this.$element, 'afterGotoSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const goToSlide = ( slideIndex ) => {
		if ( isAnimating() ) {
			return;
		}

		// we start slide index from 1

		const slide = parseInt( slideIndex, 10 );

		let currentIndex = getIndex( slide - 1 );

		if ( slide < 1 || slide > this.totalItems ) {
			throw new RangeError(
				`Item index ${ slide } is not available. Available range ${ 1 } - ${
					this.totalItems
				}`
			);
		}

		const limit = this.endIndex;

		if ( ! this.isInfinite && currentIndex > limit ) {
			currentIndex = limit;
		}

		if ( currentIndex === getCurrentIndex() ) {
			return;
		}

		addAnimatingClass();
		const dotIndex = getDotIndexByItemIndex( currentIndex );

		setCurrentDot( dotIndex );
		updatePaging( dotIndex );
		setCurrentIndex( currentIndex );
		restartAutoPlay();
		triggerEvent( this.$element, 'afterGotoSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const goToClonedSlide = ( index ) => {
		if ( isAnimating() ) {
			return;
		}

		const currentIndex = index * -1;

		const ci = getCloneIndex( currentIndex );

		const dotIndex = getDotIndexByItemIndex( ci );

		addAnimatingClass();
		setCurrentIndex( currentIndex );
		setCurrentDot( dotIndex );
		updatePaging( dotIndex );
		restartAutoPlay();

		triggerEvent( this.$element, 'afterGotoSlide', {
			currentIndex: getCloneIndex( currentIndex ),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCloneIndex( currentIndex ) ),
		} );
	};

	const getTotalDots = () => {
		if ( this.isCenter ) {
			return this.totalItems;
		}

		if ( this.isInfinite ) {
			return Math.ceil( this.totalItems / this.slidesToScroll );
		}

		return (
			Math.ceil(
				( this.totalItems - this.slidesToShow ) / this.slidesToScroll
			) + 1
		);
	};

	const getDataForInfinite = () => {
		const data = createDataInfinite(
			this.totalItems,
			this.slidesToShow,
			this.slidesToScroll
		);

		const dotStart = 1;
		const dotEnd = data.length;

		// Dot To Item, If clicked on dot slide to an item.
		const dotToItem = data.map( ( item ) => {
			return item.at( 0 );
		} );

		const firstIndex = data.at( 0 ).at( 0 );
		const lastIndex = data.at( -1 ).at( 0 ) - this.itemsToClone;
		const lastOriginalItems = this.totalItems - lastIndex;

		dotToItem.unshift( firstIndex - lastOriginalItems );

		dotToItem.push( this.totalItems + this.itemsToClone );

		// Item to dot, If click an item, change dot.
		const itemToDot = data
			.reduce( ( dots, item, index ) => {
				item.forEach( ( itemIndex ) => {
					dots[ itemIndex ] = index + 1;
				} );
				return dots;
			}, [] )
			.reduce( ( acc, val, key ) => {
				if ( val !== null ) {
					acc[ key ] = val;
				}
				return acc;
			}, {} );

		const itemStartIndex = this.itemsToClone;
		const itemEndIndex = this.totalItems + this.itemsToClone - 1;

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
		const data = this.isCenter
			? createDataNoInfiniteCenter(
					this.totalItems,
					this.slidesToShow,
					this.slidesToScroll
			  )
			: createDataNoInfinite(
					this.totalItems,
					this.slidesToShow,
					this.slidesToScroll
			  );

		const flatData = data.flat();

		const dotStart = 1;
		const dotEnd = data.length;

		// Dot To Item, If clicked on dot slide to an item.
		const dotToItem = data.map( ( item ) => {
			return item.at( 0 );
		} );

		// Adding Extra Dots.
		dotToItem.unshift( flatData.at( 0 ) - 1 );
		dotToItem.push( this.totalItems );

		// Item to dot, If click an item, change dot.
		const itemToDot = data
			.reduce( ( dots, item, index ) => {
				item.forEach( ( itemIndex ) => {
					dots[ itemIndex ] = index + 1;
				} );
				return dots;
			}, [] )
			.reduce( ( acc, val, key ) => {
				if ( val !== null ) {
					acc[ key ] = val;
				}
				return acc;
			}, {} );

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

	const createDataNoInfiniteCenter = ( total, show, scroll ) => {
		const totalDot = total;

		return Array.from( { length: totalDot }, ( $, i ) => {
			const start = i * scroll;

			return Array.from( { length: show }, ( _, j ) => start + j );
		} );
	};

	const createDataNoInfinite = ( total, show, scroll ) => {
		const totalDot = Math.ceil( ( total - show ) / scroll ) + 1;

		return Array.from( { length: totalDot }, ( $, i ) => {
			let start = i * scroll;
			if ( start + show > total ) {
				start = total - show;
			}
			return Array.from( { length: show }, ( _, j ) => start + j );
		} );
	};

	const createDataInfinite = ( total, show, scroll ) => {
		const cloned = show + scroll;
		const maxIndex = total + cloned;

		const totalDot = Math.ceil( total / scroll );

		return Array.from( { length: totalDot }, ( $, i ) => {
			const start = i * scroll + cloned;

			return Array.from( { length: show }, ( _, j ) => {
				const index = start + j;

				return maxIndex >= index ? index : undefined;
			} ).filter( ( val ) => val !== undefined );
		} );
	};

	const getDotIndexByItemIndex = ( index ) => {
		return this.itemsData[ index ];
	};

	const getItemIndexByDotIndex = ( index ) => {
		return this.dotsData[ index ];
	};

	const getBalancedIndex = ( index ) => {
		const dotIndex = this.itemsData[ index ];
		return this.dotsData[ dotIndex ];
	};

	const cssVariableIsTrue = ( string ) => {
		return string === 'true' || string === '1' || string === 'yes';
	};

	const setCurrentIndex = ( index, applyAdaptiveSize = true ) => {
		this.currentIndex = parseInt( index, 10 );

		this.$element.style.setProperty(
			this.settings.sliderCurrentIndexCSSProperty,
			this.currentIndex
		);

		setPositionClass();

		if ( applyAdaptiveSize ) {
			setAdaptiveSize();
		}
	};

	const getCurrentIndex = () => {
		return this.currentIndex;
	};

	const getCurrentItemIndex = ( index ) => {
		return this.isInfinite ? index - this.itemsToClone + 1 : index + 1;
	};

	const getDotLabelIndex = ( index ) => {
		return this.isInfinite ? index - this.itemsToClone + 1 : index + 1;
	};

	const setPositionClass = () => {
		this.$container.classList.remove(
			CLASSES.sliderContainerPositionStartClassName,
			CLASSES.sliderContainerPositionMiddleClassName,
			CLASSES.sliderContainerPositionEndClassName
		);

		if ( getCurrentIndex() === this.startIndex ) {
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

		if ( getCurrentIndex() === this.endIndex ) {
			this.$container.classList.add(
				CLASSES.sliderContainerPositionEndClassName
			);
		}
	};

	const getAdaptiveSize = ( index, kind ) => {
		const start = index - this.centerItem;
		const limit = start + this.slidesToShow;

		const itemsSizes = this.itemsSize.slice( start, limit );

		const sizeIndex = itemsSizes.reduce(
			( maxIndex, currentValue, currentIndex, itemSizes ) => {
				const max = parseInt( itemSizes[ maxIndex ][ kind ], 10 );
				const current = parseInt( currentValue[ kind ], 10 );

				return current > max ? currentIndex : maxIndex;
			},
			0
		);

		// return this.slidesToShow === 1 ? this.itemsSize[ index ] : 2;
		return itemsSizes[ sizeIndex ];
	};

	const setAdaptiveSize = () => {
		if (
			//this.slidesToShow > 1 ||
			! this.isAdaptiveSize ||
			! this.isHorizontal
		) {
			return;
		}

		const index = getCurrentIndex();

		// console.log( index, index + this.slidesToShow - 1 );

		const { height } = getAdaptiveSize( index, 'height' );

		this.$element.style.setProperty(
			this.settings.sliderAdaptiveSizeCSSProperty,
			height
		);
	};

	const setCurrentDot = ( index ) => {
		this.currentDot = parseInt( index, 10 );
	};

	const getCurrentDot = () => {
		return this.currentDot;
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll( ':scope > *' );

		// $items[this.currentIndex].removeAttribute('aria-hidden');
		$items[ this.currentIndex ].removeAttribute( 'inert' );
		$items[ this.currentIndex ].classList.add(
			CLASSES.itemCurrentClassName
		);

		const start = this.currentIndex - this.centerItem;
		const end = start + this.slidesToShow;

		for ( let i = start; i < end; i++ ) {
			if ( ! $items[ i ] ) {
				continue;
			}

			//$items[i].removeAttribute('aria-hidden', 'false');
			$items[ i ].removeAttribute( 'inert' );
			$items[ i ].classList.add( CLASSES.itemVisibleClassName );
		}
	};

	const removeClasses = () => {
		const $items = this.$slider.querySelectorAll( ':scope > *' );
		$items.forEach( ( $item ) => {
			$item.setAttribute( 'inert', true );
			// $item.setAttribute('aria-hidden', 'true');
			$item.classList.remove( CLASSES.itemCurrentClassName );
			$item.classList.remove( CLASSES.itemVisibleClassName );
		} );
	};

	const isAnimating = () => {
		return this.$slider.classList.contains(
			CLASSES.sliderAnimatingClassName
		);
	};

	const addAnimatingClass = () => {
		this.$slider.classList.add( CLASSES.sliderAnimatingClassName );
	};

	const removeAnimatingClass = () => {
		this.$slider.classList.remove( CLASSES.sliderAnimatingClassName );
	};

	const addEvents = () => {
		const $prevButton = this.$element.querySelector(
			this.settings.sliderNavigationPrevious
		);

		const $nextButton = this.$element.querySelector(
			this.settings.sliderNavigationNext
		);

		const $items = this.$slider.querySelectorAll( ':scope > *' );

		if ( null !== $prevButton ) {
			$prevButton.addEventListener( 'click', handlePrev, {
				passive: true,
				signal: this.controller.signal,
			} );
		}

		if ( null !== $nextButton ) {
			$nextButton.addEventListener( 'click', handleNext, {
				passive: true,
				signal: this.controller.signal,
			} );
		}

		this.$slider.addEventListener( 'transitionstart', beforeSlide, {
			passive: true,
			signal: this.controller.signal,
		} );
		this.$slider.addEventListener( 'transitionend', afterSlide, {
			passive: true,
			signal: this.controller.signal,
		} );

		if ( this.enableSwipe ) {
			this.cleanupSwipe = swipeEvent( this.$container, handleSwipe, {
				offset: 50, // @TODO: Swipe Offset from CSS
			} );
		}

		if ( this.isActiveOnSelect ) {
			$items.forEach( ( $item ) => {
				$item.addEventListener( 'pointerup', handleItem, {
					passive: true,
					signal: this.controller.signal,
				} );
			} );
		}

		this.$container.addEventListener( 'pointerenter', stopAutoPlay, {
			passive: true,
			signal: this.controller.signal,
		} );

		this.$container.addEventListener( 'pointerleave', startAutoPlay, {
			passive: true,
			signal: this.controller.signal,
		} );
	};

	const removeEvents = () => {
		this.controller.abort();

		if ( this.enableSwipe ) {
			this.cleanupSwipe();
		}
	};

	const startAutoPlay = () => {
		if ( ! this.isAutoPlay ) {
			return noop();
		}

		stopAutoPlay();

		// @TODO: If non infinite react end it should start with prev
		this.autoPlayId = setInterval( slideNext, this.autoPlayTimeout );
	};

	const stopAutoPlay = () => {
		clearInterval( this.autoPlayId );
	};

	const restartAutoPlay = () => {
		stopAutoPlay();
		startAutoPlay();
	};

	const beforeSlide = () => {
		removeClasses();
		triggerEvent( this.$element, 'beforeSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const afterSlide = () => {
		removeAnimatingClass();

		// Clone Index
		resetIndex();

		// Prev | Next
		resetDot();

		addClasses();

		triggerEvent( this.$element, 'afterSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const handleNext = () => {
		if ( isAnimating() ) {
			return;
		}

		slideNext();
		restartAutoPlay();
	};

	const handlePrev = () => {
		if ( isAnimating() ) {
			return;
		}

		slidePrev();
		restartAutoPlay();
	};

	const slidePrev = () => {
		const currentDot = getCurrentDot() - 1;

		if ( ! this.isInfinite && currentDot <= 0 ) {
			return;
		}

		addAnimatingClass();
		const index = getItemIndexByDotIndex( currentDot );
		setCurrentIndex( index );
		setCurrentDot( currentDot );
		updatePaging( currentDot );

		triggerEvent( this.$element, 'afterGotoSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const slideNext = () => {
		const currentDot = getCurrentDot() + 1;

		if ( ! this.isInfinite && currentDot > this.totalDots ) {
			return;
		}

		addAnimatingClass();

		const index = getItemIndexByDotIndex( currentDot );
		setCurrentIndex( index );
		setCurrentDot( currentDot );
		updatePaging( currentDot );

		triggerEvent( this.$element, 'afterGotoSlide', {
			currentIndex: getCurrentIndex(),
			currentDot: getCurrentDot(),
			itemIndex: getCurrentItemIndex( getCurrentIndex() ),
		} );
	};

	const handleSwipe = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

		stopAutoPlay();

		const gapCount = this.slidesToShow - 1;
		const gapSize = this.isCenter
			? ( ( this.itemGap / this.slidesToShow ) * gapCount ) / 2
			: 0;

		const { x, y, left, right, top, bottom, moving, done } = event.detail;

		const gapValue =
			getCurrentIndex() * ( this.itemGap / this.slidesToShow );

		const currentWidth =
			( ( getCurrentIndex() - this.centerItem ) * this.sliderWidth ) /
			this.slidesToShow;
		const currentHeight =
			( ( getCurrentIndex() - this.centerItem ) * this.sliderHeight ) /
			this.slidesToShow;

		const horizontalValue =
			Math.ceil( currentWidth - gapSize + gapValue - x ) * -1;
		const verticalValue =
			Math.ceil( currentHeight - gapSize + gapValue - y ) * -1;
		// Disable over swipe
		if ( ! this.isInfinite ) {
			if ( this.currentDot === this.totalDots && x < 0 ) {
				return;
			}

			if ( this.currentDot === 1 && x > 0 ) {
				return;
			}
		}

		if ( moving ) {
			this.isSwiping = true;
			this.$element.classList.add( 'swiping' );

			this.$slider.style.setProperty(
				'--_horizontal-value',
				`${ horizontalValue }px`
			);

			this.$slider.style.setProperty(
				'--_vertical-value',
				`${ verticalValue }px`
			);
		}

		if ( done ) {
			addAnimatingClass();
			this.$element.classList.remove( 'swiping' );
			this.$slider.style.removeProperty( '--_horizontal-value' );
			this.$slider.style.removeProperty( '--_vertical-value' );
			this.isSwiping = false;
			startAutoPlay();
		}

		if ( done && ( left || top ) ) {
			this.$element.classList.remove( 'swiping' );
			slideNext();
		}

		if ( done && ( right || bottom ) ) {
			this.$element.classList.remove( 'swiping' );
			slidePrev();
		}
	};

	const reset = () => {
		removeEvents();
		stopAutoPlay();

		const cloneSelector = `:scope > .${ CLASSES.itemCloneClassName }`;

		this.$slider.querySelectorAll( cloneSelector ).forEach( ( $cloned ) => {
			$cloned.remove();
		} );

		this.$element
			.querySelectorAll( this.settings.sliderPagination )
			.forEach( ( $dot ) => {
				if ( $dot.classList.contains( CLASSES.dotClassName ) ) {
					$dot.remove();
				}
			} );

		this.isInfinite = false;
		setCurrentIndex( 0, false );
		setCurrentDot( 0 );

		this.$slider
			.querySelectorAll( ':scope > *' )
			.forEach( ( $item, index ) => {
				$item.classList.remove(
					CLASSES.itemClassName,
					CLASSES.itemCurrentClassName,
					CLASSES.itemVisibleClassName
				);

				$item.removeAttribute( 'aria-hidden' );
				$item.removeAttribute( 'inert' );
				$item.removeAttribute( 'data-index' );

				if ( index === this.initialSlide - 1 ) {
					$item.classList.add( this.settings.defaultItemClassName );
				}
			} );

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

		this.$element.style.removeProperty(
			this.settings.isInfiniteCSSProperty
		);

		this.$element.style.removeProperty(
			this.settings.slidesToShowCSSProperty
		);

		this.$element.style.removeProperty(
			this.settings.slidesToScrollCSSProperty
		);

		$button.style.removeProperty( 'display' );

		this.$element.style.removeProperty(
			this.settings.sliderAdaptiveSizeCSSProperty
		);
	};

	// Expose to public.
	const expose = () => ( {
		handlePrev,
		handleNext,
		goToDot,
		goToSlide,
		reset,
	} );

	return init();
}

export { Plugin };
