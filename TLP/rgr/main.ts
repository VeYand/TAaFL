import {indexGrammar} from './grammarParser'
import {createParsingTable, parseGrammar} from './tableMaker'

const main = () => {
	const grammarSample = [
		'<S> -> <A><B>#',
		'<A> -> a | c<A>',
		'<B> -> b<A>',
	]

	const grammar = indexGrammar(grammarSample.join('\n'))
	console.log(grammar)

	const table = createParsingTable(grammar)
	console.log(table)

	const trace = parseGrammar('aba#', table)
	console.log(trace)
}


if (require.main === module) {
	main()
}