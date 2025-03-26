import {indexGrammar} from './grammarParser'
import {parseGrammar} from './tableMaker'

const main = () => {
	const grammarSample = [
		'<S> -> <A><B>#',
		'<A> -> a | c<A>',
		'<B> -> b<A>',
	]

	const grammar = indexGrammar(grammarSample.join('\n'))
	console.log(grammar)

	const table = parseGrammar(grammar)
	console.log(table)
}


if (require.main === module) {
	main()
}