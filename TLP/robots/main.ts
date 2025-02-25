import {Parser} from '../parser/Parser'

class RobotParser extends Parser {
	constructor(input: string) {
		const tokens = input.trim().split(/\s+/)
		super(tokens)
	}

	public parse(): boolean {
		return this.start() && this.getCurrentToken() === this.getTokensCount()
	}

	// <Start> -> start <Rule1> stop
	private start(): boolean {
		return this.maybe(() => this.match('start') && this.rule1() && this.match('stop'))
	}

	// <Rule1> -> <Rule2> <RuleZ>
	private rule1(): boolean {
		return this.maybe(() => this.rule2() && this.ruleZ())
	}

	// <RuleZ> -> <Rule4> <Rule2> <RuleZ> | ε
	private ruleZ(): boolean {
		return this.maybe(() =>
			this.rule4() && this.rule2() && this.ruleZ(),
		) || true
	}

	// <Rule2> -> <Rule3> <RuleV>
	private rule2(): boolean {
		return this.maybe(() => this.rule3() && this.ruleV())
	}

	// <RuleV> -> <Rule5> <Rule3> <RuleV> | ε
	private ruleV(): boolean {
		return this.maybe(() =>
			this.rule5() && this.rule3() && this.ruleV(),
		) || true
	}

	// <Rule3> -> left | right | on45 <Rule3> | hands_up <Rule1> hands_down
	private rule3(): boolean {
		return this.maybe(() => this.match('left'))
			|| this.maybe(() => this.match('right'))
			|| this.maybe(() => this.match('on45') && this.rule3())
			|| this.maybe(() => this.match('hands_up') && this.rule1() && this.match('hands_down'))
	}

	// <Rule4> -> step_( <Rule6> )
	private rule4(): boolean {
		return this.maybe(() => this.match('step_(') && this.rule6() && this.match(')'))
	}

	// <Rule5> -> turn_head
	private rule5(): boolean {
		return this.maybe(() => this.match('turn_head'))
	}

	// <Rule6> -> digit | digit <Rule6>
	private rule6(): boolean {
		return this.maybe(() => this.matchNumber())
			|| this.maybe(() => this.matchNumber() && this.rule6())
	}
}

const testCases = [
	"start  left stop", // OK 3
	"start  left  turn_head on45 left step_( 9 )  on45 right step_( 9 ) left  stop", // OK 15
	"start    stop", // ERR 2
	"start  on45 on45 on45 on45 on45 left stop", // OK 8
	"start left  step_( 67890 )  hands_up  hands_up  hands_up  left hands_down  hands_down hands_down stop", // OK 13

]

const main = () => {
	for (const test of testCases) {
		const parser = new RobotParser(test)

		process.stdout.write(`Тест: '${test}'. `)

		const success = parser.parse()
		if (success) {
			process.stdout.write(`OK`)
		} else {
			process.stdout.write(`ERR`)
		}

		process.stdout.write(` ${success ? parser.getTokensCount() : parser.getErrorIndex() + 1}\n`)
	}
}

if (require.main === module) {
	main()
}

// <Start> -> start <Rule1> end
// <Rule1> -> <Rule2> <RuleZ>
// <RuleZ> -> <Rule4> <Rule2> <RuleZ> | ε
// <Rule2> -> <Rule3> <RuleV>
// <RuleV> -> <Rule5> <Rule3> <RuleV> | ε
// <Rule3> -> left | right | on45 <Rule3> | hands_up <Rule1> hands_down
// <Rule4> -> step_( <Rule6> )
// <Rule5> -> turn_head
// <Rule6> -> digit | digit <Rule6>
