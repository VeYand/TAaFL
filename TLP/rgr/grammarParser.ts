import {Queue} from './queue'

type Terminal = string

type NeTerminal = string

type GrammarNode = Terminal | NeTerminal

type Index = number

type IndexedTransition = {
	index: Index,
	current: GrammarNode,
	leftSide: boolean,
	haveAlternative: boolean,
	isTerminal: boolean,
	next?: GrammarNode,
}

type IndexedGrammar = IndexedTransition[]

/*
const grammarSample = `
<S> -> <A><B>#
<A> -> a | c<A>
<B> -> b<A>
`
*/

const GRAMMAR_LINE_SEPARATOR = '\n'
const ARROW_SEPARATOR = '->'
const TRANSITION_ALTERNATIVE_SEPARATOR = '|'


	const indexGrammar = (grammar: string): IndexedGrammar => {
	const indexedGrammar: IndexedGrammar = []

	type GrammarLine = {
		leftSide: string,
		alternatives: SymbolEntry[][]
	}
	const grammarLinesQueue = new Queue<GrammarLine>()

	for (const grammarLine of grammar.split(GRAMMAR_LINE_SEPARATOR)) {
		const sides = grammarLine.split(ARROW_SEPARATOR)
		if (sides.length != 2) {
			throw new Error('Invalid grammar sides: ' + sides.length)
		}
		const [leftSide, rightSide] = sides
		const alternatives = rightSide.split(TRANSITION_ALTERNATIVE_SEPARATOR)

		const parsedAlternatives: SymbolEntry[][] = []
		for (const alternative of alternatives) {
			parsedAlternatives.push(parseGrammarLine(alternative.trim()))
		}
		grammarLinesQueue.enqueue({
			leftSide: getNotTerminalSymbol(leftSide.trim()),
			alternatives: parsedAlternatives,
		})
	}

	let lastIndex = 0
	while (!grammarLinesQueue.isEmpty()) {
		const grammarLine = grammarLinesQueue.dequeue()
		if (!grammarLine) {
			break
		}

		for (let i = 0; i < grammarLine.alternatives.length; i++) {
			const alternative = grammarLine.alternatives[i]
			indexedGrammar.push({
				index: ++lastIndex,
				current: grammarLine.leftSide,
				isTerminal: true,
				leftSide: true,
				next: alternative[0]?.symbol,
				haveAlternative: grammarLine.alternatives.length - 1 !== i,
			})
		}

		for (const alternative of grammarLine.alternatives) {
			const alternativesToIndex: Terminal[] = []
			lastIndex = parseAlternative(lastIndex, alternative, alternativesToIndex, indexedGrammar)

			for (const alternativeToIndex of alternativesToIndex.reverse()) {
				const line = grammarLinesQueue.find(item => item.leftSide === alternativeToIndex)
				if (!line) {
					continue
				}
				grammarLinesQueue.moveToStart(line)
			}
		}
	}

	return indexedGrammar
}

const parseAlternative = (lastIndex: number, alternative: SymbolEntry[], alternativesToIndexStack: Terminal[], indexedGrammar: IndexedGrammar): number => {
	if (!alternative.length) {
		throw new Error('Alternative cannot be empty')
	}

	for (let si = 0; si < alternative.length; si++) {
		const symbol = alternative[si]

		if (!symbol.isTerminal && !alternativesToIndexStack.includes(symbol.symbol)) {
			alternativesToIndexStack.push(symbol.symbol)
		}

		indexedGrammar.push({
			index: ++lastIndex,
			current: symbol.symbol,
			isTerminal: symbol.isTerminal,
			leftSide: false,
			next: alternative[si + 1]?.symbol,
			haveAlternative: false,
		})
	}

	return lastIndex
}


const getNotTerminalSymbol = (notTerminal: string): string => {
	const sequence = parseGrammarLine(notTerminal)
	if (sequence.length !== 1 || sequence[0]?.isTerminal) {
		throw new Error('Is not valid not-terminal: ' + notTerminal)
	}
	return sequence[0].symbol
}

type SymbolEntry = {
	symbol: Terminal,
	isTerminal: true,
} | {
	symbol: NeTerminal,
	isTerminal: false,
}

const parseGrammarLine = (input: string): SymbolEntry[] => {
	const result: SymbolEntry[] = []
	let isCurrentTerminal: boolean = false
	let currentSequence: string = ''

	for (const char of input) {
		if (!isCurrentTerminal) {
			if (char === '<') {
				isCurrentTerminal = true
			} else {
				result.push({symbol: currentSequence + char, isTerminal: true})
				currentSequence = ''
			}
		} else {
			if (char === '>') {
				result.push({symbol: currentSequence, isTerminal: false})
				isCurrentTerminal = false
				currentSequence = ''
			} else {
				currentSequence += char
			}
		}
	}

	return result
}


export type {
	Terminal,
	NeTerminal,
	GrammarNode,
	IndexedTransition,
	IndexedGrammar,
	Index,
}

export {
	indexGrammar,
}
