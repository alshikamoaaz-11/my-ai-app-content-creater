import { google } from "googleapis";

export type LogRow = {
  timestamp: string;
  username: string;
  category: string;
  partner: string;
  mechanic: string;
  detail: string;
  link: string;
  draft: string;
};

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
  );
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Sheet columns (existing template): A ID | B Category | C Partner/Brand |
 * D Mechanic | E Discount or Detail | F Link | G Status | H Draft | I Feedback.
 * This tool appends Timestamp/Username in J/K and leaves ID/Status/Feedback
 * blank for manual use — it never touches the pre-numbered template rows.
 */
export async function appendLogRow(row: LogRow): Promise<void> {
  if (!isConfigured()) {
    console.warn(
      "[sheets] Google Sheets logging skipped — service account env vars not configured."
    );
    return;
  }

  const tab = process.env.GOOGLE_SHEET_TAB || "Sheet1";

  try {
    const sheets = getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${tab}!A:K`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            "", // ID — left blank, not part of the template's manual numbering
            row.category,
            row.partner,
            row.mechanic,
            row.detail,
            row.link,
            "", // Status — left blank for manual use
            row.draft,
            "", // Feedback — left blank for manual use
            row.timestamp,
            row.username,
          ],
        ],
      },
    });
  } catch (err) {
    console.error("[sheets] Failed to append log row:", err);
  }
}
