// Initialize Variables
let prevScrollpos = window.pageYOffset;

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

//Console Message
console.log('                                                  \n                                                  \n                                                  \n                 &@@@@@@@@@@@@@@@#                \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n         @@@@@@@@@@@@@@&, ,&@@@@@@@@@@@@@@        \n      &@@@@@@@@                     @@@@@@@@/     \n    @@@@@@@.            *@@@@@@        (@@@@@@,   \n   @@@@@@                @@@@@@@@         @@@@@@  \n (@@@@@@        &        @@@@@@@@@(        @@@@@@.\n&@@@@@@         @@@@@@@@@@@@@@@@@@@         @@@@@@\n  @@@@@@        &@@@@@@@@@@@@@@@@@*        @@@@@@ \n   @@@@@@        .@@@@@@@@@@@@@@@         @@@@@(  \n     ,@@@@@*        @@@@@@@@@@@        &@@@@@     \n        @@@@@@@                     @@@@@@&       \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n                   #@@@@@@@@@@@(                  \n                                                  \n                                                  \n                                                  \n');
console.log('%cSee With Eyes Closed', 'font-size:30px');
console.log('Found a bug? Want to help me with my code?\nLet me know at https://seewitheyesclosed.com/contact/ or visit this site\'s Github repository at https://github.com/benjaminbhollon/see-with-eyes-closed');
