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

function helper(name) {
    let cmd = COMMAND_TEMPLATE.content.cloneNode(true);
    cmd.getElementById("legend").innerText = name;
    return cmd;
}


const SHUFFLE = document.getElementById("shuffle");
const PREVIOUS = document.getElementById("previous");
const PLAY_PAUSE = document.getElementById("play/pause");
const NEXT = document.getElementById("next");
const REPEAT = document.getElementById("repeat");

SHUFFLE.appendChild(helper("Shuffle"));
PREVIOUS.appendChild(helper("Previous"));
PLAY_PAUSE.appendChild(helper("Play/Pause"));
NEXT.appendChild(helper("Next"));
REPEAT.appendChild(helper("Repeat"));