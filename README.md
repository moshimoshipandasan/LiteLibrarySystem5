# LiteLibrarySystem5 - モバイル最適化版

## 概要
LiteLibrarySystem5は、図書館の貸出・返却・書籍登録などの基本機能を提供するシステムです。このバージョンでは、スマートフォン（iPhoneとAndroid）での表示と操作性を向上させるために、フォントサイズとUIコンポーネントを最適化しています。

## 最適化内容
すべてのHTMLファイルにおいて、以下の要素を3倍に拡大し、モバイルデバイスでの視認性と操作性を向上させました：

### 1. 基本フォントサイズ
- 16px → 48px

### 2. 見出しサイズ
- h1: 24px → 72px
- h2: 20px → 60px

### 3. ラベルサイズ
- 18px → 54px

### 4. 入力欄のフォントサイズとパディング
- フォントサイズ: 16px → 48px
- パディング: 15px → 45px
- ボーダー: 1px → 3px
- 角丸: 8px → 24px

### 5. ボタンのサイズと余白
- フォントサイズ: 16px → 48px
- パディング: 15px 20px → 45px 60px
- 最小高さ: 44px → 132px
- 主要ボタン: 18px → 54px

### 6. テーブルとチェックボックス
- テーブルフォントサイズ: 16px → 48px
- セルパディング: 15px → 45px
- チェックボックス: 28px → 84px

### 7. スキャナービューポート
- 最大幅: 960px → 2880px
- ボーダー: 2px → 6px
- ガイドライン: 2px → 6px

### 8. レスポンシブデザインの調整
- スマホ向けのパディングとマージンも3倍に拡大
- メディアクエリの閾値は維持

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
