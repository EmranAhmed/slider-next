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

const createDataNoInfinite = ( total, show, scroll ) => {
	const totalDot = Math.ceil( ( total - show ) / scroll ) + 1;

	return Array.from( { length: totalDot }, ( $, i ) => {
		let start = i * scroll;
		if ( start + show > total ) {
			start = total - show;
		}
		return Array.from( { length: show }, ( _, j ) => start + j );
	} );
};

const createDataInfinite = ( total, show, scroll ) => {
	const cloned = show + scroll;
	const maxIndex = total + cloned;

	const totalDot = Math.ceil( total / scroll );

	return Array.from( { length: totalDot }, ( $, i ) => {
		const start = i * scroll + cloned;

		return Array.from( { length: show }, ( _, j ) => {
			const index = start + j;

			return maxIndex >= index ? index : undefined;
		} ).filter( ( val ) => val !== undefined );
	} );
};

test( 'should handle total=7, show=1, scroll=1', () => {
	const actual = createDataInfinite( 7, 1, 1 );

	const expects = [ [ 2 ], [ 3 ], [ 4 ], [ 5 ], [ 6 ], [ 7 ], [ 8 ] ];

	assert.equal( actual, expects, 'Infinite Check' );

	const actual2 = createDataNoInfinite( 7, 1, 1 );
	const expects2 = [ [ 0 ], [ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ], [ 6 ] ];

	assert.equal( actual2, expects2, 'Non Infinite Check' );
} );

test( 'should handle total=7, show=2, scroll=1', () => {
	const actual = createDataInfinite( 7, 2, 1 );
	const expects = [
		[ 3, 4 ],
		[ 4, 5 ],
		[ 5, 6 ],
		[ 6, 7 ],
		[ 7, 8 ],
		[ 8, 9 ],
		[ 9, 10 ],
	];

	assert.equal( actual, expects, 'Infinite Check' );

	const actual2 = createDataNoInfinite( 7, 2, 1 );
	const expects2 = [
		[ 0, 1 ],
		[ 1, 2 ],
		[ 2, 3 ],
		[ 3, 4 ],
		[ 4, 5 ],
		[ 5, 6 ],
	];

	assert.equal( actual2, expects2, 'Non Infinite Check' );
} );

test( 'should handle total=7, show=2, scroll=2', () => {
	const actual = createDataInfinite( 7, 2, 2 );
	const expects = [
		[ 4, 5 ],
		[ 6, 7 ],
		[ 8, 9 ],
		[ 10, 11 ],
	];

	assert.equal( actual, expects, 'Infinite Check' );

	const actual2 = createDataNoInfinite( 7, 2, 2 );
	const expects2 = [
		[ 0, 1 ],
		[ 2, 3 ],
		[ 4, 5 ],
		[ 5, 6 ],
	];

	assert.equal( actual2, expects2, 'Non Infinite Check' );
} );

test( 'should handle total=7, show=3, scroll=1', () => {
	const actual = createDataInfinite( 7, 3, 1 );
	const expects = [
		[ 4, 5, 6 ],
		[ 5, 6, 7 ],
		[ 6, 7, 8 ],
		[ 7, 8, 9 ],
		[ 8, 9, 10 ],
		[ 9, 10, 11 ],
		[ 10, 11 ],
	];

	assert.equal( actual, expects, 'Infinite Check' );

	const actual2 = createDataNoInfinite( 7, 3, 1 );
	const expects2 = [
		[ 0, 1, 2 ],
		[ 1, 2, 3 ],
		[ 2, 3, 4 ],
		[ 3, 4, 5 ],
		[ 4, 5, 6 ],
	];

	assert.equal( actual2, expects2, 'Non Infinite Check' );
} );

test.run();
