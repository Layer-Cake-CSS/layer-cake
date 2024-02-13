import { style } from "./layer-cake";

export const app = style({
  backgroundColor: "purple",
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