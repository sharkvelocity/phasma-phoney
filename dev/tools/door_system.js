export function loadDoors(scene) {
    BABYLON.SceneLoader.ImportMesh("", "./assets/models/", "door.glb", scene, (meshes, particleSystems, skeletons, animationGroups) => {
        meshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.isPickable = true;

            // Track door state
            mesh.metadata = { isOpen: false };

            // Find the baked animation
            const doorAnim = animationGroups.find(a => a.name === "DoorAction");

            if (doorAnim) {
                // Stop it at start (door closed)
                doorAnim.stop();
                doorAnim.goToFrame(0);

                // Enable click interaction
                mesh.actionManager = new BABYLON.ActionManager(scene);
                mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPickTrigger,
                        () => {
                            if (!mesh.metadata.isOpen) {
                                doorAnim.start(false, 1.0, doorAnim.from, doorAnim.to, false);
                                mesh.metadata.isOpen = true;
                            } else {
                                // Play backwards for closing
                                doorAnim.start(false, -1.0, doorAnim.to, doorAnim.from, false);
                                mesh.metadata.isOpen = false;
                            }
                        }
                    )
                );
            } else {
                console.warn("No animation named 'DoorAction' found in door.glb");
            }
        });
    });
}
