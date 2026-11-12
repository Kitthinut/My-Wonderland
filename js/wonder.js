        var wonderEditor = { open: false, id: null };
        function wonderRewards() {
          if (!Array.isArray(S.wonder.rewards)) {
            S.wonder.rewards = WONDER_REWARDS.map(function (reward) {
              return {
                id: reward.id,
                name: reward.name,
                emoji: reward.emoji,
                xp: reward.xp,
                desc: reward.desc,
              };
            });
          }
          return S.wonder.rewards;
        }
        function wonder() {
          S.wonder = S.wonder || { claimed: [] };
          S.wonder.claimed = Array.isArray(S.wonder.claimed)
            ? S.wonder.claimed
            : [];
          var rewards = wonderRewards();
          S.rewards = S.rewards || [];
          S.game = S.game || { questBonus: {}, ach: [], lastLevel: 1, prodDays: {}, streak: 0 };
          var claimed = S.wonder.claimed || [];
          var xp = totalAllXP();
          var h = '<h2>🫖 way to wonder</h2>';
          h += '<div class="teapot">🫖</div>';
          h +=
            '<p style="text-align:center;margin:0 0 12px">Pour your progress into the teapot. Reach the XP needed, then claim a wonder.</p>';
          h += '<div class="game-bar">';
          h +=
            "<div class=\"game-lvl\"><b>⭐ " +
            xp +
            ' XP</b> <span class="muted">available energy</span></div>';
          h +=
            '<div class="game-stats"><span>Claimed ' +
            claimed.length +
            " / " +
            rewards.length +
            "</span></div></div>";
          h += '<div class="wonder-toolbar"><button class="btn" id="wonder-add">+ Add wonder</button></div>';
          if (wonderEditor.open) {
            var editingReward = wonderEditor.id
              ? rewards.filter(function (reward) {
                  return reward.id === wonderEditor.id;
                })[0]
              : null;
            h += '<form class="wonder-editor" id="wonder-form">';
            h += '<h3>' + (editingReward ? "Edit wonder" : "Add a wonder") + "</h3>";
            h += '<label>Name<input id="wonder-name" maxlength="48" required value="' +
              esc(editingReward ? editingReward.name : "") +
              '" placeholder="A little treat"></label>';
            h += '<label>Emoji<input id="wonder-emoji" maxlength="8" value="' +
              esc(editingReward ? editingReward.emoji : "✨") +
              '" placeholder="✨"></label>';
            h += '<label>XP needed<input id="wonder-xp" type="number" min="1" step="1" max="1000000" required value="' +
              (editingReward ? editingReward.xp : "") +
              '" placeholder="50"></label>';
            h += '<label>Description<input id="wonder-desc" maxlength="120" value="' +
              esc(editingReward ? editingReward.desc : "") +
              '" placeholder="Something to look forward to"></label>';
            h += '<p class="muted wonder-error" id="wonder-error" role="alert" hidden></p>';
            h += '<div class="bar"><button class="btn" type="submit">Save wonder</button><button class="btn ghost" type="button" id="wonder-cancel">Cancel</button></div>';
            h += "</form>";
          }
          h += '<div class="wonder-grid">';
          rewards.forEach(function (r) {
            var isClaimed = claimed.indexOf(r.id) > -1;
            var unlocked = xp >= r.xp;
            var cls =
              "wonder-card" +
              (isClaimed ? " claimed" : unlocked ? "" : " locked");
            h += '<div class="' + cls + '">';
            h += '<button class="wonder-edit" type="button" data-wonder-edit="' +
              esc(r.id) +
              '" aria-label="Edit ' +
              esc(r.name) +
              '">✏️</button>';
            h += '<div class="ico">' + esc(r.emoji) + "</div>";
            h += "<b>" + esc(r.name) + "</b>";
            h +=
              '<div class="cost">' +
              r.xp +
              " XP</div>";
            h +=
              '<p class="muted" style="font-size:0.8rem;margin:6px 0">' +
              esc(r.desc) +
              "</p>";
            if (isClaimed) {
              h += '<span class="muted">Received ✓</span>';
            } else if (unlocked) {
              h +=
                '<button class="btn" data-claim="' +
                esc(r.id) +
                '">Claim</button>';
            } else {
              h +=
                '<span class="muted">' +
                Math.max(0, r.xp - xp) +
                " XP to go</span>";
            }
            h += "</div>";
          });
          h += "</div>";
          if (claimed.length) {
            h += '<div class="fj-sec" style="margin-top:14px"><h3>Your collection</h3><div class="bar" style="flex-wrap:wrap;gap:8px">';
            claimed.forEach(function (id) {
              var r = rewards.filter(function (x) {
                return x.id === id;
              })[0];
              if (r)
                h +=
                  '<span style="font-size:1.6rem" title="' +
                  esc(r.name) +
                  '">' +
                  esc(r.emoji) +
                  "</span>";
            });
            h += "</div></div>";
          }
          $("#body").innerHTML = h;
          var addButton = $("#wonder-add");
          addButton.onclick = function () {
            wonderEditor = { open: true, id: null };
            wonder();
          };
          document.querySelectorAll("[data-wonder-edit]").forEach(function (b) {
            b.onclick = function () {
              wonderEditor = { open: true, id: b.dataset.wonderEdit };
              wonder();
            };
          });
          var cancelButton = $("#wonder-cancel");
          if (cancelButton) {
            cancelButton.onclick = function () {
              wonderEditor = { open: false, id: null };
              wonder();
            };
          }
          var form = $("#wonder-form");
          if (form) {
            form.onsubmit = function (event) {
              event.preventDefault();
              var name = $("#wonder-name").value.trim();
              var emoji = $("#wonder-emoji").value.trim() || "✨";
              var xpValue = Number($("#wonder-xp").value);
              var desc = $("#wonder-desc").value.trim();
              var error = $("#wonder-error");
              if (!name || !Number.isInteger(xpValue) || xpValue < 1 || xpValue > 1000000) {
                error.textContent = "Enter a name and an XP amount from 1 to 1,000,000.";
                error.hidden = false;
                return;
              }
              var existing = wonderEditor.id
                ? rewards.filter(function (reward) {
                    return reward.id === wonderEditor.id;
                  })[0]
                : null;
              if (existing) {
                existing.name = name;
                existing.emoji = emoji;
                existing.xp = xpValue;
                existing.desc = desc;
              } else {
                rewards.push({
                  id: "wonder_" + uid(),
                  name: name,
                  emoji: emoji,
                  xp: xpValue,
                  desc: desc,
                });
              }
              save();
              wonderEditor = { open: false, id: null };
              wonder();
            };
          }
          document.querySelectorAll("[data-claim]").forEach(function (b) {
            b.onclick = function () {
              var id = b.dataset.claim;
              if (claimed.indexOf(id) > -1) return;
              var r = rewards.filter(function (x) {
                return x.id === id;
              })[0];
              if (!r || totalAllXP() < r.xp) return;
              S.wonder.claimed.push(id);
              save();
              var toast = document.createElement("div");
              toast.textContent = "Claimed " + r.emoji + " " + r.name + "!";
              toast.style.cssText =
                "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:20px;font-weight:700;z-index:99";
              document.body.appendChild(toast);
              setTimeout(function () {
                toast.remove();
              }, 1600);
              wonder();
            };
          });
        }
        /* tv, radio, manifest */
        function star(x, y, s) {
          return (
            '<path transform="translate(' +
            x +
            " " +
            y +
            ") scale(" +
            s +
            ')" d="M0-6L2-2 6 0 2 2 0 6-2 2-6 0-2-2z" fill="#f9de92"/>'
          );
        }
        ART.mf =
          '<svg viewBox="0 0 180 170" width="100%" aria-hidden="true"><defs><radialGradient id="cbg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d8c5ea"/></radialGradient></defs><rect x="22" y="132" width="10" height="34" fill="#f2c6a3" style="' +
          O +
          '"/><rect x="148" y="132" width="10" height="34" fill="#f2c6a3" style="' +
          O +
          '"/><rect x="10" y="118" width="160" height="16" rx="8" fill="#f2c6a3" style="' +
          O +
          '"/><ellipse cx="90" cy="112" rx="32" ry="9" fill="#f9de92" style="' +
          O +
          '"/><circle cx="90" cy="70" r="40" fill="url(#cbg)" style="' +
          O +
          '"/><path d="M66 56Q72 44 84 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
          star(102, 76, 1.3) +
          star(80, 88, 0.8) +
          '<rect x="16" y="86" width="30" height="46" rx="4" fill="#fff8ee" style="' +
          O +
          '" transform="rotate(-12 31 109)"/>' +
          star(30, 110, 1.2) +
          '<rect x="134" y="86" width="30" height="46" rx="4" fill="#fff8ee" style="' +
          O +
          '" transform="rotate(10 149 109)"/>' +
          star(150, 110, 1.2) +
          '<path d="M16 126H164L158 150Q148 158 138 150Q128 158 118 150Q108 158 98 150Q88 158 78 150Q68 158 58 150Q48 158 38 150L22 150Z" fill="#f4a9a3" style="' +
          O +
          '"/></svg>';
        ART.tv =
          '<svg viewBox="0 0 186 168" width="100%" aria-hidden="true"><path d="M93 30L68 6M93 30L118 6" fill="none" style="' +
          O +
          '"/><circle cx="68" cy="6" r="4" fill="#f9de92"/><circle cx="118" cy="6" r="4" fill="#f9de92"/><rect x="34" y="142" width="10" height="22" rx="4" fill="#f2c6a3" style="' +
          O +
          '"/><rect x="142" y="142" width="10" height="22" rx="4" fill="#f2c6a3" style="' +
          O +
          '"/><rect x="8" y="30" width="170" height="112" rx="22" fill="#f7c9c4" style="' +
          O +
          '"/><rect x="20" y="42" width="112" height="88" rx="16" fill="#cfe8f5" style="' +
          O +
          '"/><circle cx="76" cy="86" r="20" fill="#fff8ee"/><path d="M70 76L70 96L88 86Z" fill="#f4a9a3"/><circle cx="154" cy="62" r="9" fill="#fff8ee" style="' +
          O +
          '"/><circle cx="154" cy="92" r="9" fill="#fff8ee" style="' +
          O +
          '"/><path d="M146 114H162M146 121H162" fill="none" stroke="#e6b99c" stroke-width="2.5" stroke-linecap="round"/></svg>';
        ART.rad =
          '<svg viewBox="0 0 100 80" width="100%" aria-hidden="true"><path d="M70 14L88 0" fill="none" style="' +
          O +
          '"/><rect x="4" y="14" width="92" height="60" rx="14" fill="#d8c5ea" style="' +
          O +
          '"/><circle cx="34" cy="44" r="21" fill="#fff8ee" style="' +
          O +
          '"/><path d="M34 52C24 45 25 36 31 36 33 36 34 38 34 38 34 38 35 36 37 36 43 36 44 45 34 52Z" fill="#f4a9a3"/><rect x="62" y="26" width="26" height="12" rx="6" fill="#fff8ee" style="' +
          O +
          '"/><circle cx="75" cy="56" r="8" fill="#f9de92" style="' +
          O +
          '"/></svg>';
        var LF = { tv: "All", radio: "All" },
          LC = {
            tv: ["Productivity", "Self care", "Other"],
            radio: ["Feminine energy", "Focus", "Chill"],
          };
