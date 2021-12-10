import * as React from "react";
import { getClassName } from "../../helpers/getClassName";
import { usePlatform } from "../../hooks/usePlatform";
import { classNames } from "../../lib/classNames";

export const SegmentedControl: React.FC = (props) => {
  const platform = usePlatform();

  return (
    <div
      vkuiClass={classNames(getClassName("SegmentedControl", platform))}
      {...props}
    />
  );
};
