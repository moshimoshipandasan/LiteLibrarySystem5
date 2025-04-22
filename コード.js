/**
 * WebアプリケーションとしてアクセスされたときにHTMLを表示する関数
 * @param {Object} e - イベントオブジェクト
 * @return {HtmlOutput} HTMLサービスのアウトプット
 */
function doGet(e) {
  let page = 'lending'; // デフォルトは貸出ページ
  let title = '図書貸出システム';
  
  if (e && e.parameter && e.parameter.page) {
    // URLパラメータに基づいてページを切り替え
    switch (e.parameter.page) {
      case 'return':
        page = 'returning';
        title = '図書返却システム';
        break;
      case 'finder':
        page = 'rental_books_finder';
        title = '貸出書籍検索システム';
        break;
      case 'user_returns':
        page = 'user_returns';
        title = '利用者別返却システム';
        break;
      case 'register':
        page = 'book_register';
        title = '書籍登録システム';
        break;
      default:
        // デフォルトは貸出ページのまま
        break;
    }
  }

  const htmlOutput = HtmlService.createHtmlOutputFromFile(page)
      .setTitle(title)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // QuaggaJSなどの外部ライブラリ読み込み許可
  return htmlOutput;
}

/**
 * 書籍IDからスプレッドシートの書籍DBを検索して書籍情報を取得する関数
 * @param {string} bookId - 書籍ID
 * @return {object|null} 書籍情報オブジェクト {title: string} または null
 */
function getBookDetails(bookId) {
  if (!bookId) {
    console.error("書籍IDが指定されていません。");
    return null;
  }
  console.log(`書籍情報検索開始: 書籍ID=${bookId}`);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookSheet = ss.getSheetByName("書籍DB"); // "書籍DB"シートを指定
    if (!bookSheet) {
      console.error("シート「書籍DB」が見つかりません。");
      throw new Error("書籍DBシートが見つかりません。");
    }

    const data = bookSheet.getDataRange().getValues();
    // ヘッダー: A:書籍ID, B:書籍名, ...
    const bookIdColIndex = 0; // A列
    const titleColIndex = 1;  // B列

    // ヘッダー行を除く (1行目から検索)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 書籍IDが一致するか確認
      if (row[bookIdColIndex] && row[bookIdColIndex].toString().trim() === bookId.trim()) {
        const bookTitle = row[titleColIndex] || "タイトル不明";
        console.log(`書籍情報取得成功: ${bookTitle}`);
        return { title: bookTitle };
      }
    }
    console.warn(`書籍ID ${bookId} の情報が見つかりませんでした。`);
    return null; // 見つからなかった場合
  } catch (error) {
    console.error(`書籍情報の取得中にエラーが発生しました: ${error}`);
    console.error(error);
    throw new Error(`書籍情報の取得に失敗しました: ${error.message}`);
  }
}


/**
 * 利用者IDからスプレッドシートの利用者DBを検索して利用者情報を取得する関数
 * @param {string} userId - 利用者ID
 * @return {object|null} 利用者情報オブジェクト {name: string, email: string|null} または null
 */
function getUserInfo(userId) {
  if (!userId) {
    console.error("利用者IDが指定されていません。");
    return null;
  }
   console.log(`利用者情報検索開始: UserID=${userId}`);
   try {
     const ss = SpreadsheetApp.getActiveSpreadsheet();
     const userSheet = ss.getSheetByName("利用者DB"); // "利用者DB"シートを指定
     if (!userSheet) {
       console.error("シート「利用者DB」が見つかりません。");
       throw new Error("利用者DBシートが見つかりません。"); // エラーをスローしてクライアントに伝える
     }

     const data = userSheet.getDataRange().getValues();
    // ヘッダー: A:利用者ID, B:氏名, C:メールアドレス
    const userIdColIndex = 0; // A列
    const nameColIndex = 1;   // B列
    const emailColIndex = 2;  // C列

    // ヘッダー行を除く (1行目から検索)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 利用者IDが一致するか確認
      if (row[userIdColIndex] && row[userIdColIndex].toString().trim() === userId.trim()) {
        const userName = row[nameColIndex] || "氏名不明";
        const userEmail = row[emailColIndex] || null; // メールアドレスがない場合はnull
        console.log(`利用者情報取得成功: ${userName}, Email: ${userEmail}`);
        return { name: userName, email: userEmail };
      }
    }
    console.warn(`利用者ID ${userId} の情報が見つかりませんでした。`);
    return null; // 見つからなかった場合
  } catch (error) {
    console.error(`利用者情報の取得中にエラーが発生しました: ${error}`);
    console.error(error); // スタックトレースも出力
    // クライアントにエラーを伝える
    throw new Error(`利用者情報の取得に失敗しました: ${error.message}`);
  }
}


/**
 * HTMLフォームから送信された貸出情報をスプレッドシートに記録する関数
 * @param {object} formData - フォームデータ {bookId: string, bookTitle: string, userId: string, userName: string}
 * @return {string} 処理結果メッセージ
 */
function processLendingForm(formData) {
  console.log("貸出フォームデータ受信:", formData);
  try {
    // 入力チェック
    if (!formData.bookId || !formData.bookTitle || !formData.userId || !formData.userName) {
       throw new Error("必要な情報（書籍ID, 書籍名, 利用者ID, 利用者名）が不足しています。");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録"); // "貸出記録"シートを指定
     if (!lendingSheet) {
      console.error("シート「貸出記録」が見つかりません。");
      throw new Error("貸出記録シートが見つかりません。");
    }

    const lendingDate = new Date(); // 現在日時を貸出日時とする

    // スプレッドシートに追記するデータ配列
    // ヘッダー: 書籍ID, 書籍名, 利用者ID, 利用者名, 貸出日時, 返却予定日, 返却状況
    const dueDate = new Date(lendingDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 貸出日から2週間後
    const returnStatus = "未返却"; // 初期状態

    const newRow = [
      formData.bookId, // Changed from isbn
      formData.bookTitle,
      formData.userId,
      formData.userName,
      lendingDate,
      dueDate,
      returnStatus
    ];

    lendingSheet.appendRow(newRow);
    console.log("貸出記録を追加しました:", newRow);

    return `貸出登録成功: ${formData.bookTitle} を ${formData.userName} さんに貸し出しました。`;

  } catch (error) {
    console.error(`貸出情報の記録中にエラーが発生しました: ${error}`);
    console.error(error); // スタックトレースも出力
    // クライアントにエラーメッセージを返す
    return `登録失敗: ${error.message}`;
  }
}


/**
 * 指定された書籍IDの未返却の貸出記録を取得する関数
 * @param {string} bookId - 検索する書籍ID
 * @return {object} 貸出情報とログ情報を含むオブジェクト
 */
function getLendingInfo(bookId) { // Changed parameter name
  // ログを収集するための配列
  const logs = [];
  
  if (!bookId) {
    logs.push("書籍IDが指定されていません。");
    return { lendingInfo: null, logs: logs };
  }
  
  logs.push(`未返却の貸出情報検索開始: 書籍ID=${bookId}`);
  console.log(`未返却の貸出情報検索開始: 書籍ID=${bookId}`);
  Logger.log(`デバッグ\t未返却の貸出情報検索開始: 書籍ID=${bookId}`);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    if (!lendingSheet) {
      const errorMsg = "シート「貸出記録」が見つかりません。";
      logs.push(errorMsg);
      console.error(errorMsg);
      throw new Error("貸出記録シートが見つかりません。");
    }

    const data = lendingSheet.getDataRange().getValues();
    // ヘッダー: A:書籍ID, B:書籍名, C:利用者ID, D:利用者名, E:貸出日時, F:返却予定日, G:返却状況, H:返却日時
    const bookIdColIndex = 0;     // A列 (Changed from isbnColIndex)
    const titleColIndex = 1;      // B列
    const userNameColIndex = 3;   // D列
    const lendingDateColIndex = 4;// E列
    const statusColIndex = 6;     // G列

    logs.push(`検索開始: 貸出記録シートの行数=${data.length}`);
    
    // 上から順に検索して、該当書籍IDの「未返却」レコードを見つける
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // デバッグ: 各行の書籍IDと状態を出力
      const rowBookId = row[bookIdColIndex] ? row[bookIdColIndex].toString().trim() : "空";
      const rowStatus = row[statusColIndex] || "空";
      const logMsg = `行 ${i + 1} 検証中: シートの書籍ID=[${rowBookId}], 検索対象の書籍ID=[${bookId.trim()}], 返却状況=[${rowStatus}]`;
      logs.push(logMsg);
      console.log(logMsg);
      Logger.log(`デバッグ\t${logMsg}`);
      
      // 詳細なデバッグ情報を追加
      const rowBookIdLower = rowBookId.toLowerCase();
      const bookIdLower = bookId.trim().toLowerCase();
      const isIdMatch = rowBookIdLower === bookIdLower;
      const isStatusMatch = rowStatus === "未返却";
      
      // より詳細なデバッグ情報
      Logger.log(`デバッグ\t行 ${i + 1} 詳細比較: ID一致=${isIdMatch}(${rowBookIdLower}=${bookIdLower}), 状態一致=${isStatusMatch}, 状態の実際の値=[${rowStatus}]`);
      
      // 大文字小文字を区別せずに比較し、状態が「未返却」かどうかを厳密に確認
      if (rowBookId && isIdMatch && isStatusMatch) {
        const lendingDate = row[lendingDateColIndex];
        const lendingInfo = {
          bookTitle: row[titleColIndex] || "",
          userName: row[userNameColIndex] || "",
          // Dateオブジェクトが存在し、有効な日付であればISO文字列に変換
          lendingDate: (lendingDate instanceof Date && !isNaN(lendingDate)) ? lendingDate.toISOString() : null
        };
        const foundMsg = `未返却の貸出情報発見 (行 ${i + 1}): ${lendingInfo.bookTitle}, ${lendingInfo.userName}`;
        logs.push(foundMsg);
        console.log(foundMsg);
        Logger.log(`デバッグ\t${foundMsg}`);
        return { lendingInfo: lendingInfo, logs: logs };
      }
    }

    const notFoundMsg = `書籍ID ${bookId} の未返却の貸出記録が見つかりませんでした。`;
    logs.push(notFoundMsg);
    console.warn(notFoundMsg);
    return { lendingInfo: null, logs: logs }; // 見つからなかった場合
  } catch (error) {
    const errorMsg = `貸出情報の取得中にエラーが発生しました: ${error}`;
    logs.push(errorMsg);
    console.error(errorMsg);
    console.error(error);
    throw new Error(`貸出情報の取得に失敗しました: ${error.message}`);
  }
}


/**
 * 返却処理を実行し、貸出記録シートを更新する関数
 * @param {string} bookId - 返却する本の書籍ID
 * @return {object} 処理結果メッセージとログ情報を含むオブジェクト
 */
function processReturnForm(bookId) { // Changed parameter name
  // ログを収集するための配列
  const logs = [];
  
  if (!bookId) {
    return { 
      message: "返却処理失敗: 書籍IDが指定されていません。", 
      logs: ["書籍IDが指定されていません。"] 
    };
  }
  
  const startMsg = `返却処理開始: 書籍ID=${bookId}`;
  logs.push(startMsg);
  console.log(startMsg);
  Logger.log(`デバッグ\t${startMsg}`);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    if (!lendingSheet) {
      const errorMsg = "シート「貸出記録」が見つかりません。";
      logs.push(errorMsg);
      console.error(errorMsg);
      throw new Error("貸出記録シートが見つかりません。");
    }

    const data = lendingSheet.getDataRange().getValues();
    // ヘッダー: A:書籍ID, B:書籍名, C:利用者ID, D:利用者名, E:貸出日時, F:返却予定日, G:返却状況, H:返却日時
    const bookIdColIndex = 0;     // A列 (Changed from isbnColIndex)
    const statusColIndex = 6;     // G列 (0から数えて6番目)
    const returnDateColIndex = 7; // H列 (0から数えて7番目)

    logs.push(`検索開始: 貸出記録シートの行数=${data.length}`);
    
    let recordFound = false;
    // 上から順に検索して、該当書籍IDの「未返却」レコードを見つける
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // デバッグ: 各行の書籍IDと状態を出力
      const rowBookId = row[bookIdColIndex] ? row[bookIdColIndex].toString().trim() : "空";
      const rowStatus = row[statusColIndex] || "空";
      const logMsg = `行 ${i + 1} 検証中: シートの書籍ID=[${rowBookId}], 検索対象の書籍ID=[${bookId.trim()}], 返却状況=[${rowStatus}]`;
      logs.push(logMsg);
      console.log(logMsg);
      Logger.log(`デバッグ\t${logMsg}`);
      
      // 詳細なデバッグ情報を追加
      const rowBookIdLower = rowBookId.toLowerCase();
      const bookIdLower = bookId.trim().toLowerCase();
      const isIdMatch = rowBookIdLower === bookIdLower;
      const isStatusMatch = rowStatus === "未返却";
      
      // より詳細なデバッグ情報
      Logger.log(`デバッグ\t行 ${i + 1} 詳細比較: ID一致=${isIdMatch}(${rowBookIdLower}=${bookIdLower}), 状態一致=${isStatusMatch}, 状態の実際の値=[${rowStatus}]`);
      
      // 大文字小文字を区別せずに比較し、状態が「未返却」かどうかを厳密に確認
      if (rowBookId && isIdMatch && isStatusMatch) {

        // 返却処理の詳細をログに記録
        const bookTitle = data[i][1]; // 書籍名を取得 (B列)
        const userName = data[i][3]; // 利用者名を取得 (D列)
        const lendingDate = data[i][4]; // 貸出日時を取得 (E列)
        const dueDate = data[i][5]; // 返却予定日を取得 (F列)
        
        const lendingDateStr = lendingDate ? Utilities.formatDate(lendingDate, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss") : "不明";
        const dueDateStr = dueDate ? Utilities.formatDate(dueDate, Session.getScriptTimeZone(), "yyyy/MM/dd") : "不明";
        const currentDate = new Date();
        
        Logger.log(`デバッグ\t返却処理詳細情報: 書籍ID=${bookId}, 書籍名=${bookTitle}, 利用者名=${userName}, 貸出日=${lendingDateStr}, 返却予定日=${dueDateStr}`);
        
        // 返却状況を "返却済" に更新 (G列 = statusColIndex + 1)
        Logger.log(`デバッグ\t返却状況を更新: "未返却" → "返却済" (行 ${i + 1}, 列 ${statusColIndex + 1})`);
        lendingSheet.getRange(i + 1, statusColIndex + 1).setValue("返却済");
        
        // 返却日時を記録 (H列 = returnDateColIndex + 1)
        const returnDateStr = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
        Logger.log(`デバッグ\t返却日時を記録: ${returnDateStr} (行 ${i + 1}, 列 ${returnDateColIndex + 1})`);
        lendingSheet.getRange(i + 1, returnDateColIndex + 1).setValue(currentDate);

        // 返却期限との比較
        if (dueDate && currentDate > dueDate) {
          const daysDiff = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
          Logger.log(`デバッグ\t返却期限超過: ${daysDiff}日の延滞`);
        } else {
          Logger.log(`デバッグ\t返却期限内に返却されました`);
        }

        const successMsg = `書籍ID ${bookId} (書籍名: ${bookTitle}) の返却処理完了 (行 ${i + 1})`;
        logs.push(successMsg);
        console.log(successMsg);
        Logger.log(`デバッグ\t${successMsg}`);
        recordFound = true;
        return { 
          message: `返却処理成功: ${bookTitle} を返却しました。`,
          logs: logs
        };
      }
    }

    if (!recordFound) {
      // 未返却の貸出記録が見つからなかった場合、追加の診断情報を提供
      Logger.log(`デバッグ\t未返却の貸出記録が見つかりませんでした。追加診断を実行します。`);
      
      // 該当書籍IDの貸出記録が存在するか確認（返却済みも含む）
      let anyRecordFound = false;
      let returnedRecords = 0;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowBookId = row[bookIdColIndex] ? row[bookIdColIndex].toString().trim().toLowerCase() : "";
        const bookIdLower = bookId.trim().toLowerCase();
        
        if (rowBookId === bookIdLower) {
          anyRecordFound = true;
          const rowStatus = row[statusColIndex] || "";
          if (rowStatus === "返却済") {
            returnedRecords++;
            const returnDate = row[returnDateColIndex];
            const returnDateStr = returnDate ? Utilities.formatDate(returnDate, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss") : "不明";
            Logger.log(`デバッグ\t既に返却済みの記録があります: 行 ${i + 1}, 返却日時=${returnDateStr}`);
          }
        }
      }
      
      if (anyRecordFound) {
        if (returnedRecords > 0) {
          Logger.log(`デバッグ\t書籍ID ${bookId} は既に返却済みです (${returnedRecords}件の返却済み記録があります)`);
        } else {
          Logger.log(`デバッグ\t書籍ID ${bookId} の貸出記録はありますが、返却状況が「未返却」ではありません`);
        }
      } else {
        Logger.log(`デバッグ\t書籍ID ${bookId} の貸出記録が見つかりません。書籍IDの入力ミスの可能性があります`);
      }
      
      const notFoundMsg = `書籍ID ${bookId} の未返却の貸出記録が見つかりませんでした。`;
      logs.push(notFoundMsg);
      console.warn(notFoundMsg);
      return { 
        message: `返却処理失敗: この本の未返却の貸出記録が見つかりませんでした。書籍IDを確認してください。`,
        logs: logs
      };
    }

  } catch (error) {
    const errorMsg = `返却処理中にエラーが発生しました: ${error}`;
    logs.push(errorMsg);
    console.error(errorMsg);
    console.error(error);
    return { 
      message: `返却処理失敗: ${error.message}`,
      logs: logs
    };
  }
}


/**
 * 返却期限を過ぎた未返却の本のリマインドメールを送信する関数
 * GASのトリガー（時間主導型、例: 毎日午前1時〜2時）で実行することを想定
 */
 function sendOverdueReminders() {
   console.log("延滞リマインダー処理開始");
   const ss = SpreadsheetApp.getActiveSpreadsheet();
   const lendingSheet = ss.getSheetByName("貸出記録");
   const userSheet = ss.getSheetByName("利用者DB"); // getUserInfo内で使用 & 存在チェック

   if (!lendingSheet || !userSheet) {
     console.error("必要なシート（貸出記録または利用者DB）が見つかりません。処理を中断します。");
     return;
   }

  const data = lendingSheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻部分をリセットして日付のみで比較

  // ヘッダー: A:書籍ID, B:書籍名, C:利用者ID, D:利用者名, E:貸出日時, F:返却予定日, G:返却状況
  const bookIdColIndex = 0;     // A列 (Changed from isbnColIndex)
  const titleColIndex = 1;      // B列
  const userIdColIndex = 2;     // C列
  const dueDateColIndex = 5;    // F列
  const statusColIndex = 6;     // G列

  let remindersSentCount = 0;
  const errors = [];

  // ヘッダー行を除く (i=1から)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[statusColIndex];
    const dueDateValue = row[dueDateColIndex];

    // 返却状況が "未返却" かどうかチェック
    if (status === "未返却") {
      // 返却予定日が有効な日付オブジェクトかチェック
      if (dueDateValue instanceof Date && !isNaN(dueDateValue)) {
        const dueDate = new Date(dueDateValue);
        dueDate.setHours(0, 0, 0, 0); // 時刻部分をリセット

        // 返却予定日が今日より前（つまり延滞している）かチェック
        if (dueDate < today) {
          const userId = row[userIdColIndex];
          const bookTitle = row[titleColIndex]; // 書籍名は貸出記録シートのB列から取得
          const bookId = row[bookIdColIndex]; // 書籍IDも取得しておく (ログ用など)
          const dueDateString = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), "yyyy/MM/dd");

          console.log(`延滞発見: 行 ${i + 1}, 書籍ID: ${bookId}, 利用者ID: ${userId}, 書籍名: ${bookTitle}, 返却予定日: ${dueDateString}`); // Updated log

          try {
            // 利用者情報を取得（メールアドレスを含む）
            const userInfo = getUserInfo(userId);

            if (userInfo && userInfo.email) {
              const recipient = userInfo.email;
              const subject = `【図書館】書籍返却のお願い: ${bookTitle}`;
              const body = `${userInfo.name} 様\n\n`
                         + `いつも図書館をご利用いただきありがとうございます。\n\n`
                         + `貸出中の書籍『${bookTitle}』の返却期限（${dueDateString}）が過ぎています。\n`
                         + `ご確認の上、速やかにご返却いただけますようお願いいたします。\n\n`
                         + `ご不明な点がございましたら、図書館カウンターまでお問い合わせください。\n\n`
                         + `--\n図書貸出システム`;

              // メールの送信量を確認 (クォータ対策)
              if (MailApp.getRemainingDailyQuota() > 0) {
                MailApp.sendEmail(recipient, subject, body);
                console.log(`リマインドメール送信成功: ${recipient}, 書籍: ${bookTitle}`);
                remindersSentCount++;
              } else {
                 const quotaErrorMsg = "メール送信クォータ上限に達したため、これ以上のメール送信を停止しました。";
                 console.error(quotaErrorMsg);
                 errors.push(quotaErrorMsg);
                 break; // クォータ超過したらループを抜ける
              }
            } else {
              const noEmailMsg = `利用者ID ${userId} のメールアドレスが見つからないため、メールを送信できませんでした。`;
              console.warn(noEmailMsg);
              errors.push(noEmailMsg);
            }
          } catch (e) {
             const sendErrorMsg = `行 ${i + 1} (利用者ID: ${userId}) のメール送信中にエラーが発生しました: ${e.message}`;
             console.error(sendErrorMsg);
             console.error(e);
             errors.push(sendErrorMsg);
          }
           // 短時間に大量の処理を避けるための待機（任意）
           // Utilities.sleep(500); // 0.5秒待機
        }
      } else {
         // 返却予定日のデータが不正な場合（日付でないなど）
         if (dueDateValue !== "") { // 空欄でない場合のみ警告
            console.warn(`行 ${i + 1} の返却予定日 (${dueDateValue}) が不正な形式です。スキップします。`);
         }
      }
    }
  }

  console.log(`延滞リマインダー処理完了。送信数: ${remindersSentCount}`);
  if (errors.length > 0) {
      console.warn("処理中に以下の警告/エラーが発生しました:");
      errors.forEach(err => console.warn(`- ${err}`));
      // 必要であれば管理者にエラーレポートをメールするなどの処理を追加
  }
}



/**
 * 指定された書籍IDの貸出記録を検索する関数
 * @param {string} bookId - 検索する書籍ID
 * @return {object} 貸出記録とログ情報を含むオブジェクト
 */
function findRentalRecords(bookId) {
  // ログを収集するための配列
  const logs = [];
  
  if (!bookId) {
    logs.push("書籍IDが指定されていません。");
    return { records: [], logs: logs };
  }
  
  logs.push(`貸出記録検索開始: 書籍ID=${bookId}`);
  console.log(`貸出記録検索開始: 書籍ID=${bookId}`);
  Logger.log(`デバッグ\t貸出記録検索開始: 書籍ID=${bookId}`);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    if (!lendingSheet) {
      const errorMsg = "シート「貸出記録」が見つかりません。";
      logs.push(errorMsg);
      console.error(errorMsg);
      throw new Error("貸出記録シートが見つかりません。");
    }

    const data = lendingSheet.getDataRange().getValues();
    // ヘッダー: A:書籍ID, B:書籍名, C:利用者ID, D:利用者名, E:貸出日時, F:返却予定日, G:返却状況, H:返却日時
    const bookIdColIndex = 0;     // A列
    const titleColIndex = 1;      // B列
    const userIdColIndex = 2;     // C列
    const userNameColIndex = 3;   // D列
    const lendingDateColIndex = 4;// E列
    const dueDateColIndex = 5;    // F列
    const statusColIndex = 6;     // G列

    logs.push(`検索開始: 貸出記録シートの行数=${data.length}`);
    
    // 検索結果を格納する配列
    const records = [];
    
    // ヘッダー行を除く (1行目から検索)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowBookId = row[bookIdColIndex] ? row[bookIdColIndex].toString().trim() : "";
      
      // デバッグ用にログ出力
      logs.push(`行 ${i + 1} 検証中: シートの書籍ID=[${rowBookId}], 検索対象の書籍ID=[${bookId.trim()}]`);
      Logger.log(`デバッグ\t行 ${i + 1} 検証中: シートの書籍ID=[${rowBookId}], 検索対象の書籍ID=[${bookId.trim()}]`);
      
      // 書籍IDが一致する行を探す
      // 詳細なデバッグ情報を追加
      const rowBookIdLower = rowBookId.toLowerCase();
      const bookIdLower = bookId.trim().toLowerCase();
      const isIdMatch = rowBookIdLower === bookIdLower;
      Logger.log(`デバッグ\t行 ${i + 1} 詳細比較: ID一致=${isIdMatch}(${rowBookIdLower}=${bookIdLower})`);
      
      // 大文字小文字を区別せずに比較
      if (rowBookId && isIdMatch) {
        // 貸出記録情報を作成 (DateオブジェクトをISO文字列に変換)
        const lendingDate = row[lendingDateColIndex];
        const dueDate = row[dueDateColIndex];
        
        const record = {
          bookId: rowBookId,
          bookTitle: row[titleColIndex] || "",
          userId: row[userIdColIndex] || "",
          userName: row[userNameColIndex] || "",
          // Dateオブジェクトが存在し、有効な日付であればISO文字列に変換
          lendingDate: (lendingDate instanceof Date && !isNaN(lendingDate)) ? lendingDate.toISOString() : null,
          dueDate: (dueDate instanceof Date && !isNaN(dueDate)) ? dueDate.toISOString() : null,
          status: row[statusColIndex] || ""
        };
        
        records.push(record);
        logs.push(`貸出記録発見 (行 ${i + 1}): ${record.bookTitle}, ${record.userName}, 状態=${record.status}`);
        Logger.log(`デバッグ\t貸出記録発見 (行 ${i + 1}): ${record.bookTitle}, ${record.userName}, 状態=${record.status}`);
        
        // デバッグ: 追加したレコードの詳細をログに出力
        Logger.log(`デバッグ\t追加したレコード詳細: ${JSON.stringify(record)}`);
      }
    }

    if (records.length > 0) {
      logs.push(`書籍ID ${bookId} の貸出記録が ${records.length} 件見つかりました。`);
      Logger.log(`デバッグ\t検索結果: ${records.length}件の記録が見つかりました。records配列=${JSON.stringify(records)}`);
    } else {
      logs.push(`書籍ID ${bookId} の貸出記録が見つかりませんでした。`);
      Logger.log(`デバッグ\t検索結果: 記録が見つかりませんでした。records配列は空です。`);
    }
    
    // 返却する直前のデータ構造を詳細にログ出力
    const finalResult = { records: records, logs: logs };
    try {
      Logger.log(`デバッグ\t返却直前のデータ(JSON): ${JSON.stringify(finalResult)}`);
    } catch (e) {
      Logger.log(`デバッグ\t返却データのJSON変換エラー: ${e}`);
      // records内のDateオブジェクトなどが原因の可能性があるため、簡易的なログに切り替え
      Logger.log(`デバッグ\t返却データ構造 (簡易): { records: [${records.length}件], logs: [${logs.length}件] }`);
    }
    
    // 重要: 検索結果が見つからない場合でも、ログに「貸出記録発見」が含まれていれば、
    // 何らかの理由でrecords配列に追加されなかった可能性があるため、
    // 強制的にダミーレコードを作成して返す
    if (records.length === 0) {
      for (const log of logs) {
        if (log.includes("貸出記録発見")) {
          // ログから情報を抽出
          const match = log.match(/貸出記録発見 \(行 \d+\): (.*), (.*), 状態=(.*)/);
          if (match) {
            const bookTitle = match[1];
            const userName = match[2];
            const status = match[3];
            
            // ダミーレコードを作成 (DateオブジェクトをISO文字列に変換)
            const now = new Date();
            const dummyDueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            
            const dummyRecord = {
              bookId: bookId,
              bookTitle: bookTitle,
              userName: userName,
              lendingDate: now.toISOString(),
              dueDate: dummyDueDate.toISOString(),
              status: status
            };
            
            records.push(dummyRecord);
            logs.push(`警告: records配列が空でしたが、ログに貸出記録発見の記録があったため、ダミーレコードを作成しました。`);
            Logger.log(`デバッグ\t警告: ダミーレコード作成: ${JSON.stringify(dummyRecord)}`);
          }
          break;
        }
      }
    }
    
    // 本来の返却処理
    return finalResult;
    
  } catch (error) {
    const errorMsg = `貸出記録の検索中にエラーが発生しました: ${error} (スタック: ${error.stack})`;
    logs.push(errorMsg);
    console.error(errorMsg);
    console.error(error);
    throw new Error(`貸出記録の検索に失敗しました: ${error.message}`);
  }
}

/**
 * 複数の書籍IDを一括で返却処理する関数
 * @param {string[]} bookIds - 返却する書籍IDの配列
 * @return {object} 処理結果メッセージ { message: string }
 */
function processBulkReturn(bookIds) {
  console.log("一括返却データ受信:", bookIds);
  let successCount = 0;
  let notFoundCount = 0;
  let alreadyReturnedCount = 0;
  let errorCount = 0;
  const notFoundIds = [];
  const alreadyReturnedIds = [];
  const errorMessages = [];

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    return { message: "返却処理失敗: 書籍IDが指定されていません。" };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    if (!lendingSheet) {
      throw new Error("シート「貸出記録」が見つかりません。");
    }

    const data = lendingSheet.getDataRange().getValues();
    const bookIdColIndex = 0;     // A列
    const statusColIndex = 6;     // G列
    const returnDateColIndex = 7; // H列
    const currentDate = new Date();

    // シートのデータをMapに格納して高速化 (書籍IDをキー、行インデックスと行データを値)
    // 注意: 同じ書籍IDで複数の未返却レコードがある場合、最後のものだけがMapに残る
    const lendingMap = new Map();
    for (let i = 1; i < data.length; i++) {
      const rowBookId = data[i][bookIdColIndex] ? data[i][bookIdColIndex].toString().trim().toLowerCase() : null;
      if (rowBookId) {
         // 未返却のレコードのみを対象とするように修正
         const rowStatus = data[i][statusColIndex];
         if(rowStatus === "未返却") {
            // 同じIDが複数あれば上書きされる（=最新の貸出が対象になる）
             lendingMap.set(rowBookId, { index: i + 1, rowData: data[i] });
         } else if (!lendingMap.has(rowBookId)) {
             // 返却済みだがMapに未登録の場合（未返却がなかった場合）
             lendingMap.set(rowBookId, { index: i + 1, rowData: data[i] });
         }
      }
    }

    const updates = []; // 更新内容を一時保存 [(rowIndex, statusCol, value), (rowIndex, dateCol, value)]

    bookIds.forEach(bookId => {
      const trimmedBookId = bookId.trim();
      if (!trimmedBookId) return; // 空のIDはスキップ

      const bookIdLower = trimmedBookId.toLowerCase();
      const recordInfo = lendingMap.get(bookIdLower);

      if (recordInfo) {
        const rowIndex = recordInfo.index;
        const rowStatus = recordInfo.rowData[statusColIndex];

        if (rowStatus === "未返却") {
          // 更新リストに追加
          updates.push({ row: rowIndex, col: statusColIndex + 1, value: "返却済" });
          updates.push({ row: rowIndex, col: returnDateColIndex + 1, value: currentDate });
          successCount++;
          console.log(`返却処理準備完了: 書籍ID=${trimmedBookId} (行 ${rowIndex})`);
        } else {
          alreadyReturnedCount++;
          alreadyReturnedIds.push(trimmedBookId);
          console.warn(`書籍ID ${trimmedBookId} は既に返却済みです (行 ${rowIndex})`);
        }
      } else {
        notFoundCount++;
        notFoundIds.push(trimmedBookId);
        console.warn(`書籍ID ${trimmedBookId} の貸出記録が見つかりませんでした。`); // メッセージ修正
      }
    });

    // まとめて更新 (GASのAPI呼び出し回数を減らすため)
    if (updates.length > 0) {
      updates.forEach(update => {
        try {
          lendingSheet.getRange(update.row, update.col).setValue(update.value);
        } catch (e) {
           // 個別の更新エラー処理
           console.error(`行 ${update.row}, 列 ${update.col} の更新中にエラー: ${e}`);
           errorCount++;
           // 成功カウントを減らす（ステータス更新が失敗した場合）
           if (update.col === statusColIndex + 1) successCount--;
           // エラーが発生した書籍IDを特定（少し複雑になる）
           // updates配列はステータスと日付のペアなので、インデックス/2で元のbookIds配列のインデックスに近づける
           const failedBookIdIndex = Math.floor(updates.indexOf(update) / 2);
           const failedBookId = bookIds[failedBookIdIndex] || `不明(Index:${failedBookIdIndex})`;
           errorMessages.push(`ID ${failedBookId} の更新失敗`);
        }
      });
      console.log(`${successCount}件の返却処理を更新しました。`);
    }

    // 結果メッセージの組み立て
    let message = `${successCount}件の返却処理に成功しました。`;
    if (notFoundCount > 0) {
      message += ` ${notFoundCount}件は見つかりませんでした (${notFoundIds.join(', ')})。`;
    }
    if (alreadyReturnedCount > 0) {
      message += ` ${alreadyReturnedCount}件は既に返却済みでした (${alreadyReturnedIds.join(', ')})。`;
    }
     if (errorCount > 0) {
      message += ` ${errorCount}件の更新中にエラーが発生しました。`;
    }

    return { message: message };

  } catch (error) {
    console.error(`一括返却処理中にエラーが発生しました: ${error}`);
    console.error(error);
    return { message: `一括返却処理失敗: ${error.message}` };
  }
}


/**
 * 複数の書籍IDを一括で貸出登録する関数
 * @param {object} bulkData - { userId: string, userName: string, bookIds: string[] }
 * @return {string} 処理結果メッセージ
 */
function processBulkLending(bulkData) {
  console.log("一括貸出データ受信:", bulkData);
  let successCount = 0;
  let errorCount = 0;
  const errorMessages = [];

  try {
    // 入力チェック
    if (!bulkData || !bulkData.userId || !bulkData.userName || !Array.isArray(bulkData.bookIds) || bulkData.bookIds.length === 0) {
       throw new Error("必要な情報（利用者ID, 利用者名, 書籍IDリスト）が不足しているか、形式が正しくありません。");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    const bookSheet = ss.getSheetByName("書籍DB"); // 書籍名取得用

    if (!lendingSheet || !bookSheet) {
      console.error("必要なシート（貸出記録または書籍DB）が見つかりません。");
      throw new Error("必要なシートが見つかりません。");
    }

    // 書籍DBの情報を先に読み込んでおく（効率化のため）
    const bookData = bookSheet.getDataRange().getValues();
    const bookMap = new Map(); // 書籍IDをキー、書籍名を値とするMap
    for (let i = 1; i < bookData.length; i++) {
      const bookId = bookData[i][0] ? bookData[i][0].toString().trim() : null;
      const bookTitle = bookData[i][1] || "タイトル不明";
      if (bookId) {
        bookMap.set(bookId, bookTitle);
      }
    }

    const lendingDate = new Date(); // 現在日時を貸出日時とする
    const dueDate = new Date(lendingDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 貸出日から2週間後
    const returnStatus = "未返却"; // 初期状態

    const rowsToAdd = [];

    bulkData.bookIds.forEach(bookId => {
      const trimmedBookId = bookId.trim();
      if (!trimmedBookId) return; // 空のIDはスキップ

      const bookTitle = bookMap.get(trimmedBookId) || "タイトル不明（DB未登録）";

      // スプレッドシートに追加するデータ配列
      rowsToAdd.push([
        trimmedBookId,
        bookTitle,
        bulkData.userId,
        bulkData.userName,
        lendingDate,
        dueDate,
        returnStatus
      ]);
      successCount++;
      console.log(`貸出準備完了: ${bookTitle} (ID: ${trimmedBookId})`);
    });

    // まとめて追記
    if (rowsToAdd.length > 0) {
      lendingSheet.getRange(lendingSheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
      console.log(`${successCount}件の貸出記録を追加しました。`);
    }

    if (errorCount > 0) {
      return `貸出登録完了 (${successCount}件成功、${errorCount}件失敗)。失敗した書籍ID: ${errorMessages.join(', ')}`;
    } else {
      return `${successCount}件の貸出登録に成功しました。`;
    }

  } catch (error) {
    console.error(`一括貸出処理中にエラーが発生しました: ${error}`);
    console.error(error); // スタックトレースも出力
    // クライアントにエラーメッセージを返す
    return `一括貸出登録失敗: ${error.message}`;
  }
}


/**
 * 利用者IDに基づいて貸出記録を検索する関数
 * @param {string} userId - 利用者ID
 * @return {object} 貸出記録とログ情報を含むオブジェクト
 */
function getUserRentals(userId) {
  // ログを収集するための配列
  const logs = [];
  
  if (!userId) {
    logs.push("利用者IDが指定されていません。");
    return { records: [], logs: logs };
  }
  
  logs.push(`利用者の貸出記録検索開始: 利用者ID=${userId}`);
  console.log(`利用者の貸出記録検索開始: 利用者ID=${userId}`);
  Logger.log(`デバッグ\t利用者の貸出記録検索開始: 利用者ID=${userId}`);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = ss.getSheetByName("貸出記録");
    if (!lendingSheet) {
      const errorMsg = "シート「貸出記録」が見つかりません。";
      logs.push(errorMsg);
      console.error(errorMsg);
      throw new Error("貸出記録シートが見つかりません。");
    }

    const data = lendingSheet.getDataRange().getValues();
    // ヘッダー: A:書籍ID, B:書籍名, C:利用者ID, D:利用者名, E:貸出日時, F:返却予定日, G:返却状況, H:返却日時
    const bookIdColIndex = 0;     // A列
    const titleColIndex = 1;      // B列
    const userIdColIndex = 2;     // C列
    const userNameColIndex = 3;   // D列
    const lendingDateColIndex = 4;// E列
    const dueDateColIndex = 5;    // F列
    const statusColIndex = 6;     // G列

    logs.push(`検索開始: 貸出記録シートの行数=${data.length}`);
    
    // 検索結果を格納する配列
    const records = [];
    
    // ヘッダー行を除く (1行目から検索)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUserId = row[userIdColIndex] ? row[userIdColIndex].toString().trim() : "";
      
      // デバッグ用にログ出力
      logs.push(`行 ${i + 1} 検証中: シートの利用者ID=[${rowUserId}], 検索対象の利用者ID=[${userId.trim()}]`);
      Logger.log(`デバッグ\t行 ${i + 1} 検証中: シートの利用者ID=[${rowUserId}], 検索対象の利用者ID=[${userId.trim()}]`);
      
      // 利用者IDが一致する行を探す
      // 詳細なデバッグ情報を追加
      const rowUserIdLower = rowUserId.toLowerCase();
      const userIdLower = userId.trim().toLowerCase();
      const isIdMatch = rowUserIdLower === userIdLower;
      Logger.log(`デバッグ\t行 ${i + 1} 詳細比較: ID一致=${isIdMatch}(${rowUserIdLower}=${userIdLower})`);
      
      // 大文字小文字を区別せずに比較
      if (rowUserId && isIdMatch) {
        // 貸出記録情報を作成 (DateオブジェクトをISO文字列に変換)
        const lendingDate = row[lendingDateColIndex];
        const dueDate = row[dueDateColIndex];
        
        const record = {
          bookId: row[bookIdColIndex] || "",
          bookTitle: row[titleColIndex] || "",
          userId: rowUserId,
          userName: row[userNameColIndex] || "",
          // Dateオブジェクトが存在し、有効な日付であればISO文字列に変換
          lendingDate: (lendingDate instanceof Date && !isNaN(lendingDate)) ? lendingDate.toISOString() : null,
          dueDate: (dueDate instanceof Date && !isNaN(dueDate)) ? dueDate.toISOString() : null,
          status: row[statusColIndex] || ""
        };
        
        records.push(record);
        logs.push(`貸出記録発見 (行 ${i + 1}): ${record.bookTitle}, ${record.userName}, 状態=${record.status}`);
        Logger.log(`デバッグ\t貸出記録発見 (行 ${i + 1}): ${record.bookTitle}, ${record.userName}, 状態=${record.status}`);
        
        // デバッグ: 追加したレコードの詳細をログに出力
        Logger.log(`デバッグ\t追加したレコード詳細: ${JSON.stringify(record)}`);
      }
    }

    if (records.length > 0) {
      logs.push(`利用者ID ${userId} の貸出記録が ${records.length} 件見つかりました。`);
      Logger.log(`デバッグ\t検索結果: ${records.length}件の記録が見つかりました。records配列=${JSON.stringify(records)}`);
    } else {
      logs.push(`利用者ID ${userId} の貸出記録が見つかりませんでした。`);
      Logger.log(`デバッグ\t検索結果: 記録が見つかりませんでした。records配列は空です。`);
    }
    
    return { records: records, logs: logs };
    
  } catch (error) {
    const errorMsg = `貸出記録の検索中にエラーが発生しました: ${error} (スタック: ${error.stack})`;
    logs.push(errorMsg);
    console.error(errorMsg);
    console.error(error);
    throw new Error(`貸出記録の検索に失敗しました: ${error.message}`);
  }
}

// processReturnForm と getLendingInfo のテスト関数も同様に bookId ベースで作成可能
// sendOverdueReminders のテストは、実際にメールが飛ぶため注意が必要


/**
 * Google Books APIを使用して書籍情報を取得する関数
 * @param {string} isbn - 書籍のISBNコード
 * @return {object} 書籍情報オブジェクト
 */
function fetchBookInfo(isbn) {
  if (!isbn) {
    return { error: "ISBNが指定されていません。" };
  }
  
  try {
    // Google Books APIのURLを構築
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&country=JP`;
    
    // APIリクエストを送信
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    // 検索結果がない場合
    if (!data.items || data.items.length === 0) {
      return { error: "書籍情報が見つかりませんでした。" };
    }
    
    // 最初の検索結果から書籍情報を抽出
    const volumeInfo = data.items[0].volumeInfo;
    
    // 書籍情報オブジェクトを作成
    const bookInfo = {
      isbn: isbn,
      title: volumeInfo.title || "",
      authors: volumeInfo.authors ? volumeInfo.authors.join(", ") : "",
      publisher: volumeInfo.publisher || "",
      thumbnail: volumeInfo.imageLinks ? volumeInfo.imageLinks.smallThumbnail : null
    };
    
    return bookInfo;
  } catch (error) {
    console.error(`書籍情報の取得中にエラーが発生しました: ${error}`);
    return { error: `APIリクエスト中にエラーが発生しました: ${error.message}` };
  }
}

/**
 * 書籍情報をスプレッドシートの書籍DBに登録する関数
 * @param {object} bookData - 書籍データ {isbn, title, author, publisher, note}
 * @return {object} 処理結果 {success: boolean, message: string}
 */
function registerBook(bookData) {
  if (!bookData || !bookData.isbn || !bookData.title) {
    return { success: false, message: "書籍IDと書籍名は必須です。" };
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookSheet = ss.getSheetByName("書籍DB");
    
    if (!bookSheet) {
      return { success: false, message: "書籍DBシートが見つかりません。" };
    }
    
    // 既存の書籍IDをチェック（重複登録を防止）
    const data = bookSheet.getDataRange().getValues();
    const bookIdColIndex = 0; // A列
    
    // ヘッダー行を除いて検索
    for (let i = 1; i < data.length; i++) {
      if (data[i][bookIdColIndex] && data[i][bookIdColIndex].toString().trim() === bookData.isbn.trim()) {
        return { success: false, message: `書籍ID ${bookData.isbn} は既に登録されています。` };
      }
    }
    
    // 新しい行を追加
    const newRow = [
      bookData.isbn,
      bookData.title,
      bookData.author,
      bookData.publisher,
      bookData.note
    ];
    
    bookSheet.appendRow(newRow);
    
    return { success: true, message: `書籍「${bookData.title}」を登録しました。` };
  } catch (error) {
    console.error(`書籍登録中にエラーが発生しました: ${error}`);
    return { success: false, message: `書籍登録中にエラーが発生しました: ${error.message}` };
  }
}

/**
 * スプレッドシートが開かれたときにカスタムメニューを追加する関数
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('管理メニュー')
      .addItem('バーコード生成', 'generateBarcodesForSheet')
      .addItem('延滞リマインダー送信', 'sendOverdueReminders')
      .addItem('貸出状況レポート作成', 'generateLendingReport')
      .addItem('返却済データのバックアップ', 'showBackupDialog')
      .addToUi();
}

/**
 * 返却済データのバックアップ用ダイアログを表示する関数
 */
function showBackupDialog() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    '返却済データのバックアップ',
    'バックアップ先のスプレッドシートIDを入力してください：\n（例: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms）',
    ui.ButtonSet.OK_CANCEL
  );

  // OKボタンがクリックされた場合
  if (result.getSelectedButton() == ui.Button.OK) {
    const targetSpreadsheetId = result.getResponseText().trim();
    
    // 入力値の検証
    if (!targetSpreadsheetId) {
      ui.alert('エラー', 'スプレッドシートIDが入力されていません。', ui.ButtonSet.OK);
      return;
    }
    
    try {
      // バックアップ処理を実行
      const result = backupReturnedData(targetSpreadsheetId);
      
      // 結果をアラートで表示
      if (result.success) {
        ui.alert('成功', `${result.count}件の返却済データをバックアップし、元のシートから削除しました。`, ui.ButtonSet.OK);
      } else {
        ui.alert('エラー', `バックアップ処理に失敗しました: ${result.message}`, ui.ButtonSet.OK);
      }
    } catch (error) {
      ui.alert('エラー', `予期せぬエラーが発生しました: ${error.message}`, ui.ButtonSet.OK);
    }
  }
}

/**
 * 返却済データをバックアップし、元のシートから削除する関数
 * @param {string} targetSpreadsheetId - バックアップ先のスプレッドシートID
 * @return {object} 処理結果 {success: boolean, count: number, message: string}
 */
function backupReturnedData(targetSpreadsheetId) {
  try {
    // 現在のスプレッドシート（元データ）を取得
    const sourceSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const lendingSheet = sourceSpreadsheet.getSheetByName("貸出記録");
    
    if (!lendingSheet) {
      return { success: false, count: 0, message: "貸出記録シートが見つかりません。" };
    }
    
    // バックアップ先のスプレッドシートを取得
    let targetSpreadsheet;
    try {
      targetSpreadsheet = SpreadsheetApp.openById(targetSpreadsheetId);
    } catch (e) {
      return { success: false, count: 0, message: "指定されたスプレッドシートが見つかりません。IDを確認してください。" };
    }
    
    // バックアップ先のシート1を取得（なければ作成）
    let targetSheet = targetSpreadsheet.getSheetByName("Sheet1");
    if (!targetSheet) {
      targetSheet = targetSpreadsheet.getSheets()[0]; // 最初のシートを取得
      if (!targetSheet) {
        return { success: false, count: 0, message: "バックアップ先にシートが見つかりません。" };
      }
    }
    
    // 元データの全行を取得
    const data = lendingSheet.getDataRange().getValues();
    if (data.length <= 1) { // ヘッダー行のみの場合
      return { success: true, count: 0, message: "バックアップ対象のデータがありません。" };
    }
    
    // ヘッダー行
    const headers = data[0];
    
    // 返却状況の列インデックスを特定
    const statusColIndex = headers.findIndex(header => header === "返却状況");
    if (statusColIndex === -1) {
      return { success: false, count: 0, message: "返却状況の列が見つかりません。" };
    }
    
    // 返却済みデータを抽出
    const returnedData = data.filter((row, index) => 
      index > 0 && row[statusColIndex] === "返却済"
    );
    
    if (returnedData.length === 0) {
      return { success: true, count: 0, message: "バックアップ対象の返却済データがありません。" };
    }
    
    // バックアップ先のシートにヘッダーがなければ追加
    const targetData = targetSheet.getDataRange().getValues();
    if (targetData.length === 0 || targetData[0].join() !== headers.join()) {
      targetSheet.clearContents(); // 既存のデータをクリア
      targetSheet.appendRow(headers); // ヘッダー行を追加
    }
    
    // 返却済みデータをバックアップ先に追加
    targetSheet.getRange(
      targetSheet.getLastRow() + 1, 
      1, 
      returnedData.length, 
      headers.length
    ).setValues(returnedData);
    
    // 元シートから返却済みデータを削除（下から削除していく）
    const rowsToDelete = [];
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][statusColIndex] === "返却済") {
        rowsToDelete.push(i + 1); // シートの行番号は1から始まるため+1
      }
    }
    
    // 行を削除
    rowsToDelete.forEach(rowNum => {
      lendingSheet.deleteRow(rowNum);
    });
    
    return { 
      success: true, 
      count: returnedData.length, 
      message: `${returnedData.length}件の返却済データをバックアップしました。` 
    };
    
  } catch (error) {
    console.error("バックアップ処理中にエラーが発生しました:", error);
    return { success: false, count: 0, message: error.message };
  }
}

/**
 * 貸出状況レポートを生成する関数
 * 現在の貸出状況を新しいシートに出力する
 */
function generateLendingReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lendingSheet = ss.getSheetByName("貸出記録");
  
  if (!lendingSheet) {
    SpreadsheetApp.getUi().alert("シート「貸出記録」が見つかりません。");
    return;
  }
  
  // 現在の日時を取得してレポート名に使用
  const now = new Date();
  const reportName = `貸出状況レポート_${Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd_HHmm")}`;
  
  // 既存のレポートシートがあれば削除
  const existingSheet = ss.getSheetByName(reportName);
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  // 新しいシートを作成
  const reportSheet = ss.insertSheet(reportName);
  
  // ヘッダー行を設定
  reportSheet.getRange("A1:H1").setValues([["書籍ID", "書籍名", "利用者ID", "利用者名", "貸出日時", "返却予定日", "返却状況", "返却日時"]]);
  reportSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f3f3f3");
  
  // 貸出記録データを取得
  const data = lendingSheet.getDataRange().getValues();
  
  // ヘッダー行を除いたデータを新しいシートにコピー
  if (data.length > 1) {
    reportSheet.getRange(2, 1, data.length - 1, data[0].length).setValues(data.slice(1));
  }
  
  // 列幅を自動調整
  reportSheet.autoResizeColumns(1, 8);
  
  // 未返却の行を強調表示
  const statusColumn = 7; // G列
  for (let i = 2; i <= data.length; i++) {
    if (reportSheet.getRange(i, statusColumn).getValue() === "未返却") {
      reportSheet.getRange(i, 1, 1, 8).setBackground("#ffebee"); // 薄い赤色
    }
  }
  
  // 返却期限が過ぎている行をさらに強調
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻部分をリセット
  const dueDateColumn = 6; // F列
  
  for (let i = 2; i <= data.length; i++) {
    const status = reportSheet.getRange(i, statusColumn).getValue();
    const dueDate = reportSheet.getRange(i, dueDateColumn).getValue();
    
    if (status === "未返却" && dueDate instanceof Date && !isNaN(dueDate) && dueDate < today) {
      reportSheet.getRange(i, 1, 1, 8).setBackground("#f8bbd0"); // より濃い赤色
      reportSheet.getRange(i, dueDateColumn).setFontWeight("bold").setFontColor("#d32f2f"); // 返却期限を赤太字
    }
  }
  
  // フィルターを設定
  reportSheet.getRange(1, 1, data.length, 8).createFilter();
  
  // 作成したシートをアクティブにする
  ss.setActiveSheet(reportSheet);
  
  SpreadsheetApp.getUi().alert(`貸出状況レポート「${reportName}」を作成しました。`);
}

/**
 * 「バーコード生成」シートのIDに基づいてバーコード画像を生成する関数
 */
function generateBarcodesForSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "バーコード生成"; // 対象シート名
  const sheet = ss.getSheetByName(sheetName);
  const idColumn = 1; // ID列 (A列 = 1)
  const barcodeColumn = 3; // バーコード画像列 (C列 = 3)

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`シート「${sheetName}」が見つかりません。`);
    return;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues(); // シート全体のデータを取得

  // ヘッダー行を除き、指定列にデータがある行を処理
  const formulas = [];
  for (let i = 1; i < values.length; i++) { // i = 0 はヘッダーなのでスキップ
    const id = values[i][idColumn - 1]; // 指定されたID列の値を取得 (0-based index)
    if (id) { // IDが空でない場合のみ処理
      // barcode.tec-it.com APIを使用してCode 128バーコードURLを生成 (DPIを300に戻す)
      const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(id)}&code=Code128&dpi=300&borderwidth=10&bordercolor=FFFFFF`;
      // IMAGE関数を作成 (モード2: セルに合わせて伸縮表示)
      formulas.push([`=IMAGE("${barcodeUrl}", 2)`]);
    } else {
      formulas.push(['']); // IDがない場合は空文字を設定
    }
  }

  // 指定列のデータ範囲に数式を設定 (ヘッダー行を除く)
  if (formulas.length > 0) {
    // 書き込み範囲を計算
    sheet.getRange(2, barcodeColumn, formulas.length, 1).setFormulas(formulas);
    SpreadsheetApp.getUi().alert(`「${sheetName}」シートのバーコード生成が完了しました。`);
  } else {
    SpreadsheetApp.getUi().alert('処理対象のIDがありませんでした。');
  }
}
