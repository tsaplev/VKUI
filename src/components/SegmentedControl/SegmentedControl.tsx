import * as React from "react";
import { getClassName } from "../../helpers/getClassName";
import { usePlatform } from "../../hooks/usePlatform";
import { classNames } from "../../lib/classNames";
import { useIsomorphicLayoutEffect } from "../../lib/useIsomorphicLayoutEffect";
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
  const ref = React.useRef<HTMLDivElement>(null);
  const [buttonWidth, updateButtonWidth] = React.useState<number>(0);
  const [translateX, updateTranslateX] = React.useState<number>(0);
  const [activeValue, updateActiveValue] = React.useState<
    SegmentedControlOptionInterface["value"]
  >(options[0].value);
  const platform = usePlatform();

  useIsomorphicLayoutEffect(() => {
    const width = ref?.current?.getBoundingClientRect().width ?? 0;
    const length = options.length;

    if (width && length) {
      updateButtonWidth(width / length);
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    const optionIdx = options.findIndex(
      (option) => option.value === activeValue
    );

    updateTranslateX(buttonWidth * optionIdx);
  }, [buttonWidth, activeValue]);

  return (
    <div
      vkuiClass={classNames(getClassName("SegmentedControl", platform))}
      {...restProps}
    >
      <input type="hidden" name={name} value={activeValue} />
      <div ref={ref} vkuiClass={classNames("SegmentedControl__in")}>
        <div
          aria-hidden="true"
          vkuiClass={classNames("SegmentedControl__slider")}
          style={{
            width: buttonWidth ?? 0,
            transform: `translateX(${translateX ?? 0}px)`,
            WebkitTransform: `translateX(${translateX ?? 0}px)`,
          }}
        />
        {options.map(({ value, label }, idx) => (
          <SegmentedControlButton
            key={`${value}${idx}`}
            active={activeValue === value}
            onClick={() => updateActiveValue(value)}
          >
            {label}
          </SegmentedControlButton>
        ))}
      </div>
    </div>
  );
};
