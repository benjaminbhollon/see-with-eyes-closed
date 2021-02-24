// Typewriter
const occupations = document.getElementById('occupations-typewriter').getAttribute('data-occupations').split('|');
const occupationLength = 5000;
const typingLength = 1500;
let occupationNo = 0;
let isScrolling = false;

// Change occupation
function changeOccupation() {
  function updateText() {
    document.getElementById('occupations-typewriter').innerText = this.text;
  }

  const currentOccupation = occupations[occupationNo % occupations.length];
  let typedSoFar = '';
  let waited = 0;

  // For each letter set a timeout
  for (let l = 0; l < currentOccupation.length; l += 1) {
    typedSoFar += currentOccupation[typedSoFar.length];
    waited += typingLength / currentOccupation.length;
    setTimeout(updateText.bind({ text: typedSoFar }), waited);
  }

  // Wait once typed
  waited += occupationLength - (2 * typingLength);

  // Delete each letter
  for (let l = 0; l < currentOccupation.length; l += 1) {
    typedSoFar = typedSoFar.slice(0, -1);
    waited += typingLength / currentOccupation.length;
    setTimeout(updateText.bind({ text: typedSoFar }), waited);
  }

  occupationNo += 1;
  setTimeout(changeOccupation, occupationLength);
}
changeOccupation();

// Code editor
const html = '<div id="container"> <div id="peel"> <div id="bulge-peel"></div> <div id="bulge"> <div id="eyes"> <div id="eye-1"></div> <div id="eye-2"></div> </div> <div id="mouth"></div> </div> <div id="body"> <div id="pit"> <div id="inner-pit-1"> <div id="inner-pit-2"></div> </div> </div> </div> </div> </div><style id="style"></style>';
const css = `body {
  background-color: DeepSkyBlue;
  overflow: hidden;
}

#container * {
  background-color: #f008;
}

#peel {
  width: 200px;
  height: 200px;
  padding: 7px;
  border-radius: 100%;
  background-color: #440;
}

#container {
  position: absolute;
  padding-top: 90px;
  top: 50%;
  left: 50%;
  transform: -ms-translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

#body {
  width: 140px;
  height: 140px;
  padding: 30px;
  border-radius: 100%;
  background-color: #a5f0a2;
}

#pit {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 100%;
  background-color: #740;
  z-index: 2;
}

#inner-pit-1, #inner-pit-2 {
  border-radius: 100%;
}

#inner-pit-1 {
  position: absolute;
  width: 120px;
  height: 120px;
  left: 6px;
  top: 6px;
  background-color: #960;
}

#inner-pit-2 {
  position: absolute;
  width: 100px;
  height: 100px;
  left: 6px;
  top: 6px;
  background-color: #a80;
}

#bulge {
  position: absolute;
  height: 200px;
  width: 150px;
  margin-top: 30px;
  left: 50%;
  border-radius: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  background-color: #a5f0a2;
  z-index: 1;
}

#bulge-peel {
  position: absolute;
  height: 214px;
  width: 164px;
  margin-top: 30px;
  left: 50%;
  border-radius: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  background-color: #440;
  z-index: -1;
}

#eyes {
  height: 30px;
  width: 60px;
  position: absolute;
  top: 20%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  background-color: transparent;
}

#eye-1, #eye-2 {
  width: 22px;
  height: 30px;
  border-radius: 40px;
  background-color: #fff;
}

#eye-1::after, #eye-2::after {
  content: '';
  position: absolute;
  margin-left: 3px;
  margin-top: 3px;
  width: 10px;
  height: 10px;
  background-color: #000;
  border-radius: 100%;
  z-index: 5;
  animation: eyes 10s infinite;
}

#eye-1 {
  float: left;
}

#eye-2 {
  float: right;
}

#mouth {
  height: 25px;
  width: 100px;
  border-bottom: 5px solid #000;
  border-radius: 50%;
  background-color: transparent;
  position: absolute;
  top: 33%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

/* Animations */
@keyframes eyes {
  0% {
    margin-left: 3px;
    margin-top: 3px;
  }

  25% {
    margin-left: 3px;
    margin-top: 17px;
  }

  50% {
    margin-left: 9px;
    margin-top: 17px;
  }

  75% {
    margin-left: 9px;
    margin-top: 3px;
  }
}
\n\n
/* * * * * * * * * * * * * * * * * * *
 * You can edit this CSS! Try it! <3 *
 * * * * * * * * * * * * * * * * * * */
\n\n\n`;
let typedCSS = '';
let done = false;
document.getElementById('code__result').contentWindow.document.documentElement.innerHTML = html;

function isScrolledIntoView(el) {
  const rect = el.getBoundingClientRect();
  const elemTop = rect.top;
  const elemBottom = rect.bottom;

  const isVisible = elemTop < window.innerHeight && elemBottom >= 0;
  return isVisible;
}

function skipCode() {
  typedCSS = css.slice(0, -1);
}

document.getElementById('code__skip').addEventListener('click', skipCode);

window.addEventListener('scroll', () => {
  isScrolling = true;
});

setInterval(() => {
  if (!done && document.hasFocus() && isScrolledIntoView(document.getElementById('code__editor'))) {
    if (!isScrolling) {
      typedCSS += css[typedCSS.length];
      document.getElementById('code__editor').innerText = typedCSS;
      document.getElementById('code__editor').scrollTop = document.getElementById('code__editor').scrollHeight;
      document.getElementById('code__result').contentWindow.document.getElementById('style').innerText = typedCSS;
    } else isScrolling = false;
    if (typedCSS.length === css.length) {
      done = true;
      document.getElementById('code__editor').setAttribute('contenteditable', 'true');
      document.getElementById('code__editor').addEventListener('input', () => {
        typedCSS = document.getElementById('code__editor').innerText;
        document.getElementById('code__result').contentWindow.document.getElementById('style').innerText = typedCSS;
      });
      document.getElementById('code__skip').style.display = 'none';
    }
  }
}, 50);

// Bookshelf
function addRecentlyRead() {
  const recentlyRead = [];
  document.querySelectorAll('.gr_custom_title_1610423899').forEach((book) => {
    recentlyRead.push({ title: book.children[0].innerText, link: book.children[0].href });
  });

  for (let b = 0; b < 50; b += 1) {
    const book = document.createElement('A');
    if (recentlyRead[b]) {
      book.innerHTML = `<span>${recentlyRead[b].title.split(':')[0]}</span>`;
      book.href = recentlyRead[b].link;
      book.rel = 'nofollow noopener';
      book.target = '_blank';
    } else {
      book.innerHTML = '<span>&nbsp;</span>';
    }
    book.className = 'book';
    const bookLightness = Math.random() > 0.5
      ? (Math.random() * 15) + 20
      : (Math.random() * 10) + 70;
    book.style = `color:${bookLightness > 50 ? '#59330d' : 'bisque'};
      --background-color: hsl(${Math.random() * 10 + 30}, 75%, ${bookLightness}%);
      --height:${Math.random() * 3 + 24.5}vmin;
      --no:${Math.floor(b / 3)}`;
    document.getElementsByClassName('shelf')[b % 3].appendChild(book);
  }
}

document.body.onload = addRecentlyRead;

// Writing
let toWrite = `It was midnight when the onions~|zucchinis~|radishes~|potatoes~~ came for him. Potatoes, potatoes everywhere, all seeking hugs.~~~~~|revenge.~~~ The freezing|humid night air reeked of their want~|lust for blood. And yet he drove~~~|slept on, oblivious to his impending doom.

A shadow passed over his face, and he murmured sleepily and rubbed his elbows~~|eyes. He jolted~~|sat up to see what had wakened~|woken him and froze as he saw the potatoes, silently waiting in their ranks.

He tried to yelp~|scream~~ but couldn’t. The Leader~~~~~~|Spud King moved up to him, moonlight shining~~|glinting off his knife. And then, he struck.

The camper screamed~~|dodged,~ and the blade flew past his nose~|ear,~ the Spud King losing his balance and jumping~~|falling after it. The man giggled~~|backed into a corner of the hut~~~|tent,~~~ afraid to move or speak as the spuds~|potatoes closed in noisily~~|silently.

Just as the potatoes had slain~~|reached him and were preparing to boil~|leap on him, the camper sobbed~~~|woke up and realized that it had been a dream.~~~ Letting out a sigh of horror~|dismay~|wistfulness~|relief,~~ he sat up and looked around him, slowly~~|joyfully~ drinking in the sight of a tie-die-colored~~~|spud-free~~ tent. But wait—~~~~had something moved up on the ceiling~~|chair~~|table?~~~~~~

The man~|camper,~ hesitant and nervous, moved closer to the table and was met by the flash of the Unicorn~~|Spud King’s waiting blade.`
let typed = 0;
let rewinding = false;

function writeNext() {
  if (!isScrolledIntoView(document.getElementById('window__text')) || !(document.hasFocus())) return;
  if (toWrite.length === typed) {
    clearInterval(writingInterval);
  } else if (rewinding === true) {
    if (document.getElementById('window__text').innerText[document.getElementById('window__text').innerText.length - 1] === ' ') {
      rewinding = false;
    } else {
      document.getElementById('window__text').innerText = document.getElementById('window__text').innerText.slice(0, -1);
    }
  } else if (toWrite[typed] === '|') {
    rewinding = true;
    typed += 1;
  } else if (toWrite[typed] === '~') {
    typed += 1
  } else {
    document.getElementById('window__text').innerText += toWrite[typed];
    typed += 1;
  }
}

let writingInterval = setInterval(writeNext, 75);
