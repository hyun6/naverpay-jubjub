import type { Page } from 'playwright';
import { chromium } from 'playwright';

export async function jubjub(url: string, naverId: string, naverPassword: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    locale: 'ko-KR',
  });

  console.log(`naverLogin: ${naverId}/${naverPassword}`);
  await _naverLogin(page, naverId, naverPassword);

  await page.goto(url);
  const body = await page.locator(
    '#div_content > div.post_view > div.post_content > article > div',
  );
  const linkCnt = await body.getByRole('link').count();
  console.log('count: ' + linkCnt);

  for (let i = 0; i < linkCnt; i++) {
    const link = await body.getByRole('link').nth(i);
    const title = await link.innerText();
    if (title.includes('naver.com')) {
      await link.click();
    }
  }
}

async function _naverLogin(page: Page, id: string, pwd: string): Promise<void> {
  await page.goto('https://nid.naver.com/nidlogin.login');
  await page.getByRole('textbox', { name: '아이디' }).fill(id);
  await page.getByPlaceholder('비밀번호').fill(pwd);
  await page.getByText('로그인 상태 유지').click();
  await page.getByRole('button', { name: '로그인' }).click();
  await page.getByRole('link', { name: '등록', exact: true }).click(); // 로그인 허용 환경 등록
}
