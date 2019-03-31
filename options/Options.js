let current = "general";

function instantiateListeners() {
	document.getElementById("general").addEventListener("click", () => {switchTabTo("general")});
	document.getElementById("spotify").addEventListener("click", () => {switchTabTo("spotify")});
	document.getElementById("donate").addEventListener("click", () => {switchTabTo("donate")});
	document.getElementById("save-spotify").addEventListener("click", () => {});
	document.getElementById("reset-spotify").addEventListener("click", () => {});
	document.getElementById("save-general").addEventListener("click", () => {});
	document.getElementById("reset-general").addEventListener("click", () => {});
}

function populateCommandBoxes() {
	const COMMAND_TEMPLATE = document.getElementById('command-template');

	function cloneCommandTemplateTo(name) {
	    let template = COMMAND_TEMPLATE.content.cloneNode(true);
	    template.getElementById("legend").innerText = name;
	    template.querySelector("label").setAttribute("for", `${name}-shift`);
	    let input = template.querySelector("input");
	    input.setAttribute("id", `${name}-shift`);
	    input.setAttribute("name", `${name}-shift`);
	    return template;
	}

	const SHUFFLE = document.getElementById("shuffle");
	const PREVIOUS = document.getElementById("previous");
	const PLAY_PAUSE = document.getElementById("play/pause");
	const NEXT = document.getElementById("next");
	const REPEAT = document.getElementById("repeat");

	SHUFFLE.appendChild(cloneCommandTemplateTo("Shuffle"));
	PREVIOUS.appendChild(cloneCommandTemplateTo("Previous"));
	PLAY_PAUSE.appendChild(cloneCommandTemplateTo("Play/Pause"));
	NEXT.appendChild(cloneCommandTemplateTo("Next"));
	REPEAT.appendChild(cloneCommandTemplateTo("Repeat"));
}

async function populateData() {
	let data = await browser.storage.local.get();
	document.getElementById("notifications");
	
}

function populateMediaKeys() {
	const KEY_TEMPLATE = document.getElementById('media-key-template');

	function cloneKeyTemplateTo(name, key) {
	    let template = KEY_TEMPLATE.content.cloneNode(true);
	    let label = template.querySelector("label");
	    label.setAttribute("for", key);
	    let p = document.createElement("P");
	    p.innerText = `Use "${name}"`;
	    label.appendChild(p);
	    let input = template.querySelector("input");
	    input.setAttribute("id", key);
	    input.setAttribute("name", key);
	    return template;
	}

	const PREVIOUS = document.getElementById("prev-track");
	const PLAY_PAUSE = document.getElementById("play-track");
	const NEXT = document.getElementById("next-track");

	PREVIOUS.appendChild(cloneKeyTemplateTo("MediaPrevTrack", "prev"));
	PLAY_PAUSE.appendChild(cloneKeyTemplateTo("MediaPlayPause", "play"));
	NEXT.appendChild(cloneKeyTemplateTo("MediaNextTrack", "next"));
}

function switchTabTo(newTab) {
    document.getElementById(current).classList.remove("active");
    document.getElementById(newTab).classList.add("active");
    document.getElementById(`${current}-window`).classList.add("hidden");
    document.getElementById(`${newTab}-window`).classList.remove("hidden");
    current = newTab;
}

populateCommandBoxes();
populateMediaKeys();
instantiateListeners();