import React from "react";
import { cx } from "./utils";

const columnClasses = {
  cards: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  catalog: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
  dashboard: "grid-cols-1 xl:grid-cols-2",
  metrics: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export default function ContentGrid({
  as: Component = "div",
  children,
  className = "",
  columns = "cards",
}) {
  return (
    <Component className={cx("grid gap-5", columnClasses[columns] || columns, className)}>
      {children}
    </Component>
  );
}
