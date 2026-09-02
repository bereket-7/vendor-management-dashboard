import { toast } from "sonner";

import {
	exportMemberDetailCsv,
	exportMemberDetailPdf,
	exportMemberDocumentPdf,
	exportMemberPrintHtml,
} from "@/features/admin/features/members/feature/api/membersApi";
import {
	downloadBlob,
	openBlobInNewTab,
	stampFilename,
} from "@/lib/export/csv";
import { isMembersMockEnabled } from "@/lib/mock-mode";

type DocumentKind = "summary" | "eligibility-letter" | "coverage-card";

const MOCK_DOC_LABEL: Record<DocumentKind, string> = {
	summary: "member summary PDF",
	"eligibility-letter": "eligibility letter",
	"coverage-card": "coverage card",
};

export async function openMemberDocumentPdf(
	memberId: string,
	document: DocumentKind
) {
	if (isMembersMockEnabled()) {
		toast.message(`Opening ${MOCK_DOC_LABEL[document]}…`);
		return;
	}
	try {
		const { blob, filename } = await exportMemberDocumentPdf(
			memberId,
			document
		);
		openBlobInNewTab(blob);
		toast.success(
			filename ? `Opened ${filename}` : "Document opened in a new tab"
		);
	} catch (err) {
		toast.error(err instanceof Error ? err.message : "Could not open document");
	}
}

export async function printMemberProfile(memberId: string) {
	if (isMembersMockEnabled()) {
		toast.success("Print dialog opened");
		return;
	}
	try {
		const { blob } = await exportMemberPrintHtml(memberId);
		const html = await blob.text();
		const win = window.open("", "_blank", "noopener,noreferrer");
		if (!win) {
			toast.error("Pop-up blocked — allow pop-ups to print");
			return;
		}
		win.document.write(html);
		win.document.close();
		win.focus();
		win.print();
		toast.success("Print dialog opened");
	} catch (err) {
		toast.error(err instanceof Error ? err.message : "Print failed");
	}
}

export async function downloadMemberDetailCsv(memberId: string) {
	if (isMembersMockEnabled()) {
		toast.success("Exported CSV");
		return;
	}
	try {
		const { blob, filename } = await exportMemberDetailCsv(memberId);
		downloadBlob(filename ?? stampFilename("member-detail"), blob);
		toast.success("Member CSV exported");
	} catch (err) {
		toast.error(err instanceof Error ? err.message : "CSV export failed");
	}
}

export async function downloadMemberDetailPdf(memberId: string) {
	if (isMembersMockEnabled()) {
		toast.success("Exported PDF");
		return;
	}
	try {
		const { blob, filename } = await exportMemberDetailPdf(memberId, "full");
		downloadBlob(filename ?? stampFilename("member-detail", "pdf"), blob);
		toast.success("Member PDF exported");
	} catch (err) {
		toast.error(err instanceof Error ? err.message : "PDF export failed");
	}
}
