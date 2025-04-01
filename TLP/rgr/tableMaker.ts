import {Index, IndexedGrammar} from './grammarParser'

type ParsingTableRow = {
	index: Index,
	symbol: string,
	directedSet: string[],
	transition: Index,
	error: boolean,
	shift: boolean,
	stack?: Index,
	end: boolean,
}

type ParsingTable = ParsingTableRow[]

const createParsingTable = (grammar: IndexedGrammar): ParsingTable => {
	const rows: ParsingTable = []
	return rows;
};

const parseGrammar = (input: string, table: ParsingTable): string => {
	let transition = 0
	const stack: number[] = [1]
	const trace: string[] = []

	while (stack.length > 0) {
		let tableIndex = stack.pop()
		if (tableIndex === undefined) {
			throw new Error('Error: Stack underflow')
		}

		const row = table.find(r => r.index === tableIndex)
		if (!row) {
			throw new Error(`Error: No matching table row for index ${tableIndex}`)
		}

		let currentChar = input[transition] ?? '#' // Если строка кончилась, рассматриваем '#'
		trace.push(`Stack: [${stack.join(', ')}], Reading: '${currentChar}', Processing: '${row.symbol}'`)

		if (row.directedSet.includes(currentChar)) {
			if (row.shift) {  // Продвигаем указатель, если есть сдвиг
				transition++
			}
			if (row.stack !== -1 && row.stack) { // Добавляем в стек, если указано
				stack.push(row.stack)
			}
			if (row.transition !== -1) { // Переходим к следующему шагу
				stack.push(row.transition)
			}
			if (row.end && transition === input.length) {
				return `OK\nTrace:\n${trace.join('\n')}`
			}
		}
		else if (row.error) { // Если символ не подходит и error == true, пропускаем этот вариант
			continue
		}
		else if (!row.error) { // Если символ не подходит, но error == false и нет указателя, пробуем следующий вариант
			const nextRow = table.find(r => r.index === tableIndex + 1) // Берём следующую строку
			if (nextRow) {
				stack.push(nextRow.index)
			}
		}
		else if (row.directedSet.includes('ε')) { // Обработка ε-перехода
			if (row.shift) transition++ // Если ε-переход, но требует смещения — двигаем указатель
			if (row.transition !== -1) stack.push(row.transition) // Двигаемся дальше по таблице
		}
		else { // Если ничего не подошло — ошибка
			return `Error: Unexpected '${currentChar}', expected one of [${row.directedSet.join(', ')}]`
		}
	}

	// Если указатель не дошёл до конца строки, значит входной текст обработан не полностью
	return transition === input.length
		? `OK\nTrace:\n${trace.join('\n')}`
		: `Error\nTrace:\n${trace.join('\n')}`
}

export type {
	ParsingTable,
}

export {
	parseGrammar,
	createParsingTable
}