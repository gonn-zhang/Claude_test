// ==UserScript==
// @name         Chat Export Tool
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  ChatGPT/Claude/Gemini の公開チャットをPDF化
// @author       Your Name
// @match        https://chatgpt.com/share/*
// @match        https://chat.openai.com/share/*
// @match        https://claude.ai/share/*
// @match        https://gemini.google.com/share/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // CHAT EXPORTER - USERSCRIPT VERSION
    // ============================================

    const ChatExporter = {
        version: '1.0.0',

        // Configuration
        config: {
            autoScroll: true,
            expandCollapsed: true,
            scrollDelay: 500,
            maxScrollAttempts: 50,
            expandDelay: 300
        },

        // Detect which platform we're on
        detectSource: function() {
            const hostname = window.location.hostname;

            if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) return 'chatgpt';
            if (hostname.includes('claude.ai')) return 'claude';
            if (hostname.includes('gemini.google.com')) return 'gemini';

            return 'unknown';
        },

        // Add export button to page
        addExportButton: function() {
            // Avoid duplicate buttons
            if (document.getElementById('chat-exporter-btn')) return;

            const button = document.createElement('button');
            button.id = 'chat-exporter-btn';
            button.innerHTML = '📄 Export to PDF';
            button.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            button.onmouseover = () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            };

            button.onmouseout = () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            };

            button.onclick = () => this.showUI();

            document.body.appendChild(button);
        },

        // Show UI modal for settings
        showUI: function() {
            const source = this.detectSource();

            // Remove existing modal if any
            const existing = document.getElementById('chat-exporter-modal');
            if (existing) existing.remove();

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'chat-exporter-modal';
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999999; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                        <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Chat Export Tool</h2>
                        <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">検出: <strong style="color: #667eea;">${source.toUpperCase()}</strong></p>

                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: flex-start; margin-bottom: 15px; cursor: pointer;">
                                <input type="checkbox" id="ce-auto-scroll" checked style="margin: 3px 10px 0 0; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
                                <span style="font-size: 14px; color: #333;">
                                    <strong>自動スクロールして全文ロード</strong><br>
                                    <small style="color: #666;">すべてのメッセージを読み込みます（推奨）</small>
                                </span>
                            </label>

                            <label style="display: flex; align-items: flex-start; margin-bottom: 15px; cursor: pointer;">
                                <input type="checkbox" id="ce-expand" checked style="margin: 3px 10px 0 0; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
                                <span style="font-size: 14px; color: #333;">
                                    <strong>折りたたみを展開</strong><br>
                                    <small style="color: #666;">「もっと見る」ボタンを自動クリック</small>
                                </span>
                            </label>
                        </div>

                        <div id="ce-status" style="margin-bottom: 15px; padding: 12px; background: #f0f0f0; border-radius: 6px; display: none; font-size: 14px; color: #333; min-height: 45px; display: flex; align-items: center; justify-content: center;">
                            準備中...
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button id="ce-start" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;">
                                抽出開始
                            </button>
                            <button id="ce-cancel" style="background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-size: 16px; cursor: pointer; transition: opacity 0.2s;">
                                キャンセル
                            </button>
                        </div>

                        <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 6px; font-size: 12px; color: #2e7d32;">
                            <strong>🔒 プライバシー保護:</strong> すべての処理はローカルで実行されます。データは外部に送信されません。
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            const startBtn = document.getElementById('ce-start');
            const cancelBtn = document.getElementById('ce-cancel');

            const cleanup = () => {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
            };

            cancelBtn.onclick = cleanup;

            startBtn.onclick = async () => {
                this.config.autoScroll = document.getElementById('ce-auto-scroll').checked;
                this.config.expandCollapsed = document.getElementById('ce-expand').checked;

                const statusEl = document.getElementById('ce-status');
                statusEl.style.display = 'flex';
                startBtn.disabled = true;
                startBtn.style.opacity = '0.6';
                startBtn.style.cursor = 'not-allowed';

                try {
                    await this.extract(statusEl);
                    statusEl.innerHTML = '<span style="color: #28a745;">✓ 完了！印刷ビューを開きました。</span>';
                    statusEl.style.background = '#d4edda';

                    setTimeout(cleanup, 2000);
                } catch (error) {
                    statusEl.innerHTML = `<span style="color: #dc3545;">⚠ エラー: ${this.escapeHTML(error.message)}</span>`;
                    statusEl.style.background = '#f8d7da';
                    startBtn.disabled = false;
                    startBtn.style.opacity = '1';
                    startBtn.style.cursor = 'pointer';
                }
            };
        },

        // Auto scroll to load all messages
        autoScrollToLoadAll: async function(statusEl) {
            if (!this.config.autoScroll) return;

            statusEl.innerHTML = '📜 スクロール中...';

            let lastHeight = 0;
            let sameHeightCount = 0;
            let attempts = 0;

            while (attempts < this.config.maxScrollAttempts) {
                // Scroll to bottom
                window.scrollTo(0, document.body.scrollHeight);

                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, this.config.scrollDelay));

                const currentHeight = document.body.scrollHeight;

                if (currentHeight === lastHeight) {
                    sameHeightCount++;
                    if (sameHeightCount >= 3) {
                        // No change for 3 attempts, assume we've reached the end
                        break;
                    }
                } else {
                    sameHeightCount = 0;
                }

                lastHeight = currentHeight;
                attempts++;

                // Update status
                statusEl.innerHTML = `📜 スクロール中... (${attempts}/${this.config.maxScrollAttempts})`;
            }

            // Scroll back to top
            window.scrollTo(0, 0);
            await new Promise(resolve => setTimeout(resolve, 300));
        },

        // Expand all collapsed content
        expandAllCollapsed: async function(statusEl) {
            if (!this.config.expandCollapsed) return;

            statusEl.innerHTML = '📂 折りたたみを展開中...';

            // Find all buttons that might expand content
            const buttons = Array.from(document.querySelectorAll('button'));

            let expandedCount = 0;

            for (const button of buttons) {
                const text = button.textContent.toLowerCase();
                const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();

                // Check if this is a "show more" type button
                if (
                    text.includes('more') ||
                    text.includes('続き') ||
                    text.includes('もっと') ||
                    text.includes('show') ||
                    ariaLabel.includes('more') ||
                    ariaLabel.includes('expand')
                ) {
                    try {
                        button.click();
                        expandedCount++;
                        await new Promise(resolve => setTimeout(resolve, this.config.expandDelay));
                    } catch (e) {
                        // Ignore errors from clicking
                    }
                }
            }

            if (expandedCount > 0) {
                statusEl.innerHTML = `📂 ${expandedCount}個の要素を展開しました`;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        },

        // Extract messages based on platform
        extractMessages: function(source) {
            const extractors = {
                chatgpt: this.extractChatGPT.bind(this),
                claude: this.extractClaude.bind(this),
                gemini: this.extractGemini.bind(this),
                unknown: this.extractFallback.bind(this)
            };

            const extractor = extractors[source] || extractors.unknown;
            return extractor();
        },

        // ChatGPT extractor
        extractChatGPT: function() {
            const messages = [];

            // Try multiple selector strategies
            const strategies = [
                // Strategy 1: data-message-author-role attribute
                () => {
                    const elements = document.querySelectorAll('[data-message-author-role]');
                    return Array.from(elements).map(el => ({
                        element: el,
                        role: el.getAttribute('data-message-author-role')
                    }));
                },
                // Strategy 2: Group divs with specific classes
                () => {
                    const elements = document.querySelectorAll('div.group');
                    return Array.from(elements).map(el => {
                        const hasUserIndicator = el.querySelector('[class*="user"]') || el.textContent.includes('You said:');
                        return {
                            element: el,
                            role: hasUserIndicator ? 'user' : 'assistant'
                        };
                    });
                },
                // Strategy 3: Article elements
                () => {
                    const elements = document.querySelectorAll('article');
                    return Array.from(elements).map(el => ({
                        element: el,
                        role: 'assistant' // Most likely assistant responses
                    }));
                }
            ];

            // Try each strategy until we find messages
            for (const strategy of strategies) {
                const candidates = strategy();

                if (candidates.length > 0) {
                    candidates.forEach(({ element, role }) => {
                        const blocks = this.extractBlocks(element);
                        if (blocks.length > 0) {
                            messages.push({ role, blocks });
                        }
                    });

                    if (messages.length > 0) break;
                }
            }

            return messages;
        },

        // Claude extractor
        extractClaude: function() {
            const messages = [];

            // Claude-specific selectors
            const strategies = [
                () => {
                    const elements = document.querySelectorAll('[class*="Message"], [class*="message"]');
                    return Array.from(elements).map(el => {
                        const className = el.className.toLowerCase();
                        const role = className.includes('user') || className.includes('human') ? 'user' : 'assistant';
                        return { element: el, role };
                    });
                },
                () => {
                    const elements = document.querySelectorAll('div[role="article"]');
                    return Array.from(elements).map(el => ({
                        element: el,
                        role: 'assistant'
                    }));
                }
            ];

            for (const strategy of strategies) {
                const candidates = strategy();

                if (candidates.length > 0) {
                    candidates.forEach(({ element, role }) => {
                        const blocks = this.extractBlocks(element);
                        if (blocks.length > 0) {
                            messages.push({ role, blocks });
                        }
                    });

                    if (messages.length > 0) break;
                }
            }

            return messages;
        },

        // Gemini extractor
        extractGemini: function() {
            const messages = [];

            const strategies = [
                () => {
                    const elements = document.querySelectorAll('[class*="message"], [class*="Message"]');
                    return Array.from(elements).map(el => {
                        const isUser = el.closest('[class*="user"]') !== null;
                        return {
                            element: el,
                            role: isUser ? 'user' : 'assistant'
                        };
                    });
                },
                () => {
                    const elements = document.querySelectorAll('div[role="presentation"]');
                    return Array.from(elements).map(el => ({
                        element: el,
                        role: 'assistant'
                    }));
                }
            ];

            for (const strategy of strategies) {
                const candidates = strategy();

                if (candidates.length > 0) {
                    candidates.forEach(({ element, role }) => {
                        const blocks = this.extractBlocks(element);
                        if (blocks.length > 0) {
                            messages.push({ role, blocks });
                        }
                    });

                    if (messages.length > 0) break;
                }
            }

            return messages;
        },

        // Fallback extractor (heuristic)
        extractFallback: function() {
            const messages = [];

            // Look for common message container patterns
            const selectors = [
                'div[class*="message"]',
                'div[class*="Message"]',
                'article',
                '[role="article"]',
                'div.chat',
                'div[class*="chat"]'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);

                if (elements.length > 0) {
                    elements.forEach(el => {
                        const blocks = this.extractBlocks(el);
                        if (blocks.length > 0) {
                            messages.push({
                                role: 'unknown',
                                blocks
                            });
                        }
                    });

                    if (messages.length > 0) break;
                }
            }

            return messages;
        },

        // Extract content blocks from an element
        extractBlocks: function(element) {
            const blocks = [];
            const processedNodes = new Set();

            // Helper to check if node was already processed
            const isProcessed = (node) => {
                let current = node;
                while (current) {
                    if (processedNodes.has(current)) return true;
                    current = current.parentNode;
                    if (current === element) break;
                }
                return false;
            };

            // Extract code blocks first (highest priority)
            const codeBlocks = element.querySelectorAll('pre code, pre, code[class*="language-"]');
            codeBlocks.forEach(code => {
                if (isProcessed(code)) return;

                const pre = code.closest('pre') || code;
                const lang = code.className.match(/language-(\w+)/)?.[1] || '';
                const content = code.textContent.trim();

                if (content.length > 0) {
                    blocks.push({
                        type: 'code',
                        content: content,
                        lang: lang
                    });
                    processedNodes.add(pre);
                }
            });

            // Extract images
            const images = element.querySelectorAll('img');
            images.forEach(img => {
                if (isProcessed(img)) return;

                blocks.push({
                    type: 'image',
                    src: img.src,
                    alt: img.alt || ''
                });
                processedNodes.add(img);
            });

            // Extract main text content (excluding already processed elements)
            const clone = element.cloneNode(true);

            // Remove already processed elements from clone
            clone.querySelectorAll('pre, code[class*="language-"], script, style').forEach(el => el.remove());

            const text = this.getCleanText(clone);

            if (text.length > 10) { // Minimum text length to avoid noise
                blocks.push({
                    type: 'text',
                    content: text
                });
            }

            return blocks;
        },

        // Get clean text from element
        getCleanText: function(element) {
            // Get text content and normalize whitespace
            let text = element.textContent || '';

            // Clean up excessive whitespace
            text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
            text = text.replace(/[ \t]+/g, ' '); // Normalize spaces
            text = text.trim();

            return text;
        },

        // Main extraction flow
        extract: async function(statusEl) {
            const source = this.detectSource();

            try {
                // Step 1: Auto scroll
                await this.autoScrollToLoadAll(statusEl);

                // Step 2: Expand collapsed
                await this.expandAllCollapsed(statusEl);

                // Step 3: Extract
                statusEl.innerHTML = '🔍 メッセージを抽出中...';
                await new Promise(resolve => setTimeout(resolve, 500));

                const messages = this.extractMessages(source);

                if (messages.length === 0) {
                    throw new Error(
                        'メッセージが見つかりませんでした。\n' +
                        '対処法:\n' +
                        '1. ページを最後までスクロールしてください\n' +
                        '2. 「もっと見る」ボタンをクリックしてください\n' +
                        '3. ページが完全に読み込まれるまで待ってください'
                    );
                }

                // Step 4: Render
                statusEl.innerHTML = '🎨 印刷ビューを生成中...';
                await new Promise(resolve => setTimeout(resolve, 300));

                this.renderPrintView({
                    source,
                    title: document.title || 'Chat Export',
                    url: window.location.href,
                    capturedAt: new Date().toISOString(),
                    messages
                });

            } catch (error) {
                throw error;
            }
        },

        // Render print view in new tab
        renderPrintView: function(conversation) {
            const html = this.generateHTML(conversation);

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const newWindow = window.open(url, '_blank');

            // Clean up blob URL after window loads
            if (newWindow) {
                newWindow.addEventListener('load', () => {
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                });
            }
        },

        // Generate HTML for print view
        generateHTML: function(conv) {
            const messagesHTML = conv.messages.map((msg, idx) => {
                const blocksHTML = msg.blocks.map(block => {
                    switch (block.type) {
                        case 'code':
                            const langLabel = block.lang ? `<div style="font-size: 11px; color: #888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">${this.escapeHTML(block.lang)}</div>` : '';
                            return `<div style="margin: 10px 0;">${langLabel}<pre style="margin: 0;"><code class="language-${this.escapeHTML(block.lang)}">${this.escapeHTML(block.content)}</code></pre></div>`;
                        case 'image':
                            return `<div style="margin: 10px 0;"><img src="${this.escapeHTML(block.src)}" alt="${this.escapeHTML(block.alt)}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>`;
                        case 'text':
                        default:
                            // Convert markdown-style formatting if present
                            let content = this.escapeHTML(block.content);
                            // Bold
                            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            // Italic
                            content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
                            // Preserve line breaks
                            content = content.replace(/\n/g, '<br>');

                            return `<div style="margin: 10px 0;">${content}</div>`;
                    }
                }).join('');

                const roleClass = msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'assistant' : 'unknown');
                const roleLabel = msg.role === 'user' ? 'ユーザー' : (msg.role === 'assistant' ? 'AI' : '不明');
                const roleIcon = msg.role === 'user' ? '👤' : (msg.role === 'assistant' ? '🤖' : '❓');

                return `
                    <div class="message ${roleClass}">
                        <div class="message-header">${roleIcon} ${roleLabel}</div>
                        <div class="message-content">${blocksHTML}</div>
                    </div>
                `;
            }).join('');

            const exportDate = new Date(conv.capturedAt);
            const formattedDate = exportDate.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(conv.title)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            line-height: 1.7;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.08);
            border-radius: 8px;
        }

        .header {
            margin-bottom: 35px;
            padding-bottom: 25px;
            border-bottom: 3px solid #e9ecef;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 15px;
            color: #1a1a1a;
            font-weight: 700;
            line-height: 1.3;
        }

        .header .meta {
            font-size: 14px;
            color: #6c757d;
            line-height: 1.8;
        }

        .header .meta-item {
            margin: 5px 0;
            display: flex;
            align-items: baseline;
        }

        .header .meta-label {
            font-weight: 600;
            min-width: 80px;
            color: #495057;
        }

        .header .meta a {
            color: #667eea;
            text-decoration: none;
            word-break: break-all;
        }

        .header .meta a:hover {
            text-decoration: underline;
        }

        .print-notice {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
        }

        .message {
            margin-bottom: 30px;
            padding: 25px;
            border-radius: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .message.user {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-left: 5px solid #2196f3;
        }

        .message.assistant {
            background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
            border-left: 5px solid #9c27b0;
        }

        .message.unknown {
            background: #f8f9fa;
            border-left: 5px solid #6c757d;
        }

        .message-header {
            font-weight: 700;
            margin-bottom: 15px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .message.user .message-header {
            color: #1565c0;
        }

        .message.assistant .message-header {
            color: #6a1b9a;
        }

        .message.unknown .message-header {
            color: #495057;
        }

        .message-content {
            color: #2c3e50;
            font-size: 15px;
        }

        .message-content > div {
            margin: 12px 0;
        }

        .message-content > div:first-child {
            margin-top: 0;
        }

        .message-content > div:last-child {
            margin-bottom: 0;
        }

        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 18px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
            border: 1px solid #333;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        code {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;
        }

        strong {
            font-weight: 700;
            color: #1a1a1a;
        }

        em {
            font-style: italic;
            color: #495057;
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #adb5bd;
            font-size: 13px;
        }

        .stats {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 14px;
            color: #495057;
            display: flex;
            justify-content: center;
            gap: 30px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stat-value {
            font-weight: 700;
            color: #667eea;
            font-size: 18px;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 15px;
            }

            .print-notice {
                display: none;
            }

            .message {
                break-inside: avoid;
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #dee2e6;
            }

            pre {
                break-inside: avoid;
                page-break-inside: avoid;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            .message-content img {
                break-inside: avoid;
                page-break-inside: avoid;
            }

            @page {
                margin: 1.5cm;
                size: A4;
            }

            .header {
                break-after: avoid;
                page-break-after: avoid;
            }

            a {
                color: #667eea;
                text-decoration: underline;
            }
        }

        @media screen and (max-width: 768px) {
            body {
                padding: 10px;
            }

            .container {
                padding: 20px;
            }

            .header h1 {
                font-size: 24px;
            }

            .message {
                padding: 18px;
            }

            .stats {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="print-notice">
            📄 <strong>印刷方法:</strong> Ctrl/Cmd + P を押して、送信先を「PDFに保存」に設定してください
        </div>

        <div class="header">
            <h1>${this.escapeHTML(conv.title)}</h1>
            <div class="meta">
                <div class="meta-item">
                    <span class="meta-label">プラットフォーム:</span>
                    <span><strong>${conv.source.toUpperCase()}</strong></span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">URL:</span>
                    <a href="${this.escapeHTML(conv.url)}" target="_blank">${this.escapeHTML(conv.url)}</a>
                </div>
                <div class="meta-item">
                    <span class="meta-label">エクスポート:</span>
                    <span>${formattedDate}</span>
                </div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-item">
                <span>メッセージ数:</span>
                <span class="stat-value">${conv.messages.length}</span>
            </div>
            <div class="stat-item">
                <span>ユーザー:</span>
                <span class="stat-value">${conv.messages.filter(m => m.role === 'user').length}</span>
            </div>
            <div class="stat-item">
                <span>AI:</span>
                <span class="stat-value">${conv.messages.filter(m => m.role === 'assistant').length}</span>
            </div>
        </div>

        <div class="messages">
            ${messagesHTML}
        </div>

        <div class="footer">
            <div style="margin-bottom: 8px;">
                Generated by <strong>Chat Export Tool v${this.version}</strong>
            </div>
            <div style="font-size: 11px;">
                🔒 完全ローカル処理 | データ送信なし | プライバシー保護
            </div>
        </div>
    </div>
</body>
</html>`;
        },

        // Escape HTML
        escapeHTML: function(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        // Initialize
        init: function() {
            // Wait for page to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.addExportButton());
            } else {
                this.addExportButton();
            }
        }
    };

    // Auto-initialize
    ChatExporter.init();

    console.log('✓ Chat Export Tool loaded successfully');
})();
