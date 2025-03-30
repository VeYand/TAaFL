import {indexGrammar} from './grammarParser'
import {parseGrammar, ParsingTable} from './tableMaker'

const main = () => {
	const grammarSample = [
		'<S> -> <A><B>#',
		'<A> -> a | c<A>',
		'<B> -> b<A>',
	]

	const grammar = indexGrammar(grammarSample.join('\n'))
	console.log(grammar)

	const table: ParsingTable = [
		{ index: 1, symbol: '<S>', directedSet: ['a'], error: true, transition: 2, stack: -1, shift: false, end: false },
		{ index: 2, symbol: 'a', directedSet: ['a'], error: true, transition: 3, stack: -1, shift: true, end: false },
		{ index: 3, symbol: '<B>', directedSet: ['b'], error: true, transition: 5, stack: 4, shift: false, end: false },
		{ index: 4, symbol: '#', directedSet: ['#'], error: true, transition: -1, stack: -1, shift: true, end: true },
		{ index: 5, symbol: '<B>', directedSet: ['b'], error: true, transition: 6, stack: -1, shift: false, end: false },
		{ index: 6, symbol: 'b', directedSet: ['b'], error: true, transition: 7, stack: -1, shift: true, end: false },
		{ index: 7, symbol: '<C>', directedSet: ['b', 'ε'], error: true, transition: 8, stack: -1, shift: false, end: false },
		{ index: 8, symbol: '<C>', directedSet: ['b', 'ε'], error: true, transition: 9, stack: -1, shift: false, end: false },
		{ index: 9, symbol: 'b', directedSet: ['b'], error: false, transition: 11, stack: -1, shift: true, end: false },
		{ index: 10, symbol: 'ε', directedSet: ['ε'], error: true, transition: -1, stack: -1, shift: false, end: false },
		{ index: 11, symbol: '<C>', directedSet: ['b', 'ε'], error: true, transition: 8, stack: -1, shift: false, end: false }
	];
	
	console.log("111111111111111111111111111111",parseGrammar('abbbbbbbbbbbbbbbbbbbbbbbbb#', table));
}

main()

//if (require.main === module) {
//	main()
//}