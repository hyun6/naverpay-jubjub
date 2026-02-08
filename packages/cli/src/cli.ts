import 'dotenv/config';
import { logger } from './logger';
import { jubjub } from './jubjub';

async function main(): Promise<number> {
    const args = process.argv.slice(2);
    const targetUrl = args[0];

    if (!targetUrl) {
        logger.error('사용법: npm start -- <target_url>');
        return 1;
    }

    const accounts = [
        { id: process.env.NAVER_ID1, password: process.env.NAVER_PASSWORD1 },
        { id: process.env.NAVER_ID2, password: process.env.NAVER_PASSWORD2 },
    ].filter(acc => acc.id && acc.password);

    if (accounts.length === 0) {
        logger.error('.env 파일에서 계정 정보를 찾을 수 없습니다 (NAVER_ID1/2, NAVER_PASSWORD1/2)');
        return 1;
    }

    logger.info(`처리할 계정 ${accounts.length}개를 발견했습니다.`);

    let successCount = 0;
    let failCount = 0;

    for (const acc of accounts) {
        if (!acc.id || !acc.password) continue;
        logger.info('\n========================================');
        logger.info(`작업 시작 ID: ${acc.id}`);
        logger.info(`대상 URL: ${targetUrl}`);
        logger.info('========================================\n');

        try {
            const success = await jubjub(targetUrl, acc.id, acc.password);
            if (success) {
                successCount++;
                logger.info(`✅ 계정 ${acc.id} 작업 성공`);
            } else {
                failCount++;
                logger.info(`❌ 계정 ${acc.id} 작업 실패`);
            }
        } catch (error) {
            failCount++;
            logger.error(`❌ 계정 ${acc.id} 처리 중 오류 발생:`, error);
        }
    }

    logger.info('\n========================================');
    logger.info(`작업 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
    logger.info('========================================');

    return failCount > 0 ? 1 : 0;
}

main().then(async (exitCode) => {
    // 로그가 완전히 기록될 때까지 잠시 대기 (Winston 비동기 처리 대응)
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(exitCode);
});
