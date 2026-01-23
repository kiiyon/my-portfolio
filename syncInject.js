// ============================================
// 即座にオーバーレイを表示（最優先）
// ============================================
(function () {
    // 先行オーバーレイがあれば削除
    const preload = document.getElementById('nld-sync-overlay-preload');
    if (preload) preload.remove();

    const overlay = document.createElement('div');
    overlay.id = 'nld-sync-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: '2147483647',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"Google Sans", "Roboto", sans-serif',
        pointerEvents: 'all'
    });
    overlay.innerHTML = `
        <style>
            @keyframes nld-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes nld-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        </style>
        <div style="background: white; border-radius: 16px; padding: 48px 64px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 60px; border: 4px solid #e8eaed; border-top: 4px solid #4285f4; border-radius: 50%; animation: nld-spin 1s linear infinite; margin-bottom: 30px;"></div>
            <div style="font-size: 24px; font-weight: 500; color: #202124; margin-bottom: 12px;">同期中...</div>
            <div style="font-size: 14px; color: #5f6368; animation: nld-pulse 2s ease-in-out infinite;">NotebookLM を準備中...</div>
            <div style="margin-top: 24px; font-size: 12px; color: #9aa0a6;">画面に触れないでください</div>
        </div>
    `;
    if (document.body) {
        document.body.appendChild(overlay);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));
    }
})();

// ============================================
// メイン処理
// ============================================
(async () => {

    const CONFIG = {
        TIMEOUT_MS: 20000,
        SYNC_TEXT: 'クリックして Google ドライブと同期',
        SYNC_TEXT_EN: 'Click to sync with Google Drive',
        SYNCING_TEXT: '同期しています',
        SYNC_COMPLETE_TEXT: '同期が完了しました'
    };

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // ============================================
    // オーバーレイ更新
    // ============================================

    function showOverlay(status, isComplete = false) {
        let overlay = document.getElementById('nld-sync-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'nld-sync-overlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: '2147483647',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: '"Google Sans", "Roboto", sans-serif',
                pointerEvents: 'all'
            });
            document.body.appendChild(overlay);
        }

        const spinnerStyle = isComplete ? '' : `
            <style>
                @keyframes nld-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes nld-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        `;

        const icon = isComplete
            ? '<div style="font-size: 80px; margin-bottom: 20px;">✅</div>'
            : `<div style="
                width: 60px;
                height: 60px;
                border: 4px solid #e8eaed;
                border-top: 4px solid #4285f4;
                border-radius: 50%;
                animation: nld-spin 1s linear infinite;
                margin-bottom: 30px;
            "></div>`;

        const statusColor = isComplete ? '#34a853' : '#5f6368';
        const title = isComplete ? '同期完了！' : '同期中...';

        overlay.innerHTML = `
            ${spinnerStyle}
            <div style="
                background: white;
                border-radius: 16px;
                padding: 48px 64px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                text-align: center;
                max-width: 400px;
                display: flex;
                flex-direction: column;
                align-items: center;
            ">
                ${icon}
                <div style="
                    font-size: 24px;
                    font-weight: 500;
                    color: #202124;
                    margin-bottom: 12px;
                ">${title}</div>
                <div style="
                    font-size: 14px;
                    color: ${statusColor};
                    line-height: 1.6;
                    ${!isComplete ? 'animation: nld-pulse 2s ease-in-out infinite;' : ''}
                ">${status}</div>
                ${!isComplete ? `
                <div style="
                    margin-top: 24px;
                    font-size: 12px;
                    color: #9aa0a6;
                ">画面に触れないでください</div>
                ` : ''}
            </div>
        `;
    }

    function hideOverlay() {
        const overlay = document.getElementById('nld-sync-overlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // ============================================
    // 同期ボタン検索
    // ============================================

    function findSyncButton() {

        const allElements = document.querySelectorAll('*');
        let candidates = [];

        for (let el of allElements) {
            if (el.offsetParent === null) continue;

            const fullText = el.textContent || '';
            if (fullText.includes(CONFIG.SYNC_TEXT) || fullText.includes(CONFIG.SYNC_TEXT_EN)) {
                candidates.push(el);
            }
        }



        // role="button" またはcursor: pointerを持つ要素を優先
        for (let el of candidates) {
            if (el.getAttribute('role') === 'button') {
                return el;
            }
            if (window.getComputedStyle(el).cursor === 'pointer') {
                return el;
            }
        }

        // 親要素を探索
        if (candidates.length > 0) {
            let el = candidates[0];
            for (let i = 0; i < 10; i++) {
                if (!el || el === document.body) break;
                const role = el.getAttribute('role');
                const cursor = window.getComputedStyle(el).cursor;
                if (role === 'button' || el.tagName.toLowerCase() === 'button' || cursor === 'pointer') {
                    return el;
                }
                el = el.parentElement;
            }
        }

        if (candidates.length > 0) {
            return candidates[0];
        }

        return null;
    }

    // ============================================
    // クリック実行
    // ============================================

    async function clickSyncButton(element) {

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(500);

        // 方法1: 通常のクリック
        element.focus();
        await wait(100);
        element.click();
        await wait(1000);

        if (document.body.textContent.includes(CONFIG.SYNCING_TEXT) ||
            document.body.textContent.includes(CONFIG.SYNC_COMPLETE_TEXT)) {
            return true;
        }

        // 方法2: MouseEvent
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            button: 0
        });
        element.dispatchEvent(clickEvent);
        await wait(1000);

        if (document.body.textContent.includes(CONFIG.SYNCING_TEXT) ||
            document.body.textContent.includes(CONFIG.SYNC_COMPLETE_TEXT)) {
            return true;
        }

        // 方法3: PointerEvent
        const pointerdownEvent = new PointerEvent('pointerdown', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        });
        const pointerupEvent = new PointerEvent('pointerup', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        });

        element.dispatchEvent(pointerdownEvent);
        await wait(50);
        element.dispatchEvent(pointerupEvent);
        await wait(1000);

        return document.body.textContent.includes(CONFIG.SYNCING_TEXT) ||
            document.body.textContent.includes(CONFIG.SYNC_COMPLETE_TEXT);
    }

    // ============================================
    // 同期完了待機
    // ============================================

    async function waitForSyncCompletion() {
        const startTime = Date.now();


        while (Date.now() - startTime < CONFIG.TIMEOUT_MS) {
            showOverlay('Google ドライブと同期中...');

            if (document.body.textContent.includes(CONFIG.SYNC_COMPLETE_TEXT)) {
                return true;
            }
            if (!document.body.textContent.includes(CONFIG.SYNCING_TEXT) &&
                !document.body.textContent.includes(CONFIG.SYNC_TEXT) &&
                !document.body.textContent.includes(CONFIG.SYNC_TEXT_EN)) {
                return true;
            }
            await wait(500);
        }

        return false;
    }

    // ============================================
    // ソースパネルを開く
    // ============================================

    async function openSourcePanel() {

        const sourceTitles = document.querySelectorAll('.source-title');
        if (sourceTitles.length > 0) {
            // Diaryソースを優先
            for (let source of sourceTitles) {
                const text = source.textContent || '';
                if (text.includes('Diary') || text.includes('日記')) {
                    source.click();
                    await wait(2000);
                    return true;
                }
            }
            sourceTitles[0].click();
            await wait(2000);
            return true;
        }
        return false;
    }

    // ============================================
    // メイン処理
    // ============================================

    try {
        // オーバーレイを即座に表示
        showOverlay('NotebookLM を準備中...');

        // ページ読み込み待機
        await wait(2000);

        showOverlay('ソースを探しています...');

        // ソースパネルを開く
        const panelOpened = await openSourcePanel();

        if (panelOpened) {
            showOverlay('同期ボタンを探しています...');
            await wait(1000);

            const syncBtn = findSyncButton();

            if (syncBtn) {
                showOverlay('同期を開始しています...');
                const clicked = await clickSyncButton(syncBtn);

                if (clicked) {
                    await waitForSyncCompletion();
                    showOverlay('スプレッドシートとの同期が完了しました！', true);
                } else {
                    showOverlay('同期ボタンのクリックに失敗しました', true);
                }
            } else {
                showOverlay('同期ボタンが見つかりません（既に同期済みの可能性があります）', true);
            }
        } else {
            showOverlay('ソースパネルを開けませんでした', true);
        }

        // 完了後、3秒待ってからオーバーレイを消す
        await wait(3000);
        hideOverlay();

    } catch (e) {
        showOverlay(`エラーが発生しました: ${e.message}`, true);
        await wait(3000);
        hideOverlay();
    }
})();
