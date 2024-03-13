/**
 * External dependencies
 */
import { getOptionsFromAttribute, getPluginInstance } from '@storepress/utils';

function initSwipe( $element, offset = 10, mobileOnly = false ) {
	let readyToMove = false;
	let isMoved = false;
	let xStart = 0;
	let yStart = 0;
	let isMobile = false;

	const handleStart = ( event ) => {
		readyToMove = true;
		isMoved = false;

		xStart = event.x;
		yStart = event.y;
		isMobile = event.type === 'touchstart';

		if ( event.type === 'pointerdown' && isMobile ) {
			return false;
		}

		if ( isMobile ) {
			const touch = event.changedTouches[ 0 ];
			xStart = touch.clientX;
			yStart = touch.clientY;
		}
	};

	const handleMove = ( event ) => {
		if ( ! readyToMove ) {
			return;
		}

		if ( event.type === 'pointermove' && isMobile ) {
			return false;
		}

		let horizontalDiff = event.x - xStart;
		let verticalDiff = event.y - yStart;

		if ( isMobile ) {
			//console.log( event.changedTouches );
			const touch = event.changedTouches[ 0 ];
			horizontalDiff = touch.clientX - xStart;
			verticalDiff = touch.clientY - yStart;
		}

		isMoved = true;

		$element.dispatchEvent(
			new CustomEvent( 'swipe', {
				detail: {
					x: horizontalDiff,
					y: verticalDiff,
					top: verticalDiff + offset < 0, // to top
					bottom: verticalDiff - offset > 0, // to bottom
					left: horizontalDiff + offset < 0, // to left
					right: horizontalDiff - offset > 0, // to right
					moving: true,
					done: false,
				},
			} )
		);
	};

	const handleEnd = ( event ) => {
		if ( ! readyToMove ) {
			return;
		}

		if ( event.type === 'pointerleave' && isMobile ) {
			return false;
		}

		if ( event.type === 'pointerup' && isMobile ) {
			return false;
		}

		let horizontalDiff = event.x - xStart;
		let verticalDiff = event.y - yStart;

		if ( isMobile ) {
			const touch = event.changedTouches[ 0 ];
			horizontalDiff = touch.clientX - xStart;
			verticalDiff = touch.clientY - yStart;
		}

		if ( isMoved ) {
			$element.dispatchEvent(
				new CustomEvent( 'swipe', {
					detail: {
						x: horizontalDiff,
						y: verticalDiff,
						top: verticalDiff + offset < 0, // to top
						bottom: verticalDiff - offset > 0, // to bottom
						left: horizontalDiff + offset < 0, // to left
						right: horizontalDiff - offset > 0, // to right
						moving: false,
						done: true,
					},
				} )
			);
		}

		isMoved = false;

		readyToMove = false;
	};

	const cleanup = () => {
		$element.removeEventListener( 'touchstart', handleStart );
		$element.removeEventListener( 'touchmove', handleMove );
		$element.removeEventListener( 'touchend', handleEnd );
		$element.removeEventListener( 'touchcancel', handleEnd );

		if ( ! mobileOnly ) {
			$element.removeEventListener( 'pointerdown', handleStart );
			$element.removeEventListener( 'pointermove', handleMove );
			$element.removeEventListener( 'pointerup', handleEnd );
			$element.removeEventListener( 'pointerleave', handleEnd );
		}
	};

	cleanup();

	if ( ! mobileOnly ) {
		$element.addEventListener( 'pointerdown', handleStart );
		$element.addEventListener( 'pointermove', handleMove );
		$element.addEventListener( 'pointerup', handleEnd );
		$element.addEventListener( 'pointerleave', handleEnd );
	}
	$element.addEventListener( 'touchstart', handleStart, { passive: true } );
	$element.addEventListener( 'touchmove', handleMove, { passive: true } );
	$element.addEventListener( 'touchend', handleEnd, { passive: true } );
	$element.addEventListener( 'touchcancel', handleEnd );

	return cleanup;
}

function Plugin( element, options ) {
	// Default Settings
	const DEFAULTS = {
		moveItemsCSSProperty: '--slide-item',
		visibleItemsCSSProperty: '--show-item',
		isInfiniteCSSProperty: '--show-infinite',
		isHorizontalCSSProperty: '--is-horizontal',
		prevControlSelector: '.prev',
		nextControlSelector: '.next',
		syncWith: null,
		mode: 'horizontal', // horizontal | vertical
	};

	// Collecting settings from html attribute
	const ATTRIBUTE = 'slider-settings';

	// Do what you need and return expose fn.
	const init = () => {
		this.$element = element; // slider-wrapper
		this.settings = Object.assign(
			{},
			DEFAULTS,
			options,
			getOptionsFromAttribute( this.$element, ATTRIBUTE )
		);

		this.visibleItem = 0;
		this.itemsPerSlide = 0;
		this.isInfinite = true;
		this.$container = this.$element.querySelector( '.slider-container' );
		this.$slider = this.$element.querySelector( '.slider' );
		this.$items = this.$element.querySelectorAll( 'li' );
		this.sliderWidth = this.$slider.getBoundingClientRect().width;
		this.sliderHeight = this.$slider.getBoundingClientRect().height;
		this.totalItems = 0;
		this.currentIndex = 0;

		afterLoaded();

		// Clone Items for Infinite Scroll.
		initialCloneItems();

		setInitialIndex();

		addEvents();

		return expose();
	};

	const handleSyncItemsClick = ( event ) => {
		const index = parseInt(
			event.target.closest( 'li' ).dataset.index,
			10
		);
		syncIndex( index );
	};

	const syncIndex = ( index ) => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		const $synced = getPluginInstance( this.settings.syncWith );
		$synced.forEach( ( { to, currentElement, isAnimating } ) => {
			if ( isAnimating() ) {
				return;
			}

			const syncCurrentIndex = parseInt(
				currentElement().dataset.index,
				10
			);

			if ( syncCurrentIndex === index ) {
				return;
			}
			to( index );
		} );
	};

	const syncCurrent = () => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			if ( $li.classList.contains( 'current' ) ) {
				const index = parseInt( $li.dataset.index, 10 );
				syncIndex( index );
			}
		} );
	};

	const cssVariableIsTrue = ( string ) => {
		return string === 'true' || string === '1' || string === 'yes';
	};

	const afterLoaded = () => {
		const infiniteString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isInfiniteCSSProperty )
			.toLowerCase();

		const horizontalString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isHorizontalCSSProperty )
			.toLowerCase();

		this.isInfinite = cssVariableIsTrue( infiniteString );

		const isHorizontal = cssVariableIsTrue( horizontalString );

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

		this.totalItems = this.$items.length;

		if ( this.visibleItem < this.itemsPerSlide ) {
			this.itemsPerSlide = this.visibleItem;
		}

		// Control from CSS

		this.$element.classList.remove( 'is-vertical' );
		this.$element.classList.remove( 'is-horizontal' );

		if ( isHorizontal ) {
			this.settings.mode = 'horizontal';
			this.$element.classList.add( 'is-horizontal' );
		} else {
			this.settings.mode = 'vertical';
			this.$element.classList.add( 'is-vertical' );
		}
	};

	const initialCloneItems = () => {
		this.$items.forEach( ( $item, index ) => {
			$item.setAttribute( 'data-index', index );
		} );

		const lastItemsIndex = this.totalItems - 1;
		//return;
		// Append First Items
		for ( let index = 0; index < this.visibleItem; index++ ) {
			const clone = this.$items[ index ].cloneNode( true );
			clone.classList.add( 'clone' );
			clone.classList.remove( 'current' );
			clone.classList.remove( 'active' );
			// clone.removeAttribute( 'data-index' );
			this.$slider.append( clone );
		}

		// Prepend Last Items
		for ( let index = 0; index < this.visibleItem; index++ ) {
			const clone =
				this.$items[ lastItemsIndex - index ].cloneNode( true );
			clone.classList.add( 'clone' );
			clone.classList.remove( 'active' );
			clone.classList.remove( 'current' );
			//clone.removeAttribute( 'data-index' );
			this.$slider.prepend( clone );
		}
	};

	const setInitialIndex = () => {
		const $items = this.$slider.querySelectorAll( 'li' );

		$items.forEach( ( item, index ) => {
			if ( item.classList.contains( 'active' ) ) {
				this.currentIndex = index;

				// $items[ this.currentIndex ].classList.add( 'current' );
				this.$element.style.setProperty(
					'--_current-item-index',
					this.currentIndex
				);
			}
		} );

		addClasses();
	};

	const currentElement = () => {
		return this.$slider.querySelector( 'li.current' );
	};

	const isAnimating = () => {
		return this.$slider.classList.contains( 'animating' );
	};

	const setCurrentIndex = ( index ) => {
		this.currentIndex = parseInt( index, 10 );

		this.$element.style.setProperty(
			'--_current-item-index',
			this.currentIndex
		);
	};

	const addClasses = () => {
		const $items = this.$slider.querySelectorAll( 'li' );

		$items[ this.currentIndex ].classList.add( 'current' );

		for ( let i = 0; i < this.visibleItem; i++ ) {
			const key = i + this.currentIndex;
			$items[ key ].classList.add( 'active' );
		}
	};

	const removeClasses = () => {
		this.$slider.classList.remove( 'animating' );
		const $items = this.$slider.querySelectorAll( 'li' );
		$items.forEach( ( $item ) => {
			$item.classList.remove( 'active' );
			$item.classList.remove( 'current' );
		} );
	};

	const addEvents = () => {
		this.$element
			.querySelector( this.settings.prevControlSelector )
			.addEventListener( 'click', handlePrev );

		this.$element
			.querySelector( this.settings.nextControlSelector )
			.addEventListener( 'click', handleNext );

		if ( this.settings.syncWith ) {
			this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
				$li.addEventListener( 'click', handleSyncItemsClick );
			} );
		}

		this.$slider.addEventListener( 'transitionstart', beforeSlide );
		this.$slider.addEventListener( 'transitionend', afterSlide );

		this.cleanupSwipe = initSwipe( this.$container, 50 );
		this.$container.addEventListener( 'swipe', handleSwipe );
	};

	const handleSwipe = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

		const { x, y, left, right, top, bottom, moving, done } = event.detail;

		const currentWidth =
			( this.currentIndex * this.sliderWidth ) / this.visibleItem;
		const currentHeight =
			( this.currentIndex * this.sliderHeight ) / this.visibleItem;

		const horizontalValue = Math.ceil( currentWidth - x );
		const verticalValue = Math.ceil( currentHeight - y );

		if ( moving ) {
			this.$slider.style.setProperty(
				'--horizontal-value',
				`-${ horizontalValue }px`
			);

			this.$slider.style.setProperty(
				'--vertical-value',
				`-${ verticalValue }px`
			);
		}

		if ( done ) {
			this.$slider.classList.add( 'animating' );
			this.$slider.style.removeProperty( '--horizontal-value' );
			this.$slider.style.removeProperty( '--vertical-value' );
		}

		if ( done && ( left || top ) ) {
			slideNext();
		}

		if ( done && ( right || bottom ) ) {
			slidePrev();
		}
	};

	const beforeSlide = () => {
		const $items = this.$slider.querySelectorAll( 'li' );
		$items.forEach( ( item ) => {
			item.classList.remove( 'active' );
			item.classList.remove( 'current' );
		} );
	};

	const afterSlide = () => {
		this.$slider.classList.remove( 'animating' );

		// Reset Prev
		if ( this.currentIndex === 0 ) {
			const index = this.$items.length;
			setCurrentIndex( index );
		}

		if ( this.currentIndex > this.$items.length ) {
			const index = this.currentIndex - this.$items.length;
			setCurrentIndex( index );
		}

		addClasses();
		syncCurrent();
	};

	const slidePrev = () => {
		const remaining = this.currentIndex - this.itemsPerSlide;
		let increment =
			this.itemsPerSlide < remaining ? this.itemsPerSlide : remaining;

		if ( remaining === 0 ) {
			increment = this.itemsPerSlide;
		}

		if ( ! this.isInfinite ) {
			if ( this.currentIndex - increment - this.visibleItem < 0 ) {
				return false;
			}
		}

		const index = this.currentIndex - increment;
		this.$slider.classList.add( 'animating' );
		setCurrentIndex( index );
	};

	const slideNext = () => {
		const remaining = this.totalItems - this.currentIndex;

		let increment =
			this.itemsPerSlide < remaining ? this.itemsPerSlide : remaining;

		if ( remaining === 0 ) {
			increment = this.itemsPerSlide;
		}

		if ( ! this.isInfinite ) {
			if ( this.currentIndex + increment > this.totalItems ) {
				return;
			}
		}

		const index = this.currentIndex + increment;

		this.$slider.classList.add( 'animating' );
		setCurrentIndex( index );
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
			.removeEventListener( 'pointerup', handlePrev );

		this.$element
			.querySelector( this.settings.nextControlSelector )
			.removeEventListener( 'pointerup', handleNext );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'pointerup', handleSyncItemsClick );
		} );

		this.$slider.removeEventListener( 'transitionstart', beforeSlide );
		this.$slider.removeEventListener( 'transitionend', afterSlide );

		this.cleanupSwipe();
		this.$container.removeEventListener( 'swipe', handleSwipe );
	};

	const to = ( index ) => {
		if ( index < 0 ) {
			return;
		}

		if ( index > this.totalItems ) {
			return;
		}

		const $withClonedItemsLength =
			this.$slider.querySelectorAll( 'li' ).length;

		const actualIndex = ( $withClonedItemsLength - this.totalItems ) / 2;

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

	const reset = () => {
		removeEvents();
		this.$slider.querySelectorAll( 'li.clone' ).forEach( ( $cloned ) => {
			$cloned.remove();
		} );

		setCurrentIndex( 0 );
		removeClasses();
		this.$slider.querySelector( 'li' ).classList.add( 'active' );
		this.$element.classList.remove( 'is-horizontal' );
		this.$element.classList.remove( 'is-vertical' );
		this.settings.mode = 'horizontal';
	};
	// Expose to public.
	const expose = () => ( {
		handlePrev,
		handleNext,
		removeEvents,
		currentElement,
		isAnimating,
		to,
		reset,
	} );

	return ( () => init() )();
}

export { Plugin };
