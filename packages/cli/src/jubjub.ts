import type { Page } from 'playwright';
import { chromium } from 'playwright';
import { logger } from './logger';

export async function jubjub(url: string, naverId: string, naverPassword: string): Promise<boolean> {
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

    logger.info(`naverLogin: ${naverId}`);
    const loginSuccess = await _naverLogin(page, naverId, naverPassword);
    if (!loginSuccess) {
        logger.error('로그인 실패');
        await browser.close();
        return false;
    }
    logger.info('로그인 성공');

    await page.goto(url);

    let body = page.locator('.post_view');
    if ((await body.count()) === 0) {
        // '.post_view' 로케이터를 찾지 못했을 경우를 위한 폴백
        // 예: https://damoang.net/economy/53800
        body = page.locator('#bo_v_con.economy-user-text');
        logger.info('다모앙 링크로 접속: ', await body.count());
    }
    const links = await body.getByRole('link').all();

    logger.info('links count: ' + links.length);

    const naverLinkUrls: string[] = [];
    for (const link of links) {
        const title = await link.innerText();
        const href = await link.getAttribute('href');
        if (title.toLowerCase().includes('naver') && href) {
            naverLinkUrls.push(href);
        }
    }
    logger.info('naverLinks count: ' + naverLinkUrls.length);

    // 동시 실행 수 제한 (CONCURRENCY 환경변수로 제어, 없으면 전체 병렬)
    const concurrency = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : naverLinkUrls.length;

    // 성공/실패 카운트
    let successCount = 0;
    let failCount = 0;

    const processLink = async (linkUrl: string) => {
        const newPage = await page.context().newPage();
        try {
            await newPage.goto(linkUrl);
            await newPage.waitForTimeout(2000);
            // 정규표현식을 사용하여 '포인트 받기', '혜택받기', '클릭 ?원' 등 다양한 명칭에 대응
            const pointButton = newPage.getByRole('link', { name: /포인트.*받기|혜택.*받기|클릭.*원/ });
            try {
                await pointButton.waitFor({ state: 'visible', timeout: 5000 });
                await pointButton.click();
                logger.info(`포인트 받기 클릭 성공: ${linkUrl}`);
                successCount++;
            } catch {
                logger.info(`포인트 버튼 미노출 (이미 받았거나 다른 형식): ${linkUrl}`);
            }
        } catch (e) {
            logger.error(`Failed to process ${linkUrl}:`, e);
            failCount++;
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

    logger.info(`\n=== 포인트 적립 결과: 성공 ${successCount}건, 실패 ${failCount}건 ===\n`);

    try {
        logger.info('보험 적립 작업 시작...');
        await page.goto('https://insurance.pay.naver.com/?inflow=point_category');
        await page.waitForTimeout(5000);

        // 미션 카드 요소들을 찾음 (클래스명 일부 매칭)
        const missions = page.locator('a[class*="PointMission"]');
        const count = await missions.count();
        logger.info(`발견된 보험 미션: ${count}개`);

        for (let i = 0; i < Math.min(count, 5); i++) {
            logger.info(`보험 미션 ${i + 1} 시도 중...`);
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
        logger.error('보험 적립 중 오류 발생:', e);
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
            logger.info('기기 등록 단계 스킵');
        }

        // 로그인 성공 여부 확인 (네이버 메인 또는 다른 페이지로 이동했는지)
        await page.waitForLoadState('domcontentloaded');
        const currentUrl = page.url();
        if (currentUrl.includes('nidlogin.login')) {
            logger.info('로그인 페이지에서 벗어나지 못함');
            return false;
        }
        return true;
    } catch (e) {
        logger.error('로그인 중 오류:', e);
        return false;
    }
}
