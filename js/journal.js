        function journal() {
          var MOODS = [
            { v: 1, e: "😢", l: "Very sad" },
            { v: 2, e: "😕", l: "Sad" },
            { v: 3, e: "😐", l: "Normal" },
            { v: 4, e: "🙂", l: "Happy" },
            { v: 5, e: "🤩", l: "Very happy" }
          ];
          var SLEEPS = [2, 4, 6, 8, 10];
          var WEATHERS = [
            { v: "sun", e: "☀️" },
            { v: "cloud", e: "☁️" },
            { v: "rain", e: "🌧️" },
            { v: "storm", e: "⛈️" },
            { v: "snow", e: "❄️" },
            { v: "wind", e: "🌬️" }
          ];
          var jy = (S.jView && S.jView.y) || now.getFullYear();
          var jm = (S.jView && S.jView.m) || (now.getMonth() + 1);
          var daysInM = dim(jy, jm);
          // map date -> entry for this month
          var byDate = {};
          S.journal.forEach(function (e) {
            if (!e.date) return;
            var p = e.date.split("-");
            if (+p[0] === jy && +p[1] === jm) byDate[+p[2]] = e;
          });

          var h = '<h2>📚 my journal</h2>';

          // month selector
          h += '<div class="bar"><select id="jm" aria-label="Month">';
          MN.forEach(function (n, i) {
            h += '<option value="'+(i+1)+'"'+(i+1===jm?' selected':'')+'>'+n+'</option>';
          });
          h += '</select><input id="jy" type="number" value="'+jy+'" style="width:90px" aria-label="Year">';
          h += '<button class="btn" id="nj">+ New entry</button></div>';

          // --- Mood chart ---
          var pts = [], faces = "";
          for (var d = 1; d <= daysInM; d++) {
            var ent = byDate[d];
            var mood = ent && ent.mood ? +ent.mood : null;
            pts.push(mood);
            faces += '<span title="'+(ent && ent.mood ? MOODS[ent.mood-1].l : "")+'">'+(mood ? MOODS[mood-1].e : "·")+'</span>';
          }
          // SVG line chart
          var W = 560, H = 100, pad = 20;
          var svg = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:560px;display:block;margin:0 auto">';
          // grid lines
          for (var g = 1; g <= 5; g++) {
            var gy = H - pad - ((g-1)/4) * (H - pad*2);
            svg += '<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+gy+'" y2="'+gy+'" stroke="var(--line)" stroke-width="1"/>';
            svg += '<text x="8" y="'+(gy+3)+'" font-size="9" fill="var(--soft)">'+g+'</text>';
          }
          // line path
          var path = "", dots = "";
          pts.forEach(function (m, i) {
            if (m == null) return;
            var x = pad + (i / Math.max(daysInM-1,1)) * (W - pad*2);
            var y = H - pad - ((m-1)/4) * (H - pad*2);
            path += (path ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
            dots += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="3.5" fill="var(--pink)"/>';
          });
          if (path) svg += '<path d="'+path+'" fill="none" stroke="var(--pink)" stroke-width="2.5" stroke-linejoin="round"/>';
          svg += dots + '</svg>';

          h += '<div class="mood-wrap"><div class="mood-chart">';
          h += '<p style="text-align:center;margin:0 0 6px;font-weight:700;color:var(--ink)">Mood of '+MN[jm-1]+'</p>';
          h += svg;
          h += '<div class="mood-faces">'+faces+'</div>';
          h += '</div></div>';

          // --- Post-it entries for this month ---
          h += '<div class="postits" id="postits">';
          var monthEntries = S.journal.filter(function (e) {
            if (!e.date) return false;
            var p = e.date.split("-");
            return +p[0] === jy && +p[1] === jm;
          }).sort(function (a, b) { return a.date > b.date ? 1 : -1; });

          if (!monthEntries.length) {
            h += '<p class="muted" style="grid-column:1/-1">No entries this month yet. Tap “+ New entry”.</p>';
          }
          monthEntries.forEach(function (e) {
            var day = e.date.split("-")[2];
            var me = e.mood ? MOODS[e.mood-1].e : "📝";
            var sl = e.sleep ? e.sleep + "h" : "";
            var we = "";
            WEATHERS.forEach(function (w) { if (w.v === e.weather) we = w.e; });
            var preview = (e.text || e.title || "").slice(0, 80);
            h += '<div class="postit'+(cur===e.id?' on':'')+'" data-id="'+e.id+'">';
            h += '<div class="pd">'+day+' · '+me+(sl?' · '+sl:'')+(we?' · '+we:'')+'</div>';
            if (e.title) h += '<b>'+esc(e.title)+'</b><br>';
            h += '<div class="pt">'+esc(preview)+(preview.length>=80?'…':'')+'</div>';
            h += '</div>';
          });
          h += '</div>';

          // --- Editor (when an entry is selected) ---
          h += '<div id="ed" style="margin-top:16px"></div>';

          $("#body").innerHTML = h;

          $("#jm").onchange = function () {
            S.jView = S.jView || {};
            S.jView.m = +this.value;
            save();
            journal();
          };
          $("#jy").onchange = function () {
            var v = +this.value;
            if (v > 1900 && v < 3000) {
              S.jView = S.jView || {};
              S.jView.y = v;
              save();
              journal();
            }
          };
          $("#nj").onclick = function () {
            var e = {
              id: uid(),
              date: new Date().toISOString().slice(0, 10),
              title: "",
              text: "",
              mood: 4,
              sleep: 8,
              weather: "sun"
            };
            S.journal.push(e);
            cur = e.id;
            // jump view to that month
            var p = e.date.split("-");
            S.jView = { y: +p[0], m: +p[1] };
            save();
            journal();
          };
          document.querySelectorAll(".postit").forEach(function (b) {
            b.onclick = function () {
              cur = b.dataset.id;
              journal();
            };
          });

          var e = S.journal.filter(function (x) { return x.id === cur; })[0];
          if (!e) {
            $("#ed").innerHTML = '<p class="muted">Tap a post-it to edit, or create a new entry.</p>';
            return;
          }

          // editor
          var eh = '<div style="background:var(--card);border:2px solid var(--line);border-radius:14px;padding:14px">';
          eh += '<div class="bar"><input id="jt" placeholder="Title (optional)" value="'+esc(e.title)+'" style="flex:1"><input id="jd" type="date" value="'+e.date+'"></div>';

          eh += '<p class="muted" style="margin:8px 0 4px">Mood</p><div class="mood-pick">';
          MOODS.forEach(function (m) {
            eh += '<button data-mood="'+m.v+'" class="'+(+e.mood===m.v?'on':'')+'" title="'+m.l+'">'+m.e+'</button>';
          });
          eh += '</div>';

          eh += '<p class="muted" style="margin:8px 0 4px">Sleep</p><div class="sleep-pick">';
          SLEEPS.forEach(function (s) {
            eh += '<button data-sleep="'+s+'" class="'+(+e.sleep===s?'on':'')+'">'+s+'h</button>';
          });
          eh += '</div>';

          eh += '<p class="muted" style="margin:8px 0 4px">Weather</p><div class="mood-pick">';
          WEATHERS.forEach(function (w) {
            eh += '<button data-weather="'+w.v+'" class="'+(e.weather===w.v?'on':'')+'">'+w.e+'</button>';
          });
          eh += '</div>';

          eh += '<textarea id="jx" placeholder="How was your day…">'+esc(e.text)+'</textarea>';
          eh += '<div class="bar" style="margin-top:10px"><button class="btn ghost" id="dj">Delete</button><span class="muted" id="sv">Saved ✓</span></div>';
          eh += '</div>';
          $("#ed").innerHTML = eh;

          function ch() {
            e.title = $("#jt").value;
            e.date = $("#jd").value;
            e.text = $("#jx").value;
            save();
            $("#sv").textContent = "Saved ✓";
          }
          ["#jt", "#jd", "#jx"].forEach(function (s) {
            $(s).oninput = ch;
          });
          $("#jd").onchange = function () {
            ch();
            var p = e.date.split("-");
            S.jView = { y: +p[0], m: +p[1] };
            journal();
          };
          document.querySelectorAll("[data-mood]").forEach(function (b) {
            b.onclick = function () {
              e.mood = +b.dataset.mood;
              save();
              journal();
            };
          });
          document.querySelectorAll("[data-sleep]").forEach(function (b) {
            b.onclick = function () {
              e.sleep = +b.dataset.sleep;
              save();
              journal();
            };
          });
          document.querySelectorAll("[data-weather]").forEach(function (b) {
            b.onclick = function () {
              e.weather = b.dataset.weather;
              save();
              journal();
            };
          });
          $("#dj").onclick = function () {
            if (confirm("Delete this entry?")) {
              S.journal = S.journal.filter(function (x) { return x.id !== e.id; });
              cur = null;
              save();
              journal();
            }
          };
        }
        /* board */
