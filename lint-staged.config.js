module.exports = {
	'./package.json': [ 'npm run lint:pkg-json' ],
	'./*.md': [ 'npm run lint:md:docs' ],
	'./src/**/*.scss': [ 'npm run lint:css' ],
	'./src/**/*.{js,ts,tsx}, ./script.js': [ 'npm run lint:js' ],
};
