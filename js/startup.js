        function relay() {
          if (bg) IDS.forEach(place);
          else {
            IDS.forEach(function (id) {
              $("#" + id).setAttribute("style", D0[id]);
            });
            applyLy();
          }
        }
        function skins() {
          var Q = {
            s1: "#shelf",
            s2: "#board",
            s3: ".fridge",
            s4: ".desk",
            s5: ".mf",
            s6: ".tvw",
            s7: ".rad",
            s8: ".wcal",
            s9: ".mb",
            s10: ".teapot-spot",
          };
          IDS.forEach(function (id) {
            var el = $(Q[id]);
            if (IM[id]) {
              el.innerHTML =
                '<img src="' +
                IM[id] +
                '" alt="" style="width:100%;display:block;pointer-events:none">';
              el.classList.add("noskin");
            } else el.classList.remove("noskin");
          });
        }
        var _dr = drawRoom;
        drawRoom = function () {
          _dr();
          skins();
        };
        function arrange() {
          var h =
            '<h2>✏️ arrange my room</h2><p class="muted">Move and resize anything, and swap my drawings for your own pictures. A single object on a transparent background (PNG) looks best.</p><div class="bar"><button class="btn" id="ar1">Start arranging</button><button class="btn ghost" id="ar2">Reset layout</button></div>';
          IDS.forEach(function (id) {
            h +=
              '<div class="todo"><span style="flex:1">' +
              NM[id] +
              (IM[id] ? " ✓" : "") +
              '</span><label class="btn ghost" style="cursor:pointer">Upload<input type="file" accept="image/*" data-oi="' +
              id +
              '" hidden></label>' +
              (IM[id]
                ? '<button class="btn ghost" data-or="' +
                  id +
                  '">Use my drawing</button>'
                : "") +
              "</div>";
          });
          h +=
            '<p class="muted" id="am2">Pictures stay on this device and are shrunk to save space.</p>';
          $("#body").innerHTML = h;
          $("#ar1").onclick = function () {
            closeM();
            editing = true;
            sc.classList.add("edit");
            $("#eb").hidden = false;
          };
          $("#ar2").onclick = function () {
            delete S.hs;
            delete S.ly;
            save();
            relay();
            $("#am2").textContent = "Layout reset.";
          };
          document.querySelectorAll("[data-or]").forEach(function (b) {
            b.onclick = function () {
              delete IM[b.dataset.or];
              imSave();
              drawRoom();
              arrange();
            };
          });
          document.querySelectorAll("[data-oi]").forEach(function (inp) {
            inp.onchange = function () {
              var f = inp.files[0],
                id = inp.dataset.oi;
              if (!f) return;
              var r = new FileReader();
              r.onload = function () {
                var im = new Image();
                im.onload = function () {
                  var s = Math.min(1, 560 / im.width),
                    c = document.createElement("canvas");
                  c.width = im.width * s;
                  c.height = im.height * s;
                  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
                  var old = IM[id];
                  IM[id] = c.toDataURL(
                    /jpe?g/i.test(f.type) ? "image/jpeg" : "image/png",
                    0.85,
                  );
                  if (!imSave()) {
                    if (old) IM[id] = old;
                    else delete IM[id];
                    $("#am2").textContent =
                      "Not enough space on this device for that picture. Try a smaller one.";
                  } else {
                    drawRoom();
                    arrange();
                  }
                };
                im.onerror = function () {
                  $("#am2").textContent =
                    "That file couldn’t be read as a picture.";
                };
                im.src = r.result;
              };
              r.readAsDataURL(f);
            };
          });
        }
        $("#ab").onclick = function () {
          openM();
          arrange();
        };
        $("#ed2").onclick = function () {
          delete S.hs;
          delete S.ly;
          save();
          relay();
        };

        /* theme toggle */
        (function () {
          var KEY = "cozyroom_theme";
          function applyTheme(t) {
            if (t === "dark" || t === "light") {
              document.documentElement.setAttribute("data-theme", t);
            } else {
              document.documentElement.removeAttribute("data-theme");
            }
            var btn = document.getElementById("th");
            if (btn) btn.textContent = (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) ? "☀️" : "🌙";
          }
          var saved = null;
          try { saved = localStorage.getItem(KEY); } catch (e) {}
          applyTheme(saved);
          var thBtn = document.getElementById("th");
          if (thBtn) {
            thBtn.onclick = function () {
              var cur = document.documentElement.getAttribute("data-theme");
              var next;
              if (cur === "dark") next = "light";
              else if (cur === "light") next = "dark";
              else next = window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
              try { localStorage.setItem(KEY, next); } catch (e) {}
              applyTheme(next);
            };
          }
        })();
        load();
        try {
          bg = localStorage.getItem(BGK);
        } catch (e) {}
        if (!bg) {
          bg = "wonderland-new.png";
        }
        drawRoom();
        fit();
        if (bg) mode();
        else applyLy();
        var installPrompt = null,
          installButton = document.getElementById("install-app");
        window.addEventListener("beforeinstallprompt", function (event) {
          event.preventDefault();
          installPrompt = event;
        });
        window.addEventListener("appinstalled", function () {
          installPrompt = null;
        });
        installButton.onclick = function () {
          if (
            window.matchMedia("(display-mode: standalone)").matches ||
            navigator.standalone
          ) {
            window.alert("My Wonderland is already installed.");
            return;
          }
          if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice
              .then(function (choice) {
                installPrompt = null;
                if (choice.outcome === "accepted") {
                  window.alert("My Wonderland is installing.");
                }
              })
              .catch(function (error) {
                console.error("Could not start app installation.", error);
                window.alert("The install prompt could not be opened. Try your browser menu.");
              });
            return;
          }
          window.alert(
            "To install, open this app from its HTTPS website (not a local file). On iPhone, use Safari Share > Add to Home Screen. On Android, use Chrome's menu > Install app or Add to Home screen.",
          );
        };
        if ("serviceWorker" in navigator) {
          window.addEventListener("load", function () {
            navigator.serviceWorker.register("./sw.js").catch(function (error) {
              console.error("Could not register the offline app worker.", error);
            });
          });
        }
