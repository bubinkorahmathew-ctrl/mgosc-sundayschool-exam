// Google Apps Script for Sunday School Exam cloud sync.
// Paste this whole file into Extensions > Apps Script, Save, then Deploy > Manage deployments > Edit > New version.

var HEADERS = ["ID", "Timestamp", "Class", "Student Name", "Roll No", "Phone", "School Code", "Diocese", "Score", "Total", "Percentage", "Status", "Duration", "Data"];

function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  else sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

var FEEDBACK_HEADERS = ["ID", "Timestamp", "Name", "Class", "Rating", "Message", "Language", "Phone"];

function getFeedbackSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Feedback") || ss.insertSheet("Feedback", ss.getNumSheets());
  if (sheet.getLastRow() === 0) sheet.appendRow(FEEDBACK_HEADERS);
  else sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).setValues([FEEDBACK_HEADERS]);
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Students' devices send each attempt here; the same attempt ID updates its existing row
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.type === "feedback") {
      getFeedbackSheet_().appendRow([d.id, d.timestamp, d.name, d.className, d.rating || "", d.message, d.language, d.phone ? "'" + d.phone : ""]);
      return json_({ status: "ok" });
    }
    var sheet = getSheet_();
    var row = [d.id, d.timestamp, d.className, d.studentName, d.rollNumber, d.studentPhone,
      d.schoolCode, d.diocese, d.score, d.totalQuestions, d.percentage, d.status, d.durationStr,
      JSON.stringify(d)];
    var last = sheet.getLastRow();
    var target = 0;
    if (last > 1) {
      var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(d.id)) { target = i + 2; break; }
      }
    }
    if (target) sheet.getRange(target, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
    return json_({ status: "ok" });
  } finally {
    lock.releaseLock();
  }
}

// The admin portal reads all attempts from here
function doGet(e) {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  var list = [];
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, HEADERS.length).getValues().forEach(function (r) {
      var d = null;
      try { d = r[13] ? JSON.parse(r[13]) : null; } catch (err) {}
      if (!d) {
        d = {
          id: String(r[0]), timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
          className: r[2], studentName: r[3], rollNumber: String(r[4]), studentPhone: String(r[5]),
          schoolCode: String(r[6]), diocese: r[7], score: Number(r[8]), totalQuestions: Number(r[9]),
          percentage: parseFloat(r[10]) || 0, status: r[11], durationStr: r[12]
        };
      }
      list.push(d);
    });
  }
  var fbSheet = getFeedbackSheet_();
  var fbLast = fbSheet.getLastRow();
  var feedback = [];
  if (fbLast > 1) {
    fbSheet.getRange(2, 1, fbLast - 1, FEEDBACK_HEADERS.length).getValues().forEach(function (r) {
      feedback.push({
        id: String(r[0]), timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
        name: String(r[2]), className: String(r[3]), rating: Number(r[4]) || 0,
        message: String(r[5]), language: String(r[6]), phone: String(r[7] || "")
      });
    });
  }
  return json_({ status: "ok", attempts: list, feedback: feedback });
}
