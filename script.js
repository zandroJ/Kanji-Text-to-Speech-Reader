document.addEventListener("DOMContentLoaded", () => {
      const kanjiContainer = document.getElementById("kanji-container");
      const playBtn = document.getElementById("playAllBtn");
      const pauseBtn = document.getElementById("pauseBtn");
      const progressBar = document.getElementById("progressBar");
      const fontSelector = document.getElementById("fontSelector");
      const jsonDataElement = document.getElementById("jsonData");

      let kanjiWords = [];
      let utterance = null;
      let currentIndex = 0;
      let isPaused = false;

      function renderKanji(data) {
        kanjiContainer.innerHTML = "";
        data.forEach((k) => {
          const span = document.createElement("span");
          span.className = "kanji-word";
          span.setAttribute("data-reading", k.reading);
          span.setAttribute("data-meaning", k.meaning);
          span.textContent = k.kanji;

          const tooltip = document.createElement("span");
          tooltip.className = "tooltip";
          tooltip.textContent = `${k.reading} – ${k.meaning}`;

          span.appendChild(tooltip);
          kanjiContainer.appendChild(span);
        });

        initTooltips();
        kanjiWords = Array.from(document.querySelectorAll(".kanji-word"));
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
          playBtn.innerHTML = '<i class="fas fa-redo"></i> Restart';
          return;
        }

        kanjiWords.forEach((w) =>
          w.classList.remove("active-reading")
        );
        const w = kanjiWords[currentIndex];
        w.classList.add("active-reading");
        w.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        updateProgress();

        const text = w.getAttribute("data-reading");
        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.9;

        utterance.onend = () => {
          if (!isPaused) {
            currentIndex++;
            speakNext();
          }
        };

        speechSynthesis.speak(utterance);
      }

  playBtn.addEventListener("click", () => {
  if (speechSynthesis.speaking && isPaused) {
    // Resume from pause
    isPaused = false;
    speechSynthesis.resume();
    playBtn.innerHTML = '<i class="fas fa-play"></i> Playing...';
  } else if (!speechSynthesis.speaking && !isPaused) {
    // Only reset index if not paused and not currently speaking
    currentIndex = 0;
    speakNext();
    playBtn.innerHTML = '<i class="fas fa-play"></i> Playing...';
  } else if (!speechSynthesis.speaking && isPaused) {
    // If paused and speech has finished (e.g. from stop), resume from currentIndex
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

      window.addEventListener("beforeunload", () => {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }
      });

      fontSelector.addEventListener("change", function () {
        kanjiContainer.style.fontFamily = this.value;
      });

      function loadKanjiData() {
        fetch("kanji-data.json")
          .then((res) => {
            if (!res.ok) {
              throw new Error(
                "Network response was not ok: " + res.status
              );
            }
            return res.json();
          })
          .then((data) => {
            jsonDataElement.textContent = JSON.stringify(
              data,
              null,
              2
            );
            renderKanji(data);
          })
          .catch((err) => {
            kanjiContainer.innerHTML =
              "<p style='color:red;'>Error loading kanji data: " +
              err.message +
              "</p>";
            console.error(err);
          });
      }

      loadKanjiData();
    });