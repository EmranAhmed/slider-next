const restrictedImports = [
	{
		name: 'lodash',
		message:
			'This Lodash method is not recommended. Please use native functionality instead. If using `memoize`, please use `memize` instead.',
	},
	{
		name: 'classnames',
		message:
			"Please use `clsx` instead. It's a lighter and faster drop-in replacement for `classnames`.",
	},
];

module.exports = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	settings: {
		// List of modules that are externals in our webpack config.
		// This helps the `import/no-extraneous-dependencies` and
		//`import/no-unresolved` rules account for them.
		'import/core-modules': [
			'@woocommerce/blocks-registry',
			'@wordpress/is-shallow-equal',
			'@woocommerce/block-data',
			'@woocommerce/blocks-checkout',
			'@woocommerce/price-format',
			'@woocommerce/settings',
			'@woocommerce/shared-context',
			'@woocommerce/shared-hocs',
			'@woocommerce/data',
			'@wordpress/components',
			'@wordpress/i18n',
			'@wordpress/blocks',
			'@wordpress/a11y',
			'@wordpress/api-fetch',
			'@wordpress/block-editor',
			'@wordpress/compose',
			'@wordpress/data',
			'@wordpress/core-data',
			'@wordpress/editor',
			'@wordpress/escape-html',
			'@wordpress/hooks',
			'@wordpress/keycodes',
			'@wordpress/url',
			'@wordpress/element',
			'@woocommerce/blocks-test-utils',
			'@woocommerce/e2e-utils',
			'lodash',
			'@storepress/slider',
		],
		'import/resolver': {
			node: {},
			webpack: {},
		},
	},
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	globals: {
		jQuery: 'readonly',
		wp: true,
		wpApiSettings: true,
		wcSettings: true,
		es6: true,
		StorePress: true,
	},
	rules: {
		'no-unused-vars': 'off',
		'@woocommerce/dependency-group': 'off',
		'react/react-in-jsx-scope': 'off',
		'no-restricted-imports': [
			'error',
			{
				paths: restrictedImports,
			},
		],
		'@wordpress/no-global-active-element': 'warn',
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: [ 'storepress-base-plugin' ],
			},
		],
		'no-console': [ 'error', { allow: [ 'warn', 'info' ] } ],
	},
};
