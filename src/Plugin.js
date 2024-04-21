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
		prevControlSelector: '.prev',
		nextControlSelector: '.next',
		syncWith: null,
		visibleActiveSlideOnSync: true,
	};

	// Collecting settings from html attribute
	const ATTRIBUTE = 'slider-settings';

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
		this.totalItems = 0;
		this.currentIndex = 0;

		afterLoaded();

		// Clone Items for Infinite Scroll.
		initialCloneItems();

		setInitialIndex();

		addEvents();

		return expose();
	};

	const afterLoaded = () => {
		this.$container.setAttribute( 'aria-live', 'polite' );

		this.$items.forEach( ( $item, index ) => {
			$item.setAttribute( 'aria-hidden', 'true' );
			$item.setAttribute( 'data-index', index );
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

		this.isInfinite = cssVariableIsTrue( infiniteString );

		this.isHorizontal = cssVariableIsTrue( horizontalString );

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

		if ( this.isHorizontal ) {
			this.$element.classList.add( 'is-horizontal' );
		} else {
			this.$element.classList.add( 'is-vertical' );
		}
	};

	const handleSyncItemsClick = ( event ) => {
		if ( isAnimating() ) {
			return;
		}

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
		$synced.forEach(
			( { to, currentElement, isAnimating, visibleItems } ) => {
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

				const visibleIndexes = [];
				visibleItems().forEach( ( $item ) => {
					const itemIndex = parseInt( $item.dataset.index, 10 );
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

	const initialCloneItems = () => {
		const lastItemsIndex = this.totalItems - 1;

		// Append First Items
		for ( let index = 0; index < this.visibleItem; index++ ) {
			const clone = this.$items[ index ].cloneNode( true );
			clone.classList.add( 'clone' );
			clone.classList.remove( 'current' );
			clone.classList.remove( 'active' );
			this.$slider.append( clone );
		}

		// Prepend Last Items
		for ( let index = 0; index < this.visibleItem; index++ ) {
			const clone =
				this.$items[ lastItemsIndex - index ].cloneNode( true );
			clone.classList.add( 'clone' );
			clone.classList.remove( 'active' );
			clone.classList.remove( 'current' );
			this.$slider.prepend( clone );
		}
	};

	const setInitialIndex = () => {
		const $items = this.$slider.querySelectorAll( 'li' );

		$items.forEach( ( $item, index ) => {
			if ( $item.classList.contains( 'active' ) ) {
				this.currentIndex = index;

				$item.setAttribute( 'aria-hidden', 'false' );

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

	const visibleItems = () => {
		return this.$slider.querySelectorAll( 'li.active' );
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

		$items[ this.currentIndex ].setAttribute( 'aria-hidden', 'false' );
		$items[ this.currentIndex ].classList.add( 'current' );

		for ( let i = 0; i < this.visibleItem; i++ ) {
			const key = i + this.currentIndex;
			$items[ key ].setAttribute( 'aria-hidden', 'false' );
			$items[ key ].classList.add( 'active' );
		}
	};

	const removeClasses = () => {
		this.$slider.classList.remove( 'animating' );
		const $items = this.$slider.querySelectorAll( 'li' );
		$items.forEach( ( $item ) => {
			$item.setAttribute( 'aria-hidden', 'true' );
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

		this.cleanupSwipe = swipeEvent( this.$container, handleSwipe, {
			offset: 50,
		} );
		// this.$container.addEventListener( 'swipe', handleSwipe );
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
		$items.forEach( ( $item ) => {
			$item.setAttribute( 'aria-hidden', 'true' );
			$item.classList.remove( 'active' );
			$item.classList.remove( 'current' );
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
			.removeEventListener( 'click', handlePrev );

		this.$element
			.querySelector( this.settings.nextControlSelector )
			.removeEventListener( 'click', handleNext );

		this.$slider.querySelectorAll( 'li' ).forEach( ( $li ) => {
			$li.removeEventListener( 'click', handleSyncItemsClick );
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
	};

	// Expose to public.
	const expose = () => ( {
		handlePrev,
		handleNext,
		removeEvents,
		currentElement,
		visibleItems,
		isAnimating,
		to,
		reset,
	} );

	return init();
}

export { Plugin };
