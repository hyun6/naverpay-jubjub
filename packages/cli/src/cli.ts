import 'dotenv/config';
import { jubjub } from './jubjub';

async function main(): Promise<number> {
    const args = process.argv.slice(2);
    const targetUrl = args[0];

    if (!targetUrl) {
        console.error('사용법: npm start -- <target_url>');
        return 1;
    }

    const accounts = [
        { id: process.env.NAVER_ID1, password: process.env.NAVER_PASSWORD1 },
        { id: process.env.NAVER_ID2, password: process.env.NAVER_PASSWORD2 },
    ].filter(acc => acc.id && acc.password);

    if (accounts.length === 0) {
        console.error('.env 파일에서 계정 정보를 찾을 수 없습니다 (NAVER_ID1/2, NAVER_PASSWORD1/2)');
        return 1;
    }

    console.log(`처리할 계정 ${accounts.length}개를 발견했습니다.`);

    let successCount = 0;
    let failCount = 0;

    for (const acc of accounts) {
        if (!acc.id || !acc.password) continue;
        console.log(`\n========================================`);
        console.log(`작업 시작 ID: ${acc.id}`);
        console.log(`대상 URL: ${targetUrl}`);
        console.log(`========================================\n`);

        try {
            const success = await jubjub(targetUrl, acc.id, acc.password);
            if (success) {
                successCount++;
                console.log(`✅ 계정 ${acc.id} 작업 성공`);
            } else {
                failCount++;
                console.log(`❌ 계정 ${acc.id} 작업 실패`);
            }
        } catch (error) {
            failCount++;
            console.error(`❌ 계정 ${acc.id} 처리 중 오류 발생:`, error);
        }
    }

    console.log('\n========================================');
    console.log(`작업 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    console.log('========================================');

    return failCount > 0 ? 1 : 0;
}

main().then(exitCode => {
    process.exit(exitCode);
});
