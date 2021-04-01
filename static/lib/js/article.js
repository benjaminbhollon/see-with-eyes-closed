const articleId = document.getElementById('articleId').innerText;

function react(reaction) {
  const button = document.querySelector(`.reactions__button[data-reaction=${reaction}]`);
  button.classList.toggle('checked');
  const state = button.classList.contains('checked');
  let reactionsObject = JSON.parse(localStorage.getItem(articleId + '-reactions'));
  reactionsObject[reaction] = state;
  localStorage.setItem(articleId + '-reactions', JSON.stringify(reactionsObject));
}

if (!localStorage.getItem(articleId + '-reactions')) {
  localStorage.setItem(articleId + '-reactions', JSON.stringify({}));
}

let reactionsObject = JSON.parse(localStorage.getItem(articleId + '-reactions'));
Object.keys(reactionsObject).forEach((reaction) => {
  if (reactionsObject[reaction]) document.querySelector(`.reactions__button[data-reaction=${reaction}]`).classList.add('checked');
});
