# Slider By StorePress

Simple CSS Variable Controlled Slider.

## Local Usages

- `npm install`
- `npm run build`
- Load `./build/style-slider.css`
- Load `./build/storepress-utils.js`
- Load `./build/slider.js`
- Add `data-storepress-slider=""` attribute on any html element.

## Development

- `npm start`
- Please check `./src/style.scss`
- Please check `./src/index.js`

## Package Usages

```shell
npm i @storepress/slider @storepress/utils --save
```

- Lets create slider markup.

```html
<div role="region" aria-label="Carousel" class="slider-wrapper" data-slider-settings="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div class="active">
        <div style="background-color: #ea0606">01</div>
      </div>
      <div>
        <div style="background-color: #d780d7">02</div>
      </div>
      <div>
        <div style="background-color: #691414">03</div>
      </div>
      <div>
        <div style="background-color: #1a852f">04</div>
      </div>
      <div>
        <div style="background-color: #b051d0">05</div>
      </div>
      <div>
        <div style="background-color: #2b6091">06</div>
      </div>
      <div>
        <div style="background-color: #bbbbbb">07</div>
      </div>
    </div>
  </div>

  <div role="group" aria-label="Slide controls" class="storepress-slider-controls">
    <div class="storepress-slider-navigation">
      <button role="button" aria-label="Previous slide" class="storepress-slider-navigation-previous">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M768 903.232l-50.432 56.768L256 512l461.568-448 50.432 56.768L364.928 512z" />
        </svg>
      </button>
      <button role="button" aria-label="Next slide" class="storepress-slider-navigation-next">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M256 120.768L306.432 64 768 512l-461.568 448L256 903.232 659.072 512z" />
        </svg>
      </button>
    </div>

    <div class="storepress-slider-pagination">
      <button>1</button>
    </div>
  </div>
</div>
```

- Create `custom-slider.scss` file

```scss
@charset "UTF-8";

@use "~@storepress/slider/src/mixins" as slider;

[data-slider-settings] {

  @include slider.slider-init();

  & {
    --slides-to-show: 1; // Slide show at a time.
    --slides-to-scroll: 1; // Slide scroll at a time
    --slider-can-swipe: true; // Can user slide by swap
    --slider-swipe-offset: 50; // Swipe offset
    --slider-initial-item: 0; // Default active item
    --infinite-slides: true; // Is infinite slide.
    --is-horizontal: true; // is horizontal slide
    --is-always-center: false;
    --is-active-select: false; // Is goto that slide if click
    --slides-autoplay: false;
    --show-control-pagination: true;
    --show-control-navigation: true;
    --slides-autoplay-timeout: 3000; // In Milliseconds.
    --slider-min-item-size: 100px;
    --is-adaptive-size: false;
    --slider-item-gap: 0px;
    --control-navigation-color: #000;
    --control-navigation-size: 30px;

    --sliding-duration: 500ms;
    // Generate Transition: https://matthewlein.com/tools/ceaser
    --sliding-timing-function: var(--ease-in-out-expo); /* easeInOutExpo */

  }
}

```

- Create `custom-slider.js` file

```js
/**
 * External dependencies
 */
import StorePressSlider from '@storepress/slider'
import { triggerEvent } from '@storepress/utils'

document.addEventListener('DOMContentLoaded', () => {
  StorePressSlider.init()
})
```

## External Controls

```js

	document.getElementById('destroy').addEventListener('click', () => {
		const Slider = StorePress.Utils.getStorePressPlugin('slider')
		Slider.destroy()
	})

	document.getElementById('init').addEventListener('click', () => {
		const Slider = StorePress.Utils.getStorePressPlugin('slider')
		Slider.init()
	})

  // Clear Instance with events.
	document.getElementById('setup').addEventListener('click', () => {
		const Slider = StorePress.Utils.getStorePressPlugin('slider')
		Slider.setup()
	})
  
  // Clear Instance with events.
	document.getElementById('clear').addEventListener('click', () => {
		const Slider = StorePress.Utils.getStorePressPlugin('slider')
		Slider.clear()
	})

	const $godot = document.querySelectorAll('.goto-dot')
	const $goslide = document.querySelectorAll('.goto-slide')

  const $slider1 = StorePress.Utils.getPluginInstance('.slider-wrapper', 'slider')
  const $slider2 = StorePress.Utils.getStorePressPlugin('slider').get('.slider-wrapper')
  const $slider3 = StorePress.Utils.getStorePressPlugin('slider').get()
  

	$godot.forEach(($item) => {
		$item.addEventListener('click', (event) => {
			event.preventDefault()


      
			const dot = event.currentTarget.dataset.target
			$slider3.forEach((el) => {
				el.goToDot(dot)
			})
		})
	})
	$goslide.forEach(($item) => {
		$item.addEventListener('click', (event) => {
			event.preventDefault()

			const $slider = StorePress.Utils.getPluginInstance('.slider-wrapper', 'slider')
			const $slider2 = StorePress.Utils.getStorePressPlugin('slider').get('.slider-wrapper')
			const $slider3 = StorePress.Utils.getStorePressPlugin('slider').get()

			// console.log($slider, $slider2)
			//return;

			const dot = event.currentTarget.dataset.target
			$slider3.forEach((el) => {
				el.goToSlide(dot)
			})
		})
	})

	document.querySelector('#prev').addEventListener('click', (event) => {
		event.preventDefault()
		const $slider = StorePress.Utils.getPluginInstance('.slider-wrapper', 'slider')
		const $slider2 = StorePress.Utils.getStorePressPlugin('slider').get('.slider-wrapper')
		const $slider3 = StorePress.Utils.getStorePressPlugin('slider').get()

		$slider3.forEach((el) => {
			el.handlePrev()
		})
	})

	document.querySelector('#next').addEventListener('click', (event) => {
		event.preventDefault()
		const $slider = StorePress.Utils.getPluginInstance('.slider-wrapper', 'slider')
		const $slider2 = StorePress.Utils.getStorePressPlugin('slider').get('.slider-wrapper')
		const $slider3 = StorePress.Utils.getStorePressPlugin('slider').get()

		$slider3.forEach((el) => {
			el.handleNext()
		})
	})
```

## Controls

- See more on `~@storepress/slider/src/mixins`

```css

:where(.slider-wrapper) {
			--slides-to-show: 3;

			--slides-to-scroll: 2;

			--slider-min-item-size: 200px;

			--is-active-select: true;

			--infinite-slides: true;

			--is-always-center: true;

			--is-horizontal: true;

			--slider-item-gap: 1px;

			--item-padding: 10px;

			@media (max-width: 800px) {

				--slides-to-show: 2;

				--slides-to-scroll: 2;
			}
  
			@media (max-width: 400px) {

				--slides-to-show: 1;

				--slides-to-scroll: 1;
        
        --is-horizontal: false;
			}
		}

:where(.storepress-slider-container) {
  box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.51);
  border-radius: 10px;

  padding-inline: var(--item-padding);
  padding-block: 0;

  /** @container style() still not supported on firefox */
  @container style(--is-horizontal: true) {
    padding-inline: var(--item-padding);
    padding-block: 0;
  }

  @container style(--is-horizontal: false) {
    padding-block: var(--item-padding);
    padding-inline: 0;
  }
}
  
  /*
  .storepress-slider-container.position-start {
    padding-inline-end: calc( var(--item-padding) * 2 );
    padding-inline-start: 0;
  }

  .storepress-slider-container.position-middle {
    padding-inline: var(--item-padding);
  }

  .storepress-slider-container.position-end {
    padding-inline-end: 0;
    padding-inline-start: calc( var(--item-padding) * 2 );
  }*/
```

## Options

- Option can be added on html attribute.

```html
<div data-slider-settings="{'sliderDotsTitle':'Goto Slider'}"></div>
```

- OR

```html
<div data-slider-settings--slider-dots-title="Goto Slider"></div>
```

- [Check Example](https://emranahmed.github.io/storepress-packages/?path=/docs/utils-plugin-example--docs) 

## Control Events

- To Init

```js
triggerEvent(document, 'storepress_slider_init', {
  element: ['.slider-wrapper'],
  settings: {
    sliderDotsTitle: 'Goto Slider'
  },
});
```

- To Destroy 

```js
triggerEvent(document, 'storepress_slider_destroy', {
  element: ['.slider-wrapper'],
  settings: {},
});
```

- To Next

```js
triggerEvent(document, 'storepress_slider_next', {
  element: ['[data-slider-settings]'],
  settings: {},
});
```

- To Prev

```js
triggerEvent(document, 'storepress_slider_prev', {
  element: ['[data-slider-settings]'],
  settings: {},
});
```

- Go To Slide. Slide Index Start from `1`

```js
triggerEvent(document, 'storepress_slider_goto_slider', {
  element: ['[data-slider-settings]'],
  settings: {},
  index: 1
});
```

- Go To Dot. Dot Index Start from `1`

```js
triggerEvent(document, 'storepress_slider_goto_dot', {
  element: ['[data-slider-settings]'],
  settings: {},
  index: 1
});
```

## Triggered Event

- `destroy`. Example: `document.querySelector('[data-slider-settings]').addEventListener('destroy', (event)=>{  })`
- `afterInit`. Example: `document.querySelector('[data-slider-settings]').addEventListener('afterInit', (event)=>{ console.log(event.detail) })`
- `beforeSlide`. Example: `document.querySelector('[data-slider-settings]').addEventListener('beforeSlide', (event)=>{ console.log(event.detail) })`
- `afterGotoSlide`. Example: `document.querySelector('[data-slider-settings]').addEventListener('afterGotoSlide', (event)=>{ console.log(event.detail) })`
- `afterSlide`. Example: `document.querySelector('[data-slider-settings]').addEventListener('afterSlide', (event)=>{ console.log(event.detail) })`
