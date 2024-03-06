const sliderWrapper = document.querySelector( '.slider-wrapper' ); // container

const showItem = parseInt(
	window.getComputedStyle( sliderWrapper ).getPropertyValue( '--show-item' ),
	10
);

let itemsPerSlide = parseInt(
	window.getComputedStyle( sliderWrapper ).getPropertyValue( '--slide-item' ),
	10
);

if ( showItem < itemsPerSlide ) {
	itemsPerSlide = showItem;
}

const slider = sliderWrapper.querySelector( '.slider' ); //  slide
const sliderItems = slider.querySelectorAll( 'li' ); // slider item
const totalItems = sliderItems.length;
const lastItemsIndex = sliderItems.length - 1;

const nextBtn = document.querySelector( '.right' );
const prevBtn = document.querySelector( '.left' );

let currentIndex = 0;

for ( let index = 0; index < showItem; index++ ) {
	const firstClone = sliderItems[ index ].cloneNode( true );
	firstClone.classList.add( 'clone' );
	firstClone.classList.remove( 'active' );
	slider.append( firstClone );
}

for ( let index = 0; index < showItem; index++ ) {
	const lastClone = sliderItems[ lastItemsIndex - index ].cloneNode( true );
	lastClone.classList.add( 'clone' );
	lastClone.classList.remove( 'active' );
	slider.prepend( lastClone );
}

const sliderItemsWithCloned = slider.querySelectorAll( 'li' );

sliderItemsWithCloned.forEach( ( item, indx ) => {
	if ( item.classList.contains( 'active' ) ) {
		currentIndex = indx;
		sliderWrapper.style.setProperty(
			'--_current-item-index',
			currentIndex
		);
		// slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
	}
} );

sliderItemsWithCloned[ currentIndex ].classList.add( 'current' );
for ( let i = 0; i < showItem; i++ ) {
	const x = i + currentIndex;

	sliderItemsWithCloned[ x ].classList.add( 'active' );
}

// Prev
prevBtn.addEventListener( 'click', ( event ) => {
	event.preventDefault();

	if ( slider.classList.contains( 'animating' ) ) {
		return;
	}

	const remaining = currentIndex - itemsPerSlide;
	let s = itemsPerSlide < remaining ? itemsPerSlide : remaining;

	if ( remaining === 0 ) {
		s = itemsPerSlide;
	}

	if ( ! sliderWrapper.classList.contains( 'infinite' ) ) {
		if ( currentIndex - s - showItem < 0 ) {
			return;
		}
	}

	currentIndex -= s;

	slider.classList.add( 'animating' );
	sliderWrapper.style.setProperty( '--_current-item-index', currentIndex );
	//slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
} );

// Next
nextBtn.addEventListener( 'click', ( event ) => {
	event.preventDefault();

	if ( slider.classList.contains( 'animating' ) ) {
		return;
	}

	const remaining = totalItems - currentIndex;

	let s = itemsPerSlide < remaining ? itemsPerSlide : remaining;

	if ( remaining === 0 ) {
		s = itemsPerSlide;
	}

	// for stoping infinit scroll
	if ( ! sliderWrapper.classList.contains( 'infinite' ) ) {
		if ( currentIndex + s > totalItems ) {
			return;
		}
	}

	currentIndex += s;

	slider.classList.add( 'animating' );
	//slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
	sliderWrapper.style.setProperty( '--_current-item-index', currentIndex );
} );

// before slide
slider.addEventListener( 'transitionstart', ( event ) => {
	sliderItemsWithCloned.forEach( ( item ) => {
		item.classList.remove( 'active' );
		item.classList.remove( 'current' );
	} );
} );

// after slide
slider.addEventListener( 'transitionend', ( event ) => {
	slider.classList.remove( 'animating' );

	// fix prev

	if ( currentIndex === 0 ) {
		currentIndex = sliderItems.length;
		sliderWrapper.style.setProperty(
			'--_current-item-index',
			currentIndex
		);
		//slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
	}

	// fix next
	if ( currentIndex > sliderItems.length ) {
		currentIndex = currentIndex - sliderItems.length;
		//slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
		sliderWrapper.style.setProperty(
			'--_current-item-index',
			currentIndex
		);
	}

	sliderItemsWithCloned[ currentIndex ].classList.add( 'current' );
	for ( let i = 0; i < showItem; i++ ) {
		const x = i + currentIndex;

		sliderItemsWithCloned[ x ].classList.add( 'active' );
	}
} );

function goto( index, isCenter = true ) {
	if ( index < 1 ) {
		return;
	}

	if ( index > totalItems ) {
		return;
	}

	slider.classList.add( 'animating' );
	const centerIndex = isCenter ? 1 : 0;
	currentIndex = index + showItem - 1 - centerIndex;
	sliderWrapper.style.setProperty( '--_current-item-index', currentIndex );
	//slider.style.transform = `translateX(-${sliderItemWidth * currentIndex}px)`
}
