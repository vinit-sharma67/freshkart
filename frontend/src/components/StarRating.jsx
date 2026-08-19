import React from "react";

export default function StarRating({ value = 0, count, onRate, size = "" }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className={`stars ${size} ${onRate ? "clickable" : ""}`}>
      {stars.map((s) => (
        <span
          key={s}
          className={s <= Math.round(value) ? "star on" : "star"}
          onClick={onRate ? () => onRate(s) : undefined}
          role={onRate ? "button" : undefined}
        >★</span>
      ))}
      {count !== undefined && count > 0 && <small> ({count})</small>}
    </span>
  );
}
