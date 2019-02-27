import { Song } from "./song.js";

async function start() {
	const page = await browser.runtime.getBackgroundPage();
	const player = await page.newPlayer();
	console.log(player);
}

start();