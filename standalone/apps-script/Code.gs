// Kids Task App — Google Apps Script backend
// Deploy as a Web App (Execute as: Me, Who has access: Anyone)
// then paste the /exec URL into kids-tasks/index.html (APPS_SCRIPT_URL).
//
// Run setup() once from the Apps Script editor to create the sheet tabs.

var SHEET_KIDS = 'Kids';
var SHEET_TASKS = 'Tasks';
var SHEET_DONE = 'Completions';
var SHEET_CONFIG = 'Config';

// ---------- Entry points ----------

function doGet(e) {
  return handle(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return handle(body);
}

function handle(req) {
  var out;
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      out = route(req);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function route(req) {
  switch (req.action) {
    case 'state':        return getState();
    case 'login':        return login(req);
    case 'parentLogin':  return parentLogin(req);
    case 'addTask':      return addTask(req);
    case 'deleteTask':   return deleteTask(req);
    case 'completeTask': return completeTask(req);
    case 'uncomplete':   return uncomplete(req);
    case 'addExtra':     return addExtra(req);
    case 'approve':      return approve(req);
    case 'reject':       return reject(req);
    case 'addKid':       return addKid(req);
    default:             return { ok: false, error: 'Unknown action' };
  }
}

// ---------- One-time setup ----------

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  makeSheet(ss, SHEET_KIDS, ['id', 'name', 'emoji', 'pin']);
  makeSheet(ss, SHEET_TASKS, ['id', 'kidId', 'title', 'points', 'cycle', 'createdAt', 'active']);
  makeSheet(ss, SHEET_DONE, ['id', 'taskId', 'kidId', 'title', 'points', 'date', 'status', 'createdAt']);
  var cfg = makeSheet(ss, SHEET_CONFIG, ['key', 'value']);
  if (cfg.getLastRow() < 2) {
    cfg.appendRow(['parentPin', '1234']);
  }
}

function makeSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

// ---------- Helpers ----------

function sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function rows(name) {
  var sh = sheet(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  return data.map(function (r) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = r[i]; });
    return obj;
  });
}

function newId() {
  return Utilities.getUuid().slice(0, 8);
}

function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getConfig(key) {
  var all = rows(SHEET_CONFIG);
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].key) === key) return String(all[i].value);
  }
  return '';
}

function checkParent(req) {
  var pin = getConfig('parentPin');
  if (!pin || String(req.parentPin) !== pin) throw 'Wrong parent PIN';
}

function findRow(name, id) {
  var sh = sheet(name);
  var ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// ---------- Actions ----------

function getState() {
  var kids = rows(SHEET_KIDS).map(function (k) {
    return { id: String(k.id), name: String(k.name), emoji: String(k.emoji), hasPin: String(k.pin) !== '' };
  });
  var tasks = rows(SHEET_TASKS).filter(function (t) {
    return String(t.active) !== 'false' && String(t.active) !== 'FALSE';
  }).map(function (t) {
    return {
      id: String(t.id), kidId: String(t.kidId), title: String(t.title),
      points: Number(t.points) || 0, cycle: String(t.cycle),
      createdAt: String(t.createdAt)
    };
  });
  var done = rows(SHEET_DONE).map(function (d) {
    return {
      id: String(d.id), taskId: String(d.taskId), kidId: String(d.kidId),
      title: String(d.title), points: Number(d.points) || 0,
      date: normDate(d.date), status: String(d.status), createdAt: String(d.createdAt)
    };
  });

  // Points = sum of approved completions; streak = consecutive days with >=1 approved/pending completion
  var stats = {};
  kids.forEach(function (k) {
    var mine = done.filter(function (d) { return d.kidId === k.id; });
    var points = mine.filter(function (d) { return d.status === 'approved'; })
      .reduce(function (s, d) { return s + d.points; }, 0);
    stats[k.id] = { points: points, streak: calcStreak(mine) };
  });

  return { ok: true, kids: kids, tasks: tasks, completions: done, stats: stats, today: todayStr() };
}

function normDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v);
}

function calcStreak(completions) {
  var days = {};
  completions.forEach(function (d) {
    if (d.status === 'approved' || d.status === 'pending') days[d.date] = true;
  });
  var streak = 0;
  var cursor = new Date();
  // Today doesn't break the streak if nothing is done yet
  if (!days[fmt(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (days[fmt(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function fmt(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function login(req) {
  var kids = rows(SHEET_KIDS);
  for (var i = 0; i < kids.length; i++) {
    if (String(kids[i].id) === String(req.kidId)) {
      var pin = String(kids[i].pin);
      if (pin === '' || pin === String(req.pin)) return { ok: true };
      return { ok: false, error: 'Wrong PIN' };
    }
  }
  return { ok: false, error: 'Kid not found' };
}

function parentLogin(req) {
  checkParent(req);
  return { ok: true };
}

function addTask(req) {
  checkParent(req);
  sheet(SHEET_TASKS).appendRow([
    newId(), String(req.kidId), String(req.title),
    Number(req.points) || 5, String(req.cycle || 'daily'),
    todayStr(), 'true'
  ]);
  return getState();
}

function deleteTask(req) {
  checkParent(req);
  var row = findRow(SHEET_TASKS, req.taskId);
  if (row > 0) {
    var sh = sheet(SHEET_TASKS);
    sh.getRange(row, 7).setValue('false'); // active column
  }
  return getState();
}

function completeTask(req) {
  var tasks = rows(SHEET_TASKS);
  var task = null;
  tasks.forEach(function (t) { if (String(t.id) === String(req.taskId)) task = t; });
  if (!task) return { ok: false, error: 'Task not found' };
  sheet(SHEET_DONE).appendRow([
    newId(), String(task.id), String(task.kidId), String(task.title),
    Number(task.points) || 0, todayStr(), 'pending', new Date().toISOString()
  ]);
  return getState();
}

function uncomplete(req) {
  // Kid changed their mind before approval — remove the pending completion
  var row = findRow(SHEET_DONE, req.completionId);
  if (row > 0) {
    var sh = sheet(SHEET_DONE);
    var status = String(sh.getRange(row, 7).getValue());
    if (status === 'pending') sh.deleteRow(row);
  }
  return getState();
}

function addExtra(req) {
  sheet(SHEET_DONE).appendRow([
    newId(), '', String(req.kidId), String(req.title),
    0, todayStr(), 'pending', new Date().toISOString()
  ]);
  return getState();
}

function approve(req) {
  checkParent(req);
  var row = findRow(SHEET_DONE, req.completionId);
  if (row > 0) {
    var sh = sheet(SHEET_DONE);
    if (req.points !== undefined && req.points !== null && req.points !== '') {
      sh.getRange(row, 5).setValue(Number(req.points));
    }
    sh.getRange(row, 7).setValue('approved');
  }
  return getState();
}

function reject(req) {
  checkParent(req);
  var row = findRow(SHEET_DONE, req.completionId);
  if (row > 0) sheet(SHEET_DONE).getRange(row, 7).setValue('rejected');
  return getState();
}

function addKid(req) {
  checkParent(req);
  sheet(SHEET_KIDS).appendRow([
    newId(), String(req.name), String(req.emoji || '🙂'), String(req.pin || '')
  ]);
  return getState();
}
