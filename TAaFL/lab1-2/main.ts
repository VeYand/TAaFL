import {Automaton} from './Automaton'
import path from 'node:path'

const main = () => {
	const automaton = new Automaton()

	automaton.read(path.join(__dirname, 'samples/minimization/mealy/input1.txt'), 'Mealy')
	automaton.minimize()
	automaton.write(path.join(__dirname, 'output/minimizedMoore1.txt'), 'Moore')
	automaton.saveGraph(path.join(__dirname, 'output/minimizedMoore1.png'), 'Moore')

	automaton.read(path.join(__dirname, 'samples/minimization/mealy/input1.txt'), 'Mealy')
	automaton.write(path.join(__dirname, 'output/temp.txt'), 'Moore')
	automaton.read(path.join(__dirname, 'output/temp.txt'), 'Moore')
	automaton.minimize()
	automaton.write(path.join(__dirname, 'output/minimizedMoore2.txt'), 'Moore')
	automaton.saveGraph(path.join(__dirname, 'output/minimizedMoore2.png'), 'Moore')
}

if (require.main === module) {
	main()
}