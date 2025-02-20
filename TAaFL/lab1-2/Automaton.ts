import * as fs from 'node:fs'
import * as graphviz from 'graphviz'
import {
	AutomatonType, InputSignal,
	MealyAutomaton, MealyTransitions,
	MooreAutomaton,
	MooreStateOutputs, MooreTransitions,
	OutputSignal,
	State, TransitionMealy, TransitionMoore,
} from './types'
import {convertMooreToMealy, convertMealyToMoore} from './utils'

const NAME_DIVIDER = ';'

interface IAutomaton {
	read: (filePath: string, type: AutomatonType) => void,
	write: (filePath: string, type: AutomatonType) => void,
	minimize: () => void,
	saveGraph: (filePath: string, type: AutomatonType) => void,
}

type AutomatonDataType = MooreAutomaton | MealyAutomaton

class Automaton implements IAutomaton {
	private automaton: AutomatonDataType | undefined

	public fromMealy(automaton: MealyAutomaton) {
		this.automaton = automaton
	}

	public read(filePath: string, type: AutomatonType): void {
		switch (type) {
			case "Mealy":
				this.automaton = Automaton.readMealy(filePath)
				break
			case "Moore":
				this.automaton = Automaton.readMoore(filePath)
				break
		}
	}

	public write(filePath: string, type: AutomatonType): void {
		if (this.automaton === undefined) {
			return
		}

		switch (type) {
			case "Mealy":
				Automaton.writeMealy(filePath, Automaton.convertToMealy(this.automaton))
				break
			case "Moore":
				Automaton.writeMoore(filePath, Automaton.convertToMoore(this.automaton))
				break
		}
	}

	public minimize(): void {
		if (this.automaton === undefined) {
			return
		}

		switch (this.automaton.type) {
			case "Mealy":
				this.automaton = Automaton.minimizeMealy(this.automaton)
				break
			case "Moore":
				this.automaton = Automaton.minimizeMoore(this.automaton)
				break
		}
	}

	public saveGraph(filePath: string, type: AutomatonType): void {
		if (this.automaton === undefined) {
			return
		}

		if (type === 'Mealy') {
			Automaton.saveMealyGraph(Automaton.convertToMealy(this.automaton), filePath)
		} else if (type === 'Moore') {
			Automaton.showMooreGraph(Automaton.convertToMoore(this.automaton), filePath)
		}
	}

	private static readMealy(filePath: string): MealyAutomaton {
		const text = fs.readFileSync(filePath, 'utf8').trim()
		const lines = text.split('\n').map(line => line.trim()).filter(line => !!line)

		const [_, ...stateHeaders] = lines[0].split(NAME_DIVIDER).map(str => str.trim())

		const automaton: MealyAutomaton = {
			type: 'Mealy',
			states: stateHeaders,
			inputSignals: [],
			transitions: new Map(),
		}

		lines.slice(1).forEach(line => {
			const [inputSignal, ...transitions] = line.split(NAME_DIVIDER).map(str => str.trim())

			automaton.inputSignals.push(inputSignal)

			transitions.forEach((transition, stateIndex) => {
				const [nextState, output] = transition.split('/').map(str => str.trim())

				const currentState = automaton.states[stateIndex]

				if (!automaton.transitions.has(currentState)) {
					automaton.transitions.set(currentState, new Map())
				}

				automaton.transitions.get(currentState)!.set(inputSignal, {nextState, output})
			})
		})

		return automaton
	}

	private static readMoore(filePath: string): MooreAutomaton {
		const text = fs.readFileSync(filePath, 'utf8').trim()
		const lines = text.split('\n').map(line => line.trim()).filter(line => !!line)

		const [_, ...outputSymbols] = lines[0].split(NAME_DIVIDER).map(str => str.trim())
		const [__, ...stateHeaders] = lines[1].split(NAME_DIVIDER).map(str => str.trim())

		const automaton: MooreAutomaton = {
			type: 'Moore',
			states: stateHeaders,
			inputSignals: [],
			transitions: new Map(),
			stateOutputs: new Map(),
		}

		stateHeaders.forEach((state, index) => {
			automaton.stateOutputs.set(state, outputSymbols[index])
		})

		lines.slice(2).forEach(line => {
			const [inputSignal, ...transitions] = line.split(NAME_DIVIDER).map(str => str.trim())

			automaton.inputSignals.push(inputSignal)

			transitions.forEach((nextState, stateIndex) => {
				const currentState = automaton.states[stateIndex]

				if (!automaton.transitions.has(currentState)) {
					automaton.transitions.set(currentState, new Map())
				}

				automaton.transitions.get(currentState)!.set(inputSignal, {nextState})
			})
		})

		return automaton
	}

	private static writeMealy(filePath: string, automaton: MealyAutomaton): void {
		const {states, inputSignals, transitions} = automaton

		const header = [''].concat(states).join(NAME_DIVIDER)
		const lines: string[] = [header]

		inputSignals.forEach(inputSignal => {
			const transitionStrings = states.map(state => {
				const transition = transitions.get(state)?.get(inputSignal)
				if (transition) {
					return `${transition.nextState}/${transition.output}`
				}
				return '-'
			})

			const line = [inputSignal].concat(transitionStrings).join(NAME_DIVIDER)
			lines.push(line)
		})

		fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
	}

	private static writeMoore(filePath: string, automaton: MooreAutomaton): void {
		const {states, inputSignals, transitions, stateOutputs} = automaton

		const outputLine = [''].concat(states.map(state => stateOutputs.get(state) || '')).join(NAME_DIVIDER)
		const statesLine = [''].concat(states).join(NAME_DIVIDER)

		const lines: string[] = [outputLine, statesLine]

		inputSignals.forEach(inputSignal => {
			const transitionStrings = states.map(state => {
				const transition = transitions.get(state)?.get(inputSignal)
				if (transition) {
					return transition.nextState
				}
				return '-'
			})

			const line = [inputSignal].concat(transitionStrings).join(NAME_DIVIDER)
			lines.push(line)
		})

		fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
	}

	static saveMealyGraph(automaton: MealyAutomaton, filePath: string, showOnlyOutput = false): void {
		const g = graphviz.digraph("MealyAutomaton2")

		automaton.states.forEach(state => {
			g.addNode(state, {shape: "circle"})
		})

		automaton.transitions.forEach((inputMap, currentState) => {
			inputMap.forEach((transition, inputSignal) => {
				const {nextState, output} = transition
				const label = showOnlyOutput ? output : `${inputSignal} / ${output}`
				g.addEdge(currentState, nextState, {label})
			})
		})

		g.output("png", filePath)
	}

	static showMooreGraph(automaton: MooreAutomaton, filePath: string): void {
		const g = graphviz.digraph("MooreAutomaton2")

		automaton.states.forEach(state => {
			const output = automaton.stateOutputs.get(state)
			g.addNode(state, {shape: "circle", label: `${state}\n${output}`})
		})

		automaton.transitions.forEach((inputMap, currentState) => {
			inputMap.forEach((transition, inputSignal) => {
				const {nextState} = transition
				const label = inputSignal
				g.addEdge(currentState, nextState, {label})
			})
		})

		g.output("png", filePath)
	}

	private static convertToMoore(automaton: AutomatonDataType): MooreAutomaton {
		if (automaton.type === 'Moore') {
			return automaton
		}

		return convertMealyToMoore(automaton)
	}

	private static convertToMealy(automaton: AutomatonDataType): MealyAutomaton {
		if (automaton.type === 'Mealy') {
			return automaton
		}

		return convertMooreToMealy(automaton)
	}

	static minimizeMealy(automaton: MealyAutomaton): MealyAutomaton {
		const {states, inputSignals, transitions} = automaton;

		let partition: State[][] = [states];
		let newPartition: State[][] = [];

		const getTransition = (state: State, signal: InputSignal): TransitionMealy | undefined => {
			return transitions.get(state)?.get(signal);
		};

		let changed = true;
		while (changed) {
			changed = false;

			newPartition = [];

			partition.forEach(group => {
				const subGroups: State[][] = [];

				group.forEach(state => {
					let addedToSubGroup = false;

					for (let subGroup of subGroups) {
						const representative = subGroup[0];

						const isEquivalent = inputSignals.every(signal => {
							const stateTransition = getTransition(state, signal);
							const repTransition = getTransition(representative, signal);

							return stateTransition?.output === repTransition?.output &&
								partition.find(group => group.includes(stateTransition?.nextState)) ===
								partition.find(group => group.includes(repTransition?.nextState));
						});

						if (isEquivalent) {
							subGroup.push(state);
							addedToSubGroup = true;
							break;
						}
					}

					if (!addedToSubGroup) {
						subGroups.push([state]);
					}
				});

				newPartition.push(...subGroups);
			});

			if (newPartition.length !== partition.length) {
				changed = true;
				partition = newPartition;
			}
		}

		const minimizedStates: State[] = newPartition.map((group, index) => `q${index}`);
		const minimizedTransitions: MealyTransitions = new Map();

		newPartition.forEach((group, index) => {
			const representative = group[0];
			const newState = `q${index}`;

			const stateTransitions = new Map<InputSignal, TransitionMealy>();

			inputSignals.forEach(signal => {
				const transition = getTransition(representative, signal);
				if (transition) {
					const nextStateIndex = newPartition.findIndex(group => group.includes(transition.nextState));
					stateTransitions.set(signal, {
						nextState: `q${nextStateIndex}`,
						output: transition.output,
					});
				}
			});

			minimizedTransitions.set(newState, stateTransitions);
		});

		return {
			type: 'Mealy',
			states: minimizedStates,
			inputSignals,
			transitions: minimizedTransitions,
		};
	}


	static minimizeMoore(automaton: MooreAutomaton): MooreAutomaton {
		const {states, inputSignals, stateOutputs, transitions} = automaton;

		let partition: State[][] = [];
		const outputToStatesMap = new Map<OutputSignal, State[]>();

		states.forEach((state) => {
			const output = stateOutputs.get(state);
			if (!outputToStatesMap.has(output)) {
				outputToStatesMap.set(output, []);
			}
			outputToStatesMap.get(output)!.push(state);
		});

		outputToStatesMap.forEach((statesWithSameOutput) => {
			partition.push(statesWithSameOutput);
		});

		let newPartition: State[][] = [];

		const getNextStateGroup = (state: State, signal: InputSignal): State[] | undefined => {
			const nextState = transitions.get(state)?.get(signal)?.nextState;
			return partition.find(group => group.includes(nextState));
		};

		let changed = true;
		while (changed) {
			changed = false;

			newPartition = [];

			partition.forEach(group => {
				const subGroups: State[][] = [];

				group.forEach(state => {
					let addedToSubGroup = false;

					for (let subGroup of subGroups) {
						const representative = subGroup[0];

						const isEquivalent = inputSignals.every(signal => {
							const stateGroup = getNextStateGroup(state, signal);
							const repGroup = getNextStateGroup(representative, signal);
							return stateGroup === repGroup;
						});

						if (isEquivalent) {
							subGroup.push(state);
							addedToSubGroup = true;
							break;
						}
					}

					if (!addedToSubGroup) {
						subGroups.push([state]);
					}
				});

				newPartition.push(...subGroups);
			});

			if (newPartition.length !== partition.length) {
				changed = true;
				partition = newPartition;
			}
		}

		const minimizedStates: State[] = newPartition.map((group, index) => `q${index}`);
		const minimizedStateOutputs: MooreStateOutputs = new Map();
		const minimizedTransitions: MooreTransitions = new Map();

		newPartition.forEach((group, index) => {
			const representative = group[0];
			const newState = `q${index}`;
			minimizedStateOutputs.set(newState, stateOutputs.get(representative)!);

			const stateTransitions = new Map<InputSignal, TransitionMoore>();

			inputSignals.forEach(signal => {
				const nextState = getNextStateGroup(representative, signal);
				if (nextState) {
					const newNextStateIndex = newPartition.findIndex(group => group.includes(nextState[0]));
					stateTransitions.set(signal, {nextState: `q${newNextStateIndex}`});
				}
			});

			minimizedTransitions.set(newState, stateTransitions);
		});

		return {
			type: 'Moore',
			states: minimizedStates,
			inputSignals,
			stateOutputs: minimizedStateOutputs,
			transitions: minimizedTransitions,
		};
	}
}

export {
	Automaton,
}