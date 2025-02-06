const tf = require('@tensorflow/tfjs');
const speechCommands = require('@tensorflow-models/speech-commands');
const {listeners} = require("process");
// const wavSpectro = require('wav-spectrogram');
const colormap = require('colormap');

// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
const URL = "http://localhost:63342/School/audio/docs/";
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

    const mostProbableContainerVC = document.getElementById("most-probable-vc");
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
        }
    }, {
        includeSpectrogram: false, // in case listen should return result.spectrogram
        probabilityThreshold: 0.5,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50 // probably want between 0.5 and 0.75. More info in README
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

document.getElementById('startbutton').addEventListener('click', init);
