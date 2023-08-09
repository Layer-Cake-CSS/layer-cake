import { useState } from "react";
import { style, atoms } from "@layer-cake/core";

export default function Web() {
  const [color, setColor] = useState("red");
  return (
    <div
      className={style({
        backgroundColor: color,
        color: "$white",
        borderColor: "#ff0000",
        borderWidth: "1px",
        height: "10rem",
        width: "10%",
      })}
    >
      <h1>Web</h1>
      <button
        onClick={() => {
          color === "red" ? setColor("blue") : setColor("red");
        }}
        className={atoms({
          backgroundColor: color,
          color: "white",
          padding: "1rem",
        })}
      >
        Change color
      </button>
    </div>
  );
}
