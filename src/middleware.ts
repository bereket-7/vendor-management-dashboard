import { type NextRequest, NextResponse } from "next/server";

import createIntlMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { handleAuth, isLocaleRedirect } from "@/middlewares/auth";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
	try {
		const intlResponse = intlMiddleware(request);

		if (isLocaleRedirect(request, intlResponse)) {
			return intlResponse;
		}

		const authResponse = await handleAuth(request);
		if (authResponse) {
			return authResponse;
		}

		return intlResponse;
	} catch (error) {
		if (error instanceof Error) {
			console.error("[middleware]", error.message);
		}
		return NextResponse.json(
			{ error: "Internal middleware error" },
			{ status: 500 }
		);
	}
}

export const config = {
	matcher: [
		"/",
		"/(am|en)/:path*",
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|docs/.*|.*\\..*).*)",
	],
};
