```jsx
<View activePanel="progress">
  <Panel id="progress">
    <PanelHeader>SegmentedControl</PanelHeader>
    <Group>
      <FormItem top="Пол">
        <SegmentedControl
          options={[
            {
              label: "Мужской",
              value: "male",
            },
            {
              label: "Женский",
              value: "female",
            },
            {
              label: "Н/б",
              value: "nonbinary",
            },
          ]}
        />
      </FormItem>

      <FormItem top="Пол">
        <SliderSwitch
          options={[
            {
              name: "Мужской",
              value: "male",
            },
            {
              name: "Женский",
              value: "female",
            },
          ]}
        />
      </FormItem>
    </Group>
  </Panel>
</View>
```
