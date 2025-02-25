class Parser {
	private currentToken = 0

	constructor(
		private tokens: string[],
	) {
	}

	protected getCurrentToken() {
		return this.currentToken
	}

	protected getTokensCount() {
		return this.tokens.length
	}

	protected match(expected: string): boolean {
		if (this.peek() === expected) {
			this.currentToken++
			return true
		}
		return false
	}

	protected peek(): string | null {
		return this.currentToken < this.tokens.length
			? this.tokens[this.currentToken]
			: null
	}

	protected setCurrentToken(token: number) {
		if (token < 0 || token >= this.tokens.length) {
			throw new Error('Invalid token index')
		}
		this.currentToken = token
	}
}

class FirstMonkeyPopulationParser extends Parser {
	constructor(input: string) {
		const tokens = input.trim().split(/\s+/)
		super(tokens)
	}

	public parse(): boolean {
		return this.rule1() && this.getCurrentToken() === this.getTokensCount()
	}

	private rule1(): boolean {
		const pos = this.getCurrentToken()
		if (this.rule2() && this.ruleZ()) {
			return true
		}
		this.setCurrentToken(pos)
		return false
	}

	private ruleZ(): boolean {
		const pos = this.getCurrentToken()
		if (this.peek() === 'ау') {
			this.match('ау')
			if (this.rule2() && this.ruleZ()) {
				return true
			}
			this.setCurrentToken(pos)
			return false
		}

		return true
	}

	private rule2(): boolean {
		const pos = this.getCurrentToken()
		if (this.rule3() && this.ruleV()) {
			return true
		}
		this.setCurrentToken(pos)
		return false
	}

	private ruleV(): boolean {
		const pos = this.getCurrentToken()
		if (this.peek() === 'ку') {
			this.match('ку')
			if (this.rule3() && this.ruleV()) {
				return true
			}
			this.setCurrentToken(pos)
			return false
		}

		return true
	}

	private rule3(): boolean {
		const pos = this.getCurrentToken()

		if (this.match('ух-ты')) {
			return true
		}
		this.setCurrentToken(pos)

		if (this.match('хо')) {
			if (this.rule3()) {
				return true
			}
			this.setCurrentToken(pos)
		}

		if (this.match('ну')) {
			if (this.rule1() && this.match('и_ну')) {
				return true
			}
			this.setCurrentToken(pos)
		}
		return false
	}
}

class SecondMonkeyPopulationParser extends Parser {
	constructor(input: string) {
		const tokens = input.trim().split(/\s+/)
		super(tokens)
	}

	public parse(): boolean {
		const result = this.rule1()
		return result && this.getCurrentToken() === this.getTokensCount()
	}

	private rule1(): boolean {
		const pos = this.getCurrentToken()
		if (this.match('ой') && this.rule2() && this.match('ай') && this.rule3()) {
			return true
		}
		this.setCurrentToken(pos)
		return false
	}

	private rule2(): boolean {
		if (!this.match('ну')) {
			return false
		}
		while (this.peek() === 'ну') {
			this.match('ну')
		}
		return true
	}

	private rule3(): boolean {
		const pos = this.getCurrentToken()

		if (this.match('ух-ты')) {
			return true
		}
		this.setCurrentToken(pos)

		if (this.match('хо')) {
			if (this.rule3() && this.match('хо')) {
				return true
			}
			this.setCurrentToken(pos)
		}
		return false
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
