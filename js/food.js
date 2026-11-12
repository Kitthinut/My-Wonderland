        function fridge() {
          var D = fd(FD);
          D.goals = D.goals || ["", "", "", ""];
          D.wake = D.wake || "";
          D.sleepH = D.sleepH || "";
          D.mood = D.mood || 0;
          D.workout = D.workout || "";
          D.burned = D.burned || 0;
          D.fruit = D.fruit || 0;
          D.veggie = D.veggie || 0;
          D.energy = D.energy || 0;
          D.notes = D.notes || "";
          D.slots = D.slots || { Breakfast: { text: "", k: 0 }, Lunch: { text: "", k: 0 }, Dinner: { text: "", k: 0 }, Snacks: { text: "", k: 0 } };
          // migrate old meals into slots text if slots empty
          if (D.meals && D.meals.length) {
            SL.forEach(function (s) {
              var key = s === "Snack" ? "Snacks" : s;
              if (!D.slots[key]) D.slots[key] = { text: "", k: 0 };
              if (!D.slots[key].text) {
                var ms = D.meals.filter(function (m) { return m.s === s || (s === "Snack" && m.s === "Snack"); });
                if (ms.length) {
                  D.slots[key].text = ms.map(function (m) { return m.n; }).join(", ");
                  D.slots[key].k = ms.reduce(function (a, m) { return a + (m.k || 0); }, 0);
                }
              }
            });
          }

          var MOODS = [
            { v: 5, e: "😁" },
            { v: 4, e: "🙂" },
            { v: 3, e: "😐" },
            { v: 2, e: "😕" },
            { v: 1, e: "😢" }
          ];
          var totalK = 0;
          ["Breakfast", "Lunch", "Dinner", "Snacks"].forEach(function (s) {
            totalK += +(D.slots[s] && D.slots[s].k) || 0;
          });

          function foodDays(n) {
            var out = [], base = new Date(FD + "T12:00:00");
            if (isNaN(base.getTime())) base = new Date();
            for (var i = n - 1; i >= 0; i--) {
              var d = new Date(base);
              d.setDate(d.getDate() - i);
              var key = dstr(d);
              var X = S.food[key];
              var kcal = 0;
              if (X && X.slots) {
                ["Breakfast", "Lunch", "Dinner", "Snacks"].forEach(function (s) {
                  kcal += +(X.slots[s] && X.slots[s].k) || 0;
                });
              } else if (X && X.meals) {
                kcal = sum(X).k;
              }
              out.push({
                l: d.getDate(),
                md: d.getMonth() + 1 + "/" + d.getDate(),
                kcal: kcal,
                water: X ? X.water || 0 : 0,
                sleep: X && X.sleepH ? +X.sleepH || 0 : 0,
                mood: X ? +X.mood || 0 : 0,
                energy: X ? +X.energy || 0 : 0,
                fruit: X ? +X.fruit || 0 : 0,
                veg: X ? +X.veggie || 0 : 0,
                burn: X ? +X.burned || 0 : 0,
              });
            }
            return out;
          }
          function lineChart(series, keys, colors, maxFixed, label) {
            var W = 520, H = 150, padL = 30, padR = 10, padT = 14, padB = 22;
            var max = maxFixed || 1;
            series.forEach(function (p) {
              keys.forEach(function (k) {
                if (p[k] > max) max = p[k];
              });
            });
            if (!max) max = 1;
            var n = series.length;
            function xAt(i) {
              return padL + (n === 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
            }
            function yAt(v) {
              return padT + (1 - v / max) * (H - padT - padB);
            }
            var svg =
              '<svg viewBox="0 0 ' +
              W +
              " " +
              H +
              '" width="100%" role="img" aria-label="' +
              label +
              '">';
            for (var g = 0; g <= 3; g++) {
              var gy = padT + (g / 3) * (H - padT - padB);
              svg +=
                '<line x1="' +
                padL +
                '" x2="' +
                (W - padR) +
                '" y1="' +
                gy.toFixed(1) +
                '" y2="' +
                gy.toFixed(1) +
                '" stroke="var(--line)" stroke-width="1"/>';
              var gv = Math.round(max * (1 - g / 3));
              svg +=
                '<text x="2" y="' +
                (gy + 3).toFixed(1) +
                '" font-size="9" fill="var(--soft)">' +
                gv +
                "</text>";
            }
            keys.forEach(function (k, ki) {
              var path = "";
              series.forEach(function (p, i) {
                var px = xAt(i),
                  py = yAt(p[k]);
                path += (i ? " L " : "M ") + px.toFixed(1) + " " + py.toFixed(1);
              });
              svg +=
                '<path d="' +
                path +
                '" fill="none" stroke="' +
                colors[ki] +
                '" stroke-width="2.4" stroke-linejoin="round"/>';
              series.forEach(function (p, i) {
                svg +=
                  '<circle cx="' +
                  xAt(i).toFixed(1) +
                  '" cy="' +
                  yAt(p[k]).toFixed(1) +
                  '" r="3" fill="' +
                  colors[ki] +
                  '"/>';
              });
            });
            var step = n > 14 ? Math.ceil(n / 7) : 1;
            series.forEach(function (p, i) {
              if (i % step === 0 || i === n - 1) {
                svg +=
                  '<text x="' +
                  xAt(i).toFixed(1) +
                  '" y="' +
                  (H - 4) +
                  '" text-anchor="middle" font-size="10" fill="var(--soft)">' +
                  p.l +
                  "</text>";
              }
            });
            return svg + "</svg>";
          }
          function avg(series, key) {
            var s = 0,
              c = 0;
            series.forEach(function (p) {
              if (p[key] > 0) {
                s += p[key];
                c++;
              }
            });
            return c ? Math.round((s / c) * 10) / 10 : 0;
          }

          var h = '<h2>🧊 food journal</h2>';
          h += '<div class="tabs">';
          h += '<button data-ft="today" class="' + (FT === "today" ? "on" : "") + '">Today</button>';
          h += '<button data-ft="progress" class="' + (FT === "progress" ? "on" : "") + '">Progress</button>';
          h += "</div>";
          h += '<div class="bar"><input type="date" id="fdt" value="' + FD + '" aria-label="Day">';
          if (FT === "today") h += '<span class="muted">Total kcal: <b>' + totalK + "</b></span>";
          if (FT === "progress") {
            h += '<span class="fj-range">';
            [7, 14, 30].forEach(function (n) {
              h +=
                '<button data-fr="' +
                n +
                '" class="' +
                (FR === n ? "on" : "") +
                '" style="margin-left:4px">' +
                n +
                "d</button>";
            });
            h += "</span>";
          }
          h += "</div>";

          if (FT === "progress") {
            var series = foodDays(FR);
            var avgK = avg(series, "kcal");
            var avgW = avg(series, "water");
            var avgS = avg(series, "sleep");
            var avgM = avg(series, "mood");
            h += '<div class="scoreboard">';
            h += '<div class="bud-card"><small class="muted">Avg kcal</small><div class="big">' + avgK + '</div></div>';
            h += '<div class="bud-card"><small class="muted">Avg water</small><div class="big">' + avgW + '</div><small class="muted">glasses</small></div>';
            h += '<div class="bud-card"><small class="muted">Avg sleep</small><div class="big">' + avgS + '</div><small class="muted">hours</small></div>';
            h += '<div class="bud-card"><small class="muted">Avg mood</small><div class="big">' + avgM + '</div><small class="muted">of 5</small></div>';
            h += '</div>';
            var chunks = [];
            var rem = series.length % 7;
            var ci = 0;
            if (rem) {
              chunks.push(series.slice(0, rem));
              ci = rem;
            }
            for (; ci < series.length; ci += 7) chunks.push(series.slice(ci, ci + 7));
            function sumKey(arr, key) {
              var s = 0;
              arr.forEach(function (p) {
                s += p[key] || 0;
              });
              return s;
            }
            function logged(arr) {
              var n = 0;
              arr.forEach(function (p) {
                if (p.kcal || p.water || p.sleep || p.mood || p.energy || p.fruit || p.veg || p.burn) n++;
              });
              return n;
            }
            function delta(cur, prev) {
              if (!prev) return "";
              var diff = Math.round((cur - prev) * 10) / 10;
              if (!diff) return '<span class="muted">same</span>';
              return '<span style="color:' + (diff > 0 ? "var(--ink)" : "var(--pink)") + '">' + (diff > 0 ? "+" : "") + diff + "</span>";
            }
            h += '<div class="fj-sec" style="margin:10px 0"><h3>Weekly summary</h3>';
            h += '<table class="bud-table"><tr><th>Week</th><th>Logged</th><th>Avg kcal</th><th>vs last</th><th>Avg water</th><th>Avg sleep</th><th>Avg mood</th><th>Burnt</th></tr>';
            var prevK = null;
            chunks.forEach(function (wk, wi) {
              var ak = avg(wk, "kcal");
              var aw = avg(wk, "water");
              var asl = avg(wk, "sleep");
              var am = avg(wk, "mood");
              var label = wk[0].md + " – " + wk[wk.length - 1].md;
              if (wi === chunks.length - 1) label = "This week · " + label;
              h += "<tr><td>" + label + "</td>";
              h += "<td>" + logged(wk) + "/" + wk.length + "</td>";
              h += "<td>" + ak + "</td>";
              h += "<td>" + (prevK == null ? '<span class="muted">—</span>' : delta(ak, prevK)) + "</td>";
              h += "<td>" + aw + "</td><td>" + asl + "</td><td>" + am + "</td>";
              h += "<td>" + Math.round(sumKey(wk, "burn")) + "</td></tr>";
              prevK = ak;
            });
            h += "</table>";
            var last = chunks[chunks.length - 1];
            var waterGoalHits = 0;
            last.forEach(function (p) {
              if (S.wg && p.water >= S.wg) waterGoalHits++;
            });
            h += '<p class="muted" style="margin:8px 0 0">This week: water goal hit ' + waterGoalHits + " of " + last.length + " days";
            h += " · fruit " + sumKey(last, "fruit") + " · veggie " + sumKey(last, "veg") + " servings.</p></div>";
            h += '<div class="fj-charts">';
            h += '<div class="fj-sec"><h3>Calories eaten</h3>' + lineChart(series, ["kcal"], ["#8EA7E9"], 0, "Calories") + '</div>';
            h += '<div class="fj-sec"><h3>Water</h3>' + lineChart(series, ["water"], ["#7286D3"], S.wg || 8, "Water") + '</div>';
            h += '<div class="fj-sec"><h3>Sleep hours</h3>' + lineChart(series, ["sleep"], ["#7286D3"], 10, "Sleep") + '</div>';
            h +=
              '<div class="fj-sec"><h3>Mood & energy</h3><p class="muted" style="margin:0 0 4px;font-size:0.75rem"><span style="color:#8EA7E9">●</span> mood &nbsp; <span style="color:#7286D3">●</span> energy</p>' +
              lineChart(series, ["mood", "energy"], ["#8EA7E9", "#7286D3"], 5, "Mood and energy") +
              '</div>';
            h +=
              '<div class="fj-sec"><h3>Fruit & veggie</h3><p class="muted" style="margin:0 0 4px;font-size:0.75rem"><span style="color:#8EA7E9">●</span> fruit &nbsp; <span style="color:#A7AAE1">●</span> veggie</p>' +
              lineChart(series, ["fruit", "veg"], ["#8EA7E9", "#7286D3"], 5, "Servings") +
              '</div>';
            h += '<div class="fj-sec"><h3>Calories burnt</h3>' + lineChart(series, ["burn"], ["#7286D3"], 0, "Calories burnt") + '</div>';
            h += '</div>';
            $("#body").innerHTML = h;
            document.querySelectorAll("[data-ft]").forEach(function (b) {
              b.onclick = function () {
                FT = b.dataset.ft;
                fridge();
              };
            });
            document.querySelectorAll("[data-fr]").forEach(function (b) {
              b.onclick = function () {
                FR = +b.dataset.fr;
                fridge();
              };
            });
            $("#fdt").onchange = function () {
              FD = this.value || dstr();
              fridge();
            };
            return;
          }

          h += '<div class="food-journal">';

          // LEFT column
          h += '<div>';

          // Today's goals
          h += '<div class="fj-sec"><h3>Today\'s goals</h3>';
          for (var g = 0; g < 4; g++) {
            h += '<div class="bar" style="margin:4px 0"><span style="width:12px;height:12px;border-radius:50%;border:2px solid var(--line);flex-shrink:0"></span>';
            h += '<input data-goal="'+g+'" value="'+esc(D.goals[g]||'')+'" placeholder="Goal '+(g+1)+'" style="flex:1"></div>';
          }
          h += '</div>';

          // Meals
          ["Breakfast", "Lunch", "Dinner", "Snacks"].forEach(function (s) {
            var slot = D.slots[s] || { text: "", k: 0 };
            h += '<div class="fj-sec fj-meal"><label>'+s.toUpperCase()+'</label>';
            h += '<textarea data-slot="'+s+'" placeholder="What did you eat…">'+esc(slot.text)+'</textarea>';
            h += '<div class="fj-cals"><span class="muted">Calories:</span>';
            h += '<input type="number" min="0" data-slotk="'+s+'" value="'+(slot.k||'')+'" placeholder="0"></div></div>';
          });

          h += '</div>'; // end left

          // RIGHT column
          h += '<div>';

          // Wake / sleep
          h += '<div class="fj-sec"><h3>Sleep</h3>';
          h += '<div class="bar"><label class="muted" style="flex:1">Wake up at<input id="fwake" value="'+esc(D.wake)+'" placeholder="7:00" style="width:100%"></label>';
          h += '<label class="muted" style="flex:1">Hours slept<input id="fsleep" type="number" min="0" max="24" step="0.5" value="'+(D.sleepH||'')+'" placeholder="8" style="width:100%"></label></div></div>';

          // Mood
          h += '<div class="fj-sec"><h3>Mood</h3><div class="mood-row">';
          MOODS.forEach(function (m) {
            h += '<button data-fmood="'+m.v+'" class="'+(+D.mood===m.v?'on':'')+'">'+m.e+'</button>';
          });
          h += '</div></div>';

          // Water
          h += '<div class="fj-sec"><h3>Water intake</h3><div class="water-grid">';
          for (var i = 1; i <= S.wg; i++) {
            h += '<button class="'+(i<=D.water?'on':'')+'" data-w="'+i+'" aria-label="'+i+' glasses">💧</button>';
          }
          h += '</div>';
          h += '<label class="muted" style="display:block;margin-top:6px">goal <input id="wg" type="number" min="1" max="20" value="'+S.wg+'" style="width:56px"> glasses</label></div>';

          // Workout
          h += '<div class="fj-sec"><h3>Workout</h3>';
          h += '<input id="fwork" value="'+esc(D.workout)+'" placeholder="What did you do?" style="width:100%;margin-bottom:6px">';
          h += '<div class="fj-cals"><span class="muted">Calories burnt:</span>';
          h += '<input id="fburn" type="number" min="0" value="'+(D.burned||'')+'" placeholder="0"></div></div>';

          // Fruit / veggie
          h += '<div class="fj-sec"><h3>Fruit servings</h3><div class="serve-grid">';
          for (i = 1; i <= 5; i++) {
            h += '<button class="'+(i<=D.fruit?'on':'')+'" data-fruit="'+i+'">🍎</button>';
          }
          h += '</div></div>';
          h += '<div class="fj-sec"><h3>Veggie servings</h3><div class="serve-grid">';
          for (i = 1; i <= 5; i++) {
            h += '<button class="'+(i<=D.veggie?'on':'')+'" data-veg="'+i+'">🥕</button>';
          }
          h += '</div></div>';

          // Energy
          h += '<div class="fj-sec"><h3>Energy level</h3><div class="energy-row">';
          for (i = 1; i <= 5; i++) {
            h += '<button data-energy="'+i+'" class="'+(+D.energy===i?'on':'')+'">'+i+'</button>';
          }
          h += '</div><div class="bar muted" style="justify-content:space-between;font-size:0.75rem"><span>Low</span><span>High</span></div></div>';

          // Notes
          h += '<div class="fj-sec"><h3>Notes</h3>';
          h += '<textarea id="fnotes" placeholder="Anything else…">'+esc(D.notes)+'</textarea></div>';

          h += '</div></div>'; // end right + grid

          $("#body").innerHTML = h;

          function saveDay() {
            S.food[FD] = D;
            save();
          }

          document.querySelectorAll("[data-ft]").forEach(function (b) {
            b.onclick = function () {
              FT = b.dataset.ft;
              fridge();
            };
          });

          $("#fdt").onchange = function () {
            FD = this.value || dstr();
            fridge();
          };

          document.querySelectorAll("[data-goal]").forEach(function (inp) {
            inp.oninput = function () {
              D.goals[+inp.dataset.goal] = inp.value;
              saveDay();
            };
          });
          document.querySelectorAll("[data-slot]").forEach(function (ta) {
            ta.oninput = function () {
              D.slots[ta.dataset.slot] = D.slots[ta.dataset.slot] || { text: "", k: 0 };
              D.slots[ta.dataset.slot].text = ta.value;
              saveDay();
            };
          });
          document.querySelectorAll("[data-slotk]").forEach(function (inp) {
            inp.oninput = function () {
              D.slots[inp.dataset.slotk] = D.slots[inp.dataset.slotk] || { text: "", k: 0 };
              D.slots[inp.dataset.slotk].k = +inp.value || 0;
              saveDay();
              // update total display without full re-render
            };
            inp.onchange = function () { fridge(); };
          });
          $("#fwake").oninput = function () { D.wake = this.value; saveDay(); };
          $("#fsleep").oninput = function () { D.sleepH = this.value; saveDay(); };
          document.querySelectorAll("[data-fmood]").forEach(function (b) {
            b.onclick = function () {
              D.mood = +b.dataset.fmood === D.mood ? 0 : +b.dataset.fmood;
              saveDay();
              fridge();
            };
          });
          document.querySelectorAll("[data-w]").forEach(function (b) {
            b.onclick = function () {
              var n = +b.dataset.w;
              D.water = D.water === n ? n - 1 : n;
              saveDay();
              fridge();
            };
          });
          $("#wg").onchange = function () {
            var v = +this.value;
            if (v > 0 && v <= 20) { S.wg = v; save(); fridge(); }
          };
          $("#fwork").oninput = function () { D.workout = this.value; saveDay(); };
          $("#fburn").oninput = function () { D.burned = +this.value || 0; saveDay(); };
          document.querySelectorAll("[data-fruit]").forEach(function (b) {
            b.onclick = function () {
              var n = +b.dataset.fruit;
              D.fruit = D.fruit === n ? n - 1 : n;
              saveDay();
              fridge();
            };
          });
          document.querySelectorAll("[data-veg]").forEach(function (b) {
            b.onclick = function () {
              var n = +b.dataset.veg;
              D.veggie = D.veggie === n ? n - 1 : n;
              saveDay();
              fridge();
            };
          });
          document.querySelectorAll("[data-energy]").forEach(function (b) {
            b.onclick = function () {
              D.energy = +b.dataset.energy === D.energy ? 0 : +b.dataset.energy;
              saveDay();
              fridge();
            };
          });
          $("#fnotes").oninput = function () { D.notes = this.value; saveDay(); };
        }
