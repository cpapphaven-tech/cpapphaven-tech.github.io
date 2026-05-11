const levels = [
    {
        level: 1,
        title: "The Founders",
        desc: "Place the founders of the family.",
        clues: [
            "John is the patriarch and is placed on the left.",
            "Mary is married to John.",
            "They have one son named Peter."
        ],
        characters: [
            { id: "c1", name: "John", color: "#3b82f6" },
            { id: "c2", name: "Mary", color: "#ec4899" },
            { id: "c3", name: "Peter", color: "#8b5cf6" }
        ],
        nodes: [
            { id: "n1", x: 35, y: 30 },
            { id: "n2", x: 65, y: 30 },
            { id: "n3", x: 50, y: 70 }
        ],
        lines: [
            { x1: 35, y1: 30, x2: 65, y2: 30 },
            { x1: 50, y1: 30, x2: 50, y2: 70 }
        ],
        solution: {
            "n1": "c1",
            "n2": "c2",
            "n3": "c3"
        }
    },
    {
        level: 2,
        title: "Three Generations",
        desc: "Assemble the extended family.",
        clues: [
            "Arthur is married to Beatrice. Arthur is on the far left.",
            "Their daughter is Clara.",
            "Clara's husband is David.",
            "Ethan is the youngest and is David's son.",
            "Clara is on the left of her husband David."
        ],
        characters: [
            { id: "c1", name: "Arthur", color: "#3b82f6" },
            { id: "c2", name: "Beatrice", color: "#ec4899" },
            { id: "c3", name: "Clara", color: "#ec4899" },
            { id: "c4", name: "David", color: "#3b82f6" },
            { id: "c5", name: "Ethan", color: "#8b5cf6" }
        ],
        nodes: [
            { id: "n1", x: 20, y: 20 },
            { id: "n2", x: 50, y: 20 },
            { id: "n3", x: 35, y: 55 },
            { id: "n4", x: 65, y: 55 },
            { id: "n5", x: 50, y: 90 }
        ],
        lines: [
            { x1: 20, y1: 20, x2: 50, y2: 20 },
            { x1: 35, y1: 20, x2: 35, y2: 55 },
            { x1: 35, y1: 55, x2: 65, y2: 55 },
            { x1: 50, y1: 55, x2: 50, y2: 90 }
        ],
        solution: {
            "n1": "c1",
            "n2": "c2",
            "n3": "c3",
            "n4": "c4",
            "n5": "c5"
        }
    },
    {
        level: 3,
        title: "The Sibling Branches",
        desc: "Two branches of the same family.",
        clues: [
            "George and Helen are the grandparents. George is on the left.",
            "They have two children: a son Ian, and a daughter Jane.",
            "Ian is unmarried and has no children. He is on the left side.",
            "Jane is married to Karl. Karl is on the right.",
            "Jane and Karl have two daughters: Lily and Mia.",
            "Lily is older and placed on the left."
        ],
        characters: [
            { id: "c1", name: "George", color: "#3b82f6" },
            { id: "c2", name: "Helen", color: "#ec4899" },
            { id: "c3", name: "Ian", color: "#3b82f6" },
            { id: "c4", name: "Jane", color: "#ec4899" },
            { id: "c5", name: "Karl", color: "#3b82f6" },
            { id: "c6", name: "Lily", color: "#ec4899" },
            { id: "c7", name: "Mia", color: "#ec4899" }
        ],
        nodes: [
            { id: "n1", x: 20, y: 15 },
            { id: "n2", x: 50, y: 15 },
            { id: "n3", x: 20, y: 50 },
            { id: "n4", x: 50, y: 50 },
            { id: "n5", x: 80, y: 50 },
            { id: "n6", x: 50, y: 85 },
            { id: "n7", x: 80, y: 85 }
        ],
        lines: [
            { x1: 20, y1: 15, x2: 50, y2: 15 },
            { x1: 35, y1: 15, x2: 35, y2: 30 },
            { x1: 20, y1: 30, x2: 50, y2: 30 },
            { x1: 20, y1: 30, x2: 20, y2: 50 },
            { x1: 50, y1: 30, x2: 50, y2: 50 },
            { x1: 50, y1: 50, x2: 80, y2: 50 },
            { x1: 65, y1: 50, x2: 65, y2: 65 },
            { x1: 50, y1: 65, x2: 80, y2: 65 },
            { x1: 50, y1: 65, x2: 50, y2: 85 },
            { x1: 80, y1: 65, x2: 80, y2: 85 }
        ],
        solution: {
            "n1": "c1", "n2": "c2", "n3": "c3",
            "n4": "c4", "n5": "c5", "n6": "c6", "n7": "c7"
        }
    },
    {
        level: 4,
        title: "Brothers in Arms",
        desc: "Two brothers and their own families.",
        clues: [
            "Adam and Brian are brothers. Adam is placed on the left.",
            "Adam is married to Chloe.",
            "Brian is married to Daisy.",
            "Adam and Chloe have a son, Ethan.",
            "Brian and Daisy have a daughter, Fiona."
        ],
        characters: [
            { id: "c1", name: "Adam", color: "#3b82f6" },
            { id: "c2", name: "Chloe", color: "#ec4899" },
            { id: "c3", name: "Brian", color: "#3b82f6" },
            { id: "c4", name: "Daisy", color: "#ec4899" },
            { id: "c5", name: "Ethan", color: "#3b82f6" },
            { id: "c6", name: "Fiona", color: "#ec4899" }
        ],
        nodes: [
            { id: "n1", x: 20, y: 30 },
            { id: "n2", x: 45, y: 30 },
            { id: "n3", x: 60, y: 30 },
            { id: "n4", x: 85, y: 30 },
            { id: "n5", x: 32.5, y: 70 },
            { id: "n6", x: 72.5, y: 70 }
        ],
        lines: [
            { x1: 20, y1: 30, x2: 45, y2: 30 },
            { x1: 60, y1: 30, x2: 85, y2: 30 },
            { x1: 32.5, y1: 30, x2: 32.5, y2: 70 },
            { x1: 72.5, y1: 30, x2: 72.5, y2: 70 },
            // sibling link above
            { x1: 20, y1: 15, x2: 60, y2: 15 },
            { x1: 20, y1: 15, x2: 20, y2: 30 },
            { x1: 60, y1: 15, x2: 60, y2: 30 }
        ],
        solution: {
            "n1": "c1", "n2": "c2", "n3": "c3",
            "n4": "c4", "n5": "c5", "n6": "c6"
        }
    },
    {
        level: 5,
        title: "The Grand Reunion",
        desc: "A full 3-generation family tree.",
        clues: [
            "Richard and Susan are the heads of the family. Richard is on the left.",
            "They have three children: Tara, Victor, and Walter.",
            "Tara is the eldest (far left), Walter is the youngest (far right).",
            "Victor is married to Wendy. Wendy is on Victor's right.",
            "Victor and Wendy have two children: Xavier and Yara.",
            "Xavier is placed on the left."
        ],
        characters: [
            { id: "c1", name: "Richard", color: "#3b82f6" },
            { id: "c2", name: "Susan", color: "#ec4899" },
            { id: "c3", name: "Tara", color: "#ec4899" },
            { id: "c4", name: "Victor", color: "#3b82f6" },
            { id: "c5", name: "Wendy", color: "#ec4899" },
            { id: "c6", name: "Walter", color: "#3b82f6" },
            { id: "c7", name: "Xavier", color: "#3b82f6" },
            { id: "c8", name: "Yara", color: "#ec4899" }
        ],
        nodes: [
            { id: "n1", x: 40, y: 15 },
            { id: "n2", x: 60, y: 15 },
            { id: "n3", x: 20, y: 45 },
            { id: "n4", x: 40, y: 45 },
            { id: "n5", x: 60, y: 45 },
            { id: "n6", x: 80, y: 45 },
            { id: "n7", x: 35, y: 80 },
            { id: "n8", x: 65, y: 80 }
        ],
        lines: [
            { x1: 40, y1: 15, x2: 60, y2: 15 },
            { x1: 50, y1: 15, x2: 50, y2: 30 },
            { x1: 20, y1: 30, x2: 80, y2: 30 },
            { x1: 20, y1: 30, x2: 20, y2: 45 },
            { x1: 40, y1: 30, x2: 40, y2: 45 },
            { x1: 80, y1: 30, x2: 80, y2: 45 },
            { x1: 40, y1: 45, x2: 60, y2: 45 },
            { x1: 50, y1: 45, x2: 50, y2: 65 },
            { x1: 35, y1: 65, x2: 65, y2: 65 },
            { x1: 35, y1: 65, x2: 35, y2: 80 },
            { x1: 65, y1: 65, x2: 65, y2: 80 }
        ],
        solution: {
            "n1": "c1", "n2": "c2", "n3": "c3", "n4": "c4",
            "n5": "c5", "n6": "c6", "n7": "c7", "n8": "c8"
        }
    }
];

let currentLevelIndex = 0;
let placements = {}; // node_id -> char_id
let selectedCharId = null;

// DOM Elements
const levelDisplay = document.getElementById("level-display");
const levelTitle = document.getElementById("level-title");
const levelDesc = document.getElementById("level-desc");
const cluesList = document.getElementById("clues-list");
const treeLines = document.getElementById("tree-lines");
const treeNodes = document.getElementById("tree-nodes");
const characterBank = document.getElementById("character-bank");

function startGame() {
    document.getElementById("start-screen").classList.add("hidden");
    loadLevel(0);
}

function resetLevel() {
    placements = {};
    selectedCharId = null;
    renderTree();
    renderBank();
}

function loadLevel(index) {
    if (index >= levels.length) {
        document.getElementById("game-complete-screen").classList.remove("hidden");
        return;
    }
    
    currentLevelIndex = index;
    const lvl = levels[currentLevelIndex];
    
    placements = {};
    selectedCharId = null;
    
    levelDisplay.textContent = lvl.level;
    levelTitle.textContent = lvl.title;
    levelDesc.textContent = lvl.desc;
    
    // Render Clues
    cluesList.innerHTML = "";
    lvl.clues.forEach(clue => {
        const li = document.createElement("li");
        li.textContent = clue;
        cluesList.appendChild(li);
    });
    
    renderTreeLines();
    renderTree();
    renderBank();
}

function renderTreeLines() {
    const lvl = levels[currentLevelIndex];
    treeLines.innerHTML = "";
    
    lvl.lines.forEach(line => {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", line.x1 + "%");
        l.setAttribute("y1", line.y1 + "%");
        l.setAttribute("x2", line.x2 + "%");
        l.setAttribute("y2", line.y2 + "%");
        l.setAttribute("class", "tree-line");
        treeLines.appendChild(l);
    });
}

function renderTree() {
    const lvl = levels[currentLevelIndex];
    treeNodes.innerHTML = "";
    
    lvl.nodes.forEach(node => {
        const div = document.createElement("div");
        div.className = "tree-node";
        div.style.left = node.x + "%";
        div.style.top = node.y + "%";
        
        const charId = placements[node.id];
        if (charId) {
            const char = lvl.characters.find(c => c.id === charId);
            div.classList.add("filled");
            div.innerHTML = `
                <div class="character-avatar" style="background:${char.color};">
                    ${char.name.charAt(0)}
                </div>
                <div class="char-name-label">${char.name}</div>
            `;
            div.onclick = () => returnCharacter(node.id);
        } else {
            div.onclick = () => placeCharacter(node.id);
        }
        
        treeNodes.appendChild(div);
    });
}

function renderBank() {
    const lvl = levels[currentLevelIndex];
    characterBank.innerHTML = "";
    
    // Find characters that are already placed
    const placedCharIds = Object.values(placements);
    
    lvl.characters.forEach(char => {
        const div = document.createElement("div");
        div.className = "bank-char-wrapper";
        if (placedCharIds.includes(char.id)) {
            div.classList.add("used");
        } else if (char.id === selectedCharId) {
            div.classList.add("selected");
        }
        
        div.innerHTML = `
            <div class="character-avatar" style="background:${char.color};">
                ${char.name.charAt(0)}
            </div>
            <div class="char-name-label">${char.name}</div>
        `;
        
        if (!placedCharIds.includes(char.id)) {
            div.onclick = () => selectCharacter(char.id);
        }
        
        characterBank.appendChild(div);
    });
}

function selectCharacter(charId) {
    if (selectedCharId === charId) {
        selectedCharId = null; // deselect
    } else {
        selectedCharId = charId;
    }
    renderBank();
}

function placeCharacter(nodeId) {
    if (!selectedCharId) return;
    
    placements[nodeId] = selectedCharId;
    selectedCharId = null;
    
    renderTree();
    renderBank();
    checkWin();
}

function returnCharacter(nodeId) {
    delete placements[nodeId];
    renderTree();
    renderBank();
}

function checkWin() {
    const lvl = levels[currentLevelIndex];
    const solution = lvl.solution;
    
    let isComplete = true;
    let isCorrect = true;
    
    for (const nodeId in solution) {
        if (!placements[nodeId]) {
            isComplete = false;
            break;
        }
        if (placements[nodeId] !== solution[nodeId]) {
            isCorrect = false;
        }
    }
    
    if (isComplete) {
        if (isCorrect) {
            document.getElementById("level-complete-screen").classList.remove("hidden");
        } else {
            // Provide a subtle visual hint without throwing an annoying alert
            const nodes = document.querySelectorAll('.tree-node');
            nodes.forEach(n => {
                n.style.borderColor = "#ef4444"; // Red border for mistake
                setTimeout(() => n.style.borderColor = "", 1000);
            });
        }
    }
}

function nextLevel() {
    document.getElementById("level-complete-screen").classList.add("hidden");
    loadLevel(currentLevelIndex + 1);
}

// Ensure first level loads initially but behind the start screen
window.onload = () => {
    loadLevel(0);
};
