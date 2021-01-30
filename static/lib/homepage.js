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
  for (var l in currentOccupation) {
    typedSoFar += currentOccupation[typedSoFar.length];
    waited += typingLength / currentOccupation.length;
    setTimeout(updateText.bind({ text: typedSoFar }), waited);
  }

  // Wait once typed
  waited += occupationLength - (2 * typingLength);

  // Delete each letter
  for (var l in currentOccupation) {
    typedSoFar = typedSoFar.slice(0, -1);
    waited += typingLength / currentOccupation.length;
    setTimeout(updateText.bind({ text: typedSoFar }), waited);
  }

  occupationNo++;
  setTimeout(changeOccupation, occupationLength);
}
changeOccupation();

// Code editor
const html = '<div id="container"> <div id="peel"> <div id="bulge-peel"></div> <div id="bulge"> <div id="eyes"> <div id="eye-1"></div> <div id="eye-2"></div> </div> <div id="mouth"></div> </div> <div id="body"> <div id="pit"> <div id="inner-pit-1"> <div id="inner-pit-2"></div> </div> </div> </div> </div> </div>';
const css = 'body {\n  background-color: DeepSkyBlue;\n  overflow: hidden;\n}\n\n#peel {\n  background-color: #440;\n  width: 200px;\n  height: 200px;\n  padding: 7px;\n  border-radius: 100%;\n}\n\n#container {\n  padding-top: 90px;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: -ms-translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n}\n\n#body {\n  background-color: #a5f0a2;\n  width: 140px;\n  height: 140px;\n  padding: 30px;\n  border-radius: 100%;\n}\n\n#pit {\n  position: absolute;\n  background-color: #740;\n  width: 140px;\n  height: 140px;\n  border-radius: 100%;\n  z-index: 2;\n}\n\n#inner-pit-1, #inner-pit-2 {\n  border-radius: 100%;\n}\n\n#inner-pit-1 {\n  position: absolute;\n  left: 6px;\n  top: 6px;\n  background-color: #960;\n  width: 120px;\n  height: 120px;\n}\n\n#inner-pit-2 {\n  left: 6px;\n  top: 6px;\n  position: absolute;\n  background-color: #a80;\n  width: 100px;\n  height: 100px;\n}\n\n#bulge {\n  position: absolute;\n  background-color: #a5f0a2;\n  margin-top: 30px;\n  left: 50%;\n  height: 200px;\n  width: 150px;\n  border-radius: 50%;\n  -ms-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n  z-index: 1;\n}\n\n#bulge-peel {\n  position: absolute;\n  background-color: #440;\n  left: 50%;\n  margin-top: 30px;\n  height: 214px;\n  width: 164px;\n  border-radius: 50%;\n  -ms-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n  z-index: -1;\n}\n\n#eyes {\n  position: absolute;\n  top: 20%;\n  left: 50%;\n  height: 30px;\n  width: 60px;\n  -ms-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n}\n\n#eye-1, #eye-2 {\n  background-color: #fff;\n  width: 22px;\n  height: 30px;\n  border-radius: 40px;\n}\n\n#eye-1::after, #eye-2::after {\n  content: \'\';\n  position: absolute;\n  margin-left: 3px;\n  margin-top: 3px;\n  width: 10px;\n  height: 10px;\n  background-color: #000;\n  border-radius: 100%;\n  z-index: 5;\n  animation: eyes 10s infinite;\n}\n\n#eye-1 {\n  float: left;\n}\n\n#eye-2 {\n  float: right;\n}\n\n#mouth {\n  border-bottom: 5px solid #000;\n  height: 25px;\n  width: 100px;\n  position: absolute;\n  top: 33%;\n  left: 50%;\n  border-radius: 50%;\n  -ms-transform: translate(-50%, -50%);\n  transform: translate(-50%, -50%);\n}\n\n/* Animations */\n@keyframes eyes {\n  0% {\n    margin-left: 3px;\n    margin-top: 3px;\n  }\n\n  25% {\n    margin-left: 3px;\n    margin-top: 17px;\n  }\n\n  50% {\n    margin-left: 9px;\n    margin-top: 17px;\n  }\n\n  75% {\n    margin-left: 9px;\n    margin-top: 3px;\n  }\n\n}\n\n\n\n/* * * * * * * * * * * * * * * * * * *\n * You can edit this CSS! Try it! <3 *\n * * * * * * * * * * * * * * * * * * */\n\n\n\n';
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

window.addEventListener('scroll', () => {
  isScrolling = true;
});

setInterval(() => {
  if (!done && document.hasFocus() && isScrolledIntoView(document.getElementById('code__editor')) && !isScrolling) {
    typedCSS += css[typedCSS.length];
    const dataURI = `data:text/html,${encodeURIComponent(`${html}<style>${typedCSS}</style>`)}`;
    document.getElementById('code__editor').innerText = typedCSS;
    document.getElementById('code__editor').scrollTop = document.getElementById('code__editor').scrollHeight;
    if (typedCSS.length % 5 == 0 || typedCSS.length === css.length) {
      document.getElementsByClassName('code__result')[typedCSS.length % 2].src = dataURI;
      document.getElementsByClassName('code__result')[typedCSS.length % 2].style.display = 'none';
    }
    if (typedCSS.length === css.length) {
      done = true;
      document.getElementById('code__editor').setAttribute('contenteditable', 'true');
      document.getElementById('code__editor').addEventListener('input', () => {
        typedCSS = document.getElementById('code__editor').innerText;
        const dataURI = `data:text/html,${encodeURIComponent(`${html}<style>${typedCSS}</style>`)}`;
        document.getElementsByClassName('code__result')[typedCSS.length % 2].src = dataURI;
        document.getElementsByClassName('code__result')[typedCSS.length % 2].style.display = 'none';
      });
      document.getElementById('code__skip').style.display = 'none';
    }
  } else {
    isScrolling = false;
  }
}, 40);

// bookshelf
function padZero(str, len) {
  len = len || 2;
  const zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

function load() {
  const recentlyRead = [];
  document.querySelectorAll('.gr_custom_title_1610423899').forEach((book) => {
    recentlyRead.push({ title: book.children[0].innerText, link: book.children[0].href });
  });

  for (let b = 0; b < 50; b++) {
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
    let color = (Math.random() * 2 ** 24 << 0);
    while (color.toString(16).length < 6) {
      color = (Math.random() * 2 ** 24 << 0);
    }
    book.style = `--background-color: #${color.toString(16)};--color: ${color > 8388608 ? '#000' : 'bisque'};--height:${Math.random() * 5 + 23}vmin;--no:${Math.floor(b / 3)}`;
    document.getElementsByClassName('shelf')[b % 3].appendChild(book);
  }
}

document.body.onload = load;
