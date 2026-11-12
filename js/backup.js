        function backup() {
          $("#body").innerHTML =
            '<h2>💾 backup</h2><p class="muted">Your data stays on this device. Copy the text below to move it to another device, then paste it there and restore.</p><textarea id="bt" style="min-height:160px">' +
            esc(JSON.stringify(S)) +
            '</textarea><div class="bar" style="margin-top:10px"><button class="btn" id="cp">Copy</button><button class="btn ghost" id="rs">Restore from pasted text</button></div><span class="muted" id="bm"></span>';
          $("#cp").onclick = function () {
            $("#bt").select();
            try {
              document.execCommand("copy");
              $("#bm").textContent = "Copied ✓";
            } catch (e) {
              $("#bm").textContent = "Select the text and copy it manually.";
            }
          };
          $("#rs").onclick = function () {
            try {
              var d = JSON.parse($("#bt").value);
              if (!d.journal || !d.months) throw 0;
              if (
                confirm("Replace everything on this device with this backup?")
              ) {
                S = d;
                norm();
                save();
                $("#bm").textContent = "Restored ✓";
                drawRoom();
              }
            } catch (e) {
              $("#bm").textContent = "That text isn’t a valid backup.";
            }
          };
        }
        $("#s1").onclick = function () {
          openM();
          journal();
        };
        $("#s2").onclick = function () {
          openM();
          board();
        };
        $("#s3").onclick = function () {
          openM();
          fridge();
        };
        $("#s4").onclick = function () {
          openM();
          computer();
        };
        $("#s5").onclick = function () {
          openM();
          manifest();
        };
        $("#s6").onclick = function () {
          openM();
          links("tv");
        };
        $("#s7").onclick = function () {
          openM();
          links("radio", true);
        };
        $("#s8").onclick = function () {
          openM();
          calendar();
        };
        $("#s10").onclick = function () {
          openM();
          wonder();
        };
        $("#s9").onclick = function () {
          openM();
          money();
        };
        $("#bk").onclick = function () {
          openM();
          backup();
        };
