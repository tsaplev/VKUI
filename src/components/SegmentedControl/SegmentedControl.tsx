import * as React from "react";
import { getClassName } from "../../helpers/getClassName";
import { usePlatform } from "../../hooks/usePlatform";
import { classNames } from "../../lib/classNames";
import { SegmentedControlButton } from "./SegmentedControlButton/SegmentedControlButton";
import "./SegmentedControl.css";

interface SegmentedControlOptionInterface {
  label: string | number;
  value: string | number;
}

const defaultOption: SegmentedControlOptionInterface = { label: "", value: "" };

export interface SegmentedControlProps
  extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  options: SegmentedControlOptionInterface[];
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  name,
  options = [defaultOption],
  children,
  ...restProps
}) => {
  const [activeOption, updateActiveOption] =
    React.useState<SegmentedControlOptionInterface>(options[0]);
  const platform = usePlatform();

  return (
    <div
      vkuiClass={classNames(getClassName("SegmentedControl", platform))}
      {...restProps}
    >
      <input type="hidden" name={name} value={activeOption?.value} />
      <div vkuiClass={classNames("SegmentedControl__slider")} />
      <div vkuiClass={classNames("SegmentedControl__in")}>
        {options.map((option, idx) => (
          <SegmentedControlButton
            key={`${option.value}${idx}`}
            active={activeOption?.value === option.value}
            onClick={() => updateActiveOption(option)}
          >
            {option.label}
          </SegmentedControlButton>
        ))}
      </div>
    </div>
  );
};
