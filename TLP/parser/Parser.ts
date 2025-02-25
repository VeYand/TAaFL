class Parser {
	private currentToken = 0

	constructor(
		private tokens: string[],
	) {
	}

	protected getCurrentToken(): number {
		return this.currentToken
	}

	protected getTokensCount(): number {
		return this.tokens.length
	}

	protected match(expected: string): boolean {
		if (this.peek() === expected) {
			this.currentToken++
			return true
		}
		return false
	}

	protected peek(): string | undefined {
		return this.tokens[this.currentToken]
	}

	protected setCurrentToken(token: number) {
		if (token < 0 || token > this.tokens.length) {
			throw new Error('Invalid token index')
		}
		this.currentToken = token
	}

	protected maybe(callable: () => boolean): boolean {
		const pos = this.getCurrentToken()
		if (callable()) {
			return true
		}
		this.setCurrentToken(pos)
		return false
	}
}

export {
	Parser,
}