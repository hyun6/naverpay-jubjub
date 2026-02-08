import { describe, it, expect } from 'vitest';
import { logger } from '../src/logger';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
    const logDir = path.join(__dirname, '../log');

    it('should create a log directory and file', async () => {
        const testMessage = 'Test log message ' + Date.now();
        logger.info(testMessage);

        // Winston daily rotate might take a moment to write or initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(fs.existsSync(logDir)).toBe(true);

        const logFiles = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
        expect(logFiles.length).toBeGreaterThan(0);

        const logContent = fs.readFileSync(path.join(logDir, logFiles[0]), 'utf-8');
        expect(logContent).toContain(testMessage);
    });
});
