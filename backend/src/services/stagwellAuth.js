export async function handlePopup(page) {
    const popupSelector = 'button.van-button.van-button--default.van-button--large.van-dialog__confirm';
    try {
        await page.waitForSelector(popupSelector, { timeout: 5000 });
        await page.click(popupSelector);
    } catch (error) {
        console.log('No pop-up appeared or unable to find the Confirm button.');
    }
}

export async function login(page, telephone, password) {
    if (!telephone || !password) {
        throw new Error('Invalid telephone or password');
    }

    const selectors = {
        telephone: 'input[type="tel"][placeholder="Please enter your phone number"]',
        password: 'input[type="password"][placeholder="Please enter login password"]',
        loginButton: 'button.van-button.van-button--danger.van-button--large.van-button--block.van-button--round span.van-button__text'
    };

    await page.waitForSelector(selectors.telephone, { timeout: 20000 });
    await page.type(selectors.telephone, telephone);

    await page.waitForSelector(selectors.password, { timeout: 20000 });
    await page.type(selectors.password, password);

    await page.waitForSelector(selectors.loginButton, { timeout: 20000 });
    const loginButton = await page.$(selectors.loginButton);
    if (loginButton) {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
            loginButton.evaluate(el => el.closest('button').click())
        ]);
    } else {
        throw new Error('Login button not clickable');
    }

    const currentUrl = await page.url();
    if (currentUrl.includes('login')) {
        throw new Error('Login failed');
    }
}

export async function handleOverlay(page) {
    const overlayCloseSelector = 'a.close i.van-icon-clear';
    try {
        await page.waitForSelector(overlayCloseSelector, { timeout: 10000 });
        await page.click(overlayCloseSelector);
    } catch (error) {
        console.log('No overlay detected or unable to close it.');
    }
}

export async function logout(page) {
    try {
        const backButtonSelector = 'i.van-icon-arrow-left';
        await page.waitForSelector(backButtonSelector, { timeout: 10000 });
        await page.click(backButtonSelector);

        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

        const myTabSelector = 'div.van-tabbar-item__text';
        await page.waitForSelector(myTabSelector, { timeout: 20000 });
        await page.evaluate((selector) => {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (element.textContent.trim() === 'My') {
                    element.click();
                    return;
                }
            }
        }, myTabSelector);

        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

        const personalInfoSelector = 'div.van-cell__title';
        await page.waitForSelector(personalInfoSelector, { timeout: 20000 });
        const personalInfoClicked = await page.evaluate((selector) => {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (element.textContent.trim() === 'Personal information') {
                    element.click();
                    return true;
                }
            }
            return false;
        }, personalInfoSelector);

        if (personalInfoClicked) {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});

            const logoutSelector = 'div.logout';
            await page.waitForSelector(logoutSelector, { timeout: 20000 });
            const logoutClicked = await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim() === 'Exit login') {
                    element.click();
                    return true;
                }
                return false;
            }, logoutSelector);

            if (logoutClicked) {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
}