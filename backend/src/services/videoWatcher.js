import { unstickVideo } from './task.js';

export async function watchVideos(page, user) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const checkRemainingVideos = async () => {
        const maxRetries = 5;
        for (let i = 0; i < maxRetries; i++) {
            try {
                await page.waitForSelector('.van-grid-item__content.van-grid-item__content--center', { timeout: 10000 });
                const result = await page.evaluate(() => {
                    const targetNode = document.querySelector('.van-grid-item__content.van-grid-item__content--center');
                    if (!targetNode) return false;
                    const content = targetNode.textContent.trim();
                    const count = parseInt(content.split('\n').pop().trim(), 10);
                    return !isNaN(count) && count > 0;
                });
                if (result !== false) return result;
            } catch (error) {
                await delay(2000);
            }
        }
        return false;
    };

    await delay(5000);
    let videoCount = 0;

    while (true) {
        const hasVideos = await checkRemainingVideos();
        if (!hasVideos) break;

        videoCount++;
        try {
            const thumbnailSelector = 'div[data-v-5d290310].van-image';
            await page.waitForSelector(thumbnailSelector, { timeout: 20000 });
            const thumbnails = await page.$$(thumbnailSelector);
            if (thumbnails.length > 0) {
                await thumbnails[0].click();
            } else {
                throw new Error('No thumbnails found');
            }
            
            const videoSelector = 'video';
            await page.waitForSelector(videoSelector, { timeout: 20000 });
            await page.click(videoSelector);

            await delay(15000);
            await delay(1000);

            const submitTaskSelector = 'button.van-button.van-button--danger.van-button--normal.van-button--block';
            await page.waitForSelector(submitTaskSelector, { timeout: 20000 });
            await page.evaluate((selector) => {
                const buttons = document.querySelectorAll(selector);
                for (const button of buttons) {
                    if (button.textContent.trim() === 'Submit completed task') {
                        button.click();
                        return;
                    }
                }
                throw new Error('Submit button not found');
            }, submitTaskSelector);

            await delay(2000);

            const backButtonSelector = 'i.van-icon-arrow-left';
            await page.waitForSelector(backButtonSelector, { timeout: 20000 });
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
                page.click(backButtonSelector)
            ]);

        } catch (error) {
            console.error(`Error while trying to watch video ${videoCount}:`, error);
            const unstuckSuccessfully = await unstickVideo(page, user);
            if (!unstuckSuccessfully) break;
        }
        
        await delay(2000);
    }
}