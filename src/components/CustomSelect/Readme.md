Делает из [SelectMimicry](#!/SelectMimicry) селект с выпадающим списком

```jsx
const users = getRandomUsers(10);
<View activePanel="select">
  <Panel id="select">
    <PanelHeader>
      CustomSelect
    </PanelHeader>
    <Group>
      <FormItem top="Администратор">
        <Select
          placeholder="Не выбран"
          value={users[0].id}
          options={users.map(user => ({ label: user.name, value: user.id, avatar: user.photo_100 }))}
          renderOption={({ option, ...restProps }) => (
            <CustomSelectOption {...restProps} before={<Avatar size={24} src={option.avatar} />} />
          )}
        />
      </FormItem>
    </Group>
  </Panel>
</View>
```
