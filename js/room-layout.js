        var sc = $("#scene"),
          stg = $("#stage");
        function fit() {
          var k = sc.clientWidth / 980;
          stg.style.transform = "scale(" + k + ")";
          sc.style.setProperty("--k", k);
          sc.style.height = SH * k + "px";
          stg.style.height = SH + "px";
        }
        window.addEventListener("resize", fit);
        var BGK = "cozyroom_bg",
          bg = null,
          SH = 600,
          editing = false,
          D0 = {},
          drag = null,
          IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"],
          HD = {
            s1: { l: 18, t: 35, w: 155, h: 310 },
            s2: { l: 710, t: 55, w: 145, h: 145 },
            s3: { l: 865, t: 210, w: 100, h: 210 },
            s4: { l: 8, t: 355, w: 210, h: 145 },
            s5: { l: 600, t: 375, w: 210, h: 145 },
            s6: { l: 330, t: 245, w: 115, h: 95 },
            s7: { l: 255, t: 255, w: 95, h: 105 },
            s8: { l: 845, t: 60, w: 95, h: 120 },
            s9: { l: 670, t: 210, w: 140, h: 155 },
            s10: { l: 400, t: 480, w: 120, h: 100 },
          };
        function setBg(u) {
          bg = u;
          try {
            if (u) localStorage.setItem(BGK, u);
            else localStorage.removeItem(BGK);
          } catch (e) {
            return false;
          }
          return true;
        }
        function place(id) {
          var e = $("#" + id),
            h = (S.hs && S.hs[id]) || HD[id];
          e.style.cssText =
            "left:" +
            h.l +
            "px;top:" +
            h.t +
            "px;width:" +
            h.w +
            "px;height:" +
            h.h +
            "px;--z:1";
        }
        function mode() {
          var im = $("#bgimg");
          if (!bg) {
            sc.classList.remove("pic");
            SH = 600;
            IDS.forEach(function (id) {
              $("#" + id).setAttribute("style", D0[id]);
            });
            applyLy();
            fit();
            return;
          }
          im.onload = function () {
            SH = Math.round((980 * im.naturalHeight) / im.naturalWidth);
            sc.classList.add("pic");
            IDS.forEach(place);
            fit();
          };
          im.src = bg;
        }
        function pic() {
          $("#body").innerHTML =
            '<h2>🖼 room picture</h2><p class="muted">Choose an illustration of your room. It stays on this device only. Then drag the tap zones over your shelf, board, fridge, and computer.</p><div class="bar"><input type="file" id="pf" accept="image/*"></div><div class="bar"><button class="btn" id="pz"' +
            (bg ? "" : " disabled") +
            '>Adjust tap zones</button><button class="btn ghost" id="pr"' +
            (bg ? "" : " disabled") +
            '>Back to the drawn room</button></div><p class="muted" id="pm"></p>';
          $("#pf").onchange = function () {
            var f = this.files[0];
            if (!f) return;
            var r = new FileReader();
            r.onload = function () {
              var im = new Image();
              im.onload = function () {
                var s = Math.min(1, 1600 / im.width),
                  c = document.createElement("canvas");
                c.width = im.width * s;
                c.height = im.height * s;
                c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
                var ok = setBg(c.toDataURL("image/jpeg", 0.88));
                mode();
                $("#pm").textContent = ok
                  ? "Picture set ✓ Now tap “Adjust tap zones”."
                  : "Picture set, but this device couldn’t save it, so it may be gone after a reload.";
                $("#pz").disabled = false;
                $("#pr").disabled = false;
              };
              im.onerror = function () {
                $("#pm").textContent =
                  "That file couldn’t be read as a picture.";
              };
              im.src = r.result;
            };
            r.readAsDataURL(f);
          };
          $("#pz").onclick = function () {
            closeM();
            editing = true;
            sc.classList.add("edit");
            $("#eb").hidden = false;
          };
          $("#pr").onclick = function () {
            setBg(null);
            mode();
            closeM();
          };
        }
        $("#pb").onclick = function () {
          openM();
          pic();
        };
        function endEdit() {
          editing = false;
          sc.classList.remove("edit");
          $("#eb").hidden = true;
        }
        $("#ed1").onclick = endEdit;
        $("#ed2").onclick = function () {
          delete S.hs;
          save();
          IDS.forEach(place);
        };
        sc.addEventListener(
          "click",
          function (e) {
            if (editing) {
              e.stopPropagation();
              e.preventDefault();
            }
          },
          true,
        );
        document.addEventListener("pointerdown", function (e) {
          if (!editing) return;
          var sp = e.target.closest && e.target.closest(".spot");
          if (!sp) return;
          e.preventDefault();
          drag = {
            z: parseFloat(sp.style.getPropertyValue("--z")) || 1,
            sp: sp,
            rz: e.target.classList.contains("rz"),
            x: e.clientX,
            y: e.clientY,
            l: sp.offsetLeft,
            t: sp.offsetTop,
            w: sp.offsetWidth,
            h: sp.offsetHeight,
          };
          if (sp.setPointerCapture) sp.setPointerCapture(e.pointerId);
        });
        document.addEventListener("pointermove", function (e) {
          if (!drag) return;
          var k = sc.clientWidth / 980,
            dx = (e.clientX - drag.x) / k,
            dy = (e.clientY - drag.y) / k,
            s = drag.sp.style;
          if (drag.rz && !sc.classList.contains("pic")) {
            s.setProperty(
              "--z",
              Math.max(0.25, (drag.w * drag.z + dx) / drag.w),
            );
          } else if (drag.rz) {
            s.width = Math.max(60, drag.w + dx) + "px";
            s.height = Math.max(60, drag.h + dy) + "px";
          } else {
            s.left = Math.max(0, Math.min(980 - drag.w, drag.l + dx)) + "px";
            s.top = Math.max(0, Math.min(SH - drag.h, drag.t + dy)) + "px";
          }
        });
        document.addEventListener("pointerup", function () {
          if (!drag) return;
          var p = drag.sp;
          if (!sc.classList.contains("pic")) {
            S.ly = S.ly || {};
            S.ly[p.id] = {
              l: p.offsetLeft,
              t: p.offsetTop,
              z: parseFloat(p.style.getPropertyValue("--z")) || 1,
            };
            save();
            drag = null;
            return;
          }
          S.hs = S.hs || {};
          S.hs[p.id] = {
            l: p.offsetLeft,
            t: p.offsetTop,
            w: p.offsetWidth,
            h: p.offsetHeight,
          };
          save();
          drag = null;
        });
        IDS.forEach(function (id) {
          var e = $("#" + id),
            z = document.createElement("i");
          D0[id] = e.getAttribute("style");
          z.className = "rz";
          e.appendChild(z);
        });
        var IM = {},
          NM = {
            s1: "Bookshelf (journal)",
            s2: "Board (habits and to-do)",
            s3: "Fridge",
            s4: "Computer desk",
            s5: "Manifest corner",
            s6: "TV",
            s7: "Radio",
            s8: "Wall calendar",
            s9: "Money book",
            s10: "Way to wonder",
          };
        try {
          IM = JSON.parse(localStorage.getItem("cozyroom_im") || "{}");
        } catch (e) {}
        function imSave() {
          try {
            localStorage.setItem("cozyroom_im", JSON.stringify(IM));
            return true;
          } catch (e) {
            return false;
          }
        }
        function applyLy() {
          IDS.forEach(function (id) {
            var l = S.ly && S.ly[id];
            if (!l) return;
            var e = $("#" + id);
            e.style.left = l.l + "px";
            e.style.top = l.t + "px";
            e.style.setProperty("--z", l.z);
          });
        }
