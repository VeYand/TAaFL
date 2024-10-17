type State = string
type OutputSignal = string
type InputSignal = string
type AutomatonType = 'Mealy' | 'Moore'

type BaseAutomaton = {
	type: AutomatonType,
	states: State[],
	inputSignals: InputSignal[]
}

type TransitionMealy = {
	nextState: State,
	output: OutputSignal
};

type MealyTransitions = Map<State, Map<InputSignal, TransitionMealy>>

type MealyAutomaton = BaseAutomaton & {
	type: 'Mealy',
	transitions: MealyTransitions
}

type TransitionMoore = {
	nextState: State
};

type MooreTransitions = Map<State, Map<InputSignal, TransitionMoore>>

type MooreStateOutputs = Map<State, OutputSignal>

type MooreAutomaton = BaseAutomaton & {
	type: 'Moore',
	stateOutputs: MooreStateOutputs,
	transitions: MooreTransitions
}

export type {
	State,
	OutputSignal,
	InputSignal,
	AutomatonType,
	TransitionMealy,
	MealyTransitions,
	MealyAutomaton,
	TransitionMoore,
	MooreTransitions,
	MooreStateOutputs,
	MooreAutomaton,
}