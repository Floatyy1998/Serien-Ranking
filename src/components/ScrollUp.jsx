import React from "react";

const ScrollUp = () => {

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  return (
    <p className="scrollen">
      <i
        title="Scrolle zum Anfang"
        onClick={scrollTop}
        className="arrow up"
      ></i>
    </p>
  );
};
export default ScrollUp;
