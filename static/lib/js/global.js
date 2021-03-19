// Initialize Variables
let prevScrollpos = window.pageYOffset;

// Color theme
const getCSSCustomProp = (propKey, element = document.documentElement, castAs = 'string') => {
  let response = getComputedStyle(element).getPropertyValue(propKey);

  // Tidy up the string if there's something to work with
  if (response.length) {
    response = response.replace(/\'|"/g, '').trim();
  }

  // Convert the response into a whatever type we wanted
  switch (castAs) {
    case 'number':
    case 'int':
      return parseInt(response, 10);
    case 'float':
      return parseFloat(response, 10);
    case 'boolean':
    case 'bool':
      return response === 'true' || response === '1';
  }

  // Return the string response by default
  return response;
};
function toggleTheme() {
  const newTheme = (document.querySelector('#colorThemeToggle input').checked ? 'dark' : 'light');
  document.documentElement.dataset.theme = newTheme;
  $.post(`/theme/set/${newTheme}`);
}
if (getCSSCustomProp('--background-color') === '#333') document.querySelector('#colorThemeToggle input').checked = true;

// Scroll function
document.addEventListener('scroll', () => {
  const currentScrollPos = window.pageYOffset;
  // Checks if the page is scrolled, update "data-scrolled" class accordingly
  if (prevScrollpos > currentScrollPos || currentScrollPos < 75) {
    document.getElementsByTagName('BODY')[0].setAttribute('data-scrolled', 'up');
  } else {
    document.getElementsByTagName('BODY')[0].setAttribute('data-scrolled', 'down');
  }
  prevScrollpos = currentScrollPos;
});

// Console Message
console.log('                                                  \n                                                  \n                                                  \n                 &@@@@@@@@@@@@@@@#                \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n         @@@@@@@@@@@@@@&, ,&@@@@@@@@@@@@@@        \n      &@@@@@@@@                     @@@@@@@@/     \n    @@@@@@@.            *@@@@@@        (@@@@@@,   \n   @@@@@@                @@@@@@@@         @@@@@@  \n (@@@@@@        &        @@@@@@@@@(        @@@@@@.\n&@@@@@@         @@@@@@@@@@@@@@@@@@@         @@@@@@\n  @@@@@@        &@@@@@@@@@@@@@@@@@*        @@@@@@ \n   @@@@@@        .@@@@@@@@@@@@@@@         @@@@@(  \n     ,@@@@@*        @@@@@@@@@@@        &@@@@@     \n        @@@@@@@                     @@@@@@&       \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n                   #@@@@@@@@@@@(                  \n                                                  \n                                                  \n                                                  \n');
console.log('%cSee With Eyes Closed', 'font-size:30px');
console.log('Found a bug? Want to help me with my code?\nLet me know at https://seewitheyesclosed.com/contact/ or visit this site\'s Github repository at https://github.com/benjaminbhollon/see-with-eyes-closed');
