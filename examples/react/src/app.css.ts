import { style } from "@layer-cake/core";

export const app = style({
  backgroundColor: "red",
  padding: "10px",
  "&:hover": {
    backgroundColor: "blue",
  },
  "&:focus": {
    backgroundColor: "green",
  },
  "&:active": {
    backgroundColor: "yellow",
  },
})