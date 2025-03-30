import {Index, IndexedGrammar, indexGrammar} from './grammarParser'

type ParsingTableRow = {
	index: Index,
	symbol: string,
	directedSet: string[],
	transition: Index,
	error: boolean,
	shift: boolean,
	stack?: Index,
	end: boolean
}

type ParsingTable = ParsingTableRow[]

const parseGrammar = (input: string, table: ParsingTable): string => {
	let transition = 0;
	let stack: number[] = [1]; // Начинаем с первой строки таблицы
	let trace: string[] = [];

	while (stack.length > 0) {
		let tableIndex = stack.pop();
		if (tableIndex === undefined) return 'Error: Stack underflow';

		let row = table.find(r => r.index === tableIndex);
		if (!row) return `Error: No matching table row for index ${tableIndex}`;

		let currentChar = input[transition] ?? '#'; // Если строка кончилась, рассматриваем '#'
		trace.push(`Stack: [${stack.join(', ')}], Reading: '${currentChar}', Processing: '${row.symbol}'`);

		if (row.directedSet.includes(currentChar)) {
			if (row.shift) transition++; // Продвигаем указатель, если есть сдвиг
			if (row.stack !== -1 && row.stack) stack.push(row.stack); // Добавляем в стек, если указано
			if (row.transition !== -1) stack.push(row.transition); // Переходим к следующему шагу
			if (row.end && transition === input.length) return `OK\nTrace:\n${trace.join('\n')}`;
		}
		// Если символ не подходит и error == true, пропускаем этот вариант
		else if (row.error) {
			continue;
		}
		// Если символ не подходит, но error == false и нет указателя, пробуем следующий вариант
		else if (!row.error) {
			let nextRow = table.find(r => r.index === tableIndex + 1); // Берём следующую строку
			if (nextRow) stack.push(nextRow.index);
		}
		// Обработка ε-перехода
		else if (row.directedSet.includes('ε')) {
			if (row.shift) transition++; // Если ε-переход, но требует смещения — двигаем указатель
			if (row.transition !== -1) stack.push(row.transition); // Двигаемся дальше по таблице
		}
		// Если ничего не подошло — ошибка
		else {
			return `Error: Unexpected '${currentChar}', expected one of [${row.directedSet.join(', ')}]`;
		}
	}

	// Если указатель не дошёл до конца строки, значит входной текст обработан не полностью
	return transition === input.length ? `OK\nTrace:\n${trace.join('\n')}` : `Error\nTrace:\n${trace.join('\n')}`;
};


export {
	parseGrammar, ParsingTable
}