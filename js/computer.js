        function computer() {
          var td = dstr();
          var P = pomoDay(td);
          S.rewards = S.rewards || [];
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          // live time for running task timers
          S.tasks.forEach(function (tk) {
            if (tk.running && tk.timerStart) {
              tk._live = (tk.spentMs || 0) + (Date.now() - tk.timerStart);
            } else {
              tk._live = tk.spentMs || 0;
            }
          });
          var tasksDone = S.tasks.filter(function (x) { return x.d; }).length;
          var tasksOpen = S.tasks.filter(function (x) { return !x.d; }).length;
          var tasksOnTime = S.tasks.filter(function (x) {
            return x.d && x.at && (!x.due || x.at <= x.due);
          }).length;
          var focusTotal = totalFocusSessions();
          var focusToday = S.focus[td] || 0;
          var allXP = totalAllXP();
          var lv = levelFromXP(allXP);
          var bestHabitStreak = bestStreak(V.y, V.m);
          var badge = badgeFor(bestHabitStreak, stats(V.y, V.m).pct);
          var taskXP = tasksDone * 25 + tasksOnTime * 15;
          var donePct = S.tasks.length ? Math.round((tasksDone / S.tasks.length) * 100) : 0;

          var h = '<h2>🖥️ computer corner</h2>';
          h += '<div class="game-bar">';
          h += '<div class="game-lvl"><span class="game-badge">'+badge.emoji+'</span> <b>Lv '+lv.level+'</b> <span class="muted">'+badge.label+'</span></div>';
          h += '<div class="game-xp"><div class="pbar" style="flex:1"><div style="width:'+Math.min(100, Math.round(lv.xpInto/lv.xpNeed*100))+'%"></div></div>';
          h += '<span class="muted" style="font-size:0.75rem;white-space:nowrap">'+lv.xpInto+' / '+lv.xpNeed+' XP</span></div>';
          h += '<div class="game-stats">';
          h += '<span>⭐ '+allXP+' XP</span>';
          h += '<span>✅ '+tasksDone+'/'+(S.tasks.length||0)+' tasks</span>';
          h += '<span>⏱ '+focusToday+' pomo today</span>';
          h += '</div></div>';

          // progress tracker
          h += '<div class="scoreboard">';
          h += '<div class="bud-card"><small class="muted">Task progress</small><div class="big">'+donePct+'%</div>';
          h += '<div class="pbar" style="margin-top:6px"><div style="width:'+donePct+'%"></div></div></div>';
          h += '<div class="bud-card"><small class="muted">Task XP</small><div class="big">'+taskXP+'</div><small class="muted">+25 done · +15 on time</small></div>';
          h += '<div class="bud-card"><small class="muted">Focus XP</small><div class="big">'+(focusTotal*15)+'</div><small class="muted">'+focusTotal+' real finishes</small></div>';
          h += '<div class="bud-card"><small class="muted">Open tasks</small><div class="big">'+tasksOpen+'</div></div>';
          h += '</div>';

          h += '<div class="tabs">';
          [["play","Play"],["timer","Timer"],["tasks","Tasks"],["rewards","Rewards"]].forEach(function (x) {
            h += '<button data-ct="'+x[0]+'" class="'+(ct===x[0]?'on':'')+'">'+x[1]+'</button>';
          });
          h += '</div>';


          if (ct === "play") {
            var xp = totalAllXP();
            var lv = levelFromXP(xp);
            var rank = rankFor(lv.level);
            h += '<div style="text-align:center;margin:8px 0 12px">';
            h += '<div style="font-size:2.4rem">'+rank.emoji+'</div>';
            h += '<div class="rank-chip">'+rank.title+' · Level '+lv.level+'</div>';
            h += '<p class="muted" style="margin:8px 0 0">'+xp+' XP · '+(S.game && S.game.streak ? S.game.streak : 0)+'-day productive streak</p>';
            h += '</div>';
            h += '<div class="fj-sec"><h3>Daily quests</h3>';
            h += '<p class="muted" style="margin:0 0 6px">Clear quests for bonus XP. Resets every day.</p>';
            h += renderQuestsHTML();
            h += '</div>';
            h += '<div class="fj-sec"><h3>Achievements</h3><div class="ach-grid">';
            achievementsState().forEach(function (a) {
              h += '<div class="ach-card'+(a.ok?'':' off')+'"><div style="font-size:1.6rem">'+a.emoji+'</div><b>'+esc(a.name)+'</b><br><span class="muted">'+esc(a.desc)+'</span></div>';
            });
            h += '</div></div>';
            h += '<div class="fj-sec"><h3>How to earn XP</h3>';
            h += '<p class="muted" style="margin:0">⏱ Pomodoro finish +15 · ✅ Task +25 (+15 on time) · 📌 Habit check +10 · 🎯 Daily quests · 🔥 Streaks boost habits</p></div>';
          }

          if (ct === "timer") {
            h += '<div class="fj-sec" style="margin-bottom:12px">';
            h += '<h3>Timer · +15 XP only if it finishes for real</h3>';
            h += '<div class="tabs">';
            h += '<button data-tm="focus" class="'+(T.mode==="focus"?"on":"")+'">Focus</button>';
            h += '<button data-tm="brk" class="'+(T.mode==="brk"?"on":"")+'">Break</button></div>';
            h += '<div id="tm" class="clock"></div>';
            h += '<div class="bar"><button class="btn" id="ts">'+(T.run?"Pause":"Start")+'</button>';
            h += '<button class="btn ghost" id="tr">Reset</button></div>';
            h += '<div class="bar muted">Focus <input id="lf" type="number" min="1" max="120" value="'+T.len.focus+'" style="width:64px"> ';
            h += 'Break <input id="lb" type="number" min="1" max="60" value="'+T.len.brk+'" style="width:64px"></div>';
            h += '<p class="muted">Reset or switch cancels — no XP, no calendar. Only 0:00 counts.</p></div>';

            h += '<div class="fj-sec"><h3>Today\'s productivity</h3><div class="prod-scale">';
            for (var i = 0; i <= 10; i++) {
              h += '<button data-prod="'+i+'" class="'+(+P.prod===i?'on':'')+'">'+i+'</button>';
            }
            h += '</div></div>';
            h += '<div class="fj-sec"><h3>Session notes</h3>';
            h += '<textarea id="pnotes" placeholder="Notes for today…">'+esc(P.notes||'')+'</textarea></div>';
          }

          if (ct === "tasks") {
            h += '<div class="bar" style="flex-wrap:wrap">';
            h += '<input id="na" placeholder="Task title" style="flex:1;min-width:140px">';
            h += '<select id="nq"><option value="Q1">Q1 · Do First</option><option value="Q2">Q2 · Schedule</option><option value="Q3">Q3 · Delegate</option><option value="Q4">Q4 · Later</option></select>';
            h += '<input id="nd" type="date" aria-label="Due">';
            h += '<input id="ntag" placeholder="Tag" style="width:100px">';
            h += '<button class="btn" id="aa">Add task</button></div>';

            var list = S.tasks.slice().sort(function (a, b) {
              if (a.d !== b.d) return a.d ? 1 : -1;
              var da = a.due || "9999", db = b.due || "9999";
              return da > db ? 1 : da < db ? -1 : 0;
            });
            h += '<div class="task-grid">';
            list.forEach(function (tk) {
              var du = daysUntil(tk.due, td);
              var dueCls = "ok", dueTxt = "no due date";
              if (tk.d) { dueTxt = "done" + (tk.at ? " · " + tk.at : ""); dueCls = "ok"; }
              else if (du === null) { dueTxt = "no due date"; }
              else if (du < 0) { dueTxt = "⚠ Overdue by " + Math.abs(du) + " day(s)"; dueCls = "over"; }
              else if (du === 0) { dueTxt = "🔥 due today"; dueCls = "soon"; }
              else if (du <= 3) { dueTxt = "🔥 " + du + " day(s) to go"; dueCls = "soon"; }
              else { dueTxt = "📅 " + du + " days to go"; dueCls = "ok"; }
              var pri = tk.q || "Q2";
              var priL = pri === "Q1" ? "Q1 · Do First" : pri === "Q2" ? "Q2 · Schedule" : pri === "Q3" ? "Q3 · Delegate" : "Q4 · Later";
              h += '<div class="task-card'+(tk.d?' done-card':'')+'">';
              h += '<div class="t-title">'+esc(tk.t)+'</div>';
              h += '<div class="t-pri '+(pri==="Q1"?"q1":"q2")+'">'+priL+'</div>';
              h += '<div class="t-due '+dueCls+'">'+dueTxt+'</div>';
              if (tk.tag) h += '<span class="t-tag">'+esc(tk.tag)+'</span>';
              h += '<div class="t-time">'+fmtHM(tk._live)+(tk.running?' · running…':'')+'</div>';
              h += '<div class="t-acts">';
              if (!tk.d) {
                if (!tk.running) {
                  h += '<button data-tstart="'+tk.id+'">'+(tk.spentMs?'Resume':'Start')+'</button>';
                } else {
                  h += '<button class="on" data-tpause="'+tk.id+'">Pause</button>';
                }
                h += '<button data-tend="'+tk.id+'">End</button>';
                h += '<button data-tdone="'+tk.id+'">Done ✓</button>';
              } else {
                h += '<button data-tundo="'+tk.id+'">Undo</button>';
              }
              h += '<button data-dta="'+tk.id+'">✕</button>';
              h += '</div></div>';
            });
            h += '<button class="task-new" id="aa2">+ New task</button>';
            h += '</div>';
          }

          if (ct === "rewards") {
            h += '<p class="muted">Spend XP on rewards you add. Claiming uses your points (tracked as claimed rewards — XP total still shows all-time earned).</p>';
            h += '<div class="reward-form">';
            h += '<input id="rname" placeholder="Reward name" style="flex:1;min-width:140px">';
            h += '<input id="rcost" type="number" min="1" placeholder="XP cost" style="width:100px">';
            h += '<input id="remoji" placeholder="Emoji" style="width:70px" value="🎁">';
            h += '<button class="btn" id="radd">Add reward</button></div>';
            var spent = (S.rewards || []).filter(function (r) { return r.claimed; }).reduce(function (s, r) { return s + (r.cost || 0); }, 0);
            var avail = Math.max(0, allXP - spent);
            h += '<div class="scoreboard">';
            h += '<div class="bud-card"><small class="muted">Available points</small><div class="big">'+avail+'</div></div>';
            h += '<div class="bud-card"><small class="muted">Spent</small><div class="big">'+spent+'</div></div>';
            h += '<div class="bud-card"><small class="muted">All-time XP</small><div class="big">'+allXP+'</div></div>';
            h += '</div>';
            h += '<div class="wonder-grid">';
            if (!S.rewards.length) h += '<p class="muted">No rewards yet. Add one above — e.g. “Ice cream” for 50 XP.</p>';
            S.rewards.forEach(function (r) {
              var cls = "wonder-card" + (r.claimed ? " claimed" : avail >= r.cost ? "" : " locked");
              h += '<div class="'+cls+'">';
              h += '<div class="ico">'+(r.emoji||"🎁")+'</div>';
              h += '<b>'+esc(r.name)+'</b>';
              h += '<div class="cost">'+r.cost+' XP</div>';
              if (r.claimed) h += '<span class="muted">Claimed ✓</span>';
              else if (avail >= r.cost) h += '<button class="btn" data-rclaim="'+r.id+'">Claim</button>';
              else h += '<span class="muted">'+(r.cost-avail)+' XP short</span>';
              h += '<button data-rdel="'+r.id+'" style="background:none;border:0;margin-top:4px">✕</button>';
              h += '</div>';
            });
            h += '</div>';
          }

          $("#body").innerHTML = h;
          if (ct === "timer") paintT();

          document.querySelectorAll("[data-ct]").forEach(function (b) {
            b.onclick = function () { ct = b.dataset.ct; computer(); };
          });

          if (ct === "play") {
            wireQuestClaims(computer);
            updateXpChip();
          }

          if (ct === "timer") {
            document.querySelectorAll("[data-tm]").forEach(function (b) {
              b.onclick = function () {
                T.mode = b.dataset.tm;
                T.run = false;
                T.armed = false;
                T.startedAt = 0;
                T.left = T.len[T.mode] * 60;
                T.planned = T.left;
                computer();
              };
            });
            $("#ts").onclick = function () {
              if (T.run) {
                T.run = false;
              } else {
                if (T.left <= 0) T.left = T.len[T.mode] * 60;
                if (!T.armed) {
                  T.planned = T.left;
                  T.startedAt = Date.now();
                  T.armed = true;
                }
                T.end = Date.now() + T.left * 1000;
                T.run = true;
              }
              computer();
            };
            $("#tr").onclick = function () {
              T.run = false;
              T.armed = false;
              T.startedAt = 0;
              T.left = T.len[T.mode] * 60;
              T.planned = T.left;
              computer();
            };
            $("#lf").onchange = function () {
              var v = +this.value;
              if (v > 0) {
                T.len.focus = v;
                if (!T.run && T.mode === "focus") {
                  T.left = v * 60;
                  T.planned = T.left;
                }
                computer();
              }
            };
            $("#lb").onchange = function () {
              var v = +this.value;
              if (v > 0) {
                T.len.brk = v;
                if (!T.run && T.mode === "brk") {
                  T.left = v * 60;
                  T.planned = T.left;
                }
                computer();
              }
            };
            document.querySelectorAll("[data-prod]").forEach(function (b) {
              b.onclick = function () {
                P.prod = +b.dataset.prod;
                S.pomo[td] = P;
                save();
                computer();
              };
            });
            if ($("#pnotes"))
              $("#pnotes").oninput = function () {
                P.notes = this.value;
                S.pomo[td] = P;
                save();
              };
          }

          if (ct === "tasks") {
            function addTask() {
              var v = ($("#na") && $("#na").value.trim()) || "";
              if (!v) return;
              S.tasks.push({
                id: uid(),
                t: v,
                due: ($("#nd") && $("#nd").value) || "",
                q: ($("#nq") && $("#nq").value) || "Q2",
                tag: ($("#ntag") && $("#ntag").value.trim()) || "",
                note: "",
                d: false,
                at: "",
                spentMs: 0,
                running: false,
                timerStart: 0,
              });
              save();
              computer();
            }
            if ($("#aa")) $("#aa").onclick = addTask;
            if ($("#aa2")) $("#aa2").onclick = function () {
              if ($("#na")) $("#na").focus();
              else addTask();
            };
            document.querySelectorAll("[data-tstart]").forEach(function (b) {
              b.onclick = function () {
                var id = b.dataset.tstart;
                S.tasks.forEach(function (tk) {
                  if (tk.running && tk.id !== id) {
                    tk.spentMs = (tk.spentMs || 0) + (Date.now() - tk.timerStart);
                    tk.running = false;
                    tk.timerStart = 0;
                  }
                });
                var tk = S.tasks.filter(function (x) { return x.id === id; })[0];
                if (!tk || tk.d) return;
                tk.running = true;
                tk.timerStart = Date.now();
                save();
                computer();
              };
            });
            document.querySelectorAll("[data-tpause]").forEach(function (b) {
              b.onclick = function () {
                var tk = S.tasks.filter(function (x) { return x.id === b.dataset.tpause; })[0];
                if (!tk || !tk.running) return;
                tk.spentMs = (tk.spentMs || 0) + (Date.now() - tk.timerStart);
                tk.running = false;
                tk.timerStart = 0;
                save();
                computer();
              };
            });
            document.querySelectorAll("[data-tend]").forEach(function (b) {
              b.onclick = function () {
                var tk = S.tasks.filter(function (x) { return x.id === b.dataset.tend; })[0];
                if (!tk) return;
                if (tk.running) {
                  tk.spentMs = (tk.spentMs || 0) + (Date.now() - tk.timerStart);
                  tk.running = false;
                  tk.timerStart = 0;
                }
                save();
                computer();
              };
            });
            document.querySelectorAll("[data-tdone]").forEach(function (b) {
              b.onclick = function () {
                var tk = S.tasks.filter(function (x) { return x.id === b.dataset.tdone; })[0];
                if (!tk) return;
                if (tk.running) {
                  tk.spentMs = (tk.spentMs || 0) + (Date.now() - tk.timerStart);
                  tk.running = false;
                  tk.timerStart = 0;
                }
                tk.d = true;
                tk.at = td;
                save();
                var onTime = !tk.due || td <= tk.due;
                var toast = document.createElement("div");
                markProdDay(td);
                checkLevelUp();
                updateXpChip();
                toast.textContent = onTime ? "+40 XP · done on time! ⭐" : "+25 XP · task done";
                toast.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--pink);color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99";
                document.body.appendChild(toast);
                setTimeout(function () { toast.remove(); }, 1600);
                computer();
              };
            });
            document.querySelectorAll("[data-tundo]").forEach(function (b) {
              b.onclick = function () {
                var tk = S.tasks.filter(function (x) { return x.id === b.dataset.tundo; })[0];
                if (!tk) return;
                tk.d = false;
                tk.at = "";
                save();
                computer();
              };
            });
            document.querySelectorAll("[data-dta]").forEach(function (b) {
              b.onclick = function () {
                S.tasks = S.tasks.filter(function (x) { return x.id !== b.dataset.dta; });
                save();
                computer();
              };
            });
          }

          if (ct === "rewards") {
            if ($("#radd"))
              $("#radd").onclick = function () {
                var name = $("#rname").value.trim();
                var cost = +$("#rcost").value;
                if (!name || !(cost > 0)) return;
                S.rewards.push({
                  id: uid(),
                  name: name,
                  cost: cost,
                  emoji: ($("#remoji").value.trim() || "🎁"),
                  claimed: false,
                });
                save();
                computer();
              };
            document.querySelectorAll("[data-rclaim]").forEach(function (b) {
              b.onclick = function () {
                var r = S.rewards.filter(function (x) { return x.id === b.dataset.rclaim; })[0];
                if (!r || r.claimed) return;
                var spent2 = S.rewards.filter(function (x) { return x.claimed; }).reduce(function (s, x) { return s + (x.cost || 0); }, 0);
                var avail2 = Math.max(0, totalAllXP() - spent2);
                if (avail2 < r.cost) return;
                r.claimed = true;
                save();
                var toast = document.createElement("div");
                toast.textContent = "Claimed " + (r.emoji || "🎁") + " " + r.name + "!";
                toast.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99";
                document.body.appendChild(toast);
                setTimeout(function () { toast.remove(); }, 1600);
                computer();
              };
            });
            document.querySelectorAll("[data-rdel]").forEach(function (b) {
              b.onclick = function () {
                S.rewards = S.rewards.filter(function (x) { return x.id !== b.dataset.rdel; });
                save();
                computer();
              };
            });
          }
        }
