import type { Page } from 'playwright';
import { chromium } from 'playwright';

export async function jubjub(url: string, naverId: string, naverPassword: string): Promise<void> {
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
        ],
    });
    const context = await browser.newContext({
        locale: 'ko-KR',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    console.log(`naverLogin: ${naverId}/${naverPassword}`);
    await _naverLogin(page, naverId, naverPassword);

    await page.goto(url);

    let body = page.locator('.post_view');
    if ((await body.count()) === 0) {
        // '.post_view' 로케이터를 찾지 못했을 경우를 위한 폴백
        // 예: https://damoang.net/economy/53800
        body = page.locator('#bo_v_con.economy-user-text');
        console.log('다모앙 링크로 접속: ', await body.count());
    }
    const links = await body.getByRole('link').all();

    console.log('links count: ' + links.length);

    const naverLinkUrls: string[] = [];
    for (const link of links) {
        const title = await link.innerText();
        const href = await link.getAttribute('href');
        if (title.includes('naver') && href) {
            naverLinkUrls.push(href);
        }
    }
    console.log('naverLinks count: ' + naverLinkUrls.length);

    const tasks = naverLinkUrls.map(async (linkUrl) => {
        const newPage = await page.context().newPage();
        try {
            await newPage.goto(linkUrl);
            await newPage.waitForTimeout(1000);
            const pointButton = newPage.getByRole('link', { name: '포인트 받기' });
            if (await pointButton.isVisible()) {
                await pointButton.click();
            }
        } catch (e) {
            console.error(`Failed to process ${linkUrl}:`, e);
        } finally {
            await newPage.waitForTimeout(5000);
            await newPage.close();
        }
    });
    await Promise.all(tasks);

    try {
        // 보험 적립 작업 시작
        console.log('보험 적립 작업 시작...');
        await page.goto('https://insurance.pay.naver.com/?inflow=point_category');
        await page.waitForTimeout(5000);

        // 미션 카드 요소들을 찾음 (클래스명 일부 매칭)
        const missions = page.locator('a[class*="PointMission"]');
        const count = await missions.count();
        console.log(`발견된 보험 미션: ${count}개`);

        for (let i = 0; i < Math.min(count, 5); i++) {
            console.log(`보험 미션 ${i + 1} 시도 중...`);
            await missions.nth(i).click();
            await page.waitForTimeout(6000);

            // 미션 상세 페이지에서도 포인트 받기 버튼이 있다면 시도
            const detailPointBtn = page.getByRole('link', { name: /포인트.*받기|혜택.*받기/ });
            if (await detailPointBtn.isVisible()) {
                await detailPointBtn.click();
                await page.waitForTimeout(5000);
            }

            await page.goBack(); // 브라우저 백으로 복귀
            await page.waitForTimeout(5000);
        }
    } catch (e) {
        console.error('보험 적립 중 오류 발생:', e);
    }

    await browser.close();
}

async function _naverLogin(page: Page, id: string, pwd: string): Promise<void> {
    await page.goto('https://nid.naver.com/nidlogin.login');
    await page.locator('#id').fill(id);
    await page.locator('#pw').fill(pwd);
    await page.getByText('로그인 상태 유지').click();
    await page.getByRole('button', { name: '로그인' }).click();

    // 로그인 허용 환경 등록 (없을 수 있음)
    try {
        const registerBtn = page.getByRole('link', { name: '등록', exact: true });
        await registerBtn.waitFor({ state: 'visible', timeout: 3000 });
        await registerBtn.click();
    } catch {
        console.log('기기 등록 단계 스킵');
    }
}
