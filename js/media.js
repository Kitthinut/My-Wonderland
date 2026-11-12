        function fixu(u) {
          u = (u || "").trim();
          if (!u) return "";
          return /^https?:\/\//i.test(u) ? u : "https://" + u;
        }
        function youtubeEmbedUrl(value, autoplay) {
          var url;
          try {
            url = new URL(fixu(value));
          } catch (error) {
            return "";
          }
          var host = url.hostname.toLowerCase();
          if (
            [
              "youtube.com",
              "www.youtube.com",
              "m.youtube.com",
              "music.youtube.com",
              "youtu.be",
            ].indexOf(host) < 0
          ) {
            return "";
          }
          var video = "",
            list = url.searchParams.get("list") || "";
          if (host === "youtu.be") {
            video = url.pathname.slice(1).split("/")[0];
          } else {
            var match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
            video = url.searchParams.get("v") || (match && match[1]) || "";
          }
          if (!/^[A-Za-z0-9_-]{11}$/.test(video)) video = "";
          if (!/^[A-Za-z0-9_-]{2,200}$/.test(list) || list === "WL") list = "";
          if (!video && !list) return "";
          var params = new URLSearchParams();
          if (list) params.set("list", list);
          params.set("autoplay", autoplay ? "1" : "0");
          params.set("playsinline", "1");
          params.set("rel", "0");
          return (
            "https://www.youtube-nocookie.com/embed/" +
            (video || "videoseries") +
            "?" +
            params.toString()
          );
        }
        function youtubePlaylistId(value) {
          var embedURL = youtubeEmbedUrl(value, false);
          if (!embedURL) return "";
          return new URL(embedURL).searchParams.get("list") || "";
        }
        var radioPlaying = null,
          hideRadioPlayer = false;
        function links(kind, resetRadioPlayer) {
          if (kind === "radio" && resetRadioPlayer) {
            radioPlaying = null;
            hideRadioPlayer = false;
          }
          var tvm = kind === "tv",
            L = S.links[kind],
            cs = LC[kind],
            main =
              S.main[kind] ||
              (tvm
                ? "https://www.youtube.com/playlist?list=WL"
                : "https://music.youtube.com/"),
            mainEmbed = !tvm && youtubeEmbedUrl(main),
            sh = L.filter(function (x) {
              return LF[kind] === "All" || x.c === LF[kind];
            }),
            selected = null,
            embedURL = "";
          if (!tvm) {
            if (radioPlaying) {
              selected = radioPlaying.main
                ? { t: "My playlist", u: main }
                : L.filter(function (x) {
                    return x.id === radioPlaying.id;
                  })[0] || null;
              embedURL = selected
                ? youtubeEmbedUrl(selected.u, radioPlaying.autoplay)
                : "";
            } else if (!hideRadioPlayer) {
              var playlistItem = sh.filter(function (x) {
                return youtubePlaylistId(x.u);
              })[0];
              if (youtubePlaylistId(main)) {
                selected = { t: "My playlist", u: main };
              } else if (playlistItem) {
                selected = playlistItem;
              } else if (mainEmbed) {
                selected = { t: "My playlist", u: main };
              } else {
                selected = sh.filter(function (x) {
                  return youtubeEmbedUrl(x.u, false);
                })[0] || null;
              }
              embedURL = selected ? youtubeEmbedUrl(selected.u, false) : "";
            }
          }
          var h =
              "<h2>" +
              (tvm ? "📺 TV" : "📻 radio") +
              '</h2><div class="bar"><a class="btn" target="_blank" rel="noopener" href="' +
              esc(main) +
              '">' +
              (tvm ? "▶ Open Watch Later" : "♪ Open my playlist") +
              '</a>' +
              (mainEmbed
                ? '<button class="btn ghost" id="radio-play-main">▶ Play here</button>'
                : "") +
              '</div><details><summary class="muted">Change this main link</summary><div class="bar" style="margin-top:8px"><input id="ml" placeholder="Paste a link" value="' +
              esc(S.main[kind] || "") +
              '" style="flex:1"><button class="btn" id="mls">Save</button></div></details><p class="muted">' +
              (tvm
                ? "TV links open in YouTube."
                : "Play here requires an internet connection; some videos may not allow embedding.") +
              '</p><div class="tabs">' +
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
              "</div>";
          if (selected && embedURL) {
            h +=
              '<div class="youtube-player"><div class="youtube-player-heading"><b>▶ ' +
              esc(selected.t) +
              '</b><button class="btn ghost" id="radio-stop">Stop</button></div><div class="youtube-player-frame"><iframe src="' +
              esc(embedURL) +
              '" title="YouTube radio player" allow="autoplay; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>';
          }
          if (!sh.length)
            h +=
              '<p class="muted">Nothing saved here yet. Paste a video or playlist link below.</p>';
          sh.forEach(function (x) {
            var canPlay = !tvm && youtubeEmbedUrl(x.u);
            h +=
              '<div class="todo media-link"><span class="muted" style="min-width:90px">' +
              esc(x.c) +
              '</span><a href="' +
              esc(x.u) +
              '" target="_blank" rel="noopener" style="flex:1;color:var(--ink)">' +
              esc(x.t) +
              ' ↗</a><button data-ld="' +
              x.id +
              '" aria-label="Delete" style="background:none;border:0">✕</button>' +
              (canPlay
                ? '<button class="btn ghost" data-play="' +
                  x.id +
                  '">▶ Play here</button>'
                : "") +
              "</div>";
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
          var playMain = $("#radio-play-main");
          if (playMain) {
            playMain.onclick = function () {
              radioPlaying = { main: true, autoplay: true };
              hideRadioPlayer = false;
              links(kind);
            };
          }
          var stopRadio = $("#radio-stop");
          if (stopRadio) {
            stopRadio.onclick = function () {
              radioPlaying = null;
              hideRadioPlayer = true;
              links(kind);
            };
          }
          document.querySelectorAll("[data-play]").forEach(function (b) {
            b.onclick = function () {
              radioPlaying = { id: b.dataset.play, autoplay: true };
              hideRadioPlayer = false;
              links(kind);
            };
          });
          document.querySelectorAll("[data-lf]").forEach(function (b) {
            b.onclick = function () {
              LF[kind] = b.dataset.lf;
              links(kind);
            };
          });
          document.querySelectorAll("[data-ld]").forEach(function (b) {
            b.onclick = function () {
              if (radioPlaying && radioPlaying.id === b.dataset.ld) {
                radioPlaying = null;
              }
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
