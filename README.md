# StorePress Slider

A lightweight, CSS variable-controlled carousel/slider library built with vanilla JavaScript. Configure behavior entirely through CSS custom properties—no JavaScript configuration required.

[![npm version](https://img.shields.io/npm/v/@storepress/slider.svg)](https://www.npmjs.com/package/@storepress/slider)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **CSS Variable Configuration** — Control slides-to-show, scroll amount, autoplay, infinite loop, and more through CSS custom properties
- **Touch/Swipe Support** — Native touch gestures with configurable swipe threshold
- **Responsive by Design** — Use CSS media queries to adjust slider behavior at different breakpoints
- **Multiple Orientations** — Horizontal and vertical sliding support
- **Infinite & Finite Modes** — Seamless looping or bounded navigation
- **Built-in Controls** — Navigation arrows and pagination dots included
- **Event-Driven API** — Lifecycle hooks for `beforeSlide`, `afterSlide`, `afterInit`, and more
- **Programmatic Control** — Full API for external control (`goToSlide`, `goToDot`, `handlePrev`, `handleNext`)
- **Zero Dependencies** — Pure vanilla JavaScript, no jQuery required
- **Accessibility** — ARIA attributes and keyboard navigation support

## Demo

[Live Demo](https://emranahmed.github.io/storepress-slider/)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [HTML Structure](#html-structure)
- [CSS Configuration](#css-configuration)
- [JavaScript Initialization](#javascript-initialization)
- [Configuration Options](#configuration-options)
- [Responsive Breakpoints](#responsive-breakpoints)
- [API Methods](#api-methods)
- [Events](#events)
- [External Controls](#external-controls)
- [Styling Guide](#styling-guide)
- [Examples](#examples)

## Installation

### NPM (Recommended)

```bash
npm install @storepress/slider @storepress/utils --save
```

### Local Build

```bash
git clone https://github.com/EmranAhmed/storepress-slider.git
cd storepress-slider
npm install
npm run build
```

After building, include the following files:

- `./build/style-slider.css`
- `./build/storepress-utils.js`
- `./build/slider.js`

## Quick Start

### 1. Add HTML Markup

```html
<div class="slider-wrapper" data-storepress-slider="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div class="active"><img src="slide-1.jpg" alt="Slide 1"></div>
      <div><img src="slide-2.jpg" alt="Slide 2"></div>
      <div><img src="slide-3.jpg" alt="Slide 3"></div>
    </div>
  </div>
</div>
```

### 2. Add CSS Configuration

```scss
@use "@storepress/slider/src/mixins" as slider;

[data-storepress-slider] {
  @include slider.init();
  
  --slides-to-show: 3;
  --slides-to-scroll: 1;
  --infinite-slides: true;
  --slider-item-gap: 16px;
}
```

### 3. Initialize JavaScript

```javascript
import StorePressSlider from '@storepress/slider';

document.addEventListener('DOMContentLoaded', () => {
  StorePressSlider.init();
});
```

## HTML Structure

The slider requires a specific HTML structure:

- NOTE: To prevent loading jump if first visible items is small but hidden items is large on `adaptive size: true`
- add `has-visible-items-is-small` class

```html
<div 
  role="region" 
  aria-label="Carousel" 
  class="slider-wrapper" 
  data-storepress-slider="{'sliderDotsTitle':'Goto Slider'}"
>
  <!-- Slider Container -->
  <div class="storepress-slider-container">
    <!-- Slider Track (contains slides) -->
    <div class="storepress-slider-track">
      <div class="active">
        <div style="background-color: #ea0606">Slide 1</div>
      </div>
      <div>
        <div style="background-color: #d780d7">Slide 2</div>
      </div>
      <div>
        <div style="background-color: #1a852f">Slide 3</div>
      </div>
      <div>
        <div style="background-color: #2b6091">Slide 4</div>
      </div>
    </div>
  </div>

  <!-- Controls (Optional) -->
  <div role="group" aria-label="Slide controls" class="storepress-slider-controls">
    <!-- Navigation Arrows -->
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

    <!-- Pagination Dots -->
    <div class="storepress-slider-pagination">
      <button>1</button>
    </div>
  </div>
</div>
```

### Structure Breakdown

| Element | Class | Description |
|---------|-------|-------------|
| Wrapper | `.slider-wrapper` | Main container with `data-storepress-slider` attribute |
| Container | `.storepress-slider-container` | Viewport that clips the slider track |
| Track | `.storepress-slider-track` | Contains all slide items, transforms during sliding |
| Slide | Direct children of track | Individual slide items |
| Controls | `.storepress-slider-controls` | Wrapper for navigation and pagination |
| Navigation | `.storepress-slider-navigation` | Contains prev/next buttons |
| Pagination | `.storepress-slider-pagination` | Contains dot indicators |

## CSS Configuration

All slider behavior is controlled through CSS custom properties. This allows responsive configuration using media queries.

### Complete SCSS Setup

```scss
@charset "UTF-8";
@use "@storepress/slider/src/mixins" as slider;

[data-storepress-slider] {
  // Initialize slider styles
  @include slider.init();

  // Slide Display
  --slides-to-show: 3;           // Number of visible slides
  --slides-to-scroll: 1;         // Slides to move per navigation
  --slider-initial-item: 0;      // Starting slide index (0-based)

  // Behavior
  --infinite-slides: true;       // Enable infinite looping
  --is-horizontal: true;         // true = horizontal, false = vertical
  --is-always-center: false;     // Keep active slide centered
  --is-active-select: false;     // Click slide to navigate to it

  // Touch/Swipe
  --slider-can-swipe: true;      // Enable touch/drag sliding
  --slider-swipe-offset: 50;     // Minimum swipe distance (px)

  // Autoplay
  --slides-autoplay: false;      // Enable automatic sliding
  --slides-autoplay-timeout: 3000; // Delay between slides (ms)

  // Controls Visibility
  --show-control-pagination: true;  // Show dot indicators
  --show-control-navigation: true;  // Show prev/next arrows

  // Sizing
  --slider-min-item-size: 100px;    // Minimum slide width/height
  --slider-item-gap: 0px;           // Gap between slides
  --is-adaptive-size: false;        // Adapt to content size

  // Animation
  --sliding-duration: 500ms;
  --sliding-timing-function: var(--ease-in-out-expo);

  // Navigation Styling
  --control-navigation-color: #000;
  --control-navigation-size: 30px;
}
```

### Available CSS Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `--slides-to-show` | Number | `1` | Visible slides at once |
| `--slides-to-scroll` | Number | `1` | Slides moved per navigation |
| `--slider-initial-item` | Number | `0` | Initial active slide index |
| `--infinite-slides` | Boolean | `true` | Enable infinite loop |
| `--is-horizontal` | Boolean | `true` | Slide direction |
| `--is-always-center` | Boolean | `false` | Center active slide |
| `--is-active-select` | Boolean | `false` | Click-to-select slides |
| `--slider-can-swipe` | Boolean | `true` | Enable swipe/drag |
| `--slider-swipe-offset` | Number | `50` | Minimum swipe distance |
| `--slides-autoplay` | Boolean | `false` | Auto-advance slides |
| `--slides-autoplay-timeout` | Number | `3000` | Autoplay interval (ms) |
| `--show-control-pagination` | Boolean | `true` | Show pagination dots |
| `--show-control-navigation` | Boolean | `true` | Show nav arrows |
| `--slider-min-item-size` | Length | `100px` | Minimum slide size |
| `--slider-item-gap` | Length | `0px` | Gap between slides |
| `--is-adaptive-size` | Boolean | `false` | Adapt to content |
| `--sliding-duration` | Time | `500ms` | Transition duration |
| `--sliding-timing-function` | Function | `ease-in-out-expo` | Transition easing |
| `--control-navigation-color` | Color | `#000` | Arrow color |
| `--control-navigation-size` | Length | `30px` | Arrow size |

## JavaScript Initialization

### NPM Module

```javascript
import StorePressSlider from '@storepress/slider';
import { triggerEvent } from '@storepress/utils';

document.addEventListener('DOMContentLoaded', () => {
  StorePressSlider.init();
});
```

### Script Tag (After Build)

```html
<script src="./build/storepress-utils.js"></script>
<script src="./build/slider.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const Slider = StorePress.Utils.getStorePressPlugin('slider');
    Slider.init();
  });
</script>
```

### With Data Attribute

Simply add `data-storepress-slider=""` to any element for automatic initialization:

```html
<div data-storepress-slider="">
  <!-- slides -->
</div>
```

## Configuration Options

Options can be passed via HTML data attributes in two formats:

### JSON Format

```html
<div data-storepress-slider="{'sliderDotsTitle':'Goto Slider','infiniteSlides':true}">
```

### Individual Attributes

```html
<div 
  data-storepress-slider=""
  data-storepress-slider--slider-dots-title="Goto Slider"
  data-storepress-slider--infinite-slides="true"
>
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sliderDotsTitle` | String | `''` | Accessibility title for dots |

## Responsive Breakpoints

Use CSS media queries to create responsive slider configurations:

```scss
[data-storepress-slider] {
  @include slider.init();

  // Desktop (default)
  --slides-to-show: 4;
  --slides-to-scroll: 2;
  --slider-item-gap: 24px;
  --is-horizontal: true;

  // Tablet
  @media (max-width: 992px) {
    --slides-to-show: 3;
    --slides-to-scroll: 1;
    --slider-item-gap: 16px;
  }

  // Mobile Landscape
  @media (max-width: 768px) {
    --slides-to-show: 2;
    --slides-to-scroll: 1;
    --slider-item-gap: 12px;
  }

  // Mobile Portrait
  @media (max-width: 480px) {
    --slides-to-show: 1;
    --slides-to-scroll: 1;
    --slider-item-gap: 8px;
    --is-horizontal: false; // Switch to vertical
  }
}
```

## API Methods

### Getting Slider Instance

```javascript
// Method 1: Get specific slider instance
const slider = StorePress.Utils.getPluginInstance('.slider-wrapper', 'slider');

// Method 2: Get via plugin manager
const slider = StorePress.Utils.getStorePressPlugin('slider').get('.slider-wrapper');

// Method 3: Get all slider instances
const allSliders = StorePress.Utils.getStorePressPlugin('slider').get();
```

### Instance Methods

```javascript
// Navigation
slider.handlePrev();           // Go to previous slide(s)
slider.handleNext();           // Go to next slide(s)
slider.goToSlide(index);       // Go to specific slide (0-based)
slider.goToDot(index);         // Go to specific dot/page (0-based)

// Lifecycle
slider.init();                 // Initialize slider
slider.destroy();              // Destroy slider instance
slider.setup();                // Clear and reinitialize
slider.clear();                // Clear instance and events
```

### Global Plugin Methods

```javascript
const SliderPlugin = StorePress.Utils.getStorePressPlugin('slider');

SliderPlugin.init();           // Initialize all sliders
SliderPlugin.destroy();        // Destroy all sliders
SliderPlugin.setup();          // Reinitialize all sliders
SliderPlugin.clear();          // Clear all instances
SliderPlugin.get();            // Get all instances
SliderPlugin.get('.selector'); // Get specific instance(s)
```

## Events

The slider dispatches custom events on the wrapper element:

| Event | Description | Detail Properties |
|-------|-------------|-------------------|
| `afterInit` | Fired after initialization | Instance data |
| `beforeSlide` | Fired before slide transition | Current/target indices |
| `afterSlide` | Fired after slide transition | Current index |
| `afterGotoSlide` | Fired after goToSlide completes | Target index |
| `destroy` | Fired when slider is destroyed | — |

### Event Usage

```javascript
const sliderEl = document.querySelector('[data-slider-settings]');

sliderEl.addEventListener('afterInit', (event) => {
  console.log('Slider initialized:', event.detail);
});

sliderEl.addEventListener('beforeSlide', (event) => {
  console.log('About to slide:', event.detail);
});

sliderEl.addEventListener('afterSlide', (event) => {
  console.log('Slide complete:', event.detail);
});

sliderEl.addEventListener('afterGotoSlide', (event) => {
  console.log('Navigated to slide:', event.detail);
});

sliderEl.addEventListener('destroy', () => {
  console.log('Slider destroyed');
});
```

## External Controls

Create custom controls outside the slider:

```html
<button id="prev-btn">Previous</button>
<button id="next-btn">Next</button>
<button id="goto-slide-3">Go to Slide 3</button>

<div class="slider-wrapper" data-storepress-slider="">
  <!-- slider content -->
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const SliderPlugin = StorePress.Utils.getStorePressPlugin('slider');
  SliderPlugin.init();

  const sliders = SliderPlugin.get();

  // Previous button
  document.getElementById('prev-btn').addEventListener('click', () => {
    sliders.forEach(slider => slider.handlePrev());
  });

  // Next button
  document.getElementById('next-btn').addEventListener('click', () => {
    sliders.forEach(slider => slider.handleNext());
  });

  // Go to specific slide
  document.getElementById('goto-slide-3').addEventListener('click', () => {
    sliders.forEach(slider => slider.goToSlide(3)); // non 0-based index
  });
});
</script>
```

### Control Lifecycle

```javascript
const SliderPlugin = StorePress.Utils.getStorePressPlugin('slider');

// Destroy and reinitialize
document.getElementById('reset-btn').addEventListener('click', () => {
  SliderPlugin.destroy();
  SliderPlugin.init();
});

// Pause/Resume (for autoplay)
document.getElementById('pause-btn').addEventListener('click', () => {
  SliderPlugin.destroy();
});

document.getElementById('resume-btn').addEventListener('click', () => {
  SliderPlugin.init();
});
```

## Styling Guide

### Container Styling

```scss
.storepress-slider-container {
  box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 10px;

  // Horizontal padding
  @container style(--is-horizontal: true) {
    padding-inline: 10px;
    padding-block: 0;
  }

  // Vertical padding
  @container style(--is-horizontal: false) {
    padding-block: 10px;
    padding-inline: 0;
  }
}
```

### Slide Item Styling

```scss
.storepress-slider-track > * {
  // Slide styling
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
}
```

### Navigation Arrow Styling

```scss
.storepress-slider-navigation button {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  padding: 10px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  svg {
    fill: white;
    width: 20px;
    height: 20px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}
```

### Pagination Dot Styling

```scss
.storepress-slider-pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;

  button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #333;
    background: transparent;
    cursor: pointer;
    font-size: 0; // Hide text
    transition: all 0.3s;

    &.active,
    &:hover {
      background: #333;
    }
  }
}
```

## Examples

### Basic Image Slider

```html
<div class="image-slider" data-storepress-slider="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div class="active"><img src="image1.jpg" alt=""></div>
      <div><img src="image2.jpg" alt=""></div>
      <div><img src="image3.jpg" alt=""></div>
    </div>
  </div>
</div>

<style>
.image-slider {
  --slides-to-show: 1;
  --infinite-slides: true;
  --slides-autoplay: true;
  --slides-autoplay-timeout: 4000;
}
</style>
```

### Product Carousel

```html
<div class="product-carousel" data-storepress-slider="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div class="product-card">
        <img src="product1.jpg" alt="Product 1">
        <h3>Product Name</h3>
        <p>$99.99</p>
      </div>
      <!-- More products -->
    </div>
  </div>
  <div class="storepress-slider-controls">
    <div class="storepress-slider-navigation">
      <button class="storepress-slider-navigation-previous">←</button>
      <button class="storepress-slider-navigation-next">→</button>
    </div>
  </div>
</div>

<style>
.product-carousel {
  --slides-to-show: 4;
  --slides-to-scroll: 1;
  --slider-item-gap: 20px;
  --infinite-slides: false;
}

@media (max-width: 768px) {
  .product-carousel {
    --slides-to-show: 2;
  }
}
</style>
```

### Vertical Testimonial Slider

```html
<div class="testimonial-slider" data-storepress-slider="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div class="testimonial">
        <p>"Great product!"</p>
        <span>— Customer Name</span>
      </div>
      <!-- More testimonials -->
    </div>
  </div>
</div>

<style>
.testimonial-slider {
  --is-horizontal: false;
  --slides-to-show: 1;
  --slides-autoplay: true;
  --sliding-duration: 800ms;
  height: 200px;
}
</style>
```

### Centered Gallery

```html
<div class="gallery-slider" data-storepress-slider="">
  <div class="storepress-slider-container">
    <div class="storepress-slider-track">
      <div><img src="gallery1.jpg" alt=""></div>
      <div><img src="gallery2.jpg" alt=""></div>
      <div><img src="gallery3.jpg" alt=""></div>
      <div><img src="gallery4.jpg" alt=""></div>
      <div><img src="gallery5.jpg" alt=""></div>
    </div>
  </div>
  <div class="storepress-slider-controls">
    <div class="storepress-slider-pagination">
      <button>1</button>
    </div>
  </div>
</div>

<style>
.gallery-slider {
  --slides-to-show: 3;
  --is-always-center: true;
  --is-active-select: true;
  --slider-item-gap: 16px;
}

.gallery-slider .storepress-slider-track > div {
  opacity: 0.5;
  transform: scale(0.9);
  transition: all 0.3s;
}

.gallery-slider .storepress-slider-track > div.active {
  opacity: 1;
  transform: scale(1);
}
</style>
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run linting
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Android Chrome

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@storepress/slider)
- [GitHub Repository](https://github.com/EmranAhmed/storepress-slider)
- [Live Demo](https://emranahmed.github.io/storepress-slider/)
- [StorePress Utils](https://www.npmjs.com/package/@storepress/utils)

## Extra

- Add Tag - `git tag $(node -p "require('./package.json').version") && git push origin "$_"`
- Delete Tag - `git tag -d $(node -p "require('./package.json').version") && git push origin --delete "$_"`
- Publish - `npm publish`
