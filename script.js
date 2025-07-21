document.addEventListener("DOMContentLoaded", () => {
    // Dark Mode Toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

// Kanji Reader Functionality
    const kanjiContainer = document.getElementById("kanji-container");
    const playBtn = document.getElementById("playAllBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const progressBar = document.getElementById("progressBar");
    const fontSelector = document.getElementById("fontSelector");
    const jsonDataElement = document.getElementById("jsonData");
    const rateControl = document.getElementById("rateControl");
    const pitchControl = document.getElementById("pitchControl");
    const rateValue = document.getElementById("rateValue");
    const pitchValue = document.getElementById("pitchValue");
    
    // Update display values on change
    rateControl.addEventListener("input", () => {
        rateValue.textContent = `${rateControl.value}x`;
        localStorage.setItem("ttsRate", rateControl.value);
    });
    
    pitchControl.addEventListener("input", () => {
        pitchValue.textContent = `${pitchControl.value}`;
        localStorage.setItem("ttsPitch", pitchControl.value);
    });
    
    // Load preferences
    rateControl.value = localStorage.getItem("ttsRate") || "0.9";
    pitchControl.value = localStorage.getItem("ttsPitch") || "1";
    rateValue.textContent = `${rateControl.value}x`;
    pitchValue.textContent = `${pitchControl.value}`;
    
   let kanjiWords = [];
    let kanjiData = []; // Store original JSON data
    let utterance = null;
    let currentIndex = 0;
    let isPaused = false;
    let japaneseVoice = null;
    let selectedStartIndex = -1; //track user selected start position

    // Try to find the best Japanese voice (preferably Google's)
    function findJapaneseVoice() {
        const voices = speechSynthesis.getVoices();
        
        // Look for Google Japanese voices first
        const googleVoices = voices.filter(v => 
            v.lang === 'ja-JP' && v.name.includes('Google')
        );
        
        if (googleVoices.length > 0) {
            return googleVoices[0]; // Use the first Google Japanese voice
        }
        
        // Fallback to any Japanese voice
        const jpVoices = voices.filter(v => v.lang === 'ja-JP');
        if (jpVoices.length > 0) {
            return jpVoices[0];
        }
        
        // If no Japanese voices, return first available
        return voices.length > 0 ? voices[0] : null;
    }

    // Initialize voices
    function initVoices() {
        if (speechSynthesis.getVoices().length > 0) {
            japaneseVoice = findJapaneseVoice();
        } else {
            speechSynthesis.addEventListener('voiceschanged', () => {
                japaneseVoice = findJapaneseVoice();
            });
        }
    }
    
    initVoices();

function renderKanji(data) {
        kanjiData = data; // Store original data
        kanjiContainer.innerHTML = "";
        data.forEach((k, index) => {
            const span = document.createElement("span");
            span.className = "kanji-word";
            span.setAttribute("data-reading", k.reading);
            span.setAttribute("data-meaning", k.meaning);
            span.dataset.index = index;
            span.textContent = k.kanji;

            const tooltip = document.createElement("span");
            tooltip.className = "tooltip";
            // Handle array-based readings
            const displayReading = Array.isArray(k.reading) 
                ? k.reading.join(", ") 
                : k.reading;
            tooltip.textContent = `${displayReading} – ${k.meaning}`;

            span.appendChild(tooltip);
            kanjiContainer.appendChild(span);
        });

        initTooltips();
        kanjiWords = Array.from(document.querySelectorAll(".kanji-word"));
        
        // Add click handler for each kanji word
        kanjiWords.forEach(word => {
            word.addEventListener("click", function() {
                // Clear previous selection
                kanjiWords.forEach(w => w.classList.remove("selected-start"));
                
                // Highlight selected kanji as starting point
                this.classList.add("selected-start");
                
                // Set current index to the clicked kanji
                selectedStartIndex = parseInt(this.dataset.index);
                
                // Update UI to show we're ready to play from here
                playBtn.innerHTML = '<i class="fas fa-play"></i> Play From Here';
            });
        });
    }

    function initTooltips() {
        document.querySelectorAll(".kanji-word").forEach((w) => {
            w.addEventListener("mouseenter", () => {
                w.querySelector(".tooltip").style.opacity = "1";
            });
            w.addEventListener("mouseleave", () => {
                w.querySelector(".tooltip").style.opacity = "0";
            });
        });
    }

    function updateProgress() {
        const percent = ((currentIndex + 1) / kanjiWords.length) * 100;
        progressBar.style.width = `${percent}%`;
    }

     function speakNext() {
        if (currentIndex >= kanjiWords.length) {
            currentIndex = 0;
            selectedStartIndex = -1;
            playBtn.innerHTML = '<i class="fas fa-redo"></i> Restart';
            return;
        }

        kanjiWords.forEach((w) => w.classList.remove("active-reading"));
        const currentWord = kanjiWords[currentIndex];
        currentWord.classList.add("active-reading");

        currentWord.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });

        updateProgress();

        // Get reading from stored JSON data
        const currentItem = kanjiData[currentIndex];
        let text = "";
        
        // Handle different reading formats:
        if (currentItem.reading) {
            // Use first reading if array
            text = Array.isArray(currentItem.reading)
                ? currentItem.reading[0]
                : currentItem.reading;
        } else {
            // Fallback to kanji if no reading exists
            text = currentItem.kanji;
        }

        speechSynthesis.cancel();
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = parseFloat(rateControl.value);
        utterance.pitch = parseFloat(pitchControl.value);
        
        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
        }

        utterance.onend = () => {
            if (!isPaused) {
                currentIndex++;
                speakNext();
            }
        };

        speechSynthesis.speak(utterance);
    }

    playBtn.addEventListener("click", () => {
        // If a specific kanji is selected, start from there
        if (selectedStartIndex >= 0) {
            currentIndex = selectedStartIndex;
            
            // Clear the selection after starting
            kanjiWords.forEach(w => w.classList.remove("selected-start"));
            selectedStartIndex = -1;
        }
        
        if (speechSynthesis.speaking && isPaused) {
            // Resume from pause
            isPaused = false;
            speechSynthesis.resume();
            playBtn.innerHTML = '<i class="fas fa-play"></i> Playing...';
        } else if (!speechSynthesis.speaking) {
            // Start speaking
            isPaused = false;
            speakNext();
            playBtn.innerHTML = '<i class="fas fa-play"></i> Playing...';
        }
    });

    pauseBtn.addEventListener("click", () => {
        if (speechSynthesis.speaking) {
            isPaused = true;
            speechSynthesis.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        }
    });

    // Stop speech when page unloads
    window.addEventListener("beforeunload", () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    });

    // Font selector functionality
    fontSelector.addEventListener("change", function () {
        kanjiContainer.style.fontFamily = this.value;
        localStorage.setItem("selectedFont", this.value);
    });
    
    // Load saved font preference
    const savedFont = localStorage.getItem("selectedFont");
    if (savedFont) {
        fontSelector.value = savedFont;
        kanjiContainer.style.fontFamily = savedFont;
    }

    // Load kanji data
    function loadKanjiData() {
        fetch("kanji-data.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok: " + res.status);
                }
                return res.json();
            })
            .then((data) => {
                jsonDataElement.textContent = JSON.stringify(data, null, 2);
                renderKanji(data);
            })
            .catch((err) => {
                kanjiContainer.innerHTML = "<p style='color:red;'>Error loading kanji data: " + err.message + "</p>";
                console.error(err);
            });
    }

    loadKanjiData();
});