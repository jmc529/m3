let current = "general";

function switchTabTo(newTab) {
    document.getElementById(current).classList.remove("active");
    document.getElementById(newTab).classList.add("active");
    document.getElementById(`${current}-window`).classList.add("hidden");
    document.getElementById(`${newTab}-window`).classList.remove("hidden");
    current = newTab;
}

document.getElementById("general").addEventListener("click", () => {switchTabTo("general")});
document.getElementById("spotify").addEventListener("click", () => {switchTabTo("spotify")});
document.getElementById("donate").addEventListener("click", () => {switchTabTo("donate")});

const COMMAND_TEMPLATE = document.getElementById('command-template');
const MEDIA_KEY_TEMPLATE = document.getElementById('mediaKey-template');

function cloneCommandTemplateTo(name) {
    let template = COMMAND_TEMPLATE.content.cloneNode(true);
    template.getElementById("legend").innerText = name;
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