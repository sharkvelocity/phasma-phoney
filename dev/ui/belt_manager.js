// File: assets/dev/ui/belt_manager.js
(function () {
  "use strict";
  if (window.__PP_BELT_V4__) return;
  window.__PP_BELT_V4__ = true;

  const PP = (window.PP = window.PP || {});
  PP.belt = PP.belt || {};

  /* ============================= Config ============================= */
  const SLOT_COUNT = 4; // 0..2 user items, 3 is reserved lighter
  const LIGHTER_ID = "lighter";
  const ICON = (id) => `./assets/icons/${id}.png`;

  /* ============================== State ============================= */
  const S = {
    slots: [
      null, // slot 0 -> UI "1"
      null, // slot 1 -> UI "2"
      null, // slot 2 -> UI "3"
      { id: LIGHTER_ID, name: "lighter", icon: ICON(LIGHTER_ID), qty: 1, readonly: true }, // slot 3 -> "4"
    ],
    active: 0,
    el: null,
    mounted: false,
  };

  /* ============================ Utilities =========================== */
  const qs = (id) => document.getElementById(id);
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  // If #belt exists before start, keep it hidden so it never flashes on the title screen.
  (function hideIfPresent() {
    const el = qs("belt");
    if (el) el.style.display = "none";
  })();

  function slotLabel(item) {
    if (!item) return "Empty";
    const base = item.name || item.id;
    if (typeof item.qty === "number" && item.qty >= 0 && !item.readonly) return `${base}\n(${item.qty})`;
    return base;
  }

  function buildSlot(idx, item) {
    const wrap = document.createElement("div");
    wrap.className = "slot" + (idx === S.active ? " active" : "");
    wrap.dataset.idx = String(idx);

    if (item && item.icon) {
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = item.name || item.id;
      img.className = "item-icon";
      wrap.appendChild(img);
    }

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = slotLabel(item);
    wrap.appendChild(label);

    if (!item?.readonly) {
      wrap.addEventListener("click", () => selectSlot(idx));
    }

    return wrap;
  }

  function renderBelt() {
    if (!S.el) S.el = qs("belt");
    if (!S.el) return;

    // Create/update slots without replacing the container (prevents icon “leaks”).
    const need = SLOT_COUNT;
    const have = S.el.children.length;

    for (let i = have; i < need; i++) S.el.appendChild(buildSlot(i, S.slots[i]));
    for (let i = have - 1; i >= need; i--) S.el.removeChild(S.el.children[i]);

    for (let i = 0; i < need; i++) {
      const node = S.el.children[i];
      const item = S.slots[i];

      node.classList.toggle("active", i === S.active);

      let img = node.querySelector("img.item-icon");
      if (item && item.icon) {
        if (!img) {
          img = document.createElement("img");
          img.className = "item-icon";
          node.insertBefore(img, node.firstChild);
        }
        if (img.getAttribute("src") !== item.icon) {
          img.src = item.icon;
          img.alt = item.name || item.id || "";
        }
      } else if (img) {
        img.remove();
      }

      const label =
        node.querySelector(".label") ||
        (function () {
          const d = document.createElement("div");
          d.className = "label";
          node.appendChild(d);
          return d;
        })();
      const txt = slotLabel(item);
      if (label.textContent !== txt) label.textContent = txt;
    }
  }

  function selectSlot(idx) {
    if (idx < 0 || idx >= SLOT_COUNT) return;
    if (S.active === idx) return;

    const prev = S.slots[S.active];
    if (prev && !prev.readonly) emit("pp:tool:unequip", { id: prev.id, slot: S.active });

    S.active = idx;
    renderBelt();

    const cur = S.slots[idx];
    if (cur && !cur.readonly) {
      emit("pp:belt:select", { slot: idx, id: cur.id });
      emit("pp:tool:equip", { id: cur.id, slot: idx });
    }
  }

  /* ============================ Public API ========================== */
  PP.belt.getActiveIndex = () => S.active;
  PP.belt.getActiveItem = () => S.slots[S.active];
  PP.belt.getSlots = () => S.slots.slice();
  PP.belt.setSlot = (idx, item) => {
    S.slots[idx] = item || null;
    renderBelt();
  };
  PP.belt.clearSlot = (idx) => {
    S.slots[idx] = null;
    renderBelt();
  };
  PP.belt.consumeActive = () => {
    const it = S.slots[S.active];
    if (!it || it.readonly) return;
    if (typeof it.qty === "number") {
      it.qty = Math.max(0, it.qty - 1);
      if (it.qty === 0) S.slots[S.active] = null;
      renderBelt();
    }
  };

  // Full replace of belt contents from inventory system (first 3 only).
  PP.belt.applyLoadout = (items /* array length 3 */) => {
    for (let i = 0; i < 3; i++) S.slots[i] = items[i] || null;
    if (!S.slots[3] || S.slots[3].id !== LIGHTER_ID) {
      S.slots[3] = { id: LIGHTER_ID, name: "lighter", icon: ICON(LIGHTER_ID), qty: 1, readonly: true };
    }
    renderBelt();
    if (S.active > 3) S.active = 0;
  };

  /* ============================ Key Bindings ======================== */
  function bindKeys() {
    window.addEventListener(
      "keydown",
      (e) => {
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

        const code = e.code || e.key;
        const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
        if (code in map) {
          e.preventDefault();
          e.stopPropagation();
          selectSlot(map[code]);
        }
      },
      true
    );
  }

  /* ============================== Mount ============================= */
  function mount() {
    if (S.mounted) return;

    S.el = qs("belt");
    if (!S.el) {
      const div = document.createElement("div");
      div.id = "belt";
      document.body.appendChild(div);
      S.el = div;
    }

    // Now we’re allowed to show the belt.
    S.el.style.display = "flex";
    S.mounted = true;

    renderBelt();
    bindKeys();
  }

  // Only mount after the game officially starts.
  window.addEventListener(
    "pp:start",
    () => {
      mount();
    },
    { once: true }
  );

  // If the start event already happened before this script loaded (rare), mount immediately.
  if (window.__PP_ALREADY_STARTED__) {
    mount();
  }
})();
