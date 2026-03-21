$(document).ready(function(){
  // Sticky navbar background on scroll
  $(window).on('scroll',function(){
    var scroll = $(window).scrollTop();
    if(scroll >=50){
      $("nav.r-nav-custom").addClass("navbar-scrolled");
    } else {
      $("nav.r-nav-custom").removeClass("navbar-scrolled");
    }
  });

  // Typewriter animation
  var typed = new Typed(".element", {
    strings: [
      "Twisha Patel"
    ],
    smartBackspace: true,
    typeSpeed: 70,
    backSpeed: 40,
    loop: true,
    loopCount: Infinity,
    startDelay: 700
  });

  // Smooth scrolling for anchor links (offset for fixed navbar)
  $('a.nav-link').on('click', function(event){
    var target = $(this.hash);
    if(target.length){
      event.preventDefault();
      var navOffset = 80;
      $('html, body').animate({
        scrollTop: target.offset().top - navOffset
      }, 600);
    }
  });
});
