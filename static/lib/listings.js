function more(id) {
  document.querySelector(`.listing__modal[data-id='${id}']`).setAttribute('data-visible', true);
}
function close(id) {
  document.querySelector(`.listing__modal[data-id='${id}']`).setAttribute('data-visible', false);
}
