// 競馬使いすぎ防止サポーター AI (v1) - コアスクリプト

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const totalInvestmentEl = document.getElementById('total-investment');
    const totalReturnEl = document.getElementById('total-return');
    const totalBalanceEl = document.getElementById('total-balance');
    const cardTotalBalance = document.getElementById('card-total-balance');

    const raceForm = document.getElementById('race-form');
    const raceNameInput = document.getElementById('race-name');
    const investmentInput = document.getElementById('investment-input');
    const returnInput = document.getElementById('return-input');
    const btnDiagnose = document.getElementById('btn-diagnose');

    const aiAvatar = document.getElementById('ai-avatar');
    const aiAdvice = document.getElementById('ai-advice');
    const aiLoader = document.getElementById('ai-loader');
    const loaderStep = document.getElementById('loader-step');

    const resultCard = document.getElementById('result-card');
    const resultTitle = document.getElementById('result-title');
    const resultIncome = document.getElementById('result-income');
    const radarControl = document.getElementById('radar-control');
    const radarEfficiency = document.getElementById('radar-efficiency');
    const radarRisk = document.getElementById('radar-risk');
    const radarMind = document.getElementById('radar-mind');

    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const noHistoryMsg = document.getElementById('no-history-msg');

    // 状態変数
    let history = [];
    let isTyping = false;

    // ローカルストレージから履歴を読み込む
    function loadHistory() {
        const storedHistory = localStorage.getItem('keiba_history_v1');
        if (storedHistory) {
            try {
                history = JSON.parse(storedHistory);
            } catch (e) {
                console.error('履歴データのパースに失敗しました。', e);
                history = [];
            }
        }
        updateDashboard();
        renderHistory();
    }

    // 履歴をローカルストレージに保存
    function saveHistory() {
        localStorage.setItem('keiba_history_v1', JSON.stringify(history));
    }

    // ダッシュボードの更新
    function updateDashboard() {
        let totalInvestment = 0;
        let totalReturn = 0;

        history.forEach(item => {
            totalInvestment += item.investment;
            totalReturn += item.returnAmt;
        });

        const totalBalance = totalReturn - totalInvestment;

        // テキスト表示の更新
        totalInvestmentEl.textContent = `¥${totalInvestment.toLocaleString()}`;
        totalReturnEl.textContent = `¥${totalReturn.toLocaleString()}`;
        
        const balanceSign = totalBalance > 0 ? '+' : '';
        totalBalanceEl.textContent = `¥${balanceSign}${totalBalance.toLocaleString()}`;

        // トータル収支のスタイルクラス切り替え
        cardTotalBalance.className = 'summary-card';
        if (totalBalance > 0) {
            cardTotalBalance.classList.add('status-win');
        } else if (totalBalance < 0) {
            cardTotalBalance.classList.add('status-lose');
        }
    }

    // 履歴リストの描画
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            noHistoryMsg.style.display = 'block';
            return;
        }
        noHistoryMsg.style.display = 'none';

        // 新しい履歴が上に来るように逆順で描画
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
            deleteBtn.title = 'この項目を削除';
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

    // 履歴アイテムの削除
    function deleteHistoryItem(id) {
        history = history.filter(item => item.id !== id);
        saveHistory();
        updateDashboard();
        renderHistory();
        
        // AIアバターの感情を現在のトータル収支に合わせてリセット
        updateAiMoodOnLoad();
    }

    // 全履歴クリア
    btnClearHistory.addEventListener('click', () => {
        if (history.length === 0) return;
        
        if (confirm('本日のすべての履歴を消去してよろしいですか？')) {
            history = [];
            saveHistory();
            updateDashboard();
            renderHistory();
            
            // AIリセット
            aiAvatar.className = 'ai-avatar';
            aiAvatar.textContent = '🤖';
            aiAdvice.textContent = '履歴をクリアしました。新しい戦績を入力して診断を始めましょう。';
            resultCard.style.display = 'none';
        }
    });

    // 1文字ずつ出力するタイピングエフェクト
    function typeText(element, text, speed = 25, callback = null) {
        element.innerHTML = '';
        element.classList.add('typing-caret');
        let index = 0;
        isTyping = true;

        function type() {
            if (index < text.length) {
                // 改行コードを反映
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

    // AIの感情表情とアバターカラーを更新する
    function updateAiAvatarState(moodClass, avatarChar) {
        aiAvatar.className = 'ai-avatar';
        if (moodClass) {
            aiAvatar.classList.add(moodClass);
        }
        aiAvatar.textContent = avatarChar;
    }

    // 起動時のAI感情調整
    function updateAiMoodOnLoad() {
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

        if (totalBalance > 0) {
            if (totalBalance >= 100000) {
                updateAiAvatarState('state-win', '🤩');
            } else {
                updateAiAvatarState('state-win', '😊');
            }
        } else if (totalBalance < 0) {
            const loss = Math.abs(totalBalance);
            if (loss >= 100000) {
                updateAiAvatarState('state-danger', '👿');
            } else if (loss >= 30000) {
                updateAiAvatarState('state-danger', '🚨');
            } else {
                updateAiAvatarState('state-warn', '⚠️');
            }
        } else {
            updateAiAvatarState('', '😐');
        }
    }

    // 診断実行処理
    raceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (isTyping) return; // タイピング中の連打防止

        const raceName = raceNameInput.value.trim();
        const investment = parseInt(investmentInput.value, 10);
        const returnAmt = parseInt(returnInput.value, 10);

        if (isNaN(investment) || isNaN(returnAmt)) return;

        const balance = returnAmt - investment;

        // フォームを一時的に無効化
        btnDiagnose.disabled = true;

        // AIのローディング・分析演出を開始
        aiAdvice.style.display = 'none';
        aiLoader.style.display = 'flex';
        resultCard.style.display = 'none';

        const steps = [
            { text: '📊 投資データを送信中...', delay: 0 },
            { text: '🔍 資金効率と回収率を算出中...', delay: 600 },
            { text: '🧠 マインド冷静度を推測中...', delay: 1200 },
            { text: '🤖 アドバイスを作成中...', delay: 1800 }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                loaderStep.textContent = step.text;
            }, step.delay);
        });

        // 分析完了後の処理
        setTimeout(() => {
            aiLoader.style.display = 'none';
            aiAdvice.style.display = 'block';

            // レポートデータとAIメッセージの決定
            const diagnosis = getDiagnosis(investment, returnAmt);
            
            // 診断カード表示
            resultCard.style.display = 'block';
            resultCard.className = `card result-card ${diagnosis.styleClass}`;
            resultTitle.textContent = diagnosis.title;
            
            const sign = balance > 0 ? '+' : '';
            resultIncome.textContent = `¥${sign}${balance.toLocaleString()}`;
            resultIncome.className = `result-income ${balance > 0 ? 'plus' : balance < 0 ? 'minus' : ''}`;

            // レーダーバーのアニメーション
            updateRadarBar(radarControl, diagnosis.metrics.control);
            updateRadarBar(radarEfficiency, diagnosis.metrics.efficiency);
            updateRadarBar(radarRisk, diagnosis.metrics.risk);
            updateRadarBar(radarMind, diagnosis.metrics.mind);

            // AIアバター表情の即時反映
            updateAiAvatarState(diagnosis.avatarClass, diagnosis.avatarChar);

            // AIテキストのタイピング出力
            typeText(aiAdvice, diagnosis.advice, 20, () => {
                btnDiagnose.disabled = false;
                
                // 診断成功後に履歴に追加してダッシュボードを更新する
                const now = new Date();
                const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                
                const newLog = {
                    id: Date.now(),
                    time: timeString,
                    raceName: raceName,
                    investment: investment,
                    returnAmt: returnAmt,
                    balance: balance
                };

                history.push(newLog);
                saveHistory();
                updateDashboard();
                renderHistory();

                // フォームのクリア
                raceNameInput.value = '';
                investmentInput.value = '';
                returnInput.value = '';
            });

        }, 2400);
    });

    // レーダーバーに値をセットし、必要に応じて色を切り替える
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

    // 金額に応じたアドバイスと指標の返却ロジック
    function getDiagnosis(invest, ret) {
        const balance = ret - invest;
        
        let styleClass = '';
        let title = '';
        let advice = '';
        let avatarClass = '';
        let avatarChar = '🤖';
        let metrics = { control: 50, efficiency: 50, risk: 50, mind: 50 };

        if (balance > 0) {
            // 勝ちの場合
            if (balance >= 100000) {
                styleClass = 'win-huge';
                title = '競馬の才能あり！神予想';
                advice = `見事な大勝利！10万円以上の大幅プラスです！今日の予想は完全に研ぎ澄まされていましたね！素晴らしい分析力と決断力です！

……しかし、ここからが非常に重要な忠告です。これだけの大勝ちを体験すると、脳は「次も簡単に勝てる」と錯覚してしまいます。その油断が、次のレースで掛け金を2倍、3倍にしてしまい、結果として今日の利益はおろか元本まで溶かしてしまう大きな罠になり得ます。
今日の勝ち分は即座に口座から出金するか、財布の奥にしまってください。今日の競馬はここで「完全終了」にして、美味しいものでも食べて余韻に浸るのが最も賢い選択です。油断は禁物ですよ！`;
                avatarClass = 'state-win';
                avatarChar = '🤩';
                metrics = { control: 75, efficiency: 100, risk: 35, mind: 60 };
            } 
            else if (balance >= 30000) {
                styleClass = 'win-medium';
                title = '素晴らしい！見事な大勝ち';
                advice = `おめでとうございます！3万円以上の素晴らしい利益を獲得しましたね。あなたの戦略と買い目の組み立てが見事に功を奏しました！

素晴らしい結果ですが、次のレースでこの喜びの勢いに任せてお金を使い過ぎないよう、厳重に気をつけましょう。人間は勝っている時ほど、予算のブレーキが緩みがちになります。「まだ浮いているから」という甘い気持ちで追加のレースに手を出せば、あっという間に利益が吹き飛びます。
本日の予算ルールを再度確認し、もし次をやるとしても最初のベース額（千円単位など）を崩さずに冷静に挑むか、本日はここで撤退することをお勧めします。`;
                avatarClass = 'state-win';
                avatarChar = '😊';
                metrics = { control: 80, efficiency: 90, risk: 50, mind: 75 };
            } 
            else if (balance >= 10000) {
                styleClass = 'win-small';
                title = 'お見事！嬉しい勝利';
                advice = `おめでとうございます！1万円以上の確かなプラス収支ですね。堅実に利益を出せたのはとても素晴らしい成果です！

この調子で次もいきたいところですが、お金の使いすぎには十分気をつけてください。せっかく手に入れた1万円のプラスです。次のレースの追加資金としてプールするのではなく、「美味しい焼肉を食べる」「欲しかったものを買う」など、実生活の幸せに還元してみてはいかがでしょうか。
競馬の資金として場の中に滞留させておくと、すぐに吸い取られてしまいます。次のレースは賭け金をさらに抑えて冷静にいきましょう。`;
                avatarClass = 'state-win';
                avatarChar = '👍';
                metrics = { control: 85, efficiency: 80, risk: 70, mind: 80 };
            } 
            else {
                styleClass = 'win-small';
                title = 'おめでとう！手堅い勝利';
                advice = `おめでとうございます！少しでもプラスで終えられたのは非常に素晴らしいことです。冷静な買い目選択の賜物ですね。

しかし、人間はわずかでも勝つと「欲」が生まれてしまい、「次はもっと賭け金を増やせば大きく儲かるのでは？」と考えがちです。それが使いすぎへの第一歩です。
次のレースでも決して賭け金を吊り上げず、常に最初に決めたミニマムな金額を守るように心がけてください。コツコツ勝つことが、結果的に財布を守り長く楽しむ秘訣です。`;
                avatarClass = 'state-win';
                avatarChar = '😊';
                metrics = { control: 90, efficiency: 70, risk: 80, mind: 85 };
            }
        } 
        else if (balance === 0) {
            // トントンの場合
            styleClass = 'draw';
            title = 'セーフ！トントンで着地';
            advice = `プラスマイナスゼロ、実質的なセーフです！スリルを楽しみつつも資金を失わずに済んだのは、良い結果と言えるでしょう。

ここで「次こそは勝つ！」と熱くなって追加入金するのは一番危険なパターンです。トントンで終えられた幸運に感謝し、本日の予算制限をしっかりと維持しましょう。もし次のレースに挑む場合も、当初決めていた上限額を絶対にオーバーしないよう、細心の注意を払ってください。`;
            avatarClass = '';
            avatarChar = '😐';
            metrics = { control: 85, efficiency: 50, risk: 80, mind: 80 };
        } 
        else {
            // 負けの場合
            const loss = Math.abs(balance);
            if (loss >= 100000) {
                styleClass = 'lose-huge';
                title = '【緊急】即刻競馬禁止令';
                advice = `【警告：極めて危険です】
10万円以上の極めて深刻な損失を検知しました。これは単なる娯楽の範囲を完全に超えており、直ちに競馬をストップする必要があります！

絶対に「次のレースで一発逆転させて取り戻す」と考えないでください。それはさらに負けを広げて生活を破綻させる最悪のスパイラルです。熱くなった頭で予想した馬券は絶対に当たりません。
即座にすべての投票アプリからログアウトし、クレジットカードや現金を財布の奥底にしまいましょう。今すぐ競馬場やWINSから退出し、頭を冷やすために帰路についてください。今日のゲームは完全終了です。これ以上の勝負は絶対に禁止します。`;
                avatarClass = 'state-danger';
                avatarChar = '👿';
                metrics = { control: 5, efficiency: 10, risk: 5, mind: 5 };
            } 
            else if (loss >= 30000) {
                styleClass = 'lose-medium';
                title = '【警告】厳重注意・大打撃';
                advice = `【注意喚起：危険ゾーンに突入】
3万円以上の手痛い損失が発生しています。冷や汗が出ているのではないでしょうか。今すぐ軌道修正が必要です。

ここから失った分を取り返そうとして、購入額を増やしたりオッズの高い穴馬に無茶に突っ込んだりするのは、大負けする典型的な罠です。今日の戦績はここまでとし、ストップする勇気を持ってください。
一旦スマホをテーブルに置き、冷たい水を飲むか深呼吸をしてください。冷静さを失った状態での勝負は、相手（主催者）の思うツボです。財布に鍵をかけましょう。`;
                avatarClass = 'state-danger';
                avatarChar = '🚨';
                metrics = { control: 25, efficiency: 20, risk: 15, mind: 20 };
            } 
            else if (loss >= 10000) {
                styleClass = 'lose-small';
                title = '【注意】イエローカード';
                advice = `1万円以上のマイナスが発生しました。黄色信号が点滅しています。「まあいいか」と放置していると、損失はさらに拡大します。

本日の当初の予算上限をオーバーしていませんか？もしこれ以上のマイナスが許容できないなら、今日の競馬はここで打ち切るのが最も賢明です。
もし続けるとしても、賭ける金額をこれまでの半分以下にするか、最も自信のある1レースのみに絞るなど、厳しい自己制限を課してください。熱くならずに気を引き締めましょう。`;
                avatarClass = 'state-warn';
                avatarChar = '⚠️';
                metrics = { control: 50, efficiency: 40, risk: 40, mind: 45 };
            } 
            else {
                styleClass = 'lose-small';
                title = '気をつけよう！小休止の推奨';
                advice = `今回は少しマイナスになってしまいましたね。悔しい気持ちは理解できますが、これくらいの額であればまだ致命傷ではありません。

焦ってすぐ次のレースで取り返そうとすると、買い方が荒くなって傷口を広げます。一旦立ち止まり、次の予想は少し時間をかけるか、賭け金をさらに少額に落として冷静に進めましょう。競馬は楽しむものです。予算を守り、自分のペースを崩さないよう気をつけましょう！`;
                avatarClass = 'state-warn';
                avatarChar = '🧐';
                metrics = { control: 70, efficiency: 45, risk: 65, mind: 60 };
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

    // アプリ起動時の初期ロード
    loadHistory();
});
