"use client";

import { generateUUID } from "lib/utils";
import { ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Textarea } from "ui/textarea";

type Alert = {
  title?: ReactNode;
  description: ReactNode;
};

const createContainer = () => {
  const container = document.createElement("div");
  container.id = generateUUID();
  document.body.appendChild(container);
  return container;
};

export const notify = {
  alert(alert: Alert) {
    return new Promise<void>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
        resolve();
      };
      root.render(
        <Dialog open onOpenChange={close}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{alert.title}</DialogTitle>
              <DialogDescription>{alert.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant={"ghost"} onClick={close}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
    });
  },
  confirm: (confirm: Alert) => {
    return new Promise<boolean>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
      };
      const ok = () => {
        resolve(true);
        close();
      };
      const cancel = () => {
        resolve(false);
        close();
      };
      root.render(
        <Dialog open onOpenChange={cancel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirm.title}</DialogTitle>
              <DialogDescription>{confirm.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant={"ghost"} onClick={cancel}>
                Cancel
              </Button>
              <Button variant={"secondary"} onClick={ok}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
    });
  },
  prompt: (prompt: Alert) => {
    return new Promise<string>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);

      const close = (text: string = "") => {
        root.unmount();
        container.remove();
        resolve(text);
      };
      const Component = () => {
        const [text, setText] = useState("");
        return (
          <Dialog open onOpenChange={() => close()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{prompt.title}</DialogTitle>
                <DialogDescription asChild>
                  {prompt.description}
                </DialogDescription>
                <Textarea
                  className="resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </DialogHeader>
              <DialogFooter>
                <Button variant={"ghost"} onClick={() => close()}>
                  Cancel
                </Button>
                <Button
                  disabled={!text.trim()}
                  variant={"secondary"}
                  onClick={() => close(text)}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      root.render(<Component />);
    });
  },
};
