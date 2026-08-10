import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBase(): string {
	return (
		process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL ??
		"https://api.vm.tillahealth.com"
	).replace(/\/$/, "");
}

async function proxy(req: NextRequest, pathParts: string[]) {
	let targetPath = `/${pathParts.join("/")}`;
	// Django APPEND_SLASH — keep trailing slash for API paths
	if (!targetPath.endsWith("/")) {
		targetPath = `${targetPath}/`;
	}

	const url = new URL(targetPath, `${upstreamBase()}/`);
	req.nextUrl.searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	const headers = new Headers();
	const accept = req.headers.get("accept");
	const contentType = req.headers.get("content-type");
	const authorization = req.headers.get("authorization");
	if (accept) headers.set("Accept", accept);
	else headers.set("Accept", "application/json");
	if (contentType) headers.set("Content-Type", contentType);
	if (authorization) headers.set("Authorization", authorization);

	const init: RequestInit = {
		method: req.method,
		headers,
		redirect: "follow",
	};

	if (req.method !== "GET" && req.method !== "HEAD") {
		init.body = await req.arrayBuffer();
	}

	let upstream: Response;
	try {
		upstream = await fetch(url.toString(), init);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upstream fetch failed";
		return NextResponse.json(
			{
				status: "error",
				message: `Vendor-core proxy error: ${message}`,
				result: { detail: message, instance: targetPath },
			},
			{ status: 502 }
		);
	}

	const body = await upstream.arrayBuffer();
	const responseHeaders = new Headers();
	const upstreamType = upstream.headers.get("content-type");
	if (upstreamType) responseHeaders.set("Content-Type", upstreamType);

	return new NextResponse(body, {
		status: upstream.status,
		headers: responseHeaders,
	});
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
	const { path } = await ctx.params;
	return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
	const { path } = await ctx.params;
	return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
	const { path } = await ctx.params;
	return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
	const { path } = await ctx.params;
	return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
	const { path } = await ctx.params;
	return proxy(req, path);
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 204 });
}
