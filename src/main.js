
async function createModel(model) {
    const checkpointURL = URL + model + "model.json";
    const metadataURL = URL + model + "metadata.json";

    const recognizer = speechCommands.create(
        "BROWSER_FFT", 
        undefined, 
        checkpointURL,
        metadataURL);

    await recognizer.ensureModelLoaded();
    return recognizer;
}

function scaleAcrossRange(x, max, min) {
    return (x - min) / (max - min);
}

async function drawSpectrogram(data, canvasElem) {
    const ctx = canvasElem.getContext("2d");
    const frames = data.data.length / data.frameSize;
    const specWidth = frames;
    const specHeight = data.frameSize / 2;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvasElem.width / specWidth, canvasElem.height / specHeight);
    
    // Улучшение визуализации
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.85;
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    // Используем сине-фиолетовую цветовую карту с яркими оттенками
    const colours = colormap({ colormap: 'inferno', nshades: 255, format: 'hex' });
    
    // Вычисляем диапазон значений для нормализации
    let maxValue = 0, minValue = 0;
    for (let a = 0; a < data.data.length; a++) {
        maxValue = Math.max(data.data[a], maxValue);
        minValue = Math.min(data.data[a], minValue);
    }
    
    for (let o = 0; o < frames; o++) {
        for (let p = 0; p < data.frameSize; p++) {
            let rawValue = data.data[o * data.frameSize + p];
            let logValue = Math.log10(1 + rawValue); // Логарифмическое усиление
            let scaledValue = Math.round(255 * scaleAcrossRange(logValue, maxValue, minValue));
            
            // Порог для контраста
            if (scaledValue < 30) continue;
            
            ctx.fillStyle = colours[scaledValue];
            ctx.fillRect(o, p, 1, 1);
        }
    }
}

async function init() {
    const recognizerVowelsConsonants = await createModel("vowels_and_consonants/");
    const canvasElem = document.getElementById('spectrogram');
    
    recognizerVowelsConsonants.listen(result => {
        console.log("Recognition result:", result);
        if (result.spectrogram) {
            drawSpectrogram(result.spectrogram, canvasElem);
        } else {
            console.log("No spectrogram received in result");
        }
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.7,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50
    });
}

document.getElementById('startbutton').addEventListener('click', init);




const tf = require('@tensorflow/tfjs');
const speechCommands = require('@tensorflow-models/speech-commands');
const {listeners} = require("process");
// const wavSpectro = require('wav-spectrogram');
const colormap = require('colormap');

// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
const URL = "http://127.0.0.1:5500/docs/";
// const URL = "https://www.rmn.pp.ua/ukrainian_audio_recognition/";

async function createModel(model) {
    const checkpointURL = URL + model + "model.json"; // model topology
    const metadataURL = URL + model + "metadata.json"; // model metadata

    const recognizer = speechCommands.create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL);

    // check that model and metadata are loaded via HTTPS requests.
    await recognizer.ensureModelLoaded();

    return recognizer;
}

async function init() {
    const recognizerVowelsConsonants = await createModel("vowels_and_consonants/");
    const recognizerVowelsHigh = await createModel("vowels_high/");
    const recognizerVowelsRow = await createModel("vowels_row/");
    const recognizerZybniGybni = await createModel("zybni_gybni/");
    const recognizerGlyhiDzvinki = await createModel("glyhi_dzvinki/");

    const mostProbableContainerVC = document.getElementById("most-probable-vc");
    const mostProbableContainerHigh = document.getElementById("most-probable-high");
    const mostProbableContainerRow = document.getElementById("most-probable-row");
    const mostProbableContainerZybni = document.getElementById("most-probable-zybni");
    const mostProbableContainerGlyhi = document.getElementById("most-probable-glyhi");
    const button = document.getElementById("startbutton");
    const canvasElem = document.getElementById('spectrogram');

    // set button text
    button.innerHTML = "Listening...";

    recognizerVowelsConsonants.listen(result => {
        const scores = result.scores; // probability of prediction for each class
        // render the probability scores per class
        const classLabels = recognizerVowelsConsonants.wordLabels(); // get class labels

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        if (classLabels[maxScoreIndex] !== "Background Noise") {
            console.log(classLabels[maxScoreIndex]);
            mostProbableContainerVC.innerHTML = classLabels[maxScoreIndex];

            drawSpectrogram(result.spectrogram, canvasElem);
        }

    }, {
        includeSpectrogram: true, // in case listen should return result.spectrogram
        probabilityThreshold: 0.7,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
    });

    recognizerVowelsHigh.listen(result => {
        const scores = result.scores; // probability of prediction for each class
        // render the probability scores per class
        const classLabels = recognizerVowelsHigh.wordLabels(); // get class labels

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        if (classLabels[maxScoreIndex] !== "Background Noise") {
            console.log(classLabels[maxScoreIndex]);
            mostProbableContainerHigh.innerHTML = classLabels[maxScoreIndex];

        }
    }, {
        includeSpectrogram: false, // in case listen should return result.spectrogram
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
    });

    recognizerVowelsRow.listen(result => {
        const scores = result.scores; // probability of prediction for each class
        // render the probability scores per class
        const classLabels = recognizerVowelsRow.wordLabels(); // get class labels

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        if (classLabels[maxScoreIndex] !== "Background Noise") {
            console.log(classLabels[maxScoreIndex]);
            mostProbableContainerRow.innerHTML = classLabels[maxScoreIndex];
        }
    }, {
        includeSpectrogram: false, // in case listen should return result.spectrogram
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
    });

    recognizerZybniGybni.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerZybniGybni.wordLabels();

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        if (classLabels[maxScoreIndex] !== "Background Noise") {
            console.log(classLabels[maxScoreIndex]);
            mostProbableContainerZybni.innerHTML = classLabels[maxScoreIndex];
        }
    }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50
    });

    recognizerGlyhiDzvinki.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerGlyhiDzvinki.wordLabels();

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        if (classLabels[maxScoreIndex] !== "Background Noise") {
            console.log(classLabels[maxScoreIndex]);
            mostProbableContainerGlyhi.innerHTML = classLabels[maxScoreIndex];
        }
    }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50
    });
}

// from wav-spectrogram.js
function scaleAcrossRange(x, max, min) {
    return (x - min) / (max - min);
}

async function drawSpectrogram(data, canvasElem) {
    const ctx = canvasElem.getContext("2d");

    const frames = data.data.length / data.frameSize;

    const specWidth = frames;
    const specHeight = data.frameSize / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvasElem.width / specWidth, canvasElem.height / specHeight);

    // Create colourmap to map spectrum values to colours
    const colours = colormap({colormap: 'jet', nshades: 255, format: 'hex'});

    // Calculate range of filtered values to scale colours between
    let maxValue=0, minValue=0;
    for (let a = 0; a < data.data.length; a++) {
        maxValue = Math.max(data.data[a], maxValue);
        minValue = Math.min(data.data[a], minValue);
    }

    for (let o = 0; o < frames; o++) {
        // Ignore half of spectrogram above Nyquist frequency as it is redundant a reflects values below
        // for (let p = spectrumFrames[0].length / 2; p < spectrumFrames[0].length; p++) {
        for (let p = 0; p < data.frameSize; p++) {
            // Scale values between 0 - 255 to match colour map
            let scaledValue = Math.round(255 * scaleAcrossRange(data.data[o*data.frameSize + p], maxValue, minValue));

            ctx.fillStyle = colours[scaledValue];
            ctx.fillRect(o, p,1,1);
        }

    }

}


function updateState(category, subcategories) {
    let generalCategoryElement = document.getElementById("most-probable-vc");
    let vowelCategories = { "most-probable-high": "Висота", "most-probable-row": "Ряд" };
    let consonantCategories = { "most-probable-zybni": "Зубні/губні", "most-probable-glyhi": "Глухі/дзвінкі" };
    let allElements = document.querySelectorAll('td[id]');
    
    allElements.forEach(el => {
        el.classList.remove('active');
        el.classList.add('inactive');
        el.style.transition = "background-color 0.5s ease";
        el.textContent = "Не визначено";
    });
    
    if (category !== "Не визначено") {
        generalCategoryElement.classList.remove('inactive');
        generalCategoryElement.classList.add('active');
        generalCategoryElement.textContent = category;
        
        subcategories.forEach(subcategory => {
            let subcategoryElement = document.getElementById(subcategory.id);
            if (subcategoryElement) {
                subcategoryElement.classList.remove('inactive');
                subcategoryElement.classList.add('active');
                subcategoryElement.textContent = subcategory.value;
            }
        });
    }
}

async function init() {
    const recognizerVowelsConsonants = await createModel("vowels_and_consonants/");
    const recognizerVowelsHigh = await createModel("vowels_high/");
    const recognizerVowelsRow = await createModel("vowels_row/");
    const recognizerZybniGybni = await createModel("zybni_gybni/");
    const recognizerGlyhiDzvinki = await createModel("glyhi_dzvinki/");

    recognizerVowelsConsonants.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerVowelsConsonants.wordLabels();
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);
        const detectedClass = classLabels[maxScoreIndex];
        
        if (detectedClass !== "Background Noise") {
            if (detectedClass === "Голосні") {
                updateState("Голосні", []);
            } else if (detectedClass === "Приголосні") {
                updateState("Приголосні", []);
            }
        }
        const canvasElem = document.getElementById('spectrogram');
        drawSpectrogram(result.spectrogram, canvasElem);
    }, { probabilityThreshold: 0.8, overlapFactor: 0.60, includeSpectrogram: true });

    recognizerVowelsHigh.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerVowelsHigh.wordLabels();
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);
        const detectedClass = classLabels[maxScoreIndex];
        
        if (detectedClass !== "Background Noise") {
            updateState("Голосні", [
                { id: "most-probable-high", value: detectedClass },
                { id: "most-probable-row", value: document.getElementById("most-probable-row").textContent }
            ]);
        }
    }, { probabilityThreshold: 0.7, overlapFactor: 0.60 });

    recognizerVowelsRow.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerVowelsRow.wordLabels();
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);
        const detectedClass = classLabels[maxScoreIndex];
        
        if (detectedClass !== "Background Noise") {
            updateState("Голосні", [
                { id: "most-probable-row", value: detectedClass },
                { id: "most-probable-high", value: document.getElementById("most-probable-high").textContent }
            ]);
        }
    }, { probabilityThreshold: 0.7, overlapFactor: 0.60 });

    recognizerZybniGybni.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerZybniGybni.wordLabels();
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);
        const detectedClass = classLabels[maxScoreIndex];
        
        if (detectedClass !== "Background Noise") {
            updateState("Приголосні", [
                { id: "most-probable-zybni", value: detectedClass },
                { id: "most-probable-glyhi", value: document.getElementById("most-probable-glyhi").textContent }
            ]);
        }
    }, { probabilityThreshold: 0.7, overlapFactor: 0.60 });

    recognizerGlyhiDzvinki.listen(result => {
        const scores = result.scores;
        const classLabels = recognizerGlyhiDzvinki.wordLabels();
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);
        const detectedClass = classLabels[maxScoreIndex];
        
        if (detectedClass !== "Background Noise") {
            updateState("Приголосні", [
                { id: "most-probable-glyhi", value: detectedClass },
                { id: "most-probable-zybni", value: document.getElementById("most-probable-zybni").textContent }
            ]);
        }
    }, { probabilityThreshold: 0.7, overlapFactor: 0.60 });
}

document.getElementById('startbutton').addEventListener('click', init);

const style = document.createElement("style");
style.textContent = `
.active {
    animation: fadeIn 1.5s ease-out forwards, glowEffect 3s ease-in-out 1.5s forwards;
    transition: color 2.5s ease-in-out;
    text-shadow: 0 0 12px rgba(0, 255, 200, 0.8), 0 0 20px rgba(120, 70, 255, 0.6);
}

.inactive {
    animation: fadeOut 1s ease-out forwards;
    transition: color 1.5s ease-out;
    text-shadow: none;
}

@keyframes fadeIn {
    from { opacity: 0.5; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0.9; }
}

@keyframes glowEffect {
    0% { color: rgb(0, 255, 200); text-shadow: 0 0 15px rgba(0, 255, 200, 0.8); }
    100% { color: rgb(187, 163, 254); text-shadow: 0 0 25px rgba(120, 70, 255, 0.6); }
}
`;
document.head.appendChild(style);
