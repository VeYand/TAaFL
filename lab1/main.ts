import {Automaton} from './Automaton'
import path from 'node:path'

const main = () => {
	const automaton = new Automaton()

	// automaton.read(path.join(__dirname, 'samples/mealy/input1.txt'), 'Mealy')
	// automaton.saveGraph(path.join(__dirname, 'output/mealy1.png'), 'Mealy')
	// automaton.saveGraph(path.join(__dirname, 'output/moore1.png'), 'Moore')
	// automaton.write(path.join(__dirname, 'output/mealy1.txt'), 'Mealy')
	// automaton.write(path.join(__dirname, 'output/moore1.txt'), 'Moore')
	//
	// automaton.read(path.join(__dirname, 'samples/moore/input1.txt'), 'Moore')
	// automaton.saveGraph(path.join(__dirname, 'output/mealy2.png'), 'Mealy')
	// automaton.saveGraph(path.join(__dirname, 'output/moore2.png'), 'Moore')
	// automaton.write(path.join(__dirname, 'output/mealy2.txt'), 'Mealy')
	// automaton.write(path.join(__dirname, 'output/moore2.txt'), 'Moore')

	automaton.read(path.join(__dirname, 'samples/minimization/mealy/input1.txt'), 'Mealy')
	automaton.write(path.join(__dirname, 'output/mealyBase.txt'), 'Mealy')
	automaton.saveGraph(path.join(__dirname, 'output/mealyBase.png'), 'Mealy')
	automaton.minimize()
	automaton.write(path.join(__dirname, 'output/mealyMinimized.txt'), 'Mealy')
	automaton.saveGraph(path.join(__dirname, 'output/mealyMinimized.png'), 'Mealy')

	// automaton.read(path.join(__dirname, 'samples/minimization/moore/input1.txt'), 'Moore')
	// automaton.write(path.join(__dirname, 'output/mooreBase.txt'), 'Moore')
	// automaton.saveGraph(path.join(__dirname, 'output/mooreBase.png'), 'Moore')
	// automaton.minimize()
	// automaton.write(path.join(__dirname, 'output/mooreMinimized.txt'), 'Moore')
	// automaton.saveGraph(path.join(__dirname, 'output/mooreMinimized.png'), 'Moore')
}

if (require.main === module) {
	main()
}