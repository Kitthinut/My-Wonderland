        var CV = { y: now.getFullYear(), m: now.getMonth() + 1 },
          CD = dstr();
        function gurl(t, d) {
          var p = d.split("-"),
            n = new Date(+p[0], +p[1] - 1, +p[2] + 1);
          return (
            "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
            encodeURIComponent(t) +
            "&dates=" +
            p.join("") +
            "/" +
            n.getFullYear() +
            p2(n.getMonth() + 1) +
            p2(n.getDate())
          );
        }
        function calendar() {
          var y = CV.y,
            m = CV.m,
            td = dstr(),
            pm = {},
            main = S.main.cal || "https://calendar.google.com/";
          S.prints.forEach(function (p) {
            pm[p.date] = (pm[p.date] || 0) + 1;
          });
          var h =
            '<h2>🗓️ wall calendar</h2><div class="bar calendar-controls"><select id="cm" aria-label="Month">' +
            MN.map(function (n, i) {
              return (
                '<option value="' +
                (i + 1) +
                '"' +
                (i + 1 === m ? " selected" : "") +
                ">" +
                n +
                "</option>"
              );
            }).join("") +
            '</select><input id="cy" type="number" value="' +
            y +
            '" style="width:90px" aria-label="Year"><a class="btn" target="_blank" rel="noopener" href="' +
            esc(main) +
            '">Open Google Calendar</a></div><details class="calendar-settings"><summary class="muted">Change calendar link</summary><div class="bar" style="margin-top:8px"><input id="cl" placeholder="Paste your calendar link" value="' +
            esc(S.main.cal || "") +
            '" style="flex:1"><button class="btn" id="cls">Save</button></div></details><p class="muted calendar-help">Plans live here. Finished pomodoros show as ⏱ (only when the timer truly reaches zero — reset or switch cancels). Post-its show as ✨.</p><div class="cal" style="max-width:560px">';
          "SMTWTFS".split("").forEach(function (c) {
            h += "<b>" + c + "</b>";
          });
          for (var i = 0; i < new Date(y, m - 1, 1).getDay(); i++)
            h += "<span></span>";
          for (i = 1; i <= dim(y, m); i++) {
            var k = y + "-" + p2(m) + "-" + p2(i),
              n = (S.plans[k] || []).length;
            h +=
              '<div role="button" tabindex="0" data-cd="' +
              k +
              '" style="' +
              (k === CD ? "outline:3px solid var(--pink);" : "") +
              (k === td ? "background:var(--butter);color:#3a2230" : "") +
              '">' +
              i +
              (n
                ? '<div class="pn" style="background:var(--sage)">' +
                  n +
                  " plan" +
                  (n > 1 ? "s" : "") +
                  "</div>"
                : "") +
              (pm[k] ? '<div class="pn">✨ ×' + pm[k] + "</div>" : "") +
              ((S.focus[k] || 0)
                ? '<div class="pn" style="background:var(--wall2)">⏱ ×' +
                  S.focus[k] +
                  "</div>"
                : "") +
              "</div>";
          }
          var L = S.plans[CD] || [];
          h += '</div><p class="calendar-selected-date"><b>' + CD + "</b></p>";
          if (!L.length)
            h += '<p class="muted">Nothing planned. Add something below.</p>';
          L.forEach(function (x) {
            h +=
              '<div class="todo"><span style="flex:1">' +
              esc(x.t) +
              '</span><a href="' +
              esc(gurl(x.t, CD)) +
              '" target="_blank" rel="noopener" style="color:var(--soft)">add to Google ↗</a><button data-px="' +
              x.id +
              '" aria-label="Delete" style="background:none;border:0">✕</button></div>';
          });
          S.prints
            .filter(function (p) {
              return p.date === CD;
            })
            .forEach(function (p) {
              var isPomo = p.kind === "pomo" || (p.text && p.text.indexOf("Pomodoro") > -1);
              h +=
                '<div class="todo"><span class="pn" style="padding:2px 8px">' +
                (isPomo ? "⏱ pomo" : "✨ post-it") +
                '</span><span style="flex:1">' +
                esc(p.text) +
                "</span></div>";
            });
          if (S.focus[CD]) {
            h +=
              '<p class="muted">Focus sessions counted today: <b>' +
              S.focus[CD] +
              "</b> (+" +
              S.focus[CD] * 15 +
              " XP)</p>";
          }
          h +=
            '<div class="bar calendar-add-plan" style="margin-top:10px"><input id="pl" placeholder="Add a plan for this day" style="flex:1"><button class="btn" id="pla">Add</button></div>';
          $("#body").innerHTML = h;
          $("#cm").onchange = function () {
            CV.m = +this.value;
            calendar();
          };
          $("#cy").onchange = function () {
            var v = +this.value;
            if (v > 1900 && v < 3000) {
              CV.y = v;
              calendar();
            }
          };
          $("#cls").onclick = function () {
            S.main.cal = fixu($("#cl").value);
            save();
            calendar();
          };
          document.querySelectorAll("[data-cd]").forEach(function (b) {
            var go = function () {
              CD = b.dataset.cd;
              calendar();
            };
            b.onclick = go;
            b.onkeydown = function (e) {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go();
              }
            };
          });
          var add = function () {
            var v = $("#pl").value.trim();
            if (v) {
              (S.plans[CD] = S.plans[CD] || []).push({ id: uid(), t: v });
              save();
              calendar();
            }
          };
          $("#pla").onclick = add;
          $("#pl").onkeydown = function (e) {
            if (e.key === "Enter") add();
          };
          document.querySelectorAll("[data-px]").forEach(function (b) {
            b.onclick = function () {
              S.plans[CD] = S.plans[CD].filter(function (x) {
                return x.id !== b.dataset.px;
              });
              save();
              calendar();
            };
          });
        }
