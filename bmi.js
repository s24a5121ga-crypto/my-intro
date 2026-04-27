document.addEventListener('DOMContentLoaded', () => {
    // Scroll Animation Logic using Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // 1度だけアニメーションさせる
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // BMI Calculator Logic
    const calculateBtn = document.getElementById('calculate-btn');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const resultContainer = document.getElementById('result-container');
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiCategoryEl = document.getElementById('bmi-category');
    const bmiDescriptionEl = document.getElementById('bmi-description');

    calculateBtn.addEventListener('click', () => {
        const heightCm = parseFloat(heightInput.value);
        const weightKg = parseFloat(weightInput.value);

        if (isNaN(heightCm) || isNaN(weightKg) || heightCm <= 0 || weightKg <= 0) {
            alert('正しい身長と体重を入力してください。');
            return;
        }

        // 計算式: 体重(kg) / (身長(m) * 身長(m))
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        const roundedBmi = bmi.toFixed(1);

        displayResult(roundedBmi);
        
        // 結果エリアを表示し、その中の要素もアニメーション対象にする
        resultContainer.classList.remove('hidden');
        
        // DOMの更新を待ってからフェードインさせる
        setTimeout(() => {
            const resultFadeElements = resultContainer.querySelectorAll('.fade-in');
            resultFadeElements.forEach(el => {
                el.classList.remove('visible'); // 一旦リセット
                // 少し遅延を入れて再適用（スムーズな表示のため）
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, 50);
                });
            });
            // ユーザーが見やすいように結果エリアへスクロール
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    });

    function displayResult(bmi) {
        bmiValueEl.textContent = bmi;
        
        let category = '';
        let colorVar = '';
        let desc = '';

        if (bmi < 18.5) {
            category = '低体重';
            colorVar = 'var(--color-underweight)';
            desc = 'BMI 18.5未満。標準体重に満たない状態です。バランスの良い食事を心がけましょう。';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = '普通体重';
            colorVar = 'var(--color-normal)';
            desc = 'BMI 18.5〜25未満。標準的な体重です。現在の健康的な生活習慣を維持しましょう！';
        } else if (bmi >= 25 && bmi < 30) {
            category = '肥満(1度)';
            colorVar = 'var(--color-obese1)';
            desc = 'BMI 25〜30未満。少し体重が多めです。適度な運動と食事の見直しを検討しましょう。';
        } else if (bmi >= 30 && bmi < 35) {
            category = '肥満(2度)';
            colorVar = 'var(--color-obese2)';
            desc = 'BMI 30〜35未満。健康リスクが高まる可能性があります。専門家への相談も検討してください。';
        } else if (bmi >= 35 && bmi < 40) {
            category = '肥満(3度)';
            colorVar = 'var(--color-obese3)';
            desc = 'BMI 35〜40未満。高度な肥満状態です。医療機関での受診を強くおすすめします。';
        } else {
            category = '肥満(4度)';
            colorVar = 'var(--color-obese4)';
            desc = 'BMI 40以上。健康に重大な影響を及ぼす可能性があります。速やかに医療機関にご相談ください。';
        }

        bmiCategoryEl.textContent = category;
        bmiCategoryEl.style.backgroundColor = colorVar;
        bmiCategoryEl.style.color = '#000'; // 黒文字にしてコントラストを保つ
        bmiDescriptionEl.textContent = desc;
        bmiValueEl.style.color = colorVar;
    }
});
