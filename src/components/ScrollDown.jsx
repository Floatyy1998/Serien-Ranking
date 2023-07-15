import React from "react";

const ScrollDown = () => {
  const scrollDown = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <p className="scrollen">
      <i
        title="Scrolle zum Ende"
        onClick={scrollDown}
        className="arrow down"
      ></i>
    </p>
  );
};
export default ScrollDown;
