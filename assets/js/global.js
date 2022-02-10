// Initialize Variables
let prevScrollpos = window.pageYOffset;

// AJAX POST
async function simplePost(url, callback) {
  const request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if (this.readyState === 4 && this.status === 200) {
      if (callback) callback();
    }
  };
  request.open('POST', url, true);
  request.send();
}

// Console Message
console.log('                                                  \n                                                  \n                                                  \n                 &@@@@@@@@@@@@@@@#                \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n         @@@@@@@@@@@@@@&, ,&@@@@@@@@@@@@@@        \n      &@@@@@@@@                     @@@@@@@@/     \n    @@@@@@@.            *@@@@@@        (@@@@@@,   \n   @@@@@@                @@@@@@@@         @@@@@@  \n (@@@@@@        &        @@@@@@@@@(        @@@@@@.\n&@@@@@@         @@@@@@@@@@@@@@@@@@@         @@@@@@\n  @@@@@@        &@@@@@@@@@@@@@@@@@*        @@@@@@ \n   @@@@@@        .@@@@@@@@@@@@@@@         @@@@@(  \n     ,@@@@@*        @@@@@@@@@@@        &@@@@@     \n        @@@@@@@                     @@@@@@&       \n            @@@@@@@@@@@@@@@@@@@@@@@@@@@           \n                   #@@@@@@@@@@@(                  \n                                                  \n                                                  \n                                                  \n');
console.log('%cSee With Eyes Closed', 'font-size:30px');
console.log('Found a bug? Want to help me with my code?\nLet me know at https://seewitheyesclosed.com/contact/ or visit this site\'s Github repository at https://github.com/benjaminbhollon/see-with-eyes-closed');
