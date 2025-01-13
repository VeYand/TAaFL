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
		Lexeme.ARRAY.toString(),
		Lexeme.BEGIN.toString(),
		Lexeme.ELSE.toString(),
		Lexeme.END.toString(),
		Lexeme.IF.toString(),
		Lexeme.OF.toString(),
		Lexeme.OR.toString(),
		Lexeme.PROGRAM.toString(),
		Lexeme.PROCEDURE.toString(),
		Lexeme.THEN.toString(),
		Lexeme.TYPE.toString(),
		Lexeme.VAR.toString(),
	];

	const upperValue = value.toUpperCase();

	const foundKeyword = keywords.find(keyword => keyword === upperValue);

	return foundKeyword ? (Lexeme as any)[foundKeyword] : null;
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

		while (this.currentChar && /\d/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}

		if (this.currentChar && /[a-zA-Z]/.test(this.currentChar)) {
			while (this.currentChar && !/\s|[:;]/.test(this.currentChar)) {
				result += this.currentChar;
				this.advance();
			}
			return {
				type: Lexeme.BAD,
				lexeme: result,
				position: {line: startLine, column: startColumn},
			};
		}

		if (this.currentChar === '.') {
			if (this.peek() === '.') {
				return {
					type: Lexeme.INTEGER,
					lexeme: result,
					position: {line: this.line, column: startColumn},
				};
			} else {
				result += this.currentChar;
				this.advance();

				while (this.currentChar && /\d/.test(this.currentChar)) {
					result += this.currentChar;
					this.advance();
				}

				return {
					type: Lexeme.FLOAT,
					lexeme: result,
					position: {line: this.line, column: startColumn},
				};
			}
		}

		return {
			type: Lexeme.INTEGER,
			lexeme: result,
			position: {line: this.line, column: startColumn},
		};
	}

	private identifier(): Token {
		const startColumn = this.column;
		let result = '';
		while (this.currentChar && /[a-zA-Z_]/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		const keyword = getKeyword(result)
		if (keyword) {
			return {
				type: keyword,
				lexeme: result,
				position: {line: this.line, column: startColumn},
			};
		}
		return {
			type: Lexeme.IDENTIFIER,
			lexeme: result,
			position: {line: this.line, column: startColumn},
		};
	}

	private string(): Token {
		const startColumn = this.column;
		let result = '';
		this.advance();
		while (this.currentChar && this.currentChar !== '\'' && this.currentChar !== '\n') {
			result += this.currentChar;
			this.advance();
		}
		if (this.currentChar === '\'') {
			this.advance();
			return {
				type: Lexeme.STRING,
				lexeme: result,
				position: {line: this.line, column: startColumn},
			};
		}
		return {
			type: Lexeme.BAD,
			lexeme: result,
			position: {line: this.line, column: startColumn},
		};
	}

	private operatorOrPunctuation(): Token {
		const startColumn = this.column;
		const char = this.currentChar;
		if (char === ':' && this.peek() === '=') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.ASSIGN,
				lexeme: ':=',
				position: {line: this.line, column: startColumn},
			};
		}
		const singleCharOperators = {
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
				position: {line: this.line, column: startColumn},
			};
		}
		if (char === '<' && this.peek() === '>') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.NOT_EQ,
				lexeme: '<>',
				position: {line: this.line, column: startColumn},
			};
		}
		if (char === '<' && this.peek() === '=') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.LESS_EQ,
				lexeme: '<=',
				position: {line: this.line, column: startColumn},
			};
		}
		if (char === '>' && this.peek() === '=') {
			this.advance();
			this.advance();
			return {
				type: Lexeme.GREATER_EQ,
				lexeme: '>=',
				position: {line: this.line, column: startColumn},
			};
		}
		this.advance();
		return {
			type: Lexeme.BAD,
			lexeme: char,
			position: {line: this.line, column: startColumn},
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
			if (/[a-zA-Z_]/.test(this.currentChar)) {
				return this.identifier();
			}
			if (/\d/.test(this.currentChar)) {
				return this.number();
			}
			if (this.currentChar === '\'') {
				return this.string();
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
}

export type {
	Token,
}