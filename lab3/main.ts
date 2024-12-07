import * as fs from 'fs';
import * as readline from 'readline';

type Grammar = {
	type: 'left' | 'right';
	states: {
		fromState: string;
		toStates: {
			state: string;
			signal: string;
		}[];
	}[];
};

type Transition = { left: string; right: string; onlySignal: boolean };
type StateTransition = { fromState: string; transitions: Transition[] };

const parseInput = (input: string): Grammar => {
	const stateTransitions: StateTransition[] = [];
	const lines = input.split('\n').map(line => line.trim()).filter(line => line);

	for (const line of lines) {
		const [fromState, transitionsPart] = line.split('->').map(part => part.trim());
		if (!fromState || fromState.length !== 1) {
			throw new Error("Состояние должно называться одним символом.");
		}
		if (!transitionsPart) {
			throw new Error("Отсутствуют переходы после '->'.");
		}

		const transitions: Transition[] = transitionsPart.split('|').map(transition => {
			const trimmed = transition.trim();
			if (trimmed.length === 0) {
				throw new Error("Переход не может быть пустым.");
			}
			return trimmed.length === 1
				? {left: trimmed[0], right: '', onlySignal: true}
				: {left: trimmed[0], right: trimmed[1], onlySignal: false};
		});

		stateTransitions.push({fromState, transitions});
	}

	let grammarType: 'left' | 'right' | null = null;
	const result: Grammar = {type: 'left', states: []};

	for (const {fromState, transitions} of stateTransitions) {
		for (const {left, right, onlySignal} of transitions) {
			if (onlySignal) continue;

			const isLeftLinear = stateTransitions.some(st => st.fromState === left);
			const isRightLinear = stateTransitions.some(st => st.fromState === right);

			if (grammarType === null) {
				grammarType = isLeftLinear && !isRightLinear ? 'left' : 'right';
				result.type = grammarType;
			} else if (
				(grammarType === 'left' && isRightLinear) ||
				(grammarType === 'right' && isLeftLinear)
			) {
				throw new Error("Смешанный тип грамматики (неоднозначность).");
			}

			const targetState = grammarType === 'left' ? left : right;
			const signal = grammarType === 'left' ? right : left;

			let state = result.states.find(s => s.fromState === fromState);
			if (!state) {
				state = {fromState, toStates: []};
				result.states.push(state);
			}
			state.toStates.push({state: targetState, signal});
		}
	}

	const finalState = 'H';
	for (const {fromState, transitions} of stateTransitions) {
		for (const {left, onlySignal} of transitions) {
			if (!onlySignal) continue;

			let state = result.states.find(s => s.fromState === fromState);
			if (!state) {
				state = {fromState, toStates: []};
				result.states.push(state);
			}
			state.toStates.push({
				state: finalState,
				signal: left,
			});
		}
	}

	return result;
};

const getAllSignals = (grammar: Grammar): string[] => {
	const signals = grammar.states.flatMap(state =>
		state.toStates.map(toState => toState.signal),
	);
	return [...new Set(signals)];
};

const getAllStates = (grammar: Grammar): string[] => {
	const states = [
		...grammar.states.map(state => state.fromState),
		...grammar.states.flatMap(state =>
			state.toStates.map(toState => toState.state),
		),
	];
	return [...new Set(states)];
};

const getLeftNextStates = (grammar: Grammar, fromState: string, signal: string): string => {
	const nextStates: string[] = []

	for (const state of grammar.states) {
		for (const toState of state.toStates) {
			if (toState.state === fromState && toState.signal === signal) {
				nextStates.push(state.fromState)
			}
		}
	}

	if (!nextStates.length) {
		return '-'
	}

	return [...new Set(nextStates)].join(',');
};

const getRightNextStates = (grammar: Grammar, fromState: string, signal: string): string => {
	const state = grammar.states.find(state => state.fromState === fromState);

	if (!state) {
		return '-'
	}

	const nextStates = state.toStates
		.filter(toState => toState.signal === signal)
		.map(toState => toState.state);

	return nextStates.join(',');
};

const grammarToTable = (grammar: Grammar): Map<string, Map<string, string>> => {
	const signals = getAllSignals(grammar);
	const states = getAllStates(grammar);

	const signalToStateToStates: Map<string, Map<string, string>> = new Map();

	for (const signal of signals) {
		const stateToStates: Map<string, string> = new Map();
		for (const state of states) {
			if (grammar.type === 'right') {
				stateToStates.set(state, getRightNextStates(grammar, state, signal));
			}
			if (grammar.type === 'left') {
				stateToStates.set(state, getLeftNextStates(grammar, state, signal));
			}
		}
		signalToStateToStates.set(signal, stateToStates);
	}

	return signalToStateToStates;
};

const printGrammarTable = (
	signalToStateToStates: Map<string, Map<string, string>>,
	formatted: boolean = true,
): string => {
	const signals = Array.from(signalToStateToStates.keys());
	const states = Array.from(
		new Set(
			Array.from(signalToStateToStates.values())
				.flatMap(stateToStates => Array.from(stateToStates.keys())),
		),
	);

	let maxWidth = 0;
	if (formatted) {
		signalToStateToStates.forEach(stateToStates => {
			stateToStates.forEach(toStates => {
				maxWidth = Math.max(maxWidth, toStates.length);
			});
		});
		maxWidth += 2;
	}

	const padRight = (text: string, width: number): string => {
		if (!formatted) return text;
		const diff = width - text.length;
		return text + ' '.repeat(diff > 0 ? diff : 0);
	};

	let result = formatted ? padRight('', maxWidth) : '';
	for (const state of states) {
		result += `;${padRight(state, maxWidth)}`;
	}
	result += '\n';

	for (const signal of signals) {
		result += `${padRight(signal, maxWidth)}`;
		for (const state of states) {
			const toStates = signalToStateToStates.get(signal)?.get(state) || '-';
			result += `;${padRight(toStates, maxWidth)}`;
		}
		result += '\n';
	}

	return result;
};

const main = async () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question('Введите путь к файлу с грамматикой: ', async (filePath) => {

		fs.readFile(filePath, 'utf8', async (err, data) => {
			if (err) {
				console.error(`Ошибка чтения файла: ${err.message}`);
				rl.close();
				return;
			}

			try {
				const grammarTable = grammarToTable(parseInput(data));
				console.log(printGrammarTable(grammarTable));
			} catch (error) {
				console.error(`Ошибка при парсинге грамматики: ${error.message}`);
			} finally {
				rl.close();
			}
		});
	});
};

if (require.main === module) {
	main();
}
