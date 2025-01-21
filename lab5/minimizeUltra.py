import csv
import sys


def read_moore_machine(file_name):
    states = []
    input_symbols = []
    transitions = {}
    outputs = {}
    initial_state = None

    with open(file_name, 'r', newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        outputs_row = list(reversed(next(reader)[1:]))
        states = next(reader)[1:]
        initial_state = states[0]
        for state in states:
            outputs[state] = outputs_row.pop()
        for row in reader:
            symbol = row[0]
            input_symbols.append(symbol)
            for index in range(len(row) - 1):
                transitions.setdefault(states[index], {})[symbol] = row[index + 1]

    return states, input_symbols, transitions, outputs, initial_state


def readMealyMachine(file_name):
    states = []
    input_symbols = []
    transitions = {}
    outputs = {}
    initial_state = None

    with open(file_name, 'r', newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        states = next(reader)[1:]
        initial_state = states[0]
        for row in reader:
            symbol = row[0]
            input_symbols.append(symbol)
            for index in range(len(row) - 1):
                if "/" in row[index + 1]:
                    state, output = row[index + 1].split('/')
                    transitions.setdefault(states[index], {})[symbol] = state
                    outputs.setdefault(states[index], {})[symbol] = output
                else:
                    transitions.setdefault(states[index], {})[symbol] = ""
                    outputs.setdefault(states[index], {})[symbol] = ""
    return states, input_symbols, transitions, outputs, initial_state

def readMooreFromCSV(fileName, delimiter=';'):
    with open(fileName, 'r', encoding='ISO-8859-1') as file:
        reader = csv.reader(file, delimiter=delimiter)
        data = []

        for row in reader:
            data.append(row)

        mooreStates = []
        mooreStateOutputs = {}
        inputValueToTransitions = {}

        inputOutputsLine = data[0][1:]
        inputStatesLine = data[1][1:]

        for output, state in zip(inputOutputsLine, inputStatesLine):
            mooreStates.append(state.strip())
            mooreStateOutputs[state.strip()] = output.strip()

        for transitions in data[2:]:
            inputValue = transitions[0].strip()

            for i, transition in enumerate(transitions[1:]):
                nextState = transition.strip()
                currentState = mooreStates[i]
                output = mooreStateOutputs[currentState]

                if inputValue not in inputValueToTransitions:
                    inputValueToTransitions[inputValue] = {}

                inputValueToTransitions[inputValue][currentState] = f"{nextState}/{output}"

    return mooreStates, inputValueToTransitions

def write_mealy_machine(file_name, states, input_symbols, transitions, outputs, initial_state):
    states = [initial_state] + list(filter(lambda x: x != initial_state, states))
    with open(file_name, 'w', newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow([""] + states)
        for symbol in input_symbols:
            row = [symbol]
            for state in states:
                transition = transitions[state][symbol]
                output = outputs[state][symbol]
                if transition and output:
                    row.append(f"{transition}/{output}")
                else:
                    row.append("")
            writer.writerow(row)


def writeMoore(file_name, states, input_symbols, transitions, outputs, initial_state):
    states = [initial_state] + list(filter(lambda x: x != initial_state, states))
    with open(file_name, 'w', newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        outputs_row = [""]
        for state in states:
            outputs_row.append(outputs[state])
        writer.writerow(outputs_row)
        writer.writerow([""] + states)
        for symbol in input_symbols:
            row = [symbol]
            for state in states:
                row.append(transitions[state][symbol])
            writer.writerow(row)


def removeUnreachableStates(states, input_symbols, transitions, outputs, initial_state):
    reachable_states = set()
    to_visit = [initial_state]

    while to_visit:
        state = to_visit.pop()
        if state in reachable_states:
            continue
        reachable_states.add(state)

        for symbol in transitions[state]:
            transition = transitions[state][symbol]
            if transition:
                to_visit.append(transition)

    return list(filter(lambda x: x in reachable_states, states)), input_symbols, transitions, outputs, initial_state


def minimize_mealy_machine(states, input_symbols, transitions, outputs, initial_state):
    output_groups = {}
    for state in states:
        output = ""
        for symbol in input_symbols:
            output += outputs[state][symbol]
        output_groups.setdefault(output, set()).add(state)

    partitions = list(output_groups.values())

    def refine(partitions):
        new_partitions = []
        for group in partitions:
            subgroup = {}
            for state in group:
                key = ""
                for symbol in input_symbols:
                    key += str(next((i for i, s in enumerate(partitions) if transitions[state][symbol] in s)))
                subgroup.setdefault(key, set()).add(state)
            new_partitions.extend(subgroup.values())
        return new_partitions

    while True:
        new_partitions = refine(partitions)
        if new_partitions == partitions:
            break
        partitions = new_partitions

    state_map = {}
    minimized_states = []
    minimized_transitions = {}
    minimized_outputs = {}

    for i, group in enumerate(partitions):
        new_state = f"S{i}"
        for state in group:
            state_map[state] = new_state
        minimized_states.append(new_state)

    for group in partitions:
        representative = next(iter(group))
        new_state = state_map[representative]
        minimized_transitions[new_state] = {
            symbol: state_map[transitions[representative][symbol]]
            for symbol in input_symbols
        }
        minimized_outputs[new_state] = {
            symbol: outputs[representative][symbol]
            for symbol in input_symbols
        }

    minimized_initial_state = state_map[initial_state]

    return minimized_states, input_symbols, minimized_transitions, minimized_outputs, minimized_initial_state


def removeUnreachableStates(states, input_symbols, transitions, outputs, initial_state):
    output_groups = {}
    for state in states:
        output = outputs[state]
        output_groups.setdefault(output, set()).add(state)

    partitions = list(output_groups.values())

    def refine(partitions):
        new_partitions = []
        for group in partitions:
            subgroup = {}
            for state in group:
                key = ""
                for symbol in input_symbols:
                    for i, s in enumerate(partitions):
                        if transitions[state][symbol] in s:
                            key += symbol + str(i)
                subgroup.setdefault(key, set()).add(state)
            new_partitions.extend(subgroup.values())
        return new_partitions

    while True:
        new_partitions = refine(partitions)
        if new_partitions == partitions:
            break
        partitions = new_partitions

    state_map = {}
    minimized_states = []
    minimized_transitions = {}
    minimized_outputs = {}

    for i, group in enumerate(partitions):
        new_state = f"S{i}"
        for state in group:
            state_map[state] = new_state
        minimized_states.append(new_state)
        representative = next(iter(group))
        minimized_outputs[new_state] = outputs[representative]

    for group in partitions:
        representative = next(iter(group))
        new_state = state_map[representative]
        minimized_transitions[new_state] = {
            symbol: state_map[transitions[representative][symbol]] if transitions[representative][symbol] else ""
            for symbol in input_symbols
        }
    minimized_initial_state = state_map[initial_state]

    return minimized_states, input_symbols, minimized_transitions, minimized_outputs, minimized_initial_state


def main():
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} <machine-type> <input-file> <output-file>")
        return 1

    machine_type = sys.argv[1]
    input_file_name = sys.argv[2]
    output_file_name = sys.argv[3]

    try:
        if machine_type == "mealy":
            values = readMealyMachine(input_file_name)
            values = removeUnreachableStates(*values)
            values = minimize_mealy_machine(*values)
            write_mealy_machine(output_file_name, *values)
        elif machine_type == "moore":
            values = read_moore_machine(input_file_name)
            values = removeUnreachableStates(*values)
            values = removeUnreachableStates(*values)
            writeMoore(output_file_name, *values)
        else:
            print(f"Unknown machine type: {machine_type}")
            return 1
    except RuntimeError as e:
        print(e)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())