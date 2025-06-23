window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  const text1 = document.getElementById('text1');
  const text2 = document.getElementById('text2');
  const mainContent = document.getElementById('main-content');

  // Check if animation has already played
  if(!sessionStorage.getItem('introPlayed')) {
      // Animation sequence
      setTimeout(() => {
          preloader.style.backgroundColor = 'black';
          
          setTimeout(() => {
              text1.style.opacity = 1;
              
              setTimeout(() => {
                  text1.style.opacity = 0;
                  text2.style.opacity = 1;
                  
                  setTimeout(() => {
                      preloader.style.opacity = '0';
                      
                      setTimeout(() => {
                          preloader.remove();
                          mainContent.style.display = 'block';
                          setTimeout(() => {
                              mainContent.style.opacity = '1';
                          }, 50);
                          
                          // Set flag in session storage
                          sessionStorage.setItem('introPlayed', 'true');
                          //setting the transition here
                      }, 0); //500
                  }, 0);  //3000
              }, 0);  //3000
          }, 0); //1000
      }, 0); //3000
  } else {
      // Skip animation if already played
      preloader.style.display = 'none';
      mainContent.style.display = 'block';
      mainContent.style.opacity = '1';
  }
  var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
  };
  
  TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];
  
    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }
  
    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';
  
    var that = this;
    var delta = 200 - Math.random() * 100;
  
    if (this.isDeleting) { delta /= 2; }
  
    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }
  
    setTimeout(function() {
        that.tick();
    }, delta);
  };
  
  // Replace the window.onload block with:
var elements = document.getElementsByClassName('typewrite');
for (var i=0; i<elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-type');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
        new TxtType(elements[i], JSON.parse(toRotate), period);
    }
}
var css = document.createElement("style");
css.type = "text/css";
css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
document.body.appendChild(css);

});


    // Disable Ctrl+U
document.onkeydown = function(e) {
    if (e.ctrlKey && e.keyCode === 85) {
        return false;
    }
};

// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable F12
document.addEventListener('keydown', function(event) {
    if (event.keyCode === 123) {
        event.preventDefault();
    }
});

document.querySelectorAll("details").forEach((detail) => {
    detail.addEventListener("toggle", function () {
      if (!this.open) {
        this.classList.add("closing");
        setTimeout(() => {
          this.removeAttribute("open");
          this.classList.remove("closing");
        }, 400); // Matches transition duration
      }
    });
  
    // Ensure clicking summary doesn't instantly close the details
    detail.querySelector("summary").addEventListener("click", function (event) {
      if (detail.open) {
        event.preventDefault(); // Prevent instant close
        detail.classList.add("closing");
        setTimeout(() => {
          detail.removeAttribute("open");
          detail.classList.remove("closing");
        }, 400);
      }
    });
  });
  

// Add this to script.js
document.addEventListener('DOMContentLoaded', function() {
  if(document.querySelector('pre code')) {
    import('https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js')
      .then(() => Prism.highlightAll());
  }
});


//Modal functionality for the kanji
document.addEventListener("DOMContentLoaded", function () {
  const kanjiContainer = document.getElementById("kanji-container");

  // Fetch kanji data from JSON file
  fetch("/kanji-data.json")
      .then(response => response.json())
      .then(data => {
          // Add kanji words to the container
          kanjiContainer.innerHTML = data.map(kanji => `
              <span class="kanji-word" data-reading="${kanji.reading}" data-meaning="${kanji.meaning}">
                  ${kanji.kanji}
                  <span class="tooltip"></span>
              </span>
          `).join(" ");
      })
      .catch(error => console.error("Error loading Kanji data:", error));

  // Tooltip scaling function
  function updateTooltipScale() {
      const zoomLevel = window.devicePixelRatio || 1;
      const tooltips = document.querySelectorAll(".tooltip");
      tooltips.forEach(tooltip => {
          tooltip.style.transform = `scale(${1 / zoomLevel})`;
          tooltip.style.transformOrigin = 'top left';
      });
  }

  // Event delegation for kanji clicks
  document.addEventListener("click", function (event) {
      if (event.target.classList.contains("kanji-word")) {
          const tooltip = event.target.querySelector(".tooltip");
          const reading = event.target.getAttribute("data-reading");
          const meaning = event.target.getAttribute("data-meaning");

          // Hide all other tooltips
          document.querySelectorAll(".kanji-word").forEach(el => el.classList.remove("active"));

          // Show tooltip
          tooltip.innerText = `${reading} - ${meaning}`;
          event.target.classList.add("active");

          updateTooltipScale(); // <- Apply scale on show

          // Prevent click from closing the tooltip immediately
          event.stopPropagation();
      } else {
          // Hide tooltip when clicking outside
          document.querySelectorAll(".kanji-word").forEach(el => el.classList.remove("active"));
      }
  });

  // Update scale when window is resized
  window.addEventListener('resize', updateTooltipScale);
});



// Custom dropdown functionality
const customSelect = document.querySelector('.custom-select');
const selectHeader = document.querySelector('.select-header');
const selectedOption = document.querySelector('.selected-option');
const options = document.querySelectorAll('.option');

// Toggle dropdown
selectHeader.addEventListener('click', (e) => {
    customSelect.classList.toggle('active');
    document.querySelector('.select-options').classList.toggle('active');
});

// Option selection
options.forEach(option => {
    option.addEventListener('click', () => {
        const value = option.dataset.value;
        const text = option.textContent;
        
        // Update display
        selectedOption.textContent = text;
        customSelect.classList.remove('active');
        document.querySelector('.select-options').classList.remove('active');
        
        // Apply font change with transition
        const kanjiContainer = document.getElementById('kanji-container');
        kanjiContainer.style.transition = 'font-family 0.3s ease-in-out';
        kanjiContainer.style.fontFamily = value;
        
        // Reset transition after completion
        setTimeout(() => {
            kanjiContainer.style.transition = '';
        }, 300);
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
        customSelect.classList.remove('active');
        document.querySelector('.select-options').classList.remove('active');
    }
});

// Keyboard accessibility
selectHeader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        customSelect.classList.toggle('active');
        document.querySelector('.select-options').classList.toggle('active');
    }
});

