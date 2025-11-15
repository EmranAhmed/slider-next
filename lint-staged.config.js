module.exports = {
	'./package.json': ['npm run lint:pkg-json'],
	'./*.md': ['npm run lint:md:docs'],
	'./src/**/*.scss': ['npm run lint:css'],
	'./src/**/*.{js,ts,tsx}': ['npm run lint:js'],
}
