        var VBK = "cozyroom_vb",
          VB = [],
          mt = "planner",
          md = null,
          VC = ["Discipline", "Motivation", "Self care", "Athena", "Other"],
          vf = "All",
          pick = "",
          vm = "";
        try {
          VB = JSON.parse(localStorage.getItem(VBK) || "[]");
        } catch (e) {}
        function vbSave() {
          try {
            localStorage.setItem(VBK, JSON.stringify(VB));
            return true;
          } catch (e) {
            return false;
          }
        }
        function manifest() {
          var M = S.mf,
            td = dstr();
          var dayKey = (mt === "planner" && md) ? md : td;
          M.days = M.days || {};
          var Day = M.days[dayKey] || (M.days[dayKey] = {
            choose: "",
            beliefs: "",
            affirmation: "",
            actions: ["", "", ""],
            actionDone: [false, false, false],
            see: "",
            feel: "",
            have: "",
            become: "",
            priorities: [
              { t: "", d: false },
              { t: "", d: false },
              { t: "", d: false },
              { t: "", d: false },
              { t: "", d: false }
            ],
            notes: ""
          });
          // normalize arrays
          if (!Day.actions || Day.actions.length < 3) Day.actions = (Day.actions || []).concat(["", "", ""]).slice(0, 3);
          if (!Day.actionDone || Day.actionDone.length < 3) Day.actionDone = (Day.actionDone || []).concat([false, false, false]).slice(0, 3);
          if (!Day.priorities || Day.priorities.length < 5) {
            Day.priorities = (Day.priorities || []).concat([
              { t: "", d: false }, { t: "", d: false }, { t: "", d: false }, { t: "", d: false }, { t: "", d: false }
            ]).slice(0, 5);
          }

          var h = '<h2>🔮 manifest corner</h2><div class="tabs">';
          [
            ["planner", "Planner"],
            ["ball", "Crystal ball"],
            ["tarot", "Tarot"],
            ["vision", "Vision board"]
          ].forEach(function (t) {
            h += '<button data-mt="'+t[0]+'" class="'+(mt===t[0]?'on':'')+'">'+t[1]+'</button>';
          });
          h += '</div>';

          if (mt === "planner") {
            h += '<div class="mf-head"><div class="sub">MANIFESTATION PLANNER</div></div>';
            h += '<div class="bar"><input type="date" id="mfd" value="'+(md||td)+'" aria-label="Date">';
            h += '<span class="muted">Saves for this day</span></div>';
            h += '<div class="mf-planner">';

            // LEFT
            h += '<div>';
            h += '<div class="mf-box"><h3><span class="star">✦</span> Today I choose to manifest</h3>';
            h += '<textarea id="mf-choose" placeholder="What are you calling in today…">'+esc(Day.choose||'')+'</textarea></div>';

            h += '<div class="mf-box"><h3><span class="star">✦</span> Limiting beliefs I release today</h3>';
            h += '<textarea id="mf-beliefs" placeholder="What belief are you letting go of…">'+esc(Day.beliefs||'')+'</textarea></div>';

            h += '<div class="mf-box"><h3><span class="star">✦</span> Daily affirmation</h3>';
            h += '<textarea id="mf-aff" placeholder="I am…">'+esc(Day.affirmation||'')+'</textarea></div>';

            h += '<div class="mf-box"><h3><span class="star">✦</span> Action plan</h3>';
            for (var ai = 0; ai < 3; ai++) {
              h += '<div class="mf-act">';
              h += '<input type="checkbox" data-ad="'+ai+'"'+(Day.actionDone[ai]?' checked':'')+' aria-label="Done">';
              h += '<input type="text" data-at="'+ai+'" value="'+esc(Day.actions[ai]||'')+'" placeholder="Step '+(ai+1)+'">';
              h += '</div>';
            }
            h += '</div></div>';

            // RIGHT
            h += '<div>';
            h += '<div class="mf-box mf-viz"><h3><span class="star">✦</span> Visualization</h3>';
            h += '<label>I SEE</label><input type="text" id="mf-see" value="'+esc(Day.see||'')+'" placeholder="What do you see…">';
            h += '<label>I FEEL</label><input type="text" id="mf-feel" value="'+esc(Day.feel||'')+'" placeholder="What do you feel…">';
            h += '<label>I HAVE</label><input type="text" id="mf-have" value="'+esc(Day.have||'')+'" placeholder="What do you already have…">';
            h += '<label>I AM BECOMING</label><input type="text" id="mf-become" value="'+esc(Day.become||'')+'" placeholder="Who are you becoming…">';
            h += '</div>';

            h += '<div class="mf-box"><h3><span class="star">✦</span> Today\'s priorities</h3>';
            for (var pi = 0; pi < 5; pi++) {
              var pr = Day.priorities[pi] || { t: "", d: false };
              h += '<div class="mf-pri">';
              h += '<span class="num">'+(pi+1)+'</span>';
              h += '<input type="text" data-pt="'+pi+'" value="'+esc(pr.t||'')+'" placeholder="Priority '+(pi+1)+'">';
              h += '<input type="checkbox" data-pd="'+pi+'"'+(pr.d?' checked':'')+' aria-label="Done">';
              h += '</div>';
            }
            h += '</div>';

            h += '<div class="mf-box"><h3><span class="star">✦</span> Notes</h3>';
            h += '<textarea id="mf-notes" placeholder="Anything else…">'+esc(Day.notes||'')+'</textarea></div>';
            h += '</div></div>';
          }

          if (mt === "ball")
            h +=
              '<div style="text-align:center"><button class="cball" id="cb" aria-label="Ask the crystal ball">🔮</button><p class="ctxt">' +
              esc(pick || "Tap the ball for a message.") +
              '</p></div><div class="bar"><input id="am" placeholder="Add your own affirmation" style="flex:1"><button class="btn" id="aam">Add</button></div><p class="muted">' +
              M.mine.length +
              " of your own in the mix</p>";
          if (mt === "tarot") {
            var t = M.pulls[td];
            h +=
              '<div class="bar"><button class="btn" id="tp">' +
              (t ? "Draw again" : "Draw today’s card") +
              "</button></div>";
            if (t) {
              var c = TAROT[t.i];
              h +=
                '<div class="tcard' +
                (t.r ? " rev" : "") +
                '"><div class="te">' +
                c[1] +
                "</div><b>" +
                c[0] +
                (t.r ? " (reversed)" : "") +
                "</b><small>" +
                c[2] +
                "</small></div>" +
                (t.r
                  ? '<p class="muted">Reversed: read it as a nudge to slow down and look inward on this theme.</p>'
                  : "");
            } else
              h +=
                '<p class="muted">Take a breath, think of a question, then draw.</p>';
          }
          if (mt === "vision") {
            h +=
              '<div class="tabs" style="flex-wrap:wrap">' +
              ["All"]
                .concat(VC)
                .map(function (c) {
                  return (
                    '<button data-vf="' +
                    c +
                    '" class="' +
                    (vf === c ? "on" : "") +
                    '">' +
                    c +
                    "</button>"
                  );
                })
                .join("") +
              '</div><div class="bar"><select id="vc">' +
              VC.map(function (c) {
                return "<option>" + c + "</option>";
              }).join("") +
              '</select><input id="vcp" placeholder="Caption (optional)" style="flex:1;min-width:120px"><input type="file" id="vfl" accept="image/*" multiple></div><p class="muted">' +
              vm +
              'Pictures stay on this device and are shrunk to save space.</p><div class="vg">';
            VB.filter(function (v) {
              return vf === "All" || v.cat === vf;
            }).forEach(function (v) {
              h +=
                '<figure><img src="' +
                v.src +
                '" alt="' +
                esc(v.cap || v.cat) +
                '"><figcaption>' +
                (v.cap ? esc(v.cap) + " " : "") +
                '<small class="muted">' +
                v.cat +
                '</small> <button data-vd="' +
                v.id +
                '" aria-label="Remove picture" style="background:none;border:0">✕</button></figcaption></figure>';
            });
            h += "</div>";
          }
          $("#body").innerHTML = h;
          document.querySelectorAll("[data-mt]").forEach(function (b) {
            b.onclick = function () {
              mt = b.dataset.mt;
              vm = "";
              manifest();
            };
          });

          function saveDay() {
            M.days[dayKey] = Day;
            save();
          }
          if (mt === "planner") {
            if ($("#mfd"))
              $("#mfd").onchange = function () {
                md = this.value || dstr();
                manifest();
              };
            ["mf-choose","mf-beliefs","mf-aff","mf-notes","mf-see","mf-feel","mf-have","mf-become"].forEach(function (id) {
              var el = $("#"+id);
              if (!el) return;
              el.oninput = function () {
                if (id === "mf-choose") Day.choose = el.value;
                if (id === "mf-beliefs") Day.beliefs = el.value;
                if (id === "mf-aff") Day.affirmation = el.value;
                if (id === "mf-notes") Day.notes = el.value;
                if (id === "mf-see") Day.see = el.value;
                if (id === "mf-feel") Day.feel = el.value;
                if (id === "mf-have") Day.have = el.value;
                if (id === "mf-become") Day.become = el.value;
                saveDay();
              };
            });
            document.querySelectorAll("[data-at]").forEach(function (inp) {
              inp.oninput = function () {
                Day.actions[+inp.dataset.at] = inp.value;
                saveDay();
              };
            });
            document.querySelectorAll("[data-ad]").forEach(function (cb) {
              cb.onchange = function () {
                Day.actionDone[+cb.dataset.ad] = cb.checked;
                saveDay();
              };
            });
            document.querySelectorAll("[data-pt]").forEach(function (inp) {
              inp.oninput = function () {
                Day.priorities[+inp.dataset.pt].t = inp.value;
                saveDay();
              };
            });
            document.querySelectorAll("[data-pd]").forEach(function (cb) {
              cb.onchange = function () {
                Day.priorities[+cb.dataset.pd].d = cb.checked;
                saveDay();
              };
            });
          }

          if ($("#cb")) {
            $("#cb").onclick = function () {
              var a = AFF.concat(M.mine);
              pick = a[Math.floor(Math.random() * a.length)];
              manifest();
            };
            $("#aam").onclick = function () {
              var v = $("#am").value.trim();
              if (v) {
                M.mine.push(v);
                save();
                manifest();
              }
            };
          }
          if ($("#tp"))
            $("#tp").onclick = function () {
              M.pulls[td] = {
                i: Math.floor(Math.random() * TAROT.length),
                r: Math.random() < 0.3,
              };
              save();
              manifest();
            };
          document.querySelectorAll("[data-vf]").forEach(function (b) {
            b.onclick = function () {
              vf = b.dataset.vf;
              manifest();
            };
          });
          document.querySelectorAll("[data-vd]").forEach(function (b) {
            b.onclick = function () {
              VB = VB.filter(function (x) {
                return x.id !== b.dataset.vd;
              });
              vbSave();
              manifest();
            };
          });
          if ($("#vfl"))
            $("#vfl").onchange = function () {
              var fs = Array.prototype.slice.call(this.files),
                cat = $("#vc").value,
                cap = $("#vcp").value.trim(),
                n = 0,
                add = 0;
              if (!fs.length) return;
              fs.forEach(function (f) {
                var r = new FileReader();
                r.onload = function () {
                  var im = new Image();
                  im.onload = function () {
                    var s = Math.min(1, 520 / im.width),
                      c = document.createElement("canvas");
                    c.width = im.width * s;
                    c.height = im.height * s;
                    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
                    VB.push({
                      id: uid(),
                      cat: cat,
                      cap: cap,
                      src: c.toDataURL("image/jpeg", 0.72),
                    });
                    add++;
                    done();
                  };
                  im.onerror = done;
                  im.src = r.result;
                };
                r.onerror = done;
                r.readAsDataURL(f);
              });
              function done() {
                n++;
                if (n < fs.length) return;
                vm = "";
                if (add && !vbSave()) {
                  VB.splice(-add);
                  vm =
                    "Not enough space on this device for those pictures. Remove some and try again. ";
                }
                manifest();
              }
            };
        }
        /* calendar and money */
        ART.cal = (function () {
          var d = "",
            cmo = MN[now.getMonth()].slice(0, 3);
          for (var r = 0; r < 4; r++)
            for (var c = 0; c < 7; c++) {
              var n = r * 7 + c;
              d +=
                '<circle cx="' +
                (26 + c * 15) +
                '" cy="' +
                (78 + r * 15) +
                '" r="3.6" fill="' +
                (n % 9 === 4
                  ? "#f9de92"
                  : n % 11 === 6
                    ? "#f4a9a3"
                    : "#f0cdb4") +
                '"/>';
            }
          return (
            '<svg viewBox="0 0 140 150" width="100%" aria-hidden="true"><path d="M70 10L40 28M70 10L100 28" fill="none" style="' +
            O +
            '"/><circle cx="70" cy="7" r="5" fill="#f2c6a3" style="' +
            O +
            '"/><rect x="10" y="22" width="120" height="122" rx="12" fill="#fff8ee" style="' +
            O +
            '"/><path d="M10 52V34Q10 22 22 22H118Q130 22 130 34V52Z" fill="#f4a9a3" style="' +
            O +
            '"/><text x="70" y="45" text-anchor="middle" font-size="19" font-weight="700" fill="#fff" font-family="Gaegu,Comic Sans MS,cursive">' +
            cmo +
            "</text>" +
            d +
            star(112, 68, 1) +
            "</svg>"
          );
        })();
        ART.money =
          '<svg viewBox="0 0 160 120" width="100%" aria-hidden="true"><rect x="38" y="96" width="8" height="22" fill="#f2c6a3" style="' +
          O +
          '"/><rect x="114" y="96" width="8" height="22" fill="#f2c6a3" style="' +
          O +
          '"/><ellipse cx="80" cy="92" rx="70" ry="14" fill="#f2c6a3" style="' +
          O +
          '"/><path d="M18 58L80 66L142 58L142 84L80 92L18 84Z" fill="#f4a9a3" style="' +
          O +
          '"/><path d="M24 52L78 60L78 86L24 78Z" fill="#fff8ee" style="' +
          O +
          '"/><path d="M82 60L136 52L136 78L82 86Z" fill="#fff8ee" style="' +
          O +
          '"/><path d="M32 62L70 67M32 70L70 75M90 67L128 62M90 75L128 70" fill="none" stroke="#f0cdb4" stroke-width="2.5" stroke-linecap="round"/><circle cx="124" cy="34" r="13" fill="#f9de92" style="' +
          O +
          '"/><text x="124" y="40" text-anchor="middle" font-size="16" font-weight="700" fill="#c98a63" font-family="Gaegu,Comic Sans MS,cursive">$</text><circle cx="38" cy="40" r="10" fill="#f9de92" style="' +
          O +
          '"/></svg>';
