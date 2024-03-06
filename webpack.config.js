const defaultConfig = require('@wordpress/scripts/config/webpack.config')
const {
	requestToExternal,
	requestToHandle,
	getFile,
	getWebPackAlias,
} = require('./bin/webpack-helpers')
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')

module.exports = {
	...defaultConfig,
	entry: {
		// ...defaultConfig.entry(),
		'slider': [
			getFile('scripts.js'),
			getFile('style.scss'),
		]
	},

	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			...getWebPackAlias(),
		},
	},

	plugins: [
		...defaultConfig.plugins,
		// Removes the empty `.js` files generated by webpack but
		// sets it after WP has generated its `*.asset.php` file.
		new RemoveEmptyScriptsPlugin({
			stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
		}),
	],
	/*optimization: {
		splitChunks: {
			chunks: 'all',
			minSize: 1,
			name: 'common',
		},
		// runtimeChunk: { name: 'utils' },
	},*/
}