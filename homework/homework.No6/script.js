// 競馬使いすぎ防止サポーター AI (v2) - コアスクリプト

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    
    // 画面セクション
    const budgetSetupSection = document.getElementById('budget-setup-section');
    const mainAppContent = document.getElementById('main-app-content');
    const finishSummaryCard = document.getElementById('finish-summary-card');
    const inputCard = document.getElementById('input-card');
    
    // 予算設定
    const budgetForm = document.getElementById('budget-form');
    const budgetInput = document.getElementById('budget-input');
    const btnStart = document.getElementById('btn-start');
    const displayBudgetEl = document.getElementById('display-budget');
    
    // ダッシュボード・進捗バー
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStatus = document.getElementById('progress-status');
    const totalInvestmentEl = document.getElementById('total-investment');
    const totalReturnEl = document.getElementById('total-return');
    const totalBalanceEl = document.getElementById('total-balance');
    const cardTotalBalance = document.getElementById('card-total-balance');
    
    // レース入力フォーム
    const raceForm = document.getElementById('race-form');
    const raceNameInput = document.getElementById('race-name');
    const investmentInput = document.getElementById('investment-input');
    const returnInput = document.getElementById('return-input');
    const btnDiagnose = document.getElementById('btn-diagnose');
    const btnFinishDay = document.getElementById('btn-finish-day');
    
    // AIアバター・メッセージ
    const aiAvatar = document.getElementById('ai-avatar');
    const aiAdvice = document.getElementById('ai-advice');
    const aiLoader = document.getElementById('ai-loader');
    const loaderStep = document.getElementById('loader-step');
    
    // 診断レポート（直近レース）
    const resultCard = document.getElementById('result-card');
    const resultTitle = document.getElementById('result-title');
    const resultIncome = document.getElementById('result-income');
    const radarControl = document.getElementById('radar-control');
    const radarEfficiency = document.getElementById('radar-efficiency');
    const radarRisk = document.getElementById('radar-risk');
    const radarMind = document.getElementById('radar-mind');
    
    // 終了サマリー
    const finishBalanceEl = document.getElementById('finish-balance');
    const finishRecoveryRateEl = document.getElementById('finish-recovery-rate');
    const finishRaceCountEl = document.getElementById('finish-race-count');
    const finishAiAdviceEl = document.getElementById('finish-ai-advice');
    const btnResetDay = document.getElementById('btn-reset-day');
    
    // 履歴リスト
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const noHistoryMsg = document.getElementById('no-history-msg');
    
    // --- 状態変数 ---
    let budget = 0;
    let history = [];
    let isFinished = false;
    let isTyping = false;
    let keibaChart = null;

    // --- ローカルストレージ同期 ---
    
    function loadData() {
        const storedBudget = localStorage.getItem('keiba_v2_budget');
        const storedHistory = localStorage.getItem('keiba_v2_history');
        const storedFinished = localStorage.getItem('keiba_v2_finished');
        
        if (storedBudget) {
            budget = parseInt(storedBudget, 10);
            displayBudgetEl.textContent = `¥${budget.toLocaleString()}`;
            
            // メイン画面へ切り替え
            budgetSetupSection.classList.add('hidden');
            mainAppContent.classList.remove('hidden');
            
            if (storedHistory) {
                try {
                    history = JSON.parse(storedHistory);
                } catch (e) {
                    console.error('履歴の読み込みに失敗しました。', e);
                    history = [];
                }
            }
            
            if (storedFinished === 'true') {
                isFinished = true;
            }
            
            updateDashboard();
            renderHistory();
            initOrUpdateChart();
            
            if (isFinished) {
                lockAppForFinish();
            } else {
                updateAiMoodBasedOnOverall();
            }
        } else {
            // 予算が設定されていない場合は初期画面を表示
            budgetSetupSection.classList.remove('hidden');
            mainAppContent.classList.add('hidden');
        }
    }
    
    function saveData() {
        localStorage.setItem('keiba_v2_budget', budget.toString());
        localStorage.setItem('keiba_v2_history', JSON.stringify(history));
        localStorage.setItem('keiba_v2_finished', isFinished ? 'true' : 'false');
    }

    // --- 予算設定の開始 ---
    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = parseInt(budgetInput.value, 10);
        if (isNaN(value) || value <= 0) return;
        
        budget = value;
        displayBudgetEl.textContent = `¥${budget.toLocaleString()}`;
        isFinished = false;
        history = [];
        
        saveData();
        
        // 画面アニメーション切り替え
        budgetSetupSection.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
        
        // 初期アドバイス
        aiAvatar.className = 'ai-avatar';
        aiAvatar.textContent = '🤖';
        aiAdvice.textContent = `本日の予算 ¥${budget.toLocaleString()} でサポーターAIを起動しました。軍資金を賢く守りながら、レース収支を記録していきましょう！`;
        
        updateDashboard();
        renderHistory();
        initOrUpdateChart();
    });

    // --- ダッシュボード＆プログレスバーの更新 ---
    function updateDashboard() {
        let totalInvestment = 0;
        let totalReturn = 0;
        
        history.forEach(item => {
            totalInvestment += item.investment;
            totalReturn += item.returnAmt;
        });
        
        const totalBalance = totalReturn - totalInvestment;
        
        totalInvestmentEl.textContent = `¥${totalInvestment.toLocaleString()}`;
        totalReturnEl.textContent = `¥${totalReturn.toLocaleString()}`;
        
        const sign = totalBalance > 0 ? '+' : '';
        totalBalanceEl.textContent = `¥${sign}${totalBalance.toLocaleString()}`;
        
        // トータル収支のカード色変更
        cardTotalBalance.className = 'summary-card';
        if (totalBalance > 0) {
            cardTotalBalance.classList.add('status-win');
        } else if (totalBalance < 0) {
            cardTotalBalance.classList.add('status-lose');
        }
        
        // 損失進捗の計算
        const loss = totalInvestment - totalReturn;
        let lossRatio = 0;
        if (budget > 0) {
            lossRatio = Math.max(0, (loss / budget) * 100);
        }
        
        // 進捗バー表示の更新
        const displayRatio = Math.min(100, lossRatio);
        progressBar.style.width = `${displayRatio}%`;
        progressPercentage.textContent = `${Math.round(lossRatio)}%`;
        
        // 進捗度に応じたバーの色とステータス文言
        progressBar.className = 'progress-bar-fill';
        if (lossRatio <= 0) {
            progressStatus.textContent = '安全：利益が出ているか、トントンです 📈';
            progressStatus.style.color = 'var(--win-color)';
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        } else if (lossRatio <= 20) {
            progressStatus.textContent = '注意レベル1：微損です。まだ十分立て直せます。';
            progressStatus.style.color = '#a7f3d0';
            progressBar.style.background = '#059669';
        } else if (lossRatio <= 40) {
            progressStatus.textContent = '注意レベル2：予算の40%を突破。賭け金を見直しましょう。';
            progressStatus.style.color = 'var(--warn-color)';
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #fbbf24 100%)';
        } else if (lossRatio <= 60) {
            progressStatus.textContent = '注意レベル3：予算の半分を失いました！危険水域です。';
            progressStatus.style.color = '#f59e0b';
            progressBar.style.background = '#f59e0b';
        } else if (lossRatio <= 80) {
            progressStatus.textContent = '警告レベル4：予算の80%に到達。次の敗北は致命的です！';
            progressStatus.style.color = '#f87171';
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
        } else if (lossRatio < 100) {
            progressStatus.textContent = '警告レベル5：軍資金がほぼ底をつきかけています！';
            progressStatus.style.color = 'var(--danger-color)';
            progressBar.style.background = '#dc2626';
        } else {
            progressStatus.textContent = '緊急事態：設定予算を完全にオーバーしました！即終了してください 🚨';
            progressStatus.style.color = 'var(--danger-color)';
            progressBar.style.background = '#ef4444';
            progressBar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.8)';
        }
    }

    // --- 履歴リストの描画 ---
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            noHistoryMsg.style.display = 'block';
            btnClearHistory.disabled = true;
            return;
        }
        noHistoryMsg.style.display = 'none';
        btnClearHistory.disabled = isFinished;

        [...history].reverse().forEach(item => {
            const tr = document.createElement('tr');
            
            const timeTd = document.createElement('td');
            timeTd.textContent = item.time;
            
            const nameTd = document.createElement('td');
            nameTd.textContent = item.raceName || '一般レース';
            
            const investTd = document.createElement('td');
            investTd.textContent = `¥${item.investment.toLocaleString()}`;
            
            const returnTd = document.createElement('td');
            returnTd.textContent = `¥${item.returnAmt.toLocaleString()}`;
            
            const balanceTd = document.createElement('td');
            const diff = item.returnAmt - item.investment;
            const sign = diff > 0 ? '+' : '';
            balanceTd.textContent = `¥${sign}${diff.toLocaleString()}`;
            balanceTd.className = `col-income ${diff > 0 ? 'plus' : diff < 0 ? 'minus' : ''}`;
            
            const actionTd = document.createElement('td');
            actionTd.style.textAlign = 'center';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-row';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = '削除';
            deleteBtn.disabled = isFinished;
            deleteBtn.addEventListener('click', () => deleteHistoryItem(item.id));
            actionTd.appendChild(deleteBtn);

            tr.appendChild(timeTd);
            tr.appendChild(nameTd);
            tr.appendChild(investTd);
            tr.appendChild(returnTd);
            tr.appendChild(balanceTd);
            tr.appendChild(actionTd);

            historyList.appendChild(tr);
        });
    }

    // 履歴個別削除
    function deleteHistoryItem(id) {
        if (isFinished) return;
        history = history.filter(item => item.id !== id);
        saveData();
        updateDashboard();
        renderHistory();
        initOrUpdateChart();
        updateAiMoodBasedOnOverall();
    }

    // 全履歴クリア
    btnClearHistory.addEventListener('click', () => {
        if (history.length === 0 || isFinished) return;
        
        if (confirm('本日のすべての履歴を消去してよろしいですか？')) {
            history = [];
            saveData();
            updateDashboard();
            renderHistory();
            initOrUpdateChart();
            
            // AIリセット
            aiAvatar.className = 'ai-avatar';
            aiAvatar.textContent = '🤖';
            aiAdvice.textContent = '履歴をクリアしました。新しい戦績を入力して診断を始めましょう。';
            resultCard.style.display = 'none';
        }
    });

    // --- タイピング演出 ---
    function typeText(element, text, speed = 20, callback = null) {
        element.innerHTML = '';
        element.classList.add('typing-caret');
        let index = 0;
        isTyping = true;

        function type() {
            if (index < text.length) {
                if (text.substr(index, 1) === '\n') {
                    element.innerHTML += '<br>';
                } else {
                    element.innerHTML += text.charAt(index);
                }
                index++;
                setTimeout(type, speed);
            } else {
                element.classList.remove('typing-caret');
                isTyping = false;
                if (callback) callback();
            }
        }
        type();
    }

    // --- AIの表情・アバター更新 ---
    function updateAiAvatarState(moodClass, avatarChar) {
        aiAvatar.className = 'ai-avatar';
        if (moodClass) {
            aiAvatar.classList.add(moodClass);
        }
        aiAvatar.textContent = avatarChar;
    }

    // 履歴状態に応じたAI感情の通常更新
    function updateAiMoodBasedOnOverall() {
        if (history.length === 0) {
            updateAiAvatarState('', '🤖');
            return;
        }

        let totalInvestment = 0;
        let totalReturn = 0;
        history.forEach(item => {
            totalInvestment += item.investment;
            totalReturn += item.returnAmt;
        });

        const totalBalance = totalReturn - totalInvestment;
        const loss = totalInvestment - totalReturn;
        const lossRatio = budget > 0 ? (loss / budget) * 100 : 0;

        if (totalBalance > 0) {
            if (totalBalance >= budget * 0.5) {
                updateAiAvatarState('state-win', '🤩');
            } else {
                updateAiAvatarState('state-win', '😊');
            }
        } else if (totalBalance < 0) {
            if (lossRatio >= 100) {
                updateAiAvatarState('state-danger', '👿');
            } else if (lossRatio >= 60) {
                updateAiAvatarState('state-danger', '🚨');
            } else if (lossRatio >= 20) {
                updateAiAvatarState('state-warn', '⚠️');
            } else {
                updateAiAvatarState('state-warn', '🧐');
            }
        } else {
            updateAiAvatarState('', '😐');
        }
    }

    // --- 診断ロジック (損失割合 20% 刻み) ---
    function getDiagnosis(invest, ret) {
        // 直近レース単体の収支
        const lastBalance = ret - invest;
        
        // 今回の入力を反映した「仮のトータル収支」をベースに診断
        let tempInvest = 0;
        let tempReturn = 0;
        history.forEach(item => {
            tempInvest += item.investment;
            tempReturn += item.returnAmt;
        });
        tempInvest += invest;
        tempReturn += ret;

        const tempTotalBalance = tempReturn - tempInvest;
        const tempLoss = tempInvest - tempReturn;
        const tempLossRatio = budget > 0 ? (tempLoss / budget) * 100 : 0;

        let styleClass = '';
        let title = '';
        let advice = '';
        let avatarClass = '';
        let avatarChar = '🤖';
        let metrics = { control: 50, efficiency: 50, risk: 50, mind: 50 };

        if (tempTotalBalance > 0) {
            // プラス収支（勝ち）の場合
            const profit = tempTotalBalance;
            const profitRatio = (profit / budget) * 100;

            if (profitRatio >= 100) {
                styleClass = 'win-huge';
                title = '異次元の神予想！軍資金2倍突破';
                advice = `素晴らしい！トータル収支が設定予算（軍資金）を超える大勝利となっています！今日の競馬脳は完全に冴え渡っていますね。
                
しかし、ここが最大の落とし穴です。「今日はいくら賭けても負けない」と脳が錯覚し、次のレースで賭け金を急激に跳ね上げがちです。浮いた利益をすべて失う前に、利益を確定させて今日の競馬は『完全終了』にするのが最もスマートなギャンブラーの選択です！`;
                avatarClass = 'state-win';
                avatarChar = '🤩';
                metrics = { control: 75, efficiency: 100, risk: 40, mind: 60 };
            } else if (profitRatio >= 30) {
                styleClass = 'win-medium';
                title = '素晴らしい！見事な中勝ち';
                advice = `おめでとうございます！予算の30%以上に相当する、しっかりとした利益を獲得できています。
                
戦略が綺麗にハマりましたね。この流れを維持するためにも、次レースでは欲張って金額を増やさず、当初のベース賭け金を厳守してください。勝っている時の冷静さこそが、最終的に財布を潤す秘訣です。`;
                avatarClass = 'state-win';
                avatarChar = '😊';
                metrics = { control: 85, efficiency: 90, risk: 60, mind: 75 };
            } else {
                styleClass = 'win-small';
                title = '手堅く勝利！プラス域キープ';
                advice = `お見事！トータル収支はプラス域をキープしています。少しでもプラスで終えることは、競馬においては非常に難しい成果です。
                
この調子で堅実にいきましょう。わずかな利益でも、それを次の大勝負の資金にして溶かしてしまっては意味がありません。低リスク・低投資のスタイルを崩さずにいきましょう。`;
                avatarClass = 'state-win';
                avatarChar = '👍';
                metrics = { control: 90, efficiency: 80, risk: 80, mind: 85 };
            }
        } 
        else if (tempTotalBalance === 0) {
            // トントン（±0）
            styleClass = 'draw';
            title = 'セーフ！完全なトントン';
            advice = `トータル収支は±0、ちょうど引き分けです。軍資金を減らさずにスリルを楽しめたのは、十分な結果といえます。
            
ここで熱くなって「次こそは勝つ！」と無理な賭け方をすると、一気にマイナスへ転落します。本日のゲーム状況をよく見極め、マイナスになる前に終了する勇気も持っておきましょう。`;
            avatarClass = '';
            avatarChar = '😐';
            metrics = { control: 85, efficiency: 50, risk: 80, mind: 80 };
        } 
        else {
            // 損失発生中
            const lossRatio = tempLossRatio;

            if (lossRatio <= 20) {
                // 損失20%以下
                styleClass = 'lose-small';
                title = '軽微なマイナス (損失 20%以下)';
                advice = `トータルの損失は予算の20%未満（現在 ${Math.round(lossRatio)}%）です。まだ十分リカバリー可能な小さな傷です。
                
ここで焦って取り戻そうと、予定にないレースに手を出したり、賭け金を2倍にしたりしないように気を引き締めてください。この小さなマイナスを冷静に許容できるかが、使いすぎ防止の第一歩です。`;
                avatarClass = 'state-warn';
                avatarChar = '🧐';
                metrics = { control: 80, efficiency: 45, risk: 70, mind: 70 };
            } 
            else if (lossRatio <= 40) {
                // 損失20%〜40%
                styleClass = 'lose-small';
                title = '警告レベル2 (損失 20%〜40%)';
                advice = `トータルの損失が予算の40%近く（現在 ${Math.round(lossRatio)}%）に達しました。イエローカードの準備段階です。
                
「少し負けが込んできたな」と感じていませんか？次のレースは、本当に自信のある本命レースですか？もしそうでないなら、見送って頭を休めることを強くおすすめします。一歩引いて、冷静さを取り戻しましょう。`;
                avatarClass = 'state-warn';
                avatarChar = '⚠️';
                metrics = { control: 65, efficiency: 40, risk: 55, mind: 60 };
            } 
            else if (lossRatio <= 60) {
                // 損失40%〜60%
                styleClass = 'lose-medium';
                title = '警告レベル3 (損失 40%〜60%)';
                advice = `危険：予算の半分近く（現在 ${Math.round(lossRatio)}%）を失いました！
                
典型的な「熱くなりやすいゾーン」に入っています。失った半分を取り返そうと、オッズの高い大穴馬券に高額を突っ込みたくなっていませんか？冷静さを欠いた予想は、さらなる負けを引き寄せるだけです。次レースは賭け金を最低額に落とすか、本日の撤退を視野に入れましょう。`;
                avatarClass = 'state-danger';
                avatarChar = '🚨';
                metrics = { control: 45, efficiency: 30, risk: 35, mind: 40 };
            } 
            else if (lossRatio <= 80) {
                // 損失60%〜80%
                styleClass = 'lose-medium';
                title = '警告レベル4 (損失 60%〜80%)';
                advice = `厳重注意：予算の80%近く（現在 ${Math.round(lossRatio)}%）を失っています。崖っぷちです！
                
もうほぼ予算の限界が迫っています。これ以上の負けは、本日の「完全敗北」を意味します。もし次のレースに挑むなら、それが本当に今日のラストチャンスです。一番自信のあるレースを1つだけ選ぶか、今すぐ「今日のレースを終了する」を押して予算の残り20%を守り抜くのが最善です。`;
                avatarClass = 'state-danger';
                avatarChar = '🚨';
                metrics = { control: 30, efficiency: 20, risk: 20, mind: 25 };
            } 
            else if (lossRatio < 100) {
                // 損失80%〜100%
                styleClass = 'lose-huge';
                title = '警告レベル5 (損失 80%〜100%)';
                advice = `極めて深刻：予算がほぼ底をつきました（現在 ${Math.round(lossRatio)}%の損失）。
                
もはや大逆転を狙って無茶な賭けをしても、傷口を広げるだけです。ここでストップできれば、最後の小銭（残り20%未満の予算）を手元に残せます。負けを認め、傷がこれ以上深くならないうちに、今すぐ「今日のレースを終了する」ボタンを押して帰路につきましょう。`;
                avatarClass = 'state-danger';
                avatarChar = '👿';
                metrics = { control: 15, efficiency: 10, risk: 10, mind: 10 };
            } 
            else {
                // 100%以上 (予算オーバー)
                styleClass = 'lose-huge';
                title = '【即刻終了】予算上限オーバー！';
                advice = `【緊急命令：即刻競馬を停止してください】
本日の上限予算を完全にオーバーしました（損失 ${Math.round(lossRatio)}%）。これはあなたが最初に設定したルールに違反しています！
                
絶対に「もう1レースだけ入金して取り返す」などと考えてはいけません。それはさらなる深みにハマる最悪のスパイラルです。今すぐ投票アプリからログアウトし、財布を閉じましょう。今日のゲームは終了です！`;
                avatarClass = 'state-danger';
                avatarChar = '👿';
                metrics = { control: 0, efficiency: 5, risk: 0, mind: 0 };
            }
        }

        return {
            styleClass,
            title,
            advice,
            avatarClass,
            avatarChar,
            metrics
        };
    }

    // --- レース戦績の追加・診断実行 ---
    raceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isTyping || isFinished) return;

        const raceName = raceNameInput.value.trim();
        const investment = parseInt(investmentInput.value, 10);
        const returnAmt = parseInt(returnInput.value, 10);

        if (isNaN(investment) || isNaN(returnAmt)) return;

        // 連打防止
        btnDiagnose.disabled = true;
        btnFinishDay.disabled = true;

        // ローディング演出
        aiAdvice.style.display = 'none';
        aiLoader.style.display = 'flex';
        resultCard.style.display = 'none';

        const steps = [
            { text: '📊 投資データを送信中...', delay: 0 },
            { text: '🔍 予算消費率を算出中...', delay: 500 },
            { text: '🧠 冷静度マインドをスキャン中...', delay: 1000 },
            { text: '🤖 アドバイスを生成中...', delay: 1500 }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                loaderStep.textContent = step.text;
            }, step.delay);
        });

        setTimeout(() => {
            aiLoader.style.display = 'none';
            aiAdvice.style.display = 'block';

            // 診断の取得
            const diagnosis = getDiagnosis(investment, returnAmt);

            // 結果カードの表示
            resultCard.style.display = 'block';
            resultCard.className = `card result-card ${diagnosis.styleClass}`;
            resultTitle.textContent = diagnosis.title;
            
            const diff = returnAmt - investment;
            const sign = diff > 0 ? '+' : '';
            resultIncome.textContent = `¥${sign}${diff.toLocaleString()}`;
            resultIncome.className = `result-income ${diff > 0 ? 'plus' : diff < 0 ? 'minus' : ''}`;

            // レーダーバー更新
            updateRadarBar(radarControl, diagnosis.metrics.control);
            updateRadarBar(radarEfficiency, diagnosis.metrics.efficiency);
            updateRadarBar(radarRisk, diagnosis.metrics.risk);
            updateRadarBar(radarMind, diagnosis.metrics.mind);

            // AIアバター状態の反映
            updateAiAvatarState(diagnosis.avatarClass, diagnosis.avatarChar);

            // AIのアドバイス出力
            typeText(aiAdvice, diagnosis.advice, 20, () => {
                // 履歴に追加
                const now = new Date();
                const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                
                const newLog = {
                    id: Date.now(),
                    time: timeString,
                    raceName: raceName || `${history.length + 1}回目レース`,
                    investment: investment,
                    returnAmt: returnAmt,
                    balance: diff
                };

                history.push(newLog);
                saveData();
                updateDashboard();
                renderHistory();
                initOrUpdateChart();

                // フォームのクリア
                raceNameInput.value = '';
                investmentInput.value = '';
                returnInput.value = '';

                // 入力ロックの解除 (予算オーバーでなければ)
                const totalInvested = history.reduce((sum, item) => sum + item.investment, 0);
                const totalReturned = history.reduce((sum, item) => sum + item.returnAmt, 0);
                const totalLoss = totalInvested - totalReturned;
                const lossRatio = budget > 0 ? (totalLoss / budget) * 100 : 0;

                if (lossRatio >= 100) {
                    // 予算オーバー時は強制終了処理
                    lockAppForFinish();
                } else {
                    btnDiagnose.disabled = false;
                    btnFinishDay.disabled = false;
                }
            });

        }, 2000);
    });

    // レーダーバー更新補助
    function updateRadarBar(barElement, value) {
        barElement.style.width = '0%';
        barElement.className = 'radar-bar';
        
        setTimeout(() => {
            barElement.style.width = `${value}%`;
            if (value >= 75) {
                barElement.classList.add('bar-success');
            } else if (value >= 40) {
                barElement.classList.add('bar-warning');
            } else {
                barElement.classList.add('bar-danger');
            }
        }, 100);
    }

    // --- 今日のレースを終了する機能 ---
    btnFinishDay.addEventListener('click', () => {
        if (history.length === 0) {
            if (!confirm('まだ1件も記録がありません。このまま本日の競馬を終了しますか？')) {
                return;
            }
        } else {
            if (!confirm('今日の競馬を終了し、結果を確定しますか？終了すると追加の記録ができなくなります。')) {
                return;
            }
        }
        
        isFinished = true;
        saveData();
        lockAppForFinish();
    });

    // 終了ロック処理
    function lockAppForFinish() {
        isFinished = true;
        
        // フォームやボタンの非活性化
        btnDiagnose.disabled = true;
        btnFinishDay.disabled = true;
        raceNameInput.disabled = true;
        investmentInput.disabled = true;
        returnInput.disabled = true;
        btnClearHistory.disabled = true;
        
        // 履歴行の削除ボタンも無効化
        renderHistory();

        // 最終評価の算出
        let totalInvestment = 0;
        let totalReturn = 0;
        history.forEach(item => {
            totalInvestment += item.investment;
            totalReturn += item.returnAmt;
        });

        const totalBalance = totalReturn - totalInvestment;
        const recoveryRate = totalInvestment > 0 ? Math.round((totalReturn / totalInvestment) * 100) : 0;
        const loss = totalInvestment - totalReturn;
        const lossRatio = budget > 0 ? (loss / budget) * 100 : 0;

        // 最終評価表示の更新
        const sign = totalBalance > 0 ? '+' : '';
        finishBalanceEl.textContent = `¥${sign}${totalBalance.toLocaleString()}`;
        finishBalanceEl.className = `val ${totalBalance > 0 ? 'plus' : totalBalance < 0 ? 'minus' : ''}`;
        finishRecoveryRateEl.textContent = `${recoveryRate}%`;
        finishRecoveryRateEl.className = `val ${recoveryRate >= 100 ? 'plus' : recoveryRate >= 50 ? 'warning' : 'minus'}`;
        finishRaceCountEl.textContent = `${history.length}回`;

        // 終了時AI総評のテキスト生成
        let finishAdvice = '';
        if (totalBalance > 0) {
            updateAiAvatarState('state-win', '🤩');
            finishAdvice = `素晴らしい！本日は最終的にプラス収支で見事に逃げ切りましたね！
回収率は驚異の ${recoveryRate}% です。勝っている段階で「レース終了」ボタンを自ら押して利益を確定させたその自制心は、プロの馬券師並みです。今日の勝ち分は競馬の場に置いていかず、即座に出金して美味しいものでも食べてください。この勝利体験を誇りに思い、次回も冷静に臨みましょう！`;
        } else if (totalBalance === 0) {
            updateAiAvatarState('', '😐');
            finishAdvice = `本日はトントン（プラマイゼロ）での決着となりました。
実質的に損失なく楽しめたのは良い結果です。熱くなって追加入金することなく、ここでしっかりと自制して終了できたのは素晴らしい判断力です。次は少しだけ回収率を高められるよう、今回の買い方を振り返ってみましょう。お疲れ様でした！`;
        } else {
            // マイナスの場合
            if (lossRatio >= 100) {
                updateAiAvatarState('state-danger', '👿');
                finishAdvice = `警告：本日は予算枠をすべて使い果たす結果（予算比 ${Math.round(lossRatio)}%の損失）となりました。
これは自制のルールが機能しなかったことを示しています。非常に悔しいとは思いますが、絶対に「他からお金を持ってきて取り返す」勝負はしないでください。競馬は長期的に楽しむ娯楽です。まずは財布を閉じて、冷静になる時間を作りましょう。この悔しさを次回の予算コントロールに必ず活かしてください。`;
            } else if (lossRatio >= 50) {
                updateAiAvatarState('state-danger', '🚨');
                finishAdvice = `本日は予算の半分以上（予算比 ${Math.round(lossRatio)}%の損失）を失う手痛い敗戦となりました。
しかし、予算のすべてを溶かしきる前に、ここで「レース終了」を選び撤退できたのは非常に大きな一歩です。残った資金は、次の戦いに備えるための大切な軍資金になります。今回はなぜ予想が噛み合わなかったのか、グラフを眺めながら冷静に分析してみましょう。反省こそが力になります。`;
            } else {
                updateAiAvatarState('state-warn', '🧐');
                finishAdvice = `本日のトータル収支は微減（予算比 ${Math.round(lossRatio)}%の損失）となりました。
損失を軽微な範囲に抑えて終了できたのは、非常に優れた自己コントロール力の証です。競馬において、大負けを防ぐスキルは勝つこと以上に重要です。今回の反省点（オッズの見極め、無駄なレース選びがなかったか等）を整理しておけば、次回はきっとプラスに持っていけるはずです。お疲れ様でした！`;
            }
        }

        // サマリーカードのフェードイン表示
        finishSummaryCard.classList.remove('hidden');
        inputCard.classList.add('hidden');

        // AI総評タイピング
        typeText(finishAiAdviceEl, finishAdvice, 15);
    }

    // --- 日付リセット処理 ---
    btnResetDay.addEventListener('click', () => {
        if (confirm('今日のデータをクリアし、予算設定から新しく始めますか？ (本日記録したすべての収支とグラフが消去されます)')) {
            // ストレージクリア
            localStorage.removeItem('keiba_v2_budget');
            localStorage.removeItem('keiba_v2_history');
            localStorage.removeItem('keiba_v2_finished');
            
            budget = 0;
            history = [];
            isFinished = false;
            
            // UIの初期化
            budgetInput.value = '';
            raceNameInput.value = '';
            investmentInput.value = '';
            returnInput.value = '';
            
            // 活性化
            raceNameInput.disabled = false;
            investmentInput.disabled = false;
            returnInput.disabled = false;
            
            finishSummaryCard.classList.add('hidden');
            inputCard.classList.remove('hidden');
            
            if (keibaChart) {
                keibaChart.destroy();
                keibaChart = null;
            }
            
            // 画面を予算設定に戻す
            loadData();
        }
    });

    // --- Chart.js グラフ制御 ---
    function initOrUpdateChart() {
        const ctx = document.getElementById('keiba-chart').getContext('2d');
        
        // データの組み立て
        // X軸ラベル：['開始', '第1レース', '第2レース', ...]
        const labels = ['開始'];
        // Y軸データ：累積収支の推移 [0, -1000, +500, ...]
        const chartData = [0];
        
        let cumulativeBalance = 0;
        history.forEach((item, index) => {
            cumulativeBalance += (item.returnAmt - item.investment);
            labels.push(item.raceName || `${index + 1}戦目`);
            chartData.push(cumulativeBalance);
        });

        // 予算リミットライン（常にマイナス予算額）
        const limitLineData = Array(chartData.length).fill(-budget);

        if (keibaChart) {
            // 既存グラフの更新
            keibaChart.data.labels = labels;
            keibaChart.data.datasets[0].data = chartData;
            keibaChart.data.datasets[1].data = limitLineData;
            keibaChart.options.scales.y.min = Math.min(-budget * 1.2, ...chartData) - 1000;
            keibaChart.options.scales.y.max = Math.max(budget * 0.5, ...chartData) + 1000;
            keibaChart.update();
        } else {
            // 新規作成
            keibaChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'トータル収支',
                            data: chartData,
                            borderColor: '#8b5cf6',
                            borderWidth: 3,
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#a78bfa',
                            pointBorderColor: '#fff',
                            pointRadius: 5,
                            pointHoverRadius: 7
                        },
                        {
                            label: '予算上限ライン',
                            data: limitLineData,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0,
                            pointHoverRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e5e7eb',
                                font: {
                                    family: "'Inter', 'Noto Sans JP', sans-serif",
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += '¥' + context.parsed.y.toLocaleString();
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: {
                                    family: "'Inter', 'Noto Sans JP', sans-serif"
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: {
                                    family: "'Inter', 'Noto Sans JP', sans-serif"
                                },
                                callback: function(value) {
                                    return '¥' + value.toLocaleString();
                                }
                            },
                            min: Math.min(-budget * 1.2, ...chartData) - 1000,
                            max: Math.max(budget * 0.5, ...chartData) + 1000
                        }
                    }
                }
            });
        }
    }

    // アプリ起動データの初期ロード
    loadData();
});
