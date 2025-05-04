# LiteLibrarySystem5 - モバイル最適化版

## 概要
LiteLibrarySystem5は、図書館の貸出・返却・書籍登録などの基本機能を提供するシステムです。このバージョンでは、スマートフォン（iPhoneとAndroid）での表示と操作性を向上させるために、フォントサイズとUIコンポーネントを最適化しています。

## システム概要
本システムは以下の5つの主要機能を提供します：

1. **図書貸出**：利用者IDと書籍IDを入力して貸出処理を行います
2. **利用者別返却**：利用者IDを入力して、その利用者の未返却本を一覧表示し返却処理を行います
3. **貸出書籍検索**：書籍IDを入力して、その書籍の貸出状況を確認します
4. **図書返却**：書籍IDを入力して返却処理を行います
5. **書籍登録**：ISBNコードをスキャンまたは入力して書籍情報を登録します

各機能はURLパラメータ `?page=` で切り替えることができます。

## 各機能の詳細

### 1. 図書貸出（?page=なし）
メインの貸出画面です。利用者IDと書籍IDを入力して貸出処理を行います。

**特徴**：
- 利用者IDをスキャンすると、自動的に利用者情報を取得して表示します
- 利用者情報確定後、書籍IDを連続スキャンすることで複数冊の貸出が可能です
- スキャンした書籍のタイトルがリアルタイムで表示されます
- 「貸出登録」ボタンで一括して貸出処理を行います

**使用方法**：
- 「利用者IDをスキャン」ボタンをクリックしてカメラを起動し、利用者IDをスキャンします（または手入力）
- 利用者情報が表示されたら、「書籍IDをスキャン」ボタンをクリックしてカメラを起動し、書籍IDをスキャンします
- 複数冊貸し出す場合は、続けて書籍IDをスキャンします
- すべての書籍をスキャンしたら、「貸出登録」ボタンをクリックして処理を完了します

### 2. 利用者別返却（?page=user_returns）
特定の利用者が借りている本をまとめて返却するための画面です。

**特徴**：
- 利用者IDをスキャンすると、その利用者の未返却本が一覧表示されます
- チェックボックスで返却する本を選択できます
- 「全選択」チェックボックスで一括選択も可能です
- 「選択した本をまとめて返却」ボタンで選択した本だけを返却処理します

**使用方法**：
- 「利用者IDをスキャン」ボタンをクリックしてカメラを起動し、利用者IDをスキャンします（または手入力）
- 表示された未返却一覧から、返却する本のチェックボックスをオンにします
- 「選択した本をまとめて返却」ボタンをクリックして返却処理を完了します

### 3. 貸出書籍検索（?page=finder）
書籍IDから貸出状況を検索する画面です。

**特徴**：
- 書籍IDをスキャンすると、その書籍の貸出履歴が表示されます
- 現在の貸出状況（貸出中か返却済みか）が色分け表示されます
  - 返却済：緑色
  - 未返却：赤色
- 利用者名とIDも表示されます

**使用方法**：
- 「書籍IDをスキャン」ボタンをクリックしてカメラを起動し、書籍IDをスキャンします（または手入力）
- 「検索」ボタンをクリックすると、その書籍の貸出履歴が表示されます

### 4. 図書返却（?page=return）
書籍IDを入力して返却処理を行う画面です。複数冊をまとめて返却できます。

**特徴**：
- 書籍IDをスキャンすると、書籍情報を取得して表示します
- 連続スキャンで複数冊の返却処理が可能です
- チェックボックスで返却する本を選択できます
- 「全選択」チェックボックスで一括選択も可能です
- 「選択した本をまとめて返却」ボタンで選択した本だけを返却処理します

**使用方法**：
- 「書籍IDをスキャン」ボタンをクリックしてカメラを起動し、書籍IDをスキャンします（または手入力）
- 複数冊返却する場合は、続けて書籍IDをスキャンします
- 返却する本のチェックボックスをオンにします
- 「選択した本をまとめて返却」ボタンをクリックして返却処理を完了します

### 5. 書籍登録（?page=register）
ISBNコードをスキャンまたは入力して書籍情報を登録する画面です。

**特徴**：
- ISBNバーコードをカメラでスキャンできます
- Google Books APIを利用して書籍情報を自動取得します
- 書籍名、著者名、出版社などの情報を編集できます
- 取得した情報をシステムに登録できます

**使用方法**：
- 「カメラを起動」ボタンをクリックしてカメラを起動し、ISBNバーコードをスキャンします（または手入力）
- 書籍情報が自動取得され表示されます
- 必要に応じて情報を編集します
- 「書籍を登録」ボタンをクリックして登録処理を完了します

## バージョン情報
- **Version 5.1.0** (2025/5/4)
  - 検索ボタンの追加：すべての画面に検索ボタンを追加し、手入力後の検索操作を改善
  - ボタンスタイルの統一：すべての検索ボタンに「btn-utility」クラスを適用し、グレー色のスタイルで統一
  - 操作性の向上：バーコードスキャナーを使用せずに手入力でIDを入力した場合でも、明示的な検索ボタンをクリックして検索を実行可能に

- **Version 5.0.0** (2025/4/15)
  - モバイル最適化：すべてのUIコンポーネントを3倍に拡大し、スマートフォンでの視認性と操作性を向上
  - レスポンシブデザインの強化：スマートフォン表示時のレイアウトを最適化

## データ参照
システムで使用するサンプルデータは以下のURLからコピーして使用できます：
[サンプルデータスプレッドシート](https://docs.google.com/spreadsheets/d/1gPA3DUV4X4_OORNOViQ56urc1mWg3OK-qNuqY2Gu5vw/copy)

## 参考システム
本システムの参考となったシステムは以下のURLで公開されています：
[参考システム](https://sites.google.com/view/ueno999/top)

## 修正したファイル
- lending.html - 図書貸出システム
- rental_books_finder.html - 貸出書籍検索システム
- returning.html - 図書返却システム
- user_returns.html - 利用者別返却システム
- book_register.html - 書籍登録システム

## 特徴
- Google Fontsの「Noto Sans JP」を使用し、日本語表示を最適化
- タッチターゲットを十分な大きさに設定し、操作ミスを防止
- スキャナー機能のUIを改善し、バーコード読み取りの使いやすさを向上
- テーブル表示のレスポンシブ対応を強化し、スマートフォンでの閲覧性を向上
- iOSとAndroid両方のデバイスで最適な表示となるよう調整

## 技術仕様
- HTML5
- CSS3（レスポンシブデザイン）
- JavaScript
- QuaggaJS（バーコードスキャナー）
- Google Apps Script（バックエンド）

## ライセンス
MIT License

Copyright (c) 2025 Noboru Ando @ Aoyama Gakuin University

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
