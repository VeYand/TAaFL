import {Index, IndexedGrammar, indexGrammar} from './grammarParser'

type ParsingTableRow = {
	index: Index,
	symbol: string,
	directedSet: Set<string>,
	transition: Index,
	error: boolean,
	shift: boolean,
	stack?: Index,
	end: boolean
}

type ParsingTable = ParsingTable[]


const parseGrammar = (grammar: IndexedGrammar): ParsingTable => {

}


export {
	parseGrammar
}