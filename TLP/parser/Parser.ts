class Parser {
	private currentToken = 0
	private furthest = 0

	constructor(
		private tokens: string[],
	) {
	}

	public getTokensCount(): number {
		return this.tokens.length
	}

	protected getCurrentToken(): number {
		return this.currentToken
	}

	protected matchNumber(): boolean {
		let numberStr = ''

		while ('0123456789'.includes(this.peek() ?? '')) {
			numberStr += this.peek()
			this.currentToken++
			if (this.currentToken > this.furthest) {
				this.furthest = this.currentToken
			}
		}

		return numberStr.length > 0
	}

	protected match(expected: string): boolean {
		if (this.peek() === expected) {
			this.currentToken++
			if (this.currentToken > this.furthest) {
				this.furthest = this.currentToken
			}
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

	public getErrorIndex(): number {
		return this.furthest
	}
}

export {
	Parser,
}