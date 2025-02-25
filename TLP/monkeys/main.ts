import {Parser} from '../parser/Parser'

class FirstMonkeyPopulationParser extends Parser {
	constructor(input: string) {
		const tokens = input.trim().split(/\s+/)
		super(tokens)
	}

	public parse(): boolean {
		return this.rule1() && this.getCurrentToken() === this.getTokensCount()
	}

	// <Rule1> -> <Rule2> <RuleZ>
	private rule1(): boolean {
		return this.maybe(() => this.rule2() && this.ruleZ())
	}

	// <RuleZ> -> ау <Rule2> <RuleZ> | ε
	private ruleZ(): boolean {
		return this.maybe(() =>
			this.match('ау') && this.rule2() && this.ruleZ()
		) || true
	}

	// <Rule2> -> <Rule3> <RuleV>
	private rule2(): boolean {
		return this.maybe(() => this.rule3() && this.ruleV())
	}

	// <RuleV> -> ку <Rule3> <RuleV> | ε
	private ruleV(): boolean {
		return this.maybe(() =>
			this.match('ку') && this.rule3() && this.ruleV()
		) || true
	}

	// <Rule3> -> ух-ты | хо <Rule3> | ну <Rule1> и_ну
	private rule3(): boolean {
		return this.maybe(() => this.match('ух-ты'))
			|| this.maybe(() => this.match('хо') && this.rule3())
			|| this.maybe(() => this.match('ну') && this.rule1() && this.match('и_ну'))
	}
}

class SecondMonkeyPopulationParser extends Parser {
	constructor(input: string) {
		const tokens = input.trim().split(/\s+/)
		super(tokens)
	}

	public parse(): boolean {
		return this.rule1() && this.getCurrentToken() === this.getTokensCount()
	}

	// <Rule1> -> ой <Rule2> ай <Rule3>
	private rule1(): boolean {
		return this.maybe(() => this.match('ой') && this.rule2() && this.match('ай') && this.rule3())
	}

	// <Rule2> -> ну | ну <Rule2>
	private rule2(): boolean {
		if (!this.match('ну')) {
			return false
		}

		while (this.peek() === 'ну') {
			this.match('ну')
		}

		return true
	}

	// <Rule3> -> ух-ты | хо <Rule3> хо
	private rule3(): boolean {
		return this.maybe(() => this.match('ух-ты'))
			|| this.maybe(() => this.match('хо') && this.rule3() && this.match('хо'))
	}
}

const testCases = [
	// Первая популяция (простые)
	"ух-ты",
	"хо ух-ты",
	"ну ух-ты и_ну",

	// Первая популяция (длинные, сложные)
	"хо хо ну ух-ты и_ну",
	"ну ну ух-ты и_ну и_ну",
	"хо хо ну хо ну ух-ты и_ну и_ну",
	"хо ух-ты ау ух-ты ку хо ух-ты ку ух-ты ау хо ну ух-ты и_ну ку ух-ты",

	// Вторая популяция (для проверки)
	"ой ну ай ух-ты",
	"ой ну ну ай хо ух-ты хо",
	"ой ну ну ну ай хо хо хо ух-ты хо хо хо",

	// Неместные обезьяны (должно вернуть False)
	"ух-ты и_ну",
	"ой ух-ты",
	"хо хо ой ну ай ух-ты",
	"ой ну ну ай хо ух-ты хо ну ух-ты и_ну",
]

const main = () => {
	for (const test of testCases) {
		const firstParser = new FirstMonkeyPopulationParser(test)
		const secondParser = new SecondMonkeyPopulationParser(test)

		process.stdout.write(`Тест: '${test}'. `)

		if (firstParser.parse()) {
			process.stdout.write(`Первая популяция!\n`)
		} else if (secondParser.parse()) {
			process.stdout.write(`Вторая популяция!\n`)
		} else {
			process.stdout.write(`Ты кто?\n`)
		}
	}
}

if (require.main === module) {
	main()
}
