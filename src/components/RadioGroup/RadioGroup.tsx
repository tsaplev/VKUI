import * as React from "react";
import { FormItem, FormItemProps } from "../FormItem/FormItem";
import { getClassName } from "../../helpers/getClassName";
import { usePlatform } from "../../hooks/usePlatform";
import { classNames } from "../../lib/classNames";
import "./RadioGroup.css";

export interface RadioGroupProps extends FormItemProps {
  mode?: "vertical" | "horizontal";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  mode = "vertical",
  children,
  ...restProps
}: RadioGroupProps) => {
  const platform = usePlatform();

  return (
    <FormItem
      vkuiClass={classNames(
        getClassName("RadioGroup", platform),
        `RadioGroup--${mode}`,
        {
          "RadioGroup--removable": restProps.removable,
        }
      )}
      Component="fieldset"
      {...restProps}
    >
      <div vkuiClass="RadioGroup__in">{children}</div>
    </FormItem>
  );
};
