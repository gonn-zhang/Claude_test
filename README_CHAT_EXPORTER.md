# Chat Export Tool 📄

ChatGPT / Claude / Gemini の公開共有チャットを抽出し、印刷向けの整形HTMLを生成してPDF化するツールです。

## 🎯 目的

公開共有リンクのチャット会話を、ブラウザの印刷機能で複数ページPDFとして保存できるようにします。共有ページをそのまま印刷すると1ページしか出力されない問題を解決します。

## ✨ 特徴

- **完全ローカル処理**: データは外部サーバーに送信されません
- **プライバシー保護**: すべての処理がブラウザ内で完結
- **多サイト対応**: ChatGPT、Claude、Geminiの公開リンクに対応
- **自動スクロール**: 仮想スクロールに対応し、全メッセージを自動読み込み
- **折りたたみ展開**: 「もっと見る」ボタンを自動クリック
- **印刷最適化**: 複数ページPDFに最適化されたレイアウト
- **コード保持**: シンタックスハイライトと等幅フォント
- **依存なし**: 外部ライブラリ不要（Vanilla JavaScript）

## 📦 提供ファイル

### Option A: Bookmarklet（推奨）
- **index.html** - Bookmarklet生成ページ

### Option B: Userscript
- **chat-exporter.user.js** - Tampermonkey/Greasemonkey用スクリプト

## 🚀 使い方

### Option A: Bookmarklet方式（推奨）

#### 1. Bookmarkletを取得

1. `index.html` をブラウザで開く（ローカルファイルでOK）
2. 「📋 Bookmarklet をコピー」ボタンをクリック
3. クリップボードにコードがコピーされます

#### 2. ブックマークに登録

**Chrome / Edge / Brave:**
1. ブックマークバーを表示（Ctrl+Shift+B / Cmd+Shift+B）
2. ブックマークバーの空白部分を右クリック → 「ページを追加」
3. 名前: `Export Chat`
4. URL: コピーしたコードを貼り付け
5. 保存

**Firefox:**
1. ブックマークバーを表示（Ctrl+Shift+B / Cmd+Shift+B）
2. ブックマークバーを右クリック → 「新しいブックマーク」
3. 名前: `Export Chat`
4. 場所: コピーしたコードを貼り付け
5. 保存

#### 3. 使用方法

1. ChatGPT/Claude/Geminiの**公開共有リンク**をブラウザで開く
2. ページが完全に読み込まれるまで待つ
3. ブックマークバーの「Export Chat」をクリック
4. **自動的に処理が開始**されます:
   - 右上に進捗状況が表示されます（スクロール中... → 展開中... → 抽出中... → 生成中...）
   - 自動スクロールで全メッセージを読み込み
   - 「もっと見る」ボタンを自動展開
   - メッセージ抽出と整形HTML生成
5. 完了すると新しいタブに印刷ビューが自動的に開きます
6. **Ctrl+P / Cmd+P** で印刷ダイアログを開く
7. 送信先を「**PDFに保存**」に設定して保存

### Option B: Userscript方式

#### 1. Tampermonkeyをインストール

- Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- Edge: [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

#### 2. スクリプトをインストール

1. Tampermonkeyのダッシュボードを開く
2. 「新規スクリプト」をクリック
3. `chat-exporter.user.js` の内容をコピー&ペースト
4. Ctrl+S / Cmd+S で保存

#### 3. 使用方法

1. ChatGPT/Claude/Geminiの**公開共有リンク**を開く
2. ページ右上に「📄 Export to PDF」ボタンが表示される
3. ボタンをクリックして設定を選択
4. 「抽出開始」をクリック
5. 新しいタブに整形ページが開く
6. Ctrl+P / Cmd+P でPDF保存

## 🎨 印刷ビューの特徴

### レイアウト
- ユーザーとAIのメッセージを色分け表示
- メッセージごとに背景色とボーダーで区別
- コードブロックは暗い背景に等幅フォント
- 画像は適切なサイズで表示

### メタ情報
- 会話タイトル
- 元のURL（クリック可能）
- エクスポート日時
- メッセージ統計（総数、ユーザー数、AI数）

### 印刷最適化
- `@media print` で余白、改ページを最適化
- メッセージの途中での改ページを防止
- コードブロックの分割を防止
- 背景色を印刷に適した色に調整

## 🔒 セキュリティとプライバシー

### 安全性の保証

✅ **完全ローカル処理**
- すべての処理はブラウザ内で実行されます
- 会話データは外部サーバーに送信されません

✅ **ネットワーク通信なし**
- コードにネットワークリクエストは一切含まれていません
- `fetch`, `XMLHttpRequest`, `WebSocket` などを使用していません

✅ **データ保存なし**
- 抽出データはメモリ上でのみ処理されます
- LocalStorageやCookieへの保存は行いません

✅ **オープンソース**
- すべてのコードが閲覧可能です
- このREADMEのファイルを確認できます

### 推奨事項

- 機密情報が含まれる会話は注意して扱ってください
- 生成されたPDFの保存場所に注意してください
- 各サービスの利用規約を確認してください

## ⚙️ 技術詳細

### アーキテクチャ

```
1. detectSource()
   ↓
2. showUI()（設定ダイアログ表示）
   ↓
3. autoScrollToLoadAll()（オプション）
   ↓
4. expandAllCollapsed()（オプション）
   ↓
5. extractMessages()
   ├─ extractChatGPT()
   ├─ extractClaude()
   ├─ extractGemini()
   └─ extractFallback()
   ↓
6. normalizeToSchema()
   ↓
7. renderPrintView()
   └─ generateHTML()
```

### データスキーマ

```javascript
Conversation = {
  source: 'chatgpt' | 'claude' | 'gemini' | 'unknown',
  title: string,
  url: string,
  capturedAt: ISOString,
  messages: Message[]
}

Message = {
  role: 'user' | 'assistant' | 'system' | 'unknown',
  blocks: Block[]
}

Block = {
  type: 'text' | 'code' | 'image',
  content: string,
  lang?: string,      // for code blocks
  src?: string,       // for images
  alt?: string        // for images
}
```

### セレクタ戦略

各プラットフォームで複数のセレクタ戦略を試行し、最初に成功したものを使用します：

**ChatGPT:**
1. `[data-message-author-role]` 属性
2. `div.group` クラス
3. `article` 要素

**Claude:**
1. `[class*="Message"]` クラス
2. `[role="article"]` 属性

**Gemini:**
1. `[class*="message"]` クラス
2. `[role="presentation"]` 属性

**Fallback:**
- 汎用的なメッセージコンテナパターンをヒューリスティックに検索

### 自動スクロールアルゴリズム

```javascript
while (attempts < maxScrollAttempts) {
  window.scrollTo(0, document.body.scrollHeight);
  await sleep(scrollDelay);

  if (currentHeight === lastHeight) {
    sameHeightCount++;
    if (sameHeightCount >= 3) break;
  }

  lastHeight = currentHeight;
  attempts++;
}
```

## ⚠️ 既知の制限

### サイト側の変更
- ChatGPT/Claude/GeminiのUI変更により、将来的に動作しなくなる可能性があります
- セレクタは定期的に更新が必要な場合があります

### 仮想スクロール
- 自動スクロールを有効にしないと、画面外のメッセージが取得できません
- 非常に長い会話では、すべてのメッセージを読み込むのに時間がかかります

### コンテンツの制限
- クロスオリジン制限により、一部の画像は取得できない場合があります
- 特殊なウィジェットやインタラクティブ要素は完全再現できません
- SVG画像や動的生成コンテンツは制限される場合があります

### 認証とアクセス
- **完全公開されている共有リンクのみ**対応しています
- ログインが必要なページでは動作しません
- 認証トークンが必要なページでは動作しません
- 削除・無効化されたリンクでは動作しません

### パフォーマンス
- 数百メッセージを超える非常に長い会話では処理に時間がかかります
- 大量の画像がある場合、印刷ビューの生成が遅くなります

## 🔧 トラブルシューティング

### Q: 一部のメッセージが抽出されない

**A:** 以下を試してください：
1. 「自動スクロールして全文ロード」オプションを有効にする
2. 手動でページを最後までスクロールしてから実行する
3. ページが完全に読み込まれるまで待つ

### Q: 長文が途中で切れている

**A:** 「折りたたみを展開」オプションを有効にしてください。それでも解決しない場合：
1. 手動で「もっと見る」ボタンをすべてクリックする
2. その後、ツールを実行する

### Q: エラーが表示される

**A:** 以下を確認してください：
1. 正しい共有ページ（ChatGPT/Claude/Gemini）で実行しているか
2. ページが完全に読み込まれているか
3. ブラウザのJavaScriptが有効になっているか
4. 共有リンクが有効か（削除されていないか）

### Q: コードが見つからない

**A:** エラーメッセージを確認してください：
- 「メッセージが見つかりませんでした」→ ページ構造が変更された可能性
- 対処法: セレクタを更新する必要があります

### Q: PDF化するとレイアウトが崩れる

**A:** ブラウザの印刷設定を調整してください：
1. 「背景のグラフィック」を有効にする
2. 余白設定を「デフォルト」または「最小」に設定
3. 用紙サイズをA4またはLetterに設定
4. 倍率を100%に設定

### Q: Bookmarkletが動作しない

**A:** 以下を確認してください：
1. ブックマークのURLフィールドに `javascript:` で始まるコードが貼り付けられているか
2. コードが途中で切れていないか（全体をコピーする）
3. ブラウザがブックマークレットを許可しているか

## 📝 カスタマイズ

### 設定の変更

`config` オブジェクトで動作をカスタマイズできます：

```javascript
config: {
  autoScroll: true,              // 自動スクロール
  expandCollapsed: true,         // 折りたたみ展開
  scrollDelay: 500,              // スクロール間隔（ミリ秒）
  maxScrollAttempts: 50,         // 最大スクロール試行回数
  expandDelay: 300               // 展開ボタンクリック間隔（ミリ秒）
}
```

### スタイルのカスタマイズ

生成されるHTMLの `<style>` タグ内のCSSを編集することで、印刷ビューの外観をカスタマイズできます：

```css
/* ユーザーメッセージの背景色 */
.message.user {
  background: #e3f2fd;
  border-left: 5px solid #2196f3;
}

/* AIメッセージの背景色 */
.message.assistant {
  background: #f3e5f5;
  border-left: 5px solid #9c27b0;
}
```

### 新しいプラットフォームの追加

新しいチャットプラットフォームに対応するには：

1. `detectSource()` に新しいプラットフォームを追加
2. 専用の `extractXXX()` 関数を実装
3. `extractMessages()` のextractorsオブジェクトに追加

```javascript
detectSource: function() {
  if (hostname.includes('newsite.com')) return 'newsite';
  // ...
},

extractNewSite: function() {
  // プラットフォーム固有の抽出ロジック
},

extractMessages: function(source) {
  const extractors = {
    chatgpt: this.extractChatGPT.bind(this),
    claude: this.extractClaude.bind(this),
    gemini: this.extractGemini.bind(this),
    newsite: this.extractNewSite.bind(this),  // 追加
    unknown: this.extractFallback.bind(this)
  };
  // ...
}
```

## 📜 ライセンスと利用規約

### 使用許諾

このツールは教育目的で作成されています。自由に使用できますが、以下の点に注意してください：

1. **各サービスの利用規約を遵守してください**
   - ChatGPT: OpenAI利用規約
   - Claude: Anthropic利用規約
   - Gemini: Google利用規約

2. **個人利用に限定してください**
   - 商用利用は各サービスの規約を確認してください
   - 大量の自動抽出は避けてください

3. **責任の制限**
   - このツールは「現状のまま」提供されます
   - 作者は使用により生じた問題について責任を負いません

### コードの利用

- このコードはオープンソースとして提供されています
- 自由に改変・再配布できます
- 改変版を配布する場合は、この README を含めることを推奨します

## 🤝 貢献

バグ報告や機能提案は歓迎します：

1. 問題を詳細に説明してください
2. 可能であれば、再現手順を提供してください
3. ブラウザとOSのバージョンを記載してください

## 🔄 更新履歴

### v1.0.0 (2025-12-23)
- 初回リリース
- ChatGPT、Claude、Geminiの公開リンクに対応
- 自動スクロール機能
- 折りたたみ展開機能
- 印刷最適化されたHTML生成
- Bookmarklet版とUserscript版を提供

## 📚 参考情報

### サポートされているブラウザ

- Chrome / Chromium 90+
- Firefox 88+
- Edge 90+
- Safari 14+（一部機能に制限あり）

### 技術スタック

- Vanilla JavaScript (ES6+)
- CSS3
- HTML5

### 外部依存

なし（完全に自己完結）

## 🙏 謝辞

このツールは、ChatGPT/Claude/Geminiの素晴らしいサービスを補完するために作成されました。各サービスの開発チームに感謝します。

---

**最終更新**: 2025-12-23
**バージョン**: 1.0.0
**作者**: Claude Code with Human Guidance
