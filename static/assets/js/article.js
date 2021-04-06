const articleId = document.getElementById('articleId').innerText;

function react(reaction) {
  const button = document.querySelector(`.reactions__button[data-reaction=${reaction}]`);
  button.classList.toggle('checked');
  const state = button.classList.contains('checked');
  const reactionsObject = JSON.parse(localStorage.getItem(`${articleId}-reactions`));
  reactionsObject[reaction] = state;
  localStorage.setItem(`${articleId}-reactions`, JSON.stringify(reactionsObject));

  const counter = document.querySelector(`.reactions__button[data-reaction=${reaction}] .reactions__count`);
  let count = parseInt(counter.innerText, 10) ? parseInt(counter.innerText, 10) : 0;
  if (state) count += 1;
  else count -= 1;
  if (count >= 0) simplePost(`/blog/article/${articleId}/react/${reaction}/${state ? 'add' : 'remove'}`);
  count = count > 0 ? count : 0;
  counter.innerText = count || '';
}

if (!localStorage.getItem(`${articleId}-reactions`)) {
  localStorage.setItem(`${articleId}-reactions`, JSON.stringify({}));
}

const reactionsObject = JSON.parse(localStorage.getItem(`${articleId}-reactions`));
Object.keys(reactionsObject).forEach((reaction) => {
  if (reactionsObject[reaction]) document.querySelector(`.reactions__button[data-reaction=${reaction}]`).classList.add('checked');
});
