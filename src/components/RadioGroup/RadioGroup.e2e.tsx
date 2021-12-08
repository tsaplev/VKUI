import { Fragment } from "react";
import { describeScreenshotFuzz } from "../../testing/e2e/utils";
import { RadioGroup } from "./RadioGroup";
import Radio from "../Radio/Radio";

describe("RadioGroup", () => {
  describeScreenshotFuzz(RadioGroup, [
    {
      mode: ["horizontal", "vertical"],
      children: [
        <Fragment key="">
          <Radio name="size" value="s">
            S
          </Radio>
          <Radio name="size" value="m">
            M
          </Radio>
          <Radio name="size" value="l">
            L
          </Radio>
        </Fragment>,
      ],
      $adaptivity: "y",
    },
    {
      mode: ["horizontal"],
      top: [
        <span key="top">
          Очень-очень длинное название для всей группы кнопок
        </span>,
      ],
      bottom: [
        <span key="bottom">
          Очень-очень длинное описание для всей группы кнопок, потому что почему
          бы и не да. Но на самом деле оно все еще недостаточно длинное, чтобы
          подойти для vkcom, поэтому попытаемся сделать его еще длиннее...
        </span>,
      ],
      removable: [undefined, true],
      children: [
        <Fragment key="">
          <Radio name="size" value="s">
            S
          </Radio>
          <Radio name="size" value="m">
            M
          </Radio>
          <Radio name="size" value="l">
            L
          </Radio>
        </Fragment>,
      ],
    },
  ]);
});
