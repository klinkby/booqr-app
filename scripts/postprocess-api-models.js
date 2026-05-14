#!/usr/bin/env node
/**
 * Post-processes generated API files:
 * 1. Converts TypeScript type definitions from generated API models into
 *    JSDoc @typedef comments in the compiled JS model files.
 * 2. Patches core/request.js to use config.FETCH when set, so SvelteKit's
 *    load-provided fetch can be forwarded via OpenAPI.FETCH.
 *
 * Usage: node scripts/postprocess-api-models.js <ts-models-dir> <js-models-dir>
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [tsDir, jsDir] = process.argv.slice(2);

patchRequestFetch(join(dirname(jsDir), 'core', 'request.js'));

for (const file of readdirSync(tsDir).filter((f) => f.endsWith('.ts'))) {
	const tsSource = readFileSync(join(tsDir, file), 'utf-8');
	const jsdoc = convertToJsdoc(tsSource);
	if (!jsdoc) continue;

	const jsFile = join(jsDir, file.replace('.ts', '.js'));
	const jsContent = readFileSync(jsFile, 'utf-8');
	writeFileSync(jsFile, jsdoc + jsContent);
}

function convertToJsdoc(source) {
	const match = source.match(/export type (\w+) = \{([^}]+)\}/s);
	if (!match) return null;

	const [, name, body] = match;
	const lines = ['/**', ` * @typedef {object} ${name}`];

	for (const line of body.split('\n')) {
		const prop = line.trim().match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
		if (!prop) continue;
		const [, propName, optional, tsType] = prop;
		const jsType = convertType(tsType);
		lines.push(optional ? ` * @property {${jsType}} [${propName}]` : ` * @property {${jsType}} ${propName}`);
	}

	lines.push(' */\n');
	return lines.join('\n') + '\n';
}

function convertType(tsType) {
	return tsType
		.replace(/\bArray<(\w+)>/g, '$1[]')
		.replace(/\bnumber\s*\|\s*string/g, 'number | string')
		.trim();
}

function patchRequestFetch(requestJsPath) {
	const original = 'return await fetch(url, request);';
	const patched = 'return await (config.FETCH ?? fetch)(url, request);';
	const content = readFileSync(requestJsPath, 'utf-8');
	if (content.includes(patched)) return; // already applied
	if (!content.includes(original)) throw new Error(`patchRequestFetch: expected pattern not found in ${requestJsPath}`);
	writeFileSync(requestJsPath, content.replace(original, patched));
}
