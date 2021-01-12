//Initialize Variables
var prevScrollpos = window.pageYOffset;

//Scroll function
document.addEventListener("scroll", function () {
  var currentScrollPos = window.pageYOffset;
  //Checks if the page is scrolled, update "data-scrolled" class accordingly
  if (prevScrollpos > currentScrollPos || currentScrollPos < 75) {
    document.getElementsByTagName("BODY")[0].setAttribute("data-scrolled", "up");
  } else {
    document.getElementsByTagName("BODY")[0].setAttribute("data-scrolled", "down");
  }
  prevScrollpos = currentScrollPos;
});
