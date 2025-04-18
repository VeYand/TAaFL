import {
	InputSignal,
	MealyAutomaton,
	MealyTransitions,
	MooreAutomaton,
	MooreStateOutputs,
	MooreTransitions, TransitionMoore,
} from '../lab1-2/types';
import {Automaton} from '../lab1-2/Automaton';
import {minimize} from './minimizeUtils'

type State = string;
type Expression = string;
export type Transition = {
	from: State;
	to: State;
	expression: Expression;
};

export type NFA = {
	states: State[];
	transitions: Transition[];
	startState: State;
	endState: State;
};

function splitWithLimit(str, separator, limit) {
	if (limit <= 0) {
		return [];
	}

	const result = [];
	let remainingStr = str;

	for (let i = 0; i < limit - 1; i++) {
		const index = remainingStr.indexOf(separator);

		if (index === -1) {
			break;
		}

		result.push(remainingStr.slice(0, index));
		remainingStr = remainingStr.slice(index + separator.length);
	}

	if (remainingStr.length > 0) {
		result.push(remainingStr);
	}

	return result;
}

const emptySignal = '@'
let newStateIterator = -1
const tempNames = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i));
const isTempName = (str: string) => tempNames.includes(str)
let subExpressionIterator = 0;
const baseStateName = 'q'
const getNewStateName = () => baseStateName + (++newStateIterator).toString()
let isGetFinishStateCalled = false
const getFinishState = () => isGetFinishStateCalled ? getNewStateName() : baseStateName + 'f'

const prepareRegexp = (regexp: Expression) => {
	if (!regexp.length) {
		return regexp
	}

	// if (regexp[0] === '(' && regexp[regexp.length - 1] === ')' && regexp.length > 1) {
	// 	regexp = regexp.slice(1, regexp.length - 1)
	// }

	let result = '';

	for (let i = 0; i < regexp.length; i++) {
		const current = regexp[i];
		const next = regexp[i + 1];

		result += current;

		if (next && !['|', '*', '+', '('].includes(current) && !['|', '*', '+'].includes(next)) {
			result += '.';
		}
	}

	return result;
};

const regparse = (input: Expression): NFA => {
	const startState = getNewStateName()
	const endState = getFinishState()
	const states = [startState, endState]
	let transitions: Transition[] = [{
		from: states[0],
		to: states[1],
		expression: prepareRegexp(input.toLowerCase()),
	}]

	while (true) {
		const transitionsCopy = [...transitions]
		let allIsSimple = true
		for (const transition of transitionsCopy) {
			if (!isExpressionSimple(transition.expression)) {
				allIsSimple = false
				break
			}
		}

		if (allIsSimple) {
			break
		}

		for (let transition of transitionsCopy) {
			if (isExpressionSimple(transition.expression)) {
				continue
			}

			if (isContainsParenthesis(transition.expression)) {
				const {result, map} = replaceParenthesisSubexpressions(transition.expression)
				if (isExpressionSimple(result)) {
					const restored = restoreParenthesisSubexpressions(result, map)
					transition.expression = restored
					simplifyTransitionExpression(transition, transitionsCopy, states)
				} else {
					transition.expression = result
					simplifyTransitionExpression(transition, transitionsCopy, states)
					for (const toRestore of transitionsCopy) {
						toRestore.expression = restoreParenthesisSubexpressions(toRestore.expression, map, !isExpressionSimple(toRestore.expression))
					}
				}
			} else {
				simplifyTransitionExpression(transition, transitionsCopy, states)
			}
		}
		transitions = transitionsCopy
	}

	return {
		states,
		transitions,
		startState,
		endState,
	}
}

function replaceParenthesisSubexpressions(expression: Expression): { result: string; map: Map<string, string> } {
	const result: string[] = [];
	const map = new Map<string, string>();
	const stack: number[] = [];

	for (let i = 0; i < expression.length; i++) {
		const char = expression[i];

		if (char === '(') {
			stack.push(i);
		} else if (char === ')') {
			if (stack.length > 0) {
				const startIndex = stack.pop()!;
				const subExpression = expression.substring(startIndex + 1, i);

				if (subExpressionIterator > tempNames.length - 2) {
					throw new Error('Ахахахахах, не бей')
				}

				const subKey = tempNames[++subExpressionIterator];
				map.set(subKey, subExpression);

				if (stack.length === 0) {
					result.push(subKey);
				}
			}
		} else {
			if (stack.length === 0) {
				result.push(char);
			}
		}
	}

	return {
		result: result.join(''),
		map,
	};
}

function restoreParenthesisSubexpressions(input: string, map: Map<string, string>, addParenthesis = false): string {
	let result = input;

	for (const [key, value] of map.entries()) {
		result = result.split(key).join(
			addParenthesis ? `(${value})` : `${value}`,
		);
	}

	return result;
}


const isExpressionSimple = (expression: Expression) => {
	return !expression.includes('+')
		&& !expression.includes('*')
		&& !expression.includes('|')
		&& !expression.includes('(')
		&& !expression.includes(')')
		&& !expression.includes('.')
		|| isTempName(expression)
}

const isContainsParenthesis = (expression: Expression) => {
	return expression.includes('(') || expression.includes(')')
}

function deleteTransition(transition: Transition, transitions: Transition[]) {
	const {from, to, expression} = transition
	const oldTransition = transitions.find(t => t.from === from && t.to === to && t.expression === expression)
	if (oldTransition !== undefined) {
		transitions.splice(transitions.indexOf(oldTransition), 1)
	}
}

function simplifyExpressionWithAny(transition: Transition, transitions: Transition[], states: State[]) {
	const {from, to, expression} = transition

	const anySides = splitWithLimit(expression, '*', 2)

	deleteTransition(transition, transitions)

	const leftSide = anySides[0]

	const newState = getNewStateName()

	states.push(newState)
	transitions.push({
		from: from,
		to: newState,
		expression: emptySignal,
	})
	transitions.push({
		from: newState,
		to: newState,
		expression: leftSide,
	})

	transitions.push({
		from: newState,
		to: to,
		expression: anySides.length > 1 ? anySides[1] : emptySignal,
	})
}

function simplifyExpressionWithPlus(transition: Transition, transitions: Transition[], states: State[]) {
	const {from, to, expression} = transition

	const plusSides = splitWithLimit(expression, '+', 2)

	deleteTransition(transition, transitions)

	const leftSide = plusSides[0]

	const newState = getNewStateName()
	states.push(newState)
	transitions.push({
		from: from,
		to: newState,
		expression: leftSide,
	})
	transitions.push({
		from: newState,
		to: newState,
		expression: leftSide,
	})

	transitions.push({
		from: newState,
		to: to,
		expression: plusSides.length > 1 ? plusSides[1] : emptySignal,
	})
}

function simplifyExpressionWithDot(transition: Transition, transitions: Transition[], states: State[]) {
	const {from, to, expression} = transition

	const dotSides = splitWithLimit(expression, '.', 2)

	deleteTransition(transition, transitions)

	const leftSide = dotSides[0]

	const newState = getNewStateName()
	states.push(newState)
	transitions.push({
		from: from,
		to: newState,
		expression: leftSide,
	})
	transitions.push({
		from: newState,
		to: to,
		expression: dotSides.length > 1 ? dotSides[1] : emptySignal,
	})
}

const simplifySideWithoutOr = (transition: Transition, transitions: Transition[], states: State[]) => {
	const {expression} = transition;

	const plusIndex = expression.indexOf('+');
	const asteriskIndex = expression.indexOf('*');
	const dotIndex = expression.indexOf('.');

	if (dotIndex !== -1 && (plusIndex === -1 || dotIndex < plusIndex) && (asteriskIndex === -1 || dotIndex < asteriskIndex)) {
		return simplifyExpressionWithDot(transition, transitions, states);
	}

	if (plusIndex === -1 && asteriskIndex === -1) {
		return;
	} else if (plusIndex === -1) {
		return simplifyExpressionWithAny(transition, transitions, states);
	} else if (asteriskIndex === -1) {
		return simplifyExpressionWithPlus(transition, transitions, states);
	} else if (plusIndex < asteriskIndex) {
		return simplifyExpressionWithPlus(transition, transitions, states);
	} else {
		return simplifyExpressionWithAny(transition, transitions, states);
	}
};

const simplifyTransitionExpression = (transition: Transition, transitions: Transition[], states: State[]) => {
	const {from, to, expression} = transition

	if (!expression.includes('|')) {
		return simplifySideWithoutOr(transition, transitions, states)
	}

	const orSides = splitWithLimit(expression, '|', 2)
	if (orSides.length !== 2) {
		throw new Error('Нормально пиши, нормально будет')
	}

	deleteTransition(transition, transitions)
	transitions.push({
		from: from,
		to: to,
		expression: orSides[0],
	})
	transitions.push({
		from: from,
		to: to,
		expression: orSides[1],
	})
}


const convertDFAtoMealy = (nfa: NFA): MealyAutomaton => {
	const mealyTransitions: MealyTransitions = new Map();
	let inputIter = 0
	for (const state of nfa.states) {
		mealyTransitions.set(state, new Map());
	}

	for (const transition of nfa.transitions) {
		const {from, to, expression} = transition;
		mealyTransitions.get(from)?.set((++inputIter).toString(), {nextState: to, output: expression});
	}

	return {
		type: 'Mealy',
		states: nfa.states,
		inputSignals: [''],
		transitions: mealyTransitions,
	};
};

const determinizeNFA = (nfa: NFA): NFA => {
	const epsilonClosureMap = new Map();

	for (const state of nfa.states) {
		const closure = new Set([state]);
		const stack = [state];

		while (stack.length > 0) {
			const currentState = stack.pop();
			for (const transition of nfa.transitions) {
				if (transition.from === currentState && transition.expression === emptySignal) {
					if (!closure.has(transition.to)) {
						closure.add(transition.to);
						stack.push(transition.to);
					}
				}
			}
		}

		epsilonClosureMap.set(state, Array.from(closure));
	}

	const getSignals = () => {
		const signals = new Set();
		for (const transition of nfa.transitions) {
			if (transition.expression !== emptySignal) {
				signals.add(transition.expression);
			}
		}
		return Array.from(signals);
	};

	const signals = getSignals();

	const getTargetStates = (combinedStates, signal) => {
		const targetStates = new Set();

		for (const state of combinedStates) {
			const epsilonClosure = epsilonClosureMap.get(state);

			for (const subState of epsilonClosure) {
				for (const transition of nfa.transitions) {
					if (transition.from === subState && transition.expression === signal) {
						const targetClosure = epsilonClosureMap.get(transition.to);
						for (const target of targetClosure) {
							targetStates.add(target);
						}
					}
				}
			}
		}

		return Array.from(targetStates);
	};

	const newStates = [];
	const newTransitions = [];
	const stateMap = new Map();
	const queue = [];

	const startClosure = epsilonClosureMap.get(nfa.startState);
	const startStateName = `S0`;

	stateMap.set(startStateName, startClosure);
	newStates.push(startStateName);
	queue.push(startStateName);

	while (queue.length > 0) {
		const currentStateName = queue.shift();
		const currentStateSet = stateMap.get(currentStateName);

		for (const signal of signals) {
			const targetStates = getTargetStates(currentStateSet, signal);
			if (targetStates.length > 0) {
				const existingStateName = Array.from(stateMap.entries()).find(([, value]) => {
					return value.length === targetStates.length && value.every((v) => targetStates.includes(v));
				})?.[0];

				const targetStateName = existingStateName || `S${newStates.length}`;

				if (!existingStateName) {
					stateMap.set(targetStateName, targetStates);
					newStates.push(targetStateName);
					queue.push(targetStateName);
				}

				newTransitions.push({
					from: currentStateName,
					to: targetStateName,
					expression: signal,
				});
			}
		}
	}

	const endStates = newStates.filter((stateName) => {
		const combinedStates = stateMap.get(stateName);
		return combinedStates.some(state => state === nfa.endState);
	});

	const markedTransitions: Transition[] = newTransitions.map(transition => ({
		from: endStates.includes(transition.from) ? (transition.from + ' (end)').trim() : transition.from.trim(),
		to: endStates.includes(transition.to) ? (transition.to + ' (end)').trim() : transition.to.trim(),
		expression: transition.expression.trim(),
	}))

	return {
		states: newStates.map(state => endStates.includes(state) ? (state + ' (end)').trim() : state.trim()),
		transitions: markedTransitions,
		startState: startStateName,
		endState: null,
	};
};

function convertDfaToMoore(dfa: NFA): MooreAutomaton {
	const states = dfa.states;
	const inputSignals = Array.from(new Set(dfa.transitions.map(t => t.expression)));

	const stateOutputs: MooreStateOutputs = new Map();
	states.forEach(state => {
		stateOutputs.set(state, `Output_${state}`);
	});

	const transitions: MooreTransitions = new Map();
	states.forEach(state => {
		const stateTransitions = new Map<InputSignal, TransitionMoore>();
		dfa.transitions
			.filter(t => t.from === state)
			.forEach(t => {
				stateTransitions.set(t.expression, {nextState: t.to});
			});
		transitions.set(state, stateTransitions);
	});

	return {
		type: 'Moore',
		states,
		inputSignals,
		stateOutputs,
		transitions,
	};
}

function main() {
	// const nfa = regparse('(a|b)*(a(a|b)*a|b(a|b)*b)');
	const nfa = regparse('ab*((a|b*)df(b|a*))')


	const determinized = determinizeNFA(nfa)
	const minimized = minimize(determinized)

	Automaton.saveMealyGraph(convertDFAtoMealy(nfa), 'lab5/output/automaton.png', true)
	Automaton.saveMealyGraph(convertDFAtoMealy(determinized), 'lab5/output/determinized.png', true)
	Automaton.saveMealyGraph(convertDFAtoMealy(minimized), 'lab5/output/minimized.png', true)
}

if (require.main === module) {
	main();
}