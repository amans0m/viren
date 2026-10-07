/**
 * Virender Dass campaign: form backend (Google Apps Script)
 *
 * What it does
 *  - Receives every website form (Your Say, volunteer, lawn sign, invitation, updates)
 *    and saves each one as a row in a Google Sheet.
 *  - Emails the campaign inbox when something new arrives.
 *  - Serves the approved notes back to the website wall as JSON.
 *
 * SETUP (about 10 minutes, use a campaign-owned Google account, not a personal one)
 *  1. Create a new Google Sheet. Name it "Campaign forms".
 *  2. In the Sheet: Extensions > Apps Script. Delete any code, paste this whole file, save.
 *  3. Set NOTIFY_EMAIL below to the campaign inbox.
 *  4. In the editor choose the function "setup" and click Run. Approve the permissions.
 *     This creates one tab per form with the right column headings.
 *  5. Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     Click Deploy and copy the Web app URL.
 *  6. In virenderdass-website.html find CONFIG.ENDPOINT and paste the URL between the quotes.
 *  7. Test: submit a form on the site. A new row should appear in the Sheet within seconds.
 *
 * CURATING THE WALL (no code needed)
 *  - New notes arrive in the "YourSay" tab with status "new".
 *  - Reply to the person, then change status to "replied".
 *  - To show a note on the wall, ALL of these must be true:
 *      consent_publish = yes   (the voter ticked the box)
 *      status = published      (you set this after reading it)
 *    Optionally edit published_text (shorten, fix typos) and published_name (first name only).
 *    The website shows published_text if filled, otherwise the original message.
 *  - To remove a note, change status back to "replied". It disappears from the wall.
 *
 * After changing this code, use Deploy > Manage deployments > Edit > New version, so the live URL updates.
 */

const NOTIFY_EMAIL = "campaign@virenderdass.ca"; // CHANGE ME
const MAX_LEN = 2000;

const TABS = {
  yoursay:   "YourSay",
  volunteer: "Volunteers",
  lawnsign:  "LawnSigns",
  invite:    "Invites",
  updates:   "Updates"
};

// Columns that come from the website form, in order. Extra columns are filled by the team.
const FIELDS = {
  yoursay:   ["submitted_at","ref","topic","message","postal_code","first_name","contact","consent_reply","consent_publish","privacy"],
  volunteer: ["submitted_at","ref","first_name","last_name","mobile","email","postal_code","help","availability","consent_contact","privacy"],
  lawnsign:  ["submitted_at","ref","first_name","last_name","mobile","email","street","city","postal_code","owner_ok","consent_contact","privacy"],
  invite:    ["submitted_at","ref","first_name","organization","email","mobile","event_type","date","location","details","consent_contact","privacy"],
  updates:   ["submitted_at","ref","first_name","email","postal_code","mobile","consent_email","consent_sms","privacy"]
};

// Team-only columns added to the right of the form columns.
const EXTRA = {
  yoursay:   ["status","published_text","published_name","replied_by","replied_at","internal_notes"],
  volunteer: ["status","assigned_to","internal_notes"],
  lawnsign:  ["status","delivered_by","delivered_at","internal_notes"],
  invite:    ["status","owner","internal_notes"],
  updates:   ["status"]
};

/** Run once from the editor. Creates tabs and headings. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (type) {
    let sh = ss.getSheetByName(TABS[type]);
    if (!sh) sh = ss.insertSheet(TABS[type]);
    const headers = FIELDS[type].concat(EXTRA[type]);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  const blank = ss.getSheetByName("Sheet1");
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
}

/** Receives form submissions from the website. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (data.website) return out({ ok: true });                 // honeypot filled: bot, ignore quietly
    const type = String(data.type || "");
    if (!TABS[type]) return out({ ok: false, error: "unknown form" });

    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TABS[type]);
    if (!sh) return out({ ok: false, error: "run setup first" });

    const row = FIELDS[type].map(function (k) { return clean(data[k]); })
      .concat(EXTRA[type].map(function (k) { return k === "status" ? "new" : ""; }));
    sh.appendRow(row);

    notify(type, data);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.release();
  }
}

/** Serves approved notes to the website wall: ...exec?action=notes */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "notes") {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TABS.yoursay);
    if (!sh || sh.getLastRow() < 2) return out({ notes: [] });
    const values = sh.getDataRange().getValues();
    const head = values[0];
    const idx = function (n) { return head.indexOf(n); };
    const notes = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      const published = String(r[idx("status")]).toLowerCase() === "published";
      const ok = String(r[idx("consent_publish")]).toLowerCase() === "yes";
      if (!published || !ok) continue;
      const text = String(r[idx("published_text")] || r[idx("message")] || "").trim();
      if (!text) continue;
      const name = String(r[idx("published_name")] || r[idx("first_name")] || "A neighbour").trim().split(/\s+/)[0];
      notes.push({
        id: String(r[idx("ref")] || ""),
        topic: String(r[idx("topic")] || ""),
        text: text,
        name: name
      });
    }
    notes.reverse();                                            // newest first
    return out({ notes: notes.slice(0, 60) });
  }
  return out({ ok: true });
}

function notify(type, data) {
  try {
    const label = TABS[type];
    const who = data.first_name || data.contact || "someone";
    const body = FIELDS[type].map(function (k) { return k + ": " + clean(data[k]); }).join("\n");
    MailApp.sendEmail(NOTIFY_EMAIL, "New " + label + " submission from " + who, body);
  } catch (err) { /* quota or address problem: the row is still saved */ }
}

/** Trim, cap length, and stop spreadsheet formula injection. */
function clean(v) {
  let s = String(v === undefined || v === null ? "" : v).trim().slice(0, MAX_LEN);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
