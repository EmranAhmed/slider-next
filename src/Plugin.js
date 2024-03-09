/**
 * External dependencies
 */
import {
	getElements,
	getOptionsFromAttribute,
	getPluginInstance,
} from '@storepress/utils';

function SwipeEvent( elements ) {
	const $elements = getElements( elements );

	$elements.forEach( ( $element, index ) => {
		let isMoving = false;
		let xStart = 0;
		let xEnd = 0;
		let yStart = 0;
		let yEnd = 0;
		const $slider = $element.querySelector( 'ul' );
		let currentPosition = 0;
		const offset = 50;

		const itemWidth = $element.getBoundingClientRect().width;
		const itemHeight = $element.getBoundingClientRect().height;

		$element.addEventListener( 'pointerdown', ( event ) => {
			isMoving = true;
			xStart = event.x;
			yStart = event.y;

			currentPosition =
				parseInt(
					$element.querySelector( 'li.current' ).dataset.index,
					10
				) + 1;
		} );
		$element.addEventListener( 'pointermove', ( event ) => {
			if ( ! isMoving ) {
				return;
			}

			const positionWidth = currentPosition * itemWidth;
			const positionHeight = currentPosition * itemHeight;

			const horizontalDiff = event.x - xStart;
			const verticalDiff = event.y - yStart;

			const horizontalValue = positionWidth - horizontalDiff;
			const verticalValue = positionHeight - verticalDiff;

			//$slider.classList.add( 'animating' );
			$slider.style.setProperty(
				'--horizontal-value',
				`-${ horizontalValue }px`
			);

			$slider.style.setProperty(
				'--vertical-value',
				`-${ verticalValue }px`
			);
		} );
		$element.addEventListener( 'pointerup', ( event ) => {
			if ( isMoving ) {
				xEnd = event.x;
				yEnd = event.y;

				const xDiff = xEnd - xStart;
				const yDiff = yEnd - yStart;

				console.log( xDiff );

				$slider.classList.add( 'animating' );
				$slider.style.removeProperty( '--horizontal-value' );
				$slider.style.removeProperty( '--vertical-value' );

				if ( yDiff + offset < 0 ) {
					console.log( 'to top', xDiff );
				}

				if ( yDiff - offset > 0 ) {
					console.log( 'to bottom', yDiff );
				}

				if ( xDiff + offset < 0 ) {
					console.log( 'to left', xDiff );
				}

				if ( xDiff - offset > 0 ) {
					console.log( 'to right', xDiff );
				}
			}

			isMoving = false;
		} );

		$element.addEventListener( 'pointerleave', ( event ) => {
			// same as pointerup
		} );
	} );
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
		this.$slider = null;
		this.$items = null;
		this.totalItems = 0;
		this.currentIndex = 0;

		afterLoaded();

		// Clone Items for Infinite Scroll.
		initialCloneItems();

		setInitialIndex();

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

		this.$slider = this.$element.querySelector( '.slider' );
		this.$items = this.$slider.querySelectorAll( 'li' );
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

				$items[ this.currentIndex ].classList.add( 'current' );
				this.$element.style.setProperty(
					'--_current-item-index',
					this.currentIndex
				);
			}
		} );

		for ( let i = 0; i < this.visibleItem; i++ ) {
			const key = i + this.currentIndex;
			$items[ key ].classList.add( 'active' );
		}
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

		syncCurrent();
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
				el.addEventListener( 'click', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.nextControlSelector )
			.forEach( ( el ) => {
				el.addEventListener( 'click', handleNext );
			} );

		this.$slider.addEventListener( 'transitionstart', beforeSlide );
		this.$slider.addEventListener( 'transitionend', afterSlide );

		SwipeEvent( this.$element );
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
	};

	const slidePrev = () => {
		if ( this.$slider.classList.contains( 'animating' ) ) {
			return;
		}

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
		if ( this.$slider.classList.contains( 'animating' ) ) {
			return;
		}

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
		slideNext();
	};

	const handlePrev = ( event ) => {
		event.preventDefault();
		slidePrev();
	};

	const removeEvents = () => {
		this.$element
			.querySelectorAll( this.settings.prevControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'click', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.nextControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'click', handleNext );
			} );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'click', handleSyncItemsClick );
		} );

		this.$slider.removeEventListener( 'transitionstart', beforeSlide );
		this.$slider.removeEventListener( 'transitionend', afterSlide );
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
	};

	// Expose to public.
	const expose = () => ( {
		slidePrev,
		slideNext,
		removeEvents,
		to,
		reset,
	} );

	return ( () => init() )();
}

export { Plugin };
