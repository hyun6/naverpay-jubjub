import type { Page } from 'playwright';
import { chromium } from 'playwright';

export async function jubjub(url: string, naverId: string, naverPassword: string): Promise<boolean> {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        locale: 'ko-KR',
    });
    const page = await context.newPage();

    console.log(`naverLogin: ${naverId}`);
    const loginSuccess = await _naverLogin(page, naverId, naverPassword);
    if (!loginSuccess) {
        console.error('로그인 실패');
        await browser.close();
        return false;
    }
    console.log('로그인 성공');

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

    // 동시 실행 수 제한 (CONCURRENCY 환경변수로 제어, 없으면 전체 병렬)
    const concurrency = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : naverLinkUrls.length;

    const processLink = async (linkUrl: string) => {
        const newPage = await page.context().newPage();
        try {
            await newPage.goto(linkUrl);
            await newPage.waitForTimeout(1000);
            const pointButton = newPage.getByRole('link', { name: '포인트 받기' });
            if (await pointButton.isVisible()) {
                await pointButton.click();
                console.log(`포인트 받기 클릭: ${linkUrl}`);
            }
        } catch (e) {
            console.error(`Failed to process ${linkUrl}:`, e);
        } finally {
            await newPage.waitForTimeout(5000);
            await newPage.close();
        }
    };

    // 동시 실행 제한 적용
    for (let i = 0; i < naverLinkUrls.length; i += concurrency) {
        const batch = naverLinkUrls.slice(i, i + concurrency);
        await Promise.all(batch.map(processLink));
    }

    try {
        // 보험 3번 클릭
        await page.goto('https://insurance.pay.naver.com/?inflow=point_category');
        for (let i = 0; i < 3; i++) {
            await page.getByRole('button').locator('nth=0').click();
            await page.waitForTimeout(6000);
            await page.getByRole('button', { name: '뒤로가기' }).click();
        }
    } catch (e) {
        console.log('보험 적립 실패');
    }

    await browser.close();
    return true;
}

async function _naverLogin(page: Page, id: string, pwd: string): Promise<boolean> {
    try {
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

        // 로그인 성공 여부 확인 (네이버 메인 또는 다른 페이지로 이동했는지)
        await page.waitForLoadState('domcontentloaded');
        const currentUrl = page.url();
        if (currentUrl.includes('nidlogin.login')) {
            console.log('로그인 페이지에서 벗어나지 못함');
            return false;
        }
        return true;
    } catch (e) {
        console.error('로그인 중 오류:', e);
        return false;
    }
}
