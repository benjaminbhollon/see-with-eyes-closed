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
const html = '<div id="container"> <div id="peel"> <div id="bulge-peel"></div> <div id="bulge"> <div id="eyes"> <div id="eye-1"></div> <div id="eye-2"></div> </div> <div id="mouth"></div> </div> <div id="body"> <div id="pit"> <div id="inner-pit-1"> <div id="inner-pit-2"></div> </div> </div> </div> </div> </div>';
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
  border-radius: 100%;
  background-color: #000;
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
  if (!done && document.hasFocus() && isScrolledIntoView(document.getElementById('code__editor')) && !isScrolling) {
    typedCSS += css[typedCSS.length];
    let dataURI = `data:text/html,${encodeURIComponent(`${html}<style>${typedCSS}</style>`)}`;
    document.getElementById('code__editor').innerText = typedCSS;
    document.getElementById('code__editor').scrollTop = document.getElementById('code__editor').scrollHeight;
    if (typedCSS.length % 5 === 0 || typedCSS.length === css.length) {
      document.getElementsByClassName('code__result')[typedCSS.length % 2].src = dataURI;
      document.getElementsByClassName('code__result')[typedCSS.length % 2].style.display = 'none';
    }
    if (typedCSS.length === css.length) {
      done = true;
      document.getElementById('code__editor').setAttribute('contenteditable', 'true');
      document.getElementById('code__editor').addEventListener('input', () => {
        typedCSS = document.getElementById('code__editor').innerText;
        dataURI = `data:text/html,${encodeURIComponent(`${html}<style>${typedCSS}</style>`)}`;
        document.getElementsByClassName('code__result')[typedCSS.length % 2].src = dataURI;
        document.getElementsByClassName('code__result')[typedCSS.length % 2].style.display = 'none';
      });
      document.getElementById('code__skip').style.display = 'none';
    }
  } else {
    isScrolling = false;
  }
}, 30);

// bookshelf
function load() {
  const recentlyRead = [];
  document.querySelectorAll('.gr_custom_title_1610423899').forEach((book) => {
    recentlyRead.push({ title: book.children[0].innerText, link: book.children[0].href });
  });

  for (let b = 0; b < 50; b += 1) {
    const book = document.createElement('A');
    if (recentlyRead[b]) {
      book.innerHTML = `<span>${recentlyRead[b].title}</span>`;
      book.href = recentlyRead[b].link;
      book.rel = 'nofollow noopener';
      book.target = '_blank';
    } else {
      book.innerHTML = '<span>&nbsp;</span>';
    }
    book.className = 'book';
    book.style = `--background-color: hsl(${Math.random() * 256}, 75%, ${(Math.random() * 15) + 65}%);--height:${Math.random() * 5 + 23}vmin;--no:${Math.floor(b / 3)}`;
    document.getElementsByClassName('shelf')[b % 3].appendChild(book);
  }
}

document.body.onload = load;
