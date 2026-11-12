        function fixu(u) {
          u = (u || "").trim();
          if (!u) return "";
          return /^https?:\/\//i.test(u) ? u : "https://" + u;
        }
        function links(kind) {
          var tvm = kind === "tv",
            L = S.links[kind],
            cs = LC[kind],
            main =
              S.main[kind] ||
              (tvm
                ? "https://www.youtube.com/playlist?list=WL"
                : "https://music.youtube.com/"),
            h =
              "<h2>" +
              (tvm ? "📺 TV" : "📻 radio") +
              '</h2><div class="bar"><a class="btn" target="_blank" rel="noopener" href="' +
              esc(main) +
              '">' +
              (tvm ? "▶ Open Watch Later" : "♪ Open my playlist") +
              '</a></div><details><summary class="muted">Change this main link</summary><div class="bar" style="margin-top:8px"><input id="ml" placeholder="Paste a link" value="' +
              esc(S.main[kind] || "") +
              '" style="flex:1"><button class="btn" id="mls">Save</button></div></details><p class="muted">Links open in a new tab, because YouTube can’t play inside an offline app.</p><div class="tabs">' +
              ["All"]
                .concat(cs)
                .map(function (c) {
                  return (
                    '<button data-lf="' +
                    c +
                    '" class="' +
                    (LF[kind] === c ? "on" : "") +
                    '">' +
                    c +
                    "</button>"
                  );
                })
                .join("") +
              "</div>",
            sh = L.filter(function (x) {
              return LF[kind] === "All" || x.c === LF[kind];
            });
          if (!sh.length)
            h +=
              '<p class="muted">Nothing saved here yet. Paste a video or playlist link below.</p>';
          sh.forEach(function (x) {
            h +=
              '<div class="todo"><span class="muted" style="min-width:90px">' +
              esc(x.c) +
              '</span><a href="' +
              esc(x.u) +
              '" target="_blank" rel="noopener" style="flex:1;color:var(--ink)">' +
              esc(x.t) +
              ' ↗</a><button data-ld="' +
              x.id +
              '" aria-label="Delete" style="background:none;border:0">✕</button></div>';
          });
          h +=
            '<div class="bar" style="margin-top:12px"><input id="lt" placeholder="Title" style="flex:1;min-width:110px"><input id="lu" placeholder="Paste link" style="flex:2;min-width:140px"><select id="lc">' +
            cs
              .map(function (c) {
                return "<option>" + c + "</option>";
              })
              .join("") +
            '</select><button class="btn" id="la">Add</button></div>';
          $("#body").innerHTML = h;
          $("#mls").onclick = function () {
            S.main[kind] = fixu($("#ml").value);
            save();
            links(kind);
          };
          document.querySelectorAll("[data-lf]").forEach(function (b) {
            b.onclick = function () {
              LF[kind] = b.dataset.lf;
              links(kind);
            };
          });
          document.querySelectorAll("[data-ld]").forEach(function (b) {
            b.onclick = function () {
              S.links[kind] = L.filter(function (x) {
                return x.id !== b.dataset.ld;
              });
              save();
              links(kind);
            };
          });
          $("#la").onclick = function () {
            var u = fixu($("#lu").value);
            if (!u) return;
            L.push({
              id: uid(),
              t: $("#lt").value.trim() || u,
              u: u,
              c: $("#lc").value,
            });
            save();
            links(kind);
          };
        }
        var AFF = [
          "I am becoming the woman I keep imagining.",
          "Small steady steps are my superpower.",
          "Rest is part of the plan, not a break from it.",
          "I think clearly, act bravely, and finish what I start.",
          "I treat my time and money like they matter, because they do.",
          "I am allowed to take up space and glow.",
          "Discipline is how I take care of my future self.",
          "What I focus on grows, so I choose with love.",
          "I am proud of how far I’ve come.",
          "Today I do one brave thing.",
        ];
        var TAROT = [
          ["The Fool", "🌱", "a new start, a leap of faith"],
          ["The Magician", "✨", "you have the tools, start making it real"],
          [
            "The High Priestess",
            "🌙",
            "trust your intuition and listen inward",
          ],
          ["The Empress", "🌸", "nurture, abundance, enjoy comfort"],
          ["The Emperor", "🏛️", "structure, boundaries, steady leadership"],
          ["The Hierophant", "📜", "learn from tradition and good teachers"],
          ["The Lovers", "💞", "choices from the heart, aligned values"],
          ["The Chariot", "🏹", "drive and willpower carry you forward"],
          ["Strength", "🦁", "gentle courage, patience wins"],
          ["The Hermit", "🕯️", "quiet time to find your own answers"],
          ["Wheel of Fortune", "🎡", "a turning point, cycles change"],
          ["Justice", "⚖️", "fairness, honesty, cause and effect"],
          ["The Hanged One", "🙃", "pause and look from a new angle"],
          ["Death", "🦋", "an ending that clears space for change"],
          ["Temperance", "🧖", "balance, patience, blend the extremes"],
          ["The Devil", "⛓️", "notice habits that keep you stuck"],
          ["The Tower", "⚡", "sudden change that rebuilds you stronger"],
          ["The Star", "⭐", "hope, healing, renewed faith"],
          ["The Moon", "🌕", "uncertainty and dreams, go gently"],
          ["The Sun", "☀️", "joy, clarity, things going well"],
          ["Judgement", "📯", "a wake-up call, rise to your next chapter"],
          ["The World", "🌍", "completion, celebrate what you finished"],
        ];
