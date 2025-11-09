function initGameObject() {
    return {
        resources: {
            wood: new Decimal(0)
        },
        gains: {
            wood: new Decimal(1)
        },
        settings: {
            settingsOpen: false,
            numberFormat: "standard",
            decimalPlaces: 2
        },
        currencies: ["wood"],
        other: {
            betterAlertInterval: 0,
            notations: {
                names: ["standard", "scientific", "letters"],
                // Notations added here with the jQuery on ready function $(() => {...})
            }
        },
        recipes: {}
    }
}

let game = initGameObject();
let ADN = {}
let tooltips = document.querySelectorAll(".tooltip")
class Recipe {
    constructor(input, output, name, description) {
        this.input = input;
        this.output = output;
        this.recipeName = name;
        this.description = description;
        game.recipes[this.recipeName] = this

        for (let i of input) {
            if (i[1] instanceof Decimal) continue;
            else if (typeof i[1] == "number" || (typeof i[1] === "string" && isNumeric(i[1]))) i[1] = new Decimal(i[1])
        }
        for (let i of output) {
            if (i[1] instanceof Decimal) continue;
            else if (typeof i[1] == "number" || (typeof i[1] === "string" && isNumeric(i[1]))) i[1] = new Decimal(i[1])
        }
    }

    get valid() {
        for (let i of this.input) {
            if (game.resources[i[0]] < i[1]) return false;
        }
        return true;
    }

    createRecipeBox() {
        let input = "", output = ""
        for (let i of this.input) {
            input += `${i[1]} ${capitalise(i[0])}\n`
        }
        for (let i of this.output) {
            output += `${i[1]} ${capitalise(i[0])}\n`
        }
        input = input.replaceAll("undefined","").replaceAll("null","")
        output = output.replaceAll("undefined","").replaceAll("null","")

        get("recipes").innerHTML += `
        <div class="container" id="recipe${this.recipeName}">
            <p class="main-text tooltip-parent" style="font-size: 25px;display:inline-block;grid-column:1/5">${capitalise(this.recipeName)}</p>
            <p class="main-text tooltip">${this.description}</p>
            <p class="main-text" style="grid-row: 2/3; grid-column: 1/2">${input}</p>
            <button class="button btn-med btn-green" style="grid-row: 3/4; grid-column:1/5" onclick="game.recipes.${this.recipeName}.craft()">Craft!</button>
            <p class="main-text" style="grid-row: 2/3; grid-column: 3/4">${output}</p>
            <img src="../images/recipe_arrow.png" style="grid-row:2/3; grid-column: 2/3">
        </div>
        `
        tooltips = document.querySelectorAll(".tooltip")
    }

    craft() {
        if (!(this.valid)) return;
        for (let i of this.input) {
            game.resources[i[0]] = game.resources[i[0]].sub(i[1])
        }
        for (let i of this.output) {
            game.resources[i[0]] = game.resources[i[0]].add(i[1])
        }
        updateCurrencyText()
    }
}


// yes I know I can use $() but... yeah idk why im not using that actually
const get = (id) => {
    if (id.charAt(0) !== "#" || id.charAt(0) !== ".") id = "#" + id
    return document.querySelector(id)
}
const capitalise = (string) => {return string[0].toUpperCase() + string.slice(1);}

$(() => {
    get("dataForm").value = ""

    window.setTimeout(
        () => {
            ADN = window.ADNotations
            game.other.notations.standard = new ADN.StandardNotation()
            game.other.notations.scientific = new ADN.ScientificNotation()
            game.other.notations.letters = new ADN.LettersNotation()

            get("loading").style.display = "none"
        }, 100)
})

// Move tooltip elements to the mouse position when it is moved skipping any ones that aren't visible
document.addEventListener("mousemove", (event) => {
    for (let i of tooltips) {
        if (i.style.display === "none") continue;
        i.style.left = (event.clientX + 10) + "px"
        i.style.top = (event.clientY + 10) + "px"
    }
}, false)

// god save MDN
function setDescendantProp(obj, desc, value) {
    const arr = desc.split(".");
    while (arr.length > 1) {
        obj = obj[arr.shift()];
    }
    return (obj[arr[0]] = value);
}

function formatNumber(number) {
    if (number instanceof Decimal) {
       number = number.toNumber()
    } else if (typeof number === "string" && isNumeric(number)) {
       number = Number(number)
    }
    return game.other.notations[game.settings.numberFormat].format(number, game.settings.decimalPlaces)
}

function isNumeric(str) {
    if (!(typeof str === "string" && str.length > 0)) return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
}

function localStorageItems() {
    let localStorageItems = [
        ["settings-numberFormat",game.settings.numberFormat],
        ["settings-decimalPlaces",game.settings.decimalPlaces],
    ]
    for (let i of game.currencies) {
        localStorageItems.push(["resources-" + i, game.resources[i]]);
        localStorageItems.push(["gains-"+i, game.gains[i]]);
    }
    return localStorageItems;
}

function saveToLocalStorage() {
    let items = localStorageItems();
    for (let i=0; i<items.length; i++) localStorage[items[i][0]] = JSON.stringify(items[i][1]);
}

function loadFromLocalStorage() {
    let items = localStorageItems();
    if (items === undefined) return;
    for (let i of items) {
        if (items[i] === undefined || items[i].length < 2) continue;
        setDescendantProp(game,items[i][0].replace("-","."),items[i][1])
    }
    updateCurrencyText()
}

function betterAlert(text, time) {
    if (game.other.betterAlertInterval) window.clearTimeout(game.other.betterAlertInterval)
    get("alerts-text").innerHTML = text;
    get("alerts").style.display = "block"
    game.other.betterAlertInterval = window.setTimeout(() => {
        get("alerts").style.display = "none"
    }, time)
}

function gainResource(key) {
    game.resources[key] = game.resources[key].plus(game.gains[key])
    updateCurrencyText()
}

function updateCurrencyText() {
    for (let i in game.currencies) {
        let key = game.currencies[i]
        let gainVal = formatNumber(game.gains[key])
        let currencyVal = formatNumber(game.resources[key])
        get(`${key}Gain`).innerHTML = `Gain ${game.gains[key].toString()} ${capitalise(key)}`
        get(`${key}Currency`).innerHTML = `${capitalise(key)}: ${game.resources[key].toString()}`
    }
}

function toggleSettings() {
    game.settings.settingsOpen = !game.settings.settingsOpen;
    if (game.settings.settingsOpen) {
        get("settings").style.display = "block";
    } else {
        get("settings").style.display = "none";
    }
}

function exportData() {
    get("dataForm").value = btoa(JSON.stringify(localStorageItems()))
    betterAlert("Data exported.",3000)
}

function importData() {
    let items = JSON.parse(atob(get("dataForm").value))
    const x=localStorageItems;const n=betterAlert;let l=items.map(correct=>correct[0]);let r=x().map(check=>check[0]);if(!(l.reduce((w,u)=>w.concat(u))===r.reduce((n,i)=>n.concat(i)))){n("Invalid save.",1000);return}

    for (let i in items) {
        if (items[i] === undefined || items[i].length < 2) continue;
        if (isNumeric(items[i][1])) items[i][1] = new Decimal(items[i][1])
        setDescendantProp(game,items[i][0].replace("-","."),items[i][1])
    }
    updateCurrencyText()
    betterAlert("Loaded data from code.",3000)
}

function switchNotation() {
    let newIdx = game.other.notations.names.indexOf(game.settings.numberFormat) + 1
    if (newIdx >= game.other.notations.names.length) newIdx = 0
    game.settings.numberFormat = game.other.notations.names[newIdx]
    get("notationTooltip").innerHTML = `Switch the number notation style. Currently: ${capitalise(game.settings.numberFormat)} (${formatNumber(111111111)})`
    get("placesTooltip").innerHTML = `Switch the amount of decimal places in each number. Currently: ${game.settings.decimalPlaces} (${formatNumber(111111111)})`
    updateCurrencyText()
}

function switchDecimalPlaces() {
    let newPlaces = game.settings.decimalPlaces + 1
    if (newPlaces > 4) newPlaces = 0
    game.settings.decimalPlaces = newPlaces
    get("notationTooltip").innerHTML = `Switch the number notation style. Currently: ${capitalise(game.settings.numberFormat)} (${formatNumber(111111111)})`
    get("placesTooltip").innerHTML = `Switch the amount of decimal places in each number. Currently: ${game.settings.decimalPlaces} (${formatNumber(111111111)})`
    updateCurrencyText()
}