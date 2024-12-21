import {MealyAutomaton, MealyTransitions} from '../lab1-2/types';
import {Automaton} from '../lab1-2/Automaton';

type State = string;
type Expression = string;
type Transition = {
	from: State;
	to: State;
	expression: Expression;
};

type NFA = {
	states: State[];
	transitions: Transition[];
	startState: State;
	endState: State;
};

function splitWithLimit(str: string, separator: string, limit: number): string[] {
	const parts = str.split(separator);
	if (parts.length <= limit) {
		return parts;
	}

	return [...parts.slice(0, limit - 1), parts.slice(limit - 1).join(separator)];
}

const emptySignal = '@'
let newStateIterator = -1
const baseStateName = 'q'
const getNewStateName = () => baseStateName + (++newStateIterator).toString()
let isGetFinishStateCalled = false
const getFinishState = () => isGetFinishStateCalled ? getNewStateName() : baseStateName + 'f'

const regparse = (input: Expression): NFA => {
	const startState = getNewStateName()
	const endState = getFinishState()
	const states = [startState, endState]
	let transitions: Transition[] = [{
		from: states[0],
		to: states[1],
		expression: input,
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

		for (const transition of transitionsCopy) {
			if (isExpressionSimple(transition.expression)) {
				continue
			}

			simplifyTransitionExpression(transition, transitionsCopy, states)
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

const isExpressionSimple = (expression: Expression) => {
	return !expression.includes('+')
		&& !expression.includes('*')
		&& !expression.includes('|')
		&& !expression.includes('(')
		&& !expression.includes(')')
}

function simplifyExpressionWithAny(transition: Transition, transitions: Transition[], states: State[]) {
	const {from, to, expression} = transition

	const anySides = splitWithLimit(expression, '*', 2)

	const oldTransition = transitions.find(t => t.from === from && t.to === to)
	if (oldTransition !== undefined) {
		transitions.splice(transitions.indexOf(oldTransition), 1)
	}

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
		expression: (anySides.length > 1 && anySides[1]) ? anySides[1] : emptySignal,
	})
}

function simplifyExpressionWithPlus(transition: Transition, transitions: Transition[], states: State[]) {
	const {from, to, expression} = transition

	const plusSides = splitWithLimit(expression, '+', 2)

	const oldTransition = transitions.find(t => t.from === from && t.to === to)
	if (oldTransition !== undefined) {
		transitions.splice(transitions.indexOf(oldTransition), 1)
	}

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
		expression: (plusSides.length > 1 && plusSides[1]) ? plusSides[1] : emptySignal,
	})
}

const simplifySideWithoutOr = (transition: Transition, transitions: Transition[], states: State[]) => {
	const {expression} = transition

	const plusIndex = expression.indexOf('+');
	const asteriskIndex = expression.indexOf('*');

	if (plusIndex === -1 && asteriskIndex === -1) {
		return
	} else if (plusIndex === -1) {
		return simplifyExpressionWithAny(transition, transitions, states);
	} else if (asteriskIndex === -1) {
		return simplifyExpressionWithPlus(transition, transitions, states);
	} else if (plusIndex < asteriskIndex) {
		return simplifyExpressionWithPlus(transition, transitions, states);
	} else {
		return simplifyExpressionWithAny(transition, transitions, states);
	}

}

const simplifyTransitionExpression = (transition: Transition, transitions: Transition[], states: State[]) => {
	const {from, to, expression} = transition

	if (!expression.includes('|')) {
		return simplifySideWithoutOr(transition, transitions, states)
	}

	const orSides = splitWithLimit(expression, '|', 2)
	console.log(orSides)
	if (orSides.length !== 2 || !orSides[0] || !orSides[1]) {
		throw new Error('Нормально пиши, нормально будет')
	}

	const oldTransition = transitions.find(t => t.from === from && t.to === to)
	if (oldTransition !== undefined) {
		transitions.splice(transitions.indexOf(oldTransition), 1)
	}
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


const convertNFAtoMealy = (nfa: NFA): MealyAutomaton => {
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

function main() {
	const nfa = regparse('a*|a*|b+');
	// console.log(JSON.stringify(nfa, null, 4));
	Automaton.saveMealyGraph(convertNFAtoMealy(nfa), 'lab5/output/automaton.png', true)
}

if (require.main === module) {
	main();
}