import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { TextDecoder, TextEncoder } from "util";

if (typeof globalThis.structuredClone === "undefined") {
	globalThis.structuredClone = <T>(value: T): T =>
		JSON.parse(JSON.stringify(value)) as T;
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (typeof globalThis.fetch === "undefined") {
	globalThis.fetch = jest.fn(async () => {
		throw new Error(
			"fetch is not available in this test environment. Set NEXT_PUBLIC_USE_MOCK=true in jest.env.ts or mock the API."
		);
	}) as typeof fetch;
}
