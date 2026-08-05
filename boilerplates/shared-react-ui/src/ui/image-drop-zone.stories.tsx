import type { Story } from "@ladle/react";
import * as React from "react";
import { ImageDropZone } from "./image-drop-zone";

export default {
  title: "UI / ImageDropZone",
};

export const Default: Story = () => (
  <ImageDropZone onFiles={(files) => console.log("Files dropped:", files)} />
);

export const CustomAccept: Story = () => (
  <ImageDropZone
    accept="image/png, image/jpeg"
    onFiles={(files) => console.log("Accepted PNG/JPEG:", files)}
  />
);

export const Disabled: Story = () => <ImageDropZone disabled />;
