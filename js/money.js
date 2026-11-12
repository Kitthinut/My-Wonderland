        var MV = { y: now.getFullYear(), m: now.getMonth() + 1 },
          MCt = [
            "Income",
            "Bills",
            "Food",
            "Dining Out",
            "Transport",
            "Shopping",
            "Self care",
            "Health",
            "Fun",
            "Subscriptions",
            "Savings",
            "Debt",
            "Other",
          ];
          var MCtOut = ["Bills","Food","Dining Out","Transport","Shopping","Self care","Health","Fun","Subscriptions","Savings","Debt","Other"];
          var MCtIn = ["Income","Other"];
        function mtx(y, m) {
          var k = y + "-" + p2(m);
          return S.money.tx.filter(function (x) {
            return x.d.slice(0, 7) === k;
          });
        }
        function money() {
          S.money.catBud = S.money.catBud || {};
          var cur = S.money.cur,
            y = MV.y,
            m = MV.m,
            k = y + "-" + p2(m),
            T = mtx(y, m),
            inn = 0,
            out = 0,
            cats = {},
            catIn = {};
          T.forEach(function (x) {
            if (x.t === "in") {
              inn += x.a;
              catIn[x.c] = (catIn[x.c] || 0) + x.a;
            } else {
              out += x.a;
              cats[x.c] = (cats[x.c] || 0) + x.a;
            }
          });
          var left = inn - out;
          var cb = S.money.catBud[k] || {};
          var totalBud = 0;
          MCtOut.forEach(function (c) { totalBud += +(cb[c] || 0); });
          var f = function (n) {
            return cur + (Math.round(n * 100) / 100);
          };
          var pctSpent = totalBud > 0 ? Math.min(100, (out / totalBud) * 100) : (inn > 0 ? Math.min(100, (out / inn) * 100) : 0);

          var h = '<h2>📖 money book</h2>';
          h += '<div class="bar"><select id="ym" aria-label="Month">';
          MN.forEach(function (n, i) {
            h += '<option value="'+(i+1)+'"'+(i+1===m?' selected':'')+'>'+n+'</option>';
          });
          h += '</select><input id="yy2" type="number" value="'+y+'" style="width:90px" aria-label="Year">';
          h += '<label class="muted">currency <input id="cu" value="'+esc(cur)+'" style="width:56px"></label></div>';

          // Dashboard cards
          h += '<div class="bud-grid">';
          h += '<div class="bud-card"><small class="muted">Income</small><div class="big" style="color:var(--ink)">'+f(inn)+'</div></div>';
          h += '<div class="bud-card"><small class="muted">Spent</small><div class="big" style="color:var(--pink)">'+f(out)+'</div></div>';
          h += '<div class="bud-card"><small class="muted">Left to spend</small><div class="big">'+f(left)+'</div>';
          h += '<div class="bud-donut" style="--p:'+pctSpent+'%"><span>'+Math.round(pctSpent)+'%</span></div>';
          h += '<small class="muted">'+(totalBud ? f(out)+' of '+f(totalBud)+' budget' : 'set budgets below')+'</small></div>';
          h += '</div>';

          // Cash flow / allocation bars
          h += '<div class="bud-sec"><h3>Cash flow</h3>';
          var flow = [
            { l: "Income", v: inn, max: Math.max(inn, out, 1), col: "var(--sage)" },
            { l: "Expenses", v: out, max: Math.max(inn, out, 1), col: "var(--pink)" },
            { l: "Left", v: Math.max(0, left), max: Math.max(inn, out, 1), col: "var(--ink)" }
          ];
          flow.forEach(function (r) {
            h += '<div class="bud-bar-row"><span class="label">'+r.l+'</span><div class="pbar"><div style="width:'+(r.v/r.max*100)+'%;background:'+r.col+'"></div></div><span class="muted">'+f(r.v)+'</span></div>';
          });
          h += '</div>';

          // Budget vs Actual by category
          h += '<div class="bud-sec"><h3>Expense budget vs actual</h3>';
          h += '<p class="muted" style="font-size:0.75rem;margin:0 0 8px">Set a budget for each category. Actual fills from your transactions.</p>';
          h += '<table class="bud-table"><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Left</th></tr>';
          MCtOut.forEach(function (c) {
            var b = +(cb[c] || 0);
            var a = cats[c] || 0;
            var l = b - a;
            h += '<tr><td>'+esc(c)+'</td>';
            h += '<td><input type="number" min="0" step="1" data-cb="'+esc(c)+'" value="'+(b||'')+'" placeholder="0"></td>';
            h += '<td>'+f(a)+'</td>';
            h += '<td style="color:'+(l<0?'var(--pink)':'var(--ink)')+'">'+f(l)+'</td></tr>';
            if (b > 0) {
              h += '<tr><td colspan="4"><div class="pbar"><div style="width:'+Math.min(100,(a/b)*100)+'%;background:'+(a>b?'var(--pink)':'var(--sage)')+'"></div></div></td></tr>';
            }
          });
          h += '</table></div>';

          // Where it went
          if (out > 0) {
            h += '<div class="bud-sec"><h3>Allocation</h3>';
            Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; }).forEach(function (c) {
              h += '<div class="bud-bar-row"><span class="label">'+esc(c)+'</span><div class="pbar"><div style="width:'+(cats[c]/out*100)+'%;background:var(--lilac)"></div></div><span class="muted">'+f(cats[c])+' · '+Math.round(cats[c]/out*100)+'%</span></div>';
            });
            h += '</div>';
          }

          // Add transaction
          var now2 = dstr();
          var dd = now2.slice(0, 7) === k ? now2 : k + "-01";
          h += '<div class="bud-sec"><h3>Add transaction</h3>';
          h += '<div class="bar"><input id="xd" type="date" value="'+dd+'">';
          h += '<select id="xt"><option value="out">Spent</option><option value="in">Earned</option></select>';
          h += '<select id="xc">'+MCt.map(function(c){ return '<option>'+c+'</option>'; }).join('')+'</select>';
          h += '<input id="xa" type="number" step="0.01" min="0" placeholder="Amount" style="width:100px">';
          h += '<input id="xn" placeholder="Note" style="flex:1;min-width:100px">';
          h += '<button class="btn" id="xb">Add</button></div></div>';

          // Recent transactions
          h += '<div class="bud-sec"><h3>This month</h3>';
          if (!T.length) h += '<p class="muted">No entries yet.</p>';
          T.slice().sort(function(a,b){ return a.d < b.d ? 1 : -1; }).forEach(function (x) {
            h += '<div class="todo"><span class="muted" style="min-width:28px">'+x.d.slice(8)+'</span>';
            h += '<span style="min-width:90px">'+esc(x.c)+'</span>';
            h += '<span class="muted" style="flex:1">'+esc(x.n)+'</span>';
            h += '<b style="color:'+(x.t==='in'?'var(--ink)':'var(--pink)')+'">'+(x.t==='in'?'+':'-')+f(x.a)+'</b>';
            h += '<button data-xd="'+x.id+'" aria-label="Delete" style="background:none;border:0">✕</button></div>';
          });
          h += '</div>';

          $("#body").innerHTML = h;

          $("#ym").onchange = function () { MV.m = +this.value; money(); };
          $("#yy2").onchange = function () {
            var v = +this.value;
            if (v > 1900 && v < 3000) { MV.y = v; money(); }
          };
          $("#cu").onchange = function () {
            S.money.cur = this.value.trim() || "$";
            save();
            money();
          };
          document.querySelectorAll("[data-cb]").forEach(function (inp) {
            inp.onchange = function () {
              S.money.catBud[k] = S.money.catBud[k] || {};
              var v = +inp.value;
              if (v > 0) S.money.catBud[k][inp.dataset.cb] = v;
              else delete S.money.catBud[k][inp.dataset.cb];
              save();
              money();
            };
          });
          $("#xb").onclick = function () {
            var a = parseFloat($("#xa").value);
            if (!(a > 0) || !$("#xd").value) return;
            S.money.tx.push({
              id: uid(),
              d: $("#xd").value,
              t: $("#xt").value,
              c: $("#xc").value,
              a: a,
              n: $("#xn").value.trim(),
            });
            save();
            var p = $("#xd").value.split("-");
            MV.y = +p[0];
            MV.m = +p[1];
            money();
          };
          document.querySelectorAll("[data-xd]").forEach(function (b) {
            b.onclick = function () {
              S.money.tx = S.money.tx.filter(function (x) { return x.id !== b.dataset.xd; });
              save();
              money();
            };
          });
        }

        /* backup */
