const articleId = document.getElementById('articleId').innerText;

function react(reaction) {
  const button = document.querySelector(`.reactions__button[data-reaction=${reaction}]`);
  button.classList.toggle('checked');
  const state = button.classList.contains('checked');
  const reactionsObject = JSON.parse(localStorage.getItem(`${articleId}-reactions`));
  reactionsObject[reaction] = state;
  localStorage.setItem(`${articleId}-reactions`, JSON.stringify(reactionsObject));

  const counter = document.querySelector(`.reactions__button[data-reaction=${reaction}] .reactions__count`)
  let count = parseInt(counter.innerText) ? parseInt(counter.innerText) : 0
  if (state) count++;
  else count--;
  count = count > 0 ? count : 0;
  counter.innerText = count ? count : '';
}

if (!localStorage.getItem(`${articleId}-reactions`)) {
  localStorage.setItem(`${articleId}-reactions`, JSON.stringify({}));
}

const reactionsObject = JSON.parse(localStorage.getItem(`${articleId}-reactions`));
Object.keys(reactionsObject).forEach((reaction) => {
  if (reactionsObject[reaction]) document.querySelector(`.reactions__button[data-reaction=${reaction}]`).classList.add('checked');
});
