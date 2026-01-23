function doPost(e) {
    // CORS Preflight handles (OPTIONS request is handled by doGet usually, or implicit)
    try {
        var params = JSON.parse(e.postData.contents);
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        // 1. ヘッダーの確認と自動作成
        ensureHeaders(sheet);

        // 2. スプレッドシートに行を追加
        // KPIデータはオブジェクト配列のまま来るのでJSON文字列化して保存
        var kpiJson = params.kpiData ? JSON.stringify(params.kpiData) : "";

        sheet.appendRow([
            new Date(),           // A: Timestamp
            params.diaryDate,     // B: Date
            params.title,         // C: Title
            params.tags,          // D: Tags
            params.content,       // E: Thoughts
            params.calendar,      // F: Calendar
            params.tasks,         // G: ToDo
            params.activity,      // H: Activity
            params.declaration,   // I: Declaration
            params.scores,        // J: Scores
            params.redo,          // K: Redo
            params.confidence,    // L: Confidence
            params.routine,       // M: Routine
            kpiJson               // N: KPI Data (JSON)
        ]);

        return ContentService.createTextOutput(JSON.stringify({ 'success': true }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ 'success': false, 'error': error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function setup() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaders(sheet);
}

function doGet(e) {
    if (!e || !e.parameter) {
        return ContentService.createTextOutput(JSON.stringify({
            'success': true,
            'message': 'GAS is running. Deploy as Web App to use.'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    var action = e.parameter.action;

    if (action == 'getSchedule') {
        return handleGetSchedule(e.parameter.date);
    }

    if (action == 'getAllHabitData') {
        return handleGetAllHabitData();
    }

    return ContentService.createTextOutput(JSON.stringify({ 'success': true, 'message': 'GAS is running' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function handleGetAllHabitData() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ 'success': true, 'data': [] }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Get all data (skip header)
    // Columns A to N (14 cols)
    var range = sheet.getRange(2, 1, lastRow - 1, 14);
    var values = range.getValues();

    // Map columns: 
    // B: Date (Index 1)
    // J: Scores (Index 9)
    // M: Routine (Index 12)

    var logs = values.map(function (row) {
        return {
            date: row[1],      // yyyy-MM-dd string
            scores: row[9],    // JSON string or object
            routine: row[12]   // Text format
        };
    });

    // Filter out empty dates
    logs = logs.filter(function (log) { return log.date && log.date !== ""; });

    return ContentService.createTextOutput(JSON.stringify({ 'success': true, 'data': logs }))
        .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet) {
    var lastCol = sheet.getLastColumn();
    // Safety check up to 14 columns
    var headerRange = sheet.getRange(1, 1, 1, Math.max(lastCol, 14));
    var headers = headerRange.getValues()[0];

    // Check if correct headers exist. Check M(12) and N(13).
    // If headers don't match our new schema, update them.
    if (!headers[0] || headers[13] !== "KPI Data") {
        var newHeaders = [
            "Timestamp",        // A
            "Date",             // B
            "Title",            // C
            "Tags",             // D
            "Diary Content",    // E
            "Calendar",         // F
            "ToDo",             // G
            "Activity",         // H
            "Declaration",      // I
            "Scores",           // J
            "Redo/Improve",     // K
            "Confidence/Good",  // L
            "Routine",          // M
            "KPI Data"          // N (New)
        ];

        // If sheet is empty or headers are wrong, set them. 
        // Note: This overwrites N column header if it was "For NotebookLM"
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);

        sheet.getRange(1, 1, 1, newHeaders.length)
            .setFontWeight("bold")
            .setBackground("#e0e0e0")
            .setBorder(true, true, true, true, true, true);

        sheet.setFrozenRows(1);
    }
}

function formatForNotebookLM(p) {
    let scoreStr = '(記載なし)';
    try {
        if (p.scores) {
            const s = JSON.parse(p.scores);
            scoreStr = `心:${s.heart}, 技:${s.skill}, 体:${s.body}, 生活:${s.life}`;
        }
    } catch (e) { }

    return [
        `# 日記: ${p.title || '無題'} (${p.diaryDate})`,
        `タグ: ${p.tags}`,
        ``,
        `## 朝の宣言 (Goal)`,
        p.declaration || '(なし)',
        ``,
        `## 振り返りスコア`,
        scoreStr,
        ``,
        `## やり直したいこと (Improvement)`,
        p.redo || '(なし)',
        ``,
        `## 自信を育てたこと (Good/Confidence)`,
        p.confidence || '(なし)',
        ``,
        `## 達成したルーティン`,
        p.routine || '(なし)',
        ``,
        `## 自由記述・感想`,
        p.content || '(なし)',
        ``,
        `## カレンダー・予定`,
        p.calendar || '(なし)',
        ``,
        `## To-Do`,
        p.tasks || '(なし)',
        ``,
        `## 今日のアクティビティ履歴`,
        p.activity || '(なし)'
    ].join('\n');
}

// google Calendar APIを使う場合の例 (拡張サービスでGoogle Calendar APIをONにする必要あり)
function handleGetSchedule(dateStr) {
    try {
        var date = dateStr ? new Date(dateStr) : new Date();
        var calendarId = 'primary'; // メインカレンダー

        // 1日の範囲を設定
        var start = new Date(date);
        start.setHours(0, 0, 0, 0);
        var end = new Date(date);
        end.setHours(23, 59, 59, 999);

        var events = CalendarApp.getCalendarById(calendarId).getEvents(start, end);
        var eventList = events.map(function (evt) {
            return (evt.isAllDayEvent() ? '[終日] ' : evt.getStartTime().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + ' ') + evt.getTitle();
        });

        // Google Tasks APIを使う場合は別途設定が必要ですが、
        // ここでは簡易的に空配列またはカレンダーの説明から抽出するなどの実装になります。
        // 今回はカレンダーイベントのみ返します。

        return ContentService.createTextOutput(JSON.stringify({
            'success': true,
            'calendar': eventList,
            'tasks': [] // Tasks API連携が必要ならここに追加
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ 'success': false, 'error': e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
