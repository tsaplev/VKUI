Помогает сгруппировать несколько `Radio`, расположив их по горизонтали или вертикали.

```jsx
<View activePanel="panel">
  <Panel id="panel">
    <PanelHeader>RadioGroup</PanelHeader>
    <Group>
      <RadioGroup top="Выберите посадку">
        <Radio name="fit" value="1">
          Classic
        </Radio>
        <Radio name="fit" value="2">
          Regular
        </Radio>
        <Radio name="fit" value="3">
          Slim
        </Radio>
      </RadioGroup>
      <RadioGroup mode="horizontal" top="Выберите размер">
        <Radio name="size" value="s">
          S
        </Radio>
        <Radio name="size" value="m">
          M
        </Radio>
        <Radio name="size" value="l">
          L
        </Radio>
      </RadioGroup>
    </Group>
  </Panel>
</View>
```
