enum Lexeme {
	// Ключевые слова
	ARRAY = 'ARRAY',
	BEGIN = 'BEGIN',
	ELSE = 'ELSE',
	END = 'END',
	IF = 'IF',
	OF = 'OF',
	OR = 'OR',
	PROGRAM = 'PROGRAM',
	PROCEDURE = 'PROCEDURE',
	THEN = 'THEN',
	TYPE = 'TYPE',
	VAR = 'VAR',

	// Операторы и знаки пунктуации
	MULTIPLICATION = '*',
	PLUS = '+',
	MINUS = '-',
	DIVIDE = '/',
	SEMICOLON = ';',
	COMMA = ',',
	LEFT_PAREN = '(',
	RIGHT_PAREN = ')',
	LEFT_BRACKET = '[',
	RIGHT_BRACKET = ']',
	EQ = '=',
	GREATER = '>',
	LESS = '<',
	LESS_EQ = '<=',
	GREATER_EQ = '>=',
	NOT_EQ = '<>',
	COLON = ':',
	ASSIGN = ':=',
	DOT = '.',
	DOUBLE_EQ = '==',

	// Литералы и идентификаторы
	IDENTIFIER = 'IDENTIFIER',
	STRING = 'STRING',
	INTEGER = 'INTEGER',
	FLOAT = 'FLOAT',

	// Комментарии
	LINE_COMMENT = 'LINE_COMMENT',
	BLOCK_COMMENT = 'BLOCK_COMMENT',

	// Специальные
	BAD = 'BAD',
	EOF = 'EOF'
}

function getKeyword(value: string): Lexeme | undefined {
	const keywords = [
		Lexeme.ARRAY,
		Lexeme.BEGIN,
		Lexeme.ELSE,
		Lexeme.END,
		Lexeme.IF,
		Lexeme.OF,
		Lexeme.OR,
		Lexeme.PROGRAM,
		Lexeme.PROCEDURE,
		Lexeme.THEN,
		Lexeme.TYPE,
		Lexeme.VAR,
	];

	return keywords.find(keyword => keyword === value.toUpperCase()) as Lexeme | undefined;
}

type Position = {
	line: number;
	column: number;
};

type Token = {
	type: Lexeme;
	lexeme: string;
	position: Position;
};

class Lexer {
	private text: string = '';
	private pos: number = 0;
	private currentChar: string | null = null;
	private line: number = 1;
	private column: number = 0;

	constructor(text: string) {
		this.text = text;
		this.currentChar = this.text[this.pos] || null;
	}

	private advance(): void {
		if (this.currentChar === '\n') {
			this.line++;
			this.column = 0;
		} else {
			this.column++;
		}
		this.pos++;
		this.currentChar = this.pos < this.text.length ? this.text[this.pos] : null;
	}

	private peek(): string | null {
		return this.pos + 1 < this.text.length ? this.text[this.pos + 1] : null;
	}

	private skipWhitespace(): void {
		while (this.currentChar && /\s/.test(this.currentChar)) {
			this.advance();
		}
	}

	private skipComment(): Token | null {
		const startLine = this.line;
		const startColumn = this.column;
		let result = '';

		if (this.currentChar === '/' && this.peek() === '/') {
			while (this.currentChar && this.currentChar !== '\n') {
				result += this.currentChar;
				this.advance();
			}
			return {
				type: Lexeme.LINE_COMMENT,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		} else if (this.currentChar === '{') {
			result += this.currentChar;
			this.advance();

			while (this.currentChar && this.currentChar !== '}') {
				result += this.currentChar;
				this.advance();
			}

			if (this.currentChar === '}') {
				result += this.currentChar;
				this.advance();
			} else {
				return {
					type: Lexeme.BAD,
					lexeme: result,
					position: {line: startLine, column: startColumn},
				};
			}

			return {
				type: Lexeme.BLOCK_COMMENT,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		return null;
	}

	private number(): Token {
		const startColumn = this.column;
		const startLine = this.line;
		let result = '';
		let isFloat = false;
		let dotCount = 0;

		while (this.currentChar && /\d/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}

		if (this.currentChar === '.' && this.peek() === '.') {
			return {
				type: Lexeme.INTEGER,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		if (this.currentChar === '.') {
			while (this.currentChar === '.') {
				result += this.currentChar;
				dotCount++;
				this.advance();
			}
			if (dotCount > 1 || !/\d/.test(this.currentChar || '')) {
				while (this.currentChar && /[a-zA-Z\d.]/.test(this.currentChar)) {
					result += this.currentChar;
					this.advance();
				}
				return {
					type: Lexeme.BAD,
					lexeme: result,
					position: {line: startLine, column: startColumn},
				};
			}
			isFloat = true;

			while (this.currentChar && /\d/.test(this.currentChar)) {
				result += this.currentChar;
				this.advance();
			}
		}

		if (this.currentChar?.toLowerCase() === 'e') {
			result += this.currentChar;
			this.advance();

			if (this.currentChar === '+' || this.currentChar === '-') {
				result += this.currentChar;
				this.advance();
			}

			if (!/\d/.test(this.currentChar || '')) {
				return {
					type: Lexeme.BAD,
					lexeme: result,
					position: {line: startLine, column: startColumn},
				};
			}

			while (this.currentChar && /\d/.test(this.currentChar)) {
				result += this.currentChar;
				this.advance();
			}

			isFloat = true;
		}

		if (this.currentChar === '.') {
			while (this.currentChar && this.currentChar !== '\n' && this.currentChar !== ' ') {
				result += this.currentChar;
				this.advance();
			}
			return {
				type: Lexeme.BAD,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		if (/[a-zA-Z_а-яА-Я]/.test(this.currentChar || '')) {
			while (this.currentChar && !/\s/.test(this.currentChar)) {
				result += this.currentChar;
				this.advance();
			}
			return {
				type: Lexeme.BAD,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		return {
			type: isFloat ? Lexeme.FLOAT : Lexeme.INTEGER,
			lexeme: result,
			position: {line: startLine, column: startColumn},
		};
	}

	private identifierOrInvalid(): Token {
		const startColumn = this.column;
		const startLine = this.line;
		let result = '';

		while (this.currentChar && /[a-zA-Z0-9_а-яА-Я]/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}

		if (/[а-яА-Я]/.test(result)) {
			return {
				type: Lexeme.BAD,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		const keyword = getKeyword(result);
		if (keyword) {
			return {
				type: keyword,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		return {
			type: Lexeme.IDENTIFIER,
			lexeme: result,
			position: {line: startLine, column: startColumn},
		};
	}

	private string(): Token {
		const startColumn = this.column;
		const startLine = this.line;
		let result = '';

		this.advance();
		while (this.currentChar && this.currentChar !== '"' && this.currentChar !== '\n') {
			result += this.currentChar;
			this.advance();
		}

		if (this.currentChar === '"') {
			this.advance();
			return {
				type: Lexeme.STRING,
				lexeme: `${result}`,
				position: {line: startLine, column: startColumn},
			};
		}

		return {
			type: Lexeme.BAD,
			lexeme: result,
			position: {line: startLine, column: startColumn},
		};
	}

	private operatorOrPunctuation(): Token {
		const startColumn = this.column;
		const startLine = this.line;
		const char = this.currentChar;

		if (char === ':' && this.peek() === '=') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.ASSIGN,
				lexeme: ':=',
				position: {line: startLine, column: startColumn},
			};
		}
		if (char === '=' && this.peek() === '=') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.DOUBLE_EQ,
				lexeme: '==',
				position: {line: startLine, column: startColumn},
			};
		}
		if (char === '<' && this.peek() === '>') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.NOT_EQ,
				lexeme: '<>',
				position: {line: startLine, column: startColumn},
			};
		}

		const singleCharOperators: Record<string, Lexeme> = {
			'*': Lexeme.MULTIPLICATION,
			'+': Lexeme.PLUS,
			'-': Lexeme.MINUS,
			'/': Lexeme.DIVIDE,
			';': Lexeme.SEMICOLON,
			',': Lexeme.COMMA,
			'(': Lexeme.LEFT_PAREN,
			')': Lexeme.RIGHT_PAREN,
			'[': Lexeme.LEFT_BRACKET,
			']': Lexeme.RIGHT_BRACKET,
			'=': Lexeme.EQ,
			'>': Lexeme.GREATER,
			'<': Lexeme.LESS,
			':': Lexeme.COLON,
			'.': Lexeme.DOT,
		};

		if (singleCharOperators[char]) {
			this.advance();
			return {
				type: singleCharOperators[char],
				lexeme: char,
				position: {line: startLine, column: startColumn},
			};
		}

		this.advance();
		return {
			type: Lexeme.BAD,
			lexeme: char,
			position: {line: startLine, column: startColumn},
		};
	}

	public nextToken(): Token | null {
		while (this.currentChar) {
			if (/\s/.test(this.currentChar)) {
				this.skipWhitespace();
				continue;
			}
			if (this.currentChar === '/' && this.peek() === '/') {
				return this.skipComment();
			}
			if (this.currentChar === '{') {
				return this.skipComment();
			}
			if (this.currentChar === '"') {
				return this.string();
			}
			if (/[a-zA-Z_а-яА-Я]/.test(this.currentChar)) {
				return this.identifierOrInvalid();
			}
			if (/\d/.test(this.currentChar)) {
				return this.number();
			}
			return this.operatorOrPunctuation();
		}
		return {
			type: Lexeme.EOF,
			lexeme: '',
			position: {line: this.line, column: this.column},
		};
	}

	public tokenize(): Token[] {
		const tokens: Token[] = [];
		let token: Token | null;
		do {
			token = this.nextToken();
			if (token) tokens.push(token);
		} while (token && token.type !== Lexeme.EOF);
		return tokens;
	}
}

export {
	Lexeme,
	Lexer,
};

export type {
	Token,
};
