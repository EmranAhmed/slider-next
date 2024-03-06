/**
 * External dependencies
 */
import { getOptionsFromAttribute } from '@storepress/utils';

function Plugin( element, options ) {
	// Default Settings
	const DEFAULTS = {
		moveItemsCSSProperty: '--slide-item',
		visibleItemsCSSProperty: '--show-item',
		isInfiniteCSSProperty: '--show-infinite',
		$prevControlSelector: '.prev',
		$nextControlSelector: '.next',
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

		addEvents();

		return expose();
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

		// Clone Items for Infinite Scroll.
		initialCloneItems();

		setInitialIndex();
	};

	const initialCloneItems = () => {
		if ( ! this.isInfinite ) {
			return;
		}

		const lastItemsIndex = this.totalItems - 1;

		// Append First Items
		for ( let index = 0; index < this.visibleItem; index++ ) {
			const clone = this.$items[ index ].cloneNode( true );
			clone.classList.add( 'clone' );
			clone.classList.remove( 'current' );
			clone.classList.remove( 'active' );
			this.$slider.append( clone );
		}

		// Prepend last Items
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

		$items.forEach( ( item, index ) => {
			if ( item.classList.contains( 'active' ) ) {
				this.currentIndex = index;

				// setCurrentIndex( index );

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
		this.currentIndex = index;
		const $items = this.$slider.querySelectorAll( 'li' );

		this.$element.style.setProperty( '--_current-item-index', index );

		$items[ this.currentIndex ].classList.add( 'current' );

		for ( let i = 0; i < this.visibleItem; i++ ) {
			const key = i + this.currentIndex;
			$items[ key ].classList.add( 'active' );
		}
	};

	const addEvents = () => {
		this.$element
			.querySelectorAll( this.settings.$prevControlSelector )
			.forEach( ( el ) => {
				el.addEventListener( 'click', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.$nextControlSelector )
			.forEach( ( el ) => {
				el.addEventListener( 'click', handleNext );
			} );

		this.$slider.addEventListener( 'transitionstart', beforeSlide );
		this.$slider.addEventListener( 'transitionend', afterSlide );
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
			.querySelectorAll( this.settings.$prevControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'click', handlePrev );
			} );

		this.$element
			.querySelectorAll( this.settings.$nextControlSelector )
			.forEach( ( el ) => {
				el.removeEventListener( 'click', handleNext );
			} );

		this.$slider.removeEventListener( 'transitionstart', beforeSlide );
		this.$slider.removeEventListener( 'transitionend', afterSlide );
	};

	const to = ( index, isCenter = true ) => {
		if ( index < 1 ) {
			return;
		}

		if ( index > this.totalItems ) {
			return;
		}

		const centerIndex = isCenter ? 1 : 0;
		const newIndex = index + this.visibleItem - 1 - centerIndex;

		this.$slider.classList.add( 'animating' );
		setCurrentIndex( newIndex );
	};

	const destroy2 = () => {
		removeEvents();
		this.$slider.querySelectorAll( 'li.clone' ).forEach( ( clonned ) => {
			console.log( clonned );
			clonned.remove();
		} );

		setCurrentIndex( 0 );
	};

	// Expose to public.
	const expose = () => ( {
		slidePrev,
		slideNext,
		removeEvents,
		to,
		destroy2,
	} );

	return ( () => init() )();
}

export { Plugin };
