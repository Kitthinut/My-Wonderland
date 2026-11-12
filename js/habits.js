        function board() {
          var M = getM(V.y, V.m),
            st = stats(V.y, V.m);
          var mo =
            '<select id="mm" aria-label="Month">' +
            MN.map(function (n, i) {
              return (
                '<option value="' +
                (i + 1) +
                '"' +
                (i + 1 === V.m ? " selected" : "") +
                ">" +
                n +
                "</option>"
              );
            }).join("") +
            '</select><input id="yy" type="number" value="' +
            V.y +
            '" style="width:90px" aria-label="Year">';
          var h =
            '<h2>📌 habit board</h2><div class="bar">' +
            mo +
            '</div><div class="tabs">' +
            [
              ["habits", "Habits"],
              ["todo", "To-do"],
              ["graph", "Progress"],
            ]
              .map(function (t) {
                return (
                  '<button data-t="' +
                  t[0] +
                  '" class="' +
                  (tab === t[0] ? "on" : "") +
                  '">' +
                  t[1] +
                  "</button>"
                );
              })
              .join("") +
            "</div>";
          if (tab === "habits") {
            var colors = ["#ef5350","#ff7043","#ffca28","#66bb6a","#26c6da","#42a5f5","#7e57c2","#ec407a","#ab47bc","#26a69a"];
            var isNow = V.y === now.getFullYear() && V.m === now.getMonth() + 1;
            var today = isNow ? now.getDate() : 0;
            var days = st.d;
            var cx = 200, cy = 200, maxR = 175, minR = 55;
            var nHab = Math.max(M.habits.length, 1);
            var ringGap = (maxR - minR) / nHab;
            var svg = '<svg viewBox="0 0 400 400" width="100%" style="max-width:360px;display:block;margin:0 auto" aria-label="Circular habit tracker">';
            for (var d = 1; d <= days; d++) {
              var ang = ((d - 1) / days) * Math.PI * 1.7 - Math.PI * 0.85;
              var lx = cx + Math.cos(ang) * (maxR + 14);
              var ly = cy + Math.sin(ang) * (maxR + 14);
              svg += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="var(--soft)">'+d+'</text>';
            }
            M.habits.forEach(function(x, hi) {
              var r = maxR - hi * ringGap - ringGap * 0.4;
              svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r.toFixed(1)+'" fill="none" stroke="var(--line)" stroke-width="'+(ringGap*0.55).toFixed(1)+'" opacity="0.35"/>';
            });
            M.habits.forEach(function(x, hi) {
              var r = maxR - hi * ringGap - ringGap * 0.4;
              var col = colors[hi % colors.length];
              var checks = M.checks[x.id] || [];
              for (var d = 1; d <= days; d++) {
                var ang = ((d - 1) / days) * Math.PI * 1.7 - Math.PI * 0.85;
                var dx = cx + Math.cos(ang) * r;
                var dy = cy + Math.sin(ang) * r;
                var on = checks.indexOf(d) > -1;
                var isToday = d === today;
                var rad = isToday ? 6 : 4.5;
                if (on) {
                  svg += '<circle class="hab-dot" data-h="'+x.id+'" data-d="'+d+'" cx="'+dx.toFixed(1)+'" cy="'+dy.toFixed(1)+'" r="'+rad+'" fill="'+col+'"'+(isToday?' stroke="#fff" stroke-width="2"':'')+' style="cursor:pointer"/>';
                } else {
                  svg += '<circle class="hab-dot" data-h="'+x.id+'" data-d="'+d+'" cx="'+dx.toFixed(1)+'" cy="'+dy.toFixed(1)+'" r="'+rad+'" fill="#fff" stroke="'+col+'" stroke-width="'+(isToday?2.5:1.2)+'" opacity="'+(isToday?1:0.55)+'" style="cursor:pointer"/>';
                }
              }
            });
            svg += '<text x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink)">'+st.pct+'%</text>';
            svg += '<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-size="11" fill="var(--soft)">avg. daily</text>';
            svg += '</svg>';

            var xp = totalXP(V.y, V.m);
            var lv = levelFromXP(xp);
            var best = bestStreak(V.y, V.m);
            var badge = badgeFor(best, st.pct);

            h += '<div class="game-bar">';
            h += '<div class="game-lvl"><span class="game-badge">'+badge.emoji+'</span> <b>Lv '+lv.level+'</b> <span class="muted">'+badge.label+'</span></div>';
            h += '<div class="game-xp"><div class="pbar" style="flex:1"><div style="width:'+Math.min(100, Math.round(lv.xpInto/lv.xpNeed*100))+'%"></div></div>';
            h += '<span class="muted" style="font-size:0.75rem;white-space:nowrap">'+lv.xpInto+' / '+lv.xpNeed+' XP</span></div>';
            h += '<div class="game-stats"><span>🔥 '+best+' day streak</span><span>⭐ '+xp+' XP</span><span>'+st.pct+'% avg. daily</span></div>';
            h += '</div>';

            h += '<div class="hab-layout">';
            h += '<div class="hab-circle">'+svg+'</div>';
            h += '<div class="hab-side">';
            h += '<p style="margin:0 0 8px;font-weight:700">'+(isNow ? "Today · day "+today : MN[V.m-1]+" "+V.y)+'</p>';

            if (!M.habits.length) {
              h += '<p class="muted">Add your first habit below.</p>';
            }
            M.habits.forEach(function(x, hi) {
              var col = colors[hi % colors.length];
              var checks = M.checks[x.id] || [];
              var doneToday = isNow && checks.indexOf(today) > -1;
              var count = 0;
              for (var checkedDay = 1; checkedDay <= st.elapsed; checkedDay++) {
                if (checks.indexOf(checkedDay) > -1) count++;
              }
              var streak = streakFor(checks, V.y, V.m);
              h += '<div class="hab-row" style="border-left:4px solid '+col+'">';
              h += '<div style="flex:1;min-width:0">';
              h += '<input value="'+esc(x.name)+'" data-r="'+x.id+'" style="width:100%;padding:4px 6px;font-weight:600">';
              h += '<small class="muted">'+(st.elapsed ? count+' / '+st.elapsed+' days' : 'No days elapsed');
              if (streak > 0) h += ' · <span style="color:var(--pink)">🔥 '+streak+'</span>';
              h += '</small></div>';
              h += '<div class="hab-order" aria-label="Reorder '+esc(x.name)+'">';
              h += '<button type="button" data-move="'+x.id+'" data-direction="-1" aria-label="Move '+esc(x.name)+' up" title="Move up"'+(hi === 0 ? ' disabled' : '')+'>↑</button>';
              h += '<button type="button" data-move="'+x.id+'" data-direction="1" aria-label="Move '+esc(x.name)+' down" title="Move down"'+(hi === M.habits.length - 1 ? ' disabled' : '')+'>↓</button>';
              h += '</div>';
              if (isNow) {
                h += '<button class="c'+(doneToday?' on':'')+'" data-h="'+x.id+'" data-d="'+today+'" aria-label="Mark '+esc(x.name)+' for today" style="width:38px;height:38px;flex-shrink:0;border-radius:50%;background:'+(doneToday?col:'#fff')+';border:3px solid '+col+'"></button>';
              }
              h += '<button data-del="'+x.id+'" aria-label="Remove habit" style="background:none;border:0;flex-shrink:0;opacity:0.5">✕</button>';
              h += '</div>';
            });

            h += '<div class="bar" style="margin-top:12px"><input id="nh" placeholder="New habit name" style="flex:1"><button class="btn" id="ah">Add</button></div>';
            h += '<p class="muted" style="font-size:0.75rem;margin-top:8px">Use ↑/↓ to reorder habits. Tap the circle to mark today; past days stay on the ring. Earn XP & keep streaks going!</p>';
            h += '</div></div>';
          }
          if (tab === "todo") {
            h +=
              '<div class="bar"><input id="nt" placeholder="Add a to-do for ' +
              MN[V.m - 1] +
              '" style="flex:1"><button class="btn" id="at">Add</button></div>';
            if (!M.todos.length)
              h +=
                '<p class="muted">Nothing yet. Add your first one above.</p>';
            M.todos.forEach(function (t) {
              h +=
                '<div class="todo' +
                (t.d ? " done" : "") +
                '"><input type="checkbox" data-t2="' +
                t.id +
                '"' +
                (t.d ? " checked" : "") +
                '><span style="flex:1">' +
                esc(t.t) +
                '</span><button data-dt="' +
                t.id +
                '" aria-label="Delete" style="background:none;border:0">✕</button></div>';
            });
          }
          if (tab === "graph") {
            var w = Math.max(st.daily.length * 18 + 30, 300),
              g =
                '<svg viewBox="0 0 ' +
                w +
                ' 140" width="100%" style="max-width:' +
                w +
                'px" role="img" aria-label="Daily habit completion">';
            [0, 50, 100].forEach(function (v) {
              var y = 110 - v;
              g +=
                '<line x1="24" x2="' +
                w +
                '" y1="' +
                y +
                '" y2="' +
                y +
                '" stroke="var(--line)"/><text x="0" y="' +
                (y + 3) +
                '">' +
                v +
                "</text>";
            });
            st.daily.forEach(function (p, i) {
              g +=
                '<rect x="' +
                (28 + i * 18) +
                '" y="' +
                (110 - p) +
                '" width="13" height="' +
                p +
                '" rx="3" fill="var(--pink)"/><text x="' +
                (28 + i * 18) +
                '" y="124">' +
                (i + 1) +
                "</text>";
            });
            g += "</svg>";
            h +=
              '<p><b>Daily completion (% of habits checked)</b></p><div class="wrap">' +
              g +
              "</div><p><b>Each habit this month"+(st.elapsed === 0 ? " (not started)" : st.elapsed < st.d ? " (through day "+st.elapsed+")" : "")+"</b></p>";
            st.per.forEach(function (x) {
              h +=
                '<div style="margin:8px 0">' +
                esc(x.name) +
                ' <span class="muted">' +
                x.p +
                '% · '+x.done+'/'+x.total+' days</span><div class="pbar"><div style="width:' +
                x.p +
                '%;background:var(--sage)"></div></div></div>';
            });
            var ks = Object.keys(S.months).sort();
            if (ks.length > 1) {
              h += "<p><b>Your months over time</b></p>";
              ks.forEach(function (k) {
                var p = k.split("-"),
                  s = stats(+p[0], +p[1]);
                h +=
                  '<div style="margin:6px 0">' +
                  MN[p[1] - 1] +
                  " " +
                  p[0] +
                  ' <span class="muted">' +
                  s.pct +
                  '%</span><div class="pbar"><div style="width:' +
                  s.pct +
                  '%;background:var(--lilac)"></div></div></div>';
              });
            }
          }
          $("#body").innerHTML = h;
          $("#mm").onchange = function () {
            V.m = +this.value;
            board();
          };
          $("#yy").onchange = function () {
            var v = +this.value;
            if (v > 1900 && v < 3000) {
              V.y = v;
              board();
            }
          };
          document.querySelectorAll(".tabs button").forEach(function (b) {
            b.onclick = function () {
              tab = b.dataset.t;
              board();
            };
          });
          document.querySelectorAll("[data-move]").forEach(function (b) {
            b.onclick = function () {
              var index = M.habits.findIndex(function (habit) {
                return habit.id === b.dataset.move;
              });
              var target = index + Number(b.dataset.direction);
              if (index < 0 || target < 0 || target >= M.habits.length) return;
              var moved = M.habits.splice(index, 1)[0];
              M.habits.splice(target, 0, moved);
              save();
              board();
            };
          });
          document.querySelectorAll("[data-h]").forEach(function (b) {
            b.onclick = function () {
              var id = b.dataset.h,
                d = +b.dataset.d,
                a = (M.checks[id] = M.checks[id] || []),
                i = a.indexOf(d),
                wasOff = i === -1;
              i > -1 ? a.splice(i, 1) : a.push(d);
              save();
              if (wasOff) {
                markProdDay(dstr());
                checkLevelUp();
                var st = streakFor(a, V.y, V.m);
                var msg = "+10 XP";
                if (st === 3) msg = "+10 XP · 🌱 3-day streak!";
                if (st === 7) msg = "+40 XP · ⭐ Week warrior!";
                if (st === 14) msg = "+60 XP · 🔥 On fire!";
                if (st === 21) msg = "+90 XP · 👑 Legend!";
                var toast = document.createElement("div");
                toast.textContent = msg;
                toast.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--pink);color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99;box-shadow:0 6px 20px rgba(33,150,243,0.35);animation:pop 0.35s ease";
                document.body.appendChild(toast);
                setTimeout(function(){ toast.remove(); }, 1600);
              }
              board();
            };
          });
          document.querySelectorAll("[data-r]").forEach(function (b) {
            b.onchange = function () {
              M.habits.filter(function (x) {
                return x.id === b.dataset.r;
              })[0].name = b.value;
              save();
            };
          });
          document.querySelectorAll("[data-del]").forEach(function (b) {
            b.onclick = function () {
              if (confirm("Remove this habit from " + MN[V.m - 1] + "?")) {
                M.habits = M.habits.filter(function (x) {
                  return x.id !== b.dataset.del;
                });
                save();
                board();
              }
            };
          });
          if ($("#ah"))
            $("#ah").onclick = function () {
              var v = $("#nh").value.trim();
              if (v) {
                M.habits.push({ id: uid(), name: v });
                save();
                board();
              }
            };
          if ($("#at")) {
            var add = function () {
              var v = $("#nt").value.trim();
              if (v) {
                M.todos.push({ id: uid(), t: v, d: false });
                save();
                board();
              }
            };
            $("#at").onclick = add;
            $("#nt").onkeydown = function (e) {
              if (e.key === "Enter") add();
            };
          }
          document.querySelectorAll("[data-t2]").forEach(function (b) {
            b.onchange = function () {
              var t = M.todos.filter(function (x) {
                return x.id === b.dataset.t2;
              })[0];
              t.d = b.checked;
              save();
              board();
            };
          });
          document.querySelectorAll("[data-dt]").forEach(function (b) {
            b.onclick = function () {
              M.todos = M.todos.filter(function (x) {
                return x.id !== b.dataset.dt;
              });
              save();
              board();
            };
          });
        }
        function norm() {
          S.journal = S.journal || [];
          S.months = S.months || {};
          S.food = S.food || {};
          S.tasks = S.tasks || [];
          S.focus = S.focus || {};
          S.pomo = S.pomo || {};
          S.wonder = S.wonder || { claimed: [] };
          S.rewards = S.rewards || [];
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          S.prints = S.prints || [];
          S.wg = S.wg || 8;
          S.links = S.links || {};
          S.links.tv = S.links.tv || [];
          S.links.radio = S.links.radio || [];
          S.main = S.main || {};
          S.mf = S.mf || {};
          S.plans = S.plans || {};
          S.money = S.money || {};
          S.money.tx = S.money.tx || [];
          S.money.cur = S.money.cur || "$";
          S.money.bud = S.money.bud || {};
          S.money.catBud = S.money.catBud || {};
          S.mf.list = S.mf.list || [];
          S.mf.mine = S.mf.mine || [];
          S.mf.pulls = S.mf.pulls || {};
          S.mf.days = S.mf.days || {};
          if (!S.mig1) migrate();
        }
        function migrate() {
          Object.keys(S.months).forEach(function (k) {
            var M = S.months[k];
            M.habits = M.habits.filter(function (h) {
              if (!/^drink water$/i.test(h.name.trim())) return true;
              (M.checks[h.id] || []).forEach(function (d) {
                var D = fd(k + "-" + p2(d));
                D.water = Math.max(D.water, S.wg);
              });
              delete M.checks[h.id];
              return false;
            });
          });
          S.mig1 = 1;
          save();
        }
        function p2(n) {
          return n < 10 ? "0" + n : "" + n;
        }
        function dstr(d) {
          d = d || new Date();
          return (
            d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
          );
        }
        var FD = dstr(),
          FT = "today",
          FR = 7,
          SL = ["Breakfast", "Lunch", "Dinner", "Snack"];
        function fd(k) {
          return S.food[k] || (S.food[k] = { meals: [], water: 0 });
        }
        function sum(D) {
          var t = { k: 0, p: 0, c: 0, f: 0, pk: 0 };
          (D.meals || []).forEach(function (m) {
            t.pk += m.k;
            if (m.e) {
              t.k += m.k;
              t.p += m.p;
              t.c += m.c;
              t.f += m.f;
            }
          });
          return t;
        }
        function bars(a, max, col, lab) {
          var w = a.length * 40 + 20,
            g =
              '<svg viewBox="0 0 ' +
              w +
              ' 90" width="100%" style="max-width:' +
              w +
              'px" role="img" aria-label="' +
              lab +
              '">';
          a.forEach(function (x, i) {
            var hh = max ? Math.min(52, (x.v / max) * 52) : 0;
            g +=
              '<rect x="' +
              (14 + i * 40) +
              '" y="' +
              (70 - hh) +
              '" width="26" height="' +
              hh +
              '" rx="4" fill="' +
              col +
              '"/><text x="' +
              (14 + i * 40) +
              '" y="' +
              (66 - hh) +
              '">' +
              x.v +
              '</text><text x="' +
              (14 + i * 40) +
              '" y="85">' +
              x.l +
              "</text>";
          });
          return g + "</svg>";
        }
