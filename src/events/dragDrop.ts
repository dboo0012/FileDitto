import { getCurrentWindow } from "@tauri-apps/api/window";

interface DragDropCallbacks {
  setDragActive: (active: boolean) => void;
  handleFilePaths: (paths: string[]) => Promise<void>;
}

export const setupDragDropListener = async (
  callbacks: DragDropCallbacks
): Promise<(() => void) | null> => {
  try {
    const unlisten = await getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        callbacks.setDragActive(true);
        console.log("User hovering", event.payload.position);
      } else if (event.payload.type === "drop") {
        callbacks.setDragActive(false);
        callbacks.handleFilePaths(event.payload.paths);
        console.log("User dropped", event.payload.paths);
      } else {
        callbacks.setDragActive(false);
        console.log("File drop cancelled");
      }
    });

    return unlisten;
  } catch (error) {
    console.error("Error setting up drag drop listener:", error);
    return null;
  }
};
