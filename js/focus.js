        var ct = "play";
        var T = {
          mode: "focus",
          len: { focus: 25, brk: 5 },
          left: 1500,
          run: false,
          end: 0,
          planned: 1500,
          startedAt: 0,
          armed: false,
        };
        function beep() {
          try {
            var a = new (window.AudioContext || window.webkitAudioContext)(),
              o = a.createOscillator();
            o.connect(a.destination);
            o.frequency.value = 660;
            o.start();
            o.stop(a.currentTime + 0.4);
          } catch (e) {}
        }
        function paintT() {
          var e = $("#tm");
          if (e)
            e.textContent = p2(Math.floor(T.left / 60)) + ":" + p2(T.left % 60);
        }
        function pomoDay(k) {
          S.pomo = S.pomo || {};
          return (
            S.pomo[k] ||
            (S.pomo[k] = {
              prod: 0,
              priorities: [
                { t: "", target: 0, actual: 0, spent: 0 },
                { t: "", target: 0, actual: 0, spent: 0 },
                { t: "", target: 0, actual: 0, spent: 0 },
              ],
              tasks: [],
              breaks: ["", "", "", ""],
              notes: "",
            })
          );
        }
        function totalFocusSessions() {
          var n = 0;
          Object.keys(S.focus || {}).forEach(function (k) {
            n += S.focus[k] || 0;
          });
          return n;
        }
        function totalAllXP() {
          var td = dstr();
          var tasksDone = (S.tasks || []).filter(function (t) {
            return t.d;
          }).length;
          var tasksOnTime = (S.tasks || []).filter(function (t) {
            return t.d && t.at && (!t.due || t.at <= t.due);
          }).length;
          var habitXP = totalXP(V.y, V.m);
          var taskXP = tasksDone * 25 + tasksOnTime * 15;
          var focusXP = totalFocusSessions() * 15;
          return habitXP + taskXP + focusXP + questBonusXP();
        }
        var WONDER_REWARDS = [
          { id: "tea1", name: "First pour", emoji: "🍵", xp: 50, desc: "A warm cup for showing up." },
          { id: "tea2", name: "Honey swirl", emoji: "🍯", xp: 120, desc: "Sweet progress." },
          { id: "tea3", name: "Porcelain pot", emoji: "🫖", xp: 200, desc: "Steady rituals." },
          { id: "tea4", name: "Garden leaf", emoji: "🍃", xp: 320, desc: "Growth you can taste." },
          { id: "tea5", name: "Moon brew", emoji: "🌙", xp: 450, desc: "Late-night focus magic." },
          { id: "tea6", name: "Wonder key", emoji: "🔑", xp: 600, desc: "Unlock the next chapter." },
          { id: "tea7", name: "Crystal sugar", emoji: "💎", xp: 800, desc: "Clarity earned." },
          { id: "tea8", name: "Queen's blend", emoji: "👑", xp: 1000, desc: "Master of the teapot." },
        ];
        setInterval(function () {
          if (!T.run) return;
          T.left = Math.max(0, Math.round((T.end - Date.now()) / 1000));
          if (T.left <= 0) {
            T.run = false;
            var finishedFocus =
              T.mode === "focus" &&
              T.armed &&
              T.planned > 0 &&
              T.startedAt > 0 &&
              Date.now() - T.startedAt >= T.planned * 1000 - 2000;
            if (finishedFocus) {
              var k = dstr();
              S.focus[k] = (S.focus[k] || 0) + 1;
              var mins = Math.round(T.planned / 60);
              var nowT = new Date();
              var hh = p2(nowT.getHours()) + ":" + p2(nowT.getMinutes());
              var startT = new Date(T.startedAt);
              var sh =
                p2(startT.getHours()) + ":" + p2(startT.getMinutes());
              S.prints = S.prints || [];
              S.prints.push({
                id: uid(),
                date: k,
                text:
                  "⏱ Pomodoro finished · " +
                  mins +
                  " min (" +
                  sh +
                  "–" +
                  hh +
                  ")",
                kind: "pomo",
              });
              var P = pomoDay(k);
              P.tasks.push({
                start: sh,
                end: hh,
                done: true,
                text: "Pomodoro · " + mins + " min",
              });
              S.pomo[k] = P;
              save();
              var toast = document.createElement("div");
              markProdDay(k);
              checkLevelUp();
              updateXpChip();
              toast.textContent =
                "+15 XP · Pomodoro complete · saved to calendar ⏱";
              toast.style.cssText =
                "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--pink);color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99;box-shadow:0 6px 20px rgba(0,0,0,0.2);animation:pop 0.35s ease";
              document.body.appendChild(toast);
              setTimeout(function () {
                toast.remove();
              }, 1800);
            }
            T.armed = false;
            T.startedAt = 0;
            T.mode = T.mode === "focus" ? "brk" : "focus";
            T.left = T.len[T.mode] * 60;
            T.planned = T.left;
            beep();
            if ($("#tm")) computer();
          }
          paintT();
        }, 500);
        function daysUntil(due, td) {
          if (!due) return null;
          var a = new Date(td + "T12:00:00");
          var b = new Date(due + "T12:00:00");
          return Math.round((b - a) / 86400000);
        }
        function fmtHM(ms) {
          ms = Math.max(0, ms || 0);
          var m = Math.floor(ms / 60000);
          var h = Math.floor(m / 60);
          m = m % 60;
          return h + "h " + m + "m";
        }
