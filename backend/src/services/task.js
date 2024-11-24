const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function unstickVideo(page, user) {
    try {
        const backButtonSelector = 'i.van-icon-arrow-left';
        await page.waitForSelector(backButtonSelector, { timeout: 20000 });
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {}),
            page.click(backButtonSelector)
        ]);

        const taskButtonSelector = 'div.van-tabbar-item';
        await page.waitForSelector(taskButtonSelector, { timeout: 20000 });
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('div.van-tabbar-item');
            for (const button of buttons) {
                if (button.textContent.includes('Task')) {
                    button.click();
                    return;
                }
            }
            throw new Error('Task button not found');
        });

        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});

        const taskItemSelector = 'div.TaskItem.van-cell';
        await page.waitForSelector(taskItemSelector, { timeout: 20000 });
        
        const submitButtonClicked = await page.evaluate(() => {
            const taskItems = document.querySelectorAll('div.TaskItem.van-cell');
            for (const item of taskItems) {
                const submitButton = item.querySelector('button.van-button--info');
                if (submitButton && submitButton.textContent.trim().toLowerCase() === 'submit') {
                    submitButton.click();
                    return true;
                }
            }
            return false;
        });

        if (!submitButtonClicked) {
            throw new Error('Submit button not found or not clickable');
        }

        await watchAndSubmitVideo(page);
        await navigateBack(page);

        return true;
    } catch (error) {
        console.error('Error while trying to unstick video:', error);
        return false;
    }
}

export async function watchAndSubmitVideo(page) {
    try {
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
            throw new Error('Submit completed task button not found');
        }, submitTaskSelector);

        await delay(2000);
    } catch (error) {
        console.error('Error in watchAndSubmitVideo:', error);
        throw error;
    }
}

export async function navigateBack(page) {
    try {
        const backButtonSelector = 'i.van-icon-arrow-left';
        for (let i = 0; i < 2; i++) {
            await page.waitForSelector(backButtonSelector, { timeout: 20000 });
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {}),
                page.click(backButtonSelector)
            ]);
        }
    } catch (error) {
        console.error('Error in navigateBack:', error);
        throw error;
    }
}