import * as fs from 'fs';
import * as path from 'path';
import {Lexeme, Lexer, Token} from './sex'

function getEnumName(value: string): string | undefined {
	for (const key in Lexeme) {
		if (Lexeme[key as keyof typeof Lexeme] === value) {
			return key;
		}
	}

	return undefined
}

function formatTokens(tokens: Token[]): string {
	return tokens
		.map(token => {
			const {type, lexeme, position} = token;

			return `${getEnumName(type)} (${position.line}, ${position.column}) "${lexeme}"`;
		})
		.join('\n');
}


function main() {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.error('Usage: npm run lab6 <input_file> <output_file>');
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1];

	try {
		const inputPath = path.resolve(inputFile);
		const outputPath = path.resolve(outputFile);

		const inputText = fs.readFileSync(inputPath, 'utf8');

		const lexer = new Lexer(inputText);
		const tokens = lexer.tokenize();

		// fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2), 'utf8');
		// console.log(`Tokens written to ${outputPath}`);

		const formattedTokens = formatTokens(tokens);
		fs.writeFileSync(outputFile, formattedTokens, 'utf8');
		console.log(`Formatted tokens written to ${outputFile}`);
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
