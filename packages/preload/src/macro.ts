import type { Page } from 'playwright';
import { chromium } from 'playwright';

export async function jubjub(url: string, naverId: string, naverPassword: string): Promise<void> {
  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext({
    locale: 'ko-KR',
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
}

async function _naverLogin(page: Page, id: string, pwd: string): Promise<void> {
  await page.goto('https://nid.naver.com/nidlogin.login');
  await page.locator('#id').fill(id);
  await page.locator('#pw').fill(pwd);
  await page.getByText('로그인 상태 유지').click();
  await page.getByRole('button', { name: '로그인' }).click();
  await page.getByRole('link', { name: '등록', exact: true }).click(); // 로그인 허용 환경 등록
}
