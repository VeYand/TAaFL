import {
	MealyAutomaton, MealyTransitions,
	MooreAutomaton, MooreStateOutputs, MooreTransitions,
	State,
	TransitionMealy,
} from '../types'

const NEW_STATE_NAME_PREFIX = 'q'

const getUniqueAndSortedTransitions = (transitions: TransitionMealy[]): TransitionMealy[] => {
	const uniqueTransitions = new Map<State, TransitionMealy>()

	transitions.forEach(transition => {
		const key = `${transition.output}-${transition.nextState}`
		if (!uniqueTransitions.has(key)) {
			uniqueTransitions.set(key, transition)
		}
	})

	return Array.from(uniqueTransitions.values()).sort((a, b) =>
		a.nextState.localeCompare(b.nextState),
	)
}

const mapTransitionsToNewStates = (transitions: TransitionMealy[]): Map<State, TransitionMealy> => {
	const transitionMap = new Map<State, TransitionMealy>()

	transitions.forEach((transition, index) => {
		const key = `${NEW_STATE_NAME_PREFIX}${index}`
		transitionMap.set(key, transition)
	})

	return transitionMap
}

const findEquivalentMooreState = (
	mooreStateTransitionMap: Map<State, TransitionMealy>,
	mealyTransitions: MealyTransitions,
	input: string,
	nextState: string,
): State | undefined => {
	const transition = mealyTransitions.get(nextState)?.get(input)

	if (!transition) {
		return undefined
	}

	const foundState = Array.from(mooreStateTransitionMap.entries()).find(([_, newTrans]) =>
		newTrans.nextState === transition.nextState && newTrans.output === transition.output,
	)

	return foundState ? foundState[0] : undefined
}

const convertMealyToMoore = (automaton: MealyAutomaton): MooreAutomaton => {
	const {inputSignals, transitions} = automaton

	const mealyTransitionsList: TransitionMealy[] = []

	transitions.forEach((transition) => {
		transition.forEach(({nextState, output}) => {
			mealyTransitionsList.push({nextState, output})
		})
	})

	const uniqueTransitions = getUniqueAndSortedTransitions(mealyTransitionsList)
	const mooreStateTransitionMap = mapTransitionsToNewStates(uniqueTransitions)

	const mooreStateNames: State[] = []
	const mooreStateOutputsMap: MooreStateOutputs = new Map()
	const mooreTransitionTable: MooreTransitions = new Map()

	mooreStateTransitionMap.forEach((transition, newState) => {
		mooreStateNames.push(newState)
		mooreStateOutputsMap.set(newState, transition.output)

		if (!mooreTransitionTable.has(newState)) {
			mooreTransitionTable.set(newState, new Map())
		}

		inputSignals.forEach(input => {
			const inputToTransition = mooreTransitionTable.get(newState)

			inputToTransition.set(input, {nextState: findEquivalentMooreState(mooreStateTransitionMap, transitions, input, transition.nextState) ?? ''})
			mooreTransitionTable.set(newState, mooreTransitionTable.get(newState))
		})
	})

	return {
		type: "Moore",
		states: mooreStateNames,
		inputSignals: inputSignals,
		stateOutputs: mooreStateOutputsMap,
		transitions: mooreTransitionTable,
	}
}

export {
	convertMealyToMoore,
}
