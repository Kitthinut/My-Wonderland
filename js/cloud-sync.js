(function () {
  var auth = window.firebaseAuth;
  var db = window.firebaseDb;
  var accountKey = "cozyroom_cloud_uid";
  var dirtyKey = "cozyroom_cloud_dirty";
  var syncTimer = null;
  var unsubscribe = null;
  var unsubscribeVision = null;
  var currentUser = null;
  var stateRef = null;
  var visionRef = null;
  var ready = false;
  var dirty = false;
  var authMode = "signin";

  function setStatus(message) {
    var status = document.getElementById("sync-status");
    if (status) status.textContent = message;
  }

  function showError(message) {
    var error = document.getElementById("sync-error");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function currentStateJSON() {
    return JSON.stringify(S);
  }

  function stableJSON(value) {
    if (Array.isArray(value)) {
      return "[" + value.map(stableJSON).join(",") + "]";
    }
    if (value && typeof value === "object") {
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map(function (key) {
            return JSON.stringify(key) + ":" + stableJSON(value[key]);
          })
          .join(",") +
        "}"
      );
    }
    return JSON.stringify(value);
  }

  function mergeData(remote, local, field) {
    if (Array.isArray(remote) && Array.isArray(local)) {
      if (
        ["actions", "actionDone", "breaks", "goals", "priorities"].indexOf(
          field,
        ) > -1
      ) {
        var length = Math.max(remote.length, local.length);
        var positional = [];
        for (var i = 0; i < length; i++) {
          positional[i] =
            i < remote.length && i < local.length
              ? mergeData(remote[i], local[i])
              : i < local.length
                ? local[i]
                : remote[i];
        }
        return positional;
      }
      var merged = remote.slice();
      local.forEach(function (item) {
        var id = item && typeof item === "object" ? item.id : null;
        var index = -1;
        if (id != null) {
          index = merged.findIndex(function (existing) {
            return existing && typeof existing === "object" && existing.id === id;
          });
        } else {
          var signature = JSON.stringify(item);
          index = merged.findIndex(function (existing) {
            return JSON.stringify(existing) === signature;
          });
        }
        if (index < 0) merged.push(item);
        else if (item && typeof item === "object" && !Array.isArray(item)) {
          merged[index] = mergeData(merged[index], item);
        }
      });
      return merged;
    }
    if (
      remote &&
      local &&
      typeof remote === "object" &&
      typeof local === "object" &&
      !Array.isArray(remote) &&
      !Array.isArray(local)
    ) {
      var result = {};
      Object.keys(remote).forEach(function (key) {
        result[key] = remote[key];
      });
      Object.keys(local).forEach(function (key) {
        result[key] = Object.prototype.hasOwnProperty.call(remote, key)
          ? mergeData(remote[key], local[key], key)
          : local[key];
      });
      return result;
    }
    return local === undefined ? remote : local;
  }

  function persistLocalState(state) {
    S = state;
    norm();
    mem = S;
    try {
      localStorage.setItem("cozyroom", JSON.stringify(S));
      if (Array.isArray(S.mf && S.mf.vision)) {
        VB = S.mf.vision;
        localStorage.setItem("cozyroom_vb", JSON.stringify(VB));
      }
    } catch (error) {
      console.error("Could not save synced data to local storage.", error);
    }
    updateXpChip();
    drawRoom();
    refreshOpenFeature();
  }

  function refreshOpenFeature() {
    if ($("#ov").hidden) return;
    var heading = $("#body h2");
    if (!heading) return;
    var title = heading.textContent.toLowerCase();
    if (title.indexOf("journal") > -1) journal();
    else if (title.indexOf("habit board") > -1) board();
    else if (title.indexOf("fridge") > -1) fridge();
    else if (title.indexOf("computer corner") > -1) computer();
    else if (title.indexOf("way to wonder") > -1) wonder();
    else if (title.indexOf("calendar") > -1) calendar();
    else if (title.indexOf("money book") > -1) money();
    else if (title.indexOf("manifest") > -1) manifest();
    else if (title.indexOf("tv") > -1) links("tv");
    else if (title.indexOf("radio") > -1) links("radio");
  }

  function setAccountMarker() {
    try {
      localStorage.setItem(accountKey, currentUser.uid);
      localStorage.removeItem(dirtyKey);
    } catch (error) {
      console.error("Could not save cloud sync status locally.", error);
    }
  }

  function getVisionItems() {
    return visionRef.get().then(function (snapshot) {
      return snapshot.docs
        .map(function (doc) {
          var data = doc.data();
          return { position: data.position || 0, item: data.item };
        })
        .sort(function (a, b) {
          return a.position - b.position;
        })
        .map(function (entry) {
          return entry.item;
        });
    });
  }

  function saveVisionItems(items) {
    return visionRef.get().then(function (snapshot) {
      var existing = {};
      snapshot.docs.forEach(function (doc) {
        existing[doc.id] = true;
      });
      var operations = [];
      items.forEach(function (item, index) {
        if (!item.id) item.id = uid();
        operations.push({
          id: item.id,
          data: { item: item, position: index },
        });
        delete existing[item.id];
      });
      Object.keys(existing).forEach(function (id) {
        operations.push({ id: id, remove: true });
      });
      var chain = Promise.resolve();
      for (var start = 0; start < operations.length; start += 400) {
        (function (batchOperations) {
          chain = chain.then(function () {
            var batch = db.batch();
            batchOperations.forEach(function (operation) {
              var ref = visionRef.doc(operation.id);
              if (operation.remove) batch.delete(ref);
              else batch.set(ref, operation.data);
            });
            return batch.commit();
          });
        })(operations.slice(start, start + 400));
      }
      return chain;
    });
  }

  function writeState() {
    if (!currentUser || !stateRef || !ready || !dirty) return Promise.resolve();
    var payload;
    var serialized;
    try {
      serialized = currentStateJSON();
      payload = JSON.parse(serialized);
    } catch (error) {
      setStatus("Could not prepare data for sync");
      console.error("Could not serialize app data for Firestore.", error);
      return Promise.reject(error);
    }
    var visionItems = (payload.mf && payload.mf.vision) || [];
    if (payload.mf) delete payload.mf.vision;
    return stateRef
      .set({
        state: payload,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(function () {
        return saveVisionItems(visionItems);
      })
      .then(function () {
        if (currentStateJSON() === serialized) {
          dirty = false;
          setAccountMarker();
          setStatus("Synced · " + (currentUser.email || "account"));
        } else {
          dirty = true;
          queueCloudSave();
        }
      })
      .catch(function (error) {
        var tooLarge =
          error.code === "firestore/invalid-argument" &&
          /size|large|1.?mb|1048576/i.test(error.message || "");
        setStatus(
          tooLarge
            ? "Sync failed · Firestore document limit reached"
            : "Sync failed · data is saved on this device",
        );
        console.error("Could not sync app data to Firestore.", error);
        throw error;
      });
  }

  function queueCloudSave() {
    if (!currentUser) return;
    dirty = true;
    try {
      localStorage.setItem(dirtyKey, "1");
    } catch (error) {
      console.error("Could not mark local data as pending sync.", error);
    }
    if (!ready) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      writeState().catch(function () {});
    }, 700);
  }

  function beginListening() {
    if (unsubscribe) unsubscribe();
    if (unsubscribeVision) unsubscribeVision();
    unsubscribe = stateRef.onSnapshot(
      function (snapshot) {
        if (!snapshot.exists || snapshot.metadata.hasPendingWrites) return;
        var cloudState = snapshot.data().state;
        if (!cloudState) return;
        cloudState.mf = cloudState.mf || {};
        cloudState.mf.vision = (S.mf && S.mf.vision) || [];
        if (stableJSON(cloudState) === stableJSON(S)) return;
        if (dirty) {
          persistLocalState(mergeData(cloudState, S));
          queueCloudSave();
        } else {
          persistLocalState(cloudState);
          setAccountMarker();
          setStatus("Synced · " + (currentUser.email || "account"));
        }
      },
      function (error) {
        setStatus("Sync error · data is saved on this device");
        console.error("Firestore live sync failed.", error);
      },
    );
    unsubscribeVision = visionRef.onSnapshot(
      function (snapshot) {
        if (snapshot.metadata.hasPendingWrites) return;
        var items = snapshot.docs
          .map(function (doc) {
            var data = doc.data();
            return { position: data.position || 0, item: data.item };
          })
          .sort(function (a, b) {
            return a.position - b.position;
          })
          .map(function (entry) {
            return entry.item;
          });
        if (stableJSON(items) === stableJSON((S.mf && S.mf.vision) || [])) return;
        var next = JSON.parse(currentStateJSON());
        next.mf = next.mf || {};
        next.mf.vision = dirty
          ? mergeData(items, next.mf.vision || [])
          : items;
        persistLocalState(next);
        if (dirty) queueCloudSave();
        else {
          setAccountMarker();
          setStatus("Synced · " + (currentUser.email || "account"));
        }
      },
      function (error) {
        setStatus("Vision board sync failed · other data may still sync");
        console.error("Firestore vision board sync failed.", error);
      },
    );
  }

  function syncUser(user) {
    currentUser = user;
    ready = false;
    dirty = false;
    stateRef = db.collection("users").doc(user.uid).collection("app").doc("state");
    visionRef = stateRef.collection("vision");
    setStatus("Connecting to cloud…");
    var localState = null;
    var hasLocalData = false;
    var sameAccount = false;
    try {
      hasLocalData =
        localStorage.getItem("cozyroom") !== null ||
        localStorage.getItem("cozyroom_vb") !== null;
      localState = JSON.parse(currentStateJSON());
      sameAccount = localStorage.getItem(accountKey) === user.uid;
      dirty = localStorage.getItem(dirtyKey) === "1";
    } catch (error) {
      setStatus("Could not read local data");
      console.error("Could not read local state before syncing.", error);
      return;
    }
    Promise.all([stateRef.get(), getVisionItems()])
      .then(function (results) {
        var snapshot = results[0];
        var visionItems = results[1];
        if (snapshot.exists && snapshot.data().state) {
          var cloudState = snapshot.data().state;
          cloudState.mf = cloudState.mf || {};
          cloudState.mf.vision = visionItems;
          if (hasLocalData && (!sameAccount || dirty)) {
            persistLocalState(mergeData(cloudState, localState));
            dirty = true;
          } else {
            persistLocalState(cloudState);
            dirty = false;
          }
        } else {
          if (visionItems.length) {
            S.mf.vision = mergeData(visionItems, S.mf.vision || []);
          }
          dirty = true;
        }
        ready = true;
        if (dirty) {
          writeState().catch(function () {});
        } else {
          setAccountMarker();
          setStatus("Synced · " + (user.email || "account"));
        }
        beginListening();
      })
      .catch(function (error) {
        ready = false;
        setStatus("Cloud unavailable · data is saved on this device");
        console.error("Could not load app data from Firestore.", error);
      });
  }

  function renderAuthPanel() {
    var h = '<div class="sync-panel">';
    h += "<h2>☁️ Sync your Wonderland</h2>";
    h += '<p class="muted">Use the same email and password on your phone and computer to keep your trackers and records in sync.</p>';
    if (currentUser && !currentUser.isAnonymous) {
      h += '<p class="sync-account-info">Signed in as <b>' + esc(currentUser.email || "your account") + "</b></p>";
      h += '<div class="sync-actions"><button class="btn ghost" id="sync-close">Close</button><button class="btn" id="sync-signout">Sign out</button></div>';
      $("#body").innerHTML = h + "</div>";
      $("#sync-close").onclick = closeM;
      $("#sync-signout").onclick = function () {
        auth.signOut().then(closeM).catch(function (error) {
          showError(error.message);
        });
      };
      return;
    }
    h += '<div class="tabs"><button type="button" data-auth-mode="signin" class="' +
      (authMode === "signin" ? "on" : "") +
      '">Sign in</button><button type="button" data-auth-mode="create" class="' +
      (authMode === "create" ? "on" : "") +
      '">Create account</button></div>';
    h += '<form id="sync-form"><label>Email<input id="sync-email" type="email" autocomplete="email" required></label>';
    h += '<label>Password<input id="sync-password" type="password" minlength="6" autocomplete="' +
      (authMode === "create" ? "new-password" : "current-password") +
      '" required></label>';
    h += '<p class="sync-error" id="sync-error" role="alert" hidden></p>';
    h += '<div class="sync-actions"><button class="btn" type="submit">' +
      (authMode === "create" ? "Create account" : "Sign in") +
      '</button><button class="btn ghost" type="button" id="sync-cancel">Cancel</button></div></form></div>';
    $("#body").innerHTML = h;
    document.querySelectorAll("[data-auth-mode]").forEach(function (button) {
      button.onclick = function () {
        authMode = button.dataset.authMode;
        renderAuthPanel();
      };
    });
    $("#sync-cancel").onclick = closeM;
    $("#sync-form").onsubmit = function (event) {
      event.preventDefault();
      var email = $("#sync-email").value.trim();
      var password = $("#sync-password").value;
      var operation =
        authMode === "create"
          ? auth.createUserWithEmailAndPassword(email, password)
          : auth.signInWithEmailAndPassword(email, password);
      operation
        .then(function () {
          closeM();
        })
        .catch(function (error) {
          var messages = {
            "auth/email-already-in-use": "That email already has an account. Choose Sign in.",
            "auth/invalid-credential": "Email or password is incorrect.",
            "auth/weak-password": "Choose a password with at least 6 characters.",
            "auth/invalid-email": "Enter a valid email address.",
            "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
          };
          showError(messages[error.code] || error.message);
        });
    };
  }

  function openAccountPanel() {
    openM();
    renderAuthPanel();
  }

  window.queueCloudSave = queueCloudSave;
  document.getElementById("sync-account").onclick = openAccountPanel;

  if (!auth || !db) {
    setStatus("Firebase SDK unavailable · local only");
    console.error("Firebase Auth and Firestore SDKs did not load.");
    return;
  }

  auth
    .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function () {
      auth.onAuthStateChanged(function (user) {
        clearTimeout(syncTimer);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (unsubscribeVision) {
          unsubscribeVision();
          unsubscribeVision = null;
        }
        currentUser = user;
        ready = false;
        dirty = false;
        if (user && !user.isAnonymous) {
          setStatus("Connecting to cloud…");
          syncUser(user);
        } else if (user) {
          setStatus("Sign in with email to sync across devices");
        } else {
          setStatus("Local only · sign in to sync");
        }
        if (!$("#ov").hidden && $("#body h2") && $("#body h2").textContent.indexOf("Sync your Wonderland") > -1) {
          renderAuthPanel();
        }
      });
    })
    .catch(function (error) {
      setStatus("Sign-in setup failed");
      console.error("Could not configure Firebase Auth persistence.", error);
    });

  window.addEventListener("online", function () {
    if (currentUser && !currentUser.isAnonymous) syncUser(currentUser);
  });
})();
