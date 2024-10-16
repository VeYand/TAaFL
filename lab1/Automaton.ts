import * as fs from 'node:fs'
import * as graphviz from 'graphviz'
import {AutomatonType, MealyAutomaton, MooreAutomaton} from './types'
import {convertMooreToMealy, convertMealyToMoore} from './utils'

interface IAutomaton {
	read: (filePath: string, type: AutomatonType) => void,
	write: (filePath: string, type: AutomatonType) => void,
	saveGraph: (filePath: string, type: AutomatonType) => void,
}

type AutomatonDataType = MooreAutomaton | MealyAutomaton

class Automaton implements IAutomaton {
	private automaton: AutomatonDataType | undefined

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

		const [_, ...stateHeaders] = lines[0].split('').map(str => str.trim())

		const automaton: MealyAutomaton = {
			type: 'Mealy',
			states: stateHeaders,
			inputSignals: [],
			transitions: new Map(),
		}

		lines.slice(1).forEach(line => {
			const [inputSignal, ...transitions] = line.split('').map(str => str.trim())

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

		const [_, ...outputSymbols] = lines[0].split('').map(str => str.trim())
		const [__, ...stateHeaders] = lines[1].split('').map(str => str.trim())

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
			const [inputSignal, ...transitions] = line.split('').map(str => str.trim())

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

		const header = [''].concat(states).join('')
		const lines: string[] = [header]

		inputSignals.forEach(inputSignal => {
			const transitionStrings = states.map(state => {
				const transition = transitions.get(state)?.get(inputSignal)
				if (transition) {
					return `${transition.nextState}/${transition.output}`
				}
				return '-'
			})

			const line = [inputSignal].concat(transitionStrings).join('')
			lines.push(line)
		})

		fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
	}

	private static writeMoore(filePath: string, automaton: MooreAutomaton): void {
		const {states, inputSignals, transitions, stateOutputs} = automaton

		const outputLine = [''].concat(states.map(state => stateOutputs.get(state) || '')).join('')
		const statesLine = [''].concat(states).join('')

		const lines: string[] = [outputLine, statesLine]

		inputSignals.forEach(inputSignal => {
			const transitionStrings = states.map(state => {
				const transition = transitions.get(state)?.get(inputSignal)
				if (transition) {
					return transition.nextState
				}
				return '-'
			})

			const line = [inputSignal].concat(transitionStrings).join('')
			lines.push(line)
		})

		fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
	}

	private static saveMealyGraph(automaton: MealyAutomaton, filePath: string): void {
		const g = graphviz.digraph("MealyAutomaton2")

		automaton.states.forEach(state => {
			g.addNode(state, {shape: "circle"})
		})

		automaton.transitions.forEach((inputMap, currentState) => {
			inputMap.forEach((transition, inputSignal) => {
				const {nextState, output} = transition
				const label = `${inputSignal} / ${output}`
				g.addEdge(currentState, nextState, {label})
			})
		})

		g.output("png", filePath)
	}

	private static showMooreGraph(automaton: MooreAutomaton, filePath: string): void {
		const g = graphviz.digraph("MooreAutomaton2")

		automaton.states.forEach(state => {
			const output = automaton.stateOutputs.get(state)
			g.addNode(state, {shape: "circle", label: `${state}\n${output}`})
		})

		automaton.transitions.forEach((inputMap, currentState) => {
			inputMap.forEach((transition, inputSignal) => {
				console.log({currentState})
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
}


export {
	Automaton,
}