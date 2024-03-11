/**
 * External dependencies
 */
import { getOptionsFromAttribute, getPluginInstance } from '@storepress/utils';

function initSwipe( $element, offset = 10 ) {
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
		$element.removeEventListener( 'pointerdown', handleStart );
		$element.removeEventListener( 'touchstart', handleStart );

		$element.removeEventListener( 'pointermove', handleMove );
		$element.removeEventListener( 'touchmove', handleMove );

		$element.removeEventListener( 'pointerup', handleEnd );
		$element.removeEventListener( 'touchend', handleEnd );

		$element.removeEventListener( 'pointerleave', handleEnd );
		$element.removeEventListener( 'touchcancel', handleEnd );
	};

	cleanup();

	$element.addEventListener( 'pointerdown', handleStart );
	$element.addEventListener( 'touchstart', handleStart );

	$element.addEventListener( 'pointermove', handleMove );
	$element.addEventListener( 'touchmove', handleMove );

	$element.addEventListener( 'pointerup', handleEnd );
	$element.addEventListener( 'touchend', handleEnd );

	$element.addEventListener( 'pointerleave', handleEnd );
	$element.addEventListener( 'touchcancel', handleEnd );

	return cleanup;
}

function Plugin( element, options ) {
	// Default Settings
	const DEFAULTS = {
		moveItemsCSSProperty: '--slide-item',
		visibleItemsCSSProperty: '--show-item',
		isInfiniteCSSProperty: '--show-infinite',
		prevControlSelector: '.prev',
		nextControlSelector: '.next',
		syncWith: null,
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

		this.cleanupSwipe = initSwipe( this.$element );

		addEvents();

		syncItemsClick();

		return expose();
	};

	const syncItemsClick = () => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.addEventListener( 'pointerup', handleSyncItemsClick );
		} );
	};

	const handleSyncItemsClick = ( event ) => {
		const index = event.target.closest( 'li' ).dataset.index;

		syncIndex( index );
	};

	const syncIndex = ( index ) => {
		if ( ! this.settings.syncWith ) {
			return;
		}

		const $synced = getPluginInstance( this.settings.syncWith );
		$synced.forEach( ( { to } ) => {
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

	const afterLoaded = () => {
		const infiniteString = window
			.getComputedStyle( this.$element )
			.getPropertyValue( this.settings.isInfiniteCSSProperty )
			.toLowerCase();

		this.isInfinite = infiniteString === 'true' || infiniteString === '1';

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

		/*for ( let i = 0; i < this.visibleItem; i++ ) {
			const key = i + this.currentIndex;
			$items[ key ].classList.add( 'active' );

			const { width, height } = $items[ key ].getBoundingClientRect();

			this.visibleItemsWidth += width;
			this.visibleItemsHeight += height;
		}*/

		addClasses();
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
			.querySelectorAll( this.settings.prevControlSelector )
			.forEach( ( el ) => {
				el.addEventListener( 'pointerup', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.nextControlSelector )
			.forEach( ( el ) => {
				el.addEventListener( 'pointerup', handleNext );
			} );

		this.$slider.addEventListener( 'transitionstart', beforeSlide );
		this.$slider.addEventListener( 'transitionend', afterSlide );
		this.$element.addEventListener( 'swipe', handleSwipe );
	};

	const handleSwipe = ( event ) => {
		if ( this.$slider.classList.contains( 'animating' ) ) {
			return;
		}

		const { x, y, left, right, moving, done } = event.detail;

		// document.querySelector( '#log' ).innerHTML = JSON.stringify( event );

		if ( done ) {
			/*document.querySelector( '#log' ).innerText = JSON.stringify(
				event.detail
			);*/
		}

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

		if ( done && left ) {
			slideNext();
		}

		if ( done && right ) {
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
		if ( this.$slider.classList.contains( 'animating' ) ) {
			return;
		}
		slideNext();
	};

	const handlePrev = ( event ) => {
		event.preventDefault();
		if ( this.$slider.classList.contains( 'animating' ) ) {
			return;
		}
		slidePrev();
	};

	const removeEvents = () => {
		this.$element
			.querySelectorAll( this.settings.prevControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'pointerup', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.nextControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'pointerup', handleNext );
			} );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'pointerup', handleSyncItemsClick );
		} );

		this.$slider.removeEventListener( 'transitionstart', beforeSlide );
		this.$slider.removeEventListener( 'transitionend', afterSlide );
		this.$slider.removeEventListener( 'swipe', handleSwipe );
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
		// this.cleanupSwipe();
	};

	// Expose to public.
	const expose = () => ( {
		handlePrev,
		handleNext,
		removeEvents,
		to,
		reset,
	} );

	return ( () => init() )();
}

export { Plugin };
