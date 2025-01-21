import {NFA, Transition} from './main'
import * as fs from 'fs';
import {exec} from 'node:child_process'

export function minimize(dfa: NFA): NFA {
	const allStates = dfa.states;
	const transitionSymbols = Array.from(new Set(dfa.transitions.map(tr => tr.expression)));

	const outputFile = 'temp.csv';
	let outputContent = '';

	outputContent += ';' + allStates.map(state => state.includes('(end)') ? `F` : '').join(';') + '\n';
	outputContent += ';' + allStates.join(';') + '\n';

	for (const symbol of transitionSymbols) {
		if (!symbol) continue
		outputContent += `${symbol};`
		for (let i = 0; i < allStates.length; i++) {
			const stateFrom = allStates[i]
			const transition = dfa.transitions.find(tra => tra.from === stateFrom && tra.expression === symbol);
			if (transition) {
				outputContent += `${transition.to}`;
				outputContent += (allStates.length - 1 === i) ? '' : ';';
			} else {
				outputContent += (allStates.length - 1 === i) ? '' : ';';
			}
		}
		outputContent += '\n';
	}

	fs.writeFileSync(outputFile, outputContent);
	executePython()
	return readDfaFromMinim()
}

function readDfaFromMinim(): NFA {
	const inputText = fs.readFileSync('minimizedTemp.csv', 'utf8');

	const lines = inputText.split(/\r?\n/);

	const finalStateMarkers = lines[0].split(';')
	const states = lines[1].split(';')

	const allStates: string[] = []
	const allTransitions: Transition[] = []
	const finalFuckingStates = []

	for (let i = 2; i < lines.length; i++) {
		const transitionLine = lines[i]
		const transitions = transitionLine.split(';')
		const signal = transitions[0]
		for (let j = 1; j < transitions.length; j++) {
			const toState = transitions[j]
			const fromState = states[j]
			const isFinal = finalStateMarkers[j] === 'F'

			if (toState) {
				allStates.push(toState)
				allTransitions.push({
					from: fromState,
					to: toState,
					expression: signal,
				})
			}
			allStates.push(fromState)
			if (isFinal) {
				finalFuckingStates.push(fromState)
			}
		}
	}

	return {
		states: Array.from(new Set(allStates)).map(st => finalFuckingStates.includes(st) ? `${st} (end)` : st),
		transitions: allTransitions.map(trans => ({
			...trans,
			from: finalFuckingStates.includes(trans.from) ? `${trans.from} (end)` : trans.from,
			to: finalFuckingStates.includes(trans.to) ? `${trans.to} (end)` : trans.to,
		})),
		startState: '',
		endState: '',
	}
}


function executePython() {
	exec('python3 lab5/minimizeUltra.py moore temp.csv minimizedTemp.csv', (error, stdout, stderr) => {
		if (error) {
			console.error(`Ошибка при выполнении: ${error}`);
			return;
		}
		if (stderr) {
			console.error(`Стандартные ошибки потока: ${stderr}`);
			return;
		}
	});
}