
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        # Click the "Mom" node to open sidebar
        await page.click("text=Mom")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="screenshot_sidebar.png")
        await browser.close()

asyncio.run(main())

