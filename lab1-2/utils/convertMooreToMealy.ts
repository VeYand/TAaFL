import {
	MealyAutomaton,
	MealyTransitions,
	MooreAutomaton,
	MooreStateOutputs,
	OutputSignal,
	State,
} from '../types'

const getOutput = (stateOutputs: MooreStateOutputs, state: State): OutputSignal => {
	return stateOutputs.get(state)
}

const convertMooreToMealy = (automaton: MooreAutomaton): MealyAutomaton => {
	const {states, inputSignals, transitions, stateOutputs} = automaton

	const mealyTransitions: MealyTransitions = new Map()

	transitions.forEach((inputToTransition, state) => (
		inputToTransition.forEach((transition, input) => {
			transition.nextState

			if (!mealyTransitions.has(state)) {
				mealyTransitions.set(state, new Map())
			}

			const mealyInputToTransition = mealyTransitions.get(state)
			mealyInputToTransition.set(input, {
				nextState: transition.nextState,
				output: getOutput(stateOutputs, transition.nextState),
			})
			mealyTransitions.set(state, mealyInputToTransition)
		})
	))

	return {
		type: 'Mealy',
		states: states,
		inputSignals: inputSignals,
		transitions: mealyTransitions,
	}
}

export {
	convertMooreToMealy,
}