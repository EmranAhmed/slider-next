import { test } from 'uvu';
import * as assert from 'uvu/assert';

/**
 * Sliding Window Pagination Algorithm
 *
 * Generates pagination windows for carousel/slider navigation with configurable
 * starting index. Each window contains a fixed number of visible items, advancing
 * by a specified scroll amount. The last window is automatically clamped to stay
 * within the valid range.
 *
 * @param {number} total     - Total number of items to paginate
 * @param {number} show      - Number of items visible in each window
 * @param {number} scroll    - Number of items to advance per pagination step
 * @param {number} [index=0] - Starting index offset (default: 0 for zero-based indexing)
 *
 * @return {Array<Array<number>>} Array of pagination windows, where each window
 *                                  is an array of item indices
 *
 * @example
 * // Basic usage with 7 items, showing 2 at a time, scrolling by 1
 * generateSliderData(7, 2, 1);
 * // Returns: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]]
 *
 * @example
 * // With larger scroll step
 * generateSliderData(7, 2, 2);
 * // Returns: [[0,1], [2,3], [4,5], [5,6]]
 *
 * @example
 * // With custom starting index
 * generateSliderData(7, 3, 2, 1);
 * // Returns: [[1,2,3], [3,4,5], [5,6,7]]
 *
 * @example
 * // Perfect fit - no overlap on last window
 * generateSliderData(9, 3, 3);
 * // Returns: [[0,1,2], [3,4,5], [6,7,8]]
 *
 * @throws {TypeError} If any parameter is not a number
 * @throws {RangeError} If show > total or scroll <= 0
 *
 * @see https://en.wikipedia.org/wiki/Sliding_window_protocol
 */

function generateSliderData( total, show, scroll, index = 0 ) {
	const totalDot = Math.ceil( ( total - show ) / scroll ) + 1;

	return Array.from( { length: totalDot }, ( $, i ) => {
		let start = i * scroll + index;
		if ( start + show > total + index ) {
			start = total + index - show;
		}
		return Array.from( { length: show }, ( _, j ) => start + j );
	} );
}
function createData( total, show, scroll, infinite = false ) {
	const cloned = infinite ? show + scroll : 0;

	const totalDot = infinite
		? Math.ceil( total / scroll )
		: Math.ceil( ( total - show ) / scroll ) + 1;

	return Array.from( { length: totalDot }, ( $, i ) => {
		let start = i * scroll + cloned;
		if ( ! infinite && start + show > total + cloned ) {
			start = total + cloned - show;
		}
		return Array.from( { length: show }, ( _, j ) => start + j );
	} );
}
test( 'should handle total=7, show=2, scroll=1', () => {
	const actual = createData( 7, 2, 1 );
	const expects = [
		[ 0, 1 ],
		[ 1, 2 ],
		[ 2, 3 ],
		[ 3, 4 ],
		[ 4, 5 ],
		[ 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=2, scroll=1, infinite = true', () => {
	const actual = createData( 7, 2, 1, true );
	const expects = [
		[ 3, 4 ],
		[ 4, 5 ],
		[ 5, 6 ],
		[ 6, 7 ],
		[ 7, 8 ],
		[ 8, 9 ],
		[ 9, 10 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=2, scroll=2, infinite = true', () => {
	const actual = createData( 7, 2, 2, true );
	const expects = [
		[ 4, 5 ],
		[ 6, 7 ],
		[ 8, 9 ],
		[ 10, 11 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=2, scroll=2', () => {
	const actual = generateSliderData( 7, 2, 2 );
	const expects = [
		[ 0, 1 ],
		[ 2, 3 ],
		[ 4, 5 ],
		[ 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=3, scroll=1', () => {
	const actual = generateSliderData( 7, 3, 1 );
	const expects = [
		[ 0, 1, 2 ],
		[ 1, 2, 3 ],
		[ 2, 3, 4 ],
		[ 3, 4, 5 ],
		[ 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=3, scroll=2', () => {
	const actual = generateSliderData( 7, 3, 2 );
	const expects = [
		[ 0, 1, 2 ],
		[ 2, 3, 4 ],
		[ 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=3, scroll=3', () => {
	const actual = generateSliderData( 7, 3, 3 );
	const expects = [
		[ 0, 1, 2 ],
		[ 3, 4, 5 ],
		[ 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=4, scroll=1', () => {
	const actual = generateSliderData( 7, 4, 1 );
	const expects = [
		[ 0, 1, 2, 3 ],
		[ 1, 2, 3, 4 ],
		[ 2, 3, 4, 5 ],
		[ 3, 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=4, scroll=2', () => {
	const actual = generateSliderData( 7, 4, 2 );
	const expects = [
		[ 0, 1, 2, 3 ],
		[ 2, 3, 4, 5 ],
		[ 3, 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=4, scroll=3', () => {
	const actual = generateSliderData( 7, 4, 3 );
	const expects = [
		[ 0, 1, 2, 3 ],
		[ 3, 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=7, show=4, scroll=4', () => {
	const actual = generateSliderData( 7, 4, 4 );
	const expects = [
		[ 0, 1, 2, 3 ],
		[ 3, 4, 5, 6 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=8, show=3, scroll=2', () => {
	const actual = generateSliderData( 8, 3, 2 );
	const expects = [
		[ 0, 1, 2 ],
		[ 2, 3, 4 ],
		[ 4, 5, 6 ],
		[ 5, 6, 7 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=11, show=3, scroll=2', () => {
	const actual = generateSliderData( 11, 3, 2 );
	const expects = [
		[ 0, 1, 2 ],
		[ 2, 3, 4 ],
		[ 4, 5, 6 ],
		[ 6, 7, 8 ],
		[ 8, 9, 10 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle total=11, show=3, scroll=3', () => {
	const actual = generateSliderData( 11, 3, 3 );
	const expects = [
		[ 0, 1, 2 ],
		[ 3, 4, 5 ],
		[ 6, 7, 8 ],
		[ 8, 9, 10 ],
	];

	assert.equal( actual, expects );
} );

test( 'should handle edge case: show equals total', () => {
	const actual = generateSliderData( 5, 1, 1 );
	const expects = [ [ 0 ], [ 1 ], [ 2 ], [ 3 ], [ 4 ] ];

	assert.equal( actual, expects );
} );

test.run();
