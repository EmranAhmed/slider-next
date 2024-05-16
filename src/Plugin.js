/**
 * External dependencies
 */
import {
	getOptionsFromAttribute,
	getPluginInstance,
	swipeEvent,
} from '@storepress/utils';

function Plugin( element, options ) {
	// Default Settings
	const DEFAULTS = {
		moveItemsCSSProperty: '--slide-item',
		visibleItemsCSSProperty: '--show-item',
		isInfiniteCSSProperty: '--show-infinite',
		isHorizontalCSSProperty: '--is-horizontal',
		isAlwaysCenterCSSProperty: '--is-always-center',
		isActiveSelectCSSProperty: '--is-active-select',
		itemGapCSSProperty: '--item-gap',
		prevControlSelector: '.prev',
		nextControlSelector: '.next',
		syncWith: null,
		syncOnSlide: false,
		syncAfterSlide: true,
		visibleActiveSlideOnSync: true,
	};

	// Collecting settings from html attribute
	const ATTRIBUTE = 'slider-settings'; //

	// Do what you need and return expose fn.
	const init = () => {
		this.$element = element; // slider-wrapper
		this.settings = {
			...DEFAULTS,
			...options,
			...getOptionsFromAttribute( this.$element, ATTRIBUTE ),
		};

		this.visibleItem = 0;
		this.itemsPerSlide = 0;
		this.isInfinite = true;
		this.$container = this.$element.querySelector( '.slider-container' );
		this.$slider = this.$element.querySelector( '.slider' );
		this.$items = this.$element.querySelectorAll( 'li' );
		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;
		this.itemsCount = this.$items.length;
		this.allItemsCount = 0;
		this.direction = ''; // prev | next
		this.currentIndex = 0;
		this.itemGap = 0;
		this.centerItem = 0;

		afterLoaded();

		// Clone Items for Infinite Scroll.
		initialCloneItems();

		setInitialIndex();

		addClasses();

		addEvents();

		return expose();
	};

	const afterLoaded = () => {
		this.$container.setAttribute( 'aria-live', 'polite' );

		this.$items.forEach( ( $item, index ) => {
			$item.setAttribute( 'aria-hidden', 'true' );
			$item.dataset.item = index;
			$item.querySelectorAll( 'img' ).forEach( ( $img ) => {
				$img.setAttribute( 'draggable', false );
			} );
		} );

		const infiniteString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isInfiniteCSSProperty )
			.toLowerCase();

		const horizontalString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isHorizontalCSSProperty )
			.toLowerCase();

		const alwaysCenterString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isAlwaysCenterCSSProperty )
			.toLowerCase();

		const activeOnSelect = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isActiveSelectCSSProperty )
			.toLowerCase();

		this.isInfinite = cssVariableIsTrue( infiniteString );

		this.isHorizontal = cssVariableIsTrue( horizontalString );

		this.isCenter = cssVariableIsTrue( alwaysCenterString );

		this.isActiveOnSelect = cssVariableIsTrue( activeOnSelect );

		this.visibleItem = parseInt(
			window
				.getComputedStyle( this.$element )
				.getPropertyValue( this.settings.visibleItemsCSSProperty ),
			10
		);

		this.itemsPerSlide = parseInt(
			window
				.getComputedStyle( this.$element )
				.getPropertyValue( this.settings.moveItemsCSSProperty ),
			10
		);

		this.itemGap = parseInt(
			window
				.getComputedStyle( this.$element )
				.getPropertyValue( this.settings.itemGapCSSProperty ),
			10
		);

		if ( this.visibleItem < this.itemsPerSlide ) {
			this.itemsPerSlide = this.visibleItem;
		}

		this.validCenter =
			this.visibleItem > 2 && this.visibleItem % 2 === 1 && this.isCenter;

		if ( ! this.validCenter ) {
			this.isCenter = false;
		}

		// Control from CSS

		this.$element.classList.remove( 'is-vertical' );
		this.$element.classList.remove( 'is-horizontal' );
		this.$element.classList.remove( 'is-active-center' );

		if ( this.isCenter ) {
			this.$element.classList.add( 'is-active-center' );
			this.centerItem = ( this.visibleItem - this.itemsPerSlide ) / 2;
			this.itemsPerSlide = 1;
		}

		if ( this.isHorizontal ) {
			this.$element.classList.add( 'is-horizontal' );
		} else {
			this.$element.classList.add( 'is-vertical' );
		}
	};

	const initialCloneItems = () => {
		const lastItemsIndex = this.itemsCount - 1;

		const itemsToClone = this.visibleItem + this.centerItem;

		for ( let index = 0; index < itemsToClone; index++ ) {
			const nodeForAppend = this.$items[ index ].cloneNode( true );
			const nodeForPrepend =
				this.$items[ lastItemsIndex - index ].cloneNode( true );

			nodeForAppend.classList.add( 'clone' );
			nodeForAppend.classList.remove( 'current' );
			nodeForAppend.classList.remove( 'active' );

			nodeForPrepend.classList.add( 'clone' );
			nodeForPrepend.classList.remove( 'active' );
			nodeForPrepend.classList.remove( 'current' );

			// Append First Items
			this.$slider.append( nodeForAppend );

			// Prepend Last Items
			this.$slider.prepend( nodeForPrepend );
		}
	};

	const setInitialIndex = () => {
		const $items = this.$slider.querySelectorAll( 'li' );

		this.allItemsCount = $items.length;

		$items.forEach( ( $item, index ) => {
			$item.dataset.index = index;
			if ( $item.classList.contains( 'active' ) ) {
				setCurrentIndex( index );
			}
		} );
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll( 'li' );

		$items[ this.currentIndex ].setAttribute( 'aria-hidden', 'false' );
		$items[ this.currentIndex ].classList.add( 'current' );

		if ( this.isCenter ) {
			const start = this.currentIndex - this.centerItem;
			const end = this.currentIndex + this.centerItem;

			for ( let i = start; i <= end; i++ ) {
				$items[ i ].setAttribute( 'aria-hidden', 'false' );
				$items[ i ].classList.add( 'active' );
			}
		} else {
			for ( let i = 0; i < this.visibleItem; i++ ) {
				const key = i + this.currentIndex;
				$items[ key ].setAttribute( 'aria-hidden', 'false' );
				$items[ key ].classList.add( 'active' );
			}
		}
	};

	const addEvents = () => {
		this.$element
			.querySelector( this.settings.prevControlSelector )
			.addEventListener( 'click', handlePrev );

		this.$element
			.querySelector( this.settings.nextControlSelector )
			.addEventListener( 'click', handleNext );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			if ( this.settings.syncWith ) {
				$li.addEventListener( 'click', handleSyncItemsClick );
			}

			if ( this.isCenter && this.isActiveOnSelect ) {
				$li.addEventListener( 'click', handleCenterClick );
			}
		} );

		this.$slider.addEventListener( 'transitionstart', beforeSlide );
		this.$slider.addEventListener( 'transitionend', afterSlide );

		this.cleanupSwipe = swipeEvent( this.$container, handleSwipe, {
			offset: 50,
		} );
		// this.$container.addEventListener( 'swipe', handleSwipe );
	};

	const handleCenterClick = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

		const index = parseInt(
			event.target.closest( 'li' ).dataset.index,
			10
		);

		if ( index === this.currentIndex ) {
			return;
		}

		if ( index > this.currentIndex ) {
			slideNext();
		}

		if ( index < this.currentIndex ) {
			slidePrev();
		}
	};

	const handleSyncItemsClick = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

		const item = parseInt( event.target.closest( 'li' ).dataset.item, 10 );

		syncIndex( item );
	};

	const syncIndex = ( index ) => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		const $synced = getPluginInstance( this.settings.syncWith );
		$synced.forEach(
			( { to, currentElement, isAnimating, visibleElements } ) => {
				if ( isAnimating() ) {
					return;
				}

				const syncCurrentIndex = parseInt(
					currentElement().dataset.item,
					10
				);

				if ( syncCurrentIndex === index ) {
					return;
				}

				const visibleIndexes = [];
				visibleElements().forEach( ( $item ) => {
					const itemIndex = parseInt( $item.dataset.item, 10 );
					visibleIndexes.push( itemIndex );
				} );

				if (
					! this.settings.visibleActiveSlideOnSync &&
					visibleIndexes.includes( index )
				) {
					return;
				}

				to( index );
			}
		);
	};

	const syncOnSlide = () => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		if ( ! this.settings.syncOnSlide ) {
			return;
		}

		syncSlide();
	};

	const syncSlide = () => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		const $synced = getPluginInstance( this.settings.syncWith );
		$synced.forEach(
			( { isAnimating, goto, getCurrentIndex, visibleElements } ) => {
				if ( isAnimating() ) {
					return;
				}

				let index = 0;

				if ( ! this.direction ) {
					return;
				}

				const visibleIndexes = [];
				visibleElements().forEach( ( $item ) => {
					const itemIndex = parseInt( $item.dataset.item, 10 );
					visibleIndexes.push( itemIndex );
				} );

				if (
					! this.settings.visibleActiveSlideOnSync &&
					visibleIndexes.includes( this.currentIndex - 1 )
				) {
					this.direction = '';
					return;
				}

				// Prev
				if ( this.direction === 'prev' ) {
					index = getCurrentIndex() - this.itemsPerSlide;
				}

				// Next
				if ( this.direction === 'next' ) {
					index = getCurrentIndex() + this.itemsPerSlide;
				}

				goto( index );
				this.direction = '';
			}
		);
	};

	const syncAfterSlide = () => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		if ( ! this.settings.syncAfterSlide ) {
			return;
		}

		syncSlide();
	};

	const cssVariableIsTrue = ( string ) => {
		return string === 'true' || string === '1' || string === 'yes';
	};

	const currentElement = () => {
		return this.$slider.querySelector( 'li.current' );
	};

	const visibleTotal = () => {
		return this.visibleItem;
	};

	const getCurrentIndex = () => {
		return this.currentIndex;
	};

	const visibleElements = () => {
		return this.$slider.querySelectorAll( 'li.active' );
	};

	const isAnimating = () => {
		return this.$slider.classList.contains( 'animating' );
	};

	const setCurrentIndex = ( index ) => {
		this.currentIndex = parseInt( index, 10 );

		this.$element.style.setProperty(
			'--_current-index',
			this.currentIndex
		);
	};

	const removeClasses = () => {
		//this.$slider.classList.remove( 'animating' );
		const $items = this.$slider.querySelectorAll( 'li' );
		$items.forEach( ( $item ) => {
			$item.setAttribute( 'aria-hidden', 'true' );
			$item.classList.remove( 'active' );
			$item.classList.remove( 'current' );
		} );
	};

	const handleSwipe = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

		const { x, y, left, right, top, bottom, moving, done } = event.detail;

		const gapValue =
			this.currentIndex * ( this.itemGap / this.visibleItem );

		const currentWidth =
			( ( this.currentIndex - this.centerItem ) * this.sliderWidth ) /
			this.visibleItem;
		const currentHeight =
			( ( this.currentIndex - this.centerItem ) * this.sliderHeight ) /
			this.visibleItem;

		const horizontalValue = Math.ceil( currentWidth + gapValue - x );
		const verticalValue = Math.ceil( currentHeight + gapValue - y );

		if ( moving ) {
			this.$slider.style.setProperty(
				'--_horizontal-value',
				`-${ horizontalValue }px`
			);

			this.$slider.style.setProperty(
				'--_vertical-value',
				`-${ verticalValue }px`
			);
		}

		if ( done ) {
			this.$slider.classList.add( 'animating' );
			this.$slider.style.removeProperty( '--_horizontal-value' );
			this.$slider.style.removeProperty( '--_vertical-value' );
		}

		if ( done && ( left || top ) ) {
			slideNext();
		}

		if ( done && ( right || bottom ) ) {
			slidePrev();
		}
	};

	const beforeSlide = () => {
		removeClasses();
	};

	const afterSlide = () => {
		this.$slider.classList.remove( 'animating' );

		syncAfterSlide();

		if ( this.isCenter ) {
			// Reset prev
			const resetPrev = this.currentIndex - this.centerItem <= 0;
			const resetNext =
				this.currentIndex + this.centerItem + this.visibleItem >=
				this.allItemsCount;

			if ( resetPrev ) {
				setCurrentIndex( this.itemsCount + this.centerItem );
			}

			// Reset next
			if ( resetNext ) {
				setCurrentIndex( this.visibleItem + this.centerItem );
			}

			addClasses();
			return;
		}

		// Reset prev
		if ( this.currentIndex <= 0 ) {
			setCurrentIndex( this.itemsCount );
		}

		// Reset next
		if ( this.currentIndex > this.itemsCount ) {
			setCurrentIndex( this.currentIndex - this.itemsCount );
		}

		addClasses();
	};

	const slidePrev = () => {
		if ( this.isCenter ) {
			const index = this.currentIndex - this.itemsPerSlide;
			this.$slider.classList.add( 'animating' );
			this.direction = 'prev';
			setCurrentIndex( index );
			syncOnSlide();
			return;
		}

		const remaining = this.currentIndex - this.itemsPerSlide;
		let increment =
			this.itemsPerSlide < remaining ? this.itemsPerSlide : remaining;

		if ( remaining === 0 ) {
			increment = this.itemsPerSlide;
		}

		if (
			! this.isInfinite &&
			this.currentIndex - this.visibleItem - increment < 0
		) {
			return false;
		}

		const index = this.currentIndex - increment;
		this.$slider.classList.add( 'animating' );
		this.direction = 'prev';
		setCurrentIndex( index );
		syncOnSlide();
	};

	const slideNext = () => {
		if ( this.isCenter ) {
			const index = this.currentIndex + this.itemsPerSlide;
			this.$slider.classList.add( 'animating' );
			this.direction = 'next';
			setCurrentIndex( index );
			syncOnSlide();
			return;
		}

		const remaining = this.itemsCount - this.currentIndex;

		let increment =
			this.itemsPerSlide < remaining ? this.itemsPerSlide : remaining;

		if ( remaining === 0 ) {
			increment = this.itemsPerSlide;
		}

		if (
			! this.isInfinite &&
			this.currentIndex + increment > this.itemsCount
		) {
			return;
		}

		const index = this.currentIndex + increment;
		this.$slider.classList.add( 'animating' );
		this.direction = 'next';
		setCurrentIndex( index );
		syncOnSlide();
	};

	const handleNext = ( event ) => {
		event.preventDefault();
		if ( isAnimating() ) {
			return;
		}
		slideNext();
	};

	const handlePrev = ( event ) => {
		event.preventDefault();
		if ( isAnimating() ) {
			return;
		}
		slidePrev();
	};

	const removeEvents = () => {
		this.$element
			.querySelector( this.settings.prevControlSelector )
			.removeEventListener( 'click', handlePrev );

		this.$element
			.querySelector( this.settings.nextControlSelector )
			.removeEventListener( 'click', handleNext );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'click', handleSyncItemsClick );
		} );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'click', handleCenterClick );
		} );

		this.$slider.removeEventListener( 'transitionstart', beforeSlide );
		this.$slider.removeEventListener( 'transitionend', afterSlide );

		this.cleanupSwipe();
		// this.$container.removeEventListener( 'swipe', handleSwipe );
	};

	const to = ( index ) => {
		if ( index < 0 ) {
			return;
		}

		if ( index > this.itemsCount ) {
			return;
		}

		const actualIndex = ( this.allItemsCount - this.itemsCount ) / 2;

		// const centerIndex = this.visibleItem > 1 && this.visibleItem % 2 === 1 ? -2 : -1;

		const i = parseInt( index, 10 );

		const newIndex = i + actualIndex;

		if ( isAnimating() ) {
			return;
		}

		if ( newIndex === this.currentIndex ) {
			return;
		}

		this.$slider.classList.add( 'animating' );

		setCurrentIndex( newIndex );
	};

	const goto = ( index ) => {
		this.$slider.classList.add( 'animating' );
		setCurrentIndex( index );
	};

	const reset = () => {
		removeEvents();
		this.$slider.querySelectorAll( 'li.clone' ).forEach( ( $cloned ) => {
			$cloned.remove();
		} );

		setCurrentIndex( 0 );
		removeClasses();
		this.$slider.querySelector( 'li' ).classList.add( 'active' );
		this.$element.classList.remove( 'is-horizontal' );
		this.$element.classList.remove( 'is-horizontal' );
		this.$element.classList.remove( 'is-active-center' );
	};

	// Expose to public.
	const expose = () => ( {
		handlePrev,
		handleNext,
		removeEvents,
		currentElement,
		visibleTotal,
		visibleElements,
		getCurrentIndex,
		isAnimating,
		to,
		goto,
		reset,
	} );

	return init();
}

export { Plugin };
