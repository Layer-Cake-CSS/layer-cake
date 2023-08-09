import { style } from "@layer-cake/core";

export default function Web() {
  return (
    <div
      className={style({
        backgroundColor: "red",
        color: "white",
      })}
    >
      <h1>Foo</h1>
    </div>
  );
}
