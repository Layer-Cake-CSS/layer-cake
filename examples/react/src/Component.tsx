import { atoms as foo } from "@layer-cake/core";

const bg = "orange";

export const Component = () => {
  return (
    <div
      className={foo({
        backgroundColor: bg,
        color: "white",
        padding: "1rem",
        margin: () => "1rem",
      })}
    >
      I am a component
    </div>
  );
};
