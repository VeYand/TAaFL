import {Automaton} from './Automaton'
import path from 'node:path'

const main = () => {
	const automaton = new Automaton()

	automaton.read(path.join(__dirname, 'samples/mealy/input.txt'), 'Mealy')
	automaton.saveGraph(path.join(__dirname, 'output/mealy1.png'), 'Mealy')
	automaton.saveGraph(path.join(__dirname, 'output/moore1.png'), 'Moore')
	automaton.write(path.join(__dirname, 'output/mealy1.txt'), 'Mealy')
	automaton.write(path.join(__dirname, 'output/moore1.txt'), 'Moore')

	automaton.read(path.join(__dirname, 'samples/moore/input.txt'), 'Moore')
	automaton.saveGraph(path.join(__dirname, 'output/mealy2.png'), 'Mealy')
	automaton.saveGraph(path.join(__dirname, 'output/moore2.png'), 'Moore')
	automaton.write(path.join(__dirname, 'output/mealy2.txt'), 'Mealy')
	automaton.write(path.join(__dirname, 'output/moore2.txt'), 'Moore')
}

if (require.main === module) {
	main()
}