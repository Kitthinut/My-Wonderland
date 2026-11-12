        var $ = function (s) {
          return document.querySelector(s);
        };
        var MN = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        var S = { journal: [], months: {}, view: null },
          mem = null;
        function load() {
          try {
            var r = localStorage.getItem("cozyroom");
            if (r) S = JSON.parse(r);
          } catch (e) {
            if (mem) S = mem;
          }
          try {
            var visionItems = JSON.parse(
              localStorage.getItem("cozyroom_vb") || "null",
            );
            if (Array.isArray(visionItems) && visionItems.length) {
              S.mf = S.mf || {};
              if (!Array.isArray(S.mf.vision)) S.mf.vision = visionItems;
            }
          } catch (e) {
            console.error("Could not migrate local vision board data.", e);
          }
          norm();
        }
        function save() {
          try { if (typeof updateXpChip === "function") updateXpChip(); } catch (e) {}
          mem = S;
          try {
            localStorage.setItem("cozyroom", JSON.stringify(S));
          } catch (e) {}
          if (window.queueCloudSave) window.queueCloudSave();
        }
        function esc(t) {
          return String(t).replace(/[&<>"]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
          });
        }
        function uid() {
          return Math.random().toString(36).slice(2, 9);
        }
        var now = new Date(),
          V = { y: now.getFullYear(), m: now.getMonth() + 1 },
          tab = "habits",
          cur = null;
        function key(y, m) {
          return y + "-" + (m < 10 ? "0" : "") + m;
        }
        function getM(y, m) {
          var k = key(y, m);
          if (!S.months[k]) {
            var prev = Object.keys(S.months)
              .filter(function (x) {
                return x < k;
              })
              .sort()
              .pop();
            var hs = prev
              ? S.months[prev].habits.map(function (h) {
                  return { id: uid(), name: h.name };
                })
              : [
                  { id: uid(), name: "Move my body" },
                  { id: uid(), name: "Read" },
                  { id: uid(), name: "Journal" },
                ];
            S.months[k] = { habits: hs, checks: {}, todos: [] };
          }
          return S.months[k];
        }
        function dim(y, m) {
          return new Date(y, m, 0).getDate();
        }
        function stats(y, m) {
          var M = getM(y, m),
            d = dim(y, m),
            current = new Date(),
            future = y > current.getFullYear() ||
              (y === current.getFullYear() && m > current.getMonth() + 1),
            elapsed = future
              ? 0
              : y === current.getFullYear() && m === current.getMonth() + 1
                ? current.getDate()
                : d,
            h = M.habits.length,
            tot = 0,
            daily = [],
            per = [];
          for (var i = 1; i <= elapsed; i++) {
            var c = 0;
            M.habits.forEach(function (x) {
              if ((M.checks[x.id] || []).indexOf(i) > -1) c++;
            });
            tot += c;
            daily.push(h ? Math.round((c / h) * 100) : 0);
          }
          M.habits.forEach(function (x) {
            var completed = 0,
              checks = M.checks[x.id] || [];
            for (var day = 1; day <= elapsed; day++) {
              if (checks.indexOf(day) > -1) completed++;
            }
            per.push({
              name: x.name,
              done: completed,
              total: elapsed,
              p: elapsed ? Math.round((completed / elapsed) * 100) : 0,
            });
          });
          return {
            pct: h && elapsed ? Math.round((tot / (h * elapsed)) * 100) : 0,
            daily: daily,
            per: per,
            d: d,
            elapsed: elapsed,
          };
        }
        function streakFor(checks, y, m) {
          var d = dim(y, m), list = (checks || []).slice().sort(function(a,b){return a-b;});
          var today = (y === now.getFullYear() && m === now.getMonth()+1) ? now.getDate() : d;
          var s = 0;
          for (var day = today; day >= 1; day--) {
            if (list.indexOf(day) > -1) s++;
            else break;
          }
          return s;
        }
        function totalXP(y, m) {
          var M = getM(y, m), xp = 0;
          M.habits.forEach(function(x) {
            xp += (M.checks[x.id] || []).length * 10;
            var st = streakFor(M.checks[x.id], y, m);
            if (st >= 7) xp += 30;
            if (st >= 14) xp += 50;
            if (st >= 21) xp += 80;
          });
          return xp;
        }
        function levelFromXP(xp) {
          var lvl = 1, need = 50, left = xp;
          while (left >= need) {
            left -= need;
            lvl++;
            need = 40 + lvl * 15;
          }
          return { level: lvl, xpInto: left, xpNeed: need, total: xp };
        }
        function bestStreak(y, m) {
          var M = getM(y, m), best = 0;
          M.habits.forEach(function(x) {
            var s = streakFor(M.checks[x.id], y, m);
            if (s > best) best = s;
          });
          return best;
        }
        function badgeFor(st, pct) {
          if (st >= 21) return { emoji: "👑", label: "Legend" };
          if (st >= 14) return { emoji: "🔥", label: "On fire" };
          if (st >= 7)  return { emoji: "⭐", label: "Week warrior" };
          if (st >= 3)  return { emoji: "🌱", label: "Growing" };
          if (pct >= 80) return { emoji: "💎", label: "Almost perfect" };
          if (pct >= 50) return { emoji: "✨", label: "Halfway hero" };
          return { emoji: "🌷", label: "Just starting" };
        }
        function rankFor(level) {
          if (level >= 25) return { emoji: "🌌", title: "Wonder Master" };
          if (level >= 18) return { emoji: "👑", title: "Room Sovereign" };
          if (level >= 12) return { emoji: "🗡️", title: "Focus Knight" };
          if (level >= 8) return { emoji: "🪄", title: "Habit Mage" };
          if (level >= 5) return { emoji: "🧭", title: "Quest Taker" };
          if (level >= 3) return { emoji: "🌱", title: "Sprout Scout" };
          return { emoji: "🥚", title: "New Adventurer" };
        }
        function markProdDay(date) {
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          S.game.prodDays = S.game.prodDays || {};
          S.game.prodDays[date] = true;
          // recompute streak ending today
          var streak = 0;
          var d = new Date(date + "T12:00:00");
          for (var i = 0; i < 400; i++) {
            var k = dstr(d);
            if (S.game.prodDays[k]) streak++;
            else break;
            d.setDate(d.getDate() - 1);
          }
          S.game.streak = streak;
        }
        function toastMsg(msg, bg) {
          var toast = document.createElement("div");
          toast.textContent = msg;
          toast.style.cssText =
            "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:" +
            (bg || "var(--pink)") +
            ";color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99;box-shadow:0 6px 20px rgba(0,0,0,0.2)";
          document.body.appendChild(toast);
          setTimeout(function () { toast.remove(); }, 1800);
        }
        function checkLevelUp() {
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          var lv = levelFromXP(totalAllXP());
          if (lv.level > (S.game.lastLevel || 1)) {
            var rank = rankFor(lv.level);
            toastMsg("Level up! Lv " + lv.level + " · " + rank.emoji + " " + rank.title, "var(--ink)");
            S.game.lastLevel = lv.level;
            save();
          }
        }
        function questBonusXP() {
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          var s = 0;
          Object.keys(S.game.questBonus || {}).forEach(function (k) {
            s += S.game.questBonus[k] || 0;
          });
          return s;
        }
        function dailyQuests() {
          var td = dstr();
          var focusToday = (S.focus && S.focus[td]) || 0;
          var tasksDoneToday = (S.tasks || []).filter(function (x) {
            return x.d && x.at === td;
          }).length;
          var food = S.food && S.food[td];
          var foodLogged = !!(food && (food.water || (food.slots && (food.slots.Breakfast && food.slots.Breakfast.text)) || food.mood));
          var journalToday = (S.journal || []).filter(function (e) {
            return e.date === td;
          }).length;
          var M = getM(now.getFullYear(), now.getMonth() + 1);
          var habitChecks = 0;
          (M.habits || []).forEach(function (x) {
            if ((M.checks[x.id] || []).indexOf(now.getDate()) > -1) habitChecks++;
          });
          return [
            { id: "q_pomo", name: "Finish 1 real pomodoro", need: 1, have: focusToday, bonus: 20, emoji: "⏱" },
            { id: "q_task", name: "Complete 1 task", need: 1, have: tasksDoneToday, bonus: 15, emoji: "✅" },
            { id: "q_habit", name: "Check 3 habits", need: 3, have: habitChecks, bonus: 15, emoji: "📌" },
            { id: "q_food", name: "Log food or water", need: 1, have: foodLogged ? 1 : 0, bonus: 10, emoji: "🧊" },
            { id: "q_journal", name: "Write a journal note", need: 1, have: journalToday, bonus: 10, emoji: "📚" },
          ];
        }
        function achievementsState() {
          var xp = totalAllXP() + questBonusXP();
          var lv = levelFromXP(xp).level;
          var focus = totalFocusSessions();
          var tasks = (S.tasks || []).filter(function (x) { return x.d; }).length;
          var streak = (S.game && S.game.streak) || 0;
          var list = [
            { id: "a1", emoji: "🥚", name: "First steps", ok: xp >= 10, desc: "Earn 10 XP" },
            { id: "a2", emoji: "⏱", name: "Timer tame", ok: focus >= 1, desc: "1 real pomodoro" },
            { id: "a3", emoji: "🔥", name: "On a roll", ok: focus >= 5, desc: "5 pomodoros" },
            { id: "a4", emoji: "✅", name: "Task slayer", ok: tasks >= 5, desc: "5 tasks done" },
            { id: "a5", emoji: "📅", name: "3-day streak", ok: streak >= 3, desc: "3 productive days" },
            { id: "a6", emoji: "⚡", name: "Week charge", ok: streak >= 7, desc: "7-day streak" },
            { id: "a7", emoji: "🗡️", name: "Focus Knight", ok: lv >= 8, desc: "Reach level 8" },
            { id: "a8", emoji: "👑", name: "Room royalty", ok: lv >= 15, desc: "Reach level 15" },
          ];
          return list;
        }
        function renderQuestsHTML() {
          var qs = dailyQuests();
          var h = '<div class="quest-list">';
          qs.forEach(function (q) {
            var done = q.have >= q.need;
            var claimed = S.game && S.game.questBonus && S.game.questBonus[dstr() + ":" + q.id];
            h += '<div class="quest-row'+(done?' done':'')+'">';
            h += '<div class="q-check">'+(done?'✓':'')+'</div>';
            h += '<div class="q-body"><b>'+q.emoji+' '+esc(q.name)+'</b><br><span class="muted">'+Math.min(q.have,q.need)+' / '+q.need;
            if (claimed) h += ' · claimed';
            h += '</span></div>';
            h += '<div class="q-xp">+'+q.bonus+' XP</div>';
            if (done && !claimed) {
              h += '<button class="btn" data-qclaim="'+q.id+'" data-qbonus="'+q.bonus+'">Claim</button>';
            }
            h += '</div>';
          });
          h += '</div>';
          return h;
        }
        function wireQuestClaims(reopen) {
          document.querySelectorAll("[data-qclaim]").forEach(function (b) {
            b.onclick = function () {
              var id = b.dataset.qclaim;
              var bonus = +b.dataset.qbonus || 0;
              var key = dstr() + ":" + id;
              S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
              S.game.questBonus = S.game.questBonus || {};
              if (S.game.questBonus[key]) return;
              S.game.questBonus[key] = bonus;
              markProdDay(dstr());
              save();
              toastMsg("Quest complete! +" + bonus + " XP 🎯");
              checkLevelUp();
              if (reopen) reopen();
            };
          });
        }
        function updateXpChip() {
          var el = $("#xpchip");
          if (!el) return;
          var xp = totalAllXP();
          var lv = levelFromXP(xp);
          var rank = rankFor(lv.level);
          el.textContent = rank.emoji + " Lv " + lv.level + " · " + xp + " XP";
        }

        var O =
            "stroke:#e6b99c;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round",
          C = ["#f4a9a3", "#a8d0b8", "#f9de92", "#d8c5ea", "#f7c9a0"],
          ART = {};
        function bk(x, y, w, h, c, r) {
          return (
            '<rect x="' +
            x +
            '" y="' +
            y +
            '" width="' +
            w +
            '" height="' +
            h +
            '" rx="3" fill="' +
            c +
            '" style="' +
            O +
            '"' +
            (r
              ? ' transform="rotate(' +
                r +
                " " +
                (x + w / 2) +
                " " +
                (y + h) +
                ')"'
              : "") +
            "/>"
          );
        }
        function face(cx, cy, s) {
          var e = 'fill="#6b4a42"';
          return (
            '<circle cx="' +
            (cx - 8 * s) +
            '" cy="' +
            cy +
            '" r="' +
            2.6 * s +
            '" ' +
            e +
            '/><circle cx="' +
            (cx + 8 * s) +
            '" cy="' +
            cy +
            '" r="' +
            2.6 * s +
            '" ' +
            e +
            '/><path d="M' +
            (cx - 4 * s) +
            " " +
            (cy + 5 * s) +
            "Q" +
            cx +
            " " +
            (cy + 10 * s) +
            " " +
            (cx + 4 * s) +
            " " +
            (cy + 5 * s) +
            '" fill="none" stroke="#6b4a42" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="' +
            (cx - 15 * s) +
            '" cy="' +
            (cy + 5 * s) +
            '" rx="' +
            4 * s +
            '" ry="' +
            2.6 * s +
            '" fill="#f4a9a3"/><ellipse cx="' +
            (cx + 15 * s) +
            '" cy="' +
            (cy + 5 * s) +
            '" rx="' +
            4 * s +
            '" ry="' +
            2.6 * s +
            '" fill="#f4a9a3"/>'
          );
        }
        function row(y, n, x0, sk) {
          var s = "",
            x = x0;
          for (var i = 0; i < n; i++) {
            var w = 14 + ((i * 7 + sk) % 3) * 5,
              h = 44 + ((i * 13 + sk * 5) % 26);
            s += bk(
              x,
              y - h,
              w,
              h,
              C[(i + sk) % 5],
              i === n - 1 && sk === 1 ? -10 : 0,
            );
            x += w + 4;
          }
          return s;
        }
        ART.shelf =
          '<svg viewBox="0 0 300 290" width="100%" aria-hidden="true"><rect x="8" y="6" width="284" height="278" rx="16" fill="#f1c29a" style="' +
          O +
          '"/><rect x="24" y="22" width="252" height="246" rx="8" fill="#fbe3c8" style="' +
          O +
          '"/>' +
          row(98, 6, 34, 0) +
          row(182, 5, 34, 1) +
          '<circle cx="214" cy="54" r="9" fill="#f6c78e" style="' +
          O +
          '"/><circle cx="246" cy="54" r="9" fill="#f6c78e" style="' +
          O +
          '"/><circle cx="230" cy="76" r="22" fill="#f6c78e" style="' +
          O +
          '"/>' +
          face(230, 74, 0.9) +
          '<circle cx="210" cy="140" r="14" fill="#a8d0b8" style="' +
          O +
          '"/><circle cx="232" cy="136" r="14" fill="#a8d0b8" style="' +
          O +
          '"/><circle cx="221" cy="122" r="14" fill="#a8d0b8" style="' +
          O +
          '"/><rect x="200" y="150" width="42" height="32" rx="6" fill="#f4a9a3" style="' +
          O +
          '"/>' +
          bk(40, 244, 120, 22, "#d8c5ea") +
          bk(48, 224, 104, 20, "#f9de92") +
          bk(56, 206, 90, 18, "#f4a9a3") +
          '<rect x="196" y="226" width="46" height="40" rx="10" fill="#fff8ee" style="' +
          O +
          '"/>' +
          face(219, 246, 0.8) +
          '<rect x="24" y="98" width="252" height="9" fill="#e3a67a" style="' +
          O +
          '"/><rect x="24" y="182" width="252" height="9" fill="#e3a67a" style="' +
          O +
          '"/></svg>';
        ART.fridge =
          '<svg viewBox="0 0 152 250" width="100%" aria-hidden="true"><rect x="8" y="4" width="136" height="236" rx="20" fill="#cdeadd" style="' +
          O +
          '"/><path d="M8 92H144" fill="none" style="' +
          O +
          '"/><rect x="118" y="30" width="9" height="44" rx="4.5" fill="#fff8ee" style="' +
          O +
          '"/><rect x="118" y="108" width="9" height="70" rx="4.5" fill="#fff8ee" style="' +
          O +
          '"/><rect x="26" y="26" width="46" height="38" rx="3" fill="#fff8ee" style="' +
          O +
          '" transform="rotate(-4 49 45)"/><path d="M36 40h26M36 50h18" fill="none" stroke="#f4a9a3" stroke-width="3.5" stroke-linecap="round"/><path d="M92 66c-9-8-14-14-8-19 4-3 8 0 8 3 0-3 4-6 8-3 6 5 1 11-8 19z" fill="#f4a9a3" style="' +
          O +
          '"/><circle cx="98" cy="28" r="9" fill="#f9de92" style="' +
          O +
          '"/>' +
          face(70, 150, 1.2) +
          '<rect x="26" y="238" width="22" height="10" rx="4" fill="#c98a63"/><rect x="104" y="238" width="22" height="10" rx="4" fill="#c98a63"/></svg>';
        ART.desk =
          '<svg viewBox="0 0 230 200" width="100%" aria-hidden="true"><rect x="34" y="4" width="150" height="104" rx="14" fill="#fff8ee" style="' +
          O +
          '"/><rect x="46" y="16" width="126" height="78" rx="7" fill="#d8c5ea" style="' +
          O +
          '"/><circle cx="109" cy="56" r="24" fill="#fff8ee" style="' +
          O +
          '"/><path d="M109 42v14l9 6" fill="none" stroke="#6b4a42" stroke-width="3.5" stroke-linecap="round"/><rect x="98" y="108" width="22" height="14" fill="#eab58a" style="' +
          O +
          '"/><rect x="58" y="136" width="10" height="58" fill="#e3a67a" style="' +
          O +
          '"/><rect x="200" y="136" width="10" height="58" fill="#e3a67a" style="' +
          O +
          '"/><rect x="40" y="120" width="186" height="16" rx="8" fill="#eab58a" style="' +
          O +
          '"/><rect x="74" y="111" width="70" height="9" rx="4" fill="#fff8ee" style="' +
          O +
          '"/><rect x="186" y="84" width="24" height="16" rx="2" fill="#f9de92" style="' +
          O +
          '"/><rect x="176" y="96" width="44" height="24" rx="7" fill="#fff8ee" style="' +
          O +
          '"/><rect x="4" y="96" width="32" height="62" rx="14" fill="#f4a9a3" style="' +
          O +
          '"/><ellipse cx="24" cy="160" rx="26" ry="9" fill="#d8c5ea" style="' +
          O +
          '"/><path d="M24 168v16M8 192h32" fill="none" style="' +
          O +
          '"/></svg>';
        /* room */
        function drawRoom() {
          var cols = ["--pink", "--sage", "--butter", "--lilac", "--cork"],
            h = "";
          for (var r = 0; r < 3; r++) {
            h += '<div class="row">';
            var n = 7 + (r % 2);
            for (var i = 0; i < n; i++) {
              h +=
                '<i style="height:' +
                (44 + ((i * 13 + r * 7) % 30)) +
                "px;background:var(" +
                cols[(i + r) % 5] +
                ')"></i>';
            }
            h += "</div>";
          }
          $("#shelf").innerHTML = ART.shelf;
          $(".fridge").innerHTML = ART.fridge;
          $(".desk").innerHTML = ART.desk;
          $(".mf").innerHTML = ART.mf;
          $(".tvw").innerHTML = ART.tv;
          $(".rad").innerHTML = ART.rad;
          $(".wcal").innerHTML = ART.cal;
          $(".mb").innerHTML = ART.money;
          var st = stats(V.y, V.m),
            M = getM(V.y, V.m),
            open = M.todos.filter(function (t) {
              return !t.d;
            }).length;
          $("#board").innerHTML =
            '<div class="note"><b>to-do</b>' +
            open +
            ' open</div><div class="note"><b>habits</b>' +
            st.pct +
            '% this month</div><div class="note">' +
            MN[V.m - 1] +
            " " +
            V.y +
            '</div><div class="note">you’re doing great ♡</div>';
        }
        /* modal */
        function openM() {
          $("#ov").hidden = false;
        }
        function closeM() {
          $("#ov").hidden = true;
          $("#body").innerHTML = "";
          drawRoom();
        }
        $(".x").onclick = closeM;
        $("#ov").onclick = function (e) {
          if (e.target.id === "ov") closeM();
        };
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") closeM();
        });
        /* journal */
