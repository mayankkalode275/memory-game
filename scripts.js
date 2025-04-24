const grid = document.querySelector(".grid");
const scoreDisplay = document.querySelector(".score");
const timerDisplay = document.querySelector(".timer");
const levelDisplay = document.querySelector(".level");
const frontPage = document.getElementById("frontPage");
const gameContainer = document.getElementById("gameContainer");
const levelUpPage = document.getElementById("levelUpPage");
const levelStarsDisplay = document.getElementById("levelStarsDisplay");
const levelTable = document.getElementById("levelTable");
const levelDetails = document.getElementById("levelDetails");
const nameModal = document.getElementById("nameModal");
const playerNameInput = document.getElementById("playerNameInput");
const blankPage = document.getElementById("blankPage");
const selectionPage = document.getElementById("selectionPage");

let cards = [];
let flippedCards = [];
let score = 0;
let time = 0;
let timer;
let level = 1;
let streak = 0;
let playerName = "";
let highestScore = 0;
let levelData = []; // Stores data for each level

// Educational pairs - concept and its description/related term
const educationalPairs = [
    { term: "Object-Oriented", match: "Java" },
    { term: "Low-Level", match: "Assembly" },
    { term: "Static Programming", match: "Haskell" },
    { term: "Interpreted Programming", match: "Python" },
    { term: "Scripting language", match: "C++" },
    { term: "Console", match: "JavaScript" },
    { term: "Garbage Collection", match: "Automatic Memory Management" },
    { term: "Recursion", match: "Function calls itself" },
    { term: "API", match: "Application Programming Interface" },
    { term: "DOM", match: "Document Object Model" },
    { term: "SQL", match: "Structured Query Language" },
    { term: "NoSQL", match: "MongoDB" },
    { term: "Machine Learning", match: "Neural Networks" },
    { term: "Blockchain", match: "Decentralized Ledger" },
    { term: "Tasm", match: "Turbo Assembler" },
];

const levelMultipliers = [1, 1.5, 2, 2.5, 3];

// Sounds
const flipSound = new Audio("public/flip.mp3");
const matchSound = new Audio("public/match.mp3");
const mismatchSound = new Audio("public/mismatch.mp3");
const levelUpSound = new Audio("public/levelUp.mp3");
const startSound = new Audio("public/start.mp3");
const resumeSound = new Audio("public/resume.mp3");
const bgMusic = new Audio("public/background.mp3");

// Initialize the game
function init() {
    selectionPage.style.display = "block";
    frontPage.style.display = "none";
    gameContainer.style.display = "none";
    levelUpPage.style.display = "none";
    levelTable.style.display = "none";
    blankPage.style.display = "none";
}

// Normal game mode functions
function playAsNormal() {
    selectionPage.style.display = "none";
    frontPage.style.display = "block";
}

function showNameModal() {
    nameModal.style.display = "flex";
}

function startGameWithPlayerName() {
    playerName = playerNameInput.value;
    if (playerName) {
        nameModal.style.display = "none";
        frontPage.style.display = "none";
        gameContainer.style.display = "block";
        startSound.play();
        bgMusic.play();
        bgMusic.volume = 0.3;
        startGame();
    } else {
        alert("Please enter your name.");
    }
}

function resumeGame() {
    if (localStorage.getItem("gameState")) {
        const savedState = JSON.parse(localStorage.getItem("gameState"));
        score = savedState.score;
        time = savedState.time;
        level = savedState.level;
        streak = savedState.streak;
        playerName = savedState.playerName;
        highestScore = savedState.highestScore;
        gameContainer.style.display = "block";
        frontPage.style.display = "none";
        resumeSound.play();
        updateScore(score);
        levelDisplay.textContent = `Level: ${level}`;
        timerDisplay.textContent = `Time: ${time}s`;
        startGame();
    } else {
        alert("No saved game found.");
    }
}

function viewHighestScore() {
    alert(`${playerName || "Player"}'s Highest Score: ${highestScore}`);
}

function viewLevels() {
    frontPage.style.display = "none";
    levelTable.style.display = "block";
    renderLevelTable();
}

function renderLevelTable() {
    levelDetails.innerHTML = "";
    levelData.forEach((levelInfo, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index + 1}</td>
            <td>${levelInfo.time}s</td>
            <td>${levelInfo.stars}</td>`;
        levelDetails.appendChild(row);
    });
}

function backToGame() {
    levelTable.style.display = "none";
    levelUpPage.style.display = "none";
    frontPage.style.display = "block";
}

function setupGrid() {
    grid.innerHTML = "";

    // Get pairs for current level (more pairs as level increases)
    const pairsForLevel = educationalPairs.slice(0, level + 3);

    // Create card pairs (term and its match)
    const cardContents = [];
    pairsForLevel.forEach((pair) => {
        cardContents.push({ text: pair.term, isTerm: true, match: pair.match });
        cardContents.push({ text: pair.match, isTerm: false, match: pair.term });
    });

    // Shuffle the cards
    cardContents.sort(() => Math.random() - 0.5);

    // Create card elements
    cards = cardContents.map((content, index) => ({
        text: content.text,
        isTerm: content.isTerm,
        match: content.match,
        element: createCard(content.text, index),
        matched: false,
    }));

    cards.forEach((card) => grid.appendChild(card.element));
}

function createCard(text, index) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;
    card.textContent = "?";
    card.addEventListener("click", flipCard);
    return card;
}

function flipCard(event) {
    const card = event.target;
    const index = card.dataset.index;
    if (
        flippedCards.length < 2 &&
        !cards[index].matched &&
        !card.classList.contains("flipped")
    ) {
        flipSound.play();
        card.textContent = cards[index].text;
        card.classList.add("flipped");
        flippedCards.push({
            index,
            element: card,
        });

        if (flippedCards.length === 2) {
            checkMatch();
        }
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const card1Data = cards[card1.index];
    const card2Data = cards[card2.index];

    // Check if one is a term and the other is its match
    if (
        (card1Data.text === card2Data.match ||
            card2Data.text === card1Data.match) &&
        card1Data.isTerm !== card2Data.isTerm
    ) {
        matchSound.play();
        cards[card1.index].matched = true;
        cards[card2.index].matched = true;
        card1.element.classList.add("matched");
        card2.element.classList.add("matched");

        // Show educational tooltip
        showTooltip(card1Data, card2Data);

        updateScore(10 * levelMultipliers[level - 1]);
        streak++;
        if (streak === cards.length / 2) {
            levelUp();
        }
    } else {
        mismatchSound.play();
        setTimeout(() => {
            card1.element.classList.remove("flipped");
            card2.element.classList.remove("flipped");
            card1.element.textContent = "?";
            card2.element.textContent = "?";
        }, 1000);
    }
    flippedCards = [];
}

function showTooltip(card1, card2) {
    const term = card1.isTerm ? card1.text : card2.text;
    const definition = card1.isTerm ? card2.text : card1.text;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerHTML = `<strong>${term}</strong>: ${definition}`;

    document.body.appendChild(tooltip);

    setTimeout(() => {
        tooltip.classList.add("show");
        setTimeout(() => {
            tooltip.classList.remove("show");
            setTimeout(() => {
                document.body.removeChild(tooltip);
            }, 500);
        }, 2000);
    }, 10);
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = `Score: ${score}`;
    if (score > highestScore) {
        highestScore = score;
    }
}

function updateTimer() {
    time++;
    timerDisplay.textContent = `Time: ${time}s`;
}

function levelUp() {
    if (streak === cards.length / 2) {
        level++;
        levelUpSound.play();
        levelStarsDisplay.textContent = "★".repeat(level);
        levelUpPage.style.display = "block";
        gameContainer.style.display = "none";
        levelData.push({
            time,
            stars: "★".repeat(level),
        });

        // Save game state
        saveGame();
    }
}

function nextLevel() {
    levelUpPage.style.display = "none";
    gameContainer.style.display = "block";
    setupGrid();
    updateScore(0);
    streak = 0;
    startGame();
}

function startGame() {
    setupGrid();
    score = 0;
    time = 0;
    updateScore(0);
    timerDisplay.textContent = `Time: ${time}s`;
    levelDisplay.textContent = `Level: ${level}`;

    if (timer) clearInterval(timer);
    timer = setInterval(updateTimer, 1000);

    // Save initial game state
    saveGame();
}

function restartGame() {
    score = 0;
    time = 0;
    level = 1;
    streak = 0;
    setupGrid();
    startGame();
}

function saveGame() {
    const gameState = {
        score,
        time,
        level,
        streak,
        playerName,
        highestScore,
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
}

// Dementia Patient Mode - Enhanced with sequence completion and letter arrangement
function playAsDementia() {
    selectionPage.style.display = "none";
    blankPage.style.display = "block";

    // Create the adaptive game interface
    createAdaptiveGameInterface();
}

function createAdaptiveGameInterface() {
    blankPage.innerHTML = `
        <div class="adaptive-game-container">
            <h2>Adaptive Cognitive Exercises</h2>
            <div class="mode-selector">
                <button id="sequenceModeBtn">Sequence Completion</button>
                <button id="letterModeBtn">Letter Arrangement</button>
            </div>
            <div id="gameArea"></div>
            <div id="resultDisplay"></div>
            <button id="nextExerciseBtn" style="display:none;">Next Exercise</button>
        </div>
    `;

    // Set up event listeners
    document
        .getElementById("sequenceModeBtn")
        .addEventListener("click", startSequenceMode);
    document
        .getElementById("letterModeBtn")
        .addEventListener("click", startLetterArrangementMode);
    document
        .getElementById("nextExerciseBtn")
        .addEventListener("click", nextExercise);

    // Start with sequence mode by default
    startSequenceMode();
}

let currentExerciseIndex = 0;
const exercises = [
    { type: "sequence", data: null },
    { type: "letter", data: null },
];

function startSequenceMode() {
    const gameArea = document.getElementById("gameArea");
    gameArea.innerHTML = `
        <div class="sequence-exercise">
            <h3>Sequence Completion Exercise</h3>
            <p>Complete the number sequence</p>
            <div class="sequence-display"></div>
            <div class="answer-area">
                <input type="text" id="sequenceAnswer" placeholder="Enter the next number">
                <button id="checkSequenceBtn">Check Answer</button>
            </div>
            <div class="explanation" style="display:none;"></div>
            <button id="showExplanationBtn">Show Explanation</button>
        </div>
    `;

    // Setup the sequence game
    setupSequenceGame();
}

function setupSequenceGame() {
    const sequenceTypes = [{
            pattern: "add",
            start: Math.floor(Math.random() * 10) + 1,
            step: Math.floor(Math.random() * 4) + 1,
            explanation: "This sequence adds the same number each time.",
        },
        {
            pattern: "multiply",
            start: Math.floor(Math.random() * 5) + 1,
            step: Math.floor(Math.random() * 3) + 1,
            explanation: "This sequence multiplies by the same number each time.",
        },
        {
            pattern: "alternate",
            start: Math.floor(Math.random() * 10) + 1,
            step1: Math.floor(Math.random() * 3) + 1,
            step2: Math.floor(Math.random() * 3) + 1,
            explanation: "This sequence alternates between two different operations.",
        },
    ];

    const currentSequence =
        sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)];
    let sequence = [];
    let answer;
    let sequenceText = "";

    if (currentSequence.pattern === "add") {
        sequence = [
            currentSequence.start,
            currentSequence.start + currentSequence.step,
            currentSequence.start + 2 * currentSequence.step,
            currentSequence.start + 3 * currentSequence.step,
        ];
        answer = sequence[3];
        sequenceText = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, ...`;
    } else if (currentSequence.pattern === "multiply") {
        sequence = [
            currentSequence.start,
            currentSequence.start * currentSequence.step,
            currentSequence.start * currentSequence.step * currentSequence.step,
            currentSequence.start *
            currentSequence.step *
            currentSequence.step *
            currentSequence.step,
        ];
        answer = sequence[3];
        sequenceText = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, ...`;
    } else if (currentSequence.pattern === "alternate") {
        sequence = [
            currentSequence.start,
            currentSequence.start + currentSequence.step1,
            currentSequence.start + currentSequence.step1 + currentSequence.step2,
            currentSequence.start +
            currentSequence.step1 +
            currentSequence.step2 +
            currentSequence.step1,
        ];
        answer = sequence[3];
        sequenceText = `${sequence[0]}, ${sequence[1]}, ${sequence[2]}, ...`;
    }

    document.querySelector(".sequence-display").textContent = sequenceText;
    document.querySelector(".explanation").textContent =
        currentSequence.explanation;

    document
        .getElementById("checkSequenceBtn")
        .addEventListener("click", function() {
            const userAnswer = document.getElementById("sequenceAnswer").value.trim();
            const resultDisplay = document.getElementById("resultDisplay");

            if (parseInt(userAnswer) === answer) {
                resultDisplay.innerHTML = `<p style="color:green">✅ Correct! Well done!</p>`;
                document.getElementById("nextExerciseBtn").style.display = "block";
            } else {
                resultDisplay.innerHTML = `<p style="color:red">❌ Incorrect. Try again.</p>`;
            }
        });

    document
        .getElementById("showExplanationBtn")
        .addEventListener("click", function() {
            const explanation = document.querySelector(".explanation");
            explanation.style.display =
                explanation.style.display === "none" ? "block" : "none";
            this.textContent =
                explanation.style.display === "none" ?
                "Show Explanation" :
                "Hide Explanation";
        });
}

function startLetterArrangementMode() {
    const gameArea = document.getElementById("gameArea");
    gameArea.innerHTML = `
        <div class="letter-exercise">
            <h3>Letter Arrangement Exercise</h3>
            <div class="scrambled-letters"></div>
            <div class="answer-area">
                <input type="text" id="letterAnswer" placeholder="Type the word here">
                <button id="checkLetterBtn">Check Answer</button>
            </div>
            <div class="word-meaning" style="display:none;"></div>
            <button id="showMeaningBtn">Show Word Meaning</button>
        </div>
    `;

    // Setup the letter arrangement game
    setupLetterArrangementGame();
}

function setupLetterArrangementGame() {
    const myData = [{
            word: "APPLE",
            meaning: "A round fruit with red or green skin and a white flesh.",
        },
        {
            word: "BOOK",
            meaning: "A set of written or printed sheets of paper bound together.",
        },
        {
            word: "CAR",
            meaning: "A road vehicle, typically with four wheels, powered by an internal combustion engine or electric motor.",
        },
        {
            word: "DESK",
            meaning: "A piece of furniture with a flat or sloped surface and typically with drawers, used for writing or other clerical work.",
        },
        {
            word: "EGG",
            meaning: "An oval or round object laid by a female bird, reptile, fish, or invertebrate, usually containing a developing embryo.",
        },
        {
            word: "FLOWER",
            meaning: "The part of a plant that is often brightly colored and has petals.",
        },
        {
            word: "GARDEN",
            meaning: "A piece of ground used for growing flowers, vegetables, or fruit.",
        },
        {
            word: "HOUSE",
            meaning: "A building for human habitation, especially one that is the normal abode of a family.",
        },
        { word: "ICE", meaning: "Frozen water." },
        {
            word: "JUMP",
            meaning: "Push oneself off a surface by straightening one's legs.",
        },
        {
            word: "KITE",
            meaning: "A toy consisting of a light frame with thin material stretched over it, flown in the wind at the end of a long string.",
        },
        {
            word: "LAMP",
            meaning: "An electric light bulb or a device containing an electric light bulb.",
        },
        {
            word: "MOON",
            meaning: "The natural satellite of the earth, visible (chiefly at night) by reflected light from the sun.",
        },
        {
            word: "NEST",
            meaning: "A structure built by birds for laying eggs and rearing their young.",
        },
        {
            word: "ORANGE",
            meaning: "A round citrus fruit with a thick reddish-yellow peel and a sweet, juicy pulp.",
        },
        { word: "PEN", meaning: "An instrument for writing or drawing with ink." },
        { word: "QUIET", meaning: "Making little or no noise." },
        {
            word: "RAIN",
            meaning: "Moisture condensed from the atmosphere that falls visibly in separate drops.",
        },
        { word: "SUN", meaning: "The star around which the earth orbits." },
        {
            word: "TREE",
            meaning: "A woody perennial plant, typically having a single stem or trunk growing to a considerable height and bearing lateral branches.",
        },
        {
            word: "UMBRELLA",
            meaning: "A canopy or screen carried in the hand for protection against rain or sun.",
        },
        {
            word: "VIOLET",
            meaning: "A bluish-purple color; a plant of a genus that includes the pansy.",
        },
        {
            word: "WATER",
            meaning: "A colorless, transparent, odorless liquid that forms the seas, lakes, rivers, and rain and is the basis of the fluids of living organisms.",
        },
        {
            word: "XENON",
            meaning: "A heavy, colorless, odorless, and generally unreactive gaseous element.",
        },
        {
            word: "YARN",
            meaning: "Spun thread used for knitting, weaving, or sewing.",
        },
        {
            word: "ZEBRA",
            meaning: "An African wild horse with black and white stripes.",
        },
        {
            word: "ANT",
            meaning: "A small insect that typically lives in a colony.",
        },
        {
            word: "BALL",
            meaning: "A round object that is kicked, thrown, or hit in a game.",
        },
        {
            word: "CAT",
            meaning: "A small domesticated carnivorous mammal with soft fur, a short snout, and retractile claws.",
        },
        {
            word: "DOG",
            meaning: "A domesticated carnivorous mammal that is related to the wolves.",
        },
        {
            word: "EAR",
            meaning: "The organ of hearing and balance in humans and other vertebrates.",
        },
        {
            word: "FISH",
            meaning: "A limbless cold-blooded vertebrate animal with gills and fins and living wholly in water.",
        },
        {
            word: "GOAT",
            meaning: "A hardy domesticated ruminant animal that has backward-curving horns and a beard.",
        },
        { word: "HAT", meaning: "A covering for the head." },
        {
            word: "INK",
            meaning: "A colored fluid used for writing, drawing, or printing.",
        },
        {
            word: "KEY",
            meaning: "A small metal instrument used to open or close a lock.",
        },
        {
            word: "LION",
            meaning: "A large tawny-colored cat that lives in groups in grassy plains and scrubland in Africa.",
        },
        {
            word: "MILK",
            meaning: "An opaque white fluid rich in fats and proteins, secreted by female mammals for the nourishment of their young.",
        },
        {
            word: "NOSE",
            meaning: "The part of the face above the mouth and below the forehead, containing the nostrils.",
        },
        {
            word: "OWL",
            meaning: "A nocturnal bird of prey with large forward-facing eyes, a hooked beak, and typically a loud hooting call.",
        },
        {
            word: "PIG",
            meaning: "An omnivorous domesticated hoofed mammal with a long snout.",
        },
        {
            word: "QUEEN",
            meaning: "The female ruler of an independent state, especially one who inherits the position by right of birth.",
        },
        { word: "ROSE", meaning: "A flower with a sweet scent and prickly stem." },
        {
            word: "STAR",
            meaning: "A fixed luminous point in the night sky that is a large, remote incandescent body like the sun.",
        },
        { word: "TOY", meaning: "An object for children to play with." },
        {
            word: "VAN",
            meaning: "A medium-sized motor vehicle used for transporting goods or people.",
        },
        {
            word: "WIND",
            meaning: "The perceptible natural movement of the air, especially in the form of a current of air blowing from a particular direction.",
        },
        { word: "YAK", meaning: "A long-haired domesticated ox found in Tibet." },
        {
            word: "ZIP",
            meaning: "A fastener consisting of two rows of metal or plastic teeth that are interlocked by a sliding tab.",
        },
        {
            word: "BIRD",
            meaning: "A warm-blooded vertebrate animal with feathers, wings, and a beak.",
        },
        { word: "CLOTH", meaning: "Woven or felted fabric." },
        {
            word: "DRUM",
            meaning: "A percussion instrument sounded by being struck with sticks or the hands, typically cylindrical, hemispherical, or bowl-shaped, with a taut membrane over one or both ends.",
        },
        {
            word: "FOOT",
            meaning: "The terminal part of the leg below the ankle joint on which an individual stands and walks.",
        },
        {
            word: "GLOVE",
            meaning: "A covering for the hand worn for protection against cold or dirt and typically having separate sections for each finger.",
        },
        {
            word: "HEART",
            meaning: "A hollow muscular organ that pumps the blood through the circulatory system by rhythmic contraction and dilation.",
        },
        {
            word: "IRON",
            meaning: "A strong, hard magnetic silvery-gray metal, the chemical element of atomic number 26.",
        },
        {
            word: "JUICE",
            meaning: "The liquid obtained from or present in fruit or vegetables.",
        },
        {
            word: "KNEE",
            meaning: "The joint between the thigh and the lower leg in humans.",
        },
        {
            word: "LEAF",
            meaning: "A flattened green outgrowth from the stem of a plant.",
        },
        {
            word: "MAP",
            meaning: "A diagrammatic representation of an area of land or sea showing physical features, cities, roads, etc.",
        },
        {
            word: "NAIL",
            meaning: "A small metal spike with a broadened flat head, driven into wood to join things together or to serve as a hook.",
        },
        {
            word: "OVEN",
            meaning: "An enclosed compartment for cooking or heating food.",
        },
        {
            word: "PLATE",
            meaning: "A flat dish, typically round and shallow, from which food is eaten or served.",
        },
        {
            word: "RIVER",
            meaning: "A large natural stream of water flowing in a channel to the sea, a lake, or another such stream.",
        },
        {
            word: "SHOES",
            meaning: "Footwear consisting of a sole and typically a protective upper covering the foot with an open space for the toes.",
        },
        {
            word: "TABLE",
            meaning: "A piece of furniture with a flat top supported by legs.",
        },
        { word: "UNDER", meaning: "Extending or directly below." },
        {
            word: "VOICE",
            meaning: "The sound produced in a person's larynx and uttered through the mouth, as speech or song.",
        },
        {
            word: "WALL",
            meaning: "A vertical brick or stone structure or partition used to divide or enclose an area.",
        },
        {
            word: "XRAY",
            meaning: "An electromagnetic radiation of high energy and very short wavelength, which is able to pass through many materials opaque to light.",
        },
        {
            word: "YACHT",
            meaning: "A medium-sized sailboat equipped for cruising or racing.",
        },
        {
            word: "ZONE",
            meaning: "An area or region distinguished from adjacent parts by a distinctive feature or characteristic.",
        },
        {
            word: "AMBER",
            meaning: "Hard translucent fossilized resin originating from extinct coniferous trees of the Tertiary period, typically yellowish in color.",
        },
        {
            word: "BRICK",
            meaning: "A small rectangular block typically made of fired or sun-dried clay, used in building.",
        },
        {
            word: "CANDY",
            meaning: "A sweet food made with sugar or syrup, typically flavored with fruit, chocolate, or nuts.",
        },
        {
            word: "DIAMOND",
            meaning: "A precious stone consisting of a clear and colorless crystalline form of pure carbon, the hardest naturally occurring substance.",
        },
        {
            word: "EAGLE",
            meaning: "A large bird of prey with a powerful build and long broad wings, known for its keen eyesight and powerful flight.",
        },
        {
            word: "FORK",
            meaning: "An implement with two or more prongs used for lifting food to the mouth or holding it when cutting.",
        },
        {
            word: "GRASS",
            meaning: "Vegetation consisting of typically short, green plants of the grass family.",
        },
        {
            word: "HONEY",
            meaning: "A sweet, sticky yellowish-brown fluid made in beehives from the nectar of flowers.",
        },
        {
            word: "IGLOO",
            meaning: "A dome-shaped house built from blocks of solid snow, traditionally used by Inuit people.",
        },
        {
            word: "JEWEL",
            meaning: "A precious stone or an ornament containing precious stones.",
        },
        {
            word: "KIWI",
            meaning: "A flightless bird native to New Zealand, with a long beak and brown feathers.",
        },
        {
            word: "LEMON",
            meaning: "A yellow oval citrus fruit with thick skin and fragrant, acidic juice.",
        },
        {
            word: "MIRROR",
            meaning: "A reflective surface, now typically of glass backed with a metal amalgam and framed, used to reflect light.",
        },
        {
            word: "NUT",
            meaning: "A fruit consisting of a hard or tough shell around an edible kernel.",
        },
        {
            word: "OLIVE",
            meaning: "A small oval fruit with a hard stone and bitter flesh, eaten",
        },
    ];

    const randomTerm = myData[Math.floor(Math.random() * myData.length)];
    const scrambledLetters = scrambleLetters(randomTerm.word);

    document.querySelector(
        ".scrambled-letters"
    ).textContent = `Letters: ${scrambledLetters.split("").join(" ")}`;
    document.querySelector(".word-meaning").textContent = randomTerm.meaning;

    document
        .getElementById("checkLetterBtn")
        .addEventListener("click", function() {
            const userAnswer = document
                .getElementById("letterAnswer")
                .value.trim()
                .toUpperCase();
            const resultDisplay = document.getElementById("resultDisplay");

            if (userAnswer === randomTerm.word) {
                resultDisplay.innerHTML = `<p style="color:green">✅ Correct! Well done!</p>`;
                document.getElementById("nextExerciseBtn").style.display = "block";
            } else {
                resultDisplay.innerHTML = `<p style="color:red">❌ Incorrect. Try again.</p>`;
            }
        });

    document
        .getElementById("showMeaningBtn")
        .addEventListener("click", function() {
            const meaning = document.querySelector(".word-meaning");
            meaning.style.display =
                meaning.style.display === "none" ? "block" : "none";
            this.textContent =
                meaning.style.display === "none" ?
                "Show Word Meaning" :
                "Hide Word Meaning";
        });
}

function scrambleLetters(word) {
    const letters = word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join("");
}

function nextExercise() {
    document.getElementById("resultDisplay").innerHTML = "";
    document.getElementById("nextExerciseBtn").style.display = "none";

    // Alternate between sequence and letter games
    currentExerciseIndex = (currentExerciseIndex + 1) % exercises.length;

    if (exercises[currentExerciseIndex].type === "sequence") {
        startSequenceMode();
    } else {
        startLetterArrangementMode();
    }
}

// Initialize the game when page loads
window.onload = init;