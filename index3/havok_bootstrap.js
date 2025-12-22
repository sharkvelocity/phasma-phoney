// Enables Havok on a Babylon scene.
// Usage: await enableHavok(scene, { locateBase: "./cdn/havok/" })
(function () {
  async function enableHavok(scene, opts = {}) {
    try {
      if (typeof HavokPhysics !== "function") {
        console.warn("[Havok] UMD not found. Include ./cdn/havok/HavokPhysics_umd.js before calling enableHavok().");
        return false;
      }
      const locateBase = opts.locateBase || "./cdn/havok/";
      const hk = await HavokPhysics({
        locateFile: (file) => locateBase + file
      });
      const plugin = new BABYLON.HavokPlugin(true, hk);
      scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), plugin);
      console.log("[Havok] Enabled ✅");
      return true;
    } catch (e) {
      console.error("[Havok] Failed:", e);
      return false;
    }
  }
  window.enableHavok = enableHavok;
})();
