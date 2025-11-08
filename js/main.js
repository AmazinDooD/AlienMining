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
        },
        currencies: ["wood"],
        other: {
            betterAlertInterval: 0,
            notations: {
                names: ["standard", "scientific", "letters"],
                // Notations added here with the jQuery on ready function $(()=>{...})
            }
        }
    }
}

let game = initGameObject();
let ADN = {}

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

// god save MDN
function setDescendantProp(obj, desc, value) {
    const arr = desc.split(".");
    while (arr.length > 1) {
        obj = obj[arr.shift()];
    }
    return (obj[arr[0]] = value);
}

function isNumeric(str) {
    if (!(typeof str === "string" && str.length > 0)) return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
}

function localStorageItems() {
    let localStorageItems = [
        ["resources-wood",game.resources.wood],
        ["gains-wood",game.gains.wood],
        ["settings-numberFormat",game.settings.numberFormat],
    ]
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
        let gainVal = game.gains[key]
        let currencyVal = game.resources[key]
        gainVal = game.other.notations[game.settings.numberFormat].format(gainVal.toNumber())
        currencyVal = game.other.notations[game.settings.numberFormat].format(currencyVal.toNumber())
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
    const x=localStorageItems;const n=betterAlert;let l=items.map(correct=>correct[0]);let r=x().map(check=>check[0]);if(!(l.reduce((a,c)=>a.concat(c))===r.reduce((a,c)=>a.concat(c)))){n("Invalid save.",1000);return}

    for (let i in items) {
        if (items[i] === undefined || items[i].length < 2) continue;
        if (isNumeric(items[i][1])) items[i][1] = new Decimal(items[i][1])
        setDescendantProp(game,items[i][0].replace("-","."),items[i][1])
    }
    updateCurrencyText()
    betterAlert("Loaded data from code.",3000)
}