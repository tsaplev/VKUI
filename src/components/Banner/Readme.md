Banner

```jsx
const musicGradient = 'linear-gradient(135deg, #ADE6FF 0%, #ABE3FF 1%, #A7DCFF 3%, #A0CFFF 7%, #97BCFF 12%, #8DA4FF 19%, #8285FF 26%, #8B76FF 34%, #9C6AFF 43%, #B05FFF 52%, #C655FF 62%, #DB4CFF 71%, #EE45FF 81%, #FA41FF 91%, #FF3FFF 100%)';
const warningGradient = 'linear-gradient(90deg, #ffb73d 0%, #ffa000 100%)';

<View activePanel="banner">
  <Panel id="banner">
    <PanelHeader>Banner</PanelHeader>
    <Group
      header={<Header>Content: tint, size: regular</Header>}
    >
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="primary">Подробнее</Button>
        </React.Fragment>}
      />
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="tertiary" hasHover={false}>Подробнее</Button>
        </React.Fragment>}
      />
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="primary">Подробнее</Button>
          <Button mode="tertiary" hasHover={false}>Подробнее</Button>
        </React.Fragment>}
      />
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="tertiary" hasHover={false}>Подробнее</Button>
          <Button mode="primary">Подробнее</Button>
        </React.Fragment>}
      />
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="tertiary" hasHover={false}>Подробнее</Button>
          <Button mode="tertiary" hasHover={false}>Подробнее</Button>
        </React.Fragment>}
      />
      <Banner
        before={<Avatar size={96} mode="image" src="https://sun9-63.userapi.com/yOEQYPHrNHjZEoanbqPb65HPl5iojmiLgLzfGA/W3geVMMt8TI.jpg" />}
        header="Баста в Ледовом"
        subheader="Большой концерт"
        asideMode="dismiss"
        actions={<React.Fragment>
          <Button mode="primary">Подробнее</Button>
          <Button mode="primary">Подробнее</Button>
        </React.Fragment>}
      />
    </Group>
  </Panel>
</View>
```
